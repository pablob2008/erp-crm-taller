# Design: pos-printing-engine

## Context

See [proposal.md](./proposal.md) for the problem statement and [spec.md](./specs/pos-printing-engine/spec.md) for the full requirements.

The POS currently completes sales through `checkoutSale()` in [`pos.ts`](file:///C:/Users/SITEC/PROYECTOS-IA/ERPCRMTALLER/apps/web/src/lib/services/pos.ts) which returns a `CheckoutResult { saleId, cashMovementId, total }`. After checkout, the ticket is cleared and a success toast is shown — but **no printable invoice is generated**. This change adds a scalable, ARCA-ready printing engine that renders both A4 and 80mm thermal ticket formats, reacting to the fiscal state of each sale.

The project already has a proven `@media print` + `print-only` CSS pattern established by [`PrintableTicket.tsx`](file:///C:/Users/SITEC/PROYECTOS-IA/ERPCRMTALLER/apps/web/src/components/orders/print/PrintableTicket.tsx) (work-order intake receipt) and the global print styles in [`index.css`](file:///C:/Users/SITEC/PROYECTOS-IA/ERPCRMTALLER/apps/web/src/index.css#L77-L125). This design follows the same approach.

---

## Goals / Non-Goals

### Goals

1. **Print two invoice layouts** — A4 (strict ARCA/AFIP layout) and 80mm thermal ticket — selectable per session.
2. **Dynamic fiscal state rendering** — display letter "X" + watermark when `cae`/`afip_qr_data` are null; display true letter (A/B/C) + QR + CAE when populated.
3. **ARCA-compliant header and footer** — Point of Sale number, Invoice number, Date, Issuer CUIT, IIBB, Start of Activities date, CAE, CAE Expiration, and Fiscal QR.
4. **Seamless post-checkout flow** — after successful `checkoutSale()`, fetch the persisted sale, render the invoice, and trigger `window.print()`.
5. **Reuse established patterns** — `print-only` class, inline styles for print fidelity, `BranchInfo` service, `@media print` rules.

### Non-Goals

- Actual ARCA/AFIP electronic invoicing integration (fiscal field population is out of scope — this engine only renders whatever is stored).
- PDF generation or server-side rendering.
- Receipt email/WhatsApp delivery.
- Branch-level persistent format preference stored in DB (this is a client-side session toggle for now).
- Work order intake ticket changes (that is the existing `PrintableTicket.tsx` scope).

---

## Decisions

### Decision 1: Component Architecture — Router + Layout + Shared Block

```
PrintableInvoice (router)
├── InvoiceA4          (A4 layout)
│   └── FiscalQRBlock  (shared QR+CAE footer)
└── InvoiceTicket      (80mm layout)
    └── FiscalQRBlock  (shared QR+CAE footer)
```

**`PrintableInvoice.tsx`** — A wrapper component that:
- Accepts a `format: 'A4' | 'ticket'` prop plus `sale`, `saleItems`, and `branch` data.
- Delegates rendering to `<InvoiceA4 />` or `<InvoiceTicket />`.
- Wraps the output in a `print-only` container `<div>`.

**`InvoiceA4.tsx`** — Renders a full A4 ARCA-style invoice with:
- Dual-column header (issuer on left, fiscal letter box in center, date/invoice-number on right).
- Line-item table with Description, Qty, Unit Price, Tax Rate, Subtotal.
- Fiscal footer via `<FiscalQRBlock />`.
- Watermark overlay for non-fiscal invoices.

**`InvoiceTicket.tsx`** — Renders an 80mm-optimized receipt with:
- Centered header (branch name, address, CUIT).
- Compact line-item list.
- Fiscal footer via `<FiscalQRBlock />`.
- Narrower watermark for non-fiscal.

**`FiscalQRBlock.tsx`** — A shared component that:
- Accepts `afipQrData`, `cae`, `caeExpiresAt`.
- If all populated, renders a QR code (via `react-qr-code`) and the CAE/expiration text.
- If null, renders nothing (the parent handles the watermark).

**Rationale:** Separating the QR+CAE rendering into a shared block avoids duplication between A4 and Ticket layouts. The router pattern keeps the POS page agnostic of which layout is active.

**Alternative considered:** A single component with conditional CSS. Rejected because A4 and ticket layouts have fundamentally different DOM structures (table vs. compact list, dual-column vs. centered header).

---

### Decision 2: CSS `@media print` Strategy

Extend the existing `@media print` rules in [`index.css`](file:///C:/Users/SITEC/PROYECTOS-IA/ERPCRMTALLER/apps/web/src/index.css#L77-L125) with format-specific `@page` rules:

```css
/* Default A4 (already exists) */
@page {
  size: A4 portrait;
  margin: 15mm;
}

/* Ticket-specific override when ticket format is active */
@page ticket {
  size: 80mm auto;   /* 80mm width, auto height */
  margin: 2mm;
}

.print-only--ticket {
  page: ticket;
}
```

The approach:
1. `PrintableInvoice` applies `print-only` (existing class, hidden on screen, visible on print).
2. When format is `'ticket'`, also applies `print-only--ticket` which triggers the named `@page ticket` rule.
3. All existing `no-print` / `aside` / `header` / `nav` hide rules continue to work unchanged.
4. The `<main>` margin/padding reset already exists.

**Rationale:** Named `@page` rules are well-supported in Chromium (the primary target for POS terminals). This avoids JavaScript-based page-size manipulation and keeps the solution pure CSS.

**Trade-off:** Firefox has limited `@page` named page support. This is acceptable because the target environment is Chromium-based POS terminals.

---

### Decision 3: Data Flow — `fetchSaleForPrint` Service Function

After `checkoutSale()` returns `{ saleId }`, we need the full persisted sale row (including fiscal fields that might be null now but populated by a future ARCA integration trigger). A new service function handles this:

```typescript
// In pos.ts
interface SaleForPrint {
  sale: Sale;
  items: SaleItem[];
}

async function fetchSaleForPrint(
  supabase: SupabaseClient,
  saleId: string
): Promise<SaleForPrint>
```

This fetches:
- `sales.*` — all columns including `cae`, `cae_expires_at`, `afip_qr_data`, `invoice_type`, `invoice_number`.
- `sale_items.*` — all line items for that sale.

**Data contract for `PrintableInvoice`:**

| Prop | Type | Source |
|------|------|--------|
| `format` | `'A4' \| 'ticket'` | Local state in POSPage |
| `sale` | `Sale` | `fetchSaleForPrint()` |
| `saleItems` | `SaleItem[]` | `fetchSaleForPrint()` |
| `branch` | `BranchInfo` | `getBranchInfo()` (already exists) |

The `BranchInfo` type already includes `name`, `address`, `phone`, `tax_id`. For ARCA headers we also need `email` and `logo_url` — the `getBranchInfo()` select and `BranchInfo` interface will be extended to include these two fields.

**Rationale:** Fetching the sale after persistence ensures we print exactly what was stored (including any DB-level triggers or defaults). Keeping the service function in `pos.ts` respects the architecture rule that services are UI-agnostic.

---

### Decision 4: Fiscal State Logic — Conditional Rendering Rules

| Condition | Letter | Watermark | QR Block | CAE Display |
|-----------|--------|-----------|----------|-------------|
| `cae` is null AND `afip_qr_data` is null | **X** | ✅ "DOCUMENTO NO VÁLIDO COMO FACTURA" | Hidden | Hidden |
| `cae` is populated AND `afip_qr_data` is populated | Derived from `invoice_type` (FA_A→A, FA_B→B, FA_C→C, TKT→T) | Hidden | ✅ Rendered | ✅ Rendered |

The letter derivation mapping:

```typescript
function deriveInvoiceLetter(invoiceType: string | null | undefined): string {
  switch (invoiceType) {
    case 'FA_A': return 'A';
    case 'FA_B': return 'B';
    case 'FA_C': return 'C';
    case 'TKT':  return 'T';
    default:      return 'X';
  }
}
```

This function lives in a new utility file `invoice-utils.ts` within the print components directory, since it is purely a display-mapping concern (not a service-layer function).

**Watermark implementation:** A CSS `position: fixed` overlay with `transform: rotate(-30deg)`, large semi-transparent text, `pointer-events: none`, `z-index: 1000`. Inline styled for print fidelity.

---

### Decision 5: Print Format Toggle — Client-Side Session State

The format toggle (`A4` vs `ticket`) will be a `useState` in `POSPage.tsx` defaulting to `'A4'`. A small segmented control (two buttons) will be added to the POS UI near the checkout button.

**Why not branch-level DB config?** The `print_settings` JSONB on `branches` could host this, but:
1. It couples a UX preference to the DB unnecessarily at this stage.
2. Different cashiers at the same branch may use different printers.
3. Adding it to `print_settings` later is a non-breaking additive change.

If future requirements demand per-branch persistence, the `print_settings` JSONB can be extended with a `pos_invoice_format: 'A4' | 'ticket'` key — no schema migration needed.

---

### Decision 6: QR Code Library — `react-qr-code`

The project has no QR library. We need one for `FiscalQRBlock`.

**Chosen: `react-qr-code`** (npm: `react-qr-code`)
- Zero dependencies, renders SVG (prints crisply at any resolution).
- ~4KB gzipped.
- React 19 compatible.
- No canvas dependency (important: canvas libraries fail in some print contexts).

**Alternative considered:** `qrcode.react` — heavier, canvas-based option exists, but SVG mode available. Either would work; `react-qr-code` is lighter and SVG-only by design.

---

### Decision 7: Post-Checkout Print Flow

The print flow after checkout in `POSPage.tsx`:

```
User clicks "Cobrar" → checkoutSale() → success
  → fetchSaleForPrint(saleId) → set printData state
  → PrintableInvoice renders in hidden print-only div
  → useEffect detects printData populated → window.print()
  → After print dialog closes → clear printData state
```

This mirrors the existing pattern in [`WorkOrderDetailsPage.tsx`](file:///C:/Users/SITEC/PROYECTOS-IA/ERPCRMTALLER/apps/web/src/pages/WorkOrderDetailsPage.tsx#L50-L55) which uses `setTimeout(() => window.print(), 300)` to let the DOM render before triggering print.

The `handleCheckout` function in POSPage will be modified to:
1. Call `checkoutSale()` as today.
2. On success, call `fetchSaleForPrint()` and store the result in state.
3. A `useEffect` watches the print data and triggers `window.print()` with a 300ms delay.
4. After print completes (via `window.onafterprint` or simply after the call), clear print state and dispatch `CLEAR_TICKET`.

---

### Decision 8: No DB Schema Changes Required

All necessary columns already exist:
- `sales`: `cae`, `cae_expires_at`, `afip_qr_data`, `invoice_type`, `invoice_number`, `customer_doc_type`, `customer_doc_number` — all nullable, ready for ARCA population.
- `branches`: `name`, `address`, `phone`, `email`, `tax_id`, `logo_url`, `print_settings`.
- `sale_items`: `description`, `quantity`, `unit_price`, `tax_rate`, `total_price` (generated column).

No migrations or schema changes are needed.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/components/pos/print/PrintableInvoice.tsx` | **Create** | Router component: reads `format` prop, delegates to `InvoiceA4` or `InvoiceTicket`. Wraps in `print-only` container. |
| `apps/web/src/components/pos/print/InvoiceA4.tsx` | **Create** | Full A4 ARCA-style invoice layout with dual-column header, fiscal letter box, line-item table, watermark overlay for non-fiscal, and `<FiscalQRBlock />` footer. |
| `apps/web/src/components/pos/print/InvoiceTicket.tsx` | **Create** | 80mm thermal receipt layout with centered header, compact item list, watermark for non-fiscal, and `<FiscalQRBlock />` footer. |
| `apps/web/src/components/pos/print/FiscalQRBlock.tsx` | **Create** | Shared fiscal footer: renders QR code (via `react-qr-code`), CAE number, and CAE expiration date. Renders nothing when fiscal data is null. |
| `apps/web/src/components/pos/print/invoice-utils.ts` | **Create** | Utility functions: `deriveInvoiceLetter()`, `formatCurrency()`, `formatDate()` — shared by both layouts. |
| `apps/web/src/components/pos/PrintFormatToggle.tsx` | **Create** | Small segmented control component (A4 / Ticket) for format selection. |
| `apps/web/src/lib/services/pos.ts` | **Modify** | Add `fetchSaleForPrint(supabase, saleId): Promise<SaleForPrint>` function and `SaleForPrint` interface. |
| `apps/web/src/lib/services/branches.ts` | **Modify** | Extend `BranchInfo` interface and `getBranchInfo()` select to include `email` and `logo_url` fields. |
| `apps/web/src/pages/POSPage.tsx` | **Modify** | Add `printFormat` state, `printData` state, post-checkout print flow with `fetchSaleForPrint` + `window.print()`, render `<PrintableInvoice />` and `<PrintFormatToggle />`. |
| `apps/web/src/index.css` | **Modify** | Add `@page ticket` named page rule for 80mm thermal format and `.print-only--ticket` class. |
| `apps/web/package.json` | **Modify** | Add `react-qr-code` dependency. |

---

## Dependencies

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `react-qr-code` | `^2.0.15` | SVG-based QR code rendering for fiscal AFIP QR block | ~4KB gzipped |

No other new dependencies are required.

---

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Named `@page` support** — Firefox and Safari have limited support for CSS named page rules (`@page ticket`). | Ticket-format printing may fall back to A4 page size on non-Chromium browsers. | Target environment is Chromium-based POS terminals. Add a fallback comment in CSS. If needed, a JS-based approach (`@media print` width override) can be added later. |
| **Print timing** — `window.print()` may fire before the QR SVG fully renders. | QR code may be missing from printout. | Use the established `setTimeout(300ms)` pattern. The QR is SVG (synchronous render), so this is low risk. |
| **Fiscal data always null** — Until ARCA integration is built, every invoice will be "X" with watermark. | Users may be confused by the watermark. | This is by design and documented in the spec. The watermark clearly communicates the non-fiscal status. |
| **Sale refetch after checkout** — An extra DB round-trip to fetch the sale we just inserted. | Slight delay before print dialog. | The refetch ensures we print persisted data (including DB defaults and generated columns like `total_price`). The round-trip is fast (~50ms on local Supabase). |
| **New dependency (`react-qr-code`)** — Adds a package to the bundle. | ~4KB gzipped bundle increase. | Only imported in print components (not in hot POS path). Could be lazy-loaded via `React.lazy` if bundle size becomes a concern. |
| **80mm thermal printer variability** — Different thermal printers have varying DPI and margin handling. | Receipt may clip or have inconsistent spacing. | Use conservative widths (72mm content within 80mm paper) and test with common POS printer models (Epson TM-T20, Star TSP100). |
