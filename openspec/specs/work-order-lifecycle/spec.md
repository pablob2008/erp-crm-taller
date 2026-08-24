# work-order-lifecycle Specification

## Purpose
Provides a centralized 360-degree operational dashboard for work orders, enabling global lifecycle actions (metadata editing, deletion, WhatsApp messaging integration, and receipt printing), comprehensive diagnostic and device specifications overview, ad-hoc expense tracking, and dual-mode order settlement upon delivery.

## Requirements

### Requirement: Global Work Order Header Actions
The system MUST provide global lifecycle header actions on the work order details view, including metadata editing, safe order deletion with confirmation, customer WhatsApp summary sharing, direct WhatsApp chat triggering, and receipt printing.

#### Scenario: Edit work order metadata
- **GIVEN** a user is viewing a work order in the work order details page
- **WHEN** the user opens the edit modal, modifies attributes such as device details, diagnostic findings, estimated delivery date, or financial estimates, and submits the changes
- **THEN** the system MUST persist the updated attributes in the database and refresh the composite work order view

#### Scenario: Delete work order with confirmation
- **GIVEN** a user is viewing a work order
- **WHEN** the user clicks the delete action and confirms the destructive deletion dialog
- **THEN** the system MUST delete the work order record and navigate the user back to the work orders list

#### Scenario: Share formatted order summary to WhatsApp
- **GIVEN** a work order with an associated customer phone number, device specifications, and financial status
- **WHEN** the user clicks the WhatsApp summary share button
- **THEN** the system MUST sanitize the customer phone number and launch a WhatsApp web/app link to `https://wa.me/{phone}?text={encodedSummary}` with a pre-formatted message containing order number, device brand and model, reported problem, status, and pending balance

#### Scenario: Direct WhatsApp communication
- **GIVEN** a work order with an associated customer phone number
- **WHEN** the user clicks the direct WhatsApp chat button
- **THEN** the system MUST sanitize the phone number and launch `https://wa.me/{phone}` in a new tab without predefined text

#### Scenario: Print work order receipt placeholder
- **GIVEN** a user is viewing a work order
- **WHEN** the user clicks the print action button
- **THEN** the system MUST trigger the browser print dialog displaying the work order receipt layout

### Requirement: 360-Degree Comprehensive Overview
The system MUST display a comprehensive 360-degree operational overview of the work order, including customer contact details, complete device intake specifications, and intake diagnostic information with scheduling dates.

#### Scenario: View complete customer contact profile
- **GIVEN** an active work order linked to a customer
- **WHEN** the user views the Overview tab
- **THEN** the system MUST display the customer's first name, last name, phone number (with a quick-action WhatsApp button), email, and tax identification number

#### Scenario: View comprehensive device specifications
- **GIVEN** a work order containing device intake metadata
- **WHEN** the user views the device details card in the Overview tab
- **THEN** the system MUST display the brand, model, device color, aesthetic condition, and registered intake accessories

#### Scenario: View diagnostic and scheduling details
- **GIVEN** a work order with intake diagnostic information
- **WHEN** the user views the diagnostic section in the Overview tab
- **THEN** the system MUST display the reported problem, intake diagnostic / suggested solution, intake creation timestamp, and estimated delivery date

### Requirement: Ad-Hoc Expense Registration
The system MUST allow users to register ad-hoc or unexpected expenses associated with a work order, recording the transaction in cash movements.

#### Scenario: Successfully record ad-hoc order expense
- **GIVEN** a user is viewing the Finances tab of an active work order
- **WHEN** the user submits the expense modal with a valid amount, payment method, and description
- **THEN** the system MUST insert an `expense` movement into `cash_movements` linked to the current branch and work order, and refresh the financial summary

#### Scenario: Validate expense entry fields
- **GIVEN** the ad-hoc expense registration modal is open
- **WHEN** the user attempts to submit without specifying a positive amount or description
- **THEN** the system MUST display validation errors and prevent record submission

### Requirement: Dual-Path Order Delivery Settlement
The system MUST support a dual-path delivery settlement workflow allowing users to either deliver the order on credit (logging an automatic pending balance note) or collect payment and deliver (registering income movement, updating balance, and logging an automatic note), transitioning the order status to `delivered`.

#### Scenario: Deliver order on credit without upfront payment
- **GIVEN** a work order with a pending balance
- **WHEN** the user selects the "Deliver on Credit" path in the delivery modal and confirms
- **THEN** the system MUST update the work order status to `delivered` and automatically insert an internal note detailing the credit delivery and pending balance amount

#### Scenario: Collect payment and deliver order
- **GIVEN** a work order ready for customer delivery
- **WHEN** the user selects the "Collect & Deliver" path, specifies a payment method and payment amount, and confirms
- **THEN** the system MUST insert an `income` movement into `cash_movements`, update total paid and remaining balance, insert an automatic settlement note, and transition the work order status to `delivered`

#### Scenario: Enforce required payment method and amount for collect and deliver
- **GIVEN** the Collect & Deliver delivery option is active
- **WHEN** the user submits without selecting a valid payment method or provides an amount less than or equal to zero
- **THEN** the system MUST reject the submission with validation errors and keep the order in its prior status
