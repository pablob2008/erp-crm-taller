import { SupabaseClient } from "@supabase/supabase-js";
import type { NewCustomerFormValues } from "../validations/work-orders";

export interface Customer {
  id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerWithHistory extends Customer {
  orderCount: number;
  lifetimeValue: number;
  work_orders?: { count: number }[];
}

export interface FetchCustomersOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchCustomersResult {
  data: CustomerWithHistory[];
  count: number;
}

export async function fetchCustomers(
  supabase: SupabaseClient,
  branchId?: string,
  opts?: FetchCustomersOptions
): Promise<FetchCustomersResult> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select(
      `
      id,
      branch_id,
      first_name,
      last_name,
      tax_id,
      phone,
      email,
      address,
      created_at,
      updated_at,
      work_orders ( count )
    `,
      { count: "exact" }
    );

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const search = opts?.search?.trim();
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,tax_id.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }

  const customers = (data || []) as any[];
  const customerIds = customers.map((c) => c.id);

  const lifetimeValues: Record<string, number> = {};
  if (customerIds.length > 0) {
    const [salesRes, woRes] = await Promise.all([
      supabase
        .from("sales")
        .select("customer_id, total, work_order_id, status")
        .in("customer_id", customerIds),
      supabase
        .from("work_orders")
        .select("customer_id, total_paid, status")
        .in("customer_id", customerIds)
        .neq("status", "cancelled"),
    ]);

    if (!woRes.error && woRes.data) {
      woRes.data.forEach((wo: any) => {
        if (wo.customer_id) {
          lifetimeValues[wo.customer_id] =
            (lifetimeValues[wo.customer_id] || 0) + Number(wo.total_paid || 0);
        }
      });
    }

    if (!salesRes.error && salesRes.data) {
      salesRes.data.forEach((s: any) => {
        // Include retail sales not linked to a work order to prevent double counting
        if (s.customer_id && !s.work_order_id && s.status !== "voided") {
          lifetimeValues[s.customer_id] =
            (lifetimeValues[s.customer_id] || 0) + Number(s.total || 0);
        }
      });
    }
  }

  const enriched: CustomerWithHistory[] = customers.map((c) => ({
    ...c,
    orderCount: c.work_orders?.[0]?.count ?? 0,
    lifetimeValue: lifetimeValues[c.id] ?? 0,
  }));

  return {
    data: enriched,
    count: count ?? 0,
  };
}

export async function searchCustomers(supabase: SupabaseClient, query: string): Promise<Customer[]> {
  if (!query) return [];

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,tax_id.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching customers:", error);
    throw error;
  }

  return data as Customer[];
}

export interface CreateCustomerInput {
  first_name: string;
  last_name: string;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export async function createCustomer(
  supabase: SupabaseClient,
  branchId: string,
  data: NewCustomerFormValues | CreateCustomerInput
): Promise<Customer> {
  const { data: customer, error } = await supabase
    .from("customers")
    .insert([{ ...data, branch_id: branchId }])
    .select()
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    throw error;
  }

  return customer as Customer;
}

export interface CustomerHistorySnapshot {
  orderCount: number;
  lifetimeValue: number;
}

export async function fetchCustomerHistorySnapshot(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerHistorySnapshot> {
  const [woRes, salesRes] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, total_paid, status")
      .eq("customer_id", customerId),
    supabase
      .from("sales")
      .select("total, work_order_id, status")
      .eq("customer_id", customerId),
  ]);

  if (woRes.error) {
    console.error("Error fetching customer work order count:", woRes.error);
    throw woRes.error;
  }
  if (salesRes.error) {
    console.error("Error fetching customer sales:", salesRes.error);
    throw salesRes.error;
  }

  const orderCount = (woRes.data || []).length;
  const woLtv = (woRes.data || [])
    .filter((wo: any) => wo.status !== "cancelled")
    .reduce((acc, curr) => acc + Number(curr.total_paid || 0), 0);

  const directSalesLtv = (salesRes.data || [])
    .filter((s: any) => !s.work_order_id && s.status !== "voided")
    .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  return {
    orderCount,
    lifetimeValue: woLtv + directSalesLtv,
  };
}

export interface UpdateCustomerInput {
  first_name?: string;
  last_name?: string;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export async function updateCustomer(
  supabase: SupabaseClient,
  customerId: string,
  fields: UpdateCustomerInput
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating customer:", error);
    throw error;
  }

  return data as Customer;
}

export interface CanDeleteCustomerResult {
  canDelete: boolean;
  workOrderCount: number;
  saleCount: number;
}

export async function canDeleteCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<CanDeleteCustomerResult> {
  const [woRes, salesRes] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
  ]);

  if (woRes.error) {
    console.error("Error checking customer work orders count:", woRes.error);
    throw woRes.error;
  }
  if (salesRes.error) {
    console.error("Error checking customer sales count:", salesRes.error);
    throw salesRes.error;
  }

  const workOrderCount = woRes.count ?? 0;
  const saleCount = salesRes.count ?? 0;
  const canDelete = workOrderCount === 0 && saleCount === 0;

  return {
    canDelete,
    workOrderCount,
    saleCount,
  };
}

export async function deleteCustomer(
  supabase: SupabaseClient,
  customerId: string
): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
}

export interface CustomerWorkOrder {
  id: string;
  order_number: string;
  device_brand: string;
  device_model: string;
  reported_problem: string;
  status: string;
  estimated_cost: number;
  balance: number;
  created_at: string;
  estimated_delivery_at?: string | null;
}

export async function fetchCustomerWorkOrders(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerWorkOrder[]> {
  const { data, error } = await supabase
    .from("work_orders")
    .select(
      "id, order_number, device_brand, device_model, reported_problem, status, estimated_cost, balance, created_at, estimated_delivery_at"
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customer work orders:", error);
    throw error;
  }

  return (data || []) as CustomerWorkOrder[];
}

export interface CustomerCashMovement {
  id: string;
  work_order_id?: string | null;
  type: string;
  category?: string | null;
  net_amount: number;
  payment_method?: string | null;
  description?: string | null;
  created_at: string;
}

export interface CustomerFinancials {
  lifetimeValue: number;
  pendingBalance: number;
  movements: CustomerCashMovement[];
}

export async function fetchCustomerFinancials(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerFinancials> {
  const [salesRes, woRes] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, work_order_id, status, cash_movement_id")
      .eq("customer_id", customerId),
    supabase
      .from("work_orders")
      .select("id, balance, status, total_paid, estimated_cost")
      .eq("customer_id", customerId),
  ]);

  if (salesRes.error) {
    console.error("Error fetching customer sales:", salesRes.error);
    throw salesRes.error;
  }
  if (woRes.error) {
    console.error("Error fetching customer work orders for financials:", woRes.error);
    throw woRes.error;
  }

  const nonCancelledOrders = (woRes.data || []).filter(
    (wo: any) => wo.status !== "cancelled"
  );

  // 1. Revenue from work orders (total collected/paid on non-cancelled orders)
  const woLtv = nonCancelledOrders.reduce(
    (acc: number, curr: any) => acc + Number(curr.total_paid || 0),
    0
  );

  // 2. Revenue from direct POS retail sales (exclude work_order_id to avoid double counting)
  const directSalesLtv = (salesRes.data || [])
    .filter((s: any) => !s.work_order_id && s.status !== "voided")
    .reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0);

  const lifetimeValue = woLtv + directSalesLtv;

  // Pending balance owed across open or credit orders
  const pendingBalance = nonCancelledOrders.reduce(
    (acc: number, curr: any) => acc + Number(curr.balance || 0),
    0
  );

  const orderIds = (woRes.data || []).map((wo: any) => wo.id);
  const salesCashMovementIds = (salesRes.data || [])
    .map((s: any) => s.cash_movement_id)
    .filter(Boolean);

  let movements: CustomerCashMovement[] = [];

  const movPromises: Promise<any>[] = [];
  if (orderIds.length > 0) {
    movPromises.push(
      Promise.resolve(
        supabase
          .from("cash_movements")
          .select(
            "id, work_order_id, type, category, net_amount, payment_method, description, created_at"
          )
          .in("work_order_id", orderIds)
      )
    );
  }
  if (salesCashMovementIds.length > 0) {
    movPromises.push(
      Promise.resolve(
        supabase
          .from("cash_movements")
          .select(
            "id, work_order_id, type, category, net_amount, payment_method, description, created_at"
          )
          .in("id", salesCashMovementIds)
      )
    );
  }

  if (movPromises.length > 0) {
    const movResults = await Promise.all(movPromises);
    const allMovs: CustomerCashMovement[] = [];
    const seenIds = new Set<string>();

    movResults.forEach((res) => {
      if (!res.error && res.data) {
        res.data.forEach((m: CustomerCashMovement) => {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            allMovs.push(m);
          }
        });
      }
    });

    allMovs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    movements = allMovs.slice(0, 50);
  }

  return {
    lifetimeValue,
    pendingBalance,
    movements,
  };
}

export async function fetchCustomerById(
  supabase: SupabaseClient,
  customerId: string
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    console.error("Error fetching customer by id:", error);
    throw error;
  }

  return data as Customer;
}


