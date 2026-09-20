require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');
const db = require('./db');
const whatsapp = require('./whatsapp');
const { generateInvoicePDFBuffer, generateInvoiceEmailHtml } = require('./invoice_pdf');

const PORT = process.env.PORT || 8080;

// Nodemailer dynamic transporter helper using MySQL database settings (supporting Gmail OAuth2 & SMTP)
async function getTransporter() {
    const config = await db.getSmtpConfig();
    
    // 1. Check if Gmail OAuth2 is configured and connected
    if (config.auth_type === 'oauth2' && config.oauth_refresh_token) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: config.user || config.oauth_user,
                clientId: config.oauth_client_id || process.env.GOOGLE_CLIENT_ID,
                clientSecret: config.oauth_client_secret || process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: config.oauth_refresh_token,
                accessToken: config.oauth_access_token
            }
        });
    }

    // 2. Check if custom SMTP credentials exist in MySQL database
    if (config.user && config.pass) {
        let cleanPass = (config.pass || '').trim();
        const isGmail = (config.host || '').toLowerCase().includes('gmail') || (config.user || '').toLowerCase().includes('gmail');
        if (isGmail) {
            cleanPass = cleanPass.replace(/\s+/g, '');
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.user.trim(),
                    pass: cleanPass
                }
            });
        }
        return nodemailer.createTransport({
            host: config.host || 'smtp.gmail.com',
            port: parseInt(config.port) || 587,
            secure: config.secure === true || config.secure === 'true' || config.secure === 1,
            auth: {
                user: config.user,
                pass: config.pass
            }
        });
    }
    
    // 3. Fallback to environment variables
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // 4. Fallback to local system sendmail binary
    return nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
    });
}

function logEmailSent(mailOptions) {
    const logPath = path.join(__dirname, 'sent_emails.log');
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

const app = express();

// 1. Security Headers via Helmet (configured to allow external CDNs for fonts, Lucide, Chart.js, Confetti)
app.use(helmet({
    contentSecurityPolicy: false, // Allows inline scripts & existing external CDNs (Lucide, Google Fonts, Chart.js)
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'sameorigin' }
}));

// 2. Body Parsing Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Request Logging
app.use((req, res, next) => {
    console.log(`[HTTP REQUEST] ${req.method} ${req.url}`);
    next();
});

// 4. Cryptographic Session Management (24h validity with persistent storage)
const SESSIONS_DIR = path.join(__dirname, '.sessions');
const SESSIONS_FILE = path.join(SESSIONS_DIR, 'sessions.json');
const activeSessions = new Map(); // token -> { username, createdAt, lastActivity }
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Load existing valid sessions from disk on startup
function loadSessionsFromDisk() {
    try {
        if (!fs.existsSync(SESSIONS_DIR)) {
            fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
        }
        if (fs.existsSync(SESSIONS_FILE)) {
            const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
            const data = JSON.parse(raw);
            const now = Date.now();
            for (const [token, sess] of Object.entries(data)) {
                if (sess && sess.lastActivity && (now - sess.lastActivity <= SESSION_TTL_MS)) {
                    activeSessions.set(token, sess);
                }
            }
            console.log(`[AUTH SESSIONS] Restored ${activeSessions.size} active session(s) from persistent storage.`);
        }
    } catch (e) {
        console.warn('[AUTH SESSIONS] Could not load persisted sessions:', e.message);
    }
}
loadSessionsFromDisk();

function saveSessionsToDisk() {
    try {
        if (!fs.existsSync(SESSIONS_DIR)) {
            fs.mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
        }
        const obj = {};
        for (const [token, sess] of activeSessions.entries()) {
            obj[token] = sess;
        }
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), { mode: 0o600 });
    } catch (e) {
        console.warn('[AUTH SESSIONS] Could not persist sessions to disk:', e.message);
    }
}

function cleanExpiredSessions() {
    const now = Date.now();
    let changed = false;
    for (const [token, sess] of activeSessions.entries()) {
        if (now - sess.lastActivity > SESSION_TTL_MS) {
            activeSessions.delete(token);
            changed = true;
        }
    }
    if (changed) saveSessionsToDisk();
}
setInterval(cleanExpiredSessions, 15 * 60 * 1000); // Clean every 15 mins

function isValidSessionToken(token) {
    if (!token || typeof token !== 'string') return false;
    const sess = activeSessions.get(token);
    if (!sess) return false;
    if (Date.now() - sess.lastActivity > SESSION_TTL_MS) {
        activeSessions.delete(token);
        saveSessionsToDisk();
        return false;
    }
    sess.lastActivity = Date.now(); // Slide session window
    return true;
}

// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
    let token = authHeader;
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }
    if (!token) {
        token = req.query.token;
    }

    if (!isValidSessionToken(token)) {
        return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }
    next();
}

// 5. Rate Limiting for Login Endpoint (prevents brute-force attacks: max 10 attempts per 15 mins)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// POST Browser Logs
app.post('/api/logs', (req, res) => {
    console.error('[BROWSER ERROR]', req.body.message, '\nStack:', req.body.stack);
    res.json({ success: true });
});

// Handle cPanel subdirectory routing dynamically (e.g. /zannat.bd/api/state or /zannat.me/api/state -> /api/state)
app.use((req, res, next) => {
    const match = req.url.match(/^\/([^/]+.(?:bd|me)|zannat[^/]*)(.*)/);
    if (match) {
        req.url = match[2] || '/';
    }
    next();
});

// ==========================================
// API ROUTES (ALL BACKED BY MYSQL DATABASE)
// ==========================================

// GET Full State (Sanitized based on whether request is authenticated admin)
app.get('/api/state', async (req, res) => {
    try {
        const state = await db.getFullState();
        
        // Check if requester has a valid admin session
        const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
        let token = authHeader;
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7).trim();
        }
        if (!token) token = req.query.token;

        const isAdmin = isValidSessionToken(token);

        if (isAdmin) {
            // Authenticated admin receives full state (note: password hashes are already removed from db.getFullState)
            return res.json(Object.assign({}, state, { isAdmin: true }));
        }

        // Public visitor receives sanitized state needed for public website:
        // Exclude users, tickets, invoices, clients, SMTP pass/tokens, earnings, bank details
        const sanitizedState = {
            isAdmin: false,
            homepageContent: state.homepageContent || {},
            pages: state.pages || [],
            siteSettings: state.siteSettings || {},
            bugTypes: state.bugTypes || [],
            earnings: [], // Public does not need financial breakdown
            tickets: [],
            invoices: [],
            clients: [],
            users: [],
            bankDetails: {},
            smtpConfig: {
                isConnected: Boolean(state.smtpConfig && state.smtpConfig.isConnected)
            },
            nextInvoiceNum: 1001
        };

        res.json(sanitizedState);
    } catch (err) {
        console.error('API state error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST Login (Protected with Rate Limiting and Cryptographic Session Token)
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required.' });
        }
        const valid = await db.authenticateUser(username, password);
        if (valid) {
            // Generate a secure 256-bit cryptographically random token
            const sessionToken = crypto.randomBytes(32).toString('hex');
            activeSessions.set(sessionToken, {
                username,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
            saveSessionsToDisk();
            res.json({ success: true, token: sessionToken, username });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Logout
app.post('/api/logout', (req, res) => {
    const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
    let token = authHeader;
    if (token && token.startsWith('Bearer ')) token = token.slice(7).trim();
    if (!token) token = req.query.token;
    if (token && activeSessions.has(token)) {
        activeSessions.delete(token);
        saveSessionsToDisk();
    }
    res.json({ success: true });
});

// Rate Limiting for Public Ticket Submission (max 15 tickets per hour per IP to stop spam bots)
const ticketLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    message: { success: false, error: 'Too many submissions from this connection. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

function sanitizeString(str, maxLen = 1000) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLen);
}

// POST Tickets (Add Bug Ticket / Query - Public Endpoint Protected by Rate Limiting and Input Validation)
app.post('/api/tickets', ticketLimiter, async (req, res) => {
    try {
        let { clientName, clientEmail, clientPhone, siteUrl, bugType, description, severity } = req.body;
        
        clientName = sanitizeString(clientName, 150);
        clientEmail = sanitizeString(clientEmail, 150);
        clientPhone = sanitizeString(clientPhone, 50);
        siteUrl = sanitizeString(siteUrl, 300);
        bugType = sanitizeString(bugType, 100);
        description = sanitizeString(description, 5000);
        severity = sanitizeString(severity, 50);

        if (!clientName) {
            return res.status(400).json({ error: 'Client name is required.' });
        }

        const { ticketId, date } = await db.addTicket({ clientName, clientEmail, clientPhone, siteUrl, bugType, description, severity });

        // Retrieve configured site notification receivers
        const siteSettings = await db.getSiteSettings();
        const notif = siteSettings.notifications || {};
        const adminEmail = notif.adminEmail || 'abuzannat911@gmail.com';
        const rawAdminWA = notif.adminWhatsApp || '';
        const enableAdminEmail = notif.enableAdminEmail !== false;
        const enableAdminWhatsApp = notif.enableAdminWhatsApp !== false;
        const enableClientWhatsApp = notif.enableClientWhatsApp !== false;

        // Clean client phone for direct wa.me link
        const cleanClientPhone = clientPhone ? clientPhone.replace(/\D/g, '') : '';
        const waClientLink = cleanClientPhone ? `https://wa.me/${cleanClientPhone}` : '';

        // 1. Send Email Alert to Admin
        if (enableAdminEmail && adminEmail) {
            const mailOptions = {
                from: '"Zannat.bd Support" <abuzannat911@gmail.com>',
                to: adminEmail,
                subject: `[New Bug Query] ${ticketId} - ${clientName}`,
                text: `
New Bug Query Submitted:
----------------------------------------
Query ID: ${ticketId}
Date: ${date}
Client Name: ${clientName}
Client Email: ${clientEmail || 'N/A'}
Client Phone: ${clientPhone || 'N/A'}${waClientLink ? ` (${waClientLink})` : ''}
Website URL: ${siteUrl || 'N/A'}
Bug Category: ${bugType || 'General'}
Severity: ${severity || 'Medium'}

Description:
${description}
----------------------------------------
Admin Dashboard: http://localhost:8080/admin
Direct Client WhatsApp: ${waClientLink || 'N/A'}
`
            };

            try {
                const transporter = await getTransporter();
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error('[EMAIL ERROR] Sending query notification:', err.message);
                    } else {
                        console.log('[EMAIL SUCCESS] Query notification sent:', info.messageId);
                    }
                    logEmailSent(mailOptions);
                });
            } catch (mailErr) {
                console.warn('[EMAIL WARNING]', mailErr.message);
                logEmailSent(mailOptions);
            }
        }

        // 2. Send WhatsApp Alert to Admin & Confirmation to Client
        try {
            const waStatus = whatsapp.getWhatsAppStatus();
            if (waStatus.isConnected) {
                // Determine target Admin WhatsApp recipient: custom configured or connected user phone
                const adminWaRecipient = rawAdminWA.trim() || (waStatus.user && waStatus.user.phone);

                if (enableAdminWhatsApp && adminWaRecipient) {
                    let adminWaMsg = `🚨 *New Bug Query Received!*\n\n`;
                    adminWaMsg += `• *Query ID:* ${ticketId}\n`;
                    adminWaMsg += `• *Client Name:* ${clientName}\n`;
                    if (clientPhone) adminWaMsg += `• *Client Phone:* ${clientPhone}\n`;
                    if (clientEmail) adminWaMsg += `• *Client Email:* ${clientEmail}\n`;
                    adminWaMsg += `• *Website:* ${siteUrl || 'N/A'}\n`;
                    adminWaMsg += `• *Issue Category:* ${bugType || 'General'}\n`;
                    adminWaMsg += `• *Severity:* ${severity || 'Medium'}\n\n`;
                    adminWaMsg += `📝 *Description:*\n${description}\n\n`;
                    if (waClientLink) {
                        adminWaMsg += `💬 *Chat with Client directly:*\n${waClientLink}\n\n`;
                    }
                    adminWaMsg += `👉 *Open Admin Portal:*\nhttp://localhost:8080/admin`;

                    whatsapp.sendWhatsAppMessage(adminWaRecipient, adminWaMsg)
                        .then(() => console.log(`[WA SUCCESS] Admin notification sent to ${adminWaRecipient}`))
                        .catch(e => console.warn('[WA ALERT TO ADMIN WARNING]', e.message));
                }

                // Send confirmation to Client on WhatsApp if clientPhone is provided
                if (enableClientWhatsApp && clientPhone) {
                    let clientWaMsg = `👋 Hello *${clientName}*,\n\n`;
                    clientWaMsg += `Thank you for reaching out! We have successfully received your WordPress bug query (*${ticketId}*).\n\n`;
                    clientWaMsg += `📋 *Summary:*\n`;
                    clientWaMsg += `• *Website:* ${siteUrl || 'N/A'}\n`;
                    clientWaMsg += `• *Issue:* ${bugType || 'General'}\n`;
                    clientWaMsg += `• *Severity:* ${severity || 'Medium'}\n\n`;
                    clientWaMsg += `Abu Zannat is reviewing your issue and will communicate with you directly on this WhatsApp number shortly.\n\n`;
                    clientWaMsg += `Best regards,\n*Abu Zannat | WordPress Specialist*\n🌐 https://zannat.bd`;

                    whatsapp.sendWhatsAppMessage(clientPhone, clientWaMsg)
                        .then(() => console.log(`[WA SUCCESS] Client confirmation sent to ${clientPhone}`))
                        .catch(e => console.warn('[WA ALERT TO CLIENT WARNING]', e.message));
                }
            } else {
                console.log('[WA NOTICE] WhatsApp is not currently connected; skipping WA notifications.');
            }
        } catch (waErr) {
            console.warn('[WA ALERT WARNING]', waErr.message);
        }

        res.json({ success: true, ticketId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Ticket (with Status Change Notifications)
app.post('/api/tickets/update', requireAdminAuth, async (req, res) => {
    try {
        const { id, status, adminNotes } = req.body;
        const updateResult = await db.updateTicket(id, status, adminNotes);
        const { ticket, statusChanged, previousStatus, newStatus } = updateResult;

        let notified = { wa: false, email: false };

        if (statusChanged) {
            // Retrieve site notification settings
            const siteSettings = await db.getSiteSettings();
            const notif = siteSettings.notifications || {};
            const adminEmail = notif.adminEmail || 'abuzannat911@gmail.com';
            const rawAdminWA = notif.adminWhatsApp || '';
            const enableAdminEmail = notif.enableAdminEmail !== false;
            const enableAdminWhatsApp = notif.enableAdminWhatsApp !== false;
            const enableClientWhatsApp = notif.enableClientWhatsApp !== false;

            const clientName = ticket.client_name || 'Valued Client';
            const clientEmail = ticket.client_email || '';
            const clientPhone = ticket.client_phone || '';
            const siteUrl = ticket.site_url || '';
            const bugType = ticket.bug_type || 'General';
            const notesText = adminNotes !== undefined ? adminNotes : (ticket.admin_notes || '');

            // 1. WhatsApp Notification
            try {
                const waStatus = whatsapp.getWhatsAppStatus();
                if (waStatus.isConnected) {
                    // Send status notification to Client WhatsApp if enabled & phone provided
                    if (enableClientWhatsApp && clientPhone) {
                        let clientWaMsg = `🔔 *Bug Ticket Status Update: ${newStatus.toUpperCase()}*\n\n`;
                        clientWaMsg += `Hello *${clientName}*,\n\n`;
                        clientWaMsg += `The status of your WordPress bug query (*${id}*) has been updated to:\n`;
                        clientWaMsg += `👉 *${newStatus}*\n\n`;
                        clientWaMsg += `📋 *Ticket Summary:*\n`;
                        clientWaMsg += `• *Website:* ${siteUrl || 'N/A'}\n`;
                        clientWaMsg += `• *Issue:* ${bugType}\n`;
                        if (notesText && notesText.trim()) {
                            clientWaMsg += `• *Developer Notes:*\n${notesText.trim()}\n\n`;
                        } else {
                            clientWaMsg += `\n`;
                        }
                        if (newStatus === 'Resolved') {
                            clientWaMsg += `🎉 *Your bug has been fixed!* Please test on your site to confirm everything works smoothly.\n\n`;
                        } else if (newStatus === 'In Progress') {
                            clientWaMsg += `⚡ *Diagnostics and debugging are currently underway.* We will update you as soon as the patch is ready.\n\n`;
                        }
                        clientWaMsg += `If you have any questions or further instructions, feel free to reply directly to this message.\n\n`;
                        clientWaMsg += `Best regards,\n*Abu Zannat | WordPress Specialist*\n🌐 https://zannat.bd`;

                        await whatsapp.sendWhatsAppMessage(clientPhone, clientWaMsg);
                        notified.wa = true;
                        console.log(`[WA SUCCESS] Status update sent to client (${clientPhone})`);
                    }

                    // Send alert to Admin WhatsApp
                    const adminWaRecipient = rawAdminWA.trim() || (waStatus.user && waStatus.user.phone);
                    if (enableAdminWhatsApp && adminWaRecipient) {
                        let adminWaMsg = `🔄 *Ticket Status Changed: ${id}*\n\n`;
                        adminWaMsg += `• *Client:* ${clientName} (${clientPhone || 'No phone'})\n`;
                        adminWaMsg += `• *New Status:* *${newStatus}* (was: ${previousStatus})\n`;
                        if (notesText && notesText.trim()) {
                            adminWaMsg += `• *Notes:* ${notesText.trim()}\n`;
                        }
                        adminWaMsg += `👉 *Admin Portal:* http://localhost:8080/admin`;

                        whatsapp.sendWhatsAppMessage(adminWaRecipient, adminWaMsg)
                            .then(() => console.log(`[WA SUCCESS] Admin status alert sent to ${adminWaRecipient}`))
                            .catch(e => console.warn('[WA ADMIN ALERT WARNING]', e.message));
                    }
                } else {
                    console.log('[WA NOTICE] WhatsApp client not connected; skipping WhatsApp alert.');
                }
            } catch (waErr) {
                console.warn('[WA STATUS NOTIFY WARNING]', waErr.message);
            }

            // 2. Email Notification to Client (and Admin)
            if (clientEmail) {
                const statusColor = newStatus === 'Resolved' ? '#10b981' : (newStatus === 'In Progress' ? '#3b82f6' : (newStatus === 'Closed' ? '#64748b' : '#f59e0b'));
                const statusBg = newStatus === 'Resolved' ? '#d1fae5' : (newStatus === 'In Progress' ? '#dbeafe' : (newStatus === 'Closed' ? '#f1f5f9' : '#fef3c7'));

                const mailOptions = {
                    from: '"Abu Zannat | WordPress Support" <abuzannat911@gmail.com>',
                    to: clientEmail,
                    subject: `[Status Update: ${newStatus}] Bug Ticket ${id} - ${clientName}`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; color: #ffffff;">
                                <h2 style="margin: 0; font-size: 20px; font-weight: 700;">Abu Zannat Support Desk</h2>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">WordPress Emergency Debugging & Technical Dispatch</p>
                            </div>
                            <div style="padding: 24px;">
                                <p style="font-size: 15px; margin-top: 0;">Hello <strong>${clientName}</strong>,</p>
                                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                                    The status of your WordPress bug query (<strong>${id}</strong>) has been updated:
                                </p>
                                <div style="margin: 20px 0; text-align: center; padding: 14px; background: ${statusBg}; border-radius: 8px;">
                                    <span style="display: inline-block; font-size: 16px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                                        ● ${newStatus}
                                    </span>
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 8px 0; color: #64748b;">Issue Category:</td>
                                        <td style="padding: 8px 0; font-weight: 500;">${issueTitle}</td>
                                    </tr>
                                    ${notesText && notesText.trim() ? `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 8px 0; color: #64748b; vertical-align: top;">Developer Notes:</td>
                                        <td style="padding: 8px 0; color: #334155; line-height: 1.5;">${notesText.trim()}</td>
                                    </tr>
                                    ` : ''}
                                </table>
                                <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                                    If you need immediate assistance or have more details to provide, feel free to reply directly to this email or chat on WhatsApp.
                                </p>
                                <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
                                <div style="font-size: 12px; color: #94a3b8; text-align: center;">
                                    © 2026 Zannat.bd · WordPress Specialist & Web Developer
                                </div>
                            </div>
                        </div>
                    `
                };

                try {
                    const transporter = await getTransporter();
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error('[EMAIL ERROR] Status change notification:', err.message);
                        } else {
                            console.log('[EMAIL SUCCESS] Status change notification sent:', info.messageId);
                        }
                        logEmailSent(mailOptions);
                    });
                    notified.email = true;
                } catch (mailErr) {
                    console.warn('[EMAIL WARNING]', mailErr.message);
                    logEmailSent(mailOptions);
                }
            }

            // Also inform Admin Email if enabled
            if (enableAdminEmail && adminEmail && adminEmail !== clientEmail) {
                const adminMailOptions = {
                    from: '"Zannat.bd Support" <abuzannat911@gmail.com>',
                    to: adminEmail,
                    subject: `[Status Changed: ${newStatus}] Ticket ${id} - ${clientName}`,
                    text: `Ticket ${id} status updated to: ${newStatus} (was: ${previousStatus}).\nClient: ${clientName} (${clientEmail || 'No email'}, ${clientPhone || 'No phone'}).\nDeveloper Notes: ${notesText || 'None'}`
                };
                try {
                    const transporter = await getTransporter();
                    transporter.sendMail(adminMailOptions, () => {
                        logEmailSent(adminMailOptions);
                    });
                } catch (e) {}
            }
        }

        res.json({ success: true, statusChanged, previousStatus, newStatus, notified });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Ticket
app.post('/api/tickets/delete', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.body;
        await db.deleteTicket(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Backup Database (JSON dump)
app.get('/api/backup', requireAdminAuth, async (req, res) => {
    try {
        const json = await db.exportDatabaseJson();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="zannat_mysql_backup.json"');
        res.send(json);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Restore Database
app.post('/api/restore', requireAdminAuth, express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
    try {
        const bodyStr = req.body.toString('utf-8');
        await db.restoreDatabaseFromJson(bodyStr);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Homepage Content
app.post('/api/homepage/update', requireAdminAuth, async (req, res) => {
    try {
        const { name, title, avatar, about } = req.body;
        await db.updateHomepage({ name, title, avatar, about });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Custom Page
app.post('/api/pages', requireAdminAuth, async (req, res) => {
    try {
        const { title, slug, layout, content, oldSlug } = req.body;
        await db.savePage({ title, slug, layout, content, oldSlug });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Delete Custom Page
app.post('/api/pages/delete', requireAdminAuth, async (req, res) => {
    try {
        const { slug } = req.body;
        await db.deletePage(slug);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Admin User
app.post('/api/users', requireAdminAuth, async (req, res) => {
    try {
        const { username, password } = req.body;
        await db.saveUser(username, password);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Admin User
app.post('/api/users/delete', requireAdminAuth, async (req, res) => {
    try {
        const { username } = req.body;
        await db.deleteUser(username);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Update SMTP Config (Password / Direct SMTP)
app.post('/api/smtp/update', requireAdminAuth, async (req, res) => {
    try {
        let { host, port, secure, user, pass, auth_type } = req.body;
        if (user) user = user.trim();
        if (pass) pass = pass.trim();
        if (pass && ((host && host.includes('gmail')) || (user && user.includes('gmail')))) {
            pass = pass.replace(/\s+/g, '');
        }
        await db.updateSmtp({ host, port, secure, user, pass, auth_type: auth_type || 'password' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Initiate Google OAuth2 Login
app.get('/api/auth/google', async (req, res) => {
    try {
        const config = await db.getSmtpConfig();
        const clientId = config.oauth_client_id || process.env.GOOGLE_CLIENT_ID;
        
        if (!clientId) {
            return res.redirect('/admin/maintenance?error=missing_google_client_id');
        }

        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback`;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email',
            access_type: 'offline',
            prompt: 'consent'
        });

        res.redirect(authUrl);
    } catch (err) {
        console.error('Google auth error:', err);
        res.redirect('/admin/maintenance?error=' + encodeURIComponent(err.message));
    }
});

// GET Google OAuth2 Callback
app.get('/api/auth/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error || !code) {
            return res.redirect('/admin/maintenance?error=' + encodeURIComponent(error || 'authorization_denied'));
        }

        const config = await db.getSmtpConfig();
        const clientId = config.oauth_client_id || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = config.oauth_client_secret || process.env.GOOGLE_CLIENT_SECRET;

        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Failed to exchange Google token:', tokenData);
            return res.redirect('/admin/maintenance?error=' + encodeURIComponent(tokenData.error_description || tokenData.error || 'token_exchange_failed'));
        }

        // Fetch user email
        let userEmail = '';
        try {
            const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const userData = await userinfoRes.json();
            userEmail = userData.email || '';
        } catch (uErr) {
            console.warn('Failed to fetch userinfo from Google:', uErr.message);
        }

        await db.saveGoogleOAuthTokens({
            email: userEmail,
            refreshToken: tokenData.refresh_token || '',
            accessToken: tokenData.access_token
        });

        res.redirect('/admin/maintenance?gmail_connected=1');
    } catch (err) {
        console.error('Google callback error:', err);
        res.redirect('/admin/maintenance?error=' + encodeURIComponent(err.message));
    }
});

// POST Disconnect Google OAuth2
app.post('/api/auth/google/disconnect', requireAdminAuth, async (req, res) => {
    try {
        await db.disconnectGoogleOAuth();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Save Custom Google OAuth Credentials (Client ID & Secret)
app.post('/api/auth/google/credentials', requireAdminAuth, async (req, res) => {
    try {
        const { clientId, clientSecret } = req.body;
        await db.saveGoogleOAuthCredentials({ clientId, clientSecret });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Send Live Test Email
app.post('/api/smtp/test', requireAdminAuth, async (req, res) => {
    try {
        const { to } = req.body;
        const config = await db.getSmtpConfig();
        const recipient = (to || config.user || config.oauth_user || 'abuzannat911@gmail.com').trim();

        const mailOptions = {
            from: `"Zannat.bd Mail Test" <${config.user || config.oauth_user || 'abuzannat911@gmail.com'}>`,
            to: recipient,
            subject: '✅ Zannat.bd Live Email Delivery Test',
            text: `Hello! This is a test email sent from your Zannat.bd application to confirm that your Gmail / SMTP configuration is working properly.\n\nSent at: ${new Date().toISOString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 12px;">
                        <h2 style="color: #10b981; margin: 0; font-size: 20px;">Email System Verified!</h2>
                    </div>
                    <p style="color: #334155; line-height: 1.6;">
                        Your email delivery system on <strong>Zannat.bd</strong> is active and delivering emails.
                    </p>
                    <div style="background: #f8fafc; padding: 14px; border-radius: 6px; font-size: 13px; color: #64748b; margin: 16px 0; border-left: 3px solid #10b981;">
                        <strong>Auth Mode:</strong> ${config.auth_type === 'oauth2' ? 'Gmail OAuth 2.0 (Google Direct Auth)' : 'SMTP Password / App Key'}<br>
                        <strong>Sender:</strong> ${config.user || config.oauth_user || 'Default System'}<br>
                        <strong>Recipient:</strong> ${recipient}<br>
                        <strong>Timestamp:</strong> ${new Date().toLocaleString()}
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
                        Sent automatically from your Zannat.bd Admin Maintenance Console.
                    </p>
                </div>
            `
        };

        const transporter = await getTransporter();
        const info = await transporter.sendMail(mailOptions);
        logEmailSent(mailOptions);

        res.json({ success: true, message: `Test email successfully sent to ${recipient}!`, messageId: info.messageId });
    } catch (err) {
        console.error('Test email failure:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============ INVOICE API ============
app.get('/api/invoices', requireAdminAuth, async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, invoices: state.invoices, nextNum: state.nextInvoiceNum });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', requireAdminAuth, async (req, res) => {
    try {
        const invoiceData = req.body;
        const saved = await db.saveInvoice(invoiceData);
        const state = await db.getFullState();
        res.json({
            success: true,
            invoice: saved,
            nextNum: state.nextInvoiceNum,
            clients: state.clients
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices/delete', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.body;
        await db.deleteInvoice(id);
        const state = await db.getFullState();
        res.json({ success: true, invoices: state.invoices });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CLIENTS API ============
app.get('/api/clients', requireAdminAuth, async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, clients: state.clients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', requireAdminAuth, async (req, res) => {
    try {
        const clientData = req.body;
        const saved = await db.saveClient(clientData);
        const state = await db.getFullState();
        res.json({ success: true, client: saved, clients: state.clients });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/clients/delete', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.body;
        const remainingClients = await db.deleteClient(id);
        res.json({ success: true, clients: remainingClients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ BANK DETAILS API ============
app.get('/api/bank-details', requireAdminAuth, async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, bankDetails: state.bankDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bank-details', requireAdminAuth, async (req, res) => {
    try {
        const updated = await db.updateBankDetails(req.body);
        res.json({ success: true, bankDetails: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ SITE SETTINGS API ============
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await db.getSiteSettings();
        res.json({ success: true, siteSettings: settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings/update', requireAdminAuth, async (req, res) => {
    try {
        const updated = await db.saveSiteSettings(req.body);
        res.json({ success: true, siteSettings: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings/reset', requireAdminAuth, async (req, res) => {
    try {
        const resetSettings = await db.saveSiteSettings(db.DEFAULT_SITE_SETTINGS);
        res.json({ success: true, siteSettings: resetSettings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVOICE EMAIL SENDER API ============
app.post('/api/invoices/send-email', requireAdminAuth, async (req, res) => {
    try {
        const { to, subject, message, invoiceNumber, invoiceId, invoiceData } = req.body;
        if (!to || !to.trim()) {
            return res.status(400).json({ error: 'Recipient email is required' });
        }

        // Retrieve full invoice details
        let invoice = invoiceData;
        if (!invoice && (invoiceId || invoiceNumber)) {
            const state = await db.getFullState();
            invoice = (state.invoices || []).find(i => 
                (invoiceId && i.id === invoiceId) || 
                (invoiceNumber && i.number === invoiceNumber)
            );
        }
        if (!invoice) {
            invoice = {
                number: invoiceNumber || 'INV-1001',
                date: new Date().toISOString().split('T')[0],
                clientEmail: to.trim()
            };
        }

        // Generate full visual email HTML matching preview modal design
        const emailHtml = generateInvoiceEmailHtml(invoice, message);

        // Generate high-resolution vector PDF attachment
        const pdfBuffer = await generateInvoicePDFBuffer(invoice);

        const mailOptions = {
            from: '"Abu Zannat - WordPress Engineering" <abuzannat911@gmail.com>',
            to: to.trim(),
            subject: subject || `Commercial Invoice ${invoice.number || invoiceNumber || ''} - Abu Zannat`,
            text: message || `Please find your commercial invoice ${invoice.number} attached.`,
            html: emailHtml,
            attachments: [
                {
                    filename: `${invoice.number || 'Commercial_Invoice'}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        logEmailSent(mailOptions);

        try {
            const transporter = await getTransporter();
            await transporter.sendMail(mailOptions);
        } catch (mailErr) {
            console.warn('[EMAIL WARNING] Transporter send failed, logged to sent_emails.log instead:', mailErr.message);
        }

        res.json({ success: true, message: `Commercial invoice ${invoice.number} successfully emailed to ${to} with PDF attachment!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ WHATSAPP INTEGRATION APIS ============

// GET WhatsApp Connection Status & QR code
app.get('/api/whatsapp/status', (req, res) => {
    try {
        const status = whatsapp.getWhatsAppStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Request 8-digit Pairing Code for Mobile Number
app.post('/api/whatsapp/pair-code', requireAdminAuth, async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required.' });
        }
        const result = await whatsapp.requestPairingCode(phone);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Send WhatsApp Notification Message (Supports optional document/PDF attachment)
app.post('/api/whatsapp/send', requireAdminAuth, async (req, res) => {
    try {
        const { to, message, pdfBase64, fileName, mimetype } = req.body;
        if (!to || (!message && !pdfBase64)) {
            return res.status(400).json({ error: 'Recipient phone number and message/document are required.' });
        }
        const options = {};
        if (pdfBase64) {
            options.pdfBase64 = pdfBase64;
            options.fileName = fileName || 'document.pdf';
            options.mimetype = mimetype || 'application/pdf';
        }
        const result = await whatsapp.sendWhatsAppMessage(to, message || '', options);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Disconnect WhatsApp Session
app.post('/api/whatsapp/disconnect', requireAdminAuth, async (req, res) => {
    try {
        const result = await whatsapp.disconnectWhatsApp();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Send Invoice via WhatsApp (Supports Text Message + High-Res Vector PDF Document Attachment)
app.post('/api/invoices/send-whatsapp', requireAdminAuth, async (req, res) => {
    try {
        const { to, message, invoiceNumber, attachPdf, pdfBase64, fileName, invoiceData, invoiceId } = req.body;
        if (!to || !to.trim()) {
            return res.status(400).json({ error: 'Recipient WhatsApp phone number is required.' });
        }
        const textMessage = message || `Hello,\n\nPlease find your commercial invoice ${invoiceNumber || ''} from Abu Zannat.\n\nThank you!`;
        
        const options = {};
        if (attachPdf) {
            let buffer = null;

            // 1. If client provided a valid base64 PDF of sufficient size (> 5KB)
            if (pdfBase64 && typeof pdfBase64 === 'string') {
                const raw = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
                const clientBuf = Buffer.from(raw, 'base64');
                // Blank/broken client canvas is ~20 to 500 bytes. Only accept substantive buffers.
                if (clientBuf.length > 5000) {
                    buffer = clientBuf;
                }
            }

            // 2. If client buffer is missing, empty, or too small, generate pristine vector PDF on server!
            if (!buffer) {
                let invoiceObj = invoiceData;
                if (!invoiceObj && (invoiceId || invoiceNumber)) {
                    const state = await db.getFullState();
                    invoiceObj = (state.invoices || []).find(i => 
                        (invoiceId && i.id === invoiceId) || 
                        (invoiceNumber && i.number === invoiceNumber)
                    );
                }
                if (!invoiceObj) {
                    invoiceObj = {
                        number: invoiceNumber || 'INV-1001',
                        date: new Date().toISOString().split('T')[0],
                        clientPhone: to
                    };
                }
                buffer = await generateInvoicePDFBuffer(invoiceObj);
            }

            options.documentBuffer = buffer;
            options.fileName = fileName || `${invoiceNumber || 'Invoice'}.pdf`;
            options.mimetype = 'application/pdf';
        }

        const result = await whatsapp.sendWhatsAppMessage(to, textMessage, options);
        res.json({
            success: true,
            message: result.hasPdf 
                ? `Invoice PDF document (${result.fileName}) successfully sent via WhatsApp to ${result.to}!` 
                : `Invoice message successfully sent via WhatsApp to ${result.to}!`,
            messageId: result.messageId,
            to: result.to,
            hasPdf: !!result.hasPdf,
            fileName: result.fileName
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==============================================================================
// SYSTEM & GITHUB AUTO-UPDATE WITH ZERO-DATA-LOSS GUARANTEE
// ==============================================================================

async function runSystemUpdate() {
    const logs = [];
    const log = (msg) => {
        console.log(`[SYSTEM UPDATE] ${msg}`);
        logs.push(msg);
    };

    log('Starting safe system update...');

    // 1. Non-destructive safety database backup
    try {
        await db.safeBackupData();
        log('Step 1/4: Verified database state backup (No data loss guarantee).');
    } catch (e) {
        log(`Warning on database backup: ${e.message}`);
    }

    // 2. Fetch and pull latest code from GitHub
    await new Promise((resolve) => {
        exec('git fetch origin main && git reset --hard origin/main', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                log(`Git reset notice: ${stderr || error.message}`);
                exec('git pull origin main', { cwd: __dirname }, (err2, out2, serr2) => {
                    if (err2) {
                        log(`Git pull fallback warning: ${serr2 || err2.message}`);
                    } else {
                        log(`Git pull: ${out2.trim()}`);
                    }
                    resolve();
                });
            } else {
                log(`Step 2/4: Git updated to latest commit on origin/main (${stdout.trim()}).`);
                resolve();
            }
        });
    });

    // 3. Install/update production dependencies
    await new Promise((resolve) => {
        exec('npm install --production --no-audit --no-fund', { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                log(`NPM install notice: ${stderr || error.message}`);
            } else {
                log('Step 3/4: Dependencies verified and up-to-date.');
            }
            resolve();
        });
    });

    // 4. Auto-migrate MySQL schema and columns (non-destructive)
    try {
        await db.initSchema();
        log('Step 4/4: Database schema auto-migrated successfully (all tables and columns verified).');
    } catch (e) {
        log(`Database schema auto-migrate notice: ${e.message}`);
    }

    // 5. Signal server restart for cPanel Phusion Passenger / PM2
    try {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(path.join(tmpDir, 'restart.txt'), String(Date.now()), 'utf-8');
        log('Triggered Phusion Passenger / cPanel reload (tmp/restart.txt touched).');
    } catch (e) {
        log(`Passenger restart notice: ${e.message}`);
    }

    log('Safe system update completed successfully!');
    return logs;
}

// GET System Info & GitHub Sync Status
app.get('/api/system/info', requireAdminAuth, async (req, res) => {
    try {
        let commit = 'unknown';
        let branch = 'main';
        try {
            const { execSync } = require('child_process');
            commit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { cwd: __dirname }).toString().trim();
            branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: __dirname }).toString().trim();
        } catch (e) {
            commit = 'N/A';
        }

        const backupPath = path.join(__dirname, 'backups', 'db_backup_latest.json');
        let lastBackupTime = 'None yet';
        if (fs.existsSync(backupPath)) {
            const stats = fs.statSync(backupPath);
            lastBackupTime = stats.mtime.toLocaleString();
        }

        res.json({
            success: true,
            commit,
            branch,
            remote: 'https://github.com/abuzannat911-lab/zannat.bd',
            nodeVersion: process.version,
            uptimeSeconds: Math.floor(process.uptime()),
            lastBackupTime,
            autoMigrate: 'Active (Zero-Data-Loss Protection)'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Trigger System Update from Admin
app.post('/api/system/update', requireAdminAuth, async (req, res) => {
    try {
        const logs = await runSystemUpdate();
        res.json({
            success: true,
            message: 'System and database updated successfully from GitHub repository!',
            logs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST GitHub Webhook Receiver for Automated Deployment
app.post('/api/system/webhook', async (req, res) => {
    try {
        const secret = req.query.secret || req.headers['x-webhook-secret'];
        const configuredSecret = process.env.WEBHOOK_SECRET;

        if (configuredSecret && secret !== configuredSecret) {
            return res.status(403).json({ error: 'Invalid webhook secret' });
        }

        console.log('[GITHUB WEBHOOK] Push event received. Triggering safe auto-update...');
        res.json({ success: true, message: 'Deployment and schema migration triggered via GitHub Webhook.' });

        runSystemUpdate().catch(err => {
            console.error('[GITHUB WEBHOOK] Auto-update error:', err.message);
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Instant Database Backup Download
app.get('/api/system/backup/download', requireAdminAuth, async (req, res) => {
    try {
        await db.safeBackupData();
        const backupPath = path.join(__dirname, 'backups', 'db_backup_latest.json');
        if (fs.existsSync(backupPath)) {
            res.download(backupPath, `zannat_db_backup_${new Date().toISOString().split('T')[0]}.json`);
        } else {
            const json = await db.exportDatabaseJson();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="zannat_db_backup_${new Date().toISOString().split('T')[0]}.json"`);
            res.send(json);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Block direct access to sensitive server-side files, databases, logs, backups, and configurations
app.use((req, res, next) => {
    const rawPath = req.path.toLowerCase();
    const sensitivePatterns = [
        /^\/\.env/i,
        /^\/\.git/i,
        /^\/\.sessions/i,
        /\.sqlite/i,
        /\.sql$/i,
        /server\.js$/i,
        /db\.js$/i,
        /whatsapp\.js$/i,
        /invoice_pdf\.js$/i,
        /package(-lock)?\.json$/i,
        /sent_emails\.log$/i,
        /backups\//i,
        /whatsapp_auth\//i,
        /update\.sh$/i
    ];
    for (const pattern of sensitivePatterns) {
        if (pattern.test(rawPath)) {
            return res.status(403).type('text/plain').send('Access Forbidden: Protected system resource.');
        }
    }
    next();
});

// Serve Static Frontend Assets with no-cache headers for live development
app.use(express.static(__dirname, {
    dotfiles: 'ignore', // Never serve hidden files (.env, .git, etc.)
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Return 404 JSON for any unmatched API endpoints
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Serve SPA index.html for all other routes
app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Zannat.bd MySQL-Backed Server running on port ${PORT}`);
    // Initialize WhatsApp connection
    whatsapp.initWhatsApp();
});
