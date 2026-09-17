# Product Requirements Document (PRD): Rekap Uang Kas XI PPLG 2

## 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT

### Core Problem

The manual tracking of class treasury funds (_uang kas_) inherently leads to a loss of transparency, friction in auditing, and potential mistrust among students. Relying on physical ledger books or disjointed spreadsheet files results in human error, data loss, and an inability for students to verify fund usage in real-time.

### Project Objective

To architect and deploy a robust, secure, and transparent cash management web application that digitizes the class treasury workflow, providing immutable transaction tracking for the treasurer and real-time financial transparency for all students.

### Success Metrics & KPIs

- **System Accuracy**: 0% discrepancy between physical cash on hand and the system-calculated net balance.
- **Auditability**: 100% of outflows contain descriptive notes and correct categorization.
- **Student Engagement**: High read-only dashboard adoption by students to monitor class funds.
- **Efficiency**: 80% reduction in time spent by the treasurer generating financial reports and answering student balance inquiries.

---

## 2. USER PERSONAS & ROLE-BASED ACCESS CONTROL (RBAC)

### User Profiles

1. **Treasurer (`bendahara`)**: The system administrator. Responsible for logging all financial activities, making purchases, collecting dues, and generating reports. Requires a high-efficiency interface for rapid data entry.
2. **Student (`pelajar`)**: The end-user stakeholder. Requires frictionless, read-only access to verify how their contributions are being managed and spent.

### Permission Matrix

| Module / Action         |   `bendahara` (Treasurer)   | `pelajar` (Student)  |
| :---------------------- | :-------------------------: | :------------------: |
| **Authentication**      |   Login, Secure Register    | Login, Open Register |
| **Dashboard Metrics**   |          View All           |       View All       |
| **Transaction History** |          View All           |       View All       |
| **Transactions**        | Create, Update, Soft-Delete |     _No Access_      |
| **Categories**          |   Create, Update, Delete    |     _No Access_      |
| **Reports**             |      Export (CSV/PDF)       |     _No Access_      |

### Security Onboarding Mechanism

To prevent privilege escalation, registration as a `bendahara` is gated behind a server-side verified environment variable: `CLASS_TREASURER_KEY`.

- If a user registers with this exact key, they are assigned the `bendahara` role.
- All other registrations default strictly to the `pelajar` role.

---

## 3. DETAILED FUNCTIONAL REQUIREMENTS (FR)

### FR-1: Authentication & Session Management

- **Description**: Secure access control for treasurers and students.
- **Business Logic**:
  - Standard email/password authentication.
  - Multi-role registration (Key-gated).
  - Role-based route middleware (Redirects `pelajar` away from mutation endpoints with 403 Forbidden).
- **Acceptance Criteria (DoD)**:
  - Users can register, log in, and log out.
  - Session expires automatically after 2 hours of inactivity.
  - `pelajar` attempting to access `/transactions/create` are redirected to the dashboard.

### FR-2: Real-time Treasury Overview Dashboard

- **Description**: The primary landing view post-login displaying vital financial metrics.
- **Business Logic**:
  - **Total Inflow**: Sum of all `income` transactions.
  - **Total Outflow**: Sum of all `expense` transactions.
  - **Net Balance**: `Total Inflow` - `Total Outflow`.
- **Acceptance Criteria (DoD)**:
  - Dashboard instantly reflects the correct aggregations of non-deleted transactions.
  - Formatted using Indonesian Rupiah (IDR) localization (e.g., `Rp 1.500.000`).

### FR-3: Transaction Ledger Management

- **Description**: The core CRUD engine for class cash flow.
- **Business Logic**:
  - Fields: `type` (Enum: income/expense), `amount` (Positive Integer), `category_id`, `description` (String), `transaction_date` (Timestamp).
  - Validation: Amount must be > 0.
- **Acceptance Criteria (DoD)**:
  - Treasurer can create, edit, and soft-delete entries.
  - Soft-deletion removes the amount from Dashboard aggregations without destroying the database record.

### FR-4: Student Transparency Feed

- **Description**: A read-only transaction ledger for students.
- **Business Logic**:
  - Chronological list of transactions (Newest first).
  - Pagination (15 items per page).
  - Filters: Date range, Transaction Type, Category.
- **Acceptance Criteria (DoD)**:
  - Students can scroll through the entire transaction history seamlessly.
  - Filtering updates the feed without full page reloads (Inertia.js partial reloads).

---

## 4. DATABASE SCHEMA & DATA DICTIONARY

### Table: `users`

| Column       | Type                           | Constraints / Rules         |
| :----------- | :----------------------------- | :-------------------------- |
| `id`         | `BIGINT UNSIGNED`              | Primary Key, Auto-increment |
| `name`       | `VARCHAR(255)`                 | NOT NULL                    |
| `email`      | `VARCHAR(255)`                 | NOT NULL, UNIQUE            |
| `password`   | `VARCHAR(255)`                 | NOT NULL, Hashed            |
| `role`       | `ENUM('bendahara', 'pelajar')` | Default: `pelajar`          |
| `timestamps` | `TIMESTAMP`                    | `created_at`, `updated_at`  |

### Table: `categories`

| Column       | Type                        | Constraints / Rules                                  |
| :----------- | :-------------------------- | :--------------------------------------------------- |
| `id`         | `BIGINT UNSIGNED`           | Primary Key, Auto-increment                          |
| `name`       | `VARCHAR(255)`              | NOT NULL (e.g., "Iuran Mingguan", "Alat Kebersihan") |
| `type`       | `ENUM('income', 'expense')` | NOT NULL                                             |
| `timestamps` | `TIMESTAMP`                 | `created_at`, `updated_at`                           |

### Table: `transactions`

| Column             | Type                        | Constraints / Rules                   |
| :----------------- | :-------------------------- | :------------------------------------ |
| `id`               | `BIGINT UNSIGNED`           | Primary Key, Auto-increment           |
| `user_id`          | `BIGINT UNSIGNED`           | Foreign Key (`users.id`), Index       |
| `category_id`      | `BIGINT UNSIGNED`           | Foreign Key (`categories.id`), Index  |
| `type`             | `ENUM('income', 'expense')` | NOT NULL, Index                       |
| `amount`           | `DECIMAL(12, 2)`            | NOT NULL, Check (`amount > 0`)        |
| `description`      | `TEXT`                      | Nullable                              |
| `transaction_date` | `DATE`                      | NOT NULL, Index for sorting/filtering |
| `deleted_at`       | `TIMESTAMP`                 | Nullable, Enables Soft Deletes        |
| `timestamps`       | `TIMESTAMP`                 | `created_at`, `updated_at`            |

---

## 5. UI/UX ARCHITECTURE & COMPONENT SPECIFICATIONS

### Design System & Aesthetics

- **Aesthetic**: Clean, modern SaaS. Strict prohibition on generic 3D illustrations, claymorphism, and saturated gradients. Focus on high-contrast, data-dense, and highly legible interfaces.
- **Typography**:
  - Primary UI: **Plus Jakarta Sans** (Headings, buttons, labels).
  - Numerics: **JetBrains Mono** with `tabular-nums` enabled (Balances, transaction amounts, timestamps).
- **Color Tokens**:
  - Primary Accent: `bg-[#1E3A8A]` (Deep Navy)
  - Secondary Tone: `text-[#4B729F]` (Locker Blue)
  - CTA / Highlight: `bg-[#FACC15]` (Star Yellow)
  - Surface Tint: `bg-[#E0F2FE]` (Ice Blue - used for table headers/badges)
  - Background: `bg-[#F8FAFC]` (Neutral Slate Canvas)

### Page Architecture (Inertia/React)

1. `Welcome.jsx`: Minimalist landing page explaining the app's purpose.
2. `Auth/Login.jsx` & `Auth/Register.jsx`: Clean, centered card forms. Includes the hidden `Treasurer Key` input on the register tab.
3. `Dashboard/Index.jsx` (Treasurer): High-level metric cards, quick-add transaction modal trigger, and recent activity feed.
4. `KasSiswa.jsx` (Student View): Simplified metric cards and a robust, filterable data table.

### Component States

- **Loading**: Skeleton loaders mapping exact component dimensions (no generic spinners).
- **Empty States**: Minimalist SVG wireframe icons with clear "No transactions found" copy.
- **Destructive Actions**: Soft-deletes require a confirmation dialog modal with a red action button to prevent accidental data loss.

---

## 6. NON-FUNCTIONAL REQUIREMENTS (NFR)

### Security

- **CSRF Protection**: Native Laravel Sanctum/Inertia middleware handling.
- **SQL Injection**: Strict utilization of Laravel Eloquent ORM. No raw DB queries.
- **Rate Limiting**: `ThrottleRequests` middleware on `/login` and `/register` (Max 5 attempts per minute).

### Performance

- **N+1 Queries**: Eager load relationships (`Transaction::with(['user', 'category'])`).
- **Aggregations**: Database-level `SUM()` queries for dashboard metrics to avoid hydrating massive Eloquent collections.

### Responsiveness

- **Mobile-First**: The UI must be fully operational on viewports down to `320px`. The student transaction table should convert to stacked cards on mobile viewports for better readability.

---

## 7. EDGE CASES & BUSINESS RULES

- **Negative Balance Handling**: If a treasurer attempts to log an `expense` that exceeds the current `Net Balance`, the system **allows** the transaction but displays a non-blocking `[WARNING]` toast notification: _"Warning: This transaction results in a negative class balance."_
- **Zero/Negative Amounts**: Blocked at the Form Request validation layer (`'amount' => 'required|numeric|min:1'`).
- **Idempotency / Double Submissions**: UI submit buttons must strictly enforce `disabled={processing}` state upon click to prevent double POST requests over slow networks.

---

## 8. OUT OF SCOPE (v1.0 Bound Constraints)

To prevent feature creep, the following are strictly excluded from v1.0:

1. Automated Payment Gateway Integration (Midtrans, Xendit, etc.). All transactions are assumed to be settled manually/physically.
2. Multi-tenant / Multi-class support (This deployment is exclusively scoped for XI PPLG 2).
3. Automated WhatsApp/Email reminder bots for unpaid dues.
4. Per-student granular debt tracking (v1.0 tracks total class cash pool, not individual student "tabs").
