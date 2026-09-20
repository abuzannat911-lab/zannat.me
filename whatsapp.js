const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

// WhatsApp Service State
let sock = null;
let connectionState = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
let latestQrCode = null; // Base64 data URL
let latestPairingCode = null; // 8-char string
let connectedUser = null; // { phone, name, jid }
let reconnectTimeout = null;
let isInitializing = false;

// Ensure auth dir exists
function ensureAuthDir() {
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
}

// Extract phone from JID (e.g., 8801712345678:1@s.whatsapp.net -> 8801712345678)
function extractPhoneFromJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0];
}

// Format phone number to clean digits
function formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    // If starts with 0 and 11 digits (e.g., 017xxxxxxxx in BD), add country code 88
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '88' + cleaned;
    }
    return cleaned;
}

// Initialize Baileys WhatsApp Connection
async function initWhatsApp(isRestart = false) {
    if (isInitializing && !isRestart) return;
    isInitializing = true;
    ensureAuthDir();

    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: ['Zannat Admin', 'Chrome', '122.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 25000,
            emitOwnEvents: false,
            syncFullHistory: false
        });

        // Connection Event Listener
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                connectionState = 'connecting';
                try {
                    latestQrCode = await QRCode.toDataURL(qr, {
                        margin: 2,
                        scale: 8,
                        color: {
                            dark: '#0f172a',
                            light: '#ffffff'
                        }
                    });
                } catch (err) {
                    console.error('[WhatsApp] Failed to generate QR data URL:', err);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                console.log(`[WhatsApp] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

                connectionState = 'disconnected';
                latestQrCode = null;
                latestPairingCode = null;
                connectedUser = null;

                if (shouldReconnect) {
                    if (reconnectTimeout) clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(() => {
                        initWhatsApp(true);
                    }, 4000);
                } else {
                    // Logged out: wipe auth keys
                    console.log('[WhatsApp] User logged out. Clearing auth directory.');
                    clearAuthDir();
                }
            } else if (connection === 'open') {
                connectionState = 'connected';
                latestQrCode = null;
                latestPairingCode = null;

                const jid = sock.user?.id || '';
                const phone = extractPhoneFromJid(jid);
                const name = sock.user?.name || sock.user?.notify || 'WhatsApp Account';

                connectedUser = {
                    jid,
                    phone: '+' + phone,
                    rawPhone: phone,
                    name
                };

                console.log(`[WhatsApp] Connected successfully as ${connectedUser.name} (${connectedUser.phone})`);
            }
        });

        // Save Authentication Credentials on update
        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error('[WhatsApp] Initialization error:', err);
        connectionState = 'disconnected';
    } finally {
        isInitializing = false;
    }
}

// Clear Auth Directory on Disconnect
function clearAuthDir() {
    try {
        if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        }
    } catch (err) {
        console.error('[WhatsApp] Failed to clear auth directory:', err);
    }
}

// Request 8-digit Pairing Code for Mobile Number
async function requestPairingCode(rawPhoneNumber) {
    const cleaned = formatPhoneNumber(rawPhoneNumber);
    if (!cleaned || cleaned.length < 9) {
        throw new Error('Please enter a valid phone number including country code (e.g. 8801712345678 or 15551234567).');
    }

    if (connectionState === 'connected') {
        throw new Error('WhatsApp is already connected. Disconnect first to link a new number.');
    }

    if (!sock) {
        await initWhatsApp(true);
    }

    try {
        const code = await sock.requestPairingCode(cleaned);
        // Format as XXXX-XXXX for readability
        const formatted = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
        latestPairingCode = formatted;
        return {
            success: true,
            code: formatted,
            phone: '+' + cleaned
        };
    } catch (err) {
        console.error('[WhatsApp] Request pairing code error:', err);
        throw new Error(err.message || 'Failed to generate pairing code. Please try again.');
    }
}

// Send WhatsApp message or document (PDF) to a phone number
async function sendWhatsAppMessage(recipientPhone, messageText, options = {}) {
    if (connectionState !== 'connected' || !sock) {
        throw new Error('WhatsApp is not connected. Please scan the QR code or pair with phone code first in Admin Maintenance.');
    }

    const cleaned = formatPhoneNumber(recipientPhone);
    if (!cleaned || cleaned.length < 8) {
        throw new Error('Invalid recipient phone number.');
    }

    const targetJid = `${cleaned}@s.whatsapp.net`;

    try {
        // Verify phone number is on WhatsApp
        const [result] = await sock.onWhatsApp(targetJid);
        if (!result || !result.exists) {
            throw new Error(`The phone number +${cleaned} is not registered on WhatsApp.`);
        }

        let sent;
        const hasPdf = Boolean(options && (options.pdfBase64 || options.documentBuffer));

        if (hasPdf) {
            let buffer;
            if (options.documentBuffer) {
                buffer = Buffer.isBuffer(options.documentBuffer) ? options.documentBuffer : Buffer.from(options.documentBuffer);
            } else {
                // Strip data URI scheme if present (e.g. data:application/pdf;base64,...)
                const raw = options.pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
                buffer = Buffer.from(raw, 'base64');
            }

            const rawFileName = options.fileName || 'Invoice.pdf';
            const fileName = rawFileName.toLowerCase().endsWith('.pdf') ? rawFileName : `${rawFileName}.pdf`;

            const docPayload = {
                document: buffer,
                mimetype: options.mimetype || 'application/pdf',
                fileName: fileName,
                caption: messageText || ''
            };

            sent = await sock.sendMessage(result.jid, docPayload);
            return {
                success: true,
                messageId: sent ? sent.key.id : null,
                to: '+' + cleaned,
                hasPdf: true,
                fileName: fileName,
                timestamp: new Date().toISOString()
            };
        } else {
            sent = await sock.sendMessage(result.jid, { text: messageText });
            return {
                success: true,
                messageId: sent ? sent.key.id : null,
                to: '+' + cleaned,
                hasPdf: false,
                timestamp: new Date().toISOString()
            };
        }
    } catch (err) {
        console.error('[WhatsApp] Error sending message to', cleaned, ':', err.message);
        throw err;
    }
}

// Disconnect WhatsApp session
async function disconnectWhatsApp() {
    try {
        if (sock) {
            try {
                await sock.logout();
            } catch (logoutErr) {
                // Ignore if socket was already closed
            }
        }
    } finally {
        clearAuthDir();
        sock = null;
        connectionState = 'disconnected';
        latestQrCode = null;
        latestPairingCode = null;
        connectedUser = null;
        // Re-initialize to generate a fresh QR code
        setTimeout(() => {
            initWhatsApp(true);
        }, 1000);
    }
    return { success: true };
}

// Get WhatsApp Status
function getWhatsAppStatus() {
    return {
        isConnected: connectionState === 'connected',
        status: connectionState,
        qrCode: latestQrCode,
        pairingCode: latestPairingCode,
        user: connectedUser
    };
}

module.exports = {
    initWhatsApp,
    getWhatsAppStatus,
    requestPairingCode,
    sendWhatsAppMessage,
    disconnectWhatsApp
};
