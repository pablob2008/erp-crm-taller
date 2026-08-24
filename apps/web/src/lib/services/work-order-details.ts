import { SupabaseClient } from '@supabase/supabase-js'

export interface WorkOrderComposite {
  id: string;
  branch_id: string;
  order_number: string;
  device_brand: string;
  device_model: string;
  device_color?: string | null;
  aesthetic_condition?: string | null;
  accessories?: string | null;
  reported_problem: string;
  suggested_solution?: string | null;
  estimated_delivery_at?: string | null;
  created_at?: string | null;
  status: string;
  estimated_cost: number;
  total_paid: number;
  balance: number;
  customers: { first_name: string; last_name: string; phone?: string | null; email?: string | null; tax_id?: string | null };
  tasks: Array<{ id: string; title: string; is_completed: boolean }>;
  work_order_notes: Array<{ id: string; content: string; created_at: string }>;
  work_order_items: Array<{ 
    id: string; 
    quantity: number; 
    unit_price: number; 
    status: string;
    description: string;
    inventory_items?: { name: string } 
  }>;
  cash_movements: Array<{ 
    id: string; 
    type: string;
    category: string;
    net_amount: number; 
    payment_method: string; 
    description: string;
    created_at: string 
  }>;
}

/** Mutable fields that can be updated via the Edit Order dialog. */
export interface WorkOrderEditable {
  device_brand: string;
  device_model: string;
  device_color: string | null;
  aesthetic_condition: string | null;
  accessories: string | null;
  reported_problem: string;
  suggested_solution: string | null;
  estimated_cost: number;
  estimated_delivery_at: string | null;
}

export async function getWorkOrderDetails(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('work_orders')
    .select(`
      id,
      branch_id,
      order_number,
      device_brand,
      device_model,
      device_color,
      aesthetic_condition,
      accessories,
      reported_problem,
      suggested_solution,
      estimated_delivery_at,
      created_at,
      status,
      estimated_cost,
      total_paid,
      balance,
      customers ( first_name, last_name, phone, email, tax_id ),
      tasks ( id, title, is_completed ),
      work_order_notes ( id, content, created_at ),
      work_order_items ( id, quantity, unit_price, status, description, inventory_items ( name ) ),
      cash_movements ( id, type, category, net_amount, payment_method, description, created_at )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Note: Due to PostgREST returning arrays or objects for one-to-many / many-to-one respectively,
  // we might need to cast or ensure the shape.
  // customers is object, others are arrays.
  // The types returned by Supabase can be quite complex, we typecast to our composite interface.
  return data as unknown as WorkOrderComposite;
}

export async function updateOrderStatus(supabase: SupabaseClient, id: string, status: string) {
  const { error } = await supabase
    .from('work_orders')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
}

export async function addOrderNote(supabase: SupabaseClient, id: string, content: string, authorId: string) {
  const { error } = await supabase
    .from('work_order_notes')
    .insert({ work_order_id: id, content, author_id: authorId });
  
  if (error) throw error;
}

export async function addTask(supabase: SupabaseClient, id: string, title: string, branchId: string) {
  const { error } = await supabase
    .from('tasks')
    .insert({ work_order_id: id, title, is_completed: false, branch_id: branchId });
    
  if (error) throw error;
}

export async function toggleTask(supabase: SupabaseClient, taskId: string, isCompleted: boolean) {
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', taskId);
    
  if (error) throw error;
}

export async function addOrderItem(supabase: SupabaseClient, orderId: string, itemName: string, quantity: number, unitPrice: number) {
  const { error } = await supabase
    .from('work_order_items')
    .insert({ work_order_id: orderId, description: itemName, quantity, unit_price: unitPrice, status: 'pending' });
    
  if (error) throw error;
}

export async function addOrderPayment(supabase: SupabaseClient, branchId: string, orderId: string, registerId: string, amount: number, method: string) {
  const { error } = await supabase
    .from('cash_movements')
    .insert({ 
      branch_id: branchId,
      work_order_id: orderId, 
      cash_register_id: registerId, 
      type: 'income',
      category: 'work_order_payment',
      gross_amount: amount,
      net_amount: amount, 
      payment_method: method,
      description: `Payment for work order`
    });
    
  if (error) throw error;
  await recalculateOrderFinancials(supabase, orderId);
}

export async function updateTask(supabase: SupabaseClient, taskId: string, title: string) {
  const { error } = await supabase.from('tasks').update({ title }).eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function updateNote(supabase: SupabaseClient, noteId: string, content: string) {
  const { error } = await supabase.from('work_order_notes').update({ content }).eq('id', noteId);
  if (error) throw error;
}

export async function deleteNote(supabase: SupabaseClient, noteId: string) {
  const { error } = await supabase.from('work_order_notes').delete().eq('id', noteId);
  if (error) throw error;
}

export async function updateItem(supabase: SupabaseClient, itemId: string, quantity: number, unitPrice: number) {
  const { error } = await supabase.from('work_order_items').update({ quantity, unit_price: unitPrice }).eq('id', itemId);
  if (error) throw error;
}

export async function deleteItem(supabase: SupabaseClient, itemId: string) {
  const { error } = await supabase.from('work_order_items').delete().eq('id', itemId);
  if (error) throw error;
}

async function recalculateOrderFinancials(supabase: SupabaseClient, orderId: string) {
  const { data: payments } = await supabase.from('cash_movements')
    .select('net_amount')
    .eq('work_order_id', orderId)
    .eq('type', 'income');
  
  const totalPaid = payments?.reduce((acc, p) => acc + Number(p.net_amount || 0), 0) || 0;

  const { error } = await supabase.from('work_orders').update({ total_paid: totalPaid }).eq('id', orderId);
  if (error) throw error;
}

export async function updatePayment(supabase: SupabaseClient, paymentId: string, orderId: string, amount: number) {
  const { error } = await supabase.from('cash_movements').update({ net_amount: amount }).eq('id', paymentId);
  if (error) throw error;
  await recalculateOrderFinancials(supabase, orderId);
}

export async function deletePayment(supabase: SupabaseClient, paymentId: string, orderId: string) {
  const { error } = await supabase.from('cash_movements').delete().eq('id', paymentId);
  if (error) throw error;
  await recalculateOrderFinancials(supabase, orderId);
}

export async function markItemAsPurchased(
  supabase: SupabaseClient,
  branchId: string,
  itemId: string,
  orderId: string,
  quantity: number,
  amount: number,
  method: string,
  noteContent?: string,
  authorId?: string
) {
  // Update status and unit_price
  const unitPrice = quantity > 0 ? amount / quantity : amount;
  const { error: itemError } = await supabase.from('work_order_items').update({ status: 'purchased', unit_price: unitPrice }).eq('id', itemId);
  if (itemError) throw itemError;

  // Log expense
  const { error: expenseError } = await supabase.from('cash_movements').insert({
    branch_id: branchId,
    work_order_id: orderId,
    type: 'expense',
    category: 'purchase_payment',
    gross_amount: amount,
    net_amount: amount,
    payment_method: method,
    description: `Purchase for work order item`
  });
  if (expenseError) throw expenseError;

  // Add optional note
  if (noteContent && authorId) {
    const { error: noteError } = await supabase.from('work_order_notes').insert({
      work_order_id: orderId,
      content: noteContent,
      author_id: authorId
    });
    if (noteError) throw noteError;
  }
}

// ─── Task 1.2: updateWorkOrder ────────────────────────────────────────────────
export async function updateWorkOrder(supabase: SupabaseClient, orderId: string, data: Partial<WorkOrderEditable>) {
  const { error } = await supabase
    .from('work_orders')
    .update(data)
    .eq('id', orderId);
  if (error) throw error;
}

// ─── Task 1.3: deleteWorkOrder ────────────────────────────────────────────────
export async function deleteWorkOrder(supabase: SupabaseClient, orderId: string) {
  const { error } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', orderId);
  if (error) throw error;
}

// ─── Task 1.4: addRandomExpense ───────────────────────────────────────────────
export interface RandomExpenseData {
  amount: number;
  method: string;
  description: string;
}

export async function addRandomExpense(
  supabase: SupabaseClient,
  branchId: string,
  orderId: string,
  data: RandomExpenseData
) {
  const { error } = await supabase.from('cash_movements').insert({
    branch_id: branchId,
    work_order_id: orderId,
    type: 'expense',
    category: 'manual_expense',
    gross_amount: data.amount,
    net_amount: data.amount,
    payment_method: data.method,
    description: data.description,
  });
  if (error) throw error;
}

// ─── Task 1.5: deliverOrder ───────────────────────────────────────────────────
export type DeliveryMode = 'credit' | 'collect';

export interface DeliveryData {
  mode: DeliveryMode;
  amount?: number;
  method?: string;
  note?: string;
  authorId?: string;
}

export async function deliverOrder(
  supabase: SupabaseClient,
  branchId: string,
  orderId: string,
  data: DeliveryData
) {
  // Step 1 (collect path): insert income movement and recalculate financials
  if (data.mode === 'collect') {
    if (!data.amount || data.amount <= 0) throw new Error('Amount must be positive');
    if (!data.method) throw new Error('Payment method is required');

    const { error: movError } = await supabase.from('cash_movements').insert({
      branch_id: branchId,
      work_order_id: orderId,
      type: 'income',
      category: 'work_order_payment',
      gross_amount: data.amount,
      net_amount: data.amount,
      payment_method: data.method,
      description: 'Cobro al entregar la orden',
    });
    if (movError) throw movError;
    await recalculateOrderFinancials(supabase, orderId);
  }

  // Step 2: fetch updated balance to compose auto-note
  const { data: orderRow } = await supabase
    .from('work_orders')
    .select('balance, order_number')
    .eq('id', orderId)
    .single();

  const balance = Number(orderRow?.balance ?? 0);
  const orderNumber = orderRow?.order_number ?? orderId;

  let autoNoteContent: string;
  if (data.mode === 'credit') {
    autoNoteContent = `Orden #${orderNumber} entregada a crédito. Saldo pendiente: $${balance.toFixed(2)}.`;
  } else {
    autoNoteContent = `Orden #${orderNumber} cobrada y entregada. Monto cobrado: $${(data.amount ?? 0).toFixed(2)}. Saldo restante: $${balance.toFixed(2)}.`;
  }
  if (data.note) {
    autoNoteContent += ` Nota: ${data.note}`;
  }

  // Step 3: insert automatic settlement note
  if (data.authorId) {
    const { error: noteError } = await supabase.from('work_order_notes').insert({
      work_order_id: orderId,
      content: autoNoteContent,
      author_id: data.authorId,
    });
    if (noteError) throw noteError;
  }

  // Step 4: update status to delivered
  const { error: statusError } = await supabase
    .from('work_orders')
    .update({ status: 'delivered' })
    .eq('id', orderId);
  if (statusError) throw statusError;
}
