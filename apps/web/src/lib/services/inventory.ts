import { SupabaseClient } from '@supabase/supabase-js'

export interface InventoryItem {
  id: string
  branch_id: string
  code: string
  name: string
  description?: string | null
  category?: string | null
  quantity: number
  min_stock?: number
  cost_price?: number
  sale_price?: number
  created_at: string
}

export type CreateInventoryItemDTO = Omit<InventoryItem, 'id' | 'branch_id' | 'created_at'>
export type UpdateInventoryItemDTO = Partial<CreateInventoryItemDTO>

export async function fetchInventoryItems(
  supabase: SupabaseClient,
  branchId: string,
  search?: string
): Promise<InventoryItem[]> {
  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('branch_id', branchId)
    .order('name', { ascending: true })

  if (search && search.trim().length > 0) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as InventoryItem[]
}

export async function addInventoryItem(
  supabase: SupabaseClient,
  branchId: string,
  payload: CreateInventoryItemDTO
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      ...payload,
      branch_id: branchId,
    })
    .select()
    .single()

  if (error) throw error
  return data as InventoryItem
}

export async function updateInventoryItem(
  supabase: SupabaseClient,
  itemId: string,
  payload: UpdateInventoryItemDTO
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(payload)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data as InventoryItem
}

export async function deleteInventoryItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}
