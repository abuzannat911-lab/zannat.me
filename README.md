# zannat.bd — WordPress Bug Fixer & Portfolio

Personal portfolio and client ticketing system for Abu Zannat — WordPress specialist.

## 🚀 Local Development

```bash
npm install
npm start
# Visit http://localhost:8080
```

**Admin Login:** `admin` / `zannatbugfix`

## 🌐 cPanel Deployment (Node.js App)

### Step 1 — Upload files
Upload all files **except** `node_modules/` to your cPanel File Manager under `public_html` or your domain directory.

### Step 2 — Setup Node.js App in cPanel
1. Login to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Set:
   - **Node.js version:** 18.x or 20.x
   - **Application mode:** Production
   - **Application root:** `/home/<user>/public_html` (or your domain directory)
   - **Application URL:** `zannat.bd`
   - **Application startup file:** `server.js`
4. Click **Create**

### Step 3 — Install dependencies
In the Node.js App panel, click **Run NPM Install** (or SSH: `npm install --production`)

### Step 4 — Start the app
Click **Start App** in the Node.js App panel.

### Step 5 — .htaccess routing (SPA support)
Create/update `.htaccess` in the same directory with the contents already included in this repo.

---

## 📁 File Structure

```
zannat.bd/
├── server.js          # Express backend + API routes
├── app.js             # Client-side SPA controller
├── db.js              # MySQL schema migrations, connection pool & models
├── index.html         # Main HTML shell
├── style.css          # Core design system and styles
├── invoice_pdf.js     # Vector PDF generator for invoices
├── whatsapp.js        # Baileys WhatsApp client & notification engine
├── update.sh          # Zero-downtime safe deployment script
├── RELEASE_NOTES.md   # Detailed release changelog
├── assets/            # Logos, photos, and public assets
├── package.json       # Dependencies & scripts
└── .htaccess          # Apache SPA routing for cPanel
```

## 📋 Release Notes
See [RELEASE_NOTES.md](RELEASE_NOTES.md) for full details on version 1.0.0 features, security hardening, and architecture improvements.

## 🔑 Admin Password
Username: `admin`  
Password: `zannatbugfix`  
(Change this in the Admin → Users panel after first login)
