## Why

The current system lacks essential workshop operations capabilities: quickly finding orders and providing customers with intake receipts. This change introduces real-time global and contextual searching, status filtering, and printable intake tickets to enable day-to-day shop usage.

## What Changes

- Contextual search & status tab filters on the `/orders` page.
- Global search integration from the top header redirecting to `/orders?q=...`.
- Printable Workshop Ticket (Comprobante de Ingreso) modal/view on `/orders/:id` capturing device condition, accessories, legal warranty clauses, and balance.

## Capabilities

### New Capabilities

- `order-search-and-print`: Defines the search logic, global header routing, and printable ticket layout for work orders.

### Modified Capabilities

None.

## Impact

- `DashboardLayout.tsx` (header search)
- `OrdersPage.tsx` (filters and tabs)
- `WorkOrderDetailsPage.tsx`
- A new printable ticket component
