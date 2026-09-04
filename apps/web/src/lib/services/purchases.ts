import { SupabaseClient } from '@supabase/supabase-js';
import { markItemAsPurchased } from './work-order-details';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnifiedPurchaseItem {
  id: string;
  source: 'purchase' | 'work_order_item';
  title: string;
  quantity: number;
  estimatedCost: number;
  status: string;
  supplier?: string;
  // Only for work_order_item source
  workOrderId?: string;
  workOrderCode?: string;
  // Only for purchase source
  purchaseId?: string;
  inventoryItemId?: string;
  branchId: string;
  createdAt: string;
}

export interface PurchaseKPIs {
  /** Total rows in inventory_items for this branch */
  totalInventoryItems: number;
  /** purchases (pending|ordered) + work_order_items (pending) */
  activePurchases: number;
  /** inventory_items where quantity <= min_stock */
  lowStockAlerts: number;
}

// ─── fetchUnifiedPurchases ────────────────────────────────────────────────────

/**
 * Returns a merged list of:
 *   - `purchases` rows whose status is NOT 'received' or 'cancelled'
 *   - `work_order_items` rows with status = 'pending'
 * Both filtered to the given branchId.
 */
export async function fetchUnifiedPurchases(
  supabase: SupabaseClient,
  branchId: string
): Promise<UnifiedPurchaseItem[]> {
  const [purchasesResult, itemsResult] = await Promise.all([
    supabase
      .from('purchases')
      .select('id, title, quantity, estimated_cost, actual_cost, status, supplier, inventory_item_id, branch_id, created_at')
      .eq('branch_id', branchId)
      .not('status', 'in', '(received,cancelled)')
      .order('created_at', { ascending: false }),

    supabase
      .from('work_order_items')
      .select('id, description, quantity, unit_price, status, work_order_id, created_at, work_orders!inner(id, order_number, branch_id)')
      .eq('status', 'pending')
      .eq('work_orders.branch_id', branchId)
      .order('created_at', { ascending: false }),
  ]);

  if (purchasesResult.error) throw purchasesResult.error;
  if (itemsResult.error) throw itemsResult.error;

  const purchases: UnifiedPurchaseItem[] = (purchasesResult.data ?? []).map((p) => ({
    id: p.id,
    source: 'purchase' as const,
    title: p.title ?? 'Compra sin título',
    quantity: p.quantity ?? 1,
    estimatedCost: p.estimated_cost ?? p.actual_cost ?? 0,
    status: p.status,
    supplier: p.supplier ?? undefined,
    purchaseId: p.id,
    inventoryItemId: p.inventory_item_id ?? undefined,
    branchId: p.branch_id,
    createdAt: p.created_at,
  }));

  const workOrderItems: UnifiedPurchaseItem[] = (itemsResult.data ?? []).map((i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wo = (i as any).work_orders;
    return {
      id: i.id,
      source: 'work_order_item' as const,
      title: i.description ?? 'Repuesto sin nombre',
      quantity: i.quantity ?? 1,
      estimatedCost: (i.unit_price ?? 0) * (i.quantity ?? 1),
      status: i.status,
      workOrderId: wo?.id ?? i.work_order_id,
      workOrderCode: wo?.order_number ? `#${wo.order_number}` : undefined,
      branchId: wo?.branch_id ?? branchId,
      createdAt: i.created_at,
    };
  });

  return [...purchases, ...workOrderItems];
}

// ─── fetchPurchaseKPIs ────────────────────────────────────────────────────────

/**
 * Returns three counts used by the KPI cards in InventoryPage.
 */
export async function fetchPurchaseKPIs(
  supabase: SupabaseClient,
  branchId: string
): Promise<PurchaseKPIs> {
  const [inventoryResult, activePurchasesResult, workOrderItemsResult, lowStockResult] =
    await Promise.all([
      supabase
        .from('inventory_items')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId),

      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .in('status', ['pending', 'ordered']),

      supabase
        .from('work_order_items')
        .select('id, work_orders!inner(branch_id)', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('work_orders.branch_id', branchId),

      // Fetch quantity and min_stock to count low-stock items client-side
      // (Supabase JS client cannot compare two columns server-side without an RPC)
      supabase
        .from('inventory_items')
        .select('quantity, min_stock')
        .eq('branch_id', branchId),
    ]);

  if (inventoryResult.error) throw inventoryResult.error;
  if (activePurchasesResult.error) throw activePurchasesResult.error;
  if (workOrderItemsResult.error) throw workOrderItemsResult.error;

  // Count rows where quantity <= min_stock (both must be non-null)
  const lowStockCount = lowStockResult.error
    ? 0
    : (lowStockResult.data ?? []).filter(
        (row) =>
          row.min_stock != null &&
          row.quantity != null &&
          row.quantity <= row.min_stock
      ).length;

  return {
    totalInventoryItems: inventoryResult.count ?? 0,
    activePurchases: (activePurchasesResult.count ?? 0) + (workOrderItemsResult.count ?? 0),
    lowStockAlerts: lowStockCount,
  };
}

// ─── fulfillGeneralPurchase ───────────────────────────────────────────────────

/**
 * Marks a general purchase as received, sets actual_cost, and logs a cash_movement
 * with the user-selected payment method. This replaces the removed trigger logic.
 */
export async function fulfillGeneralPurchase(
  supabase: SupabaseClient,
  branchId: string,
  purchaseId: string,
  purchaseTitle: string,
  amount: number,
  method: string,
  note?: string
): Promise<void> {
  // 1. Update purchase status → received and set actual_cost
  const { error: updateError } = await supabase
    .from('purchases')
    .update({ status: 'received', actual_cost: amount })
    .eq('id', purchaseId);
  if (updateError) throw updateError;

  // 2. Log the expense (cash_movement)
  const { error: expenseError } = await supabase.from('cash_movements').insert({
    branch_id: branchId,
    purchase_id: purchaseId,
    type: 'expense',
    category: 'purchase_payment',
    gross_amount: amount,
    net_amount: amount,
    payment_method: method,
    description: note?.trim() || `Compra recibida: ${purchaseTitle}`,
  });
  if (expenseError) throw expenseError;
}

// ─── fulfillWorkOrderPart ─────────────────────────────────────────────────────

/**
 * Delegates to the existing markItemAsPurchased service function for consistency.
 * Updates work_order_item status → purchased, logs a cash_movement, and injects
 * an internal note into the work order WITHOUT altering the overall order status.
 */
export async function fulfillWorkOrderPart(
  supabase: SupabaseClient,
  branchId: string,
  itemId: string,
  orderId: string,
  quantity: number,
  amount: number,
  method: string,
  note?: string,
  authorId?: string
): Promise<void> {
  await markItemAsPurchased(
    supabase,
    branchId,
    itemId,
    orderId,
    quantity,
    amount,
    method,
    note,
    authorId
  );
}

// ─── addGeneralPurchase ───────────────────────────────────────────────────────

/**
 * Inserts a new general purchase into the purchases table with status 'pending'.
 */
export async function addGeneralPurchase(
  supabase: SupabaseClient,
  branchId: string,
  data: {
    title: string;
    quantity: number;
    estimatedCost: number;
    supplier?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('purchases').insert({
    branch_id: branchId,
    title: data.title,
    quantity: data.quantity,
    estimated_cost: data.estimatedCost,
    supplier: data.supplier,
    status: 'pending',
  });
  if (error) throw error;
}
