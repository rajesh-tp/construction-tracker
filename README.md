# Construction Tracker

A multi-tenant construction expense tracking application built with Next.js, SQLite, and Drizzle ORM.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Database Setup

```bash
# Push the schema to SQLite
npx drizzle-kit push

# Seed default users and sample data
node seed-users.mjs
```

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Login Credentials

| Role        | Email                    | Password       |
|-------------|--------------------------|----------------|
| Super Admin | superadmin@example.com   | superadmin123  |
| Owner       | owner@example.com        | owner123       |
| Contractor  | contractor@example.com   | contractor123  |

---

## Setting Up Constructions, Owners, and Contractors

Below is the step-by-step guide to set up a new construction project and link users to it.

### Step 1: Create a Construction

1. Log in as **Super Admin**.
2. Navigate to **Constructions** (click on the construction switcher in the navbar, then "Manage Constructions").
3. Click **+ New Construction**.
4. Enter a name (e.g., "Rajesh's Home") and an optional description.
5. Click **Create Construction**. A primary "Owner Account" is automatically created for this construction.

### Step 2: Create an Owner User (if needed)

If you need a new owner for this construction:

1. Navigate to **Users** in the navbar.
2. Click **+ New User**.
3. Fill in the name, email, and password.
4. Set the role to **Owner**.
5. Click **Create User**.

### Step 3: Assign the Owner to the Construction

1. Navigate to **Constructions** and click **Manage** on the target construction.
2. In the **User Assignments** section, select the owner user from the dropdown.
3. Click **Assign**. The owner can now switch to this construction and manage it.

### Step 4: Create Contractors

1. Switch to the target construction using the **construction switcher** in the navbar.
2. Navigate to **Contractors**.
3. Click **+ New Contractor**.
4. Fill in the contractor details (name, type, phone, email, initial balance).
5. Click **Create Contractor**. A contractor account is automatically created.

### Step 5: Create a Contractor Login (optional)

If you want a contractor to log in and view their own transactions:

1. Navigate to **Users** > **+ New User**.
2. Fill in the contractor's name, email, and password.
3. Set the role to **Contractor**.
4. In the **"Link to Contractor"** dropdown that appears, select the contractor record you created in Step 4. The construction name is shown in parentheses for clarity.
5. Click **Create User**.

The contractor user is now automatically assigned to the correct construction. When they log in, they will:
- Be auto-scoped to their construction (no construction selection needed).
- See only their own account balance and transactions on the Dashboard.
- See only their own transactions on the Transactions page.
- Not have access to Contractors, Accounts, or Reports pages.

### Step 6: Link an Existing User to a Contractor

If a user already exists and you want to link them to a contractor:

1. Navigate to **Users** and click **Edit** on the user.
2. Change the role to **Contractor** (if not already).
3. Select the contractor from the **"Link to Contractor"** dropdown.
4. Click **Save Changes**.

---

## Roles and Permissions

| Feature                | Super Admin | Owner | Contractor |
|------------------------|:-----------:|:-----:|:----------:|
| View Dashboard         | All data    | All data | Own account only |
| Manage Contractors     | Yes         | Yes   | No         |
| View Accounts          | Yes         | Yes   | No         |
| Add Transactions       | Yes         | Yes   | No         |
| View Transactions      | All         | All   | Own only   |
| View Reports           | Yes         | Yes   | No         |
| Manage Constructions   | Yes         | No    | No         |
| Manage Users           | Yes         | No    | No         |
| Switch Constructions   | All         | Assigned | Auto-scoped |
| Delete Transactions    | Yes         | No    | No         |
| Edit Account Balances  | Yes         | Yes   | No         |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite via better-sqlite3
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Auth**: Cookie-based HMAC-SHA256 sessions
