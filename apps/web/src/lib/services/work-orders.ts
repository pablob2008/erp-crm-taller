import { SupabaseClient } from "@supabase/supabase-js";
import type { WorkOrderFormValues } from "../validations/work-orders";

export interface WorkOrder {
  id: string;
  order_number: string;
  status: string;
  // more fields can be added here
}

export interface CreateWorkOrderResult {
  workOrder: WorkOrder;
  paymentError?: string; // present only when cash_movements insert failed
}

export async function createWorkOrder(
  supabase: SupabaseClient,
  branchId: string,
  userId: string,
  data: WorkOrderFormValues
): Promise<CreateWorkOrderResult> {
  const { data: workOrder, error } = await supabase
    .from("work_orders")
    .insert([
      {
        branch_id: branchId,
        customer_id: data.customer_id,
        device_brand: data.device_brand,
        device_model: data.device_model,
        device_color: data.device_color || null,
        aesthetic_condition: data.aesthetic_condition || null,
        accessories: data.accessories || null,
        reported_problem: data.reported_problem,
        suggested_solution: data.suggested_solution || null,
        status: data.status ?? "received",
        estimated_cost: data.estimated_cost ?? 0,
        estimated_delivery_at: data.estimated_delivery_at || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating work order:", error);
    throw error;
  }

  const order = workOrder as WorkOrder;

  // Conditionally insert a cash_movements record for the advance payment
  if ((data.advance_payment ?? 0) > 0) {
    const { error: paymentErr } = await supabase
      .from("cash_movements")
      .insert([
        {
          branch_id: branchId,
          work_order_id: order.id,
          type: "income",
          category: "work_order_payment",
          payment_method: data.payment_method,
          gross_amount: data.advance_payment,
          net_amount: data.advance_payment,
          discount_type: "none",
          discount_value: 0,
          description: `Adelanto orden ${order.order_number}`,
          created_by: userId,
        },
      ]);

    if (paymentErr) {
      console.error("Error creating cash movement:", paymentErr);
      return { workOrder: order, paymentError: paymentErr.message };
    }
  }

  return { workOrder: order };
}
