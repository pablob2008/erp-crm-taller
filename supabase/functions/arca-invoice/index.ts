import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ─── CORS ────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a peso amount (e.g. 1500.50) to centavos (minor units: 150050).
 * The `facturas` SDK works exclusively in minor units (centavos).
 */
function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Sanitize a document number: remove all non-digit chars */
function sanitizeDocNumber(raw: string | null | undefined): string {
  if (!raw) return "0";
  const digits = String(raw).replace(/\D/g, "");
  return digits || "0";
}

/** Generate a deterministic mock CAE for testing (not valid for ARCA) */
function generateMockCae(): string {
  const ts = Date.now().toString().slice(-14);
  return ts.padStart(14, "0");
}

/**
 * Returns YYYY-MM-DD string for Argentina timezone (UTC-3).
 * Edge Functions run in UTC; we hardcode the offset.
 */
function argentinaTodayStr(): string {
  const ARGENTINA_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = new Date();
  const argTime = new Date(now.getTime() + ARGENTINA_OFFSET_MS);
  const yyyy = argTime.getUTCFullYear();
  const mm = String(argTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(argTime.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Voucher type constants (for mock mode and DB storage) ───────────────────
const CBTE_TIPOS = {
  FA_A: 1, FA_B: 6, FA_C: 11,
  NC_A: 3, NC_B: 8, NC_C: 13,
} as const;

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { target_type, target_id, doc_tipo, doc_nro } = body;

    // ── Validate required input ──────────────────────────────────────────
    if (!target_id || !target_type) {
      throw new Error("Faltan parámetros obligatorios (target_type, target_id).");
    }
    if (!["work_order", "sale", "cash_movement"].includes(target_type)) {
      throw new Error(`target_type inválido: "${target_type}". Valores aceptados: work_order, sale, cash_movement.`);
    }

    // ── 1. Supabase service-role client ──────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Authenticate caller ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Usuario no autenticado.");

    // ── 3. Get user profile → branch_id ─────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("id", user.id)
      .single();

    if (!profile?.branch_id)
      throw new Error("El usuario no tiene sucursal asignada.");
    const branchId = profile.branch_id;

    // ── 4. Load fiscal config from arca_configs ─────────────────────────
    const { data: fiscalConfig, error: configError } = await supabase
      .from("arca_configs")
      .select("*")
      .eq("branch_id", branchId)
      .single();

    if (configError || !fiscalConfig) {
      throw new Error(
        "No se encontró la configuración fiscal (ARCA) para esta sucursal. " +
        "Configurala desde Ajustes → Facturación Electrónica."
      );
    }

    if (!fiscalConfig.is_active) {
      throw new Error(
        "La facturación electrónica está desactivada para esta sucursal. " +
        "Activala desde Ajustes → Facturación Electrónica."
      );
    }

    const cuit = parseInt(String(fiscalConfig.cuit).replace(/\D/g, ""), 10);
    if (!cuit || isNaN(cuit) || String(cuit).length < 10) {
      throw new Error(`CUIT inválido en la configuración fiscal: "${fiscalConfig.cuit}". Debe tener 11 dígitos.`);
    }
    const puntoVenta = fiscalConfig.pto_vta;
    const taxCondition: string = fiscalConfig.tax_condition; // "monotributo" | "responsable_inscripto" | ...
    const isProduction = fiscalConfig.environment === "produccion";

    // ── 5. Receptor document type ───────────────────────────────────────
    let documentType = doc_tipo ? Number(doc_tipo) : 99;
    let documentNumber = doc_nro ? sanitizeDocNumber(doc_nro) : "0";

    // ── 6. Idempotency: check if an approved invoice already exists ─────
    const idempotencyColumn =
      target_type === "work_order" ? "work_order_id"
      : target_type === "sale" ? "sale_id"
      : "cash_movement_id";

    const { data: existingInvoice } = await supabase
      .from("arca_invoices")
      .select("id, cae, cae_fch_vto, cbte_nro, qr_payload, resultado")
      .eq(idempotencyColumn, target_id)
      .eq("resultado", "A")
      .maybeSingle();

    if (existingInvoice) {
      return new Response(
        JSON.stringify({
          success: true,
          already_invoiced: true,
          invoice_id: existingInvoice.id,
          cae: existingInvoice.cae,
          cae_fch_vto: existingInvoice.cae_fch_vto,
          cbte_nro: existingInvoice.cbte_nro,
          qr_payload: existingInvoice.qr_payload,
          message: "Este comprobante ya fue facturado exitosamente.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── 7. Calculate total from database (anti-spoofing) ────────────────
    let importeTotal = 0;
    let targetCustomerId: string | null = null;
    let isService = false; // true if the invoice involves services (repairs)
    let linkedWorkOrderIdFromSale: string | null = null;

    if (target_type === "work_order") {
      const { data: order, error: orderError } = await supabase
        .from("work_orders")
        .select("estimated_cost, total_paid, balance, status, customer_id, customers(tax_id)")
        .eq("id", target_id)
        .eq("branch_id", branchId)
        .single();
      if (orderError || !order)
        throw new Error("Orden de trabajo no encontrada o sin permisos.");

      importeTotal = Number(order.estimated_cost || 0);
      targetCustomerId = order.customer_id;
      isService = true;

      // Inherit customer tax_id if not explicitly provided
      if (!doc_tipo && !doc_nro) {
        const cust = order.customers as any;
        if (cust?.tax_id) {
          const digits = sanitizeDocNumber(cust.tax_id);
          const num = parseInt(digits, 10) || 0;
          if (num > 0 && digits.length >= 7) {
            if (digits.length >= 11) {
              documentType = 80; // CUIT
              documentNumber = digits;
            } else {
              documentType = 96; // DNI
              documentNumber = digits;
            }
          } else {
            documentType = 99;
            documentNumber = "0";
          }
        }
      }
    } else if (target_type === "sale") {
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select("total, status, arca_invoice_id, customer_id, customer_doc_type, customer_doc_number, work_order_id")
        .eq("id", target_id)
        .eq("branch_id", branchId)
        .single();
      if (saleError || !sale)
        throw new Error("Venta no encontrada o sin permisos.");
      if (sale.status === "voided")
        throw new Error("No se puede facturar una venta anulada.");
      if (sale.arca_invoice_id)
        throw new Error("Esta venta ya tiene un comprobante fiscal asociado.");

      // Check if linked work order was already invoiced
      if (sale.work_order_id) {
        linkedWorkOrderIdFromSale = sale.work_order_id;
        const { data: woInvoice } = await supabase
          .from("arca_invoices")
          .select("id, cae, cbte_nro")
          .eq("work_order_id", sale.work_order_id)
          .eq("resultado", "A")
          .maybeSingle();

        if (woInvoice) {
          throw new Error(
            `La orden de trabajo vinculada a esta venta ya fue facturada con Factura C Nº ${woInvoice.cbte_nro} (CAE: ${woInvoice.cae}).`
          );
        }
        isService = true; // Service repair included
      }

      // Exactly the total charged and itemized in this checkout
      importeTotal = Number(sale.total || 0);
      targetCustomerId = sale.customer_id;

      if (!doc_tipo && sale.customer_doc_type) {
        documentType = parseInt(sale.customer_doc_type, 10) || 99;
      }
      if (!doc_nro && sale.customer_doc_number) {
        documentNumber = sanitizeDocNumber(sale.customer_doc_number);
      }
    } else if (target_type === "cash_movement") {
      const { data: movement, error: movError } = await supabase
        .from("cash_movements")
        .select("net_amount, type")
        .eq("id", target_id)
        .eq("branch_id", branchId)
        .single();
      if (movError || !movement)
        throw new Error("Movimiento de caja no encontrado o sin permisos.");
      importeTotal = Math.abs(Number(movement.net_amount || 0));
      isService = true;
    }

    // ── Document normalization: Consumidor Final vs Identified Receiver ─
    // If doc_nro is missing, 0, or not a positive integer, it CANNOT be a CUIT or DNI.
    // It must fall back to Consumidor Final (DocTipo: 99, DocNro: 0).
    const docNumberInt = parseInt(documentNumber, 10) || 0;
    if (documentType === 99 || docNumberInt <= 0) {
      documentType = 99;
      documentNumber = "0";
    }

    if (importeTotal <= 0) {
      throw new Error("El importe total es $0 o negativo. No se puede emitir un comprobante fiscal.");
    }

    // ── 8. Map receiver condition for the facturas SDK ──────────────────
    // The SDK uses string identifiers, not numeric AFIP codes
    let receiverCondition: string;
    if (documentType === 80 && docNumberInt > 0) {
      // CUIT → could be RI, Monotributo, or Exento. Default to RI for safety.
      receiverCondition = "responsable_inscripto";
    } else {
      receiverCondition = "consumidor_final";
    }

    // ── 9. Determine voucher type for mock mode / DB storage ────────────
    let voucherType: number;
    if (taxCondition === "monotributo") {
      voucherType = CBTE_TIPOS.FA_C;
    } else if (taxCondition === "responsable_inscripto") {
      voucherType = documentType === 80 ? CBTE_TIPOS.FA_A : CBTE_TIPOS.FA_B;
    } else {
      voucherType = CBTE_TIPOS.FA_C;
    }

    // ── 10. Download certificates ───────────────────────────────────────
    const { data: certBlob, error: certError } = await supabase.storage
      .from("arca_certs")
      .download(`${branchId}/cert.crt`);
    const { data: keyBlob, error: keyError } = await supabase.storage
      .from("arca_certs")
      .download(`${branchId}/private.key`);

    const hasCertificates = !certError && !keyError && certBlob && keyBlob;
    const useMock = !hasCertificates && !isProduction;

    if (isProduction && !hasCertificates) {
      throw new Error(
        "Faltan los certificados digitales para facturación en producción. " +
        "Subí el certificado (.crt) y la clave privada (.key) desde Ajustes → Facturación Electrónica."
      );
    }

    // ── 11. Issue invoice ───────────────────────────────────────────────
    const todayStr = argentinaTodayStr();
    const importeMinorUnits = toMinorUnits(importeTotal);

    let cae: string;
    let caeFchVto: string;
    let numeroFactura: number;
    let qrPayload: string;

    if (useMock) {
      // ── MOCK MODE ─────────────────────────────────────────────────
      const { data: lastInvoice } = await supabase
        .from("arca_invoices")
        .select("cbte_nro")
        .eq("branch_id", branchId)
        .eq("cbte_tipo", voucherType)
        .eq("pto_vta", puntoVenta)
        .order("cbte_nro", { ascending: false })
        .limit(1)
        .maybeSingle();

      numeroFactura = (lastInvoice?.cbte_nro ?? 0) + 1;
      cae = generateMockCae();
      const expDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      caeFchVto = argentinaTodayStr(); // simplified for mock

      // Build mock QR
      const qrData = {
        ver: 1, fecha: todayStr, cuit, ptoVta: puntoVenta,
        tipoCmp: voucherType, nroCmp: numeroFactura,
        importe: importeTotal, moneda: "PES", ctz: 1,
        tipoCodAut: "E", codAut: parseInt(cae) || 0,
      };
      const base64 = btoa(JSON.stringify(qrData))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      qrPayload = `https://www.afip.gob.ar/fe/qr/?p=${base64}`;

      console.log(`[MOCK] Factura simulada: Tipo=${voucherType} Nro=${numeroFactura} CAE=${cae}`);
    } else {
      // ── REAL ARCA via facturas SDK ────────────────────────────────
      const facturasModule = await import("facturas");

      const certString = (await certBlob!.text()).trim();
      const keyString = (await keyBlob!.text()).trim();

      const arcaClient = facturasModule.createArcaClient({
        taxId: String(cuit),
        certificatePem: certString,
        privateKeyPem: keyString,
        environment: isProduction ? "production" : "test",
      });

      // Build the high-level issue input using the facturas SDK API.
      // Key rules discovered by auditing the SDK source:
      //   - salesPoint (not puntoVenta)
      //   - amounts in minor units (centavos): $1000 = 100000
      //   - For Factura C (monotributo): net = total, vat = 0 (SDK maps internally)
      //   - For Factura A/B (RI): net = neto, vat = iva, vatRates required
      //   - service.dueDate (not paymentDue)
      //   - Dates as "YYYY-MM-DD" strings (not Date objects)
      //   - receiverCondition via to.condition string
      //   - issuer as string ("monotributo", "responsable_inscripto")
      //   - The SDK auto-derives voucherType from issuer + receiver condition

      const issueInput: Record<string, any> = {
        issuer: taxCondition, // "monotributo" | "responsable_inscripto" | "exento"
        salesPoint: puntoVenta,
        to: {} as Record<string, any>,
        total: importeMinorUnits,
        amounts: {} as Record<string, any>,
      };

      // ── Receiver (to) ──
      // In the facturas SDK:
      // - CUIT:  { condition: receiverCondition, cuit: number }
      // - DNI:   { condition: "consumidor_final", dni: number }
      // - CF (sin identificar): { condition: "consumidor_final" }
      // Note: Passing dni: 0 or cuit: 0 throws ARCA_INPUT_INVALID_AMOUNT
      // ("to.dni must be a positive document number with 1 to 11 digits").
      if (documentType === 80 && docNumberInt > 0) {
        issueInput.to = {
          condition: receiverCondition,
          cuit: docNumberInt,
        };
      } else if (documentType === 96 && docNumberInt > 0) {
        issueInput.to = {
          condition: "consumidor_final",
          dni: docNumberInt,
        };
      } else {
        // Consumidor Final sin identificación (DocTipo 99 / DocNro 0)
        issueInput.to = {
          condition: "consumidor_final",
        };
      }

      // ── Amounts ──
      // For Factura C: all goes to net, vat = 0 (SDK handles AFIP mapping)
      // For Factura A/B: discriminate IVA 21%
      const isFacturaC = taxCondition === "monotributo" || taxCondition === "exento" || taxCondition === "no_alcanzado";

      if (isFacturaC) {
        issueInput.amounts = {
          net: importeMinorUnits,
          vat: 0,
        };
      } else {
        // Responsable Inscripto: discriminate 21% IVA
        const netMinor = Math.round(importeMinorUnits / 1.21);
        const vatMinor = importeMinorUnits - netMinor;
        issueInput.amounts = {
          net: netMinor,
          vat: vatMinor,
          vatRates: [{
            id: 5, // 21%
            base: netMinor,
            amount: vatMinor,
          }],
        };
      }

      // ── Service dates (only for services/mixed) ──
      if (isService) {
        issueInput.service = {
          from: todayStr,
          to: todayStr,
          dueDate: todayStr,
        };
      }
      // If no service field → SDK defaults concept to 1 (Productos)

      console.log("Enviando comprobante a ARCA...", JSON.stringify(issueInput));

      const result = await arcaClient.issue(issueInput);

      // Extract results from the SDK response
      cae = result.voucher.cae;
      caeFchVto = result.voucher.caeExpiry;
      numeroFactura = result.voucher.number;
      voucherType = result.voucher.voucherType;
      qrPayload = result.voucher.qr;
    }

    // ── 12. Persist invoice in arca_invoices ─────────────────────────────
    const docNroForDb = sanitizeDocNumber(documentNumber);
    const importeTotalPesos = importeTotal; // Store in pesos, not centavos

    const invoiceRow: Record<string, any> = {
      branch_id: branchId,
      cbte_tipo: voucherType,
      pto_vta: puntoVenta,
      cbte_nro: numeroFactura,
      doc_tipo: documentType,
      doc_nro: docNroForDb,
      imp_total: importeTotalPesos,
      imp_neto: 0,
      imp_iva: 0,
      cae,
      cae_fch_vto: caeFchVto,
      resultado: "A",
      observaciones: useMock
        ? [{ tipo: "info", msg: "Factura emitida en modo simulación (mock)." }]
        : [],
      qr_payload: qrPayload,
      created_by: user.id,
      customer_id: targetCustomerId,
    };

    if (target_type === "work_order") {
      invoiceRow.work_order_id = target_id;
    } else if (target_type === "sale") {
      invoiceRow.sale_id = target_id;
      // If the sale delivered an order, link BOTH in arca_invoices
      if (linkedWorkOrderIdFromSale) {
        invoiceRow.work_order_id = linkedWorkOrderIdFromSale;
      }
    } else if (target_type === "cash_movement") {
      invoiceRow.cash_movement_id = target_id;
    }

    const { data: invoiceDb, error: insertError } = await supabase
      .from("arca_invoices")
      .insert(invoiceRow)
      .select("id")
      .single();

    if (insertError) {
      console.error(
        `[CAE HUÉRFANO] ARCA aprobó CAE=${cae} para ${target_type}=${target_id} ` +
        `pero falló el INSERT en arca_invoices. Error: ${insertError.message}. ` +
        `Datos: cbte_tipo=${voucherType}, cbte_nro=${numeroFactura}, ` +
        `imp_total=${importeTotalPesos}, cae_fch_vto=${caeFchVto}. ` +
        `REQUIERE RECONCILIACIÓN MANUAL.`
      );

      return new Response(
        JSON.stringify({
          success: true,
          warning: "CAE_ORPHAN",
          cae,
          cae_fch_vto: caeFchVto,
          cbte_nro: numeroFactura,
          qr_payload: qrPayload,
          message:
            "ARCA aprobó el comprobante pero no se pudo guardar en la base de datos. " +
            "Anotá el CAE y contactá al administrador.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 207 }
      );
    }

    // ── 13. Sync fiscal fields back to sales table ──────────────────────
    if (target_type === "sale" && invoiceDb?.id) {
      const invoiceTypeCode =
        voucherType === CBTE_TIPOS.FA_A ? "FA_A"
        : voucherType === CBTE_TIPOS.FA_B ? "FA_B"
        : voucherType === CBTE_TIPOS.FA_C ? "FA_C"
        : null;

      const pvStr = String(puntoVenta).padStart(4, "0");
      const nroStr = String(numeroFactura).padStart(8, "0");
      const invoiceNumberStr = `${pvStr}-${nroStr}`;

      await supabase
        .from("sales")
        .update({
          arca_invoice_id: invoiceDb.id,
          cae: cae,
          cae_expires_at: caeFchVto,
          afip_qr_data: qrPayload,
          invoice_type: invoiceTypeCode,
          invoice_number: invoiceNumberStr,
          customer_doc_type: String(documentType),
          customer_doc_number: docNroForDb,
        })
        .eq("id", target_id);
    }

    // ── 14. Success response ────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoiceDb?.id,
        cae,
        cae_fch_vto: caeFchVto,
        cbte_nro: numeroFactura,
        qr_payload: qrPayload,
        mock: useMock,
        message: useMock
          ? "Factura emitida en modo simulación (sin ARCA real)."
          : "Factura generada y aprobada por ARCA correctamente.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error en arca-invoice Edge Function:", error);

    // Extract detailed error info from the facturas SDK
    let errorMessage = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
    
    if (error?.issues && Array.isArray(error.issues)) {
      const issueDetails = error.issues
        .map((i: any) => `[${i.code}] ${i.message}`)
        .join("; ");
      errorMessage = `${errorMessage} — Detalles: ${issueDetails}`;
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
