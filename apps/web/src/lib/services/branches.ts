import { supabase } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks if at least one branch exists in the database.
 * Uses a single-row query with count to minimize data transfer.
 * RLS on `branches` allows authenticated users (even with NULL branch_id) to SELECT.
 */
export async function checkAnyBranchExists(): Promise<boolean> {
  const { count, error } = await supabase
    .from('branches')
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.error('Error checking branch existence:', error)
    throw error
  }

  return (count ?? 0) > 0
}

/** Shape returned by getBranchInfo — all fields needed for printable tickets. */
export interface BranchInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  tax_id: string | null;
  service_conditions: string | null;
  print_settings: {
    show_costs?: boolean;
    show_technician_notes?: boolean;
    show_header_logo?: boolean;
    [key: string]: unknown;
  } | null;
}

/**
 * Fetches branch metadata needed for the printable Workshop Ticket.
 * Returns name, address, phone, tax_id, service_conditions and print_settings.
 */
export async function getBranchInfo(
  supabaseClient: SupabaseClient,
  branchId: string
): Promise<BranchInfo | null> {
  const { data, error } = await supabaseClient
    .from('branches')
    .select('id, name, address, phone, tax_id, service_conditions, print_settings')
    .eq('id', branchId)
    .single()

  if (error) {
    console.error('Error fetching branch info:', error)
    throw error
  }

  return data as BranchInfo | null
}
