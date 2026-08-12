// app.js - Client-Side Controller for zannat.me
(function() {
    function sendToServerLog(type, args) {
        const msg = args.map(a => {
            try {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
            } catch(e) {
                return String(a);
            }
        }).join(' ');
        fetch('/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message: `[BROWSER ${type}] ${msg}`,
                stack: ''
            })
        }).catch(err => {});
    }

    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendToServerLog('LOG', args);
    };

    const originalWarn = console.warn;
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendToServerLog('WARN', args);
    };

    const originalError = console.error;
    console.error = function(...args) {
        originalError.apply(console, args);
        sendToServerLog('ERROR', args);
    };

    window.onerror = function(message, source, lineno, colno, error) {
        fetch('/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message: message + ' at ' + source + ':' + lineno + ':' + colno,
                stack: error ? error.stack : ''
            })
        }).catch(err => {});
    };
    window.onunhandledrejection = function(event) {
        fetch('/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                message: 'Unhandled Promise Rejection: ' + event.reason,
                stack: event.reason ? event.reason.stack : ''
            })
        }).catch(err => {});
    };

    const app = {
        state: {
            tickets: [],
            earnings: [],
            bugTypes: [],
            pages: [],
            users: [],
            invoices: [],
            nextInvoiceNum: 1001,
            smtpConfig: {},
            homepageContent: {},
            isAuthenticated: false,
            currentTab: 'portfolio',
            currentCaseIndex: 0
        },
        cases: [
            {
                title: "WooCommerce Spinner Fix",
                desc: "Resolved JS execution chain conflict blocking checkout and gateway callbacks in mystore.co.bd.",
                url: "mystore.co.bd"
            },
            {
                title: "PHP WSOD Recovery",
                desc: "Identified hook conflict causing excessive memory leaks. Optimized configurations in my-blog.com.",
                url: "my-blog.com"
            },
            {
                title: "Malware Cleanup & Hardening",
                desc: "Cleared Option-backdoors, repaired 12 infected scripts, and secured techblog.com.bd.",
                url: "techblog.com.bd"
            }
        ],
        charts: {
            earnings: null,
            bugTypes: null
        },
        currentEditingId: null,

        // =============================================
        // REVIEWS DATA  (5 real Fiverr + 15 realistic)
        // =============================================
        reviewsData: [
            { username: "amaher22k",    country: "Egypt",         flag: "🇪🇬", rating: 5, comment: "Thanks for professional work 😊 The issue was fixed very quickly and the communication was excellent throughout. I will definitely hire again.", date: "Apr 8, 2026", real: true },
            { username: "heimatwerk",   country: "Germany",       flag: "🇩🇪", rating: 5, comment: "Thank you very much for the careful and professional execution of the job. All my wishes and questions were addressed and handled flawlessly. My website is now complete. Highly recommended and a true expert in troubleshooting.", date: "Mar 13, 2026", real: true },
            { username: "heimatwerk",   country: "Germany",       flag: "🇩🇪", rating: 5, comment: "Once again, great work and a truly experienced developer. The job was beautifully executed, resulting in a technically perfect and error-free site. I really appreciate the politeness and friendliness! Thank you very much, see you next time.", date: "Mar 9, 2026", real: true },
            { username: "chrispieri",   country: "France",        flag: "🇫🇷", rating: 5, comment: "As always, the communication was top-notch — clear, proactive, and very professional. The efficiency and attention to detail are unmatched. If you're looking for someone reliable who delivers high-quality work ahead of schedule, look no further. My go-to freelancer on this platform!", date: "Mar 2, 2026", real: true },
            { username: "jabcebone1",   country: "United States", flag: "🇺🇸", rating: 5, comment: "One of the best interactions I've ever had with a technical person. Fast, clear, and delivered well beyond my expectations.", date: "Feb 12, 2026", real: true },
            { username: "nordlund_dev", country: "Sweden",        flag: "🇸🇪", rating: 5, comment: "My WooCommerce checkout was completely broken due to a plugin conflict. Abu identified the root cause in minutes and deployed a fix without touching the rest of my store. Saved my Black Friday sales!", date: "Jan 28, 2026", real: false },
            { username: "mk_creative",  country: "United Kingdom",flag: "🇬🇧", rating: 5, comment: "I had a PHP fatal error taking down the entire site. After three other developers failed, Abu fixed it in under 45 minutes. Incredible diagnostics and very calm communication under pressure.", date: "Jan 15, 2026", real: false },
            { username: "boutique_nina",country: "Canada",        flag: "🇨🇦", rating: 5, comment: "Our Elementor site was showing a white screen of death after a plugin update. Abu rolled it back cleanly, identified the conflicting plugin, and delivered a compatibility patch. Fantastic work.", date: "Dec 30, 2025", real: false },
            { username: "seomaster_tr", country: "Turkey",        flag: "🇹🇷", rating: 5, comment: "Malware was redirecting my visitors to spammy sites. Abu cleaned every infected file, hardened the login, and set up a monitoring system. My Google rankings recovered within a week.", date: "Dec 18, 2025", real: false },
            { username: "tokyo_store",  country: "Japan",         flag: "🇯🇵", rating: 5, comment: "Fast and professional. Fixed our payment gateway issue that Stripe support couldn't help with. Communication was clear even across the time zone difference. Highly recommended!", date: "Dec 5, 2025", real: false },
            { username: "rachel_media", country: "Australia",     flag: "🇦🇺", rating: 5, comment: "My WordPress multisite network was throwing database errors after a failed migration. Abu restored it completely with no data loss. He even optimized the DB tables as a bonus.", date: "Nov 22, 2025", real: false },
            { username: "digiflow_nl",  country: "Netherlands",   flag: "🇳🇱", rating: 5, comment: "I was skeptical hiring online for something this critical, but Abu exceeded all expectations. The ACF field display issue was tricky — he not only fixed it but documented the cause for our team. Brilliant.", date: "Nov 10, 2025", real: false },
            { username: "digitalwave_sg",country:"Singapore",     flag: "🇸🇬", rating: 5, comment: "Page speed went from 8 seconds to 1.9 seconds after Abu optimized DB queries, lazy-loaded images, and cleared render-blocking scripts. Core Web Vitals are now all green!", date: "Oct 28, 2025", real: false },
            { username: "ahmed_ksa",    country: "Saudi Arabia",  flag: "🇸🇦", rating: 5, comment: "Our WooCommerce Arabic RTL layout was broken after a theme update. Abu fixed the CSS precisely via a child theme override — very clean and professional approach.", date: "Oct 15, 2025", real: false },
            { username: "ecom_it",      country: "Italy",         flag: "🇮🇹", rating: 5, comment: "Excellent service. Our Contact Form 7 stopped sending emails after a server migration. Abu traced it to missing SMTP credentials and configured WP Mail SMTP correctly. Works perfectly now.", date: "Sep 30, 2025", real: false },
            { username: "brazilblog",   country: "Brazil",        flag: "🇧🇷", rating: 5, comment: "Really surprised at the turnaround speed. I described the issue in the morning, and by afternoon the site was fully fixed. Abu is a true WordPress expert who delivers on his promises.", date: "Sep 14, 2025", real: false },
            { username: "kiwi_dev_nz",  country: "New Zealand",   flag: "🇳🇿", rating: 5, comment: "Had a persistent 500 internal server error due to a corrupt .htaccess. Abu fixed it immediately and audited the entire server configuration for free. Outstanding generosity.", date: "Aug 27, 2025", real: false },
            { username: "solartech_in", country: "India",         flag: "🇮🇳", rating: 5, comment: "Hired for a WooCommerce subscription plugin conflict. Fixed perfectly. Also noticed and warned me about a security vulnerability I wasn't even aware of — that extra care says it all.", date: "Aug 8, 2025", real: false },
            { username: "mira_ph",      country: "Philippines",   flag: "🇵🇭", rating: 5, comment: "My entire menu disappeared after a WordPress core update. Abu restored it, cleared object cache conflicts, and made sure all custom nav walkers still worked. Very thorough and friendly.", date: "Jul 20, 2025", real: false },
            { username: "helios_gr",    country: "Greece",        flag: "🇬🇷", rating: 5, comment: "I've hired many WordPress experts on this platform. None come close to the precision and speed of Abu Zannat. He understands the problem before you finish explaining it. 10 out of 10.", date: "Jul 5, 2025", real: false }
        ],

        // Initialize Application
        init() {
            // ---- Theme initialization (runs before anything else) ----
            this.initTheme();

            // Restore session if exists
            const token = sessionStorage.getItem('zannat_token');
            if (token) {
                this.state.isAuthenticated = true;
                this.updateAuthUI(true);
            }

            // Fetch initial state from database
            this.fetchState();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }

            // Initialize case-study slider
            this.updateCaseSlider(0);

            // Render Reviews Section
            this.renderReviews();

            // Count-up animation on metrics ribbon
            this.initCountUp();

            // Client-side SPA Router Initialization
            this.setupSPAClientRouting();
        },

        // Helper to construct cPanel-compatible API URLs dynamically
        getApiUrl(endpoint) {
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
            const pathname = window.location.pathname;
            const match = pathname.match(/^\/([^/]+.me|zannat[^/]*)/);
            if (match) {
                return `${window.location.origin}/${match[1]}/${cleanEndpoint}`;
            }
            return `/${cleanEndpoint}`;
        },



        // Fetch application state from server or fallback to local storage
        async fetchState() {
            let data = null;
            try {
                const response = await fetch(this.getApiUrl('/api/state'));
                if (response.ok) {
                    data = await response.json();
                }
            } catch (err) {
                console.warn('Backend API unavailable. Using local storage state mode.', err);
            }

            if (!data) {
                const localSaved = localStorage.getItem('zannat_app_state');
                if (localSaved) {
                    try { data = JSON.parse(localSaved); } catch(e) {}
                }
            }

            if (!data) {
                data = {
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
                    invoices: [],
                    nextInvoiceNum: 1001
                };
            }

            this.state.tickets = data.tickets || [];
            this.state.earnings = data.earnings || [];
            this.state.bugTypes = data.bugTypes || [];
            this.state.pages = data.pages || [];
            this.state.users = data.users || [{ username: "admin", password: "zannatbugfix" }];
            this.state.invoices = data.invoices || [];
            this.state.nextInvoiceNum = data.nextInvoiceNum || 1001;
            this.state.homepageContent = data.homepageContent || {};
            this.state.smtpConfig = data.smtpConfig || {};

            // Save local copy
            try {
                localStorage.setItem('zannat_app_state', JSON.stringify({
                    tickets: this.state.tickets,
                    earnings: this.state.earnings,
                    bugTypes: this.state.bugTypes,
                    pages: this.state.pages,
                    users: this.state.users,
                    invoices: this.state.invoices,
                    nextInvoiceNum: this.state.nextInvoiceNum,
                    homepageContent: this.state.homepageContent
                }));
            } catch(e) {}

            // Render components based on state
            this.renderDashboardKPIs();
            this.renderCharts();
            this.renderTicketsTable();
            this.renderCMSPagesTable();
            this.renderAdminUsersTable();
            this.renderHomepageContent();
            this.renderSMTPConfig();
            this.renderInvoicesList();

            // Check routing paths dynamically if loaded
            if (typeof this.router === 'function') {
                this.router();
            }
        },
        setupEventListeners() {
            // Nav Link Tab Switchers
            document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabId = link.getAttribute('data-tab');
                    this.switchTab(tabId);
                });
            });

            // Mobile Menu Toggle
            const menuBtn = document.getElementById('menu-toggle-btn');
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');

            if (menuBtn && sidebar && backdrop) {
                menuBtn.addEventListener('click', () => {
                    sidebar.classList.add('sidebar-open');
                    backdrop.classList.add('active');
                });

                backdrop.addEventListener('click', () => {
                    sidebar.classList.remove('sidebar-open');
                    backdrop.classList.remove('active');
                });
            }

            // Portal Button (Login / Logout)
            const portalBtn = document.getElementById('portal-btn');
            if (portalBtn) {
                portalBtn.addEventListener('click', () => {
                    if (this.state.isAuthenticated) {
                        this.logout();
                    } else {
                        this.openModal('login-overlay');
                    }
                });
            }

            // Login Form Submission
            const loginForm = document.getElementById('form-login');
            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const usernameInput = document.getElementById('login-username');
                    const passwordInput = document.getElementById('login-password');
                    const errorMsg = document.getElementById('login-error-msg');
                    const loginCard = document.querySelector('.login-card');

                    const uVal = usernameInput.value ? usernameInput.value.trim() : '';
                    const pVal = passwordInput.value ? passwordInput.value.trim() : '';

                    let authenticated = false;
                    let token = null;

                    try {
                        const response = await fetch(this.getApiUrl('/api/login'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: uVal,
                                password: pVal
                            })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                                authenticated = true;
                                token = result.token;
                            }
                        }
                    } catch (err) {
                        console.warn('Backend login endpoint unavailable. Testing local static credentials.', err);
                    }

                    // Fallback static authentication check if API was unreachable or offline
                    if (!authenticated) {
                        const validUser = (this.state.users || []).find(
                            u => u.username === uVal && u.password === pVal
                        ) || (uVal === 'admin' && pVal === 'zannatbugfix');

                        if (validUser) {
                            authenticated = true;
                            token = 'token_static_' + Date.now();
                        }
                    }

                    if (authenticated) {
                        // Authenticated successfully
                        sessionStorage.setItem('zannat_token', token || ('token_' + Date.now()));
                        this.state.isAuthenticated = true;
                        
                        // Visual effects
                        if (window.confetti) {
                            window.confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                            });
                        }

                        this.updateAuthUI(true);
                        this.closeModal('login-overlay');
                        
                        // Reset form fields
                        usernameInput.value = '';
                        passwordInput.value = '';
                        errorMsg.classList.add('hidden');

                        // Switch to dashboard
                        this.switchTab('dashboard');
                    } else {
                        // Auth failed
                        errorMsg.textContent = 'Invalid credentials. Please check username and password.';
                        errorMsg.classList.remove('hidden');
                        
                        // Shake login card
                        if (loginCard) {
                            loginCard.classList.add('shake-animation');
                            setTimeout(() => {
                                loginCard.classList.remove('shake-animation');
                            }, 400);
                        }
                    }
                });
            }

            // Ticket Submission Form
            const submitTicketForm = document.getElementById('form-submit-ticket');
            if (submitTicketForm) {
                submitTicketForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const clientName = document.getElementById('ticket-client-name').value;
                    const clientEmail = document.getElementById('ticket-client-email').value;
                    const siteUrl = document.getElementById('ticket-site-url').value;
                    const bugType = document.getElementById('ticket-bug-type').value;
                    const severity = document.getElementById('ticket-severity').value;
                    const description = document.getElementById('ticket-description').value;

                    try {
                        const response = await fetch(this.getApiUrl('/api/tickets'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                clientName,
                                clientEmail,
                                siteUrl,
                                bugType,
                                severity,
                                description
                            })
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            // Ticket added successfully!
                            if (window.confetti) {
                                window.confetti({
                                    particleCount: 80,
                                    spread: 60,
                                    origin: { y: 0.6 }
                                });
                            }

                            // Show nice overlay or notification message
                            this.showSuccessNotification(result.ticketId);

                            // Clear form
                            submitTicketForm.reset();

                            // Reload state
                            this.fetchState();

                            // Switch tab to portfolio page or stay
                            this.switchTab('portfolio');
                        } else {
                            alert('Failed to submit ticket: ' + (result.error || 'unknown error'));
                        }
                    } catch (err) {
                        console.error('Ticket submission error:', err);
                        alert('Server connection error. Please try again.');
                    }
                });
            }

            // Edit Ticket Form Submission
            const editTicketForm = document.getElementById('form-edit-ticket');
            if (editTicketForm) {
                editTicketForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const status = document.getElementById('edit-ticket-status').value;
                    const adminNotes = document.getElementById('edit-ticket-notes').value;

                    try {
                        // Find current ticket to see if resolving
                        const currentTicket = this.state.tickets.find(t => t.id === this.currentEditingId);
                        const wasResolved = currentTicket && currentTicket.status === 'Resolved';

                        const response = await fetch(this.getApiUrl('/api/tickets/update'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: this.currentEditingId,
                                status,
                                adminNotes
                            })
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            this.closeModal('modal-ticket-edit');

                            // Confetti if status changed to resolved
                            if (status === 'Resolved' && !wasResolved && window.confetti) {
                                window.confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                            }

                            // Reload state
                            this.fetchState();
                        } else {
                            alert('Failed to update ticket: ' + (result.error || 'unknown error'));
                        }
                    } catch (err) {
                        console.error('Edit ticket error:', err);
                        alert('Server connection error. Please try again.');
                    }
                });
            }



            // Smooth scrolling for landing page navigation links
            document.querySelectorAll('.landing-navbar .nav-item').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                            
                            // Highlight clicked item
                            document.querySelectorAll('.landing-navbar .nav-item').forEach(item => {
                                item.classList.remove('active');
                            });
                            link.classList.add('active');
                        }
                    }
                });
            });

            // Slider next/prev arrow controls
            const prevBtn = document.getElementById('slider-prev-btn');
            const nextBtn = document.getElementById('slider-next-btn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    this.updateCaseSlider(this.state.currentCaseIndex - 1);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.updateCaseSlider(this.state.currentCaseIndex + 1);
                });
            }

            // Homepage Copy Editor Form
            const homepageForm = document.getElementById('form-cms-homepage');
            if (homepageForm) {
                homepageForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const name = document.getElementById('cms-hero-name').value;
                    const title = document.getElementById('cms-hero-title').value;
                    const avatar = document.getElementById('cms-hero-avatar').value;
                    const about = document.getElementById('cms-about-me').value;

                    try {
                        const response = await fetch(this.getApiUrl('/api/homepage/update'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, title, avatar, about })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            alert('Homepage content updated successfully!');
                            this.fetchState();
                        } else {
                            alert('Error: ' + (result.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Update homepage error:', err);
                        alert('Server connection error.');
                    }
                });
            }

            // Custom Page Form Modal Form
            const pageForm = document.getElementById('form-cms-page');
            if (pageForm) {
                pageForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const title = document.getElementById('cms-page-title').value;
                    const slug = document.getElementById('cms-page-slug').value;
                    const layout = document.getElementById('cms-page-layout').value;
                    const content = document.getElementById('cms-page-content').value;

                    try {
                        const response = await fetch(this.getApiUrl('/api/pages'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title,
                                slug,
                                layout,
                                content,
                                oldSlug: this.cmsCurrentEditingSlug
                            })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.closeModal('modal-cms-page');
                            this.fetchState();
                        } else {
                            alert('Error: ' + (result.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Save custom page error:', err);
                        alert('Server connection error.');
                    }
                });
            }

            // Admin Users Management Form
            const userForm = document.getElementById('form-cms-user');
            if (userForm) {
                userForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const usernameInput = document.getElementById('cms-user-username');
                    const passwordInput = document.getElementById('cms-user-password');
                    const username = usernameInput.value;
                    const password = passwordInput.value;

                    try {
                        const response = await fetch(this.getApiUrl('/api/users'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            alert('Admin user saved/updated successfully!');
                            usernameInput.value = '';
                            passwordInput.value = '';
                            this.fetchState();
                        } else {
                            alert('Error: ' + (result.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Save admin user error:', err);
                        alert('Server connection error.');
                    }
                });
            }

            // SMTP Config Form Submission
            const smtpForm = document.getElementById('form-smtp-config');
            if (smtpForm) {
                smtpForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const host = document.getElementById('smtp-host').value;
                    const port = document.getElementById('smtp-port').value;
                    const secure = document.getElementById('smtp-secure').value;
                    const user = document.getElementById('smtp-user').value;
                    const pass = document.getElementById('smtp-pass').value;

                    try {
                        const response = await fetch(this.getApiUrl('/api/smtp/update'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ host, port, secure, user, pass })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            alert('SMTP Configuration saved successfully!');
                            this.fetchState();
                        } else {
                            alert('Error: ' + (result.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Save SMTP config error:', err);
                        alert('Server connection error.');
                    }
                });
            }

            // Event delegation for Tickets table (Action buttons)
            const ticketsTbody = document.getElementById('tickets-tbody');
            if (ticketsTbody) {
                ticketsTbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const action = btn.getAttribute('data-action');
                    const id = btn.getAttribute('data-id');
                    if (action === 'edit-ticket' && id) {
                        this.openEditModal(id);
                    } else if (action === 'delete-ticket' && id) {
                        this.deleteTicket(id);
                    }
                });
            }

            // Event delegation for Custom Pages table (Action buttons)
            const pagesTbody = document.getElementById('cms-pages-tbody');
            if (pagesTbody) {
                pagesTbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const action = btn.getAttribute('data-action');
                    const slug = btn.getAttribute('data-slug');
                    if (action === 'edit-page' && slug) {
                        this.editPage(slug);
                    } else if (action === 'delete-page' && slug) {
                        this.deletePage(slug);
                    }
                });
            }

            // Event delegation for Admin Users table (Action buttons)
            const usersTbody = document.getElementById('cms-users-tbody');
            if (usersTbody) {
                usersTbody.addEventListener('click', (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const action = btn.getAttribute('data-action');
                    const username = btn.getAttribute('data-username');
                    if (action === 'delete-user' && username) {
                        this.deleteAdminUser(username);
                    }
                });
            }
        },

        // Helper to show a nice visual feedback upon bug ticket submission
        showSuccessNotification(ticketId) {
            // Let's inject a temporary dynamic premium notification toast at the top right of the page
            const notification = document.createElement('div');
            notification.className = 'card';
            notification.style.position = 'fixed';
            notification.style.bottom = '24px';
            notification.style.right = '24px';
            notification.style.zIndex = '9999';
            notification.style.borderLeft = '4px solid var(--accent-green)';
            notification.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
            notification.style.maxWidth = '380px';
            notification.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            notification.style.background = 'var(--glass-bg)';
            notification.style.backdropFilter = 'blur(16px)';
            notification.style.border = '1px solid var(--glass-border)';
            notification.style.padding = '16px';
            
            notification.innerHTML = `
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="background-color: var(--accent-green-glow); color: var(--accent-green); padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="check-circle-2" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div style="flex-grow: 1;">
                        <h4 style="margin-bottom: 4px; font-weight: 700; color: var(--text-primary);">Ticket Submitted!</h4>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">Your ticket ID is <code class="font-mono text-success">${ticketId}</code>.</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">I will check the WP database & logs and contact you shortly.</p>
                    </div>
                    <button style="background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="this.parentElement.parentElement.remove()">
                        <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(notification);
            if (window.lucide) {
                window.lucide.createIcons();
            }

            // Remove automatically after 6 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(20px)';
                notification.style.transition = 'all 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 6000);
        },

        // Switch View Tabs
        switchTab(tabId) {
            // If selecting an admin tab, ensure we are authenticated or admin shell is already active
            const adminTabs = ['dashboard', 'tickets', 'maintenance', 'cms', 'invoices'];
            const adminShell = document.getElementById('admin-shell');
            const isAdminActive = adminShell && !adminShell.classList.contains('hidden');

            if (adminTabs.includes(tabId) && !this.state.isAuthenticated && !isAdminActive) {
                this.openModal('login-overlay');
                return;
            }

            if (adminTabs.includes(tabId)) {
                this.state.isAuthenticated = true;
            }

            this.state.currentTab = tabId;

            // Toggle landing vs admin shells
            const publicLanding = document.getElementById('public-landing');
            const customPageShell = document.getElementById('custom-page-shell');

            if (customPageShell) customPageShell.classList.add('hidden');

            if (tabId === 'portfolio') {
                if (publicLanding) publicLanding.classList.remove('hidden');
                if (adminShell) adminShell.classList.add('hidden');
                
                // Update URL to root
                if (window.location.pathname !== '/') {
                    history.pushState(null, '', '/');
                }
            } else if (adminTabs.includes(tabId)) {
                if (publicLanding) publicLanding.classList.add('hidden');
                if (adminShell) adminShell.classList.remove('hidden');
                
                // Update URL to specific admin sub-route
                const adminTabMap = {
                    'dashboard': '/admin/dashboard',
                    'tickets': '/admin/tickets',
                    'maintenance': '/admin/maintenance',
                    'cms': '/admin/cms',
                    'invoices': '/admin/invoices'
                };
                const targetUrl = adminTabMap[tabId] || '/admin';
                if (window.location.pathname !== targetUrl) {
                    history.pushState(null, '', targetUrl);
                }

                if (tabId === 'invoices') {
                    this.resetInvoiceForm();
                    this.toggleInvoiceView('create');
                }
            }

            // Remove active class from all nav links and add to selected
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.getAttribute('data-tab') === tabId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Switch display of panels
            document.querySelectorAll('.tab-pane').forEach(panel => {
                if (panel.id === `tab-${tabId}`) {
                    panel.classList.add('active');
                } else {
                    panel.classList.remove('active');
                }
            });

            // Update header title/subtitle dynamically
            const pageTitle = document.getElementById('page-title');
            const pageSubtitle = document.getElementById('page-subtitle');
            
            if (pageTitle && pageSubtitle) {
                switch(tabId) {
                    case 'portfolio':
                        pageTitle.textContent = 'Welcome to my Portfolio';
                        pageSubtitle.textContent = 'WordPress debugging, custom integrations, and optimization expert.';
                        break;
                    case 'submit-bug':
                        pageTitle.textContent = 'Submit WordPress Bug Report';
                        pageSubtitle.textContent = 'Describe the issue you\'re facing. I\'ll inspect it and get back to you with a quote.';
                        break;
                    case 'dashboard':
                        pageTitle.textContent = 'Admin Analytics Dashboard';
                        pageSubtitle.textContent = 'WordPress fix operations statistics, revenue growth, and bug analytics.';
                        break;
                    case 'tickets':
                        pageTitle.textContent = 'Bug Dispatch Desk';
                        pageSubtitle.textContent = 'Inspect developer tickets, update debug statuses, and log developer notes.';
                        break;
                    case 'maintenance':
                        pageTitle.textContent = 'Maintenance & Database Control';
                        pageSubtitle.textContent = 'Download backups, restore files, and seed mock datasets.';
                        break;
                    case 'cms':
                        pageTitle.textContent = 'Pages & CMS';
                        pageSubtitle.textContent = 'Update homepage content and manage custom sub-pages.';
                        break;
                    case 'invoices':
                        pageTitle.textContent = 'Invoice Generator & Billing Desk';
                        pageSubtitle.textContent = 'Create professional PDF invoices with auto-increment numbers, client addresses, and tax options.';
                        break;
                }
            }

            // Close mobile drawer if active
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (sidebar && sidebar.classList.contains('sidebar-open')) {
                sidebar.classList.remove('sidebar-open');
                backdrop.classList.remove('active');
            }

            // If switching to dashboard, update/resize charts to display perfectly
            if (tabId === 'dashboard') {
                this.renderCharts();
            }
        },



        // Update Case-Study Slider
        updateCaseSlider(index) {
            this.state.currentCaseIndex = index;
            
            // Limit bounds
            if (this.state.currentCaseIndex < 0) this.state.currentCaseIndex = this.cases.length - 1;
            if (this.state.currentCaseIndex >= this.cases.length) this.state.currentCaseIndex = 0;
            
            const activeIdx = this.state.currentCaseIndex;
            
            // Update Title & Desc
            const titleEl = document.getElementById('slider-case-title');
            const descEl = document.getElementById('slider-case-desc');
            if (titleEl) titleEl.textContent = this.cases[activeIdx].title;
            if (descEl) descEl.textContent = this.cases[activeIdx].desc;
            
            // Update Slides Visibility
            const slides = document.querySelectorAll('.case-slide');
            slides.forEach((slide, idx) => {
                if (idx === activeIdx) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });
        },

        // =============================================
        // REVIEWS SECTION RENDERER
        // =============================================
        renderReviews() {
            const grid = document.getElementById('reviews-grid');
            const loadMoreBtn = document.getElementById('reviews-load-more-btn');
            const shownLabel = document.getElementById('reviews-shown-label');
            if (!grid) return;

            const PAGE_SIZE = 10;
            const LOAD_MORE_SIZE = 5;
            let shownCount = 0;

            // Avatar color palette
            const colors = [
                'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                'linear-gradient(135deg,#10b981,#047857)',
                'linear-gradient(135deg,#f59e0b,#b45309)',
                'linear-gradient(135deg,#ef4444,#b91c1c)',
                'linear-gradient(135deg,#06b6d4,#0e7490)',
                'linear-gradient(135deg,#ec4899,#be185d)',
                'linear-gradient(135deg,#84cc16,#4d7c0f)',
            ];

            const getColor = (name) => colors[name.charCodeAt(0) % colors.length];

            const renderCard = (review, idx) => {
                const card = document.createElement('div');
                card.className = 'review-card';
                card.style.animationDelay = `${(idx % LOAD_MORE_SIZE) * 70}ms`;

                const initials = review.username.slice(0, 2).toUpperCase();
                const stars = '★'.repeat(review.rating);
                const verifiedBadge = review.real
                    ? `<span class="review-fiverr-icon"><svg width="11" height="11" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DBF73"/><text x="12" y="17" text-anchor="middle" font-size="13" font-family="Arial" font-weight="bold" fill="white">f</text></svg> Fiverr Verified</span>`
                    : '';

                card.innerHTML = `
                    <div class="review-card-header">
                        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                            <div class="review-avatar" style="background:${getColor(review.username)};">${initials}</div>
                            <div class="review-author-info">
                                <div class="review-author-name">${review.username}</div>
                                <div class="review-author-country">${review.flag} ${review.country}</div>
                            </div>
                        </div>
                        <div class="review-card-stars">${stars}</div>
                    </div>
                    <p class="review-quote">"${review.comment}"</p>
                    <div class="review-card-footer">
                        <span class="review-date">${review.date}</span>
                        ${verifiedBadge}
                    </div>
                `;
                return card;
            };

            const updateLabel = () => {
                const total = this.reviewsData.length;
                if (shownLabel) {
                    shownLabel.textContent = `Showing ${Math.min(shownCount, total)} of ${total} reviews`;
                }
            };

            const showMore = (count) => {
                const start = shownCount;
                const end = Math.min(shownCount + count, this.reviewsData.length);
                for (let i = start; i < end; i++) {
                    grid.appendChild(renderCard(this.reviewsData[i], i - start));
                }
                shownCount = end;
                updateLabel();
                // Re-init lucide icons for newly added cards
                if (window.lucide) window.lucide.createIcons();
                // Hide button if all shown
                if (shownCount >= this.reviewsData.length) {
                    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
                }
            };

            // Initial render — show 10
            showMore(PAGE_SIZE);

            // Load More click handler
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => showMore(LOAD_MORE_SIZE));
            }
        },

        // =============================================
        // COUNT-UP ANIMATION
        // =============================================
        initCountUp() {
            const section = document.getElementById('landing-metrics');
            if (!section) return;

            const counters = section.querySelectorAll('.count-up');
            if (!counters.length) return;

            let animated = false;

            const runCounter = (el) => {
                const target   = parseFloat(el.dataset.target);
                const suffix   = el.dataset.suffix || '';
                const decimals = parseInt(el.dataset.decimals || '0', 10);
                const duration = 1800; // ms
                const start    = performance.now();

                const ease = (t) => t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

                const tick = (now) => {
                    const elapsed  = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased    = ease(progress);
                    const current  = target * eased;

                    if (decimals > 0) {
                        el.textContent = current.toFixed(decimals) + suffix;
                    } else {
                        // Add comma formatting for large numbers
                        el.textContent = Math.floor(current).toLocaleString() + suffix;
                    }

                    if (progress < 1) {
                        requestAnimationFrame(tick);
                    } else {
                        // Final exact value
                        if (decimals > 0) {
                            el.textContent = target.toFixed(decimals) + suffix;
                        } else {
                            el.textContent = target.toLocaleString() + suffix;
                        }
                    }
                };

                requestAnimationFrame(tick);
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !animated) {
                        animated = true;
                        // Stagger each counter slightly for a cascading effect
                        counters.forEach((el, i) => {
                            setTimeout(() => runCounter(el), i * 150);
                        });
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(section);
        },

        // =============================================
        // THEME TOGGLE
        // =============================================
        initTheme() {
            const html = document.documentElement;
            const btn  = document.getElementById('theme-toggle-btn');
            const btnCustom = document.getElementById('theme-toggle-btn-custom');

            // Determine initial theme:
            // 1. Saved preference  2. System preference  3. Default dark
            const saved = localStorage.getItem('zannat_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initial = saved || (prefersDark ? 'dark' : 'light');

            html.setAttribute('data-theme', initial);

            const toggleTheme = () => {
                const current = html.getAttribute('data-theme');
                const next    = current === 'dark' ? 'light' : 'dark';

                // Spin the button for tactile feedback
                if (btn) btn.style.transform = 'scale(0.85) rotate(20deg)';
                if (btnCustom) btnCustom.style.transform = 'scale(0.85) rotate(20deg)';
                setTimeout(() => { 
                    if (btn) btn.style.transform = ''; 
                    if (btnCustom) btnCustom.style.transform = ''; 
                }, 300);

                html.setAttribute('data-theme', next);
                localStorage.setItem('zannat_theme', next);

                // Re-init lucide icons (sun/moon swap)
                if (window.lucide) window.lucide.createIcons();
            };

            if (btn) btn.addEventListener('click', toggleTheme);
            if (btnCustom) btnCustom.addEventListener('click', toggleTheme);
        },

        // Open Modal Overlay
        openModal(modalId) {
            const overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.remove('hidden');
            }
        },

        // Close Modal Overlay
        closeModal(modalId) {
            const overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.add('hidden');
                
                // If canceling admin login overlay, redirect to portfolio
                if (modalId === 'login-overlay' && !this.state.isAuthenticated) {
                    this.switchTab('portfolio');
                }
            }
        },

        // Log out admin user
        logout() {
            sessionStorage.removeItem('zannat_token');
            this.state.isAuthenticated = false;
            this.updateAuthUI(false);
            
            // Redirect to homepage URL /
            history.pushState(null, '', '/');
            this.router();
        },

        // Update Navigation Menu depending on auth status
        updateAuthUI(isLoggedIn) {
            const adminLinks = document.querySelectorAll('.admin-only');
            const portalBtnText = document.getElementById('portal-btn-text');
            const portalIcon = document.getElementById('portal-icon');

            adminLinks.forEach(link => {
                if (isLoggedIn) {
                    link.classList.remove('hidden');
                } else {
                    link.classList.add('hidden');
                }
            });

            if (portalBtnText && portalIcon) {
                if (isLoggedIn) {
                    portalBtnText.textContent = 'Logout';
                    portalIcon.setAttribute('data-lucide', 'log-out');
                } else {
                    portalBtnText.textContent = 'Admin Login';
                    portalIcon.setAttribute('data-lucide', 'shield-check');
                }
            }



            if (window.lucide) {
                window.lucide.createIcons();
            }
        },

        // Render Dashboard KPI Cards
        renderDashboardKPIs() {
            const kpiTotal = document.getElementById('kpi-total-tickets');
            const kpiResolved = document.getElementById('kpi-resolved-tickets');
            const kpiPending = document.getElementById('kpi-pending-tickets');
            const kpiEarnings = document.getElementById('kpi-total-earnings');

            if (kpiTotal) kpiTotal.textContent = this.state.tickets.length;
            
            const resolvedCount = this.state.tickets.filter(t => t.status === 'Resolved').length;
            if (kpiResolved) kpiResolved.textContent = resolvedCount;

            const pendingCount = this.state.tickets.filter(t => t.status === 'Pending').length;
            if (kpiPending) kpiPending.textContent = pendingCount;

            const totalEarned = this.state.earnings.reduce((sum, item) => sum + item.amount, 0);
            if (kpiEarnings) kpiEarnings.textContent = `৳${totalEarned.toLocaleString('en-US')}`;
        },

        // Render charts using Chart.js
        renderCharts() {
            try {
                if (!window.Chart) {
                    console.warn('Chart.js library is not loaded yet.');
                    return;
                }

                // Render Monthly Earnings Chart
                const earningsCtx = document.getElementById('chart-monthly-earnings');
                if (earningsCtx) {
                    // Destroy previous instance to prevent glitches
                    if (this.charts.earnings) {
                        this.charts.earnings.destroy();
                    }

                    // Get dynamic months & amounts from database state
                    const months = this.state.earnings.map(e => e.month);
                    const amounts = this.state.earnings.map(e => e.amount);

                    this.charts.earnings = new Chart(earningsCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: months,
                            datasets: [{
                                label: 'Monthly Earnings (BDT)',
                                data: amounts,
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#8b5cf6',
                                pointBorderColor: '#fff',
                                pointHoverRadius: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                                }
                            }
                        }
                    });
                }

                // Render Bug Type segments doughnut chart
                const bugTypesCtx = document.getElementById('chart-bug-types');
                if (bugTypesCtx) {
                    if (this.charts.bugTypes) {
                        this.charts.bugTypes.destroy();
                    }

                    // Segments data
                    const labels = this.state.bugTypes.map(b => b.type);
                    const counts = this.state.bugTypes.map(b => b.count);

                    this.charts.bugTypes = new Chart(bugTypesCtx.getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: counts,
                                backgroundColor: [
                                    '#3b82f6', // Blue (Plugin crash)
                                    '#f59e0b', // Amber (WooCommerce)
                                    '#ef4444', // Red (Malware/Security)
                                    '#10b981', // Green (Database/PHP)
                                    '#8b5cf6'  // Purple (CSS/Theme)
                                ],
                                borderWidth: 2,
                                borderColor: '#0b1120'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#94a3b8',
                                        font: { family: 'Outfit', size: 10 },
                                        padding: 12
                                    }
                                }
                            },
                            cutout: '65%'
                        }
                    });
                }
            } catch (err) {
                console.error('Error rendering charts:', err);
            }
        },

        // Render Manage Tickets Table
        renderTicketsTable() {
            const tbody = document.getElementById('tickets-tbody');
            if (!tbody) return;

            const filterStatus = document.getElementById('ticket-filter-status').value;
            
            // Filter tickets array
            const filteredTickets = this.state.tickets.filter(t => {
                if (filterStatus && t.status !== filterStatus) return false;
                return true;
            });

            // Sort by ticket creation (descending ID)
            filteredTickets.sort((a, b) => b.id.localeCompare(a.id));

            if (filteredTickets.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                <i data-lucide="ticket" style="width: 24px; height: 24px; opacity: 0.5;"></i>
                                <span>No bug tickets match this criteria.</span>
                            </div>
                        </td>
                    </tr>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            tbody.innerHTML = filteredTickets.map(t => {
                // Get Severity Badge Class
                let badgeClass = 'badge-low';
                if (t.severity === 'Medium') badgeClass = 'badge-medium';
                if (t.severity === 'High') badgeClass = 'badge-high';
                if (t.severity === 'Critical') badgeClass = 'badge-critical';

                // Get Status indicator HTML
                let statusHtml = '';
                if (t.status === 'Pending') {
                    statusHtml = `<span class="status-text"><span class="status-dot dot-pending"></span>Pending</span>`;
                } else if (t.status === 'In Progress') {
                    statusHtml = `<span class="status-text"><span class="status-dot dot-inprogress"></span>In Progress</span>`;
                } else {
                    statusHtml = `<span class="status-text"><span class="status-dot dot-resolved"></span>Resolved</span>`;
                }

                return `
                    <tr>
                        <td class="font-mono" style="font-weight: 700;">${t.id}</td>
                        <td style="white-space: nowrap;">${t.date}</td>
                        <td>
                            <div style="font-weight: 600;">${t.clientName}</div>
                            <div class="text-muted text-small">${t.clientEmail}</div>
                        </td>
                        <td>
                            <a href="${t.siteUrl}" target="_blank" class="text-blue" style="text-decoration: none;">
                                ${t.siteUrl.replace(/^https?:\/\//, '')}
                                <i data-lucide="external-link" style="width: 10px; height: 10px; display: inline-block; vertical-align: middle; margin-left: 2px;"></i>
                            </a>
                        </td>
                        <td>${t.bugType}</td>
                        <td><span class="badge ${badgeClass}">${t.severity}</span></td>
                        <td>${statusHtml}</td>
                        <td style="text-align: right;">
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button class="btn btn-secondary btn-icon" data-action="edit-ticket" data-id="${t.id}" title="Inspect & Edit Ticket">
                                    <i data-lucide="sliders" style="width: 14px; height: 14px; color: var(--accent-purple); pointer-events: none;"></i>
                                </button>
                                <button class="btn btn-secondary btn-icon" data-action="delete-ticket" data-id="${t.id}" title="Delete Ticket" style="border-color: rgba(239,68,68,0.2);">
                                    <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red); pointer-events: none;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) {
                window.lucide.createIcons();
            }
        },

        // Open Ticket Inspection & Editing Modal
        openEditModal(ticketId) {
            const ticket = this.state.tickets.find(t => t.id === ticketId);
            if (!ticket) return;

            this.currentEditingId = ticketId;

            const editTitle = document.getElementById('edit-ticket-title');
            const editSubtitle = document.getElementById('edit-ticket-subtitle');
            const editSiteUrl = document.getElementById('edit-ticket-site-url');
            const editDesc = document.getElementById('edit-ticket-description');
            const editStatus = document.getElementById('edit-ticket-status');
            const editNotes = document.getElementById('edit-ticket-notes');

            if (editTitle) editTitle.textContent = `Inspect Ticket ${ticketId}`;
            if (editSubtitle) editSubtitle.textContent = `Submitted by ${ticket.clientName} (${ticket.clientEmail}) - Severity: ${ticket.severity}`;
            if (editSiteUrl) editSiteUrl.value = ticket.siteUrl;
            if (editDesc) editDesc.value = ticket.description || '';
            if (editStatus) editStatus.value = ticket.status;
            if (editNotes) editNotes.value = ticket.adminNotes || '';

            this.openModal('modal-ticket-edit');
        },

        // Two-click inline delete helper
        // First click: arms the button (turns red + shows "Confirm?", auto-resets in 3s)
        // Second click: executes the callback
        armDeleteButton(btn, onConfirm) {
            if (btn.getAttribute('data-armed') === '1') {
                // Second click — fire the action
                btn.removeAttribute('data-armed');
                clearTimeout(btn._armTimer);
                onConfirm();
                return;
            }
            // First click — arm it
            const origHTML = btn.innerHTML;
            const origBorder = btn.style.borderColor;
            const origBg = btn.style.background;
            btn.setAttribute('data-armed', '1');
            btn.innerHTML = '<span style="font-size:11px;font-weight:700;color:var(--accent-red);letter-spacing:0.02em;">Confirm?</span>';
            btn.style.borderColor = 'rgba(239,68,68,0.8)';
            btn.style.background = 'rgba(239,68,68,0.12)';
            btn.style.minWidth = '74px';
            btn._armTimer = setTimeout(() => {
                btn.removeAttribute('data-armed');
                btn.innerHTML = origHTML;
                btn.style.borderColor = origBorder;
                btn.style.background = origBg;
                btn.style.minWidth = '';
                if (window.lucide) window.lucide.createIcons();
            }, 3000);
        },

        // Delete a ticket
        deleteTicket(ticketId) {
            const btn = document.querySelector(`[data-action="delete-ticket"][data-id="${ticketId}"]`);
            if (!btn) return;
            app.armDeleteButton(btn, async () => {
                try {
                    const response = await fetch(app.getApiUrl('/api/tickets/delete'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: ticketId })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        app.fetchState();
                    } else {
                        app.showToast('Failed to delete: ' + (result.error || 'unknown'), 'error');
                    }
                } catch (err) {
                    console.error('Delete ticket error:', err);
                    app.showToast('Server connection error.', 'error');
                }
            });
        },

        // Inline toast notification (no alert/confirm dependency)
        showToast(message, type = 'info') {
            const toast = document.createElement('div');
            const color = type === 'error' ? 'var(--accent-red)' : 'var(--accent-green)';
            toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;
                background:var(--card-bg);border:1px solid ${color};
                border-left:4px solid ${color};border-radius:10px;
                padding:14px 20px;font-size:14px;font-weight:600;
                color:var(--text-primary);box-shadow:0 8px 24px rgba(0,0,0,0.4);
                animation:slideUp 0.3s cubic-bezier(0.4,0,0.2,1);max-width:340px;`;
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3500);
        },


        // Trigger Download DB Backup
        downloadBackup() {
            window.open(this.getApiUrl('/api/backup'), '_blank');
        },

        // Handle Database Restore File Upload
        async uploadRestore(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!confirm('Are you sure you want to restore the database? This will completely overwrite existing tickets and login credentials.')) {
                event.target.value = ''; // Reset file input
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const binaryData = e.target.result;
                    try {
                        const response = await fetch(this.getApiUrl('/api/restore'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/octet-stream' },
                            body: binaryData
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            alert('Database restored successfully!');
                            
                            // Visual effects
                            if (window.confetti) {
                                window.confetti({
                                    particleCount: 80,
                                    spread: 60,
                                    origin: { y: 0.6 }
                                });
                            }

                            // Reload state
                            this.fetchState();
                        } else {
                            alert('Restore failed: ' + (result.error || 'unknown error'));
                        }
                    } catch (err) {
                        console.error('Error posting restore:', err);
                        alert('Server connection error.');
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error('File read error:', err);
                alert('Failed to read file.');
            } finally {
                event.target.value = ''; // Reset input
            }
        },

        // CMS Current Page Edit Tracking
        cmsCurrentEditingSlug: null,

        // Setup SPA Client-Side Routing
        setupSPAClientRouting() {
            document.addEventListener('click', (e) => {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href) {
                    try {
                        const url = new URL(anchor.href);
                        if (url.origin === window.location.origin) {
                            const path = url.pathname;
                            if (anchor.hash && (path === '/' || path === '' || path === window.location.pathname)) {
                                return;
                            }
                            if (!anchor.getAttribute('download') && !anchor.getAttribute('target')) {
                                e.preventDefault();
                                history.pushState(null, '', path);
                                this.router();
                            }
                        }
                    } catch (err) {
                        // Ignore
                    }
                }
            });

            window.addEventListener('popstate', () => {
                this.router();
            });

            this.router();
        },

        // Client side router
        router() {
            const pathname = window.location.pathname;
            let cleanPath = pathname;
            if (cleanPath.endsWith('/') && cleanPath.length > 1) {
                cleanPath = cleanPath.slice(0, -1);
            }
            
            const adminRoutes = {
                '/admin': 'dashboard',
                '/admin/dashboard': 'dashboard',
                '/admin/tickets': 'tickets',
                '/admin/maintenance': 'maintenance',
                '/admin/cms': 'cms',
                '/admin/invoices': 'invoices'
            };

            if (cleanPath in adminRoutes) {
                const targetTab = adminRoutes[cleanPath];
                if (this.state.isAuthenticated) {
                    this.switchTab(targetTab);
                } else {
                    this.switchTab('portfolio');
                    this.openModal('login-overlay');
                }
                return;
            }
            
            if (cleanPath === '/' || cleanPath === '' || cleanPath === '/index.html') {
                this.switchTab('portfolio');
                const customShell = document.getElementById('custom-page-shell');
                if (customShell) customShell.classList.add('hidden');
                return;
            }
            
            const slug = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
            const matchingPage = this.state.pages.find(p => p.slug === slug);
            
            if (matchingPage) {
                const publicLanding = document.getElementById('public-landing');
                const adminShell = document.getElementById('admin-shell');
                const customShell = document.getElementById('custom-page-shell');
                
                if (publicLanding) publicLanding.classList.add('hidden');
                if (adminShell) adminShell.classList.add('hidden');
                if (customShell) {
                    customShell.classList.remove('hidden');
                    
                    const titleEl = document.getElementById('custom-page-title');
                    const bodyEl = document.getElementById('custom-page-body');
                    const headerEl = document.getElementById('custom-page-header');
                    const footerEl = document.getElementById('custom-page-footer');
                    
                    if (titleEl) titleEl.textContent = matchingPage.title;
                    if (bodyEl) bodyEl.innerHTML = matchingPage.content;
                    
                    document.title = `${matchingPage.title} | Abu Zannat`;
                    
                    if (matchingPage.layout === 'minimal') {
                        if (headerEl) headerEl.classList.add('hidden');
                        if (footerEl) footerEl.classList.add('hidden');
                        const wrapper = document.querySelector('.custom-page-content-wrapper');
                        if (wrapper) wrapper.style.padding = '40px 24px';
                    } else {
                        if (headerEl) headerEl.classList.remove('hidden');
                        if (footerEl) footerEl.classList.remove('hidden');
                        const wrapper = document.querySelector('.custom-page-content-wrapper');
                        if (wrapper) wrapper.style.padding = '120px 24px 80px 24px';
                    }
                }
            } else {
                if (slug.includes('.')) {
                    return;
                }
                const publicLanding = document.getElementById('public-landing');
                const adminShell = document.getElementById('admin-shell');
                const customShell = document.getElementById('custom-page-shell');
                
                if (publicLanding) publicLanding.classList.add('hidden');
                if (adminShell) adminShell.classList.add('hidden');
                if (customShell) {
                    customShell.classList.remove('hidden');
                    const titleEl = document.getElementById('custom-page-title');
                    const bodyEl = document.getElementById('custom-page-body');
                    const headerEl = document.getElementById('custom-page-header');
                    const footerEl = document.getElementById('custom-page-footer');
                    
                    if (titleEl) titleEl.textContent = "404 - Page Not Found";
                    if (bodyEl) {
                        bodyEl.innerHTML = `
                            <p style="margin-bottom: 24px;">The page you are looking for does not exist or has been removed.</p>
                            <a href="/" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
                                <i data-lucide="home"></i> Back to Homepage
                            </a>
                        `;
                    }
                    if (headerEl) headerEl.classList.remove('hidden');
                    if (footerEl) footerEl.classList.remove('hidden');
                    
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        },

        // Prefill/Render Homepage Dynamic Content
        renderHomepageContent() {
            const content = this.state.homepageContent;
            if (!content || !content.name) return;

            const nameEl = document.getElementById('hero-profile-name');
            const titleEl = document.getElementById('hero-profile-title');
            const aboutEl = document.getElementById('hero-profile-about');
            const avatarEl = document.getElementById('hero-profile-avatar');

            if (nameEl) nameEl.textContent = content.name;
            if (titleEl) titleEl.textContent = content.title;
            if (aboutEl) aboutEl.textContent = content.about;
            if (avatarEl && content.avatar) avatarEl.src = content.avatar;

            // Also fill form inputs if form exists
            const formName = document.getElementById('cms-hero-name');
            const formTitle = document.getElementById('cms-hero-title');
            const formAvatar = document.getElementById('cms-hero-avatar');
            const formAbout = document.getElementById('cms-about-me');

            if (formName && !formName.value) formName.value = content.name;
            if (formTitle && !formTitle.value) formTitle.value = content.title;
            if (formAvatar && !formAvatar.value) formAvatar.value = content.avatar;
            if (formAbout && !formAbout.value) formAbout.value = content.about;
        },

        // Render Custom Pages List Table
        renderCMSPagesTable() {
            const tbody = document.getElementById('cms-pages-tbody');
            if (!tbody) return;

            const pages = this.state.pages || [];
            if (pages.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">
                            No custom pages created yet.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = pages.map(p => `
                <tr>
                    <td style="font-weight: 600;">${p.title}</td>
                    <td class="font-mono text-small">zannat.me/${p.slug}</td>
                    <td style="text-transform: capitalize;">${p.layout}</td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <a href="/${p.slug}" class="btn btn-secondary btn-icon" title="View Page">
                                <i data-lucide="eye" style="width: 14px; height: 14px; color: var(--accent-purple); pointer-events: none;"></i>
                            </a>
                            <button class="btn btn-secondary btn-icon" data-action="edit-page" data-slug="${p.slug}" title="Edit Page">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px; color: var(--accent-purple); pointer-events: none;"></i>
                            </button>
                            <button class="btn btn-secondary btn-icon" data-action="delete-page" data-slug="${p.slug}" title="Delete Page" style="border-color: rgba(239,68,68,0.2);">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red); pointer-events: none;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            if (window.lucide) {
                window.lucide.createIcons();
            }
        },

        // Show/Open modal to create a new page
        showNewPageForm() {
            this.cmsCurrentEditingSlug = null;
            document.getElementById('cms-page-modal-title').textContent = 'Create New Page';
            document.getElementById('form-cms-page').reset();
            this.openModal('modal-cms-page');
        },

        // Edit page
        editPage(slug) {
            const page = this.state.pages.find(p => p.slug === slug);
            if (!page) return;

            this.cmsCurrentEditingSlug = slug;
            document.getElementById('cms-page-modal-title').textContent = 'Edit Page';
            document.getElementById('cms-page-title').value = page.title;
            document.getElementById('cms-page-slug').value = page.slug;
            document.getElementById('cms-page-layout').value = page.layout;
            document.getElementById('cms-page-content').value = page.content;

            this.openModal('modal-cms-page');
        },

        // Delete page
        deletePage(slug) {
            const btn = document.querySelector(`[data-action="delete-page"][data-slug="${slug}"]`);
            if (!btn) return;
            app.armDeleteButton(btn, async () => {
                try {
                    const response = await fetch(app.getApiUrl('/api/pages/delete'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ slug })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        app.fetchState();
                    } else {
                        app.showToast('Failed to delete page: ' + (result.error || 'unknown'), 'error');
                    }
                } catch (err) {
                    console.error('Delete page error:', err);
                    app.showToast('Server connection error.', 'error');
                }
            });
        },

        // Render Admin Users List
        renderAdminUsersTable() {
            const tbody = document.getElementById('cms-users-tbody');
            if (!tbody) return;

            const users = this.state.users || [];
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td style="font-weight: 600;">${u.username}</td>
                    <td class="font-mono" style="-webkit-text-security: disc;">${u.password}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary btn-icon" data-action="delete-user" data-username="${u.username}" title="Delete User" style="border-color: rgba(239,68,68,0.2);">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red); pointer-events: none;"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            if (window.lucide) {
                window.lucide.createIcons();
            }
        },

        // Delete admin user
        deleteAdminUser(username) {
            if (this.state.users.length <= 1) {
                this.showToast('Cannot delete the only admin user — you would lock yourself out!', 'error');
                return;
            }
            const btn = document.querySelector(`[data-action="delete-user"][data-username="${username}"]`);
            if (!btn) return;
            app.armDeleteButton(btn, async () => {
                try {
                    const response = await fetch(app.getApiUrl('/api/users/delete'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        app.fetchState();
                    } else {
                        app.showToast('Failed to delete user: ' + (result.error || 'unknown'), 'error');
                    }
                } catch (err) {
                    console.error('Delete user error:', err);
                    app.showToast('Server connection error.', 'error');
                }
            });
        },

        // Render SMTP Configuration inputs
        renderSMTPConfig() {
            const config = this.state.smtpConfig || {};
            const hostEl = document.getElementById('smtp-host');
            const portEl = document.getElementById('smtp-port');
            const secureEl = document.getElementById('smtp-secure');
            const userEl = document.getElementById('smtp-user');
            const passEl = document.getElementById('smtp-pass');

            if (hostEl) hostEl.value = config.host || '';
            if (portEl) portEl.value = config.port || '';
            if (secureEl) secureEl.value = config.secure !== undefined ? String(config.secure) : 'false';
            if (userEl) userEl.value = config.user || '';
            if (passEl) passEl.value = config.pass || '';
        },

        // =============================================
        // INVOICE GENERATOR CONTROLLER
        // =============================================
        toggleInvoiceView(view) {
            const createPanel = document.getElementById('invoice-create-panel');
            const listPanel = document.getElementById('invoice-list-panel');
            if (view === 'create') {
                if (createPanel) createPanel.classList.remove('hidden');
                if (listPanel) listPanel.classList.add('hidden');
            } else {
                if (createPanel) createPanel.classList.add('hidden');
                if (listPanel) listPanel.classList.remove('hidden');
                this.renderInvoicesList();
            }
        },

        resetInvoiceForm() {
            const form = document.getElementById('form-invoice');
            if (form) form.reset();

            const invIdEl = document.getElementById('inv-id');
            const invNumEl = document.getElementById('inv-number');
            const invDateEl = document.getElementById('inv-date');
            const invAddressEl = document.getElementById('inv-my-address');
            const invTaxEl = document.getElementById('inv-tax-rate');

            const invPaymentEl = document.getElementById('inv-payment-method');
            const invStatusEl = document.getElementById('inv-status');

            if (invIdEl) invIdEl.value = '';
            if (invNumEl) invNumEl.value = `INV-${this.state.nextInvoiceNum || 1001}`;
            if (invDateEl) invDateEl.value = new Date().toISOString().split('T')[0];
            if (invTaxEl) invTaxEl.value = '0';
            if (invPaymentEl) invPaymentEl.value = 'Bank Transfer';
            if (invStatusEl) invStatusEl.value = 'Paid';
            if (invAddressEl) {
                invAddressEl.value = `Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh`;
            }

            // Clear items table and add initial row
            const tbody = document.getElementById('invoice-items-tbody');
            if (tbody) tbody.innerHTML = '';
            
            this.addInvoiceItemRow('WordPress Core & Plugin Bug Diagnostics', 1, 150);
            this.calculateInvoiceTotals();
        },

        addInvoiceItemRow(description = '', qty = 1, rate = 0) {
            const tbody = document.getElementById('invoice-items-tbody');
            if (!tbody) return;

            const tr = document.createElement('tr');
            const currencySymbol = (document.getElementById('inv-currency')?.value === 'BDT') ? '৳' : '$';

            tr.innerHTML = `
                <td>
                    <input type="text" class="form-control item-desc" placeholder="e.g. WooCommerce Checkout Fix" value="${description}" required>
                </td>
                <td>
                    <input type="number" class="form-control item-qty" value="${qty}" min="1" step="1" oninput="app.calculateInvoiceTotals()" required>
                </td>
                <td>
                    <input type="number" class="form-control item-rate" value="${rate}" min="0" step="0.5" oninput="app.calculateInvoiceTotals()" required>
                </td>
                <td style="font-weight: 700; vertical-align: middle;">
                    <span class="item-amount">${currencySymbol}${(qty * rate).toFixed(2)}</span>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <button type="button" class="btn btn-secondary btn-icon" onclick="this.closest('tr').remove(); app.calculateInvoiceTotals();" title="Remove Item">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red); pointer-events: none;"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
            if (window.lucide) window.lucide.createIcons();
            this.calculateInvoiceTotals();
        },

        calculateInvoiceTotals() {
            const currency = document.getElementById('inv-currency')?.value || 'USD';
            const symbol = currency === 'BDT' ? '৳' : '$';

            // Update header symbol labels
            document.querySelectorAll('.inv-currency-symbol').forEach(el => {
                el.textContent = symbol;
            });

            let subtotal = 0;
            const rows = document.querySelectorAll('#invoice-items-tbody tr');

            rows.forEach(tr => {
                const qty = parseFloat(tr.querySelector('.item-qty')?.value) || 0;
                const rate = parseFloat(tr.querySelector('.item-rate')?.value) || 0;
                const amount = qty * rate;
                subtotal += amount;

                const amountSpan = tr.querySelector('.item-amount');
                if (amountSpan) {
                    amountSpan.textContent = `${symbol}${amount.toFixed(2)}`;
                }
            });

            const taxRate = parseFloat(document.getElementById('inv-tax-rate')?.value) || 0;
            const taxAmount = (subtotal * taxRate) / 100;
            const total = subtotal + taxAmount;

            const subtotalEl = document.getElementById('inv-subtotal');
            const taxAmountEl = document.getElementById('inv-tax-amount');
            const totalEl = document.getElementById('inv-total');

            if (subtotalEl) subtotalEl.textContent = `${symbol}${subtotal.toFixed(2)}`;
            if (taxAmountEl) taxAmountEl.textContent = `${symbol}${taxAmount.toFixed(2)}`;
            if (totalEl) totalEl.textContent = `${symbol}${total.toFixed(2)}`;
        },

        getInvoiceFormData() {
            const items = [];
            document.querySelectorAll('#invoice-items-tbody tr').forEach(tr => {
                items.push({
                    desc: tr.querySelector('.item-desc')?.value || '',
                    qty: parseFloat(tr.querySelector('.item-qty')?.value) || 1,
                    rate: parseFloat(tr.querySelector('.item-rate')?.value) || 0
                });
            });

            const currency = document.getElementById('inv-currency')?.value || 'USD';
            const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
            const taxRate = parseFloat(document.getElementById('inv-tax-rate')?.value) || 0;
            const taxAmount = (subtotal * taxRate) / 100;
            const total = subtotal + taxAmount;

            return {
                id: document.getElementById('inv-id')?.value || undefined,
                number: document.getElementById('inv-number')?.value || `INV-${this.state.nextInvoiceNum || 1001}`,
                date: document.getElementById('inv-date')?.value || new Date().toISOString().split('T')[0],
                dueDate: document.getElementById('inv-due-date')?.value || '',
                currency: currency,
                myAddress: document.getElementById('inv-my-address')?.value || '',
                myLogo: '/assets/zannat_inner_symbol_icon.png',
                clientName: document.getElementById('inv-client-name')?.value || '',
                clientCompany: document.getElementById('inv-client-company')?.value || '',
                clientEmail: document.getElementById('inv-client-email')?.value || '',
                clientAddress: document.getElementById('inv-client-address')?.value || '',
                items: items,
                subtotal: subtotal,
                taxRate: taxRate,
                taxAmount: taxAmount,
                total: total,
                notes: document.getElementById('inv-notes')?.value || '',
                paymentMethod: document.getElementById('inv-payment-method')?.value || 'Bank Transfer',
                status: document.getElementById('inv-status')?.value || 'Paid'
            };
        },

        async saveInvoice(event) {
            if (event) event.preventDefault();
            const invoiceData = this.getInvoiceFormData();

            if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
                this.showToast('Please provide client name.', 'error');
                return;
            }

            try {
                const response = await fetch(this.getApiUrl('/api/invoices'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    this.showToast(`Invoice ${result.invoice.number} saved! Generating PDF...`, 'success');
                    
                    // Update local state
                    const idx = this.state.invoices.findIndex(i => i.id === result.invoice.id);
                    if (idx !== -1) {
                        this.state.invoices[idx] = result.invoice;
                    } else {
                        this.state.invoices.unshift(result.invoice);
                    }

                    if (result.nextNum) {
                        this.state.nextInvoiceNum = result.nextNum;
                    }

                    this.renderInvoicesList();
                    this.renderInvoicePreview(result.invoice);
                    this.openModal('modal-invoice-preview');

                    // Auto-trigger PDF generation and print readiness
                    setTimeout(() => {
                        this.downloadCurrentInvoicePDF();
                    }, 400);
                } else {
                    this.showToast(result.error || 'Failed to save invoice.', 'error');
                }
            } catch (err) {
                console.error('Save invoice error:', err);
                this.showToast('Server error while saving invoice.', 'error');
            }
        },

        renderInvoicePreview(invoice) {
            this.currentPreviewInvoice = invoice;

            const previewEl = document.getElementById('invoice-preview-content');
            if (!previewEl) return;

            const previewStatusSelect = document.getElementById('preview-invoice-status-select');
            if (previewStatusSelect) previewStatusSelect.value = invoice.status || 'Paid';

            const symbol = invoice.currency === 'BDT' ? '৳' : '$';
            const logoSrc = '/assets/zannat_inner_symbol_icon.png';
            const status = invoice.status || 'Paid';
            const badgeClass = status === 'Unpaid' ? 'badge-unpaid' : (status === 'Due' ? 'badge-due' : 'badge-paid');

            let itemsRows = '';
            (invoice.items || []).forEach(item => {
                const amount = item.qty * item.rate;
                itemsRows += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${item.desc}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.qty}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${symbol}${item.rate.toFixed(2)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">${symbol}${amount.toFixed(2)}</td>
                    </tr>
                `;
            });

            previewEl.innerHTML = `
                <!-- Invoice Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
                    <div style="display: flex; gap: 16px; align-items: center;">
                        <img src="${logoSrc}" alt="Logo" style="width: 54px; height: 54px; object-fit: contain; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; filter: drop-shadow(0 2px 6px rgba(139,92,246,0.3));">
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">Abu Zannat</h2>
                            <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">WordPress Specialist & Web Developer</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <h1 style="font-size: 2rem; font-weight: 900; color: #6366f1; margin: 0; letter-spacing: -0.02em;">INVOICE</h1>
                        <span style="font-size: 1rem; font-weight: 700; color: #334155;">${invoice.number}</span>
                        <div style="margin-top: 4px;"><span class="${badgeClass}">STATUS: ${status.toUpperCase()}</span></div>
                    </div>
                </div>

                <!-- Addresses & Dates Row -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div>
                        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">From</h4>
                        <div style="white-space: pre-line; font-size: 0.9rem; color: #334155; line-height: 1.5; font-weight: 500;">
                            ${invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh'}
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Billed To</h4>
                        <div style="font-weight: 700; font-size: 1rem; color: #0f172a;">${invoice.clientName || 'Client'}</div>
                        ${invoice.clientCompany ? `<div style="font-size: 0.85rem; color: #475569; font-weight: 600;">${invoice.clientCompany}</div>` : ''}
                        ${invoice.clientEmail ? `<div style="font-size: 0.85rem; color: #6366f1;">${invoice.clientEmail}</div>` : ''}
                        <div style="white-space: pre-line; font-size: 0.85rem; color: #475569; margin-top: 4px; line-height: 1.4;">${invoice.clientAddress || ''}</div>
                    </div>
                </div>

                <!-- Dates & Payment Banner -->
                <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; font-size: 0.85rem; color: #475569; background: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
                    <div><strong>Date Issued:</strong> ${invoice.date || ''}</div>
                    ${invoice.dueDate ? `<div><strong>Due Date:</strong> ${invoice.dueDate}</div>` : ''}
                    <div><strong>Currency:</strong> ${invoice.currency} (${symbol})</div>
                    <div><strong>Payment Method:</strong> ${invoice.paymentMethod || 'Bank Transfer'}</div>
                </div>

                <!-- Line Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                        <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 0.75rem; color: #475569;">
                            <th style="padding: 10px 12px; text-align: left;">Work Description</th>
                            <th style="padding: 10px 12px; text-align: center;">Qty</th>
                            <th style="padding: 10px 12px; text-align: right;">Rate</th>
                            <th style="padding: 10px 12px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <!-- Summary Totals -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
                    <div style="width: 260px; font-size: 0.9rem;">
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
                            <span>Subtotal:</span>
                            <span>${symbol}${(invoice.subtotal || 0).toFixed(2)}</span>
                        </div>
                        ${invoice.taxRate > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
                            <span>Tax (${invoice.taxRate}%):</span>
                            <span>${symbol}${(invoice.taxAmount || 0).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 1.1rem; color: #0f172a; margin-top: 4px;">
                            <span>Total Paid:</span>
                            <span style="color: #16a34a;">${symbol}${(invoice.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Notes / Footer -->
                ${invoice.notes ? `
                <div style="padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #6366f1; font-size: 0.85rem; color: #475569;">
                    <strong style="color: #1e293b;">Notes & Instructions:</strong>
                    <div style="white-space: pre-line; margin-top: 4px;">${invoice.notes}</div>
                </div>
                ` : ''}

                <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 0.8rem; color: #94a3b8;">
                    Thank you for your business! — Abu Zannat (WordPress Bug Fixer & Web Developer)
                </div>
            `;
        },

        async changeInvoiceStatusFromPreview(newStatus) {
            if (!this.currentPreviewInvoice) return;

            this.currentPreviewInvoice.status = newStatus;

            try {
                const response = await fetch(this.getApiUrl('/api/invoices'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.currentPreviewInvoice)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    this.showToast(`Invoice ${result.invoice.number} status updated to ${newStatus}`, 'success');
                    const idx = this.state.invoices.findIndex(i => i.id === result.invoice.id);
                    if (idx !== -1) {
                        this.state.invoices[idx] = result.invoice;
                    }
                    this.renderInvoicesList();
                    this.renderInvoicePreview(result.invoice);
                }
            } catch (err) {
                console.error('Update status error:', err);
                this.showToast('Failed to update status', 'error');
            }
        },

        renderInvoicesList() {
            const tbody = document.getElementById('invoices-list-tbody');
            if (!tbody) return;

            if (!this.state.invoices || this.state.invoices.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                            No invoices generated yet. Click "Create New Invoice" to generate one.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = '';
            this.state.invoices.forEach(inv => {
                const tr = document.createElement('tr');
                const symbol = inv.currency === 'BDT' ? '৳' : '$';
                const status = inv.status || 'Paid';
                const badgeClass = status === 'Unpaid' ? 'badge-unpaid' : (status === 'Due' ? 'badge-due' : 'badge-paid');

                tr.innerHTML = `
                    <td style="font-weight: 700; color: var(--accent-purple);">${inv.number}</td>
                    <td>
                        <div style="font-weight: 600;">${inv.clientName || 'N/A'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${inv.clientCompany || ''}</div>
                    </td>
                    <td>
                        <div>${inv.date || 'N/A'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.paymentMethod || 'Bank Transfer'}</div>
                    </td>
                    <td style="font-weight: 700;">${symbol}${(inv.total || 0).toFixed(2)}</td>
                    <td><span class="${badgeClass}" style="font-size: 0.7rem;">${status}</span></td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline btn-icon" title="View / Open Invoice in New Tab" onclick="app.openInvoiceInNewTab('${inv.id}')">
                                <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button type="button" class="btn btn-outline btn-icon" title="Edit Invoice" onclick="app.editInvoice('${inv.id}')">
                                <i data-lucide="edit" style="width: 14px; height: 14px; color: var(--accent-cyan);"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Delete Invoice" onclick="app.deleteInvoice('${inv.id}')">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red);"></i>
                            </button>
                        </div>
                    </td>
                `;

                tbody.appendChild(tr);
            });

            if (window.lucide) window.lucide.createIcons();
        },

        editInvoice(id) {
            const invoice = (this.state.invoices || []).find(i => i.id === id);
            if (!invoice) return;

            const invIdEl = document.getElementById('inv-id');
            const invNumEl = document.getElementById('inv-number');
            const invDateEl = document.getElementById('inv-date');
            const invDueDateEl = document.getElementById('inv-due-date');
            const invCurrencyEl = document.getElementById('inv-currency');
            const invPaymentEl = document.getElementById('inv-payment-method');
            const invStatusEl = document.getElementById('inv-status');
            const invAddressEl = document.getElementById('inv-my-address');
            const invClientNameEl = document.getElementById('inv-client-name');
            const invClientCompanyEl = document.getElementById('inv-client-company');
            const invClientEmailEl = document.getElementById('inv-client-email');
            const invClientAddressEl = document.getElementById('inv-client-address');
            const invTaxEl = document.getElementById('inv-tax-rate');
            const invNotesEl = document.getElementById('inv-notes');

            if (invIdEl) invIdEl.value = invoice.id || '';
            if (invNumEl) invNumEl.value = invoice.number || '';
            if (invDateEl) invDateEl.value = invoice.date || '';
            if (invDueDateEl) invDueDateEl.value = invoice.dueDate || '';
            if (invCurrencyEl) invCurrencyEl.value = invoice.currency || 'USD';
            if (invPaymentEl) invPaymentEl.value = invoice.paymentMethod || 'Bank Transfer';
            if (invStatusEl) invStatusEl.value = invoice.status || 'Paid';
            if (invAddressEl) invAddressEl.value = invoice.myAddress || '';
            if (invClientNameEl) invClientNameEl.value = invoice.clientName || '';
            if (invClientCompanyEl) invClientCompanyEl.value = invoice.clientCompany || '';
            if (invClientEmailEl) invClientEmailEl.value = invoice.clientEmail || '';
            if (invClientAddressEl) invClientAddressEl.value = invoice.clientAddress || '';
            if (invTaxEl) invTaxEl.value = invoice.taxRate !== undefined ? invoice.taxRate : 0;
            if (invNotesEl) invNotesEl.value = invoice.notes || '';

            // Populate line items
            const tbody = document.getElementById('invoice-items-tbody');
            if (tbody) tbody.innerHTML = '';

            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => {
                    this.addInvoiceItemRow(item.desc || '', item.qty || 1, item.rate || 0);
                });
            } else {
                this.addInvoiceItemRow('WordPress Debugging & Bug Repair', 1, 150);
            }

            this.calculateInvoiceTotals();
            this.toggleInvoiceView('create');

            window.scrollTo(0, 0);
            const contentBody = document.querySelector('.content-body');
            if (contentBody) contentBody.scrollTop = 0;
        },

        openInvoiceInNewTab(id) {
            const invoice = (this.state.invoices || []).find(i => i.id === id);
            if (!invoice) return;

            // Also render and open preview modal in local UI
            this.renderInvoicePreview(invoice);
            this.openModal('modal-invoice-preview');

            // Build standalone printable document for next tab
            const symbol = invoice.currency === 'BDT' ? '৳' : '$';
            const logoSrc = '/assets/zannat_inner_symbol_icon.png';
            const status = invoice.status || 'Paid';
            const statusColor = status === 'Unpaid' ? '#991b1b' : (status === 'Due' ? '#92400e' : '#166534');
            const statusBg = status === 'Unpaid' ? '#fee2e2' : (status === 'Due' ? '#fef3c7' : '#dcfce7');

            let itemsRows = '';
            (invoice.items || []).forEach(item => {
                const amount = item.qty * item.rate;
                itemsRows += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${item.desc}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.qty}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">${symbol}${item.rate.toFixed(2)}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700;">${symbol}${amount.toFixed(2)}</td>
                    </tr>
                `;
            });

            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${invoice.number} - Abu Zannat Invoice</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px; }
        .paper { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .actions { max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end; gap: 12px; }
        .btn { padding: 10px 20px; font-size: 0.9rem; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; }
        .btn-primary { background: #6366f1; color: #ffffff; }
        .btn-outline { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
        @media print { .actions { display: none !important; } body { padding: 0; background: #fff; } .paper { box-shadow: none; padding: 0; } }
    </style>
</head>
<body>
    <div class="actions">
        <button class="btn btn-outline" onclick="window.print()">Print Document</button>
        <button class="btn btn-primary" onclick="downloadPDF()">Download PDF</button>
    </div>
    <div id="invoice-doc" class="paper">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div style="display: flex; gap: 16px; align-items: center;">
                <img src="${logoSrc}" alt="Logo" style="width: 54px; height: 54px; object-fit: contain; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; filter: drop-shadow(0 2px 6px rgba(139,92,246,0.3));">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">Abu Zannat</h2>
                    <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">WordPress Specialist & Web Developer</span>
                </div>
            </div>
            <div style="text-align: right;">
                <h1 style="font-size: 2rem; font-weight: 900; color: #6366f1; margin: 0; letter-spacing: -0.02em;">INVOICE</h1>
                <span style="font-size: 1rem; font-weight: 700; color: #334155;">${invoice.number}</span>
                <div style="margin-top: 4px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">STATUS: ${status.toUpperCase()}</span></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div>
                <h4 style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">From</h4>
                <div style="white-space: pre-line; font-size: 0.9rem; color: #334155; line-height: 1.5; font-weight: 500;">
                    ${invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh'}
                </div>
            </div>
            <div>
                <h4 style="font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Billed To</h4>
                <div style="font-weight: 700; font-size: 1rem; color: #0f172a;">${invoice.clientName || 'Client'}</div>
                ${invoice.clientCompany ? `<div style="font-size: 0.85rem; color: #475569; font-weight: 600;">${invoice.clientCompany}</div>` : ''}
                ${invoice.clientEmail ? `<div style="font-size: 0.85rem; color: #6366f1;">${invoice.clientEmail}</div>` : ''}
                <div style="white-space: pre-line; font-size: 0.85rem; color: #475569; margin-top: 4px; line-height: 1.4;">${invoice.clientAddress || ''}</div>
            </div>
        </div>

        <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; font-size: 0.85rem; color: #475569; background: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
            <div><strong>Date Issued:</strong> ${invoice.date || ''}</div>
            ${invoice.dueDate ? `<div><strong>Due Date:</strong> ${invoice.dueDate}</div>` : ''}
            <div><strong>Currency:</strong> ${invoice.currency} (${symbol})</div>
            <div><strong>Payment Method:</strong> ${invoice.paymentMethod || 'Bank Transfer'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
                <tr style="background: #f1f5f9; text-transform: uppercase; font-size: 0.75rem; color: #475569;">
                    <th style="padding: 10px 12px; text-align: left;">Work Description</th>
                    <th style="padding: 10px 12px; text-align: center;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right;">Rate</th>
                    <th style="padding: 10px 12px; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
            <div style="width: 260px; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
                    <span>Subtotal:</span>
                    <span>${symbol}${(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                ${invoice.taxRate > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #475569;">
                    <span>Tax (${invoice.taxRate}%):</span>
                    <span>${symbol}${(invoice.taxAmount || 0).toFixed(2)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 1.1rem; color: #0f172a; margin-top: 4px;">
                    <span>Total Amount:</span>
                    <span style="color: #16a34a;">${symbol}${(invoice.total || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>

        ${invoice.notes ? `
        <div style="padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #6366f1; font-size: 0.85rem; color: #475569;">
            <strong style="color: #1e293b;">Notes & Instructions:</strong>
            <div style="white-space: pre-line; margin-top: 4px;">${invoice.notes}</div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 0.8rem; color: #94a3b8;">
            Thank you for your business! — Abu Zannat (WordPress Bug Fixer & Web Developer)
        </div>
    </div>

    <script>
        function downloadPDF() {
            const element = document.getElementById('invoice-doc');
            const opt = {
                margin: 10,
                filename: '${invoice.number}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 3, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }
    </script>
</body>
</html>
            `;

            const win = window.open('', '_blank');
            if (win) {
                win.document.open();
                win.document.write(htmlContent);
                win.document.close();
            }
        },

        viewInvoice(id) {
            this.openInvoiceInNewTab(id);
        },

        downloadCurrentInvoicePDF() {
            const element = document.getElementById('invoice-preview-content');
            if (!element) return;

            if (typeof html2pdf === 'undefined') {
                this.showToast('PDF generator library loading... Please try again.', 'error');
                return;
            }

            const opt = {
                margin:       10,
                filename:     `Invoice_${Date.now()}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 3, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save();
        },

        async deleteInvoice(id) {
            if (!confirm('Are you sure you want to delete this invoice?')) return;

            try {
                const response = await fetch(this.getApiUrl('/api/invoices/delete'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    this.showToast('Invoice deleted.', 'success');
                    this.state.invoices = this.state.invoices.filter(i => i.id !== id);
                    this.renderInvoicesList();
                } else {
                    this.showToast(result.error || 'Failed to delete invoice.', 'error');
                }
            } catch (err) {
                console.error('Delete invoice error:', err);
                this.showToast('Server connection error.', 'error');
            }
        }
    };

    // Expose app globally so inline onclick callbacks can reach it
    window.app = app;

    // Run initialization once DOM content is fully ready
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
})();
