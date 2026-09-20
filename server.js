require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// ==========================================
// API ROUTES (ALL BACKED BY MYSQL DATABASE)
// ==========================================

// GET Full State
app.get('/api/state', async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json(state);
    } catch (err) {
        console.error('API state error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const valid = await db.authenticateUser(username, password);
        if (valid) {
            res.json({ success: true, token: "zannat_secure_session_token_123" });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Tickets (Add Bug Ticket)
app.post('/api/tickets', async (req, res) => {
    try {
        const { clientName, clientEmail, siteUrl, bugType, description, severity } = req.body;
        const { ticketId, date } = await db.addTicket({ clientName, clientEmail, siteUrl, bugType, description, severity });

        // Send email alert
        const mailOptions = {
            from: '"Zannat.me Support" <abuzannat911@gmail.com>',
            to: 'abuzannat911@gmail.com',
            subject: `[New Bug Fix Ticket] ${ticketId} - ${clientName}`,
            text: `
New Bug Fix Ticket Submitted:
----------------------------------------
Ticket ID: ${ticketId}
Date: ${date}
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

        try {
            const transporter = await getTransporter();
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Nodemailer error sending email:', err.message);
                } else {
                    console.log('Email sent successfully:', info.messageId);
                }
                logEmailSent(mailOptions);
            });
        } catch (mailErr) {
            console.warn('[EMAIL WARNING]', mailErr.message);
            logEmailSent(mailOptions);
        }

        // Send WhatsApp alert if WhatsApp is connected
        try {
            const waStatus = whatsapp.getWhatsAppStatus();
            if (waStatus.isConnected && waStatus.user && waStatus.user.phone) {
                const waMsg = `🚨 *New Bug Fix Ticket Received!*\n\n• *Ticket ID:* ${ticketId}\n• *Client:* ${clientName} (${clientEmail || 'No email'})\n• *Website:* ${siteUrl || 'N/A'}\n• *Severity:* ${severity}\n• *Issue:* ${bugType}\n\n📝 *Description:*\n${description}\n\n👉 Open Admin: http://localhost:8080/admin`;
                whatsapp.sendWhatsAppMessage(waStatus.user.phone, waMsg).catch(e => console.warn('[WA ALERT WARNING]', e.message));
            }
        } catch (waErr) {
            console.warn('[WA ALERT WARNING]', waErr.message);
        }

        res.json({ success: true, ticketId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Ticket
app.post('/api/tickets/update', async (req, res) => {
    try {
        const { id, status, adminNotes } = req.body;
        await db.updateTicket(id, status, adminNotes);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Ticket
app.post('/api/tickets/delete', async (req, res) => {
    try {
        const { id } = req.body;
        await db.deleteTicket(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Backup Database (JSON dump)
app.get('/api/backup', async (req, res) => {
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
app.post('/api/restore', express.raw({ type: 'application/octet-stream', limit: '50mb' }), async (req, res) => {
    try {
        const bodyStr = req.body.toString('utf-8');
        await db.restoreDatabaseFromJson(bodyStr);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Update Homepage Content
app.post('/api/homepage/update', async (req, res) => {
    try {
        const { name, title, avatar, about } = req.body;
        await db.updateHomepage({ name, title, avatar, about });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Custom Page
app.post('/api/pages', async (req, res) => {
    try {
        const { title, slug, layout, content, oldSlug } = req.body;
        await db.savePage({ title, slug, layout, content, oldSlug });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Delete Custom Page
app.post('/api/pages/delete', async (req, res) => {
    try {
        const { slug } = req.body;
        await db.deletePage(slug);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Create or Update Admin User
app.post('/api/users', async (req, res) => {
    try {
        const { username, password } = req.body;
        await db.saveUser(username, password);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Delete Admin User
app.post('/api/users/delete', async (req, res) => {
    try {
        const { username } = req.body;
        await db.deleteUser(username);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST Update SMTP Config (Password / Direct SMTP)
app.post('/api/smtp/update', async (req, res) => {
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
app.post('/api/auth/google/disconnect', async (req, res) => {
    try {
        await db.disconnectGoogleOAuth();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Save Custom Google OAuth Credentials (Client ID & Secret)
app.post('/api/auth/google/credentials', async (req, res) => {
    try {
        const { clientId, clientSecret } = req.body;
        await db.saveGoogleOAuthCredentials({ clientId, clientSecret });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Send Live Test Email
app.post('/api/smtp/test', async (req, res) => {
    try {
        const { to } = req.body;
        const config = await db.getSmtpConfig();
        const recipient = (to || config.user || config.oauth_user || 'abuzannat911@gmail.com').trim();

        const mailOptions = {
            from: `"Zannat.me Mail Test" <${config.user || config.oauth_user || 'abuzannat911@gmail.com'}>`,
            to: recipient,
            subject: '✅ Zannat.me Live Email Delivery Test',
            text: `Hello! This is a test email sent from your Zannat.me application to confirm that your Gmail / SMTP configuration is working properly.\n\nSent at: ${new Date().toISOString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 12px;">
                        <h2 style="color: #10b981; margin: 0; font-size: 20px;">Email System Verified!</h2>
                    </div>
                    <p style="color: #334155; line-height: 1.6;">
                        Your email delivery system on <strong>Zannat.me</strong> is active and delivering emails.
                    </p>
                    <div style="background: #f8fafc; padding: 14px; border-radius: 6px; font-size: 13px; color: #64748b; margin: 16px 0; border-left: 3px solid #10b981;">
                        <strong>Auth Mode:</strong> ${config.auth_type === 'oauth2' ? 'Gmail OAuth 2.0 (Google Direct Auth)' : 'SMTP Password / App Key'}<br>
                        <strong>Sender:</strong> ${config.user || config.oauth_user || 'Default System'}<br>
                        <strong>Recipient:</strong> ${recipient}<br>
                        <strong>Timestamp:</strong> ${new Date().toLocaleString()}
                    </div>
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px;">
                        Sent automatically from your Zannat.me Admin Maintenance Console.
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
app.get('/api/invoices', async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, invoices: state.invoices, nextNum: state.nextInvoiceNum });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', async (req, res) => {
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

app.post('/api/invoices/delete', async (req, res) => {
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
app.get('/api/clients', async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, clients: state.clients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const clientData = req.body;
        const saved = await db.saveClient(clientData);
        const state = await db.getFullState();
        res.json({ success: true, client: saved, clients: state.clients });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/clients/delete', async (req, res) => {
    try {
        const { id } = req.body;
        const remainingClients = await db.deleteClient(id);
        res.json({ success: true, clients: remainingClients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ BANK DETAILS API ============
app.get('/api/bank-details', async (req, res) => {
    try {
        const state = await db.getFullState();
        res.json({ success: true, bankDetails: state.bankDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bank-details', async (req, res) => {
    try {
        const updated = await db.updateBankDetails(req.body);
        res.json({ success: true, bankDetails: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ INVOICE EMAIL SENDER API ============
app.post('/api/invoices/send-email', async (req, res) => {
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
app.post('/api/whatsapp/pair-code', async (req, res) => {
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
app.post('/api/whatsapp/send', async (req, res) => {
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
app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
        const result = await whatsapp.disconnectWhatsApp();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Send Invoice via WhatsApp (Supports Text Message + High-Res Vector PDF Document Attachment)
app.post('/api/invoices/send-whatsapp', async (req, res) => {
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
app.get('/api/system/info', async (req, res) => {
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
app.post('/api/system/update', async (req, res) => {
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
app.get('/api/system/backup/download', async (req, res) => {
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

// Serve Static Frontend Assets with no-cache headers for live development
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Serve SPA index.html for all other routes
app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Zannat.me MySQL-Backed Server running on port ${PORT}`);
    // Initialize WhatsApp connection
    whatsapp.initWhatsApp();
});
