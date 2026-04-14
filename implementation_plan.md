# نظام الإدارة المالية والمحاسبية — Financial & Accounting Management System

A fully Arabic RTL, dark-mode, glassmorphism web application with dashboard analytics, CRUD operations for 8 entity types, interactive charts, and toast notifications.

## Tech Stack

| Layer | Technology |
|---|---|
| Build Tool | Vite |
| UI Framework | React 18 |
| Styling | TailwindCSS v3 |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | react-hot-toast |
| Font | IBM Plex Sans Arabic (Google Fonts) |

> [!NOTE]
> Since the user wants a prototype, we will use **React state + localStorage** as the data layer instead of spinning up a full PostgreSQL backend. The database schema will be documented and the data structures will mirror the requested schema exactly, making it trivial to swap in a real backend later.

---

## Database Schema

8 tables, each represented as a TypeScript-like interface in the code:

```
Accounts:          id, account_name, balance, creation_date
Customers:         id, name, phone, balance, last_action_date
Suppliers:         id, name, phone, balance, last_action_date
Employees:         id, name, phone, debit_balance
Sales_Invoices:    id, customer_id, value, description, date
Purchase_Invoices: id, supplier_id, value, description, date
Checks:            id, value, due_date, status, customer_id
Journal_Entries:   id, notes, value, entry_type, date
```

---

## Proposed Changes

### 1. Project Scaffold

#### [NEW] `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Initialize a Vite + React project in the workspace root.
- Configure TailwindCSS with dark mode, RTL support, and Arabic font.
- Install dependencies: `react`, `react-dom`, `recharts`, `lucide-react`, `react-hot-toast`.

---

### 2. Data Layer

#### [NEW] `src/data/schema.js`
- Define the 8 entity schemas as JS objects.
- Export initial dummy data (10-15 records per table) with realistic Arabic names, phone numbers, and financial figures.

#### [NEW] `src/data/useStore.js`
- Custom React hook using `useState` + `localStorage` for persistence.
- Provides `getAll`, `add`, `update`, `delete` operations per entity.

---

### 3. Layout & Navigation

#### [NEW] `src/components/Layout.jsx`
- Full-page dark layout with `dir="rtl"` on the root.
- Collapsible sidebar with navigation links for all 8 sections + Dashboard.
- Top header bar with app title and optional user avatar.

#### [NEW] `src/components/Sidebar.jsx`
- Glassmorphism sidebar with Lucide icons for each section.
- Active state highlighting, smooth transitions.

---

### 4. Dashboard Page

#### [NEW] `src/pages/Dashboard.jsx`
- **4 Stat Cards**: Total Liquidity, Active Customers, Pending Checks, Net Profit.
  - Each card: glassmorphism background, icon, value, label, subtle animation on hover.
- **Cash Flow Bar Chart** (Recharts `BarChart`): Monthly inflow vs outflow.
- **Account Distribution Pie Chart** (Recharts `PieChart`): Balance distribution across accounts.

---

### 5. Entity Pages (8 pages, one per table)

#### [NEW] `src/pages/Accounts.jsx`
#### [NEW] `src/pages/Customers.jsx`
#### [NEW] `src/pages/Suppliers.jsx`
#### [NEW] `src/pages/Employees.jsx`
#### [NEW] `src/pages/SalesInvoices.jsx`
#### [NEW] `src/pages/PurchaseInvoices.jsx`
#### [NEW] `src/pages/Checks.jsx`
#### [NEW] `src/pages/JournalEntries.jsx`

Each page includes:
- A **data table** with all columns, zebra striping, and hover effects.
- An **"إضافة جديد" (Add New) button** that opens a modal.
- **Edit** and **Delete** actions per row.

---

### 6. Shared Components

#### [NEW] `src/components/DataTable.jsx`
- Reusable table component accepting columns config + data array.
- Supports edit/delete action buttons per row.

#### [NEW] `src/components/Modal.jsx`
- Glassmorphism modal with backdrop blur.
- Renders dynamic form fields based on the active entity schema.

#### [NEW] `src/components/StatCard.jsx`
- Reusable stat card for the dashboard.

#### [NEW] `src/components/Toast.jsx`
- Integration with `react-hot-toast` for success/error notifications.

---

### 7. Entry Point

#### [NEW] `src/App.jsx`
- Router setup (simple state-based routing, no react-router needed for prototype).
- Wraps everything in the Layout.

#### [NEW] `src/main.jsx`
- Vite entry point, renders `<App />`.

#### [NEW] `src/index.css`
- TailwindCSS directives, custom glassmorphism utilities, Arabic font import.

---

## UI/UX Design Decisions

| Aspect | Decision |
|---|---|
| Color Palette | Deep slate/zinc backgrounds (#0f172a, #1e293b), cyan/violet accents |
| Glassmorphism | `backdrop-blur-xl`, semi-transparent white borders, subtle gradients |
| Typography | IBM Plex Sans Arabic — professional, clean Arabic rendering |
| Animations | CSS transitions on hover/focus, modal fade-in, card scale effects |
| RTL | `dir="rtl"` on `<html>`, TailwindCSS RTL utilities where needed |
| Responsiveness | Sidebar collapses on mobile, grid layouts adapt |

---

## Verification Plan

### Automated Tests
- Run `npm run dev` and verify the app loads without errors.
- Use the browser tool to visually verify each page (Dashboard, all 8 entity pages).
- Test CRUD operations: Add a record → verify it appears in the table → Edit → Delete.

### Manual Verification
- Screenshot the dashboard to confirm stat cards, charts, and glassmorphism effects render correctly.
- Verify Arabic text renders properly in RTL layout.
- Check responsiveness at different viewport sizes.
