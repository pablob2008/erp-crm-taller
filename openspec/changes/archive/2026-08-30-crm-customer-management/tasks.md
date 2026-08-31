# Tasks: CRM Customer Management

## 1. Services Layer (`apps/web/src/lib/services/customers.ts`)
- [x] 1.1 Implement `fetchCustomers` with search capabilities (ilike on name, phone, document/tax_id) and `.range()` pagination.
- [x] 1.2 Implement `fetchCustomerHistorySnapshot` to aggregate lifetime value (from `sales`) and order count.
- [x] 1.3 Implement `updateCustomer` to modify editable fields (first_name, last_name, tax_id, phone, email, address).
- [x] 1.4 Implement `canDeleteCustomer` to pre-check and count if a customer has associated `sales` or `work_orders`.
- [x] 1.5 Implement `deleteCustomer` to execute the deletion of a customer record.

## 2. UI Components (`apps/web/src/components/customers/CustomerEditModal.tsx`)
- [x] 2.1 Create the `CustomerEditModal.tsx` component.
- [x] 2.2 Build the edit form with controlled inputs for customer details (`first_name`, `last_name`, `tax_id`/document, `phone`, `email`, `address`).
- [x] 2.3 Implement form validation and submission logic calling `updateCustomer`.
- [x] 2.4 Handle loading states, display error messages, and invoke `onSuccess` callback to refresh the parent list upon successful update.

## 3. Page Integration (`apps/web/src/pages/CustomersPage.tsx`)
- [x] 3.1 Refactor `CustomersPage.tsx` to utilize `fetchCustomers`, wiring up the search bar and pagination controls.
- [x] 3.2 Inject the history snapshot (order count and lifetime value) to display on each customer card/row.
- [x] 3.3 Add "Edit" and "Delete" action buttons to the customer cards.
- [x] 3.4 Mount the `CustomerEditModal` and connect it to the "Edit" button.
- [x] 3.5 Implement the Safe Delete action: trigger `canDeleteCustomer` on click, display inline blocking message if relations exist, otherwise show confirmation dialog and proceed with `deleteCustomer`.
