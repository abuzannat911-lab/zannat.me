# Release Notes — Zannat.bd

All notable changes and technical specifications for the official release of **Zannat.bd** (Version 1.0.0).

---

## 🚀 [v1.0.0] — Production Release for zannat.bd
*Release Date: September 21, 2026*

### 🌟 Overview
This release establishes **Zannat.bd** as a robust, secure, and production-ready portfolio, client management system, and emergency WordPress ticketing application. The architecture has transitioned to **100% pure MySQL database persistence**, removing all legacy flat files (`data.json`, `.sqlite`), while introducing automated zero-downtime deployment pipelines and multi-channel client communications (WhatsApp & Gmail).

---

### 🛡️ Security & Authentication
- **Secure Session Token Store**: Replaced client-accessible session tokens with server-side cryptographically secure persistent session authentication (`.sessions/sessions.json`).
- **Protected Administrative Endpoints**: Hardened all administrative API routes with `requireAdminAuth` middleware. Disallowed unauthenticated reads, writes, edits, and deletions across all resources (tickets, invoices, client records, settings, and OAuth credentials).
- **Static Asset Access Filter**: Added strict regular-expression path filtering blocking direct HTTP downloads of `.env`, `.sql`, `server.js`, `db.js`, `whatsapp.js`, `package.json`, and backup directory files.
- **CSRF & Rate Limiting**: Incorporated rate limiters on login attempts (`express-rate-limit`) and security header enforcement with `helmet`.
- **Credential Hashing**: Automatically migrates any legacy user passwords to secure `bcrypt` hashes upon initial startup.

---

### 🗄️ Database Architecture & Zero Data Loss
- **Pure MySQL Backend (`zannat_db`)**: The application connects to MySQL via connection pooling (`mysql2/promise`), ensuring lightning-fast concurrent operations.
- **Elimination of Local Data Files**: Completely purged all obsolete flat files (`data.json`, `zannat.sqlite`, `zannat.sqlite-shm`, `zannat.sqlite-wal`, `backup_zannat_db.sql`) to guarantee MySQL is the sole source of truth.
- **Non-Destructive Schema Auto-Migration**: The schema bootloader inspects and updates MySQL table columns dynamically using non-destructive `ADD COLUMN` queries. Existing data is never truncated or overwritten.
- **Backup & Restore Suite under Site Settings**:
  - **Instant Snapshot & Download**: Generate and download full JSON snapshots with 1 click.
  - **Upload & Restore**: Upload external backup JSON files to restore the MySQL database, protected by an automatic pre-restore safety snapshot.
  - **Daily Auto-Backup & 30-Day Retention**: Automated background scheduler executes backups every 24 hours and automatically purges backups older than 30 days.
  - **Interactive Backup Browser**: View dates, file sizes, and restore directly from any historical daily backup.

---

### 🌐 Domain & Branding Standardization (`zannat.bd`)
- **Primary Domain**: Unified all URLs, metadata, and routing to **`zannat.bd`**.
- **Frontend Branding**: Updated public navigation bar, admin sidebar branding, copyright notices (`© 2026 Zannat.bd`), admin login modal, and dynamic subpage links (`zannat.bd/my-setup`).
- **cPanel Dynamic Subdirectory Routing**: Configured server middleware to transparently normalize cPanel folder prefixes (such as `/zannat.bd/...`) so that all REST API calls and SPA assets route accurately without 404s.

---

### 💬 Multi-Channel Automated Notifications
- **WhatsApp Web Integration (@whiskeysockets/baileys)**:
  - Supports live QR code pairing from the Admin Portal.
  - Multi-device persistent auth keys stored securely in `whatsapp_auth/`.
  - Instant WhatsApp confirmation messages dispatched to clients upon submitting tickets and when ticket status changes (e.g., In Progress, Resolved).
  - Direct alert notifications dispatched to the admin's personal WhatsApp.
- **Gmail OAuth 2.0 & SMTP**:
  - Dual-mode email engine supporting both direct Google OAuth 2.0 and standard SMTP/App passwords.
  - Live test email delivery verification with HTML diagnostics.

---

### 🧾 Invoicing & PDF Engine
- **Commercial Vector PDF Invoicing**: High-fidelity vector PDF generation built with `pdfkit`, producing compliant international invoices for non-US independent contractors with W-8BEN and EU Reverse Charge documentation notes.
- **Instant Client Sharing**: Direct one-click sharing of commercial invoices and PDF links to clients via WhatsApp and customized email templates.

---

### 🔄 Deployment & Safe Updater
- **One-Command Updater (`update.sh`)**:
  - Automatically takes a pre-update safety backup of MySQL state.
  - Pulls the latest commits from `origin/main` (`zannat.bd`).
  - Updates production dependencies cleanly.
  - Runs idempotent database schema migrations.
  - Signals Phusion Passenger / PM2 for zero-downtime hot reload.
