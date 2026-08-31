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
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("customer_id, total")
      .in("customer_id", customerIds);

    if (!salesError && salesData) {
      salesData.forEach((s: any) => {
        if (s.customer_id) {
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

export async function createCustomer(
  supabase: SupabaseClient,
  branchId: string,
  data: NewCustomerFormValues
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
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
    supabase
      .from("sales")
      .select("total")
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

  const orderCount = woRes.count ?? 0;
  const lifetimeValue = (salesRes.data || []).reduce(
    (acc, curr) => acc + Number(curr.total || 0),
    0
  );

  return {
    orderCount,
    lifetimeValue,
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

