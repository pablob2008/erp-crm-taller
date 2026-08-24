import { SupabaseClient } from "@supabase/supabase-js";
import type { NewCustomerFormValues } from "../validations/work-orders";

export interface Customer {
  id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  address?: string;
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
