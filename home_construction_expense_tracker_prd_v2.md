# Home Construction Expense Tracker -- Product Requirements Document (PRD)

## 1. Overview

The Home Construction Expense Tracker is a web application built using
**React / Next.js** that helps house owners track and manage all
expenses related to a home construction project.

The system will support **multiple contractors** (e.g., building
contractor, electrical contractor, painting contractor, plumbing
contractor, etc.) and maintain **separate financial accounts for each
contractor as well as the house owner**.

The goal is to provide clear financial visibility into all expenses,
payments, and balances throughout the construction process.

------------------------------------------------------------------------

## 2. Objectives

-   Track all construction-related expenses in one place
-   Support **multiple contractor accounts**
-   Maintain a **separate financial account for each contractor**
-   Record daily expenses and payments
-   Provide clear financial visibility across all accounts
-   Maintain running balances for each account

------------------------------------------------------------------------

## 3. Key Users

### 3.1 House Owner

-   Creates and manages the construction project
-   Adds and manages contractor accounts
-   Records daily expenses and payments
-   Monitors balances and transaction history

### 3.2 Contractors

Examples: - Building contractor - Painting contractor - Electrical
contractor - Plumbing contractor

Contractors can: - Log in and view their own transactions - See payments
received - Track outstanding balances

------------------------------------------------------------------------

## 4. Core Features

## 4.1 User Accounts

The system should support authenticated users with roles:

-   House Owner (Admin)
-   Contractor

Each user should have: - Name - Email - Role - Login credentials

------------------------------------------------------------------------

## 4.2 Contractor Management

The house owner should be able to:

-   Add multiple contractors
-   Assign contractor type

Example contractor types:

-   Building Contractor
-   Electrical Contractor
-   Plumbing Contractor
-   Painting Contractor
-   Interior Contractor
-   Landscaping Contractor

Each contractor should have: - Contractor Name - Contractor Type -
Contact Details - Initial Balance (optional) - Created Date

------------------------------------------------------------------------

## 4.3 Financial Accounts

Each contractor and the house owner will have a **separate financial
account**.

Example accounts:

  Account                 Type
  ----------------------- ------------
  Owner Account           Primary
  Building Contractor     Contractor
  Electrical Contractor   Contractor
  Painting Contractor     Contractor

Each account should store: - Account ID - Account Name - Account Type -
Initial Balance - Current Balance

------------------------------------------------------------------------

## 4.4 Initial Balance Setup

When creating an account, the system should allow setting an **initial
balance**.

Example:

Owner Initial Balance: ₹10,00,000\
Electrical Contractor Initial Balance: ₹0

The initial balance will act as the **starting point for the account
ledger**.

------------------------------------------------------------------------

## 4.5 Daily Transaction Recording

Users should be able to add transactions such as:

-   Material purchase
-   Labour payments
-   Contractor payments
-   Miscellaneous expenses

Each transaction should include:

-   Date
-   Description
-   Amount
-   Transaction Type
-   Linked Account
-   Category
-   Notes (optional)

Transaction Types:

-   Expense
-   Payment
-   Adjustment

------------------------------------------------------------------------

## 4.6 Account Selection During Entry

When entering a transaction, the user must select which **account** the
transaction belongs to.

Examples:

-   Owner Account (for material purchases)
-   Building Contractor Account
-   Electrical Contractor Account
-   Painting Contractor Account

The system should automatically update the **balance of the selected
account**.

------------------------------------------------------------------------

## 4.7 Account Dashboard

Each account should have a dashboard showing:

-   Current Balance
-   Total Expenses
-   Total Payments
-   Number of Transactions

Users should be able to **switch between contractor accounts easily**.

------------------------------------------------------------------------

## 4.8 Transaction History

Users should be able to view transaction history including:

-   Date
-   Description
-   Amount
-   Account
-   Contractor (if applicable)
-   Transaction Type

Filtering options:

-   By contractor
-   By account
-   By date range
-   By transaction type

------------------------------------------------------------------------

## 4.9 Reports

The system should provide reporting features such as:

### Project Summary

-   Total project spending
-   Remaining funds
-   Total payments to contractors

### Contractor Reports

Per contractor:

-   Total amount paid
-   Total transactions
-   Outstanding balance

### Monthly Reports

-   Monthly spending breakdown
-   Contractor payment summary

------------------------------------------------------------------------

## 5. Non-Functional Requirements

### Performance

-   Transactions should load within 2 seconds.

### Security

-   User authentication required
-   Role-based access control

### Usability

-   Mobile-friendly interface
-   Simple and quick expense entry

------------------------------------------------------------------------

## 6. Suggested Tech Stack

### Frontend

-   Next.js
-   React
-   Tailwind CSS
-   React Hook Form

### Backend

-   Next.js API Routes or Node.js backend

### Database

-   PostgreSQL / SQLite

### Authentication

-   NextAuth

------------------------------------------------------------------------

## 7. Data Model (Simplified)

### Users

-   id
-   name
-   email
-   role
-   created_at

### Contractors

-   id
-   name
-   contractor_type
-   contact_details
-   created_at

### Accounts

-   id
-   account_name
-   account_type
-   contractor_id (nullable)
-   initial_balance
-   current_balance
-   created_at

### Transactions

-   id
-   account_id
-   contractor_id (optional)
-   date
-   description
-   amount
-   type
-   category
-   notes
-   created_at

------------------------------------------------------------------------

## 8. Future Enhancements

-   Multiple construction projects
-   Material inventory tracking
-   Invoice / bill upload
-   Budget vs actual comparison
-   Export reports to Excel or PDF
-   Mobile app version
-   Contractor payment reminders

------------------------------------------------------------------------

## 9. Success Metrics

-   All construction expenses captured in the system
-   Accurate financial visibility across all contractors
-   Easy tracking of contractor payments
-   Clear balance tracking for every account
