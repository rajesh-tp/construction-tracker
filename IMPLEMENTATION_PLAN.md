# Construction Tracker — Implementation Plan

## Tech Stack (matching festival-fund-manager patterns)

- **Framework**: Next.js (App Router) + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **Auth**: Cookie-based sessions with HMAC-SHA256 (same as festival-fund-manager)
- **Validation**: Zod v4
- **Testing**: Vitest + Testing Library
- **Deployment**: Docker + Fly.io (Mumbai region, persistent volume)
- **Currency**: INR (₹) hardcoded

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Project
- [ ] `npx create-next-app` with TypeScript, Tailwind, ESLint, App Router
- [ ] Install dependencies: drizzle-orm, better-sqlite3, zod, sonner, jspdf
- [ ] Configure drizzle.config.ts (SQLite at `./data/construction.db`)
- [ ] Set up project folder structure:

```
src/
├── app/
│   ├── layout.tsx              # Root layout with auth + navbar
│   ├── page.tsx                # Dashboard / home
│   ├── login/page.tsx          # Login page
│   ├── contractors/
│   │   ├── page.tsx            # List contractors
│   │   └── [id]/page.tsx       # Contractor detail
│   ├── accounts/
│   │   ├── page.tsx            # All accounts overview
│   │   └── [id]/page.tsx       # Account detail + transactions
│   ├── transactions/
│   │   ├── page.tsx            # Transaction history (filterable)
│   │   └── new/page.tsx        # Add transaction form
│   └── reports/
│       └── page.tsx            # Reports & analytics
├── components/
│   ├── Navbar.tsx
│   ├── SummaryCard.tsx
│   ├── TransactionForm.tsx
│   ├── TransactionTable.tsx
│   ├── ContractorForm.tsx
│   ├── AccountSelector.tsx
│   └── FilterBar.tsx
├── lib/
│   ├── auth.ts                 # Session management
│   ├── db.ts                   # Drizzle ORM setup
│   ├── actions.ts              # Server actions
│   ├── queries.ts              # Database queries
│   └── validators.ts           # Zod schemas
└── db/
    └── schema.ts               # Drizzle table definitions
```

### 1.2 Database Schema (Drizzle)

```
users
├── id (integer, PK, autoincrement)
├── name (text, not null)
├── email (text, unique, not null)
├── password_hash (text, not null)
├── role (text: 'owner' | 'contractor', not null)
├── contractor_id (integer, FK → contractors.id, nullable)
└── created_at (text, default now)

contractors
├── id (integer, PK, autoincrement)
├── name (text, not null)
├── contractor_type (text, not null)
├── contact_phone (text)
├── contact_email (text)
├── initial_balance (real, default 0)
├── is_active (integer, default 1)
└── created_at (text, default now)

accounts
├── id (integer, PK, autoincrement)
├── account_name (text, not null)
├── account_type (text: 'primary' | 'contractor', not null)
├── contractor_id (integer, FK → contractors.id, nullable)
├── initial_balance (real, default 0)
├── current_balance (real, default 0)
└── created_at (text, default now)

transactions
├── id (integer, PK, autoincrement)
├── account_id (integer, FK → accounts.id, not null)
├── contractor_id (integer, FK → contractors.id, nullable)
├── date (text, not null)
├── description (text, not null)
├── amount (real, not null)
├── type (text: 'expense' | 'payment' | 'adjustment', not null)
├── category (text, not null)
├── notes (text)
├── created_by (integer, FK → users.id)
└── created_at (text, default now)
```

### 1.3 Auth & Deployment Setup
- [ ] Copy auth pattern from festival-fund-manager (cookie-based HMAC-SHA256)
- [ ] Roles: `owner` (full access) and `contractor` (read-only on own data)
- [ ] Dockerfile (multi-stage, node:22-alpine)
- [ ] fly.toml (bom region, 1GB RAM, persistent volume at /data)
- [ ] start.sh (migrate → seed → start)
- [ ] seed-users.mjs (default owner account)

---

## Phase 2: MVP — Core Features

### 2.1 Contractor Management (Owner only)
- [ ] Add contractor form (name, type, contact details)
- [ ] List all contractors with status
- [ ] Edit/deactivate contractors
- [ ] Auto-create a linked account when contractor is added

### 2.2 Account Management
- [ ] Owner account (created during setup/seed)
- [ ] Contractor accounts (auto-created with contractor)
- [ ] Set/edit initial balance
- [ ] View account details with current balance

### 2.3 Transaction Entry
- [ ] Transaction form with:
  - Date picker
  - Account selector (dropdown of all accounts)
  - Transaction type (expense / payment / adjustment)
  - Category (material, labour, contractor payment, misc, etc.)
  - Amount (₹)
  - Description
  - Notes (optional)
- [ ] Auto-update account balance on transaction create
- [ ] Edit/delete transactions (owner only)

### 2.4 Transaction History
- [ ] Full transaction list with pagination
- [ ] Filters: by account, contractor, date range, transaction type
- [ ] Sort by date (default newest first)

---

## Phase 3: Dashboard & Reports

### 3.1 Main Dashboard
- [ ] Summary cards: Total spent, Total payments, Remaining funds
- [ ] Per-account balance overview (quick glance)
- [ ] Recent transactions list

### 3.2 Account Dashboard
- [ ] Per-account view: balance, total expenses, total payments, transaction count
- [ ] Account-specific transaction history

### 3.3 Reports
- [ ] Project summary: total spending, remaining funds, payments to contractors
- [ ] Contractor report: per-contractor totals and outstanding balance
- [ ] Monthly report: spending breakdown by month
- [ ] PDF export (using jsPDF, same as festival-fund-manager)

---

## Phase 4: Polish & Deployment

### 4.1 UI/UX
- [ ] Mobile-responsive layout
- [ ] Toast notifications (sonner)
- [ ] Loading states and error handling
- [ ] Dark/light theme toggle

### 4.2 Contractor Login
- [ ] Contractor users can log in and view their own account
- [ ] Read-only access to their transactions and reports

### 4.3 Deploy
- [ ] Create Fly.io app
- [ ] Set up persistent volume
- [ ] Set SESSION_SECRET
- [ ] Deploy and verify

---

## Categories (Predefined)

- Material Purchase
- Labour Payment
- Contractor Payment
- Transport
- Equipment Rental
- Permits & Fees
- Utilities
- Miscellaneous

## Contractor Types (Predefined)

- Building Contractor
- Electrical Contractor
- Plumbing Contractor
- Painting Contractor
- Interior Contractor
- Landscaping Contractor
- Carpentry Contractor
- Other
