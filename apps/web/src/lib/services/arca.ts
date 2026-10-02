import { SupabaseClient } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaxCondition = "monotributo" | "responsable_inscripto" | "exento";
export type ArcaEnvironment = "homologacion" | "produccion";
export type InvoiceTargetType = "work_order" | "sale" | "cash_movement";

export interface ArcaConfig {
  branch_id: string;
  cuit: string;
  pto_vta: number;
  tax_condition: TaxCondition;
  business_name: string | null;
  fantasy_name: string | null;
  iibb: string | null;
  activity_start_date: string | null;
  is_active: boolean;
  environment: ArcaEnvironment;
  created_at: string;
  updated_at: string;
}

export interface ArcaConfigInput {
  cuit: string;
  pto_vta: number;
  tax_condition: TaxCondition;
  business_name?: string | null;
  fantasy_name?: string | null;
  iibb?: string | null;
  activity_start_date?: string | null;
  is_active: boolean;
  environment: ArcaEnvironment;
}

export interface ArcaInvoice {
  id: string;
  branch_id: string;
  work_order_id: string | null;
  cash_movement_id: string | null;
  sale_id: string | null;
  customer_id: string | null;
  cbte_tipo: number;
  pto_vta: number;
  cbte_nro: number | null;
  doc_tipo: number;
  doc_nro: string;
  imp_total: number;
  imp_neto: number;
  imp_iva: number;
  cae: string | null;
  cae_fch_vto: string | null;
  resultado: "A" | "R" | "P";
  observaciones: any[];
  qr_payload: string | null;
  created_by: string | null;
  created_at: string;
}

export interface EmitInvoiceRequest {
  target_type: InvoiceTargetType;
  target_id: string;
  cbte_tipo?: number;
  doc_tipo?: number;
  doc_nro?: string;
}

export interface EmitInvoiceResponse {
  success: boolean;
  invoice_id?: string;
  cae?: string;
  cae_fch_vto?: string;
  cbte_nro?: number;
  qr_payload?: string;
  mock?: boolean;
  already_invoiced?: boolean;
  warning?: string;
  message?: string;
  error?: string;
}

// ─── Fiscal Configuration (arca_configs) ─────────────────────────────────────

export async function fetchArcaConfig(
  supabase: SupabaseClient,
  branchId: string
): Promise<ArcaConfig | null> {
  const { data, error } = await supabase
    .from("arca_configs")
    .select("*")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching ARCA config:", error);
    throw error;
  }

  return data as ArcaConfig | null;
}

export async function upsertArcaConfig(
  supabase: SupabaseClient,
  branchId: string,
  config: ArcaConfigInput
): Promise<ArcaConfig> {
  const { data, error } = await supabase
    .from("arca_configs")
    .upsert(
      {
        branch_id: branchId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "branch_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting ARCA config:", error);
    throw error;
  }

  return data as ArcaConfig;
}

// ─── Certificate Management ─────────────────────────────────────────────────

export async function uploadArcaCertificate(
  supabase: SupabaseClient,
  branchId: string,
  file: File,
  type: "cert.crt" | "private.key"
): Promise<void> {
  const path = `${branchId}/${type}`;

  const { error } = await supabase.storage
    .from("arca_certs")
    .upload(path, file, { upsert: true });

  if (error) {
    console.error(`Error uploading ${type}:`, error);
    throw new Error(
      `No se pudo subir el archivo ${type}. Verificá que el bucket 'arca_certs' exista y tenga los permisos correctos.`
    );
  }
}

export async function checkArcaCertificates(
  supabase: SupabaseClient,
  branchId: string
): Promise<{ hasCert: boolean; hasKey: boolean }> {
  const [certRes, keyRes] = await Promise.all([
    supabase.storage.from("arca_certs").list(branchId, { search: "cert.crt" }),
    supabase.storage
      .from("arca_certs")
      .list(branchId, { search: "private.key" }),
  ]);

  return {
    hasCert: !certRes.error && (certRes.data?.length ?? 0) > 0,
    hasKey: !keyRes.error && (keyRes.data?.length ?? 0) > 0,
  };
}

// ─── Invoice Emission (calls Edge Function) ──────────────────────────────────

export async function emitInvoice(
  supabase: SupabaseClient,
  request: EmitInvoiceRequest
): Promise<EmitInvoiceResponse> {
  const { data, error } = await supabase.functions.invoke("arca-invoice", {
    body: request,
  });

  if (error) {
    console.error("Error calling arca-invoice function:", error);
    let errorDetail = error.message;

    // FunctionsHttpError in supabase-js wraps the HTTP Response in error.context
    if ("context" in error && (error as any).context) {
      try {
        const res = (error as any).context;
        if (typeof res.json === "function") {
          const errorJson = await res.json();
          if (errorJson?.error) {
            errorDetail = errorJson.error;
          }
        }
      } catch {
        // ignore
      }
    }

    throw new Error(errorDetail);
  }

  return data as EmitInvoiceResponse;
}

// ─── Invoice Queries ─────────────────────────────────────────────────────────

export async function fetchInvoiceByTarget(
  supabase: SupabaseClient,
  targetType: InvoiceTargetType,
  targetId: string
): Promise<ArcaInvoice | null> {
  const column =
    targetType === "work_order"
      ? "work_order_id"
      : targetType === "sale"
      ? "sale_id"
      : "cash_movement_id";

  const { data, error } = await supabase
    .from("arca_invoices")
    .select("*")
    .eq(column, targetId)
    .eq("resultado", "A")
    .maybeSingle();

  if (error) {
    console.error("Error fetching invoice:", error);
    throw error;
  }

  return data as ArcaInvoice | null;
}

export async function fetchInvoicesByBranch(
  supabase: SupabaseClient,
  branchId: string,
  options?: {
    limit?: number;
    offset?: number;
    resultado?: "A" | "R" | "P";
  }
): Promise<{ invoices: ArcaInvoice[]; count: number }> {
  let query = supabase
    .from("arca_invoices")
    .select("*", { count: "exact" })
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  if (options?.resultado) {
    query = query.eq("resultado", options.resultado);
  }

  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }

  return {
    invoices: (data || []) as ArcaInvoice[],
    count: count ?? 0,
  };
}

// ─── Voucher type labels (for UI display) ────────────────────────────────────

export const VOUCHER_TYPE_LABELS: Record<number, string> = {
  1: "Factura A",
  6: "Factura B",
  11: "Factura C",
  3: "Nota de Crédito A",
  8: "Nota de Crédito B",
  13: "Nota de Crédito C",
};

export function getVoucherTypeLabel(cbte_tipo: number): string {
  return VOUCHER_TYPE_LABELS[cbte_tipo] ?? `Tipo ${cbte_tipo}`;
}

export function formatInvoiceFullNumber(pto_vta: number, cbte_nro: number): string {
  const pv = String(pto_vta).padStart(4, "0");
  const nro = String(cbte_nro).padStart(8, "0");
  return `${pv}-${nro}`;
}
