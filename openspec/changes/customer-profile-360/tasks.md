## 1. Service Layer Extensions

- [x] 1.1 Add `fetchCustomerWorkOrders(supabase, customerId)` to `lib/services/customers.ts` — query `work_orders` filtered by `customer_id`, selecting `id`, `order_number`, `device_brand`, `device_model`, `reported_problem`, `status`, `estimated_cost`, `balance`, `created_at`, `estimated_delivery_at`. Order by `created_at` descending.
- [x] 1.2 Add `fetchCustomerFinancials(supabase, customerId)` to `lib/services/customers.ts` — run three parallel queries: (a) sum `sales.total` for `customer_id`, (b) sum `work_orders.balance` for non-cancelled orders of `customer_id`, (c) fetch recent `cash_movements` linked to the customer's `work_orders` (join via `work_order_id` in orders belonging to the customer). Return `{ lifetimeValue, pendingBalance, movements[] }`.
- [x] 1.3 Add `fetchCustomerById(supabase, customerId)` to `lib/services/customers.ts` — fetch a single customer record by ID for the profile header and identity panel.

## 2. Form Extraction (CustomerForm)

- [x] 2.1 Create `components/customers/CustomerForm.tsx` — extract form fields (first_name, last_name, tax_id, phone, email, address), validation logic, and error display from `CustomerEditModal.tsx` into a reusable presentational component. Props: `initialData`, `onSubmit`, `loading`, `submitLabel`.
- [x] 2.2 Refactor `CustomerEditModal.tsx` to consume `CustomerForm` internally, keeping the external API (`open`, `customer`, `onClose`, `onSuccess`) unchanged.
- [x] 2.3 Add create mode support to `CustomerEditModal` — accept a `mode: 'create' | 'edit'` prop. When `mode='create'`, call `createCustomer` on submit instead of `updateCustomer`. Adjust dialog title/description accordingly.

## 3. Directory Page Updates (CustomersPage)

- [x] 3.1 Add "New Customer" button in `CustomersPage.tsx` header — opens `CustomerEditModal` in create mode.
- [x] 3.2 Add "View Profile" action to each customer row/card — a clickable element or button that navigates to `/customers/:id` using `react-router-dom`'s `useNavigate`.

## 4. Customer Profile Page

- [x] 4.1 Create `pages/CustomerProfilePage.tsx` — page shell with `useParams` to extract `:id`, loading state, and error handling for invalid/missing customer.
- [x] 4.2 Implement Identity Panel — render `CustomerForm` inline inside a Glassmorphism Card. On save, call `updateCustomer` from the service and refresh the displayed data.
- [x] 4.3 Implement Workshop Panel — fetch `fetchCustomerWorkOrders` on mount. Display a table/grid showing order number, device (brand + model), reported problem, status (with color-coded badge), balance, and creation date. Each row links to `/orders/:id`.
- [x] 4.4 Implement Financial Panel — fetch `fetchCustomerFinancials` on mount. Display two KPI mini-cards (Lifetime Value, Pending Balance) and a table of recent cash movements (date, description, amount, payment method, type).
- [x] 4.5 Add back navigation — "← Volver al Directorio" link/button using `useNavigate(-1)` or explicit `/customers` link.

## 5. Routing

- [x] 5.1 Add route `<Route path="/customers/:id" element={<CustomerProfilePage />} />` inside `ProtectedRoute > DashboardLayout` in `App.tsx`, positioned after the `/customers` route.

## 6. Verification

- [x] 6.1 Run `npm run build` from `apps/web` to confirm zero TypeScript compilation errors.
- [x] 6.2 Manual verification: navigate to `/customers`, create a new customer via modal, confirm it appears in the list.
- [x] 6.3 Manual verification: click "View Profile" on a customer with existing work orders, confirm all three panels render correctly with accurate data.
- [x] 6.4 Manual verification: edit customer identity from the profile page, confirm changes persist and reflect immediately.
