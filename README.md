# Inventory Management System (InventoryPro)

A production-grade, frontend-only **Inventory Management System** built with React 19, TypeScript, Tailwind CSS, and Vite. All business rules, validation schemas, and state logic are strictly decoupled and run purely client-side, persisting securely in the browser's `localStorage`.

---

## Key Features

### 1. Catalog & Product Management

- **Add Product:** Formik + Yup validated dialog with fields for Product Name, Product ID (SKU), Category, Price (LKR), Initial Stock, and Low Stock Alert Threshold.
- **Auto-Generated SKU (Bonus B1):** Built-in "Auto Generate" button creates unique `PRD-XXXXXX` IDs with collision checks.
- **Edit Product:** Instant editing of name, category, price, and low stock threshold with immutable Product ID and protected stock baseline.
- **Delete with Undo (Extra E3):** Delete requires explicit confirmation naming the target product, removes it from the catalog, and provides a 6-second **Undo** toast to instantly restore the product and its stock state.

### 2. Stock Management & Overselling Prevention

- **Adjustment Modes:** Dedicated Restock Inbound (+) and Sale Outbound (-) flows.
- **Real-Time Live Preview:** Instant calculation of current vs. resulting stock levels and delta badge as the user types.
- **Zero-Stock & Oversell Guard:** Decreases exceeding available stock are strictly blocked ("Only N units in stock"). Stock can never fall below zero.
- **Audit Logging (Bonus B2):** Every stock mutation creates a cryptographically unique signed movement entry with timestamp, product name snapshot, previous stock, new stock, and optional note.

### 3. Executive Dashboard & Visual Analytics

- **Inventory KPIs:** Real-time summary cards for Total Products, Total Inventory Valuation (LKR), Low Stock Alerts, and Out of Stock Count.
- **Category Analytics (Bonus B5):** Interactive Recharts distribution chart with switchable Bar and Donut views.
- **Category Breakdown:** Comprehensive inventory share percentage and total unit volume per category.
- **Stock Attention List:** Quick-action table highlighting products at or below their designated threshold.

### 4. Category Governance

- **Protected Seed Categories:** Default system categories are protected from rename or deletion.
- **Guarded Custom Categories:** Custom categories can be created and renamed. Deletions are guarded: categories assigned to active products cannot be deleted until products are reassigned.
- **Inline Category Creation:** Create new categories directly from the product form without losing input progress.

### 5. Search, Filter & Column Sorting

- **Debounced Search (Extra E5):** 300ms debounced live search query matching both product name and Product ID.
- **Combined Filtering:** Multi-criteria AND filters for Category and Stock Status (All, In Stock, Low Stock, Out of Stock).
- **Interactive Column Sorting (Extra E4):** Sort by Name, Product ID, Price, and Stock with visual ascending/descending directional indicators.
- **No-Results State:** Helpful empty state with one-click filter reset.

### 6. Stock Movement History

- **Audit Trail (`/history`):** Complete chronological log of all initial stocks, inbound restocks, and outbound sales.
- **Persistent Snapshots:** Movement history retains historical product names even after products are deleted.
- **Filterable Log:** Filter movements by product, movement type (Restock, Sale, Initial), and note keywords.

### 7. Export to CSV (Bonus B3)

- **RFC-Compliant CSV:** Export full catalog with Product ID, Name, Category, Price, Stock, Threshold, and Timestamps.
- **Formula Injection Defense:** Cell values beginning with `=`, `+`, `-`, or `@` are automatically sanitized to prevent spreadsheet formula execution (DDE attacks).

### 8. Bulk Operations (Bonus B6)

- **Row Selection:** Select all on page or choose individual items across table and card views.
- **Floating Bulk Bar:** Displays active selection count with quick-action buttons.
- **Bulk Restock:** Formik + Yup modal allowing simultaneous restock across all selected items with a single audit note.
- **Bulk Delete with Undo:** All-or-nothing batch deletion with multi-item restoration via toast notification.

### 9. Dark Mode & Responsive Design

- **Theme Toggle (Bonus B4):** Seamless Light / Dark mode toggle persisted in `localStorage`.
- **Responsive Layout:** Responsive desktop table and mobile-optimized card layout designed for screens from 360px up to 4K displays.

---

## Tech Stack

| Layer                  | Technologies                                         |
| ---------------------- | ---------------------------------------------------- |
| **Framework & UI**     | React 19, TypeScript, React Router 7                 |
| **Styling & Icons**    | Tailwind CSS, Lucide React, class-variance-authority |
| **Forms & Validation** | Formik, Yup                                          |
| **Charts & Feedback**  | Recharts, Sonner Toaster                             |
| **Build & Tooling**    | Vite 8, ESLint 10, Prettier, PostCSS, Husky          |
| **Testing**            | Vitest, jsdom, React Testing Library                 |

---

## Architecture

The application adheres to clean architecture principles with complete separation between business rules, state transitions, and presentation:

```
src/
├── components/          # Reusable UI primitives (Button, Card, Badge, Dialog, Input)
│   ├── layout/          # AppShell, Topbar, Sidebar
│   └── shared/          # ConfirmDialog, EmptyState, ThemeToggle, ErrorBoundary
├── constants/           # Business limits and seed data
├── features/            # Feature modules
│   ├── categories/      # CategoryFormDialog
│   ├── dashboard/       # StatCards, CategorySummary, LowStockList, CategoryChart
│   ├── products/        # ProductTable, ProductCards, ProductFiltersBar, BulkActionBar
│   └── stock/           # StockAdjustDialog
├── hooks/               # useDebounce, useTheme
├── lib/                 # Pure utilities: storage, format, id, result, csv-export
├── pages/               # Route entry points: Dashboard, Products, Categories, History
├── schemas/             # Pure Yup validation schemas with dynamic context factories
├── services/            # Pure domain services: product-service, stock-service, category-service
├── state/               # State layer: reducer, actions, selectors, context provider
└── types/               # TypeScript domain interfaces
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation & Run

1. Clone the repository:

```sh
git clone <repository-url>
cd inventory-management-system
```

2. Install dependencies:

```sh
npm install
```

3. Start the Vite development server:

```sh
npm run dev
```

4. Open `http://localhost:5173` in your browser.

---

## Available Scripts

| Script               | Command             | Purpose                                                   |
| -------------------- | ------------------- | --------------------------------------------------------- |
| **Start Dev Server** | `npm run dev`       | Launches local Vite development server                    |
| **Type Check**       | `npm run typecheck` | Validates TypeScript types across the codebase            |
| **Lint**             | `npm run lint`      | Runs ESLint analysis                                      |
| **Format**           | `npm run format`    | Formats code with Prettier                                |
| **Run Tests**        | `npm run test:run`  | Executes all 151 unit and component tests via Vitest      |
| **Test Watcher**     | `npm run test`      | Launches Vitest in interactive watch mode                 |
| **Production Build** | `npm run build`     | Compiles optimized production bundle with chunk splitting |
| **Preview Build**    | `npm run preview`   | Previews the production bundle locally                    |

---

## Test Coverage

The test suite covers:

- Safe LocalStorage persistence (quota simulation, corrupt JSON recovery, fallback defaults)
- Pure business services (stock balance constraints, unique SKU guards, in-use category protection)
- Yup validation schemas (boundary values, precision formatting, context-based duplicate checks)
- Selectors and Reducer state transitions
- CSV export formula sanitization
- Component-level interactions (Stock adjust dialog, live calculation, overselling warnings)

```sh
npm run test:run
# Test Files  15 passed (15)
# Tests       151 passed (151)
```
