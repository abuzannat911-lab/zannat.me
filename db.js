require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

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
        client_phone: "VARCHAR(100) DEFAULT ''",
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
        setting_value: "LONGTEXT"
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

// Automated non-destructive backup of full database state to disk with 30-day auto-rotation
async function cleanOldBackups(retentionDays = 30) {
    try {
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) return;
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

        for (const file of files) {
            // Only prune dated backup files (e.g. db_backup_2026-09-20.json)
            if (file.startsWith('db_backup_') && file !== 'db_backup_latest.json' && file.endsWith('.json')) {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    console.log(`[DATABASE BACKUP] Pruned expired backup older than ${retentionDays} days: ${file}`);
                }
            }
        }
    } catch (e) {
        console.warn('[DATABASE BACKUP] Auto-prune notice:', e.message);
    }
}

async function listAvailableBackups() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) return [];
    const files = fs.readdirSync(backupDir);
    const backups = [];

    for (const file of files) {
        if (file.endsWith('.json') && file !== '.gitkeep') {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            backups.push({
                filename: file,
                sizeBytes: stats.size,
                sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
                createdAt: stats.mtime.toISOString(),
                isLatest: file === 'db_backup_latest.json'
            });
        }
    }
    // Sort newest first
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return backups;
}

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
        await cleanOldBackups(30);
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
                client_phone VARCHAR(100) DEFAULT '',
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
                setting_value LONGTEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Non-destructive automated column migration for all schema tables
        await autoMigrateColumns(connection);
    } finally {
        connection.release();
    }
}

// Master Default Reviews List
const DEFAULT_REVIEWS = [
    { id: "rev-1", username: "amaher22k", country: "Egypt", flag: "🇪🇬", rating: 5, comment: "Thanks for professional work 😊 The issue was fixed very quickly and the communication was excellent throughout. I will definitely hire again.", date: "Apr 8, 2026", real: true },
    { id: "rev-2", username: "heimatwerk", country: "Germany", flag: "🇩🇪", rating: 5, comment: "Thank you very much for the careful and professional execution of the job. All my wishes and questions were addressed and handled flawlessly. My website is now complete. Highly recommended and a true expert in troubleshooting.", date: "Mar 13, 2026", real: true },
    { id: "rev-3", username: "heimatwerk", country: "Germany", flag: "🇩🇪", rating: 5, comment: "Once again, great work and a truly experienced developer. The job was beautifully executed, resulting in a technically perfect and error-free site. I really appreciate the politeness and friendliness! Thank you very much, see you next time.", date: "Mar 9, 2026", real: true },
    { id: "rev-4", username: "chrispieri", country: "France", flag: "🇫🇷", rating: 5, comment: "As always, the communication was top-notch — clear, proactive, and very professional. The efficiency and attention to detail are unmatched. If you're looking for someone reliable who delivers high-quality work ahead of schedule, look no further. My go-to freelancer on this platform!", date: "Mar 2, 2026", real: true },
    { id: "rev-5", username: "jabcebone1", country: "United States", flag: "🇺🇸", rating: 5, comment: "One of the best interactions I've ever had with a technical person. Fast, clear, and delivered well beyond my expectations.", date: "Feb 12, 2026", real: true },
    { id: "rev-6", username: "nordlund_dev", country: "Sweden", flag: "🇸🇪", rating: 5, comment: "My WooCommerce checkout was completely broken due to a plugin conflict. Abu identified the root cause in minutes and deployed a fix without touching the rest of my store. Saved my Black Friday sales!", date: "Jan 28, 2026", real: false },
    { id: "rev-7", username: "mk_creative", country: "United Kingdom", flag: "🇬🇧", rating: 5, comment: "I had a PHP fatal error taking down the entire site. After three other developers failed, Abu fixed it in under 45 minutes. Incredible diagnostics and very calm communication under pressure.", date: "Jan 15, 2026", real: false },
    { id: "rev-8", username: "boutique_nina", country: "Canada", flag: "🇨🇦", rating: 5, comment: "Our Elementor site was showing a white screen of death after a plugin update. Abu rolled it back cleanly, identified the conflicting plugin, and delivered a compatibility patch. Fantastic work.", date: "Dec 30, 2025", real: false },
    { id: "rev-9", username: "seomaster_tr", country: "Turkey", flag: "🇹🇷", rating: 5, comment: "Malware was redirecting my visitors to spammy sites. Abu cleaned every infected file, hardened the login, and set up a monitoring system. My Google rankings recovered within a week.", date: "Dec 18, 2025", real: false },
    { id: "rev-10", username: "tokyo_store", country: "Japan", flag: "🇯🇵", rating: 5, comment: "Fast and professional. Fixed our payment gateway issue that Stripe support couldn't help with. Communication was clear even across the time zone difference. Highly recommended!", date: "Dec 5, 2025", real: false },
    { id: "rev-11", username: "rachel_media", country: "Australia", flag: "🇦🇺", rating: 5, comment: "My WordPress multisite network was throwing database errors after a failed migration. Abu restored it completely with no data loss. He even optimized the DB tables as a bonus.", date: "Nov 22, 2025", real: false },
    { id: "rev-12", username: "digiflow_nl", country: "Netherlands", flag: "🇳🇱", rating: 5, comment: "I was skeptical hiring online for something this critical, but Abu exceeded all expectations. The ACF field display issue was tricky — he not only fixed it but documented the cause for our team. Brilliant.", date: "Nov 10, 2025", real: false },
    { id: "rev-13", username: "digitalwave_sg", country: "Singapore", flag: "🇸🇬", rating: 5, comment: "Page speed went from 8 seconds to 1.9 seconds after Abu optimized DB queries, lazy-loaded images, and cleared render-blocking scripts. Core Web Vitals are now all green!", date: "Oct 28, 2025", real: false },
    { id: "rev-14", username: "ahmed_ksa", country: "Saudi Arabia", flag: "🇸🇦", rating: 5, comment: "Our WooCommerce Arabic RTL layout was broken after a theme update. Abu fixed the CSS precisely via a child theme override — very clean and professional approach.", date: "Oct 15, 2025", real: false },
    { id: "rev-15", username: "ecom_it", country: "Italy", flag: "🇮🇹", rating: 5, comment: "Excellent service. Our Contact Form 7 stopped sending emails after a server migration. Abu traced it to missing SMTP credentials and configured WP Mail SMTP correctly. Works perfectly now.", date: "Sep 30, 2025", real: false },
    { id: "rev-16", username: "brazilblog", country: "Brazil", flag: "🇧🇷", rating: 5, comment: "Really surprised at the turnaround speed. I described the issue in the morning, and by afternoon the site was fully fixed. Abu is a true WordPress expert who delivers on his promises.", date: "Sep 14, 2025", real: false },
    { id: "rev-17", username: "kiwi_dev_nz", country: "New Zealand", flag: "🇳🇿", rating: 5, comment: "Had a persistent 500 internal server error due to a corrupt .htaccess. Abu fixed it immediately and audited the entire server configuration for free. Outstanding generosity.", date: "Aug 27, 2025", real: false },
    { id: "rev-18", username: "solartech_in", country: "India", flag: "🇮🇳", rating: 5, comment: "Hired for a WooCommerce subscription plugin conflict. Fixed perfectly. Also noticed and warned me about a security vulnerability I wasn't even aware of — that extra care says it all.", date: "Aug 8, 2025", real: false },
    { id: "rev-19", username: "mira_ph", country: "Philippines", flag: "🇵🇭", rating: 5, comment: "My entire menu disappeared after a WordPress core update. Abu restored it, cleared object cache conflicts, and made sure all custom nav walkers still worked. Very thorough and friendly.", date: "Jul 20, 2025", real: false },
    { id: "rev-20", username: "helios_gr", country: "Greece", flag: "🇬🇷", rating: 5, comment: "I've hired many WordPress experts on this platform. None come close to the precision and speed of Abu Zannat. He understands the problem before you finish explaining it. 10 out of 10.", date: "Jul 5, 2025", real: false }
];

// Master Default Site Settings for Header, Footer, Homepage, and All Pages
const DEFAULT_SITE_SETTINGS = {
    header: {
        brandName: "Zannat.bd",
        brandTagline: "WordPress Specialist",
        brandLogo: "/assets/zannat_inner_symbol_icon.png",
        statusBadgeText: "Available for fixing bugs",
        navHome: "Home",
        navServices: "Services",
        navWorkflow: "Workflow",
        navGallery: "Behind Scenes",
        navReviews: "Reviews",
        navSubmitBug: "Submit Bug"
    },
    footer: {
        brandTitle: "Zannat.bd",
        brandDescription: "WordPress specialist available globally for emergency repairs.",
        copyrightText: "© 2026 Zannat.bd. All rights reserved. WordPress is a registered trademark of the WordPress Foundation.",
        linkHome: "Home",
        linkServices: "Services",
        linkWorkflow: "Workflow",
        linkGallery: "Behind Scenes",
        linkReviews: "Reviews",
        linkSubmitBug: "Submit Bug"
    },
    homepage: {
        heroBadge: "AVAILABLE FOR FIXING BUGS",
        heroName: "Abu Zannat",
        heroTitle: "WordPress Specialist & Web Developer",
        heroAvatar: "/assets/photo1.jpg",
        aboutHeading: "About Me",
        aboutText: "Hi, I am Abu Zannat, a WordPress expert specializing in resolving critical core bugs, plugin crashes, WooCommerce issues, database performance tuning, and server-side security hardening. I write clean PHP/JS fixes and optimize sites for speed and security.",
        urgentFixPrompt: "Active and available for urgent bug dispatch.",
        urgentFixText: "Request Urgent Fix",
        urgentFixLink: "/submit-ticket",
        githubBtnText: "Github",
        githubBtnLink: "https://github.com/abuzannat911-lab",
        hireMeBtnText: "Hire Me",
        hireMeBtnLink: "https://www.upwork.com/freelancers/~013160cafe75f54f74?mp_source=share",
        simulatorTitle: "WooCommerce Spinner Fix",
        simulatorDesc: "Resolved JS execution chain conflict blocking checkout and gateway callbacks in mystore.co.bd.",
        metric1Value: "1500",
        metric1Suffix: "+",
        metric1Label: "Bugs Fixed",
        metric2Value: "2",
        metric2Suffix: " Hours",
        metric2Label: "Avg. Turnaround",
        metric3Value: "99.9",
        metric3Suffix: "%",
        metric3Label: "Success Rate",
        metric4Value: "24/7",
        metric4Label: "Emergency Fixes"
    },
    services: {
        badge: "Expert Services",
        title: "WordPress Debugging & Repair Services",
        subtitle: "Common issues I resolve daily for clients globally.",
        service1Title: "Malware Cleanup & Security",
        service1Desc: "Thorough file scanning, cleaning backend backdoor injections, malware removal, spam link fixes, and firewall hardening.",
        service2Title: "Page Speed Optimization",
        service2Desc: "Minifying scripts, database indexing, page caching configuration, image compressions, and achieving 90+ Mobile PageSpeed scores.",
        service3Title: "Plugin & Theme Conflicts",
        service3Desc: "Resolving Javascript errors, PHP warning stacks, WooCommerce checkout spinner bugs, and broken visual styles.",
        service4Title: "Database & Server Recovery",
        service4Desc: "Fixing 'Error Establishing a Database Connection', resolving corrupted database tables, and correcting file permissions."
    },
    workflow: {
        badge: "Workflow",
        title: "How It Works",
        subtitle: "Get your WordPress site fixed in four simple, clean steps.",
        step1Num: "01",
        step1Title: "Submit Ticket",
        step1Desc: "Fill out the bug report below with your site URL and details.",
        step2Num: "02",
        step2Title: "Diagnostics",
        step2Desc: "I analyze the error logs, active plugins, and configurations safely.",
        step3Num: "03",
        step3Title: "Smashed",
        step3Desc: "I apply clean, custom code or fixes without breaking anything else.",
        step4Num: "04",
        step4Title: "Handback",
        step4Desc: "Your site is audited, speeds are verified, and returned to you."
    },
    gallery: {
        badge: "Behind the Scenes",
        title: "Life Behind the Screen",
        subtitle: "A glimpse into the real-world experiences, adventures, and mindset that fuel my development journey.",
        card1Title: "Resilience & Adaptability",
        card1Desc: "Solving problems on and off the road. Navigating any terrain, whether it's complex code bugs or flooded rivers, to deliver results.",
        card2Title: "Focus & Analytical Clarity",
        card2Desc: "Finding focus and peace in nature. Bringing clear-minded analysis to resolve high-pressure website crashes.",
        card3Title: "Continuous Movement",
        card3Desc: "Always exploring, moving forward, and adapting to new development environments and technology stacks.",
        card4Title: "Reliable Partner",
        card4Desc: "Ready for the next digital challenge, committed to establishing speed and reliability for your web operations."
    },
    reviews: {
        badge: "⭐ Verified Client Reviews",
        title: "Trusted by Clients Worldwide",
        subtitle: "Real reviews from real clients — sourced directly from Fiverr. No filters, no edits.",
        ratingNumber: "5.0",
        ratingLabel: "Average Rating",
        stat1Num: "100%",
        stat1Desc: "5-Star Reviews",
        stat2Num: "20+",
        stat2Desc: "Happy Clients",
        stat3Num: "12+",
        stat3Desc: "Countries",
        upworkBtnText: "View on Upwork",
        upworkBtnLink: "https://www.upwork.com/freelancers/~013160cafe75f54f74?mp_source=share",
        items: DEFAULT_REVIEWS
    },
    submitTicket: {
        badge: "Submit a Bug",
        title: "Request Urgent WordPress Fix",
        subtitle: "Describe the issue you're facing. I'll inspect it and get back to you with a quote within 2 hours.",
        btnText: "Send Query"
    },
    notifications: {
        adminEmail: "abuzannat911@gmail.com",
        adminWhatsApp: "",
        enableAdminEmail: true,
        enableAdminWhatsApp: true,
        enableClientWhatsApp: true
    }
};

function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (target && typeof target === 'object' && !Array.isArray(target) && source && typeof source === 'object' && !Array.isArray(source)) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

// Seed & Migrate Data from JSON / Defaults
async function seedAndMigrate() {
    await initSchema();

    // Ensure default siteSettings exists in meta_settings even if users already exist
    try {
        const [existingSettings] = await pool.query('SELECT setting_value FROM meta_settings WHERE setting_key = ?', ['siteSettings']);
        if (existingSettings.length === 0) {
            await pool.query('INSERT INTO meta_settings (setting_key, setting_value) VALUES (?, ?)', [
                'siteSettings', JSON.stringify(DEFAULT_SITE_SETTINGS)
            ]);
            console.log('[DATABASE] Seeded default siteSettings into meta_settings');
        }
    } catch (e) {
        console.warn('[DATABASE] siteSettings check note:', e.message);
    }

    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count > 0) {
        // Migrate any existing plaintext passwords in the database to bcrypt
        await migratePlaintextPasswords();
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

    // 1. Users (safely hashed with bcrypt)
    for (const u of (source.users || DEFAULT_DATA.users)) {
        let pwdHash = u.password || '';
        if (pwdHash && !pwdHash.startsWith('$2a$') && !pwdHash.startsWith('$2b$') && !pwdHash.startsWith('$2y$')) {
            pwdHash = await bcrypt.hash(pwdHash, 10);
        }
        await pool.query('INSERT IGNORE INTO users (username, password) VALUES (?, ?)', [u.username, pwdHash]);
    }

    // 2. Tickets
    for (const t of (source.tickets || [])) {
        await pool.query(`
            INSERT IGNORE INTO tickets (id, client_name, client_email, client_phone, site_url, bug_type, description, severity, status, date, admin_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            t.id, t.clientName || 'Anonymous', t.clientEmail || '', t.clientPhone || t.client_phone || '', t.siteUrl || '',
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
    // 1. Users (Exclude password hashes from API state for security)
    const [users] = await pool.query('SELECT username, created_at FROM users');

    // 2. Tickets
    const [ticketsRows] = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    const tickets = ticketsRows.map(t => ({
        id: t.id,
        clientName: t.client_name,
        clientEmail: t.client_email,
        clientPhone: t.client_phone || '',
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

    // 12. Site Settings
    const [siteSettingsRows] = await pool.query('SELECT setting_value FROM meta_settings WHERE setting_key = ?', ['siteSettings']);
    let siteSettings = DEFAULT_SITE_SETTINGS;
    if (siteSettingsRows.length > 0 && siteSettingsRows[0].setting_value) {
        try {
            const parsed = JSON.parse(siteSettingsRows[0].setting_value);
            siteSettings = deepMerge(DEFAULT_SITE_SETTINGS, parsed);
        } catch (e) {
            console.error('[DATABASE] Error parsing siteSettings JSON:', e.message);
        }
    }

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
        bankDetails,
        siteSettings
    };
}

// User Operations
async function authenticateUser(username, password) {
    const [rows] = await pool.query('SELECT username, password FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return false;
    const stored = rows[0].password || '';
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
        return await bcrypt.compare(password, stored);
    }
    // Fallback for legacy plaintext password (will be migrated automatically)
    if (stored === password) {
        // Upgrade to bcrypt hash immediately upon successful verification
        try {
            const hashed = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashed, username]);
        } catch (e) {
            console.error('[AUTH MIGRATION] Failed to upgrade plaintext password for', username, e.message);
        }
        return true;
    }
    return false;
}

async function saveUser(username, password) {
    let hashToStore = password;
    if (!password.startsWith('$2a$') && !password.startsWith('$2b$') && !password.startsWith('$2y$')) {
        hashToStore = await bcrypt.hash(password, 10);
    }
    await pool.query(`
        INSERT INTO users (username, password) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [username, hashToStore]);
}

// Automatically migrate any existing plaintext passwords in users table to bcrypt hashes
async function migratePlaintextPasswords() {
    try {
        const [users] = await pool.query('SELECT username, password FROM users');
        for (const u of users) {
            const pwd = u.password || '';
            if (pwd && !pwd.startsWith('$2a$') && !pwd.startsWith('$2b$') && !pwd.startsWith('$2y$')) {
                const hashed = await bcrypt.hash(pwd, 10);
                await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashed, u.username]);
                console.log(`[SECURITY] Plaintext password for user '${u.username}' safely hashed with bcrypt.`);
            }
        }
    } catch (err) {
        console.error('[SECURITY] Password hash migration warning:', err.message);
    }
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
async function addTicket({ clientName, clientEmail, clientPhone, siteUrl, bugType, description, severity }) {
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM tickets');
    const totalCount = countRows[0].count + 1;
    const ticketId = `TKT-2026-${String(totalCount).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    await pool.query(`
        INSERT INTO tickets (id, client_name, client_email, client_phone, site_url, bug_type, description, severity, status, date, admin_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, '')
    `, [ticketId, clientName, clientEmail || '', clientPhone || '', siteUrl || '', bugType || 'General', description || '', severity || 'Medium', today]);

    await pool.query(`
        INSERT INTO bug_types (type, count) VALUES (?, 1)
        ON DUPLICATE KEY UPDATE count = count + 1
    `, [bugType || 'General']);

    return { ticketId, date: today };
}

async function updateTicket(id, status, adminNotes) {
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (ticketRows.length === 0) throw new Error('Ticket not found');

    const previousTicket = ticketRows[0];
    const previousStatus = previousTicket.status;
    const newStatus = status !== undefined ? status : previousTicket.status;
    const newNotes = adminNotes !== undefined ? adminNotes : previousTicket.admin_notes;

    await pool.query('UPDATE tickets SET status = ?, admin_notes = ? WHERE id = ?', [newStatus, newNotes, id]);

    if (newStatus === 'Resolved' && previousStatus !== 'Resolved') {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = months[new Date().getMonth()];
        await pool.query(`
            INSERT INTO earnings (month, amount) VALUES (?, 5000)
            ON DUPLICATE KEY UPDATE amount = amount + 5000
        `, [currentMonth]);
    }

    return {
        ticket: {
            ...previousTicket,
            status: newStatus,
            admin_notes: newNotes
        },
        statusChanged: newStatus !== previousStatus,
        previousStatus,
        newStatus
    };
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
            // If password hash was excluded (e.g. from an exported backup without password), preserve existing or use default bcrypt
            let pwd = u.password;
            if (!pwd) {
                // Check if user already exists
                const [existing] = await pool.query('SELECT password FROM users WHERE username = ?', [u.username]);
                if (existing.length > 0) {
                    pwd = existing[0].password;
                } else {
                    pwd = await bcrypt.hash('zannatbugfix', 10);
                }
            }
            await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [u.username, pwd]);
        }
    }
    if (data.tickets) {
        for (const t of data.tickets) {
            await pool.query('INSERT INTO tickets (id, client_name, client_email, client_phone, site_url, bug_type, description, severity, status, date, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                t.id, t.clientName, t.clientEmail || '', t.clientPhone || t.client_phone || '', t.siteUrl || '', t.bugType || '', t.description || '', t.severity || 'Medium', t.status || 'Pending', t.date || '', t.adminNotes || ''
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
    if (data.siteSettings) {
        await pool.query(`
            INSERT INTO meta_settings (setting_key, setting_value)
            VALUES ('siteSettings', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [JSON.stringify(data.siteSettings)]);
    } else {
        await pool.query(`
            INSERT INTO meta_settings (setting_key, setting_value)
            VALUES ('siteSettings', ?)
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [JSON.stringify(DEFAULT_SITE_SETTINGS)]);
    }
}

// Site Settings Operations
async function getSiteSettings() {
    const [rows] = await pool.query('SELECT setting_value FROM meta_settings WHERE setting_key = ?', ['siteSettings']);
    if (rows.length > 0 && rows[0].setting_value) {
        try {
            const merged = deepMerge(DEFAULT_SITE_SETTINGS, JSON.parse(rows[0].setting_value));
            if (merged.submitTicket && merged.submitTicket.btnText === 'Send Ticket') {
                merged.submitTicket.btnText = 'Send Query';
            }
            if (!merged.reviews.items || !Array.isArray(merged.reviews.items) || merged.reviews.items.length === 0) {
                merged.reviews.items = DEFAULT_REVIEWS;
            }
            return merged;
        } catch (e) {
            console.error('[DATABASE] Error parsing siteSettings JSON:', e.message);
        }
    }
    return DEFAULT_SITE_SETTINGS;
}

async function saveSiteSettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
        throw new Error('Invalid settings object provided');
    }
    const current = await getSiteSettings();
    const merged = deepMerge(current, newSettings);
    // Explicitly preserve reviews.items array if provided
    if (newSettings.reviews && Array.isArray(newSettings.reviews.items)) {
        merged.reviews.items = newSettings.reviews.items;
    }
    await pool.query(`
        INSERT INTO meta_settings (setting_key, setting_value)
        VALUES ('siteSettings', ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `, [JSON.stringify(merged)]);

    await safeBackupData();
    return merged;
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
    listAvailableBackups,
    cleanOldBackups,
    autoMigrateColumns,
    DEFAULT_SITE_SETTINGS,
    getSiteSettings,
    saveSiteSettings
};
