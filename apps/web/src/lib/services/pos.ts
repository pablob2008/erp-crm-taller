import { SupabaseClient } from '@supabase/supabase-js'
import { deliverOrder } from './work-order-details'

// ============================================================================
// Types
// ============================================================================

export interface InventoryCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  quantity: number;
  sale_price: number;
}

export interface Sale {
  id: string;
  branch_id: string;
  cash_register_id?: string | null;
  cash_movement_id?: string | null;
  work_order_id?: string | null;
  payment_method: 'cash' | 'qr' | 'card' | 'transfer';
  subtotal: number;
  discount_type: 'none' | 'fixed' | 'percentage';
  discount_value: number;
  total: number;
  status: 'completed' | 'voided';
  customer_id?: string | null;
  customer_doc_type?: string | null;
  customer_doc_number?: string | null;
  invoice_type?: string | null;
  invoice_number?: string | null;
  cae?: string | null;
  cae_expires_at?: string | null;
  afip_qr_data?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_item_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_price: number;
  created_at: string;
}

/** Client-side ticket line item (not yet persisted) */
export interface TicketItem {
  /** Temporary client-side key for React reconciliation */
  tempId: string;
  /** null for manual / ad-hoc line items */
  inventoryItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface TicketState {
  items: TicketItem[];
  paymentMethod: 'cash' | 'qr' | 'card';
  /** Populated when the ticket originates from a Deliver Order fast action */
  workOrderId?: string;
}

export interface CheckoutPayload {
  branchId: string;
  cashRegisterId?: string;
  paymentMethod: 'cash' | 'qr' | 'card';
  items: TicketItem[];
  subtotal: number;
  total: number;
  discountType?: 'none' | 'fixed' | 'percentage';
  discountValue?: number;
  workOrderId?: string;
  customerId?: string;
  /** Set by caller if known (e.g., from auth context) */
  createdBy?: string;
}

export interface CheckoutResult {
  saleId: string;
  cashMovementId: string;
  total: number;
}

export interface OrderSearchResult {
  id: string;
  order_number: string;
  balance: number;
  status: string;
  customer_name: string;
}

// ============================================================================
// Task 2.2 — fetchInventoryCatalog
// ============================================================================

/**
 * Fetches inventory items for the POS catalog.
 * Supports optional text search (name or code) and is limited to 50 results
 * for performance. Pass `search` from the catalog search bar.
 */
export async function fetchInventoryCatalog(
  supabase: SupabaseClient,
  branchId: string,
  search?: string
): Promise<InventoryCatalogItem[]> {
  let query = supabase
    .from('inventory_items')
    .select('id, code, name, description, quantity, sale_price')
    .eq('branch_id', branchId)
    .gt('quantity', 0)
    .order('name', { ascending: true })
    .limit(50);

  if (search && search.trim().length > 0) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InventoryCatalogItem[];
}

// ============================================================================
// Task 2.3 — searchOrderByNumber
// ============================================================================

/**
 * Looks up a work order by its display number (e.g. "ORD-001") within a branch.
 * Returns only fields needed by the DeliverOrderModal.
 */
export async function searchOrderByNumber(
  supabase: SupabaseClient,
  branchId: string,
  orderNumber: string
): Promise<OrderSearchResult | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(`
      id,
      order_number,
      balance,
      status,
      customers ( first_name, last_name )
    `)
    .eq('branch_id', branchId)
    .ilike('order_number', orderNumber.trim())
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .limit(1)
    .single();

  if (error) {
    // No matching row is not an error for the caller
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  const customer = data.customers as unknown as { first_name: string; last_name: string } | null;
  return {
    id: data.id,
    order_number: data.order_number,
    balance: Number(data.balance ?? 0),
    status: data.status,
    customer_name: customer
      ? `${customer.first_name} ${customer.last_name}`
      : 'Cliente desconocido',
  };
}

// ============================================================================
// Task 2.4 — checkoutSale
// ============================================================================

/**
 * Atomic checkout flow:
 * 1. INSERT into `sales`
 * 2. INSERT all `sale_items` (triggers deduct stock)
 * 3. INSERT `cash_movements` income record
 * 4. UPDATE `sales.cash_movement_id` back-link
 * 5. If work_order_id is set: call deliverOrder() to mark it as delivered
 *
 * If work_order_id is provided, customer_doc_type and customer_doc_number are
 * automatically mapped from the linked customer's `tax_id`.
 */
export async function checkoutSale(
  supabase: SupabaseClient,
  payload: CheckoutPayload
): Promise<CheckoutResult> {
  const {
    branchId,
    cashRegisterId,
    paymentMethod,
    items,
    subtotal,
    total,
    discountType = 'none',
    discountValue = 0,
    workOrderId,
    customerId,
    createdBy,
  } = payload;

  // --- Step 0: If work order, fetch customer doc info for fiscal mapping ---
  let customerDocType: string | undefined = '99';
  let customerDocNumber: string | undefined;
  let resolvedCustomerId = customerId;

  if (workOrderId) {
    const { data: orderRow } = await supabase
      .from('work_orders')
      .select('customer_id, customers ( tax_id )')
      .eq('id', workOrderId)
      .single();

    if (orderRow) {
      resolvedCustomerId = orderRow.customer_id ?? customerId;
      const cust = orderRow.customers as unknown as { tax_id?: string | null } | null;
      if (cust?.tax_id) {
        // Heuristic: if tax_id is 11+ digits treat as CUIT (80), else DNI (96)
        const digits = (cust.tax_id ?? '').replace(/\D/g, '');
        customerDocType = digits.length >= 11 ? '80' : '96';
        customerDocNumber = cust.tax_id;
      }
    }
  }

  // --- Step 1: Insert sales row ---
  const { data: saleRow, error: saleError } = await supabase
    .from('sales')
    .insert({
      branch_id: branchId,
      cash_register_id: cashRegisterId ?? null,
      work_order_id: workOrderId ?? null,
      payment_method: paymentMethod,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      total,
      status: 'completed',
      customer_id: resolvedCustomerId ?? null,
      customer_doc_type: customerDocType,
      customer_doc_number: customerDocNumber ?? null,
      created_by: createdBy ?? null,
    })
    .select('id')
    .single();

  if (saleError) throw saleError;
  const saleId = saleRow.id as string;

  // --- Step 2: Insert sale_items (trigger fires per row for stock deduction) ---
  const saleItemsPayload = items.map((item) => ({
    sale_id: saleId,
    inventory_item_id: item.inventoryItemId ?? null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    tax_rate: 21.00,
  }));

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsPayload);
  if (itemsError) throw itemsError;

  // --- Step 3: Insert cash_movements income record ---
  const isWorkOrderPayment = !!workOrderId;
  const { data: movRow, error: movError } = await supabase
    .from('cash_movements')
    .insert({
      branch_id: branchId,
      cash_register_id: cashRegisterId ?? null,
      work_order_id: workOrderId ?? null,
      type: 'income',
      category: isWorkOrderPayment ? 'work_order_payment' : 'stock_sale',
      payment_method: paymentMethod,
      gross_amount: total,
      net_amount: total,
      description: isWorkOrderPayment
        ? `Cobro y entrega de orden vía POS`
        : `Venta POS - ${items.length} ítem(s)`,
      created_by: createdBy ?? null,
    })
    .select('id')
    .single();

  if (movError) throw movError;
  const cashMovementId = movRow.id as string;

  // --- Step 4: Back-link cash_movement_id on the sale ---
  const { error: updateError } = await supabase
    .from('sales')
    .update({ cash_movement_id: cashMovementId })
    .eq('id', saleId);

  if (updateError) {
    // Non-fatal: the sale exists but lacks the backlink. Log for monitoring.
    console.warn('[POS] Could not backlink cash_movement_id on sale:', updateError.message);
  }

  // --- Step 5: Deliver work order if this was a Deliver Order checkout ---
  if (workOrderId && createdBy) {
    await deliverOrder(supabase, branchId, workOrderId, {
      mode: 'credit', // Payment was already recorded via cash_movements above
      authorId: createdBy,
      note: 'Orden cobrada y entregada desde el POS.',
    });
  }

  return { saleId, cashMovementId, total };
}

// ============================================================================
// Task 2.5 — addQuickExpense
// ============================================================================

/**
 * Registers a quick expense directly into `cash_movements`.
 * Does NOT create a `sales` record — this is a pure cash movement.
 */
export async function addQuickExpense(
  supabase: SupabaseClient,
  branchId: string,
  amount: number,
  method: 'cash' | 'qr' | 'card' | 'transfer',
  description: string,
  cashRegisterId?: string,
  createdBy?: string
): Promise<void> {
  if (amount <= 0) throw new Error('El monto del gasto debe ser mayor a cero.');
  if (!description.trim()) throw new Error('La descripción del gasto es obligatoria.');

  const { error } = await supabase.from('cash_movements').insert({
    branch_id: branchId,
    cash_register_id: cashRegisterId ?? null,
    type: 'expense',
    category: 'manual_expense',
    payment_method: method,
    gross_amount: amount,
    net_amount: amount,
    description: description.trim(),
    created_by: createdBy ?? null,
  });

  if (error) throw error;
}

// ============================================================================
// fetchSaleForPrint
// ============================================================================

/**
 * Shape returned by fetchSaleForPrint — the full persisted sale and its items,
 * ready to be passed as props to PrintableInvoice.
 */
export interface SaleForPrint {
  sale: Sale;
  items: SaleItem[];
}

/**
 * Fetches a completed sale and its line items for invoice rendering.
 * Called after checkoutSale() returns to get the persisted row with all
 * fiscal fields (cae, cae_expires_at, afip_qr_data, invoice_type, etc.)
 * that may be populated by DB-level triggers or future ARCA integration.
 */
export async function fetchSaleForPrint(
  supabase: SupabaseClient,
  saleId: string
): Promise<SaleForPrint> {
  const [saleResult, itemsResult] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single(),
    supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: true }),
  ]);

  if (saleResult.error) throw saleResult.error;
  if (itemsResult.error) throw itemsResult.error;

  return {
    sale: saleResult.data as Sale,
    items: (itemsResult.data ?? []) as SaleItem[],
  };
}

