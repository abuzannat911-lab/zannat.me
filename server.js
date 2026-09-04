const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 8080;
// Always resolve paths relative to this file, not the cPanel working directory
const DB_FILE = path.join(__dirname, 'data.json');

// Default seed fallback
const DEFAULT_DATA = {
    users: [{ username: "admin", password: "zannatbugfix" }],
    tickets: [],
    earnings: [
        { "month": "March", "amount": 25000 },
        { "month": "April", "amount": 32000 },
        { "month": "May", "amount": 45000 },
        { "month": "June", "amount": 55000 }
    ],
    bugTypes: [
        { "type": "Plugin Crash", "count": 0 },
        { "type": "WooCommerce", "count": 0 },
        { "type": "Malware/Security", "count": 0 },
        { "type": "Database/PHP", "count": 0 },
        { "type": "CSS/Theme", "count": 0 }
    ],
    homepageContent: {
        name: "Abu Zannat",
        title: "WordPress Specialist & Web Developer",
        avatar: "assets/photo1.jpg",
        about: "Hi, I am Abu Zannat, a WordPress expert specializing in resolving critical core bugs, plugin crashes, WooCommerce issues, database performance tuning, and server-side security hardening. I write clean PHP/JS fixes and optimize sites for speed and security."
    },
    pages: [],
    smtpConfig: {},
    invoices: [],
    clients: [],
    nextInvoiceNum: 1001,
    bankDetails: {
        bankName: "Eastern Bank PLC",
        accountName: "Abu Zannat",
        accountNumber: "1234567890",
        swiftCode: "EBLDBDDH",
        branch: "Rangpur Branch, Bangladesh"
    }
};

// Nodemailer dynamic transporter helper
function getTransporter() {
    const data = loadData();
    const config = data.smtpConfig || {};
    
    // Check if user has saved custom SMTP credentials
    if (config.user) {
        return nodemailer.createTransport({
            host: config.host || 'smtp.gmail.com',
            port: parseInt(config.port) || 587,
            secure: config.secure === true || config.secure === 'true',
            auth: {
                user: config.user,
                pass: config.pass
            }
        });
    }
    
    // Fallback to environment variables
    if (process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Fallback to local system sendmail binary
    return nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
    });
}

function logEmailSent(mailOptions) {
    const logPath = path.join(__dirname, 'sent_emails.log'); // __dirname ensures correct path on cPanel
    const logContent = `
========================================
TIMESTAMP: ${new Date().toISOString()}
TO: ${mailOptions.to}
FROM: ${mailOptions.from}
SUBJECT: ${mailOptions.subject}
BODY:
${mailOptions.text}
========================================
`;
    try {
        fs.appendFileSync(logPath, logContent, 'utf-8');
        console.log(`[EMAIL LOGGED] Email to ${mailOptions.to} logged in sent_emails.log`);
    } catch (e) {
        console.error('Failed to log email to file:', e.message);
    }
}

// Database helper functions
function loadData() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        let modified = false;
        if (!data.users) {
            data.users = JSON.parse(JSON.stringify(DEFAULT_DATA.users));
            modified = true;
        }
        if (!data.homepageContent) {
            data.homepageContent = JSON.parse(JSON.stringify(DEFAULT_DATA.homepageContent));
            modified = true;
        }
        if (!data.pages) {
            data.pages = [];
            modified = true;
        }
        if (!data.smtpConfig) {
            data.smtpConfig = {};
            modified = true;
        }
        if (!data.bankDetails) {
            data.bankDetails = JSON.parse(JSON.stringify(DEFAULT_DATA.bankDetails));
            modified = true;
        }
        if (modified) {
            saveData(data);
        }
        return data;
    } catch (e) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[HTTP REQUEST] ${req.method} ${req.url}`);
    next();
});

// POST Browser Logs
app.post('/api/logs', (req, res) => {
    console.error('[BROWSER ERROR]', req.body.message, '\nStack:', req.body.stack);
    res.json({ success: true });
});

// Handle cPanel subdirectory routing dynamically (e.g. /zannat.me/api/state -> /api/state)
app.use((req, res, next) => {
    const match = req.url.match(/^\/([^/]+.me|zannat[^/]*)(.*)/);
    if (match) {
        req.url = match[2] || '/';
    }
    next();
});

// GET State
app.get('/api/state', (req, res) => {
    try {
        const data = loadData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Login
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const data = loadData();
        const user = data.users.find(u => u.username === username && u.password === password);
        if (user) {
            res.json({ success: true, token: "zannat_secure_session_token_123" });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Tickets (Add Bug Ticket)
app.post('/api/tickets', (req, res) => {
    try {
        const { clientName, clientEmail, siteUrl, bugType, description, severity } = req.body;
        const data = loadData();

        const count = data.tickets.length + 1;
        const ticketId = `TKT-2026-${String(count).padStart(3, '0')}`;
        
        const newTicket = {
            id: ticketId,
            clientName,
            clientEmail,
            siteUrl,
            bugType,
            description,
            severity,
            status: "Pending",
            date: new Date().toISOString().split('T')[0],
            adminNotes: ""
        };

        data.tickets.push(newTicket);

        // Update bug type stats
        const typeStat = data.bugTypes.find(b => b.type === bugType);
        if (typeStat) {
            typeStat.count += 1;
        } else {
            data.bugTypes.push({ type: bugType, count: 1 });
        }

        saveData(data);

        // Send email alert to user email
        const mailOptions = {
            from: '"Zannat.me Support" <abuzannat911@gmail.com>',
            to: 'abuzannat911@gmail.com',
            subject: `[New Bug Fix Ticket] ${ticketId} - ${clientName}`,
            text: `
New Bug Fix Ticket Submitted:
----------------------------------------
Ticket ID: ${ticketId}
Date: ${newTicket.date}
Client Name: ${clientName}
Client Email: ${clientEmail}
Website URL: ${siteUrl}
Bug Category: ${bugType}
Severity: ${severity}

Description:
${description}
----------------------------------------
Check the admin portal at: http://localhost:8080/admin
`
        };

        getTransporter().sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Nodemailer error sending email:', err.message);
            } else {
                console.log('Email sent successfully:', info.messageId);
            }
            logEmailSent(mailOptions);
        });

        res.json({ success: true, ticketId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Ticket (Admin status/notes change)
app.post('/api/tickets/update', (req, res) => {
    try {
        const { id, status, adminNotes } = req.body;
        const data = loadData();

        const ticket = data.tickets.find(t => t.id === id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        if (status) ticket.status = status;
        if (adminNotes !== undefined) ticket.adminNotes = adminNotes;

        // If status changes to Resolved, log an earnings record for visual metrics (mock BDT 5000 per resolved ticket)
        if (status === "Resolved" && ticket.status !== "Resolved") {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonthName = months[new Date().getMonth()];
            const earnRecord = data.earnings.find(e => e.month === currentMonthName);
            if (earnRecord) {
                earnRecord.amount += 5000;
            } else {
                data.earnings.push({ month: currentMonthName, amount: 5000 });
            }
        }

        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Ticket
app.post('/api/tickets/delete', (req, res) => {
    try {
        const { id } = req.body;
        const data = loadData();

        const ticketIndex = data.tickets.findIndex(t => t.id === id);
        if (ticketIndex === -1) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        data.tickets.splice(ticketIndex, 1);
        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Backup Database
app.get('/api/backup', (req, res) => {
    try {
        res.download(DB_FILE, 'zannat_backup.json');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Restore Database
app.post('/api/restore', express.raw({ type: 'application/octet-stream', limit: '50mb' }), (req, res) => {
    try {
        fs.writeFileSync(DB_FILE, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Homepage Content
app.post('/api/homepage/update', (req, res) => {
    try {
        const { name, title, avatar, about } = req.body;
        const data = loadData();

        data.homepageContent = { name, title, avatar, about };
        saveData(data);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Custom Page
app.post('/api/pages', (req, res) => {
    try {
        const { title, slug, layout, content, oldSlug } = req.body;
        const data = loadData();

        if (!data.pages) data.pages = [];

        // Check if editing an existing page
        if (oldSlug) {
            const pageIndex = data.pages.findIndex(p => p.slug === oldSlug);
            if (pageIndex !== -1) {
                // Check if slug changed and is taken by another page
                if (slug !== oldSlug && data.pages.some(p => p.slug === slug)) {
                    return res.status(400).json({ error: "A page with this URL slug already exists." });
                }
                data.pages[pageIndex] = { title, slug, layout, content };
            } else {
                if (data.pages.some(p => p.slug === slug)) {
                    return res.status(400).json({ error: "A page with this URL slug already exists." });
                }
                data.pages.push({ title, slug, layout, content });
            }
        } else {
            if (data.pages.some(p => p.slug === slug)) {
                return res.status(400).json({ error: "A page with this URL slug already exists." });
            }
            data.pages.push({ title, slug, layout, content });
        }

        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Custom Page
app.post('/api/pages/delete', (req, res) => {
    try {
        const { slug } = req.body;
        const data = loadData();

        if (!data.pages) data.pages = [];

        const pageIndex = data.pages.findIndex(p => p.slug === slug);
        if (pageIndex === -1) {
            return res.status(404).json({ error: "Page not found." });
        }

        data.pages.splice(pageIndex, 1);
        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Admin User
app.post('/api/users', (req, res) => {
    try {
        const { username, password } = req.body;
        const data = loadData();

        if (!data.users) data.users = [];

        const userIndex = data.users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            data.users[userIndex].password = password;
        } else {
            data.users.push({ username, password });
        }

        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update SMTP Config
app.post('/api/smtp/update', (req, res) => {
    try {
        const { host, port, secure, user, pass } = req.body;
        const data = loadData();

        data.smtpConfig = {
            host: host || '',
            port: port || '',
            secure: secure === true || secure === 'true',
            user: user || '',
            pass: pass || ''
        };

        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Admin User
app.post('/api/users/delete', (req, res) => {
    try {
        const { username } = req.body;
        const data = loadData();

        if (!data.users) data.users = [];

        if (data.users.length <= 1) {
            return res.status(400).json({ error: "Cannot delete the only administrative user." });
        }

        const userIndex = data.users.findIndex(u => u.username === username);
        if (userIndex === -1) {
            return res.status(404).json({ error: "User not found." });
        }

        data.users.splice(userIndex, 1);
        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVOICE API ============
app.post('/api/invoices', (req, res) => {
    try {
        const data = loadData();
        if (!data.invoices) data.invoices = [];
        if (!data.clients) data.clients = [];
        if (!data.nextInvoiceNum) data.nextInvoiceNum = 1001;

        const invoiceData = req.body;

        // Auto-save/update client details into clients directory
        if (invoiceData.clientName && invoiceData.clientName.trim() !== '' && invoiceData.saveClient !== false) {
            const clientNameClean = invoiceData.clientName.trim();
            const clientEmailClean = (invoiceData.clientEmail || '').trim();
            
            let clientIdx = -1;
            if (clientEmailClean) {
                clientIdx = data.clients.findIndex(c => c.email && c.email.toLowerCase() === clientEmailClean.toLowerCase());
            }
            if (clientIdx === -1) {
                clientIdx = data.clients.findIndex(c => c.name && c.name.toLowerCase() === clientNameClean.toLowerCase());
            }

            const clientRecord = {
                id: clientIdx !== -1 ? data.clients[clientIdx].id : 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                name: clientNameClean,
                company: invoiceData.clientCompany || '',
                email: clientEmailClean,
                phone: invoiceData.clientPhone || '',
                vat: invoiceData.clientVat || '',
                address: invoiceData.clientAddress || '',
                updatedAt: new Date().toISOString()
            };

            if (clientIdx !== -1) {
                data.clients[clientIdx] = { ...data.clients[clientIdx], ...clientRecord };
            } else {
                clientRecord.createdAt = new Date().toISOString();
                data.clients.unshift(clientRecord);
            }
        }

        // Check for update (existing invoice)
        let existingIndex = -1;
        if (invoiceData.id) {
            existingIndex = data.invoices.findIndex(inv => inv.id === invoiceData.id);
        }

        if (existingIndex !== -1) {
            data.invoices[existingIndex] = { ...data.invoices[existingIndex], ...invoiceData, updatedAt: new Date().toISOString() };
            saveData(data);
            return res.json({ success: true, invoice: data.invoices[existingIndex], clients: data.clients });
        } else {
            const num = data.nextInvoiceNum;
            data.nextInvoiceNum++;
            const newInvoice = {
                ...invoiceData,
                id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                number: `INV-${num}`,
                createdAt: new Date().toISOString()
            };
            data.invoices.push(newInvoice);
            saveData(data);
            return res.json({ success: true, invoice: newInvoice, nextNum: data.nextInvoiceNum, clients: data.clients });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices/delete', (req, res) => {
    try {
        const { id } = req.body;
        const data = loadData();
        if (!data.invoices) data.invoices = [];
        data.invoices = data.invoices.filter(inv => inv.id !== id);
        saveData(data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CLIENTS API ============
app.get('/api/clients', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, clients: data.clients || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', (req, res) => {
    try {
        const data = loadData();
        if (!data.clients) data.clients = [];

        const clientData = req.body;
        if (!clientData.name || clientData.name.trim() === '') {
            return res.status(400).json({ error: 'Client name is required' });
        }

        let existingIndex = -1;
        if (clientData.id) {
            existingIndex = data.clients.findIndex(c => c.id === clientData.id);
        } else if (clientData.email && clientData.email.trim() !== '') {
            existingIndex = data.clients.findIndex(c => c.email && c.email.toLowerCase() === clientData.email.trim().toLowerCase());
        } else {
            existingIndex = data.clients.findIndex(c => c.name && c.name.toLowerCase() === clientData.name.trim().toLowerCase());
        }

        if (existingIndex !== -1) {
            data.clients[existingIndex] = {
                ...data.clients[existingIndex],
                ...clientData,
                updatedAt: new Date().toISOString()
            };
            saveData(data);
            return res.json({ success: true, client: data.clients[existingIndex], clients: data.clients });
        } else {
            const newClient = {
                ...clientData,
                id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                createdAt: new Date().toISOString()
            };
            data.clients.unshift(newClient);
            saveData(data);
            return res.json({ success: true, client: newClient, clients: data.clients });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients/delete', (req, res) => {
    try {
        const { id } = req.body;
        const data = loadData();
        if (!data.clients) data.clients = [];
        data.clients = data.clients.filter(c => c.id !== id);
        saveData(data);
        res.json({ success: true, clients: data.clients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ BANK DETAILS API ============
app.get('/api/bank-details', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, bankDetails: data.bankDetails || DEFAULT_DATA.bankDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bank-details', (req, res) => {
    try {
        const data = loadData();
        const { bankName, accountName, accountNumber, swiftCode, branch } = req.body;
        data.bankDetails = {
            bankName: (bankName || '').trim(),
            accountName: (accountName || '').trim(),
            accountNumber: (accountNumber || '').trim(),
            swiftCode: (swiftCode || '').trim(),
            branch: (branch || '').trim(),
            updatedAt: new Date().toISOString()
        };
        saveData(data);
        res.json({ success: true, bankDetails: data.bankDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Static Frontend Assets
app.use(express.static(__dirname));

// Serve SPA index.html for all other routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Zannat.me Developer Server running on port ${PORT}`);
});
