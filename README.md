# zannat.me — WordPress Bug Fixer & Portfolio

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
Upload all files **except** `node_modules/` to your cPanel File Manager under `public_html` or a subdomain folder.

### Step 2 — Setup Node.js App in cPanel
1. Login to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Set:
   - **Node.js version:** 18.x or 20.x
   - **Application mode:** Production
   - **Application root:** `/home/<user>/public_html` (or wherever you uploaded)
   - **Application URL:** `zannat.me`
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
zannat.me/
├── server.js          # Express backend + API routes
├── app.js             # Client-side SPA controller
├── index.html         # Main HTML shell
├── style.css          # All styles
├── data.json          # JSON database (tickets, pages, users)
├── assets/            # Photos and images
├── package.json
└── .htaccess          # Apache SPA routing for cPanel
```

## 🔑 Admin Password
Username: `admin`  
Password: `zannatbugfix`  
(Change this in the Admin → Users panel after first login)
