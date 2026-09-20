require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const JSON_LEGACY_FILE = path.join(__dirname, 'data.json');

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zannat_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Master Schema Column Definitions for Non-Destructive Auto-Migration
const SCHEMA_COLUMNS = {
    users: {
        username: "VARCHAR(100) UNIQUE NOT NULL",
        password: "VARCHAR(255) NOT NULL",
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    },
    tickets: {
        client_name: "VARCHAR(255) NOT NULL",
        client_email: "VARCHAR(255) DEFAULT ''",
        site_url: "VARCHAR(500) DEFAULT ''",
        bug_type: "VARCHAR(100) DEFAULT ''",
        description: "TEXT",
        severity: "VARCHAR(50) DEFAULT 'Medium'",
        status: "VARCHAR(50) DEFAULT 'Pending'",
        date: "VARCHAR(50) DEFAULT ''",
        admin_notes: "TEXT",
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    },
    earnings: {
        month: "VARCHAR(50) UNIQUE NOT NULL",
        amount: "DECIMAL(12, 2) NOT NULL DEFAULT 0.00",
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    },
    bug_types: {
        type: "VARCHAR(100) UNIQUE NOT NULL",
        count: "INT NOT NULL DEFAULT 0"
    },
    homepage_content: {
        name: "VARCHAR(255) DEFAULT ''",
        title: "VARCHAR(255) DEFAULT ''",
        avatar: "VARCHAR(500) DEFAULT ''",
        about: "TEXT"
    },
    pages: {
        title: "VARCHAR(255) NOT NULL",
        slug: "VARCHAR(255) UNIQUE NOT NULL",
        layout: "VARCHAR(50) DEFAULT 'standard'",
        content: "LONGTEXT"
    },
    smtp_config: {
        host: "VARCHAR(255) DEFAULT ''",
        port: "INT DEFAULT 587",
        secure: "TINYINT(1) DEFAULT 0",
        user: "VARCHAR(255) DEFAULT ''",
        pass: "VARCHAR(255) DEFAULT ''",
        auth_type: "VARCHAR(50) DEFAULT 'password'",
        oauth_client_id: "VARCHAR(500) DEFAULT ''",
        oauth_client_secret: "VARCHAR(500) DEFAULT ''",
        oauth_refresh_token: "TEXT",
        oauth_access_token: "TEXT",
        oauth_user: "VARCHAR(255) DEFAULT ''"
    },
    clients: {
        name: "VARCHAR(255) NOT NULL",
        company: "VARCHAR(255) DEFAULT ''",
        email: "VARCHAR(255) DEFAULT ''",
        phone: "VARCHAR(100) DEFAULT ''",
        vat: "VARCHAR(100) DEFAULT ''",
        address: "TEXT",
        created_at: "VARCHAR(100) DEFAULT ''",
        updated_at: "VARCHAR(100) DEFAULT ''"
    },
    invoices: {
        number: "VARCHAR(100) UNIQUE NOT NULL",
        date: "VARCHAR(50) DEFAULT ''",
        due_date: "VARCHAR(50) DEFAULT ''",
        currency: "VARCHAR(10) DEFAULT 'USD'",
        my_address: "TEXT",
        my_logo: "VARCHAR(500) DEFAULT ''",
        client_name: "VARCHAR(255) DEFAULT ''",
        client_company: "VARCHAR(255) DEFAULT ''",
        client_email: "VARCHAR(255) DEFAULT ''",
        client_phone: "VARCHAR(100) DEFAULT ''",
        client_vat: "VARCHAR(100) DEFAULT ''",
        client_address: "TEXT",
        bank_name: "VARCHAR(255) DEFAULT ''",
        bank_account_name: "VARCHAR(255) DEFAULT ''",
        bank_account_no: "VARCHAR(100) DEFAULT ''",
        bank_routing: "VARCHAR(100) DEFAULT ''",
        bank_swift: "VARCHAR(100) DEFAULT ''",
        bank_branch: "VARCHAR(255) DEFAULT ''",
        payment_method: "VARCHAR(100) DEFAULT ''",
        payment_terms: "VARCHAR(100) DEFAULT ''",
        po_number: "VARCHAR(100) DEFAULT ''",
        items_json: "LONGTEXT",
        subtotal: "DECIMAL(12, 2) DEFAULT 0.00",
        tax_rate: "DECIMAL(6, 2) DEFAULT 0.00",
        tax_amount: "DECIMAL(12, 2) DEFAULT 0.00",
        discount_percent: "DECIMAL(6, 2) DEFAULT 0.00",
        discount_amount: "DECIMAL(12, 2) DEFAULT 0.00",
        total: "DECIMAL(12, 2) DEFAULT 0.00",
        notes: "TEXT",
        status: "VARCHAR(50) DEFAULT 'Unpaid'",
        created_at: "VARCHAR(100) DEFAULT ''",
        updated_at: "VARCHAR(100) DEFAULT ''"
    },
    bank_details: {
        bank_name: "VARCHAR(255) DEFAULT ''",
        account_name: "VARCHAR(255) DEFAULT ''",
        account_number: "VARCHAR(100) DEFAULT ''",
        routing_number: "VARCHAR(100) DEFAULT ''",
        swift_code: "VARCHAR(100) DEFAULT ''",
        branch: "VARCHAR(255) DEFAULT ''"
    },
    meta_settings: {
        setting_key: "VARCHAR(100) PRIMARY KEY",
        setting_value: "TEXT"
    }
};

// Automatically inspects database tables and adds any newly defined columns safely without affecting existing data
async function autoMigrateColumns(connection) {
    for (const [table, columns] of Object.entries(SCHEMA_COLUMNS)) {
        try {
            const [existing] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
            const existingNames = new Set(existing.map(c => c.Field.toLowerCase()));

            for (const [colName, colDef] of Object.entries(columns)) {
                if (!existingNames.has(colName.toLowerCase())) {
                    console.log(`[SCHEMA AUTO-MIGRATE] Adding new column \`${colName}\` to table \`${table}\`...`);
                    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${colName}\` ${colDef}`);
                    console.log(`[SCHEMA AUTO-MIGRATE] Successfully added \`${colName}\` to \`${table}\` (Existing data preserved)`);
                }
            }
        } catch (e) {
            console.error(`[SCHEMA AUTO-MIGRATE] Error checking table \`${table}\`:`, e.message);
        }
    }
}

// Automated non-destructive backup of full database state to disk
async function safeBackupData() {
    try {
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const state = await getFullState();
        if (state && state.users && state.users.length > 0) {
            const dateStr = new Date().toISOString().split('T')[0];
            fs.writeFileSync(path.join(backupDir, `db_backup_${dateStr}.json`), JSON.stringify(state, null, 2), 'utf-8');
            fs.writeFileSync(path.join(backupDir, 'db_backup_latest.json'), JSON.stringify(state, null, 2), 'utf-8');
            console.log('[DATABASE BACKUP] Auto-backup verified: backups/db_backup_latest.json');
        }
    } catch (e) {
        console.warn('[DATABASE BACKUP] Auto-backup notice:', e.message);
    }
}

// Initialize Schema & Tables in MySQL
async function initSchema() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id VARCHAR(50) PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                client_email VARCHAR(255) DEFAULT '',
                site_url VARCHAR(500) DEFAULT '',
                bug_type VARCHAR(100) DEFAULT '',
                description TEXT,
                severity VARCHAR(50) DEFAULT 'Medium',
                status VARCHAR(50) DEFAULT 'Pending',
                date VARCHAR(50) DEFAULT '',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS earnings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                month VARCHAR(50) UNIQUE NOT NULL,
                amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS bug_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(100) UNIQUE NOT NULL,
                count INT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS homepage_content (
                id INT PRIMARY KEY,
                name VARCHAR(255),
                title VARCHAR(255),
                avatar VARCHAR(500),
                about TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                layout VARCHAR(50) DEFAULT 'standard',
                content LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS smtp_config (
                id INT PRIMARY KEY,
                host VARCHAR(255) DEFAULT '',
                port INT DEFAULT 587,
                secure TINYINT(1) DEFAULT 0,
                user VARCHAR(255) DEFAULT '',
                pass VARCHAR(255) DEFAULT '',
                auth_type VARCHAR(50) DEFAULT 'password',
                oauth_client_id VARCHAR(500) DEFAULT '',
                oauth_client_secret VARCHAR(500) DEFAULT '',
                oauth_refresh_token TEXT,
                oauth_access_token TEXT,
                oauth_user VARCHAR(255) DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Migration helper: add columns if table existed previously
        const [smtpCols] = await connection.query('SHOW COLUMNS FROM smtp_config');
        const smtpColNames = smtpCols.map(c => c.Field);
        if (!smtpColNames.includes('auth_type')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN auth_type VARCHAR(50) DEFAULT 'password'");
        }
        if (!smtpColNames.includes('oauth_client_id')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN oauth_client_id VARCHAR(500) DEFAULT ''");
        }
        if (!smtpColNames.includes('oauth_client_secret')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN oauth_client_secret VARCHAR(500) DEFAULT ''");
        }
        if (!smtpColNames.includes('oauth_refresh_token')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN oauth_refresh_token TEXT");
        }
        if (!smtpColNames.includes('oauth_access_token')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN oauth_access_token TEXT");
        }
        if (!smtpColNames.includes('oauth_user')) {
            await connection.query("ALTER TABLE smtp_config ADD COLUMN oauth_user VARCHAR(255) DEFAULT ''");
        }

        await connection.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255) DEFAULT '',
                email VARCHAR(255) DEFAULT '',
                phone VARCHAR(100) DEFAULT '',
                vat VARCHAR(100) DEFAULT '',
                address TEXT,
                created_at VARCHAR(100) DEFAULT '',
                updated_at VARCHAR(100) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id VARCHAR(100) PRIMARY KEY,
                number VARCHAR(100) UNIQUE NOT NULL,
                date VARCHAR(50) DEFAULT '',
                due_date VARCHAR(50) DEFAULT '',
                currency VARCHAR(10) DEFAULT 'USD',
                my_address TEXT,
                my_logo VARCHAR(500) DEFAULT '',
                client_name VARCHAR(255) DEFAULT '',
                client_company VARCHAR(255) DEFAULT '',
                client_email VARCHAR(255) DEFAULT '',
                client_phone VARCHAR(100) DEFAULT '',
                client_vat VARCHAR(100) DEFAULT '',
                client_address TEXT,
                bank_name VARCHAR(255) DEFAULT '',
                bank_account_name VARCHAR(255) DEFAULT '',
                bank_account_no VARCHAR(100) DEFAULT '',
                bank_routing VARCHAR(100) DEFAULT '',
                bank_swift VARCHAR(100) DEFAULT '',
                bank_branch VARCHAR(255) DEFAULT '',
                payment_method VARCHAR(100) DEFAULT '',
                payment_terms VARCHAR(100) DEFAULT '',
                po_number VARCHAR(100) DEFAULT '',
                items_json LONGTEXT,
                subtotal DECIMAL(12, 2) DEFAULT 0.00,
                tax_rate DECIMAL(6, 2) DEFAULT 0.00,
                tax_amount DECIMAL(12, 2) DEFAULT 0.00,
                discount_percent DECIMAL(6, 2) DEFAULT 0.00,
                discount_amount DECIMAL(12, 2) DEFAULT 0.00,
                total DECIMAL(12, 2) DEFAULT 0.00,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'Unpaid',
                created_at VARCHAR(100) DEFAULT '',
                updated_at VARCHAR(100) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS bank_details (
                id INT PRIMARY KEY,
                bank_name VARCHAR(255) DEFAULT '',
                account_name VARCHAR(255) DEFAULT '',
                account_number VARCHAR(100) DEFAULT '',
                routing_number VARCHAR(100) DEFAULT '',
                swift_code VARCHAR(100) DEFAULT '',
                branch VARCHAR(255) DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS meta_settings (
                setting_key VARCHAR(100) PRIMARY KEY,
                setting_value TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Non-destructive automated column migration for all schema tables
        await autoMigrateColumns(connection);
    } finally {
        connection.release();
    }
}

// Seed & Migrate Data from JSON / Defaults
async function seedAndMigrate() {
    await initSchema();

    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count > 0) {
        // Database already populated - perform non-destructive safe auto-backup
        await safeBackupData();
        return; // Preserves all existing live data
    }

    console.log('[DATABASE] Seeding MySQL database from legacy data...');
    let legacyData = null;

    if (fs.existsSync(JSON_LEGACY_FILE)) {
        try {
            const raw = fs.readFileSync(JSON_LEGACY_FILE, 'utf-8');
            legacyData = JSON.parse(raw);
        } catch (e) {
            console.error('[DATABASE MIGRATION] Failed to parse data.json:', e.message);
        }
    }

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
            bankName: "Dutch Bangla Bank PLC",
            accountName: "Abu Zannat Md Mosaddek",
            accountNumber: "1621010088950",
            routingNumber: "090851456",
            swiftCode: "DBBLBDDH",
            branch: "Rangpur Branch"
        }
    };

    const source = legacyData || DEFAULT_DATA;

    // 1. Users
    for (const u of (source.users || DEFAULT_DATA.users)) {
        await pool.query('INSERT IGNORE INTO users (username, password) VALUES (?, ?)', [u.username, u.password]);
    }

    // 2. Tickets
    for (const t of (source.tickets || [])) {
        await pool.query(`
            INSERT IGNORE INTO tickets (id, client_name, client_email, site_url, bug_type, description, severity, status, date, admin_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            t.id, t.clientName || 'Anonymous', t.clientEmail || '', t.siteUrl || '',
            t.bugType || 'General', t.description || '', t.severity || 'Medium',
            t.status || 'Pending', t.date || new Date().toISOString().split('T')[0], t.adminNotes || ''
        ]);
    }

    // 3. Earnings
    for (const e of (source.earnings || DEFAULT_DATA.earnings)) {
        await pool.query('INSERT IGNORE INTO earnings (month, amount) VALUES (?, ?)', [e.month, Number(e.amount) || 0]);
    }

    // 4. Bug Types
    for (const b of (source.bugTypes || DEFAULT_DATA.bugTypes)) {
        await pool.query('INSERT IGNORE INTO bug_types (type, count) VALUES (?, ?)', [b.type, Number(b.count) || 0]);
    }

    // 5. Homepage Content
    const hp = source.homepageContent || DEFAULT_DATA.homepageContent;
    await pool.query(`
        INSERT INTO homepage_content (id, name, title, avatar, about)
        VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), title = VALUES(title), avatar = VALUES(avatar), about = VALUES(about)
    `, [hp.name || '', hp.title || '', hp.avatar || 'assets/photo1.jpg', hp.about || '']);

    // 6. Pages
    for (const p of (source.pages || [])) {
        await pool.query('INSERT IGNORE INTO pages (title, slug, layout, content) VALUES (?, ?, ?, ?)', [
            p.title, p.slug, p.layout || 'standard', p.content || ''
        ]);
    }

    // 7. SMTP Config
    const smtp = source.smtpConfig || {};
    await pool.query(`
        INSERT INTO smtp_config (id, host, port, secure, user, pass)
        VALUES (1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE host = VALUES(host), port = VALUES(port), secure = VALUES(secure), user = VALUES(user), pass = VALUES(pass)
    `, [smtp.host || '', smtp.port ? parseInt(smtp.port) : 587, smtp.secure ? 1 : 0, smtp.user || '', smtp.pass || '']);

    // 8. Bank Details
    const bank = source.bankDetails || DEFAULT_DATA.bankDetails;
    await pool.query(`
        INSERT INTO bank_details (id, bank_name, account_name, account_number, routing_number, swift_code, branch)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            bank_name = VALUES(bank_name), account_name = VALUES(account_name),
            account_number = VALUES(account_number), routing_number = VALUES(routing_number),
            swift_code = VALUES(swift_code), branch = VALUES(branch)
    `, [
        bank.bankName || '', bank.accountName || '', bank.accountNumber || '',
        bank.routingNumber || '', bank.swiftCode || '', bank.branch || ''
    ]);

    // 9. Clients
    for (const c of (source.clients || [])) {
        await pool.query(`
            INSERT IGNORE INTO clients (id, name, company, email, phone, vat, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            c.id || ('cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
            c.name || 'Client', c.company || '', c.email || '', c.phone || '',
            c.vat || '', c.address || '', c.createdAt || new Date().toISOString(), c.updatedAt || new Date().toISOString()
        ]);
    }

    // 10. Invoices
    for (const inv of (source.invoices || [])) {
        await pool.query(`
            INSERT IGNORE INTO invoices (
                id, number, date, due_date, currency, my_address, my_logo,
                client_name, client_company, client_email, client_phone, client_vat, client_address,
                bank_name, bank_account_name, bank_account_no, bank_routing, bank_swift, bank_branch,
                payment_method, payment_terms, po_number, items_json, subtotal, tax_rate, tax_amount,
                discount_percent, discount_amount, total, notes, status, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            )
        `, [
            inv.id || ('inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
            inv.number || `INV-${source.nextInvoiceNum || 1001}`,
            inv.date || '', inv.dueDate || '', inv.currency || 'USD',
            inv.myAddress || '', inv.myLogo || '', inv.clientName || '',
            inv.clientCompany || '', inv.clientEmail || '', inv.clientPhone || '',
            inv.clientVat || '', inv.clientAddress || '', inv.bankName || '',
            inv.bankAccountName || '', inv.bankAccountNo || '', inv.bankRouting || '',
            inv.bankSwift || '', inv.bankBranch || '', inv.paymentMethod || '',
            inv.paymentTerms || '', inv.poNumber || '', JSON.stringify(inv.items || []),
            Number(inv.subtotal) || 0, Number(inv.taxRate) || 0, Number(inv.taxAmount) || 0,
            Number(inv.discountPercent) || 0, Number(inv.discountAmount) || 0, Number(inv.total) || 0,
            inv.notes || '', inv.status || 'Unpaid', inv.createdAt || new Date().toISOString(),
            inv.updatedAt || new Date().toISOString()
        ]);
    }

    // 11. Next Invoice Num
    const nextNum = source.nextInvoiceNum || 1008;
    await pool.query(`
        INSERT INTO meta_settings (setting_key, setting_value)
        VALUES ('nextInvoiceNum', ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [String(nextNum)]);

    console.log('[DATABASE] MySQL database initialized and fully seeded successfully!');
}

// ----------------------------------------------------
// Database Access Methods (Async/Await API)
// ----------------------------------------------------

function formatInvoiceRow(inv) {
    if (!inv) return null;
    let items = [];
    try { items = JSON.parse(inv.items_json); } catch(e) {}
    return {
        id: inv.id,
        number: inv.number,
        date: inv.date || '',
        dueDate: inv.due_date || '',
        currency: inv.currency || 'USD',
        myAddress: inv.my_address || '',
        myLogo: inv.my_logo || '',
        clientName: inv.client_name || '',
        clientCompany: inv.client_company || '',
        clientEmail: inv.client_email || '',
        clientPhone: inv.client_phone || '',
        clientVat: inv.client_vat || '',
        clientAddress: inv.client_address || '',
        bankName: inv.bank_name || '',
        bankAccountName: inv.bank_account_name || '',
        bankAccountNo: inv.bank_account_no || '',
        bankRouting: inv.bank_routing || '',
        bankSwift: inv.bank_swift || '',
        bankBranch: inv.bank_branch || '',
        paymentMethod: inv.payment_method || '',
        paymentTerms: inv.payment_terms || '',
        poNumber: inv.po_number || '',
        items,
        subtotal: Number(inv.subtotal) || 0,
        taxRate: Number(inv.tax_rate) || 0,
        taxAmount: Number(inv.tax_amount) || 0,
        discountPercent: Number(inv.discount_percent) || 0,
        discountAmount: Number(inv.discount_amount) || 0,
        total: Number(inv.total) || 0,
        notes: inv.notes || '',
        status: inv.status || 'Unpaid',
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
    };
}

async function getFullState() {
    // 1. Users
    const [users] = await pool.query('SELECT username, password FROM users');

    // 2. Tickets
    const [ticketsRows] = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    const tickets = ticketsRows.map(t => ({
        id: t.id,
        clientName: t.client_name,
        clientEmail: t.client_email,
        siteUrl: t.site_url,
        bugType: t.bug_type,
        description: t.description,
        severity: t.severity,
        status: t.status,
        date: t.date,
        adminNotes: t.admin_notes || ''
    }));

    // 3. Earnings
    const [earnings] = await pool.query('SELECT month, CAST(amount AS DOUBLE) as amount FROM earnings ORDER BY id ASC');

    // 4. Bug Types
    const [bugTypes] = await pool.query('SELECT type, count FROM bug_types ORDER BY id ASC');

    // 5. Homepage Content
    const [hpRows] = await pool.query('SELECT name, title, avatar, about FROM homepage_content WHERE id = 1');
    const hpRow = hpRows[0] || {};
    const homepageContent = {
        name: hpRow.name || 'Abu Zannat',
        title: hpRow.title || 'WordPress Specialist & Web Developer',
        avatar: hpRow.avatar || 'assets/photo1.jpg',
        about: hpRow.about || ''
    };

    // 6. Pages
    const [pages] = await pool.query('SELECT title, slug, layout, content FROM pages ORDER BY id ASC');

    // 7. SMTP Config
    const [smtpRows] = await pool.query('SELECT * FROM smtp_config WHERE id = 1');
    const smtpRow = smtpRows[0] || {};
    const smtpConfig = {
        host: smtpRow.host || '',
        port: smtpRow.port ? String(smtpRow.port) : '',
        secure: Boolean(smtpRow.secure),
        user: smtpRow.user || '',
        pass: smtpRow.pass || '',
        authType: smtpRow.auth_type || 'password',
        oauthClientId: smtpRow.oauth_client_id || process.env.GOOGLE_CLIENT_ID || '',
        oauthUser: smtpRow.oauth_user || '',
        hasRefreshToken: Boolean(smtpRow.oauth_refresh_token),
        isConnected: Boolean((smtpRow.auth_type === 'oauth2' && smtpRow.oauth_refresh_token) || (smtpRow.user && smtpRow.pass))
    };

    // 8. Clients
    const [clientsRows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    const clients = clientsRows.map(c => ({
        id: c.id,
        name: c.name,
        company: c.company || '',
        email: c.email || '',
        phone: c.phone || '',
        vat: c.vat || '',
        address: c.address || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at
    }));

    // 9. Invoices
    const [invoicesRows] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    const invoices = invoicesRows.map(formatInvoiceRow);

    // 10. Next Invoice Num
    const [metaRows] = await pool.query('SELECT setting_value FROM meta_settings WHERE setting_key = ?', ['nextInvoiceNum']);
    const nextInvoiceNum = metaRows.length > 0 ? parseInt(metaRows[0].setting_value) : 1001;

    // 11. Bank Details
    const [bankRows] = await pool.query('SELECT * FROM bank_details WHERE id = 1');
    const bankRow = bankRows[0] || {};
    const bankDetails = {
        bankName: bankRow.bank_name || 'Dutch Bangla Bank PLC',
        accountName: bankRow.account_name || 'Abu Zannat Md Mosaddek',
        accountNumber: bankRow.account_number || '1621010088950',
        routingNumber: bankRow.routing_number || '090851456',
        swiftCode: bankRow.swift_code || 'DBBLBDDH',
        branch: bankRow.branch || 'Rangpur Branch'
    };

    return {
        users,
        tickets,
        earnings,
        bugTypes,
        homepageContent,
        pages,
        smtpConfig,
        clients,
        invoices,
        nextInvoiceNum,
        bankDetails
    };
}

// User Operations
async function authenticateUser(username, password) {
    const [rows] = await pool.query('SELECT username FROM users WHERE username = ? AND password = ?', [username, password]);
    return rows.length > 0;
}

async function saveUser(username, password) {
    await pool.query(`
        INSERT INTO users (username, password) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [username, password]);
}

async function deleteUser(username) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count <= 1) {
        throw new Error('Cannot delete the only administrative user.');
    }
    const [result] = await pool.query('DELETE FROM users WHERE username = ?', [username]);
    if (result.affectedRows === 0) {
        throw new Error('User not found.');
    }
}

// Ticket Operations
async function addTicket({ clientName, clientEmail, siteUrl, bugType, description, severity }) {
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM tickets');
    const totalCount = countRows[0].count + 1;
    const ticketId = `TKT-2026-${String(totalCount).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    await pool.query(`
        INSERT INTO tickets (id, client_name, client_email, site_url, bug_type, description, severity, status, date, admin_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, '')
    `, [ticketId, clientName, clientEmail || '', siteUrl || '', bugType || 'General', description || '', severity || 'Medium', today]);

    await pool.query(`
        INSERT INTO bug_types (type, count) VALUES (?, 1)
        ON DUPLICATE KEY UPDATE count = count + 1
    `, [bugType || 'General']);

    return { ticketId, date: today };
}

async function updateTicket(id, status, adminNotes) {
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (ticketRows.length === 0) throw new Error('Ticket not found');

    const previousStatus = ticketRows[0].status;
    const newStatus = status !== undefined ? status : ticketRows[0].status;
    const newNotes = adminNotes !== undefined ? adminNotes : ticketRows[0].admin_notes;

    await pool.query('UPDATE tickets SET status = ?, admin_notes = ? WHERE id = ?', [newStatus, newNotes, id]);

    if (newStatus === 'Resolved' && previousStatus !== 'Resolved') {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = months[new Date().getMonth()];
        await pool.query(`
            INSERT INTO earnings (month, amount) VALUES (?, 5000)
            ON DUPLICATE KEY UPDATE amount = amount + 5000
        `, [currentMonth]);
    }
}

async function deleteTicket(id) {
    const [res] = await pool.query('DELETE FROM tickets WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw new Error('Ticket not found');
}

// Homepage Content Operations
async function updateHomepage({ name, title, avatar, about }) {
    await pool.query(`
        INSERT INTO homepage_content (id, name, title, avatar, about)
        VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), title = VALUES(title), avatar = VALUES(avatar), about = VALUES(about)
    `, [name, title, avatar, about]);
}

// CMS Pages Operations
async function savePage({ title, slug, layout, content, oldSlug }) {
    if (oldSlug) {
        if (slug !== oldSlug) {
            const [existing] = await pool.query('SELECT id FROM pages WHERE slug = ?', [slug]);
            if (existing.length > 0) throw new Error('A page with this URL slug already exists.');
        }
        await pool.query(`
            UPDATE pages
            SET title = ?, slug = ?, layout = ?, content = ?
            WHERE slug = ?
        `, [title, slug, layout || 'standard', content || '', oldSlug]);
    } else {
        const [existing] = await pool.query('SELECT id FROM pages WHERE slug = ?', [slug]);
        if (existing.length > 0) throw new Error('A page with this URL slug already exists.');

        await pool.query(`
            INSERT INTO pages (title, slug, layout, content)
            VALUES (?, ?, ?, ?)
        `, [title, slug, layout || 'standard', content || '']);
    }
}

async function deletePage(slug) {
    const [res] = await pool.query('DELETE FROM pages WHERE slug = ?', [slug]);
    if (res.affectedRows === 0) throw new Error('Page not found.');
}

// SMTP & Gmail Config Operations
async function updateSmtp({ host, port, secure, user, pass, auth_type }) {
    await pool.query(`
        INSERT INTO smtp_config (id, host, port, secure, user, pass, auth_type)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            host = VALUES(host), port = VALUES(port), secure = VALUES(secure),
            user = VALUES(user), pass = VALUES(pass), auth_type = VALUES(auth_type)
    `, [host || '', port ? parseInt(port) : 587, secure ? 1 : 0, user || '', pass || '', auth_type || 'password']);
}

async function getSmtpConfig() {
    const [rows] = await pool.query('SELECT * FROM smtp_config WHERE id = 1');
    if (rows.length === 0) return {};
    const row = rows[0];
    return {
        host: row.host || '',
        port: row.port || 587,
        secure: Boolean(row.secure),
        user: row.user || row.oauth_user || '',
        pass: row.pass || '',
        auth_type: row.auth_type || 'password',
        oauth_client_id: row.oauth_client_id || process.env.GOOGLE_CLIENT_ID || '',
        oauth_client_secret: row.oauth_client_secret || process.env.GOOGLE_CLIENT_SECRET || '',
        oauth_refresh_token: row.oauth_refresh_token || '',
        oauth_access_token: row.oauth_access_token || '',
        oauth_user: row.oauth_user || ''
    };
}

async function saveGoogleOAuthCredentials({ clientId, clientSecret }) {
    await pool.query(`
        INSERT INTO smtp_config (id, oauth_client_id, oauth_client_secret)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE
            oauth_client_id = VALUES(oauth_client_id),
            oauth_client_secret = VALUES(oauth_client_secret)
    `, [clientId || '', clientSecret || '']);
}

async function saveGoogleOAuthTokens({ email, refreshToken, accessToken }) {
    await pool.query(`
        INSERT INTO smtp_config (id, auth_type, oauth_user, user, oauth_refresh_token, oauth_access_token)
        VALUES (1, 'oauth2', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            auth_type = 'oauth2',
            oauth_user = VALUES(oauth_user),
            user = VALUES(user),
            oauth_refresh_token = IF(VALUES(oauth_refresh_token) != '', VALUES(oauth_refresh_token), oauth_refresh_token),
            oauth_access_token = VALUES(oauth_access_token)
    `, [email || '', email || '', refreshToken || '', accessToken || '']);
}

async function disconnectGoogleOAuth() {
    await pool.query(`
        UPDATE smtp_config
        SET auth_type = 'password',
            user = '',
            pass = '',
            host = 'smtp.gmail.com',
            oauth_refresh_token = '',
            oauth_access_token = '',
            oauth_user = ''
        WHERE id = 1
    `);
}

// Bank Details Operations
async function updateBankDetails({ bankName, accountName, accountNumber, routingNumber, swiftCode, branch }) {
    await pool.query(`
        INSERT INTO bank_details (id, bank_name, account_name, account_number, routing_number, swift_code, branch)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            bank_name = VALUES(bank_name), account_name = VALUES(account_name),
            account_number = VALUES(account_number), routing_number = VALUES(routing_number),
            swift_code = VALUES(swift_code), branch = VALUES(branch)
    `, [
        (bankName || '').trim(), (accountName || '').trim(), (accountNumber || '').trim(),
        (routingNumber || '').trim(), (swiftCode || '').trim(), (branch || '').trim()
    ]);
    const state = await getFullState();
    return state.bankDetails;
}

// Client Directory Operations
async function saveClient(clientData) {
    if (!clientData.name || !clientData.name.trim()) {
        throw new Error('Client name is required');
    }

    const nameClean = clientData.name.trim();
    const emailClean = (clientData.email || '').trim();

    let existing = null;
    if (clientData.id) {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [clientData.id]);
        if (rows.length > 0) existing = rows[0];
    } else if (emailClean) {
        const [rows] = await pool.query('SELECT * FROM clients WHERE LOWER(email) = LOWER(?)', [emailClean]);
        if (rows.length > 0) existing = rows[0];
    } else {
        const [rows] = await pool.query('SELECT * FROM clients WHERE LOWER(name) = LOWER(?)', [nameClean]);
        if (rows.length > 0) existing = rows[0];
    }

    const id = existing ? existing.id : (clientData.id || ('cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)));
    const nowStr = new Date().toISOString();

    await pool.query(`
        INSERT INTO clients (id, name, company, email, phone, vat, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name), company = VALUES(company), email = VALUES(email),
            phone = VALUES(phone), vat = VALUES(vat), address = VALUES(address),
            updated_at = VALUES(updated_at)
    `, [
        id, nameClean, (clientData.company || '').trim(), emailClean,
        (clientData.phone || '').trim(), (clientData.vat || '').trim(),
        (clientData.address || '').trim(), existing ? existing.created_at : nowStr, nowStr
    ]);

    const [savedRows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    return savedRows[0];
}

async function deleteClient(id) {
    await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    const [remaining] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    return remaining;
}

// Invoice Operations
async function saveInvoice(inv) {
    if (inv.clientName && inv.clientName.trim() && inv.saveClient !== false) {
        await saveClient({
            name: inv.clientName,
            company: inv.clientCompany,
            email: inv.clientEmail,
            phone: inv.clientPhone,
            vat: inv.clientVat,
            address: inv.clientAddress
        });
    }

    let invoiceId = inv.id;
    let invoiceNumber = inv.number;

    if (invoiceId) {
        const [existingRows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        if (existingRows.length > 0) {
            invoiceNumber = existingRows[0].number;
        }
    }

    if (!invoiceId) {
        invoiceId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        const [metaRows] = await pool.query('SELECT setting_value FROM meta_settings WHERE setting_key = ?', ['nextInvoiceNum']);
        let nextNum = metaRows.length > 0 ? parseInt(metaRows[0].setting_value) : 1001;
        invoiceNumber = `INV-${nextNum}`;
        await pool.query(`
            INSERT INTO meta_settings (setting_key, setting_value)
            VALUES ('nextInvoiceNum', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [String(nextNum + 1)]);
    }

    const itemsJson = JSON.stringify(inv.items || []);
    const nowStr = new Date().toISOString();

    await pool.query(`
        INSERT INTO invoices (
            id, number, date, due_date, currency, my_address, my_logo,
            client_name, client_company, client_email, client_phone, client_vat, client_address,
            bank_name, bank_account_name, bank_account_no, bank_routing, bank_swift, bank_branch,
            payment_method, payment_terms, po_number, items_json, subtotal, tax_rate, tax_amount,
            discount_percent, discount_amount, total, notes, status, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
            date = VALUES(date), due_date = VALUES(due_date), currency = VALUES(currency),
            my_address = VALUES(my_address), my_logo = VALUES(my_logo),
            client_name = VALUES(client_name), client_company = VALUES(client_company),
            client_email = VALUES(client_email), client_phone = VALUES(client_phone),
            client_vat = VALUES(client_vat), client_address = VALUES(client_address),
            bank_name = VALUES(bank_name), bank_account_name = VALUES(bank_account_name),
            bank_account_no = VALUES(bank_account_no), bank_routing = VALUES(bank_routing),
            bank_swift = VALUES(bank_swift), bank_branch = VALUES(bank_branch),
            payment_method = VALUES(payment_method), payment_terms = VALUES(payment_terms),
            po_number = VALUES(po_number), items_json = VALUES(items_json),
            subtotal = VALUES(subtotal), tax_rate = VALUES(tax_rate), tax_amount = VALUES(tax_amount),
            discount_percent = VALUES(discount_percent), discount_amount = VALUES(discount_amount),
            total = VALUES(total), notes = VALUES(notes), status = VALUES(status),
            updated_at = VALUES(updated_at)
    `, [
        invoiceId, invoiceNumber, inv.date || '', inv.dueDate || '', inv.currency || 'USD',
        inv.myAddress || '', inv.myLogo || '', inv.clientName || '', inv.clientCompany || '',
        inv.clientEmail || '', inv.clientPhone || '', inv.clientVat || '', inv.clientAddress || '',
        inv.bankName || '', inv.bankAccountName || '', inv.bankAccountNo || '', inv.bankRouting || '',
        inv.bankSwift || '', inv.bankBranch || '', inv.paymentMethod || '', inv.paymentTerms || '',
        inv.poNumber || '', itemsJson, Number(inv.subtotal) || 0, Number(inv.taxRate) || 0,
        Number(inv.taxAmount) || 0, Number(inv.discountPercent) || 0, Number(inv.discountAmount) || 0,
        Number(inv.total) || 0, inv.notes || '', inv.status || 'Unpaid',
        inv.createdAt || nowStr, nowStr
    ]);

    const [savedRows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    return formatInvoiceRow(savedRows[0]);
}

async function deleteInvoice(id) {
    await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
}

// Backup & Restore
async function exportDatabaseJson() {
    const state = await getFullState();
    return JSON.stringify(state, null, 2);
}

async function restoreDatabaseFromJson(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM tickets');
    await pool.query('DELETE FROM earnings');
    await pool.query('DELETE FROM bug_types');
    await pool.query('DELETE FROM homepage_content');
    await pool.query('DELETE FROM pages');
    await pool.query('DELETE FROM smtp_config');
    await pool.query('DELETE FROM clients');
    await pool.query('DELETE FROM invoices');
    await pool.query('DELETE FROM bank_details');
    await pool.query('DELETE FROM meta_settings');

    if (data.users) {
        for (const u of data.users) {
            await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [u.username, u.password]);
        }
    }
    if (data.tickets) {
        for (const t of data.tickets) {
            await pool.query('INSERT INTO tickets (id, client_name, client_email, site_url, bug_type, description, severity, status, date, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                t.id, t.clientName, t.clientEmail || '', t.siteUrl || '', t.bugType || '', t.description || '', t.severity || 'Medium', t.status || 'Pending', t.date || '', t.adminNotes || ''
            ]);
        }
    }
    if (data.earnings) {
        for (const e of data.earnings) {
            await pool.query('INSERT INTO earnings (month, amount) VALUES (?, ?)', [e.month, Number(e.amount) || 0]);
        }
    }
    if (data.bugTypes) {
        for (const b of data.bugTypes) {
            await pool.query('INSERT INTO bug_types (type, count) VALUES (?, ?)', [b.type, Number(b.count) || 0]);
        }
    }
    if (data.homepageContent) {
        const hp = data.homepageContent;
        await pool.query('INSERT INTO homepage_content (id, name, title, avatar, about) VALUES (1, ?, ?, ?, ?)', [
            hp.name || '', hp.title || '', hp.avatar || '', hp.about || ''
        ]);
    }
    if (data.pages) {
        for (const p of data.pages) {
            await pool.query('INSERT INTO pages (title, slug, layout, content) VALUES (?, ?, ?, ?)', [
                p.title, p.slug, p.layout || 'standard', p.content || ''
            ]);
        }
    }
    if (data.smtpConfig) {
        const smtp = data.smtpConfig;
        await pool.query('INSERT INTO smtp_config (id, host, port, secure, user, pass) VALUES (1, ?, ?, ?, ?, ?)', [
            smtp.host || '', smtp.port ? parseInt(smtp.port) : 587, smtp.secure ? 1 : 0, smtp.user || '', smtp.pass || ''
        ]);
    }
    if (data.bankDetails) {
        const b = data.bankDetails;
        await pool.query('INSERT INTO bank_details (id, bank_name, account_name, account_number, routing_number, swift_code, branch) VALUES (1, ?, ?, ?, ?, ?, ?)', [
            b.bankName || '', b.accountName || '', b.accountNumber || '', b.routingNumber || '', b.swiftCode || '', b.branch || ''
        ]);
    }
    if (data.clients) {
        for (const c of data.clients) {
            await pool.query('INSERT INTO clients (id, name, company, email, phone, vat, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                c.id, c.name, c.company || '', c.email || '', c.phone || '', c.vat || '', c.address || '', c.createdAt || new Date().toISOString(), c.updatedAt || new Date().toISOString()
            ]);
        }
    }
    if (data.invoices) {
        for (const inv of data.invoices) {
            await pool.query(`
                INSERT INTO invoices (
                    id, number, date, due_date, currency, my_address, my_logo,
                    client_name, client_company, client_email, client_phone, client_vat, client_address,
                    bank_name, bank_account_name, bank_account_no, bank_routing, bank_swift, bank_branch,
                    payment_method, payment_terms, po_number, items_json, subtotal, tax_rate, tax_amount,
                    discount_percent, discount_amount, total, notes, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                inv.id, inv.number, inv.date || '', inv.dueDate || '', inv.currency || 'USD',
                inv.myAddress || '', inv.myLogo || '', inv.clientName || '', inv.clientCompany || '',
                inv.clientEmail || '', inv.clientPhone || '', inv.clientVat || '', inv.clientAddress || '',
                inv.bankName || '', inv.bankAccountName || '', inv.bankAccountNo || '', inv.bankRouting || '',
                inv.bankSwift || '', inv.bankBranch || '', inv.paymentMethod || '', inv.paymentTerms || '',
                inv.poNumber || '', JSON.stringify(inv.items || []), Number(inv.subtotal) || 0,
                Number(inv.taxRate) || 0, Number(inv.taxAmount) || 0, Number(inv.discountPercent) || 0,
                Number(inv.discountAmount) || 0, Number(inv.total) || 0, inv.notes || '', inv.status || 'Unpaid',
                inv.createdAt || new Date().toISOString(), inv.updatedAt || new Date().toISOString()
            ]);
        }
    }
    if (data.nextInvoiceNum) {
        await pool.query(`
            INSERT INTO meta_settings (setting_key, setting_value)
            VALUES ('nextInvoiceNum', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [String(data.nextInvoiceNum)]);
    }
}

// Auto-seed on start
seedAndMigrate().catch(err => {
    console.error('[DATABASE] MySQL initialization error:', err.message);
});

module.exports = {
    pool,
    initSchema,
    seedAndMigrate,
    getFullState,
    authenticateUser,
    saveUser,
    deleteUser,
    addTicket,
    updateTicket,
    deleteTicket,
    updateHomepage,
    savePage,
    deletePage,
    updateSmtp,
    getSmtpConfig,
    saveGoogleOAuthCredentials,
    saveGoogleOAuthTokens,
    disconnectGoogleOAuth,
    updateBankDetails,
    saveClient,
    deleteClient,
    saveInvoice,
    deleteInvoice,
    exportDatabaseJson,
    restoreDatabaseFromJson,
    safeBackupData,
    autoMigrateColumns
};
