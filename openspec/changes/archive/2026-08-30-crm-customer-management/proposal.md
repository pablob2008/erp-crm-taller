# Change Proposal: CRM Customer Management

## Problem
Currently, there is no centralized CRM module to manage customer data. Customer management is fragmented, making it difficult to search, edit, and safely delete customer records without risking database relational integrity (e.g., `ON DELETE RESTRICT` violations when customers have associated sales or work orders). Furthermore, there is no easy way to get a snapshot of a customer's history, such as lifetime value or order count.

## Goal
Implement a Customer Directory (CRM module) at `/customers` to centralize customer data management, enabling search, editing, and safe-deletion while protecting database relational integrity.

## Proposed Changes
1. **Customer Data Table**: Introduce a new page at `/customers` that displays all clients using pagination or virtual scrolling for performance.
2. **Search & Filters**: Add functionality to quickly search and filter customers by name, phone, or document number (DNI/CUIT).
3. **Edit Action**: Implement a modal or inline editing interface to update existing customer information, including name, phone, email, and document type/number.
4. **Safe Delete Action**: Implement a strict deletion mechanism that allows removing a customer ONLY if they have zero associated sales and zero work orders. This prevents `ON DELETE RESTRICT` violations and preserves accounting and historical data.
5. **Customer History Snapshot**: Provide a quick view showing the lifetime value (total spent) and order count per customer.

## Capabilities

### New Capabilities
- `crm-customer-management`

### Modified Capabilities
- (None)
