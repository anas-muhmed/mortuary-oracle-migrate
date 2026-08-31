# MOSC Mortuary Management System

A premium, comprehensive, web-based management system designed for **MOSC Medical College, Kolenchery**. This application streamlines mortuary operations, including body registration, cabin allocation, automated billing, body release workflows, housekeeping management, and detailed analytical reporting.

---

## 🌟 Key Features

### 🔑 Role-Based Access Control (RBAC)
The system supports three user roles, each with custom dashboards and operations:
*   **System Administrator**: Manages master configurations (Cabins, Services, Concession Authorities), views reports, and registers staff.
*   **Mortuary Staff (M Staff)**: Handles body registration, cabin allocation, billing generation, bill settlement, and body release verification.
*   **Housekeeping Staff**: Manages cleaning status of cabins, transitioning them from "needs cleaning" to "available" after verification.

### 🏢 Cabin Master & Grid Browser
*   Dynamic grid showing cabin status color-coded:
    *   🟢 **Green**: Available
    *   🔴 **Red**: Occupied
    *   🟡 **Yellow**: Needs Cleaning (Housekeeping pending)
    *   ⚫ **Grey**: Under Maintenance / Deactivated
*   Supports freezer vs. normal cabin types, floor levels, and customizable tariffs.

### 📝 Body Registration
*   **With Hospital Number**: Auto-loads inpatient/outpatient data.
*   **Without Hospital Number**: For outside bodies with manual field entries.
*   MLC (Medico-Legal Case) vs. Non-MLC options.
*   Double witness details capture, reasons of death, and support for document uploads.

### 💳 Automated Billing & Concessions
*   Automatic calculations based on actual days of stay and cabin daily rates.
*   Optional services (e.g., body dressing, embalming) added dynamically.
*   Integration with **Concession Authorities** to approve discounts at settlement.
*   Clean printable invoice layouts using `html2pdf.js`.

### 🛡️ Secure Body Release
*   Strict validation: Bodies can only be released if the invoice status is **Settled**.
*   **Non-MLC Cases**: Captures relationship details, contact numbers, and NOC uploads.
*   **MLC Cases**: Requires Police Station details, Sub-Inspector (SI) name, and NOC document uploads.

### 🧹 Automated Housekeeping Lifecycle
1.  **Release Trigger**: Releasing a body flags the occupied cabin as `NEEDS_CLEANING`.
2.  **Task Creation**: A pending housekeeping task is generated automatically.
3.  **Housekeeping View**: Housekeeping staff assigns the task to themselves and marks it completed.
4.  **Staff Verification**: Mortuary staff verifies the cleanliness, shifting the cabin status back to `Available`.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance SPA frontend |
| **Routing** | React Router DOM v6 | Multi-role routing structure |
| **Styling** | Tailwind CSS | Sleek, modern interface styled using utility classes |
| **Charts & Icons** | Recharts, Lucide React | Clean analytics visualization and iconography |
| **PDF Generation** | html2pdf.js | Exports invoices directly to PDF |
| **Backend API** | Node.js, Express | RESTful API server with file upload capabilities |
| **Database** | Oracle Database | Oracle schema with relational modeling |
| **Security** | bcrypt | Secure password hashing for staff and administrators |
| **File Uploads** | Multer | Handles image and PDF uploads for legal documents |

---

## 📂 Project Directory Structure

```text
mortuary-management-system/
├── public/                 # Static public assets
├── uploads/                # Directory for uploaded documents (NOC, legal docs)
├── src/                    # React frontend source code
│   ├── components/         # Reusable React components
│   │   └── release/        # Release components
│   │       └── BodyReleaseForm.jsx # Reusable form for releasing a body
│   ├── pages/              # Frontend pages
│   │   ├── admin_dashboard.jsx     # Admin-specific stats and overview
│   │   ├── admin_register.jsx      # Admin account creation
│   │   ├── adminlogin.jsx          # Admin authentication
│   │   ├── BillPrint.jsx           # Printable invoice layout
│   │   ├── Billing.jsx             # Mortuary billing & invoice management
│   │   ├── BodyRegistration.jsx    # Registering new bodies
│   │   ├── BodyRelease.jsx         # Verification & releasing bodies
│   │   ├── CabinAllocation.jsx     # Interactive cabin browser & allocation
│   │   ├── CabinMaster.jsx         # CRUD management for cabins
│   │   ├── Dashboard.jsx           # Staff main dashboard overview
│   │   ├── dashboard_base.jsx      # Layout shell with sidebar navigation
│   │   ├── housekeeping.jsx        # Mortuary staff side housekeeping verification
│   │   ├── HousekeepingDashboard.jsx # Dashboard for housekeeping staff
│   │   ├── PatientList.jsx         # Searchable list of registered bodies
│   │   ├── Reports.jsx             # Concession, cabin occupancy, invoice analysis reports
│   │   ├── ServiceMaster.jsx       # CRUD management for additional services
│   │   ├── signin.jsx              # Staff authentication portal
│   │   ├── staff_housekeeping.jsx  # Small stub/component for housekeeping staff
│   │   └── user_register.jsx       # Staff account registration
│   ├── App.jsx             # Routing configuration and layout setup
│   ├── index.css           # Global stylesheet and Tailwind setup
│   └── main.jsx            # Entry point for React
├── index.html              # Frontend HTML shell template
├── migrate.js              # Database migration (releases table schema update)
├── migrate2.js             # Database migration (drops invoice triggers)
├── migrate3.js             # Database migration (adds serviceId, service_master table)
├── package.json            # Node project configuration and package dependencies
├── postcss.config.js       # CSS processing configuration for Tailwind
├── server.js               # Main Express.js server & database initialization
├── tailwind.config.js      # Tailwind styling framework configuration
└── vite.config.js          # Vite build tool configurations
```

---

## 🗄️ Database Schema

The server initializes the application-owned Oracle tables on start-up from `oracle-schema.sql`; the Oracle user/schema itself must already exist. Here is the relational schema overview:

### 1. `users` (Staff Accounts)
*   `id`: Externally managed Oracle primary key (the application assumes a numeric ID)
*   `full_name`: `VARCHAR(255) NOT NULL`
*   `employee_id`: `VARCHAR(100) UNIQUE NOT NULL`
*   `department`: `VARCHAR(100) NOT NULL` (Mapped as the staff role: `"M Staff"` or `"House Keeping"`)
*   `phone1`: `VARCHAR(20)`
*   `phone2`: `VARCHAR(20)`
*   `email`: `VARCHAR(150) UNIQUE NOT NULL`
*   `password`: `VARCHAR(255) NOT NULL` (hashed)

### 2. `admin` (System Administrators)
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `username`: `VARCHAR(100) UNIQUE NOT NULL`
*   `email`: `VARCHAR(150)`
*   `password`: `VARCHAR(255) NOT NULL` (hashed)
*   `role`: `VARCHAR(50) DEFAULT 'Admin'`
*   `status`: `VARCHAR(50) DEFAULT 'Active'`

### 3. `cabins`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `cabinNumber`: `VARCHAR(50) UNIQUE NOT NULL`
*   `status`: `VARCHAR(50) DEFAULT 'Available'` (`"Available"`, `"Occupied"`, `"NEEDS_CLEANING"`, `"Under Maintenance"`, `"Deactivated"`)
*   `tariff`: `DECIMAL(10,2) DEFAULT 500.00`
*   `daily_rate`: `DECIMAL(10,2) DEFAULT 500.00`
*   `floor`: `INT DEFAULT 1`
*   `cabin_type`: `VARCHAR2(20)` with an Oracle `CHECK` constraint for `FREEZER` or `NORMAL_CABIN`

### 4. `bodies`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `bodyNumber`: `VARCHAR(50) UNIQUE NOT NULL` (Auto-generated format: `MOSC-YYYY-XXXX`)
*   `bodyType`: `VARCHAR(50) NOT NULL` (`"MLC"`, `"Non-MLC"`)
*   `hospitalNumber`: `VARCHAR(100)` (NULL if outside body)
*   `patientName`: `VARCHAR(255)`
*   `gender`: `VARCHAR(20)`
*   `age`: `INT`
*   `locality`: `VARCHAR(255)`
*   `dateOfDeath`: `VARCHAR(50)`
*   `timeOfDeath`: `VARCHAR(50)`
*   `declaredBy`: `VARCHAR(255)`
*   `reasonOfDeath`: `CLOB`
*   `deathIntimationNo`: `VARCHAR(100)`
*   `mlcNo`: `VARCHAR(100)`
*   `estimatedDaysOfStay`: `INT`
*   `witness1Name`: `VARCHAR2(255)`, `witness1Address`: `CLOB`, `witness1Contact`: `VARCHAR2(50)`
*   `witness2Name`: `VARCHAR2(255)`, `witness2Address`: `CLOB`, `witness2Contact`: `VARCHAR2(50)`
*   `billing_status`: `VARCHAR(50) DEFAULT 'PENDING'` (`"PENDING"`, `"GENERATED"`, `"SETTLED"`)
*   `status`: `VARCHAR(50) DEFAULT 'Registered'` (`"Registered"`, `"Allocated"`, `"RELEASED"`)

### 5. `cabin_allocations`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `bodyId`: `VARCHAR(36) NOT NULL` (FK)
*   `cabinId`: `VARCHAR(36) NOT NULL` (FK)
*   `admissionDateTime`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
*   `releaseDateTime`: `TIMESTAMP NULL`
*   `estimatedReleaseDateTime`: `TIMESTAMP NULL`
*   `advanceAmount`: `REAL DEFAULT 0`
*   `hourlyRate`: `REAL DEFAULT 50` (Repurposed to store `daily_rate`)
*   `minHours`: `INT DEFAULT 1`
*   `freeHours`: `INT DEFAULT 0`
*   `status`: `VARCHAR(50) DEFAULT 'Allocated'` (`"Allocated"`, `"Released"`)

### 6. `service_master`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `service_name`: `VARCHAR(255) NOT NULL`
*   `tariff`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`

### 7. `billing`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `bodyId`: `VARCHAR(36) NOT NULL` (FK)
*   `cabinAllocationId`: `VARCHAR(36)` (FK)
*   `totalAmount`: `REAL DEFAULT 0` (Cabin charge)
*   `discountAmount`: `REAL DEFAULT 0`
*   `discountReason`: `CLOB`
*   `concessionAuthorityId`: `VARCHAR(36)` (FK)
*   `servicesAmount`: `REAL DEFAULT 0` (Total of extra services)
*   `netAmount`: `REAL DEFAULT 0` (`totalAmount - discountAmount + servicesAmount`)
*   `status`: `VARCHAR(50) DEFAULT 'Pending'` (`"Pending"`, `"Settled"`)
*   `settledAt`: `TIMESTAMP NULL`

### 8. `billing_services`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `billingId`: `VARCHAR(36) NOT NULL` (FK)
*   `serviceId`: `VARCHAR(36)` (FK)
*   `serviceName`: `VARCHAR(255) NOT NULL`
*   `amount`: `REAL NOT NULL`

### 9. `body_releases`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `bodyId`: `VARCHAR(36) NOT NULL` (FK)
*   `releaseType`: `VARCHAR(50) NOT NULL` (`"NON_MLC"`, `"MLC"`)
*   `takenBy`: `VARCHAR(255)`
*   `relationship`: `VARCHAR(100)`
*   `address`: `CLOB`
*   `contactNumber`: `VARCHAR(50)`
*   `policeStation`: `VARCHAR(255)` (For MLC cases)
*   `siName`: `VARCHAR(255)` (For MLC cases)
*   `nocDocument`: `CLOB` (File path link)
*   `legalDocuments`: `CLOB` (File path link)
*   `releaseDateTime`: `TIMESTAMP`

### 10. `housekeeping_tasks`
*   `id`: `VARCHAR(36) PRIMARY KEY`
*   `cabinId`: `VARCHAR(36) NOT NULL` (FK)
*   `status`: `VARCHAR(50) DEFAULT 'PENDING'` (`"PENDING"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"VERIFIED"`)
*   `assignedTo`: `VARCHAR(255) DEFAULT NULL`

---

## 📡 API Endpoints

### 🔐 Authentication Module
*   `POST /api/user_register` - Register a new staff member.
*   `POST /api/login` - Staff login (matches `employee_id` and role).
*   `POST /api/admin/register` - Create an admin account.
*   `POST /api/admin/login` - Admin login (matches `username`).

### 🛏️ Cabin Master Module
*   `GET /api/cabins` - Fetch all cabins.
*   `POST /api/cabins` - Create a new cabin.
*   `PUT /api/cabins/:id` - Update cabin number, floor, type, status, and rates.
*   `DELETE /api/cabins/:id` - Mark cabin as deactivated.

### 📝 Body Registration Module
*   `GET /api/bodies` - Fetch registered bodies (supports `status`, `bodyType`, and `search` query filters).
*   `GET /api/bodies/:id` - Fetch details of a body including its cabin allocation and billing status.
*   `POST /api/bodies` - Register a new body (generates unique `bodyNumber` prefix `MOSC-YYYY-`).
*   `PUT /api/bodies/:id` - Edit registration parameters.
*   `DELETE /api/bodies/:id` - Deletes a registered body (only if it has no active allocations).

### 🏷️ Cabin Allocation Module
*   `POST /api/cabin-allocations` - Allocate an available cabin to a registered body. Sets cabin status to `"Occupied"`.
*   `GET /api/cabin-allocations` - Fetch allocations (filter by `status`).
*   `GET /api/cabin-allocations/:id/calculate` - Dynamically calculates stay duration (days) and costs.
*   `PUT /api/cabin-allocations/:id/release` - Validates settled bills and marks the allocation as released.

### 💳 Billing Module
*   `GET /api/billing` - Get invoice listings.
*   `GET /api/billing/:id/full` - Fetch the full invoice details (body info, cabin charges, and additional services) for printing.
*   `POST /api/billing/generate` - Generates a pending bill, records service charges, and flags the body's billing status as `"GENERATED"`.
*   `POST /api/billing/settle` - Settles the bill, flags billing status as `"SETTLED"`.

### 🛡️ Body Release Module
*   `POST /api/body-releases` - Submits a body release form, uploads NOC/legal certificates, updates body status to `"RELEASED"`, shifts cabin to `"NEEDS_CLEANING"`, and creates a pending housekeeping task.
*   `GET /api/body-releases/:bodyId` - Fetch release records for a body.

### 🧹 Housekeeping Module
*   `GET /api/housekeeping/tasks` - Fetch all cleaning tasks.
*   `POST /api/housekeeping/assign` - Assign a task to a housekeeping staff member (shifts status to `"IN_PROGRESS"`).
*   `POST /api/housekeeping/complete` - Mark cabin cleaning as done (shifts status to `"COMPLETED"`).
*   `POST /api/housekeeping/verify` - Mortuary staff confirms cleanliness (shifts status to `"VERIFIED"`, and resets the cabin back to `"Available"`).

### 📈 Reports & Analytics Module
*   `GET /api/reports/cabin-occupancy` - Stats on active/released allocations and MLC vs. Non-MLC cases.
*   `GET /api/reports/invoice-analysis` - Revenue statistics, discounts given, and pending invoices.
*   `GET /api/reports/concession` - Tracks discounts, listing approval reasons and the approving Concession Authority.

---

## 🚀 Installation & Getting Started

### 📋 Prerequisites
*   [Node.js](https://nodejs.org/) (v16.x or higher)
*   [Oracle Database](https://www.oracle.com/database/) 19c or later (or an Oracle-compatible managed service)

### 💻 Step-by-Step Setup

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd mortuary-management-system
    ```

2.  **Configure Oracle**
    Create an Oracle schema user with privileges to create tables and triggers, then apply `oracle-schema.sql` as that user (for example, `sqlplus user/password@host:1521/service @oracle-schema.sql`). Configure the server with environment variables; do not put credentials in source files:
    ```powershell
    $env:ORACLE_DB_USER = 'mortuary_app'
    $env:ORACLE_DB_PASSWORD = 'replace-with-a-secret'
    $env:ORACLE_DB_CONNECT_STRING = 'localhost:1521/FREEPDB1'
    # Optional: ORACLE_POOL_MIN, ORACLE_POOL_MAX, ORACLE_POOL_INCREMENT
    ```
    The `users` table is intentionally not created by this project. Before using staff registration/login, provide it in this schema with the columns queried by `server.js`: `id`, `full_name`, `employee_id`, `department`, `phone1`, `phone2`, `email`, `password`, `approval_status`, `admin_remarks`, `created_at`, and `updated_at`. `id` must be generated by the external table definition (for example an Oracle identity column). Its exact ownership/schema is application-specific and has not been guessed.

3.  **Install Dependencies**
    ```bash
    npm install
    ```

4.  **Database Seeding**
    Start the server after applying `oracle-schema.sql`. It idempotently verifies the application tables and seeds 10 default cabins (`CAB-001` to `CAB-010`), the two body types, default billing settings, and Body Dressing service. The legacy `migrate*.js` scripts are retained only as notices; their MySQL-only changes are consolidated into `oracle-schema.sql`.

5.  **Start the Application**
    Run the development environment (concurrently launches Express server on port `3001` and Vite on port `5173` or similar):
    ```bash
    npm run dev
    ```

6.  **Access the System**
    *   **Staff Portal**: Open `http://localhost:5173` in your browser. Create a staff account (M Staff / House Keeping) by clicking "Create an account".
    *   **Admin Portal**: Open `http://localhost:5173/admin` to log in as administrator or register via `http://localhost:5173/admin_register`.

---

## 🗃️ Legacy Files Notice
*   `mortuary.db`: A leftover SQLite database from earlier prototype versions. It is not used.

---
*Created for MOSC Medical College, Kolenchery.*
