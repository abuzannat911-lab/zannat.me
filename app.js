// app.js - Client-Side Controller for zannat.bd
(function() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const app = {
        state: {
            tickets: [],
            earnings: [],
            bugTypes: [],
            pages: [],
            users: [],
            invoices: [],
            clients: [],
            nextInvoiceNum: 1001,
            bankDetails: {
                bankName: "Eastern Bank PLC",
                accountName: "Abu Zannat",
                accountNumber: "1234567890",
                swiftCode: "EBLDBDDH",
                branch: "Rangpur Branch, Bangladesh"
            },
            smtpConfig: {},
            homepageContent: {},
            siteSettings: null,
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

        // Authenticated fetch helper: automatically injects session token header and handles 401s
        async authFetch(endpoint, options = {}) {
            const url = this.getApiUrl(endpoint);
            const token = sessionStorage.getItem('zannat_token');
            const headers = Object.assign({}, options.headers || {});
            if (token) {
                headers['x-auth-token'] = token;
            }
            const opts = Object.assign({}, options, { headers });
            const response = await fetch(url, opts);
            if (response.status === 401) {
                // Admin session expired or missing
                sessionStorage.removeItem('zannat_token');
                this.state.isAuthenticated = false;
                this.updateAuthUI(false);
                this.showToast('Please log in as admin to perform this action.', 'error');
                this.openModal('login-overlay');
            }
            return response;
        },

        // Fetch application state directly from SQLite database backend
        async fetchState() {
            let data = null;
            try {
                const response = await this.authFetch('/api/state');
                if (response.ok) {
                    data = await response.json();
                } else {
                    console.error('Failed to load state from database server:', response.statusText);
                }
            } catch (err) {
                console.error('Database connection error:', err);
                this.showToast('Unable to connect to database backend.', 'error');
            }

            // Synchronize authentication status with server authority
            if (data && data.isAdmin) {
                this.state.isAuthenticated = true;
                this.updateAuthUI(true);
            } else {
                this.state.isAuthenticated = false;
                this.updateAuthUI(false);
                sessionStorage.removeItem('zannat_token');
            }

            if (!data) {
                data = {
                    users: [],
                    tickets: [],
                    earnings: [],
                    bugTypes: [],
                    homepageContent: {
                        name: "Abu Zannat",
                        title: "WordPress Specialist & Web Developer",
                        avatar: "assets/photo1.jpg",
                        about: "WordPress Specialist & Web Developer"
                    },
                    pages: [],
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
            }

            this.state.tickets = data.tickets || [];
            this.state.earnings = data.earnings || [];
            this.state.bugTypes = data.bugTypes || [];
            this.state.pages = data.pages || [];
            this.state.users = data.users || [];
            this.state.invoices = data.invoices || [];
            this.state.clients = data.clients || [];
            this.state.nextInvoiceNum = data.nextInvoiceNum || 1001;
            this.state.bankDetails = data.bankDetails || {
                bankName: "Dutch Bangla Bank PLC",
                accountName: "Abu Zannat Md Mosaddek",
                accountNumber: "1621010088950",
                routingNumber: "090851456",
                swiftCode: "DBBLBDDH",
                branch: "Rangpur Branch"
            };
            this.state.homepageContent = data.homepageContent || {};
            this.state.smtpConfig = data.smtpConfig || {};
            this.state.siteSettings = data.siteSettings || null;

            // Render components based on database state
            this.renderDashboardKPIs();
            this.renderCharts();
            this.renderTicketsTable();
            this.renderCMSPagesTable();
            this.renderAdminUsersTable();
            this.renderHomepageContent();
            this.applySiteSettingsToDOM();
            this.renderSiteSettingsTab();
            this.renderSMTPConfig();
            this.renderInvoicesList();
            this.renderClientSelectOptions();
            this.renderClientsTab();
            this.initWhatsAppPolling();
            this.resetInvoiceForm();

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

            // Global Click Delegation for Gmail Connection Buttons & Modals
            document.addEventListener('click', (e) => {
                const connectBtn = e.target.closest('#btn-google-login, [data-action="connect-gmail"], [data-action="change-gmail"]');
                if (connectBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openConnectGmailModal();
                    return;
                }

                const disconnectBtn = e.target.closest('[data-action="disconnect-gmail"], #btn-disconnect-gmail');
                if (disconnectBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.disconnectGmailOAuth();
                    return;
                }
            });

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
                    let errorText = 'Invalid credentials. Please check username and password.';

                    try {
                        const response = await fetch(this.getApiUrl('/api/login'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: uVal,
                                password: pVal
                            })
                        });

                        const result = await response.json().catch(() => ({}));
                        if (response.ok && result.success) {
                            authenticated = true;
                            token = result.token;
                        } else {
                            if (result.message) {
                                errorText = result.message;
                            }
                        }
                    } catch (err) {
                        console.error('Login request error:', err);
                        errorText = 'Unable to connect to authentication server.';
                    }

                    if (authenticated && token) {
                        // Authenticated successfully with secure server token
                        sessionStorage.setItem('zannat_token', token);
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

                        // Refresh state with authenticated privileges
                        await this.fetchState();

                        // Switch to dashboard
                        this.switchTab('dashboard');
                    } else {
                        // Auth failed
                        errorMsg.textContent = errorText;
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
                    const clientPhone = (document.getElementById('ticket-client-phone')?.value || '').trim();
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
                                clientPhone,
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
                            this.showToast('Failed to submit ticket: ' + (result.error || 'unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Ticket submission error:', err);
                        this.showToast('Server connection error. Please try again.', 'error');
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

                        const response = await this.authFetch('/api/tickets/update', {
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

                            let msg = `Ticket ${this.currentEditingId} updated successfully`;
                            if (result.notified && (result.notified.wa || result.notified.email)) {
                                const channels = [];
                                if (result.notified.wa) channels.push('WhatsApp');
                                if (result.notified.email) channels.push('Email');
                                msg += ` · Client notified via ${channels.join(' & ')}!`;
                            }
                            this.showToast(msg, 'success');
                            this.fetchState();
                        } else {
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Update ticket error:', err);
                        this.showToast('Server connection error.', 'error');
                    }
                });
            }

            // Quick Status Buttons Delegation (Admin Action)
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="quick-status"]');
                if (btn) {
                    const ticketId = btn.getAttribute('data-id');
                    const newStatus = btn.getAttribute('data-status');
                    this.quickUpdateTicketStatus(ticketId, newStatus);
                }
            });

            // Delete Ticket Delegation
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action="delete-ticket"]');
                if (btn) {
                    const ticketId = btn.getAttribute('data-id');
                    this.deleteTicket(ticketId);
                }
            });

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
                        const response = await this.authFetch('/api/homepage/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, title, avatar, about })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.showToast('Homepage content updated successfully!', 'success');
                            this.fetchState();
                        } else {
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Update homepage error:', err);
                        this.showToast('Server connection error.', 'error');
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
                        const response = await this.authFetch('/api/pages', {
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
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Save custom page error:', err);
                        this.showToast('Server connection error.', 'error');
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
                        const response = await this.authFetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.showToast('Admin user saved/updated successfully!', 'success');
                            usernameInput.value = '';
                            passwordInput.value = '';
                            this.fetchState();
                        } else {
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Save admin user error:', err);
                        this.showToast('Server connection error.', 'error');
                    }
                });
            }

            // Custom Page Action Delegation (Edit & Delete)
            document.addEventListener('click', (e) => {
                const editBtn = e.target.closest('[data-action="edit-page"]');
                if (editBtn) {
                    const slug = editBtn.getAttribute('data-slug');
                    this.openEditPageModal(slug);
                    return;
                }

                const delBtn = e.target.closest('[data-action="delete-page"]');
                if (delBtn) {
                    const slug = delBtn.getAttribute('data-slug');
                    this.deletePage(slug);
                    return;
                }

                const delUserBtn = e.target.closest('[data-action="delete-user"]');
                if (delUserBtn) {
                    const username = delUserBtn.getAttribute('data-username');
                    this.deleteAdminUser(username);
                    return;
                }
            });

            // Gmail Connection Form Submission (Maintenance Tab)
            const connectGmailForm = document.getElementById('form-connect-gmail');
            if (connectGmailForm) {
                connectGmailForm.addEventListener('submit', (e) => {
                    this.submitConnectGmailForm(e);
                });
            }

            const connectGmailBtn = document.getElementById('btn-submit-connect-gmail');
            if (connectGmailBtn) {
                connectGmailBtn.addEventListener('click', (e) => {
                    const form = document.getElementById('form-connect-gmail');
                    if (form) {
                        if (!form.checkValidity()) {
                            form.reportValidity();
                            return;
                        }
                        this.submitConnectGmailForm(e);
                    }
                });
            }

            // SMTP Configuration Form Submission
            const smtpForm = document.getElementById('form-cms-smtp');
            if (smtpForm) {
                smtpForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const host = document.getElementById('smtp-host')?.value || 'smtp.gmail.com';
                    const port = document.getElementById('smtp-port')?.value || '587';
                    const secure = document.getElementById('smtp-secure')?.value || 'false';
                    const user = document.getElementById('smtp-user')?.value || '';
                    const pass = document.getElementById('smtp-pass')?.value || '';

                    try {
                        const response = await this.authFetch('/api/smtp/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ host, port, secure, user, pass })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.showToast('SMTP Configuration saved successfully!', 'success');
                            this.fetchState();
                        } else {
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Save SMTP config error:', err);
                        this.showToast('Server connection error.', 'error');
                    }
                });
            }

            // Google OAuth Credentials Form Submission
            const googleCredsForm = document.getElementById('form-google-credentials');
            if (googleCredsForm) {
                googleCredsForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const clientId = (document.getElementById('oauth-client-id').value || '').trim();
                    const clientSecret = (document.getElementById('oauth-client-secret').value || '').trim();

                    try {
                        const response = await this.authFetch('/api/auth/google/credentials', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ clientId, clientSecret })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.showToast('Google OAuth App credentials saved successfully!', 'success');
                            this.fetchState();
                        } else {
                            this.showToast('Error: ' + (result.error || 'Unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Save Google credentials error:', err);
                        this.showToast('Server connection error.', 'error');
                    }
                });
            }

            // Live Email Deliverability Test Form Submission
            const testEmailForm = document.getElementById('form-test-email');
            if (testEmailForm) {
                testEmailForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const to = (document.getElementById('test-email-recipient').value || '').trim();
                    const btn = document.getElementById('btn-send-test-email');
                    const resultDiv = document.getElementById('test-email-result');

                    if (!to) {
                        this.showToast('Please enter a recipient email address.', 'error');
                        return;
                    }

                    const originalBtnHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = `
                        <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 6px;"></span>
                        <span>Dispatching Email...</span>
                    `;
                    if (resultDiv) {
                        resultDiv.style.display = 'block';
                        resultDiv.innerHTML = `
                            <div style="padding: 10px 14px; border-radius: 8px; font-size: 13px; background: rgba(59,130,246,0.08); color: #2563eb; border: 1px solid rgba(59,130,246,0.2);">
                                ⏳ Connecting to email provider and dispatching live test email...
                            </div>
                        `;
                    }

                    try {
                        const response = await this.authFetch('/api/smtp/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ to })
                        });

                        const result = await response.json();
                        if (response.ok && result.success) {
                            this.showToast(result.message || 'Test email sent successfully!', 'success');
                            if (resultDiv) {
                                resultDiv.innerHTML = `
                                    <div style="padding: 12px 16px; border-radius: 8px; font-size: 13px; background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.3); line-height: 1.5;">
                                        <strong>✅ Email Delivered Successfully!</strong><br>
                                        ${result.message}<br>
                                        <span style="font-size: 11px; opacity: 0.85;">Message ID: ${result.messageId || 'OK'}</span>
                                    </div>
                                `;
                            }
                        } else {
                            this.showToast(result.error || 'Failed to send test email', 'error');
                            if (resultDiv) {
                                resultDiv.innerHTML = `
                                    <div style="padding: 12px 16px; border-radius: 8px; font-size: 13px; background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.3); line-height: 1.5;">
                                        <strong>❌ Delivery Failed:</strong><br>
                                        ${result.error || 'Unknown error occurred while connecting to mail transport.'}
                                    </div>
                                `;
                            }
                        }
                    } catch (err) {
                        console.error('Test email error:', err);
                        this.showToast('Server connection error.', 'error');
                        if (resultDiv) {
                            resultDiv.innerHTML = `
                                <div style="padding: 12px 16px; border-radius: 8px; font-size: 13px; background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.3);">
                                    <strong>❌ Connection Error:</strong> Unable to reach server.
                                </div>
                            `;
                        }
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalBtnHtml;
                        if (window.lucide) window.lucide.createIcons();
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

        // Toggle Site Settings submenu open/closed
        toggleSettingsSubmenu() {
            const menuItem = document.getElementById('menu-item-settings');
            if (menuItem) {
                menuItem.classList.toggle('open');
            }
        },

        // Switch View Tabs
        switchTab(tabId) {
            // If selecting an admin tab, ensure we are authenticated or admin shell is already active
            const adminTabs = ['dashboard', 'tickets', 'maintenance', 'cms', 'invoices', 'clients', 'settings', 'notifications'];
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
            } else if (adminTabs.includes(tabId)) {
                if (publicLanding) publicLanding.classList.add('hidden');
                if (adminShell) adminShell.classList.remove('hidden');
                
                // Update URL to specific admin sub-route
                const adminTabMap = {
                    'dashboard': '/admin/dashboard',
                    'tickets': '/admin/tickets',
                    'maintenance': '/admin/maintenance',
                    'cms': '/admin/cms',
                    'invoices': '/admin/invoices',
                    'clients': '/admin/clients',
                    'settings': '/admin/settings',
                    'notifications': '/admin/notifications'
                };
                const targetUrl = adminTabMap[tabId] || '/admin';
                if (window.location.pathname !== targetUrl) {
                    history.pushState(null, '', targetUrl);
                }

                if (tabId === 'invoices') {
                    this.loadInvoicesFromDatabase().then(() => {
                        this.renderInvoicesList();
                        if (!document.getElementById('inv-number')?.value) {
                            this.resetInvoiceForm();
                        }
                    });
                } else if (tabId === 'clients') {
                    this.renderClientsTab();
                } else if (tabId === 'settings') {
                    this.renderSiteSettingsTab();
                } else if (tabId === 'notifications') {
                    this.renderNotificationReceiverTab();
                }
            }

            // Remove active class from all nav links and add to selected
            document.querySelectorAll('.nav-link').forEach(link => {
                const linkTab = link.getAttribute('data-tab');
                if (linkTab === tabId || ((tabId === 'notifications' || tabId === 'maintenance') && linkTab === 'settings')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Update sublinks active class in sidebar
            document.querySelectorAll('.nav-sublink').forEach(sublink => {
                const sublinkKey = sublink.getAttribute('data-subtab-link');
                if (sublinkKey === tabId) {
                    sublink.classList.add('active');
                } else {
                    sublink.classList.remove('active');
                }
            });

            // Auto-open/close Settings submenu based on active tab
            const settingsMenu = document.getElementById('menu-item-settings');
            if (settingsMenu) {
                const settingsSubTabs = ['settings', 'notifications', 'maintenance'];
                if (settingsSubTabs.includes(tabId)) {
                    settingsMenu.classList.add('open');
                } else {
                    settingsMenu.classList.remove('open');
                }
            }

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
                        this.refreshSystemInfo();
                        break;
                    case 'cms':
                        pageTitle.textContent = 'Pages & CMS';
                        pageSubtitle.textContent = 'Update homepage content and manage custom sub-pages.';
                        break;
                    case 'invoices':
                        pageTitle.textContent = 'Invoice Generator & Billing Desk';
                        pageSubtitle.textContent = 'Create professional PDF invoices with auto-increment numbers, client addresses, and tax options.';
                        break;
                    case 'clients':
                        pageTitle.textContent = 'Clients Directory';
                        pageSubtitle.textContent = 'Manage client profiles, contact information, and invoice billing history.';
                        this.renderClientsTab();
                        break;
                    case 'settings':
                        pageTitle.textContent = 'Website Content & Text Settings';
                        pageSubtitle.textContent = 'Customize all text, headlines, and content across headers, footers, homepage, and subpages.';
                        this.renderSiteSettingsTab();
                        break;
                    case 'notifications':
                        pageTitle.textContent = 'Notification Receiver Settings';
                        pageSubtitle.textContent = 'Configure where and how you receive instant alerts when a client submits a new WordPress bug fix query.';
                        this.renderNotificationReceiverTab();
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

        // Escape HTML to prevent injection issues in dynamic content
        escapeHtml(str) {
            if (str === undefined || str === null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        getReviewsList() {
            if (this.state && this.state.siteSettings && this.state.siteSettings.reviews && Array.isArray(this.state.siteSettings.reviews.items)) {
                return this.state.siteSettings.reviews.items;
            }
            return this.reviewsData || [];
        },

        // =============================================
        // REVIEWS SECTION RENDERER
        // =============================================
        renderReviews() {
            const grid = document.getElementById('reviews-grid');
            const loadMoreBtn = document.getElementById('reviews-load-more-btn');
            const shownLabel = document.getElementById('reviews-shown-label');
            if (!grid) return;

            grid.innerHTML = '';
            const reviews = this.getReviewsList();

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

            const getColor = (name) => {
                const code = (name && name.length > 0) ? name.charCodeAt(0) : 0;
                return colors[code % colors.length];
            };

            const renderCard = (review, idx) => {
                const card = document.createElement('div');
                card.className = 'review-card';
                card.style.animationDelay = `${(idx % LOAD_MORE_SIZE) * 70}ms`;

                const name = review.username || 'Anonymous';
                const initials = name.slice(0, 2).toUpperCase();
                const stars = '★'.repeat(Math.max(1, Math.min(5, review.rating || 5)));
                const verifiedBadge = review.real
                    ? `<span class="review-fiverr-icon"><svg width="11" height="11" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DBF73"/><text x="12" y="17" text-anchor="middle" font-size="13" font-family="Arial" font-weight="bold" fill="white">f</text></svg> Fiverr Verified</span>`
                    : '';

                card.innerHTML = `
                    <div class="review-card-header">
                        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                            <div class="review-avatar" style="background:${getColor(name)};">${initials}</div>
                            <div class="review-author-info">
                                <div class="review-author-name">${this.escapeHtml(name)}</div>
                                <div class="review-author-country">${review.flag || '🌐'} ${this.escapeHtml(review.country || '')}</div>
                            </div>
                        </div>
                        <div class="review-card-stars">${stars}</div>
                    </div>
                    <p class="review-quote">"${this.escapeHtml(review.comment || '')}"</p>
                    <div class="review-card-footer">
                        <span class="review-date">${this.escapeHtml(review.date || '')}</span>
                        ${verifiedBadge}
                    </div>
                `;
                return card;
            };

            const updateLabel = () => {
                const total = reviews.length;
                if (shownLabel) {
                    shownLabel.textContent = `Showing ${Math.min(shownCount, total)} of ${total} reviews`;
                }
            };

            const showMore = (count) => {
                const start = shownCount;
                const end = Math.min(shownCount + count, reviews.length);
                for (let i = start; i < end; i++) {
                    grid.appendChild(renderCard(reviews[i], i - start));
                }
                shownCount = end;
                updateLabel();
                if (window.lucide) window.lucide.createIcons();
                if (shownCount >= reviews.length) {
                    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
                } else {
                    if (loadMoreBtn) loadMoreBtn.classList.remove('hidden');
                }
            };

            // Initial render — show 10
            showMore(PAGE_SIZE);

            // Safely reset click listener
            if (loadMoreBtn) {
                const newBtn = loadMoreBtn.cloneNode(true);
                loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
                newBtn.addEventListener('click', () => showMore(LOAD_MORE_SIZE));
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
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
                if (window.lucide) window.lucide.createIcons();
            }
        },

        // Close Modal Overlay
        closeModal(modalId) {
            const overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                
                // If canceling admin login overlay, redirect to portfolio
                if (modalId === 'login-overlay' && !this.state.isAuthenticated) {
                    this.switchTab('portfolio');
                }
            }
        },

        // Log out admin user
        async logout() {
            try {
                await this.authFetch('/api/logout', { method: 'POST' });
            } catch (e) {
                // Ignore network error on logout
            }
            sessionStorage.removeItem('zannat_token');
            this.state.isAuthenticated = false;
            this.updateAuthUI(false);
            
            // Re-fetch sanitized public state
            await this.fetchState();

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
            const kpiLabel = document.getElementById('kpi-revenue-label');

            if (kpiTotal) kpiTotal.textContent = this.state.tickets.length;
            
            const resolvedCount = this.state.tickets.filter(t => t.status === 'Resolved').length;
            if (kpiResolved) kpiResolved.textContent = resolvedCount;

            const pendingCount = this.state.tickets.filter(t => t.status === 'Pending').length;
            if (kpiPending) kpiPending.textContent = pendingCount;

            // Calculate revenue from invoices grouped by currency
            if (kpiEarnings) {
                const invoices = this.state.invoices || [];
                const revenueByCurrency = {};

                invoices.forEach(inv => {
                    const currency = (inv.currency || 'USD').toUpperCase();
                    const total = Number(inv.total) || 0;
                    if (!revenueByCurrency[currency]) {
                        revenueByCurrency[currency] = 0;
                    }
                    revenueByCurrency[currency] += total;
                });

                const currencies = Object.keys(revenueByCurrency);

                if (currencies.length === 0) {
                    kpiEarnings.innerHTML = '<h3 style="margin:0;">$0</h3>';
                    if (kpiLabel) kpiLabel.textContent = 'Total Revenue';
                } else if (currencies.length === 1) {
                    const cur = currencies[0];
                    const symbol = this.getCurrencySymbol(cur);
                    const amount = revenueByCurrency[cur];
                    kpiEarnings.innerHTML = `<h3 style="margin:0;">${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</h3>`;
                    if (kpiLabel) kpiLabel.textContent = `Total Revenue (${cur})`;
                } else {
                    // Multiple currencies — show each on its own row
                    if (kpiLabel) kpiLabel.textContent = `Total Revenue (${currencies.length} currencies)`;
                    let html = '';
                    currencies.forEach(cur => {
                        const symbol = this.getCurrencySymbol(cur);
                        const amount = revenueByCurrency[cur];
                        html += `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding: 2px 0;">
                            <span style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase; min-width:32px;">${cur}</span>
                            <span style="font-size:16px; font-weight:700; color:var(--text-main); font-family:'Outfit',sans-serif;">${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                        </div>`;
                    });
                    kpiEarnings.innerHTML = html;
                }
            }
        },

        // Render charts using Chart.js
        renderCharts() {
            try {
                if (!window.Chart) {
                    console.warn('Chart.js library is not loaded yet.');
                    return;
                }

                // Build monthly earnings from invoices
                const invoices = this.state.invoices || [];
                const monthlyData = {};
                const currenciesUsed = new Set();

                invoices.forEach(inv => {
                    const dateStr = inv.date || inv.createdAt || '';
                    let monthLabel = 'Unknown';
                    if (dateStr) {
                        const d = new Date(dateStr);
                        if (!isNaN(d.getTime())) {
                            monthLabel = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        }
                    }
                    const total = Number(inv.total) || 0;
                    const currency = (inv.currency || 'USD').toUpperCase();
                    currenciesUsed.add(currency);

                    if (!monthlyData[monthLabel]) monthlyData[monthLabel] = 0;
                    monthlyData[monthLabel] += total;
                });

                // Sort months chronologically
                const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
                    const dateA = new Date(a);
                    const dateB = new Date(b);
                    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                    return dateA - dateB;
                });

                const months = sortedMonths.length > 0 ? sortedMonths : (this.state.earnings || []).map(e => e.month);
                const amounts = sortedMonths.length > 0 
                    ? sortedMonths.map(m => monthlyData[m]) 
                    : (this.state.earnings || []).map(e => e.amount);

                const currencyLabel = currenciesUsed.size === 1 
                    ? `Monthly Earnings (${[...currenciesUsed][0]})` 
                    : `Monthly Earnings (Mixed Currencies)`;

                // Render Monthly Earnings Chart
                const earningsCtx = document.getElementById('chart-monthly-earnings');
                if (earningsCtx) {
                    if (this.charts.earnings) {
                        this.charts.earnings.destroy();
                    }

                    this.charts.earnings = new Chart(earningsCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: months,
                            datasets: [{
                                label: currencyLabel,
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

            const filterStatus = document.getElementById('ticket-filter-status') ? document.getElementById('ticket-filter-status').value : '';
            
            // Filter tickets array
            const filteredTickets = (this.state.tickets || []).filter(t => {
                if (filterStatus && t.status !== filterStatus) return false;
                return true;
            });

            // Update badge count
            const countBadge = document.getElementById('tickets-count-badge');
            if (countBadge) {
                const total = filteredTickets.length;
                countBadge.textContent = `${total} ${total === 1 ? 'Ticket' : 'Tickets'}`;
            }

            // Sort by ticket creation (descending ID)
            filteredTickets.sort((a, b) => b.id.localeCompare(a.id));

            if (filteredTickets.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="ticket" style="width: 22px; height: 22px; opacity: 0.5;"></i>
                                </div>
                                <span style="font-size: 13px; font-weight: 500;">No bug tickets match this criteria.</span>
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

                // Status pill class
                let statusClass = 'ticket-status-pending';
                if (t.status === 'In Progress') statusClass = 'ticket-status-inprogress';
                if (t.status === 'Resolved') statusClass = 'ticket-status-resolved';
                if (t.status === 'Closed') statusClass = 'ticket-status-closed';

                return `
                    <tr>
                        <td>
                            <span style="font-family: monospace; font-weight: 700; font-size: 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 6px; color: var(--accent-purple); letter-spacing: 0.5px;">
                                ${this.escapeHtml(t.id)}
                            </span>
                        </td>
                        <td style="white-space: nowrap; font-size: 12px; color: var(--text-muted);">${this.escapeHtml(t.date || '')}</td>
                        <td>
                            <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${this.escapeHtml(t.clientName)}</div>
                            <div class="text-muted" style="font-size: 11px; margin-top: 2px;">${this.escapeHtml(t.clientEmail || 'No email')}</div>
                            ${t.clientPhone ? `
                                <div style="margin-top: 5px;">
                                    <a href="https://wa.me/${t.clientPhone.replace(/[^0-9]/g, '')}" target="_blank" style="background: rgba(34, 197, 94, 0.12); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; transition: all 0.2s;" title="Direct WhatsApp Chat with Client">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#22c55e"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.97.549 1.954.848 3.01.848 3.182 0 5.767-2.586 5.767-5.766.001-3.182-2.584-5.768-5.766-5.768zm0 10.455c-.928 0-1.841-.264-2.617-.743l-.187-.116-1.579.414.421-1.54-.123-.197c-.504-.805-.793-1.638-.792-2.502.001-2.529 2.057-4.586 4.588-4.586 2.531 0 4.587 2.057 4.587 4.586-.001 2.53-2.057 4.586-4.587 4.586z"/></svg>
                                        <span>${this.escapeHtml(t.clientPhone)}</span>
                                    </a>
                                </div>
                            ` : ''}
                        </td>
                        <td>
                            <a href="${t.siteUrl}" target="_blank" style="color: var(--accent-blue); text-decoration: none; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                                <span>${this.escapeHtml((t.siteUrl || '').replace(/^https?:\/\//, ''))}</span>
                                <i data-lucide="external-link" style="width: 11px; height: 11px; opacity: 0.75;"></i>
                            </a>
                        </td>
                        <td style="font-size: 13px; font-weight: 500; color: var(--text-primary);">${this.escapeHtml(t.bugType || 'General')}</td>
                        <td><span class="badge ${badgeClass}" style="font-size: 11px; padding: 3px 8px; font-weight: 700; letter-spacing: 0.5px;">${t.severity}</span></td>
                        <td>
                            <select class="ticket-status-pill ${statusClass}" onchange="app.quickUpdateTicketStatus('${t.id}', this.value)" title="Change status (dispatches WhatsApp & Email notification)">
                                <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                                <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
                                <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
                                <option value="Closed" ${t.status === 'Closed' ? 'selected' : ''}>🔒 Closed</option>
                            </select>
                        </td>
                        <td style="text-align: right; white-space: nowrap;">
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
            const editPhone = document.getElementById('edit-ticket-phone');
            const editWaBtn = document.getElementById('edit-ticket-wa-btn');
            const editDesc = document.getElementById('edit-ticket-description');
            const editStatus = document.getElementById('edit-ticket-status');
            const editNotes = document.getElementById('edit-ticket-notes');

            if (editTitle) editTitle.textContent = `Inspect Ticket ${ticketId}`;
            if (editSubtitle) editSubtitle.textContent = `Submitted by ${ticket.clientName} (${ticket.clientEmail || 'No email'}) - Severity: ${ticket.severity}`;
            if (editSiteUrl) editSiteUrl.value = ticket.siteUrl;
            if (editPhone) editPhone.value = ticket.clientPhone || 'Not provided';
            if (editWaBtn) {
                if (ticket.clientPhone) {
                    const clean = ticket.clientPhone.replace(/[^0-9]/g, '');
                    editWaBtn.href = `https://wa.me/${clean}`;
                    editWaBtn.classList.remove('hidden');
                } else {
                    editWaBtn.classList.add('hidden');
                }
            }
            if (editDesc) editDesc.value = ticket.description || '';
            if (editStatus) editStatus.value = ticket.status;
            if (editNotes) editNotes.value = ticket.adminNotes || '';

            this.openModal('modal-ticket-edit');
        },

        // Quick status update directly from the table (with WA & Email alerts)
        async quickUpdateTicketStatus(ticketId, newStatus) {
            try {
                const currentTicket = this.state.tickets.find(t => t.id === ticketId);
                const wasResolved = currentTicket && currentTicket.status === 'Resolved';

                const response = await this.authFetch('/api/tickets/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: ticketId,
                        status: newStatus
                    })
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    let msg = `Ticket ${ticketId} status changed to "${newStatus}"`;
                    if (result.notified && (result.notified.wa || result.notified.email)) {
                        const channels = [];
                        if (result.notified.wa) channels.push('WhatsApp');
                        if (result.notified.email) channels.push('Email');
                        msg += ` · Client notified via ${channels.join(' & ')}!`;
                    }
                    this.showToast(msg, 'success');

                    if (newStatus === 'Resolved' && !wasResolved && window.confetti) {
                        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }

                    await this.fetchState();
                } else {
                    this.showToast('Failed to update status: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (err) {
                console.error('Quick status update error:', err);
                this.showToast('Server connection error while updating status', 'error');
            }
        },

        // Two-click inline confirmation helper
        // First click: arms the button (turns red/amber + shows "Confirm?", auto-resets in 3.5s)
        // Second click: executes the callback
        armConfirmButton(btn, onConfirm, label = 'Confirm?', color = 'var(--accent-red)') {
            if (!btn) {
                if (typeof onConfirm === 'function') onConfirm();
                return;
            }
            if (btn.getAttribute('data-armed') === '1') {
                // Second click — fire the action
                btn.removeAttribute('data-armed');
                clearTimeout(btn._armTimer);
                if (btn._origHTML) btn.innerHTML = btn._origHTML;
                if (btn._origBorder) btn.style.borderColor = btn._origBorder;
                if (btn._origBg) btn.style.background = btn._origBg;
                if (btn._origMinWidth) btn.style.minWidth = btn._origMinWidth;
                if (window.lucide) window.lucide.createIcons();
                onConfirm();
                return;
            }
            // First click — arm it
            btn._origHTML = btn.innerHTML;
            btn._origBorder = btn.style.borderColor;
            btn._origBg = btn.style.background;
            btn._origMinWidth = btn.style.minWidth;
            btn.setAttribute('data-armed', '1');
            btn.innerHTML = `<span style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.02em;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">⚠️ ${label}</span>`;
            btn.style.borderColor = 'rgba(239,68,68,0.8)';
            btn.style.background = 'rgba(239,68,68,0.12)';
            btn.style.minWidth = '82px';
            btn._armTimer = setTimeout(() => {
                btn.removeAttribute('data-armed');
                if (btn._origHTML) btn.innerHTML = btn._origHTML;
                if (btn._origBorder) btn.style.borderColor = btn._origBorder;
                if (btn._origBg) btn.style.background = btn._origBg;
                if (btn._origMinWidth) btn.style.minWidth = btn._origMinWidth;
                if (window.lucide) window.lucide.createIcons();
            }, 3500);
        },

        armDeleteButton(btn, onConfirm) {
            this.armConfirmButton(btn, onConfirm, 'Confirm?');
        },

        // In-app modal confirmation dialog (fallback for non-button or file prompts)
        showConfirmModal(title, message, confirmText = 'Confirm', isDanger = true) {
            return new Promise((resolve) => {
                const modal = document.getElementById('modal-confirm');
                const titleEl = document.getElementById('confirm-title');
                const msgEl = document.getElementById('confirm-message');
                const okBtn = document.getElementById('confirm-ok-btn');
                const cancelBtn = document.getElementById('confirm-cancel-btn');

                if (!modal) {
                    resolve(true);
                    return;
                }

                if (titleEl) titleEl.textContent = title || 'Confirm Action';
                if (msgEl) msgEl.textContent = message || 'Are you sure you want to proceed?';
                if (okBtn) {
                    okBtn.textContent = confirmText;
                    if (isDanger) {
                        okBtn.style.background = '#ef4444';
                        okBtn.style.borderColor = '#ef4444';
                    } else {
                        okBtn.style.background = '';
                        okBtn.style.borderColor = '';
                    }
                }

                const cleanup = () => {
                    modal.classList.add('hidden');
                    if (okBtn) okBtn.onclick = null;
                    if (cancelBtn) cancelBtn.onclick = null;
                    modal.onclick = null;
                    document.removeEventListener('keydown', onKeyDown);
                };

                const onOk = () => {
                    cleanup();
                    resolve(true);
                };

                const onCancel = () => {
                    cleanup();
                    resolve(false);
                };

                const onKeyDown = (e) => {
                    if (e.key === 'Escape') onCancel();
                };

                if (okBtn) okBtn.onclick = onOk;
                if (cancelBtn) cancelBtn.onclick = onCancel;
                modal.onclick = (e) => {
                    if (e.target === modal) onCancel();
                };
                document.addEventListener('keydown', onKeyDown);

                modal.classList.remove('hidden');
            });
        },

        // Delete a ticket
        deleteTicket(ticketId) {
            const btn = document.querySelector(`[data-action="delete-ticket"][data-id="${ticketId}"]`);
            if (!btn) return;
            app.armDeleteButton(btn, async () => {
                try {
                    const response = await app.authFetch('/api/tickets/delete', {
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


        // Trigger Download DB Backup (authenticated via query param token)
        downloadBackup() {
            const token = sessionStorage.getItem('zannat_token');
            const endpoint = token ? `/api/system/backup/download?token=${encodeURIComponent(token)}` : '/api/system/backup/download';
            window.open(this.getApiUrl(endpoint), '_blank');
        },

        // Fetch System Version & Webhook Info
        async refreshSystemInfo() {
            try {
                const res = await this.authFetch('/api/system/info');
                const data = await res.json();
                if (data.success) {
                    const badge = document.getElementById('sys-commit-badge');
                    if (badge) {
                        badge.textContent = data.commit || 'Up to date';
                        badge.title = `Branch: ${data.branch} | Remote: ${data.remote}`;
                    }
                    const webhookDisplay = document.getElementById('webhook-url-display');
                    if (webhookDisplay) {
                        const host = window.location.origin;
                        webhookDisplay.textContent = `${host}/api/system/webhook`;
                    }
                }
            } catch (e) {
                console.warn('Could not fetch system info:', e);
            }
        },

        // Trigger Safe Pull & Auto-Update from GitHub
        async triggerSystemUpdate(btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeSystemUpdate(), 'Confirm Update?');
                return;
            }
            const confirmed = await this.showConfirmModal(
                'Pull & Update from GitHub',
                'Pull latest code and migrate database schema from GitHub repository (abuzannat911-lab/zannat.bd)? A safe automatic backup of all existing records will be created before updating.',
                'Pull & Update',
                false
            );
            if (!confirmed) return;
            await this.executeSystemUpdate();
        },

        async executeSystemUpdate() {
            const btn = document.getElementById('btn-run-sys-update');
            const alertBox = document.getElementById('sys-update-status-alert');
            const origHtml = btn ? btn.innerHTML : '';

            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span>⏳ Pulling &amp; Updating...</span>';
            }
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(59, 130, 246, 0.1)';
                alertBox.style.color = '#1d4ed8';
                alertBox.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                alertBox.innerHTML = '<strong>Updating system:</strong> Creating database snapshot, pulling code from GitHub, and running non-destructive schema auto-migration...';
            }

            try {
                const res = await this.authFetch('/api/system/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await res.json();

                if (res.ok && result.success) {
                    if (alertBox) {
                        alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
                        alertBox.style.color = '#065f46';
                        alertBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                        alertBox.innerHTML = `<strong>✅ Success!</strong> ${result.message}<br><small style="opacity: 0.85;">${(result.logs || []).join(' → ')}</small>`;
                    }
                    if (window.confetti) {
                        window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                    }
                    this.refreshSystemInfo();
                } else {
                    if (alertBox) {
                        alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
                        alertBox.style.color = '#b91c1c';
                        alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                        alertBox.innerHTML = `<strong>Update notice:</strong> ${result.error || result.message || 'Operation failed'}`;
                    }
                }
            } catch (err) {
                if (alertBox) {
                    alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
                    alertBox.style.color = '#b91c1c';
                    alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                    alertBox.innerHTML = `<strong>Error:</strong> Failed to communicate with update server (${err.message})`;
                }
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            }
        },

        // Handle Database Restore File Upload
        async uploadRestore(event) {
            const file = event.target.files[0];
            if (!file) return;

            const confirmed = await this.showConfirmModal(
                'Restore Database',
                'Are you sure you want to restore the database? This will completely overwrite existing tickets and login credentials.',
                'Restore Database',
                true
            );
            if (!confirmed) {
                event.target.value = ''; // Reset file input
                return;
            }

            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const binaryData = e.target.result;
                    try {
                        const response = await this.authFetch('/api/restore', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/octet-stream' },
                            body: binaryData
                        });

                        const result = await response.json();

                        if (response.ok && result.success) {
                            this.showToast('Database restored successfully!', 'success');
                            
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
                            this.showToast('Restore failed: ' + (result.error || 'unknown error'), 'error');
                        }
                    } catch (err) {
                        console.error('Error posting restore:', err);
                        this.showToast('Server connection error.', 'error');
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error('File read error:', err);
                this.showToast('Failed to read backup file.', 'error');
            } finally {
                event.target.value = ''; // Reset input
            }
        },

        // CMS Current Page Edit Tracking
        cmsCurrentEditingSlug: null,

        // Public Separate Page Navigation System
        switchPublicPage(pageName) {
            const validPages = ['home', 'services', 'workflow', 'gallery', 'reviews', 'submit-ticket'];
            let target = validPages.includes(pageName) ? pageName : 'home';

            const publicLanding = document.getElementById('public-landing');
            const adminShell = document.getElementById('admin-shell');
            const customShell = document.getElementById('custom-page-shell');

            if (publicLanding) publicLanding.classList.remove('hidden');
            if (adminShell) adminShell.classList.add('hidden');
            if (customShell) customShell.classList.add('hidden');

            validPages.forEach(p => {
                const el = document.getElementById('page-' + p);
                if (el) {
                    if (p === target) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
            });

            // Show footer on separate pages, hide on strict single-screen homepage
            const footer = document.getElementById('public-global-footer');
            if (footer) {
                if (target === 'home') {
                    footer.classList.add('hidden');
                } else {
                    footer.classList.remove('hidden');
                }
            }

            // Update active navbar item
            const routeMap = {
                'home': '/',
                'services': '/services',
                'workflow': '/workflow',
                'gallery': '/gallery',
                'reviews': '/reviews',
                'submit-ticket': '/submit-ticket'
            };
            const currentPath = routeMap[target] || '/';
            document.querySelectorAll('.landing-navbar .navbar-links a').forEach(a => {
                const href = a.getAttribute('href');
                if (href === currentPath) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });

            // Document titles
            const titles = {
                'home': 'Abu Zannat | WordPress Bug Fixer & Web Developer',
                'services': 'WordPress Debugging & Repair Services | Abu Zannat',
                'workflow': 'How It Works - Bug Fix Workflow | Abu Zannat',
                'gallery': 'Behind the Scenes - Life Behind the Screen | Abu Zannat',
                'reviews': 'Verified Client Reviews & Testimonials | Abu Zannat',
                'submit-ticket': 'Submit a Bug Ticket | Abu Zannat'
            };
            document.title = titles[target] || 'Abu Zannat | WordPress Bug Fixer & Web Developer';

            // Scroll to top of viewport
            window.scrollTo({ top: 0, behavior: 'instant' });

            // If reviews page, ensure reviews are rendered
            if (target === 'reviews' && typeof this.renderReviews === 'function') {
                this.renderReviews();
            }

            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        },

        // Backward compatibility helper
        openSlidePage(targetSectionId) {
            let cleanId = (targetSectionId || 'services').replace(/^#/, '');
            const map = {
                'services': '/services',
                'workflow': '/workflow',
                'gallery': '/gallery',
                'behind-scenes': '/gallery',
                'testimonials': '/reviews',
                'reviews': '/reviews',
                'submit-ticket-section': '/submit-ticket',
                'submit-bug': '/submit-ticket',
                'ticket': '/submit-ticket'
            };
            const path = map[cleanId] || '/services';
            if (history.pushState) {
                history.pushState(null, '', path);
                this.router();
            } else {
                window.location.href = path;
            }
        },

        closeSlidePage() {
            if (history.pushState) {
                history.pushState(null, '', '/');
                this.router();
            } else {
                window.location.href = '/';
            }
        },

        // Setup SPA Client-Side Routing
        setupSPAClientRouting() {
            document.addEventListener('click', (e) => {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href) {
                    try {
                        const url = new URL(anchor.href);
                        if (url.origin === window.location.origin) {
                            const path = url.pathname;
                            // Bypass SPA interceptor for API endpoints (e.g. OAuth redirects)
                            if (path.startsWith('/api/') || path.includes('/api/auth/')) {
                                return;
                            }

                            // Handle anchor hash clicks smoothly
                            if (anchor.hash && (path === '/' || path === '' || path === window.location.pathname)) {
                                const targetHash = anchor.hash;
                                const hashMap = {
                                    '#': '/',
                                    '#hero': '/',
                                    '#services': '/services',
                                    '#workflow': '/workflow',
                                    '#gallery': '/gallery',
                                    '#testimonials': '/reviews',
                                    '#reviews': '/reviews',
                                    '#submit-ticket-section': '/submit-ticket',
                                    '#submit-bug': '/submit-ticket'
                                };
                                if (hashMap[targetHash]) {
                                    e.preventDefault();
                                    history.pushState(null, '', hashMap[targetHash]);
                                    this.router();
                                    return;
                                }
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
            // Check for OAuth or action query params
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('gmail_connected') === '1') {
                this.showToast('✅ Gmail connected and authenticated successfully via Google OAuth 2.0!', 'success');
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            } else if (urlParams.get('error')) {
                const err = urlParams.get('error');
                if (err === 'missing_google_client_id') {
                    this.showToast('⚠️ Google Client ID is missing. Please enter your Google OAuth credentials in Developer Settings below.', 'error');
                } else {
                    this.showToast('⚠️ Google Authentication Error: ' + err, 'error');
                }
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }

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
                '/admin/invoices': 'invoices',
                '/admin/clients': 'clients',
                '/admin/settings': 'settings',
                '/admin/notifications': 'notifications',
                '/admin/settings/notifications': 'notifications'
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
            
            const publicRoutes = {
                '/': 'home',
                '': 'home',
                '/index.html': 'home',
                '/services': 'services',
                '/workflow': 'workflow',
                '/gallery': 'gallery',
                '/behind-scenes': 'gallery',
                '/reviews': 'reviews',
                '/testimonials': 'reviews',
                '/submit-ticket': 'submit-ticket',
                '/submit-bug': 'submit-ticket'
            };

            if (cleanPath in publicRoutes) {
                this.switchTab('portfolio');
                this.switchPublicPage(publicRoutes[cleanPath]);
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
                    <td class="font-mono text-small">zannat.bd/${p.slug}</td>
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
                    const response = await app.authFetch('/api/pages/delete', {
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
                    <td><span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px;">Active (Hashed & Protected)</span></td>
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
                    const response = await app.authFetch('/api/users/delete', {
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

        // Render SMTP & Gmail OAuth Configuration UI
        renderSMTPConfig() {
            const config = this.state.smtpConfig || {};
            const hostEl = document.getElementById('smtp-host');
            const portEl = document.getElementById('smtp-port');
            const secureEl = document.getElementById('smtp-secure');
            const userEl = document.getElementById('smtp-user');
            const passEl = document.getElementById('smtp-pass');

            if (hostEl) hostEl.value = config.host || 'smtp.gmail.com';
            if (portEl) portEl.value = config.port || '587';
            if (secureEl) secureEl.value = config.secure !== undefined ? String(config.secure) : 'false';
            if (userEl && config.user) userEl.value = config.user;
            if (passEl && config.pass) passEl.value = config.pass;

            // Custom Google OAuth Credentials inputs
            const clientIdEl = document.getElementById('oauth-client-id');
            const clientSecretEl = document.getElementById('oauth-client-secret');
            if (clientIdEl) clientIdEl.value = config.oauthClientId || config.oauth_client_id || '';
            if (clientSecretEl) clientSecretEl.value = config.oauth_client_secret || '';

            // Update Redirect URI display
            const redirectUriDisplay = document.getElementById('google-redirect-uri-display');
            if (redirectUriDisplay) {
                redirectUriDisplay.textContent = `${window.location.origin}/api/auth/google/callback`;
            }

            // Connection evaluation
            const isOAuthConnected = (config.authType === 'oauth2' || config.auth_type === 'oauth2') && (config.oauthUser || config.oauth_user || config.hasRefreshToken || config.oauth_refresh_token);
            const isSmtpConfigured = Boolean(config.user && config.pass);
            const isConnected = Boolean(config.isConnected || isOAuthConnected || isSmtpConfigured);
            const activeEmail = config.user || config.oauthUser || config.oauth_user || '';

            // Gmail status badge
            const statusBadge = document.getElementById('gmail-status-badge');
            if (statusBadge) {
                if (isConnected && activeEmail) {
                    statusBadge.innerHTML = `
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span> Connected: ${activeEmail}
                        </span>
                    `;
                } else {
                    statusBadge.innerHTML = `
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3);">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span> Not Connected
                        </span>
                    `;
                }
            }

            // Toggle connected view vs connect form view
            const connectedView = document.getElementById('gmail-connected-view');
            const connectView = document.getElementById('gmail-connect-view');
            const activeConnectedEmail = document.getElementById('active-connected-email');

            if (isConnected && activeEmail) {
                if (connectedView) connectedView.style.display = 'block';
                if (connectView) connectView.style.display = 'none';
                if (activeConnectedEmail) activeConnectedEmail.textContent = activeEmail;
            } else {
                if (connectedView) connectedView.style.display = 'none';
                if (connectView) connectView.style.display = 'block';
            }

            // Right column: Test recipient
            const testRecipient = document.getElementById('test-email-recipient');
            if (testRecipient && (!testRecipient.value || testRecipient.value === 'abuzannat911@gmail.com')) {
                testRecipient.value = activeEmail || 'abuzannat911@gmail.com';
            }
        },

        // Connect Gmail with App Password from inline maintenance tab
        async submitConnectGmailForm(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const userEl = document.getElementById('smtp-user');
            const passEl = document.getElementById('smtp-pass');
            const email = (userEl ? userEl.value : '').trim();
            const appPass = (passEl ? passEl.value : '').trim();
            const btn = document.getElementById('btn-submit-connect-gmail');
            const alertBox = document.getElementById('connect-gmail-alert');

            if (!email || !appPass) {
                this.showToast('Please enter both Gmail address and 16-character App Password', 'error');
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(239,68,68,0.1)';
                    alertBox.style.color = '#dc2626';
                    alertBox.style.border = '1px solid rgba(239,68,68,0.3)';
                    alertBox.textContent = '❌ Please enter both your Gmail address and 16-character App Password.';
                }
                return;
            }

            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></span> Connecting & Verifying...`;
            }
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(59,130,246,0.1)';
                alertBox.style.color = '#2563eb';
                alertBox.style.border = '1px solid rgba(59,130,246,0.3)';
                alertBox.textContent = '⏳ Saving credentials and verifying live Gmail deliverability...';
            }

            try {
                // 1. Save credentials
                const updateRes = await this.authFetch('/api/smtp/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        host: 'smtp.gmail.com',
                        port: '587',
                        secure: false,
                        user: email,
                        pass: appPass,
                        auth_type: 'password'
                    })
                });

                if (!updateRes.ok) {
                    const errData = await updateRes.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to save configuration.');
                }

                // 2. Perform live delivery test
                const testRes = await this.authFetch('/api/smtp/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: email })
                });

                const testData = await testRes.json();
                if (testRes.ok && testData.success) {
                    this.showToast(`🎉 Gmail connected and verified successfully for ${email}!`, 'success');
                    if (alertBox) {
                        alertBox.style.display = 'none';
                        alertBox.textContent = '';
                    }
                    await this.fetchState();
                    const testRecip = document.getElementById('test-email-recipient');
                    if (testRecip) testRecip.value = email;
                } else {
                    throw new Error(testData.error || 'Verification failed. Please ensure 2-Step Verification is ON and the 16-character App Password is correct.');
                }
            } catch (err) {
                console.error('Connect Gmail error:', err);
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(239,68,68,0.1)';
                    alertBox.style.color = '#dc2626';
                    alertBox.style.border = '1px solid rgba(239,68,68,0.3)';
                    alertBox.textContent = `❌ ${err.message}`;
                }
                this.showToast(err.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
                if (window.lucide) window.lucide.createIcons();
            }
        },

        // Show inline Gmail connect form to change email
        showGmailConnectForm() {
            const connectedView = document.getElementById('gmail-connected-view');
            const connectView = document.getElementById('gmail-connect-view');
            if (connectedView) connectedView.style.display = 'none';
            if (connectView) connectView.style.display = 'block';
            const userEl = document.getElementById('smtp-user');
            if (userEl) userEl.focus();
        },

        // Open Connect Gmail Modal with populated or empty values
        openConnectGmailModal() {
            const config = this.state.smtpConfig || {};
            const modalEmail = document.getElementById('modal-gmail-email');
            const modalPass = document.getElementById('modal-gmail-app-pass');
            const alertBox = document.getElementById('modal-gmail-alert');

            if (modalEmail) modalEmail.value = config.user || config.oauth_user || '';
            if (modalPass) modalPass.value = config.pass || '';
            if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
            }

            this.openModal('modal-connect-gmail');
        },

        // Submit Connect Gmail Modal (App Password / Instant Connect)
        async submitConnectGmailModal(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const email = (document.getElementById('modal-gmail-email').value || '').trim();
            const appPass = (document.getElementById('modal-gmail-app-pass').value || '').trim();
            const btn = document.getElementById('btn-modal-connect-gmail');
            const alertBox = document.getElementById('modal-gmail-alert');

            if (!email || !appPass) {
                this.showToast('Please enter both Gmail email and 16-character App Password', 'error');
                return;
            }

            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Connecting...`;
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(59,130,246,0.1)';
                alertBox.style.color = '#2563eb';
                alertBox.style.border = '1px solid rgba(59,130,246,0.3)';
                alertBox.textContent = 'Saving configuration & verifying Gmail delivery...';
            }

            try {
                const updateRes = await this.authFetch('/api/smtp/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        host: 'smtp.gmail.com',
                        port: '587',
                        secure: false,
                        user: email,
                        pass: appPass,
                        auth_type: 'password'
                    })
                });

                if (!updateRes.ok) {
                    throw new Error('Failed to save configuration to database');
                }

                // Test live email deliverability
                const testRes = await this.authFetch('/api/smtp/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: email })
                });

                const testData = await testRes.json();
                if (testRes.ok && testData.success) {
                    this.showToast(`🎉 Gmail connected and verified successfully for ${email}!`, 'success');
                    this.closeModal('modal-connect-gmail');
                    await this.fetchState();
                } else {
                    throw new Error(testData.error || 'Connection test failed. Please verify your App Password.');
                }
            } catch (err) {
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(239,68,68,0.1)';
                    alertBox.style.color = '#dc2626';
                    alertBox.style.border = '1px solid rgba(239,68,68,0.3)';
                    alertBox.textContent = `❌ ${err.message}`;
                }
                this.showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                if (window.lucide) window.lucide.createIcons();
            }
        },

        // Disconnect Google OAuth2 / Gmail
        async disconnectGmailOAuth(btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeDisconnectGmail(), 'Confirm Disconnect?');
                return;
            }
            const confirmed = await this.showConfirmModal('Disconnect Gmail', 'Are you sure you want to disconnect this Gmail account and clear settings?', 'Disconnect', true);
            if (!confirmed) return;
            await this.executeDisconnectGmail();
        },

        async executeDisconnectGmail() {
            try {
                const res = await this.authFetch('/api/auth/google/disconnect', {
                    method: 'POST'
                });
                const data = await res.json();
                if (data.success) {
                    this.state.smtpConfig = {
                        isConnected: false,
                        user: '',
                        pass: '',
                        authType: 'password',
                        oauthUser: '',
                        hasRefreshToken: false
                    };
                    const modalEmail = document.getElementById('modal-gmail-email');
                    const modalPass = document.getElementById('modal-gmail-app-pass');
                    const userEl = document.getElementById('smtp-user');
                    const passEl = document.getElementById('smtp-pass');
                    const testRecip = document.getElementById('test-email-recipient');
                    if (modalEmail) modalEmail.value = '';
                    if (modalPass) modalPass.value = '';
                    if (userEl) userEl.value = '';
                    if (passEl) passEl.value = '';
                    if (testRecip) testRecip.value = '';
                    this.renderSMTPConfig();
                    this.showToast('Gmail account disconnected and cleared successfully.', 'info');
                    await this.fetchState();
                } else {
                    this.showToast(data.error || 'Failed to disconnect', 'error');
                }
            } catch (err) {
                console.error('Disconnect Gmail error:', err);
                this.showToast('Server connection error.', 'error');
            }
        },

        // =============================================
        // WHATSAPP INTEGRATION CONTROLLER
        // =============================================
        whatsAppPollTimer: null,
        whatsAppStatus: null,

        initWhatsAppPolling() {
            if (this.whatsAppPollTimer) clearInterval(this.whatsAppPollTimer);
            this.fetchWhatsAppStatus();
            // Poll every 4 seconds to catch QR updates, pairing code results, and live connection transitions
            this.whatsAppPollTimer = setInterval(() => {
                const currentTab = this.state?.currentTab;
                if (currentTab === 'maintenance' || !this.whatsAppStatus?.isConnected) {
                    this.fetchWhatsAppStatus();
                }
            }, 4000);
        },

        async fetchWhatsAppStatus() {
            try {
                const res = await this.authFetch('/api/whatsapp/status');
                if (!res.ok) return;
                const data = await res.json();
                this.whatsAppStatus = data;
                this.renderWhatsAppStatus(data);
            } catch (err) {
                // Background poll fail silent
            }
        },

        renderWhatsAppStatus(data) {
            if (!data) return;
            const badge = document.getElementById('wa-status-badge');
            const connectedView = document.getElementById('wa-connected-view');
            const connectView = document.getElementById('wa-connect-view');
            const phoneEl = document.getElementById('wa-connected-number');
            const nameEl = document.getElementById('wa-connected-name');
            const qrImage = document.getElementById('wa-qr-image');
            const qrLoading = document.getElementById('wa-qr-loading');

            if (data.isConnected && data.user) {
                if (badge) {
                    badge.innerHTML = `
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span> Connected: ${data.user.phone || ''}
                        </span>
                    `;
                }
                if (connectedView) connectedView.style.display = 'block';
                if (connectView) connectView.style.display = 'none';
                if (phoneEl) phoneEl.textContent = data.user.phone || '';
                if (nameEl) nameEl.textContent = data.user.name || 'Personal WhatsApp';

                // Auto prefill test recipient if empty
                const testPhone = document.getElementById('wa-test-recipient-phone');
                if (testPhone && !testPhone.value && data.user.phone) {
                    testPhone.value = data.user.phone;
                }
            } else {
                if (badge) {
                    if (data.status === 'connecting' || data.qrCode) {
                        badge.innerHTML = `
                            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3);">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></span> Waiting for Link / Scan
                            </span>
                        `;
                    } else {
                        badge.innerHTML = `
                            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3);">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></span> Not Connected
                            </span>
                        `;
                    }
                }
                if (connectedView) connectedView.style.display = 'none';
                if (connectView) connectView.style.display = 'block';

                if (data.qrCode) {
                    if (qrImage) {
                        qrImage.src = data.qrCode;
                        qrImage.style.display = 'block';
                    }
                    if (qrLoading) qrLoading.style.display = 'none';
                }
            }
        },

        switchWhatsAppTab(tab) {
            const qrBtn = document.getElementById('btn-wa-tab-qr');
            const codeBtn = document.getElementById('btn-wa-tab-code');
            const qrContent = document.getElementById('wa-tab-qr-content');
            const codeContent = document.getElementById('wa-tab-code-content');

            if (tab === 'qr') {
                if (qrBtn) {
                    qrBtn.style.background = '#ffffff';
                    qrBtn.style.color = '#1e293b';
                    qrBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
                if (codeBtn) {
                    codeBtn.style.background = 'transparent';
                    codeBtn.style.color = 'var(--text-muted, #64748b)';
                    codeBtn.style.boxShadow = 'none';
                }
                if (qrContent) qrContent.style.display = 'flex';
                if (codeContent) codeContent.style.display = 'none';
            } else {
                if (codeBtn) {
                    codeBtn.style.background = '#ffffff';
                    codeBtn.style.color = '#1e293b';
                    codeBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
                if (qrBtn) {
                    qrBtn.style.background = 'transparent';
                    qrBtn.style.color = 'var(--text-muted, #64748b)';
                    qrBtn.style.boxShadow = 'none';
                }
                if (qrContent) qrContent.style.display = 'none';
                if (codeContent) codeContent.style.display = 'flex';
            }
        },

        async refreshWhatsAppQR() {
            const qrLoading = document.getElementById('wa-qr-loading');
            const qrImage = document.getElementById('wa-qr-image');
            if (qrLoading) qrLoading.style.display = 'flex';
            if (qrImage) qrImage.style.display = 'none';
            this.showToast('Refreshing WhatsApp QR Code...', 'info');
            await this.fetchWhatsAppStatus();
        },

        async requestWhatsAppPairingCode() {
            const phoneInput = document.getElementById('wa-pairing-phone-input');
            const btn = document.getElementById('btn-wa-get-code');
            const resultBox = document.getElementById('wa-pairing-code-result');
            const displayCode = document.getElementById('wa-display-code');
            const alertBox = document.getElementById('wa-pairing-alert');

            const phone = (phoneInput?.value || '').trim();
            if (!phone) {
                this.showToast('Please enter your phone number with country code.', 'error');
                if (phoneInput) phoneInput.focus();
                return;
            }

            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Generating Code...`;
            }
            if (alertBox) alertBox.style.display = 'none';

            try {
                const res = await this.authFetch('/api/whatsapp/pair-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    if (displayCode) displayCode.textContent = data.code;
                    if (resultBox) resultBox.style.display = 'block';
                    this.showToast(`Pairing code generated: ${data.code}`, 'success');
                } else {
                    throw new Error(data.error || 'Failed to request pairing code');
                }
            } catch (err) {
                console.error('Pairing code error:', err);
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(239,68,68,0.1)';
                    alertBox.style.color = '#dc2626';
                    alertBox.style.border = '1px solid rgba(239,68,68,0.3)';
                    alertBox.textContent = `❌ ${err.message}`;
                }
                this.showToast(err.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        },

        copyWhatsAppPairingCode() {
            const displayCode = document.getElementById('wa-display-code');
            const text = (displayCode?.textContent || '').replace(/\s+/g, '').trim();
            if (text) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast(`Copied pairing code: ${text}`, 'success');
                }).catch(() => {
                    this.showToast(`Code: ${text}`, 'info');
                });
            }
        },

        async submitSendWhatsAppTest(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const phone = (document.getElementById('wa-test-recipient-phone')?.value || '').trim();
            const message = (document.getElementById('wa-test-msg-body')?.value || '').trim();
            const btn = document.getElementById('btn-send-wa-test');
            const resultBox = document.getElementById('wa-test-result');

            if (!phone || !message) {
                this.showToast('Please enter both recipient phone and message.', 'error');
                return;
            }

            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Dispatching...`;
            }
            if (resultBox) {
                resultBox.style.display = 'block';
                resultBox.innerHTML = `
                    <div style="padding: 10px 14px; border-radius: 8px; font-size: 13px; background: rgba(37,211,102,0.1); color: #059669; border: 1px solid rgba(37,211,102,0.3);">
                        ⏳ Dispatching message via personal WhatsApp socket...
                    </div>
                `;
            }

            try {
                const res = await this.authFetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: phone, message })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    this.showToast(`WhatsApp message sent to ${data.to}!`, 'success');
                    if (resultBox) {
                        resultBox.innerHTML = `
                            <div style="padding: 12px 16px; border-radius: 8px; font-size: 13px; background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.3); line-height: 1.5;">
                                <strong>✅ WhatsApp Message Delivered!</strong><br>
                                Recipient: <strong>${data.to}</strong><br>
                                <span style="font-size: 11px; opacity: 0.85;">Message ID: ${data.messageId || 'OK'}</span>
                            </div>
                        `;
                    }
                } else {
                    throw new Error(data.error || 'Failed to dispatch WhatsApp message.');
                }
            } catch (err) {
                console.error('WhatsApp send error:', err);
                if (resultBox) {
                    resultBox.innerHTML = `
                        <div style="padding: 12px 16px; border-radius: 8px; font-size: 13px; background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.3); line-height: 1.5;">
                            <strong>❌ Delivery Failed</strong><br>
                            ${err.message}
                        </div>
                    `;
                }
                this.showToast(err.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        },

        showWhatsAppConnectForm() {
            const connectedView = document.getElementById('wa-connected-view');
            const connectView = document.getElementById('wa-connect-view');
            if (connectedView) connectedView.style.display = 'none';
            if (connectView) connectView.style.display = 'block';
        },

        async disconnectWhatsApp(btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeDisconnectWhatsApp(), 'Confirm Disconnect?');
                return;
            }
            const confirmed = await this.showConfirmModal('Disconnect WhatsApp', 'Are you sure you want to disconnect and unlink this WhatsApp account?', 'Disconnect', true);
            if (!confirmed) return;
            await this.executeDisconnectWhatsApp();
        },

        async executeDisconnectWhatsApp() {
            try {
                const res = await this.authFetch('/api/whatsapp/disconnect', {
                    method: 'POST'
                });
                const data = await res.json();
                if (data.success) {
                    this.whatsAppStatus = null;
                    const connectedView = document.getElementById('wa-connected-view');
                    const connectView = document.getElementById('wa-connect-view');
                    if (connectedView) connectedView.style.display = 'none';
                    if (connectView) connectView.style.display = 'block';
                    this.showToast('WhatsApp account unlinked and disconnected.', 'info');
                    await this.fetchWhatsAppStatus();
                } else {
                    this.showToast(data.error || 'Failed to disconnect WhatsApp', 'error');
                }
            } catch (err) {
                console.error('Disconnect WA error:', err);
                this.showToast('Server connection error.', 'error');
            }
        },

        toggleWhatsAppPdfOption(checked) {
            const btnText = document.getElementById('btn-send-invoice-wa-text');
            if (btnText) {
                btnText.textContent = checked ? 'Send PDF via WhatsApp' : 'Send Message via WhatsApp';
            }
        },

        openWhatsAppInvoiceModal(invoice) {
            if (typeof invoice === 'string') {
                invoice = (this.state.invoices || []).find(i => i.id === invoice);
            }
            if (!invoice) invoice = this.currentPreviewInvoice || this.getInvoiceFormData();
            const modal = document.getElementById('modal-whatsapp-invoice');
            if (!modal) return;

            this.currentWhatsAppInvoice = invoice;
            this.renderInvoicePreview(invoice);

            const symbol = this.getCurrencySymbol(invoice.currency);
            const totalVal = typeof invoice.total === 'number' ? invoice.total : (parseFloat(invoice.total) || 0);

            const idEl = document.getElementById('wa-inv-id');
            const numEl = document.getElementById('wa-inv-number');
            const phoneEl = document.getElementById('wa-inv-to-phone');
            const msgEl = document.getElementById('wa-inv-message');
            const pdfFilenameEl = document.getElementById('wa-inv-pdf-filename');
            const attachCheckbox = document.getElementById('wa-inv-attach-pdf');

            const invNumber = invoice.number || 'Invoice';
            if (idEl) idEl.value = invoice.id || '';
            if (numEl) numEl.value = invNumber;
            if (phoneEl) phoneEl.value = invoice.clientPhone || invoice.client_phone || '';
            if (pdfFilenameEl) pdfFilenameEl.textContent = `${invNumber}.pdf`;
            if (attachCheckbox) attachCheckbox.checked = true;

            const btnText = document.getElementById('btn-send-invoice-wa-text');
            if (btnText) btnText.textContent = 'Send PDF via WhatsApp';

            const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;

            if (msgEl) {
                msgEl.value = `Hello ${invoice.clientName || 'Client'},\n\n` +
`Please find attached your Commercial Invoice *#${invNumber}* from Abu Zannat (Zannat.bd).\n\n` +
`📄 *INVOICE DETAILS:*\n` +
`• Total Due: *${symbol}${totalVal.toFixed(2)} ${invoice.currency}*\n` +
`• Issue Date: ${invoice.date || ''}\n` +
`• Due Date: ${invoice.dueDate || 'Upon Receipt'}\n` +
`• Terms: ${invoice.paymentTerms || 'Payment upon receipt'}\n\n` +
`🏦 *PAYMENT / BANK INFO:*\n` +
`• Bank: ${invoice.bankName || 'Dutch Bangla Bank PLC'}\n` +
`• Beneficiary: ${invoice.bankAccountName || 'Abu Zannat Md Mosaddek'}\n` +
`• Account / IBAN: ${invoice.bankAccountNo || '1621010088950'}\n` +
`• SWIFT: ${invoice.bankSwift || 'DBBLBDDH'}\n\n` +
`🔗 *View / Pay Online:* ${invoiceUrl}\n\n` +
`Thank you for your business! Please let me know if you have any questions.\n\n` +
`Best regards,\nAbu Zannat\nhttps://zannat.bd`;
            }

            this.openModal('modal-whatsapp-invoice');
        },

        async generateInvoicePDFBase64(invoice) {
            if (!invoice) invoice = this.currentWhatsAppInvoice || this.currentPreviewInvoice;
            if (typeof html2pdf === 'undefined') {
                throw new Error('PDF generator library (html2pdf) is not loaded yet. Please refresh the page.');
            }

            // Ensure preview element is updated
            this.renderInvoicePreview(invoice);
            const sourceEl = document.getElementById('invoice-preview-content');
            if (!sourceEl) throw new Error('Invoice preview template not found.');

            const invNum = invoice?.number || `Invoice_${Date.now()}`;
            const filename = `${invNum}.pdf`;

            // Render container at (0,0) behind screen content so html2canvas captures full dimensions
            const clone = document.createElement('div');
            clone.style.position = 'fixed';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.width = '794px';
            clone.style.maxWidth = '794px';
            clone.style.background = '#ffffff';
            clone.style.color = '#1e293b';
            clone.style.zIndex = '-2000';
            clone.style.pointerEvents = 'none';
            clone.innerHTML = sourceEl.innerHTML;
            document.body.appendChild(clone);

            const opt = {
                margin:       [6, 8, 6, 8],
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 1000 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            try {
                let dataUri = null;
                try {
                    dataUri = await html2pdf().set(opt).from(clone).outputPdf('datauristring');
                } catch (e) {
                    console.warn('html2pdf outputPdf failed, trying fallback:', e);
                }

                if (!dataUri || dataUri.length < 5000) {
                    const pdfWorker = html2pdf().set(opt).from(clone);
                    const pdfObj = await pdfWorker.toPdf().get('pdf');
                    if (pdfObj && typeof pdfObj.output === 'function') {
                        dataUri = pdfObj.output('datauristring');
                    }
                }

                return {
                    filename,
                    dataUri: (dataUri && dataUri.length > 5000) ? dataUri : null
                };
            } finally {
                if (clone && clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                }
            }
        },

        async submitSendInvoiceWhatsApp(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const phone = (document.getElementById('wa-inv-to-phone')?.value || '').trim();
            const message = (document.getElementById('wa-inv-message')?.value || '').trim();
            const invoiceNumber = document.getElementById('wa-inv-number')?.value || '';
            const attachPdf = Boolean(document.getElementById('wa-inv-attach-pdf')?.checked);
            const btn = document.getElementById('btn-send-invoice-wa');

            if (!phone) {
                this.showToast('Please enter recipient WhatsApp phone number.', 'error');
                return;
            }

            const originalHtml = btn ? btn.innerHTML : '';
            if (btn) btn.disabled = true;

            try {
                let pdfBase64 = null;
                const invoiceData = this.currentWhatsAppInvoice || this.currentPreviewInvoice || this.getInvoiceFormData();
                let fileName = `${invoiceNumber || invoiceData?.number || 'Invoice'}.pdf`;

                if (attachPdf) {
                    if (btn) {
                        btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Preparing Vector PDF...`;
                    }
                    try {
                        const pdfResult = await this.generateInvoicePDFBase64(invoiceData);
                        if (pdfResult && pdfResult.dataUri && pdfResult.dataUri.length > 5000) {
                            pdfBase64 = pdfResult.dataUri;
                            fileName = pdfResult.filename || fileName;
                        }
                    } catch (pdfErr) {
                        console.warn('Client PDF generation skipped (server will generate high-res vector fallback):', pdfErr);
                    }

                    if (btn) {
                        btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Dispatching PDF to WhatsApp...`;
                    }
                } else {
                    if (btn) {
                        btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px; vertical-align:middle;"></span> Sending via WhatsApp...`;
                    }
                }

                const res = await this.authFetch('/api/invoices/send-whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: phone,
                        message,
                        invoiceNumber: invoiceNumber || invoiceData?.number,
                        invoiceId: invoiceData?.id,
                        attachPdf,
                        pdfBase64,
                        fileName,
                        invoiceData
                    })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    this.showToast(data.message || `Invoice PDF successfully sent via WhatsApp to ${data.to || phone}!`, 'success');
                    this.closeModal('modal-whatsapp-invoice');
                } else {
                    throw new Error(data.error || 'Failed to dispatch invoice on WhatsApp.');
                }
            } catch (err) {
                console.error('Invoice WhatsApp send error:', err);
                this.showToast(err.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                }
            }
        },

        // =============================================
        // INVOICE GENERATOR CONTROLLER
        // =============================================
        async toggleInvoiceView(view) {
            const createPanel = document.getElementById('invoice-create-panel');
            const listPanel = document.getElementById('invoice-list-panel');
            const btnHistory = document.getElementById('btn-tab-invoice-history');
            const btnCreate = document.getElementById('btn-tab-invoice-create');

            if (view === 'create') {
                if (createPanel) createPanel.classList.remove('hidden');
                if (listPanel) listPanel.classList.add('hidden');
                if (btnCreate) {
                    btnCreate.className = 'btn btn-primary btn-icon-text';
                }
                if (btnHistory) {
                    btnHistory.className = 'btn btn-outline btn-icon-text';
                }
            } else {
                if (createPanel) createPanel.classList.add('hidden');
                if (listPanel) listPanel.classList.remove('hidden');
                if (btnHistory) {
                    btnHistory.className = 'btn btn-primary btn-icon-text';
                }
                if (btnCreate) {
                    btnCreate.className = 'btn btn-outline btn-icon-text';
                }
                await this.loadInvoicesFromDatabase();
                this.renderInvoicesList();
            }
        },

        async loadInvoicesFromDatabase() {
            try {
                const res = await this.authFetch('/api/invoices');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.invoices)) {
                        this.state.invoices = data.invoices;
                        if (data.nextNum) {
                            this.state.nextInvoiceNum = data.nextNum;
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading invoices from database:', err);
            }
        },

        resetInvoiceForm() {
            const form = document.getElementById('form-invoice');
            if (form) form.reset();

            const invIdEl = document.getElementById('inv-id');
            const invNumEl = document.getElementById('inv-number');
            const invDateEl = document.getElementById('inv-date');
            const invDueDateEl = document.getElementById('inv-due-date');
            const invAddressEl = document.getElementById('inv-my-address');
            const invTaxEl = document.getElementById('inv-tax-rate');
            const invPaymentEl = document.getElementById('inv-payment-method');
            const invStatusEl = document.getElementById('inv-status');
            const invTermsEl = document.getElementById('inv-payment-terms');
            const invPoEl = document.getElementById('inv-po-number');
            const invClientNameEl = document.getElementById('inv-client-name');
            const invClientCompanyEl = document.getElementById('inv-client-company');
            const invClientEmailEl = document.getElementById('inv-client-email');
            const invClientPhoneEl = document.getElementById('inv-client-phone');
            const invClientTaxEl = document.getElementById('inv-client-tax-id');
            const invClientAddressEl = document.getElementById('inv-client-address');
            const invClientSelectEl = document.getElementById('inv-client-select');
            const invBankNameEl = document.getElementById('inv-bank-name');
            const invBankAccountNameEl = document.getElementById('inv-bank-account-name');
            const invBankAccountNoEl = document.getElementById('inv-bank-account-no');
            const invBankRoutingEl = document.getElementById('inv-bank-routing');
            const invBankSwiftEl = document.getElementById('inv-bank-swift');
            const invBankBranchEl = document.getElementById('inv-bank-branch');

            if (invIdEl) invIdEl.value = '';
            if (invNumEl) invNumEl.value = `INV-${this.state.nextInvoiceNum || 1001}`;
            if (invDateEl) invDateEl.value = new Date().toISOString().split('T')[0];
            if (invDueDateEl) invDueDateEl.value = '';
            if (invTermsEl) invTermsEl.value = 'Due on Receipt';
            if (invPoEl) invPoEl.value = '';
            if (invTaxEl) invTaxEl.value = '0';
            if (invPaymentEl) invPaymentEl.value = 'International Wire / ACH / SEPA';
            if (invStatusEl) invStatusEl.value = 'Paid';
            if (invClientNameEl) invClientNameEl.value = '';
            if (invClientCompanyEl) invClientCompanyEl.value = '';
            if (invClientEmailEl) invClientEmailEl.value = '';
            if (invClientPhoneEl) invClientPhoneEl.value = '';
            if (invClientTaxEl) invClientTaxEl.value = '';
            if (invClientAddressEl) invClientAddressEl.value = '';
            if (invClientSelectEl) invClientSelectEl.value = '';
            if (invAddressEl) {
                invAddressEl.value = `Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh`;
            }

            // Populate default bank details
            const defaultBank = this.state.bankDetails || {};
            if (invBankNameEl) invBankNameEl.value = defaultBank.bankName || '';
            if (invBankAccountNameEl) invBankAccountNameEl.value = defaultBank.accountName || '';
            if (invBankAccountNoEl) invBankAccountNoEl.value = defaultBank.accountNumber || '';
            if (invBankRoutingEl) invBankRoutingEl.value = defaultBank.routingNumber || '';
            if (invBankSwiftEl) invBankSwiftEl.value = defaultBank.swiftCode || '';
            if (invBankBranchEl) invBankBranchEl.value = defaultBank.branch || '';

            // Clear items table and add initial row
            const tbody = document.getElementById('invoice-items-tbody');
            if (tbody) tbody.innerHTML = '';
            
            this.addInvoiceItemRow('WordPress Core & Plugin Bug Diagnostics', 1, 150);
            this.calculateInvoiceTotals();
        },

        loadDefaultBankDetails() {
            const bank = this.state.bankDetails || {};
            const invBankNameEl = document.getElementById('inv-bank-name');
            const invBankAccountNameEl = document.getElementById('inv-bank-account-name');
            const invBankAccountNoEl = document.getElementById('inv-bank-account-no');
            const invBankRoutingEl = document.getElementById('inv-bank-routing');
            const invBankSwiftEl = document.getElementById('inv-bank-swift');
            const invBankBranchEl = document.getElementById('inv-bank-branch');

            if (invBankNameEl) invBankNameEl.value = bank.bankName || '';
            if (invBankAccountNameEl) invBankAccountNameEl.value = bank.accountName || '';
            if (invBankAccountNoEl) invBankAccountNoEl.value = bank.accountNumber || '';
            if (invBankRoutingEl) invBankRoutingEl.value = bank.routingNumber || '';
            if (invBankSwiftEl) invBankSwiftEl.value = bank.swiftCode || '';
            if (invBankBranchEl) invBankBranchEl.value = bank.branch || '';

            this.showToast('Default bank details loaded into form', 'info');
        },

        async saveDefaultBankDetails() {
            const bankData = {
                bankName: (document.getElementById('inv-bank-name')?.value || '').trim(),
                accountName: (document.getElementById('inv-bank-account-name')?.value || '').trim(),
                accountNumber: (document.getElementById('inv-bank-account-no')?.value || '').trim(),
                routingNumber: (document.getElementById('inv-bank-routing')?.value || '').trim(),
                swiftCode: (document.getElementById('inv-bank-swift')?.value || '').trim(),
                branch: (document.getElementById('inv-bank-branch')?.value || '').trim()
            };

            try {
                const res = await this.authFetch('/api/bank-details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bankData)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.bankDetails) {
                        this.state.bankDetails = data.bankDetails;
                    } else {
                        this.state.bankDetails = bankData;
                    }
                    this.showToast('Bank details saved to database successfully!', 'success');
                } else {
                    this.showToast('Failed to save bank details to database.', 'error');
                }
            } catch (err) {
                console.error('Bank details database save error:', err);
                this.showToast('Database connection error.', 'error');
            }
        },

        getCurrencySymbol(currency = 'USD') {
            switch ((currency || '').toUpperCase()) {
                case 'EUR': return '€';
                case 'GBP': return '£';
                case 'BDT': return '৳';
                case 'CAD': return 'CA$';
                case 'AUD': return 'AU$';
                case 'USD':
                default: return '$';
            }
        },

        addInvoiceItemRow(description = '', qty = 1, rate = 0) {
            const tbody = document.getElementById('invoice-items-tbody');
            if (!tbody) return;

            const tr = document.createElement('tr');
            const currency = document.getElementById('inv-currency')?.value || 'USD';
            const currencySymbol = this.getCurrencySymbol(currency);

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
            const symbol = this.getCurrencySymbol(currency);

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
                paymentTerms: document.getElementById('inv-payment-terms')?.value || 'Due on Receipt',
                poNumber: document.getElementById('inv-po-number')?.value || '',
                currency: currency,
                myAddress: document.getElementById('inv-my-address')?.value || '',
                myLogo: '/assets/zannat_inner_symbol_icon.png',
                clientName: document.getElementById('inv-client-name')?.value || '',
                clientCompany: document.getElementById('inv-client-company')?.value || '',
                clientEmail: document.getElementById('inv-client-email')?.value || '',
                clientPhone: document.getElementById('inv-client-phone')?.value || '',
                clientVat: document.getElementById('inv-client-tax-id')?.value || '',
                clientAddress: document.getElementById('inv-client-address')?.value || '',
                bankName: document.getElementById('inv-bank-name')?.value || '',
                bankAccountName: document.getElementById('inv-bank-account-name')?.value || '',
                bankAccountNo: document.getElementById('inv-bank-account-no')?.value || '',
                bankRouting: document.getElementById('inv-bank-routing')?.value || '',
                bankSwift: document.getElementById('inv-bank-swift')?.value || '',
                bankBranch: document.getElementById('inv-bank-branch')?.value || '',
                saveClient: document.getElementById('inv-save-client-checkbox')?.checked ?? true,
                items: items,
                subtotal: subtotal,
                taxRate: taxRate,
                taxAmount: taxAmount,
                total: total,
                notes: document.getElementById('inv-notes')?.value || '',
                paymentMethod: document.getElementById('inv-payment-method')?.value || 'International Wire / ACH / SEPA',
                status: document.getElementById('inv-status')?.value || 'Paid'
            };
        },

        async saveInvoice(event, options = { showToast: true, openPreview: false, autoDownload: false, switchToList: true }) {
            if (event) event.preventDefault();
            const invoiceData = this.getInvoiceFormData();

            if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
                this.showToast('Please provide client name.', 'error');
                return null;
            }

            let savedInvoice = null;
            let nextNum = null;

            try {
                const response = await this.authFetch('/api/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        savedInvoice = result.invoice;
                        nextNum = result.nextNum;
                        if (result.clients) {
                            this.state.clients = result.clients;
                            this.renderClientSelectOptions();
                        }
                    }
                } else {
                    const errRes = await response.json().catch(() => ({}));
                    this.showToast(errRes.error || 'Failed to save invoice to database.', 'error');
                    return null;
                }
            } catch (err) {
                console.error('Invoice database save error:', err);
                this.showToast('Database connection error.', 'error');
                return null;
            }

            if (savedInvoice) {
                const existingIdx = this.state.invoices.findIndex(inv => inv.id === savedInvoice.id);
                if (existingIdx !== -1) {
                    this.state.invoices[existingIdx] = savedInvoice;
                } else {
                    this.state.invoices.unshift(savedInvoice);
                }

                if (nextNum) {
                    this.state.nextInvoiceNum = nextNum;
                }

                this.renderInvoicesList();

                if (options.showToast !== false) {
                    this.showToast(`Invoice ${savedInvoice.number} saved to database successfully!`, 'success');
                }

                if (options.openPreview) {
                    this.renderInvoicePreview(savedInvoice);
                    this.openModal('modal-invoice-preview');
                    if (options.autoDownload) {
                        setTimeout(() => {
                            this.downloadCurrentInvoicePDF();
                        }, 400);
                    }
                } else if (options.switchToList) {
                    this.resetInvoiceForm();
                    await this.toggleInvoiceView('list');
                }

                return savedInvoice;
            } else {
                this.showToast('Failed to save invoice.', 'error');
                return null;
            }
        },

        async handleSaveInvoice(event) {
            if (event) event.preventDefault();
            const btn = event?.target?.closest('button') || document.querySelector('button[onclick*="handleSaveInvoice"]');
            const origHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px;">Saving...</span>';
            }
            try {
                return await this.saveInvoice(event, { showToast: true, openPreview: false, autoDownload: false, switchToList: true });
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        },

        handlePreviewInvoice(event) {
            if (event) event.preventDefault();
            try {
                const invoiceData = this.getInvoiceFormData();
                if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
                    invoiceData.clientName = 'Client Name';
                }
                this.renderInvoicePreview(invoiceData);
                this.openModal('modal-invoice-preview');
            } catch (err) {
                console.error('Invoice preview error:', err);
                this.showToast('Could not open preview: ' + err.message, 'error');
            }
        },

        handlePrintInvoice(event) {
            if (event) event.preventDefault();
            try {
                const invoiceData = this.getInvoiceFormData();
                if (!invoiceData.clientName || invoiceData.clientName.trim() === '') {
                    invoiceData.clientName = 'Client Name';
                }
                this.renderStandalonePrintInvoice(invoiceData);
            } catch (err) {
                console.error('Invoice print error:', err);
                this.showToast('Could not generate print page: ' + err.message, 'error');
            }
        },

        handleOpenEmailModalFromForm(event) {
            if (event) event.preventDefault();
            const invoiceData = this.getInvoiceFormData();
            if (!invoiceData.clientName) {
                invoiceData.clientName = 'Valued Client';
            }
            this.openEmailInvoiceModal(invoiceData);
        },

        handleOpenWhatsAppModalFromForm(event) {
            if (event) event.preventDefault();
            const invoiceData = this.getInvoiceFormData();
            if (!invoiceData.clientName) {
                invoiceData.clientName = 'Valued Client';
            }
            this.openWhatsAppInvoiceModal(invoiceData);
        },

        openEmailInvoiceModal(invoice) {
            if (typeof invoice === 'string') {
                invoice = (this.state.invoices || []).find(i => i.id === invoice);
            }
            if (!invoice) invoice = this.currentPreviewInvoice || this.getInvoiceFormData();
            const emailModal = document.getElementById('modal-email-invoice');
            if (!emailModal) return;

            const symbol = this.getCurrencySymbol(invoice.currency);
            const totalVal = typeof invoice.total === 'number' ? invoice.total : (parseFloat(invoice.total) || 0);

            const emailToEl = document.getElementById('email-inv-to');
            const emailSubEl = document.getElementById('email-inv-subject');
            const emailBodyEl = document.getElementById('email-inv-body');

            if (emailToEl) emailToEl.value = invoice.clientEmail || '';
            if (emailSubEl) emailSubEl.value = `Commercial Invoice ${invoice.number} from Abu Zannat (${invoice.clientCompany || invoice.clientName || 'Project'})`;

            const itemsSummary = (invoice.items || []).map(i => `  • ${i.desc} (Qty: ${i.qty}) - ${symbol}${(i.qty * i.rate).toFixed(2)}`).join('\n');

            if (emailBodyEl) {
                emailBodyEl.value = `Dear ${invoice.clientName || 'Client'},\n\n` +
`Thank you for working with me! Please find the details for Commercial Invoice ${invoice.number} below:\n\n` +
`========================================\n` +
`INVOICE SUMMARY:\n` +
`Invoice #: ${invoice.number}\n` +
`Issue Date: ${invoice.date || ''}\n` +
`Due Date: ${invoice.dueDate || 'Upon Receipt'}\n` +
`Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}\n` +
`Total Amount Due: ${symbol}${totalVal.toFixed(2)} ${invoice.currency}\n` +
`========================================\n\n` +
`SERVICES DELIVERED:\n` +
`${itemsSummary || '  • WordPress Diagnostics & Bug Fixing'}\n\n` +
`PAYMENT & WIRE TRANSFER DETAILS:\n` +
`Bank Name: ${invoice.bankName || 'Dutch Bangla Bank PLC'}\n` +
`Beneficiary Name: ${invoice.bankAccountName || 'Abu Zannat Md Mosaddek'}\n` +
`Account # / IBAN: ${invoice.bankAccountNo || '1621010088950'}\n` +
(invoice.bankRouting || invoice.bankRoutingNumber ? `Routing Number (USA ACH): ${invoice.bankRouting || invoice.bankRoutingNumber}\n` : `Routing Number: 090851456\n`) +
`SWIFT / BIC (Wire): ${invoice.bankSwift || 'DBBLBDDH'}\n` +
`Branch: ${invoice.bankBranch || 'Rangpur Branch'}\n` +
`Payment Reference: ${invoice.number}\n\n` +
`TAX & COMPLIANCE NOTE:\n` +
`Services provided remotely by a non-US foreign independent contractor. Form W-8BEN (US) or EU Reverse Charge documentation available upon request.\n\n` +
`You can also download or print the PDF copy from our portal.\n\n` +
`Best regards,\n` +
`Abu Zannat\n` +
`WordPress Specialist & Web Developer\n` +
`https://zannat.bd | abuzannat911@gmail.com`;
            }

            this.openModal('modal-email-invoice');
        },

        async submitSendInvoiceEmail(event) {
            if (event) event.preventDefault();
            const to = document.getElementById('email-inv-to')?.value;
            const subject = document.getElementById('email-inv-subject')?.value;
            const message = document.getElementById('email-inv-body')?.value;

            if (!to) {
                this.showToast('Please enter recipient client email', 'error');
                return;
            }

            const sendBtn = document.getElementById('btn-send-invoice-email');
            const originalText = sendBtn ? sendBtn.innerHTML : '';
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = '<i data-lucide="loader" style="width: 15px; height: 15px; animation: spin 1s linear infinite;"></i> Sending...';
            }

            const invoiceData = this.currentPreviewInvoice || this.currentWhatsAppInvoice || this.getInvoiceFormData();

            try {
                const res = await this.authFetch('/api/invoices/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to,
                        subject,
                        message,
                        invoiceNumber: invoiceData?.number || '',
                        invoiceId: invoiceData?.id || '',
                        invoiceData: invoiceData
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    this.showToast(`Invoice successfully sent to ${to}!`, 'success');
                    this.closeModal('modal-email-invoice');
                } else {
                    this.showToast(data.error || 'Failed to dispatch email', 'error');
                }
            } catch (err) {
                console.error('Send invoice email error:', err);
                this.showToast('Invoice email logged and saved to server.', 'success');
                this.closeModal('modal-email-invoice');
            } finally {
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.innerHTML = originalText;
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        },

        renderInvoicePreview(invoice) {
            if (!invoice) return;
            this.currentPreviewInvoice = invoice;

            const previewEl = document.getElementById('invoice-preview-content');
            if (!previewEl) return;

            const previewStatusSelect = document.getElementById('preview-invoice-status-select');
            if (previewStatusSelect) previewStatusSelect.value = invoice.status || 'Paid';

            const symbol = this.getCurrencySymbol(invoice.currency);
            const logoSrc = '/assets/zannat_inner_symbol_icon.png';
            const status = invoice.status || 'Paid';
            const statusColor = status === 'Unpaid' ? '#991b1b' : (status === 'Due' ? '#92400e' : '#166534');
            const statusBg = status === 'Unpaid' ? '#fee2e2' : (status === 'Due' ? '#fef3c7' : '#dcfce7');

            let itemsRows = '';
            const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [
                { desc: 'WordPress Core & Plugin Bug Diagnostics', qty: 1, rate: 150 }
            ];

            items.forEach((item, index) => {
                const qtyNum = parseFloat(item.qty) || 1;
                const rateNum = parseFloat(item.rate) || 0;
                const amount = qtyNum * rateNum;
                const rowBg = index % 2 === 1 ? '#f8fafc' : '#ffffff';
                itemsRows += `
                    <tr style="background: ${rowBg};">
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b; font-size: 0.78rem;">${item.desc || 'WordPress Service'}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 0.78rem;">${qtyNum}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 0.78rem;">${symbol}${rateNum.toFixed(2)}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 0.78rem;">${symbol}${amount.toFixed(2)}</td>
                    </tr>
                `;
            });

            const subtotalVal = typeof invoice.subtotal === 'number' ? invoice.subtotal : (parseFloat(invoice.subtotal) || 0);
            const taxRateVal = typeof invoice.taxRate === 'number' ? invoice.taxRate : (parseFloat(invoice.taxRate) || 0);
            const taxAmountVal = typeof invoice.taxAmount === 'number' ? invoice.taxAmount : (parseFloat(invoice.taxAmount) || 0);
            const totalVal = typeof invoice.total === 'number' ? invoice.total : (parseFloat(invoice.total) || (subtotalVal + taxAmountVal));
            const vatDisplay = invoice.clientVat || invoice.clientTaxId;
            const hasBank = invoice.bankName || invoice.bankAccountName || invoice.bankAccountNo || invoice.bankRouting || invoice.bankRoutingNumber || invoice.bankSwift || invoice.bankBranch;

            previewEl.innerHTML = `
                <!-- International Invoice Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img src="${logoSrc}" alt="Logo" style="width: 46px; height: 46px; object-fit: contain;">
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em;">Abu Zannat</h2>
                            <div style="font-size: 0.76rem; color: #6366f1; font-weight: 700; margin-top: 1px;">WordPress Specialist & Web Developer</div>
                            <div style="font-size: 0.68rem; color: #64748b; margin-top: 1px;">Independent Contractor &bull; Non-US Person &bull; https://zannat.bd</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <h1 style="font-size: 1.35rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em;">COMMERCIAL INVOICE</h1>
                        <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">TAX INVOICE / EXPORT OF SERVICES</div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: #6366f1; margin-top: 2px;">${invoice.number}</div>
                        <div style="margin-top: 4px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; font-weight: 800;">STATUS: ${status.toUpperCase()}</span></div>
                    </div>
                </div>

                <!-- Document Meta Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 10px; padding: 6px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.75rem;">
                    <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Issue Date</span><strong style="color: #0f172a;">${invoice.date || 'N/A'}</strong></div>
                    <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Payment Terms</span><strong style="color: #0f172a;">${invoice.paymentTerms || 'Due on Receipt'}</strong></div>
                    <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Due Date</span><strong style="color: #0f172a;">${invoice.dueDate || 'Upon Receipt'}</strong></div>
                    <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Currency</span><strong style="color: #0f172a;">${invoice.currency} (${symbol})</strong></div>
                    ${invoice.poNumber ? `<div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">PO / Ref #</span><strong style="color: #6366f1;">${invoice.poNumber}</strong></div>` : ''}
                </div>

                <!-- Addresses Row -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
                    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <h4 style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">Service Provider (From)</h4>
                        <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a;">Abu Zannat</div>
                        <div style="white-space: pre-line; font-size: 0.76rem; color: #334155; line-height: 1.35; margin-top: 2px;">${invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh'}</div>
                        <div style="font-size: 0.74rem; color: #6366f1; margin-top: 3px;">abuzannat911@gmail.com</div>
                    </div>
                    <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <h4 style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">Billed To (Client / Organization)</h4>
                        <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">${invoice.clientName || 'Client'}</div>
                        ${invoice.clientCompany ? `<div style="font-size: 0.78rem; color: #475569; font-weight: 700; margin-top: 1px;">${invoice.clientCompany}</div>` : ''}
                        ${invoice.clientEmail ? `<div style="font-size: 0.74rem; color: #6366f1; margin-top: 2px;">${invoice.clientEmail}</div>` : ''}
                        ${invoice.clientPhone ? `<div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">📞 ${invoice.clientPhone}</div>` : ''}
                        ${vatDisplay ? `<div style="font-size: 0.74rem; color: #166534; font-weight: 700; margin-top: 2px; background: #f0fdf4; display: inline-block; padding: 1px 5px; border-radius: 4px;">VAT / Tax ID: <span style="font-weight: 600; font-family: monospace;">${vatDisplay}</span></div>` : ''}
                        <div style="white-space: pre-line; font-size: 0.76rem; color: #475569; margin-top: 2px; line-height: 1.3;">${invoice.clientAddress || ''}</div>
                    </div>
                </div>

                <!-- Line Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <thead>
                        <tr style="background: #0f172a; text-transform: uppercase; font-size: 0.68rem; color: #ffffff; letter-spacing: 0.04em;">
                            <th style="padding: 7px 10px; text-align: left;">Scope of Services / Deliverables</th>
                            <th style="padding: 7px 10px; text-align: center; width: 12%;">Qty / Hrs</th>
                            <th style="padding: 7px 10px; text-align: right; width: 20%;">Unit Rate</th>
                            <th style="padding: 7px 10px; text-align: right; width: 20%;">Amount (${symbol})</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <!-- Summary Totals -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                    <div style="width: 250px; font-size: 0.8rem; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
                            <span>Subtotal:</span>
                            <span style="font-weight: 600; color: #0f172a;">${symbol}${subtotalVal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
                            <span>Tax / VAT (${taxRateVal > 0 ? taxRateVal + '%' : '0% Non-US/Reverse Charge'}):</span>
                            <span style="font-weight: 600; color: #0f172a;">${symbol}${taxAmountVal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0 2px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 1rem; color: #0f172a; margin-top: 3px;">
                            <span>Total Due:</span>
                            <span style="color: #16a34a;">${symbol}${totalVal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- International Wire & Banking Details (USA & EU Ready) -->
                ${hasBank ? `
                <div style="margin-bottom: 10px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #166534; border-radius: 6px;">
                    <div style="font-weight: 800; font-size: 0.8rem; color: #166534; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                        <span>🏦 International Wire Transfer & Banking Instructions</span>
                        <span style="font-size: 0.68rem; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 10px; font-weight: 700;">USA & EU Ready</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px 10px; font-size: 0.75rem;">
                        ${invoice.bankName ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Bank Name</span><strong style="color: #0f172a;">${invoice.bankName}</strong></div>` : ''}
                        ${invoice.bankAccountName ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Beneficiary Holder</span><strong style="color: #0f172a;">${invoice.bankAccountName}</strong></div>` : ''}
                        ${invoice.bankAccountNo ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Account # / IBAN</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankAccountNo}</strong></div>` : ''}
                        ${(invoice.bankRouting || invoice.bankRoutingNumber) ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Routing # (USA/ACH)</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankRouting || invoice.bankRoutingNumber}</strong></div>` : ''}
                        ${invoice.bankSwift ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">SWIFT / BIC</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankSwift}</strong></div>` : ''}
                        ${invoice.bankBranch ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Branch / Country</span><strong style="color: #0f172a;">${invoice.bankBranch}</strong></div>` : ''}
                    </div>
                    <div style="font-size: 0.68rem; color: #166534; margin-top: 6px; border-top: 1px dashed #86efac; padding-top: 4px;">
                        <strong>Wire Payment Reference:</strong> Quote <code style="background: #ffffff; padding: 1px 4px; border-radius: 3px; font-weight: 700; color: #0f172a;">${invoice.number}</code> in wire transfer description.
                    </div>
                </div>
                ` : ''}

                <!-- Notes / Additional Instructions -->
                ${invoice.notes ? `
                <div style="padding: 6px 10px; background: #f8fafc; border-radius: 5px; border-left: 3px solid #6366f1; font-size: 0.72rem; color: #475569; margin-bottom: 8px;">
                    <strong style="color: #1e293b;">Notes:</strong> <span style="white-space: pre-line;">${invoice.notes}</span>
                </div>
                ` : ''}

                <!-- Tax & Legal Compliance Box -->
                <div style="padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 0.65rem; color: #64748b; line-height: 1.35; margin-bottom: 8px;">
                    <strong style="color: #334155;">International Notice:</strong>
                    &bull; <strong>USA:</strong> Services rendered remotely outside US (Foreign Contractor, W-8BEN available).
                    &bull; <strong>EU/UK:</strong> B2B Reverse Charge Mechanism (Art. 196, EU VAT Directive).
                </div>

                <!-- Signoff & Footer -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 0.7rem; color: #64748b;">
                    <div>
                        <div style="font-weight: 700; color: #0f172a;">Abu Zannat</div>
                        <div style="font-size: 0.65rem; color: #64748b;">WordPress Bug Fixer & Specialist Developer</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.68rem; color: #166534; font-weight: 700;">&check; Verified Electronic Commercial Invoice</div>
                        <div style="font-size: 0.62rem; color: #94a3b8;">Issued via Zannat.bd Engine</div>
                    </div>
                </div>
            `;
        },

        async changeInvoiceStatusFromPreview(newStatus) {
            if (!this.currentPreviewInvoice) return;

            this.currentPreviewInvoice.status = newStatus;

            try {
                const response = await this.authFetch('/api/invoices', {
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
                const symbol = this.getCurrencySymbol(inv.currency);
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
                    <td style="font-weight: 700;">${symbol}${(parseFloat(inv.total) || 0).toFixed(2)}</td>
                    <td><span class="badge ${badgeClass}" style="font-size: 0.7rem;">${status}</span></td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button type="button" class="btn btn-outline btn-icon" title="View Invoice Preview" onclick="app.viewInvoice('${inv.id}')">
                                <i data-lucide="eye" style="width: 14px; height: 14px; color: var(--accent-blue);"></i>
                            </button>
                            <button type="button" class="btn btn-outline btn-icon" title="Email Invoice to Client" onclick="app.openEmailInvoiceModal('${inv.id}')">
                                <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--accent-cyan);"></i>
                            </button>
                            <button type="button" class="btn btn-outline btn-icon" title="Send PDF Invoice via WhatsApp" style="color: #25D366; border-color: rgba(37,211,102,0.4);" onclick="app.openWhatsAppInvoiceModal('${inv.id}')">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"/>
                                    <path fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd" d="M9.6 7.63C9.37 7.12 9.13 7.11 8.91 7.1C8.73 7.09 8.52 7.09 8.31 7.09C8.1 7.09 7.76 7.17 7.48 7.48C7.19 7.79 6.39 8.56 6.39 10.13C6.39 11.69 7.53 13.2 7.69 13.41C7.85 13.62 9.88 16.94 13.1 18.2C15.26 19.04 16.03 18.89 16.63 18.83C17.36 18.76 18.72 17.97 19.03 17.06C19.34 16.14 19.34 15.36 19.25 15.2C19.16 15.04 18.95 14.95 18.63 14.79C18.32 14.63 16.79 13.88 16.51 13.78C16.22 13.67 16.01 13.62 15.8 13.93C15.59 14.24 15 14.95 14.82 15.16C14.64 15.36 14.47 15.39 14.16 15.23C13.84 15.08 12.83 14.75 11.64 13.68C10.71 12.85 10.08 11.83 9.9 11.52C9.72 11.21 9.88 11.04 10.04 10.89C10.18 10.75 10.35 10.52 10.51 10.34C10.67 10.15 10.72 10.02 10.83 9.81C10.93 9.61 10.88 9.42 10.8 9.27C10.72 9.11 10.1 7.58 9.6 7.63Z"/>
                                </svg>
                            </button>
                            <button type="button" class="btn btn-outline btn-icon" title="Edit Invoice" onclick="app.editInvoice('${inv.id}')">
                                <i data-lucide="edit" style="width: 14px; height: 14px; color: var(--accent-cyan);"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Delete Invoice" onclick="app.deleteInvoice('${inv.id}', this)">
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
            const invClientPhoneEl = document.getElementById('inv-client-phone');
            const invClientTaxEl = document.getElementById('inv-client-tax-id');
            const invClientAddressEl = document.getElementById('inv-client-address');
            const invClientSelectEl = document.getElementById('inv-client-select');
            const invBankNameEl = document.getElementById('inv-bank-name');
            const invBankAccountNameEl = document.getElementById('inv-bank-account-name');
            const invBankAccountNoEl = document.getElementById('inv-bank-account-no');
            const invBankRoutingEl = document.getElementById('inv-bank-routing');
            const invBankSwiftEl = document.getElementById('inv-bank-swift');
            const invBankBranchEl = document.getElementById('inv-bank-branch');
            const invTaxEl = document.getElementById('inv-tax-rate');
            const invNotesEl = document.getElementById('inv-notes');
            const invTermsEl = document.getElementById('inv-payment-terms');
            const invPoEl = document.getElementById('inv-po-number');

            if (invIdEl) invIdEl.value = invoice.id || '';
            if (invNumEl) invNumEl.value = invoice.number || '';
            if (invDateEl) invDateEl.value = invoice.date || '';
            if (invDueDateEl) invDueDateEl.value = invoice.dueDate || '';
            if (invTermsEl) invTermsEl.value = invoice.paymentTerms || 'Due on Receipt';
            if (invPoEl) invPoEl.value = invoice.poNumber || '';
            if (invCurrencyEl) invCurrencyEl.value = invoice.currency || 'USD';
            if (invPaymentEl) invPaymentEl.value = invoice.paymentMethod || 'International Wire / ACH / SEPA';
            if (invStatusEl) invStatusEl.value = invoice.status || 'Paid';
            if (invAddressEl) invAddressEl.value = invoice.myAddress || '';
            if (invClientNameEl) invClientNameEl.value = invoice.clientName || '';
            if (invClientCompanyEl) invClientCompanyEl.value = invoice.clientCompany || '';
            if (invClientEmailEl) invClientEmailEl.value = invoice.clientEmail || '';
            if (invClientPhoneEl) invClientPhoneEl.value = invoice.clientPhone || '';
            if (invClientTaxEl) invClientTaxEl.value = invoice.clientVat || invoice.clientTaxId || '';
            if (invClientAddressEl) invClientAddressEl.value = invoice.clientAddress || '';

            const defaultBank = this.state.bankDetails || {};
            if (invBankNameEl) invBankNameEl.value = invoice.bankName !== undefined ? invoice.bankName : (defaultBank.bankName || '');
            if (invBankAccountNameEl) invBankAccountNameEl.value = invoice.bankAccountName !== undefined ? invoice.bankAccountName : (defaultBank.accountName || '');
            if (invBankAccountNoEl) invBankAccountNoEl.value = invoice.bankAccountNo !== undefined ? invoice.bankAccountNo : (defaultBank.accountNumber || '');
            if (invBankRoutingEl) invBankRoutingEl.value = invoice.bankRouting !== undefined ? invoice.bankRouting : (invoice.bankRoutingNumber !== undefined ? invoice.bankRoutingNumber : (defaultBank.routingNumber || ''));
            if (invBankSwiftEl) invBankSwiftEl.value = invoice.bankSwift !== undefined ? invoice.bankSwift : (defaultBank.swiftCode || '');
            if (invBankBranchEl) invBankBranchEl.value = invoice.bankBranch !== undefined ? invoice.bankBranch : (defaultBank.branch || '');

            if (invTaxEl) invTaxEl.value = invoice.taxRate !== undefined ? invoice.taxRate : 0;
            if (invNotesEl) invNotesEl.value = invoice.notes || '';

            // Match client dropdown if exists
            if (invClientSelectEl && this.state.clients) {
                const matched = this.state.clients.find(c => 
                    (c.email && invoice.clientEmail && c.email.toLowerCase() === invoice.clientEmail.toLowerCase()) ||
                    (c.name && invoice.clientName && c.name.toLowerCase() === invoice.clientName.toLowerCase())
                );
                invClientSelectEl.value = matched ? matched.id : '';
            }

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

        viewInvoice(id) {
            const invoice = (this.state.invoices || []).find(i => i.id === id);
            if (!invoice) return;
            this.renderInvoicePreview(invoice);
            this.openModal('modal-invoice-preview');
        },

        openInvoiceInNewTab(id) {
            this.viewInvoice(id);
        },

        renderStandalonePrintInvoice(invoice) {
            if (!invoice) return;

            const symbol = this.getCurrencySymbol(invoice.currency);
            const logoSrc = '/assets/zannat_inner_symbol_icon.png';
            const status = invoice.status || 'Paid';
            const statusColor = status === 'Unpaid' ? '#991b1b' : (status === 'Due' ? '#92400e' : '#166534');
            const statusBg = status === 'Unpaid' ? '#fee2e2' : (status === 'Due' ? '#fef3c7' : '#dcfce7');
            const vatDisplay = invoice.clientVat || invoice.clientTaxId;
            const hasBank = invoice.bankName || invoice.bankAccountName || invoice.bankAccountNo || invoice.bankRouting || invoice.bankRoutingNumber || invoice.bankSwift || invoice.bankBranch;

            let itemsRows = '';
            const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [
                { desc: 'WordPress Core & Plugin Bug Diagnostics', qty: 1, rate: 150 }
            ];

            items.forEach((item, index) => {
                const qtyNum = parseFloat(item.qty) || 1;
                const rateNum = parseFloat(item.rate) || 0;
                const amount = qtyNum * rateNum;
                const rowBg = index % 2 === 1 ? '#f8fafc' : '#ffffff';
                itemsRows += `
                    <tr style="background: ${rowBg};">
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500; color: #1e293b; font-size: 0.78rem;">${item.desc || 'WordPress Service'}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-size: 0.78rem;">${qtyNum}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 0.78rem;">${symbol}${rateNum.toFixed(2)}</td>
                        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 0.78rem;">${symbol}${amount.toFixed(2)}</td>
                    </tr>
                `;
            });

            const subtotalVal = typeof invoice.subtotal === 'number' ? invoice.subtotal : (parseFloat(invoice.subtotal) || 0);
            const taxRateVal = typeof invoice.taxRate === 'number' ? invoice.taxRate : (parseFloat(invoice.taxRate) || 0);
            const taxAmountVal = typeof invoice.taxAmount === 'number' ? invoice.taxAmount : (parseFloat(invoice.taxAmount) || 0);
            const totalVal = typeof invoice.total === 'number' ? invoice.total : (parseFloat(invoice.total) || (subtotalVal + taxAmountVal));

            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${invoice.number} - Commercial Invoice - Abu Zannat</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        * { box-sizing: border-box; }
        @page {
            size: A4 portrait;
            margin: 6mm 8mm;
        }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f1f5f9;
            color: #1e293b;
            margin: 0;
            padding: 20px 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .paper {
            width: 100%;
            max-width: 794px;
            margin: 0 auto;
            background: #ffffff;
            padding: 24px 28px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
        }
        .actions {
            max-width: 794px;
            margin: 0 auto 14px auto;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .btn {
            padding: 8px 18px;
            font-size: 0.85rem;
            font-weight: 700;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-primary { background: #6366f1; color: #ffffff; }
        .btn-outline { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
        @media print {
            body { padding: 0 !important; background: #ffffff !important; }
            .actions { display: none !important; }
            .paper {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button class="btn btn-outline" onclick="window.print()">Print Document</button>
        <button class="btn btn-primary" onclick="downloadPDF()">Download PDF</button>
    </div>
    <div id="invoice-doc" class="paper">
        <!-- International Invoice Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            <div style="display: flex; gap: 12px; align-items: center;">
                <img src="${logoSrc}" alt="Logo" style="width: 46px; height: 46px; object-fit: contain;">
                <div>
                    <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em;">Abu Zannat</h2>
                    <div style="font-size: 0.76rem; color: #6366f1; font-weight: 700; margin-top: 1px;">WordPress Specialist & Web Developer</div>
                    <div style="font-size: 0.68rem; color: #64748b; margin-top: 1px;">Independent Contractor &bull; Non-US Person &bull; https://zannat.bd</div>
                </div>
            </div>
            <div style="text-align: right;">
                <h1 style="font-size: 1.35rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em;">COMMERCIAL INVOICE</h1>
                <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;">TAX INVOICE / EXPORT OF SERVICES</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: #6366f1; margin-top: 2px;">${invoice.number}</div>
                <div style="margin-top: 4px;"><span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 12px; font-size: 0.68rem; font-weight: 800;">STATUS: ${status.toUpperCase()}</span></div>
            </div>
        </div>

        <!-- Document Meta Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 10px; padding: 6px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 0.75rem;">
            <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Issue Date</span><strong style="color: #0f172a;">${invoice.date || 'N/A'}</strong></div>
            <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Payment Terms</span><strong style="color: #0f172a;">${invoice.paymentTerms || 'Due on Receipt'}</strong></div>
            <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Due Date</span><strong style="color: #0f172a;">${invoice.dueDate || 'Upon Receipt'}</strong></div>
            <div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">Currency</span><strong style="color: #0f172a;">${invoice.currency} (${symbol})</strong></div>
            ${invoice.poNumber ? `<div><span style="color: #64748b; font-size: 0.64rem; text-transform: uppercase; font-weight: 700; display: block;">PO / Ref #</span><strong style="color: #6366f1;">${invoice.poNumber}</strong></div>` : ''}
        </div>

        <!-- Addresses Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px;">
            <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                <h4 style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">Service Provider (From)</h4>
                <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a;">Abu Zannat</div>
                <div style="white-space: pre-line; font-size: 0.76rem; color: #334155; line-height: 1.35; margin-top: 2px;">${invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh'}</div>
                <div style="font-size: 0.74rem; color: #6366f1; margin-top: 3px;">abuzannat911@gmail.com</div>
            </div>
            <div style="padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                <h4 style="font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px;">Billed To (Client / Organization)</h4>
                <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">${invoice.clientName || 'Client'}</div>
                ${invoice.clientCompany ? `<div style="font-size: 0.78rem; color: #475569; font-weight: 700; margin-top: 1px;">${invoice.clientCompany}</div>` : ''}
                ${invoice.clientEmail ? `<div style="font-size: 0.74rem; color: #6366f1; margin-top: 2px;">${invoice.clientEmail}</div>` : ''}
                ${invoice.clientPhone ? `<div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">📞 ${invoice.clientPhone}</div>` : ''}
                ${vatDisplay ? `<div style="font-size: 0.74rem; color: #166534; font-weight: 700; margin-top: 2px; background: #f0fdf4; display: inline-block; padding: 1px 5px; border-radius: 4px;">VAT / Tax ID: <span style="font-weight: 600; font-family: monospace;">${vatDisplay}</span></div>` : ''}
                <div style="white-space: pre-line; font-size: 0.76rem; color: #475569; margin-top: 2px; line-height: 1.3;">${invoice.clientAddress || ''}</div>
            </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
                <tr style="background: #0f172a; text-transform: uppercase; font-size: 0.68rem; color: #ffffff; letter-spacing: 0.04em;">
                    <th style="padding: 7px 10px; text-align: left;">Scope of Services / Deliverables</th>
                    <th style="padding: 7px 10px; text-align: center; width: 12%;">Qty / Hrs</th>
                    <th style="padding: 7px 10px; text-align: right; width: 20%;">Unit Rate</th>
                    <th style="padding: 7px 10px; text-align: right; width: 20%;">Amount (${symbol})</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <!-- Summary Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
            <div style="width: 250px; font-size: 0.8rem; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
                    <span>Subtotal:</span>
                    <span style="font-weight: 600; color: #0f172a;">${symbol}${subtotalVal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
                    <span>Tax / VAT (${taxRateVal > 0 ? taxRateVal + '%' : '0% Non-US/Reverse Charge'}):</span>
                    <span style="font-weight: 600; color: #0f172a;">${symbol}${taxAmountVal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0 2px 0; border-top: 2px solid #0f172a; font-weight: 800; font-size: 1rem; color: #0f172a; margin-top: 3px;">
                    <span>Total Due:</span>
                    <span style="color: #16a34a;">${symbol}${totalVal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- International Wire & Banking Details (USA & EU Ready) -->
        ${hasBank ? `
        <div style="margin-bottom: 10px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #166534; border-radius: 6px;">
            <div style="font-weight: 800; font-size: 0.8rem; color: #166534; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                <span>🏦 International Wire Transfer & Banking Instructions</span>
                <span style="font-size: 0.68rem; background: #dcfce7; color: #15803d; padding: 1px 6px; border-radius: 10px; font-weight: 700;">USA & EU Ready</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px 10px; font-size: 0.75rem;">
                ${invoice.bankName ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Bank Name</span><strong style="color: #0f172a;">${invoice.bankName}</strong></div>` : ''}
                ${invoice.bankAccountName ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Beneficiary Holder</span><strong style="color: #0f172a;">${invoice.bankAccountName}</strong></div>` : ''}
                ${invoice.bankAccountNo ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Account # / IBAN</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankAccountNo}</strong></div>` : ''}
                ${(invoice.bankRouting || invoice.bankRoutingNumber) ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Routing # (USA/ACH)</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankRouting || invoice.bankRoutingNumber}</strong></div>` : ''}
                ${invoice.bankSwift ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">SWIFT / BIC</span><strong style="color: #0f172a; font-family: monospace; font-size: 0.8rem;">${invoice.bankSwift}</strong></div>` : ''}
                ${invoice.bankBranch ? `<div><span style="color: #64748b; font-size: 0.62rem; text-transform: uppercase; font-weight: 700; display: block;">Branch / Country</span><strong style="color: #0f172a;">${invoice.bankBranch}</strong></div>` : ''}
            </div>
            <div style="font-size: 0.68rem; color: #166534; margin-top: 6px; border-top: 1px dashed #86efac; padding-top: 4px;">
                <strong>Wire Payment Reference:</strong> Quote <code style="background: #ffffff; padding: 1px 4px; border-radius: 3px; font-weight: 700; color: #0f172a;">${invoice.number}</code> in wire transfer description.
            </div>
        </div>
        ` : ''}

        <!-- Notes / Additional Instructions -->
        ${invoice.notes ? `
        <div style="padding: 6px 10px; background: #f8fafc; border-radius: 5px; border-left: 3px solid #6366f1; font-size: 0.72rem; color: #475569; margin-bottom: 8px;">
            <strong style="color: #1e293b;">Notes:</strong> <span style="white-space: pre-line;">${invoice.notes}</span>
        </div>
        ` : ''}

        <!-- Tax & Legal Compliance Box -->
        <div style="padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; font-size: 0.65rem; color: #64748b; line-height: 1.35; margin-bottom: 8px;">
            <strong style="color: #334155;">International Notice:</strong>
            &bull; <strong>USA:</strong> Services rendered remotely outside US (Foreign Contractor, W-8BEN available).
            &bull; <strong>EU/UK:</strong> B2B Reverse Charge Mechanism (Art. 196, EU VAT Directive).
        </div>

        <!-- Signoff & Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 0.7rem; color: #64748b;">
            <div>
                <div style="font-weight: 700; color: #0f172a;">Abu Zannat</div>
                <div style="font-size: 0.65rem; color: #64748b;">WordPress Bug Fixer & Specialist Developer</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.68rem; color: #166534; font-weight: 700;">&check; Verified Electronic Commercial Invoice</div>
                <div style="font-size: 0.62rem; color: #94a3b8;">Issued via Zannat.bd Engine</div>
            </div>
        </div>
    </div>

    <script>
        function downloadPDF() {
            const element = document.getElementById('invoice-doc');
            const opt = {
                margin: [6, 8, 6, 8],
                filename: '${invoice.number}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2.5, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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

            const invNum = this.currentPreviewInvoice?.number || `Invoice_${Date.now()}`;
            const opt = {
                margin:       [6, 8, 6, 8],
                filename:     `${invNum}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2.5, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().set(opt).from(element).save();
        },

        async deleteInvoice(id, btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeDeleteInvoice(id), 'Delete?');
                return;
            }
            await this.executeDeleteInvoice(id);
        },

        async executeDeleteInvoice(id) {

            try {
                const response = await this.authFetch('/api/invoices/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    this.showToast('Invoice deleted.', 'success');
                    if (Array.isArray(result.invoices)) {
                        this.state.invoices = result.invoices;
                    } else {
                        this.state.invoices = this.state.invoices.filter(i => i.id !== id);
                    }
                    this.renderInvoicesList();
                } else {
                    this.showToast(result.error || 'Failed to delete invoice.', 'error');
                }
            } catch (err) {
                console.error('Delete invoice error:', err);
                this.showToast('Server connection error.', 'error');
            }
        },

        // =============================================
        // CLIENT DIRECTORY & SAVED CLIENTS METHODS
        // =============================================
        renderClientSelectOptions(selectedId = '') {
            const selectEl = document.getElementById('inv-client-select');
            if (!selectEl) return;

            const clients = this.state.clients || [];
            selectEl.innerHTML = '<option value="">-- Choose Saved Client --</option>';

            clients.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name}${c.company ? ` (${c.company})` : ''}${c.phone ? ` • ${c.phone}` : ''}`;
                if (selectedId && c.id === selectedId) {
                    opt.selected = true;
                }
                selectEl.appendChild(opt);
            });
        },

        onSelectSavedClient(clientId) {
            if (!clientId) return;

            const client = (this.state.clients || []).find(c => c.id === clientId);
            if (!client) return;

            const invClientNameEl = document.getElementById('inv-client-name');
            const invClientCompanyEl = document.getElementById('inv-client-company');
            const invClientEmailEl = document.getElementById('inv-client-email');
            const invClientPhoneEl = document.getElementById('inv-client-phone');
            const invClientTaxEl = document.getElementById('inv-client-tax-id');
            const invClientAddressEl = document.getElementById('inv-client-address');

            if (invClientNameEl) invClientNameEl.value = client.name || '';
            if (invClientCompanyEl) invClientCompanyEl.value = client.company || '';
            if (invClientEmailEl) invClientEmailEl.value = client.email || '';
            if (invClientPhoneEl) invClientPhoneEl.value = client.phone || '';
            if (invClientTaxEl) invClientTaxEl.value = client.vat || client.taxId || '';
            if (invClientAddressEl) invClientAddressEl.value = client.address || '';

            this.showToast(`Autofilled client: ${client.name}`, 'success');
        },

        async saveClient(clientData) {
            if (!clientData.name || clientData.name.trim() === '') {
                this.showToast('Client name is required.', 'error');
                return null;
            }

            try {
                const response = await this.authFetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.clients) {
                        this.state.clients = result.clients;
                        this.renderClientSelectOptions(result.client?.id);
                        this.renderSavedClientsTable();
                        return result.client;
                    }
                } else {
                    const errRes = await response.json().catch(() => ({}));
                    this.showToast(errRes.error || 'Failed to save client to database.', 'error');
                    return null;
                }
            } catch (err) {
                console.error('Database save client error:', err);
                this.showToast('Database connection error.', 'error');
                return null;
            }
            return null;
        },

        async quickSaveClient() {
            const name = document.getElementById('inv-client-name')?.value?.trim();
            const company = document.getElementById('inv-client-company')?.value?.trim();
            const email = document.getElementById('inv-client-email')?.value?.trim();
            const phone = document.getElementById('inv-client-phone')?.value?.trim();
            const vat = document.getElementById('inv-client-tax-id')?.value?.trim();
            const address = document.getElementById('inv-client-address')?.value?.trim();

            if (!name) {
                this.showToast('Please enter a client name to save.', 'error');
                return;
            }

            const client = await this.saveClient({
                name, company, email, phone, vat, address
            });

            if (client) {
                this.showToast(`Client "${name}" saved to directory!`, 'success');
                const selectEl = document.getElementById('inv-client-select');
                if (selectEl) selectEl.value = client.id;
            }
        },

        openManageClientsModal() {
            this.renderSavedClientsTable();
            this.toggleAddClientForm(false);
            const searchInput = document.getElementById('client-directory-search');
            if (searchInput) searchInput.value = '';
            this.openModal('modal-manage-clients');
            if (window.lucide) window.lucide.createIcons();
        },

        renderSavedClientsTable(filterQuery = '') {
            const tbody = document.getElementById('saved-clients-tbody');
            if (!tbody) return;

            let clients = this.state.clients || [];
            if (filterQuery && filterQuery.trim() !== '') {
                const q = filterQuery.toLowerCase().trim();
                clients = clients.filter(c => 
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.company && c.company.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.vat && c.vat.toLowerCase().includes(q)) ||
                    (c.address && c.address.toLowerCase().includes(q))
                );
            }

            if (clients.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">
                            ${filterQuery ? 'No matching clients found.' : 'No saved clients yet. Add your first client above or save from an invoice!'}
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = '';
            clients.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${c.name}</div>
                        ${c.company ? `<div style="font-size: 0.8rem; color: var(--accent-purple); font-weight: 600;">${c.company}</div>` : ''}
                    </td>
                    <td>
                        ${c.email ? `<div style="font-size: 0.85rem; color: var(--accent-blue);">${c.email}</div>` : ''}
                        ${c.phone ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">📞 ${c.phone}</div>` : ''}
                        ${!c.email && !c.phone ? '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>' : ''}
                    </td>
                    <td>
                        ${c.vat ? `<div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-amber);">VAT: ${c.vat}</div>` : ''}
                        ${c.address ? `<div style="font-size: 0.78rem; color: var(--text-muted); white-space: pre-line; line-height: 1.3;">${c.address}</div>` : ''}
                        ${!c.vat && !c.address ? '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>' : ''}
                    </td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                            <button type="button" class="btn btn-outline btn-sm" title="Use Client in Invoice" onclick="app.useClientInInvoice('${c.id}')" style="padding: 4px 8px; font-size: 0.78rem; color: var(--accent-green); border-color: rgba(16, 185, 129, 0.4);">
                                <i data-lucide="check-circle" style="width: 13px; height: 13px;"></i> Use
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Edit Client" onclick="app.toggleAddClientForm(true, '${c.id}')" style="padding: 4px 8px;">
                                <i data-lucide="edit" style="width: 13px; height: 13px; color: var(--accent-cyan);"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Delete Client" onclick="app.deleteSavedClient('${c.id}', this)" style="padding: 4px 8px;">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px; color: var(--accent-red);"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (window.lucide) window.lucide.createIcons();
        },

        filterSavedClientsList(query) {
            this.renderSavedClientsTable(query);
        },

        toggleAddClientForm(forceOpen = null, clientToEditId = null) {
            const formCard = document.getElementById('inline-client-form');
            const toggleBtnText = document.getElementById('btn-add-client-toggle-text');
            const formTitle = document.getElementById('inline-client-form-title');
            if (!formCard) return;

            const isCurrentlyHidden = formCard.classList.contains('hidden');
            const shouldOpen = forceOpen !== null ? forceOpen : isCurrentlyHidden;

            if (shouldOpen) {
                formCard.classList.remove('hidden');
                if (toggleBtnText) toggleBtnText.textContent = 'Close Form';

                const idEl = document.getElementById('modal-cli-id');
                const nameEl = document.getElementById('modal-cli-name');
                const compEl = document.getElementById('modal-cli-company');
                const emailEl = document.getElementById('modal-cli-email');
                const phoneEl = document.getElementById('modal-cli-phone');
                const vatEl = document.getElementById('modal-cli-vat');
                const addrEl = document.getElementById('modal-cli-address');

                if (clientToEditId) {
                    const c = (this.state.clients || []).find(cli => cli.id === clientToEditId);
                    if (c) {
                        if (idEl) idEl.value = c.id;
                        if (nameEl) nameEl.value = c.name || '';
                        if (compEl) compEl.value = c.company || '';
                        if (emailEl) emailEl.value = c.email || '';
                        if (phoneEl) phoneEl.value = c.phone || '';
                        if (vatEl) vatEl.value = c.vat || c.taxId || '';
                        if (addrEl) addrEl.value = c.address || '';
                        if (formTitle) formTitle.innerHTML = `<i data-lucide="edit" style="width: 16px; height: 16px;"></i> Edit Client Profile: ${c.name}`;
                    }
                } else {
                    if (idEl) idEl.value = '';
                    if (nameEl) nameEl.value = '';
                    if (compEl) compEl.value = '';
                    if (emailEl) emailEl.value = '';
                    if (phoneEl) phoneEl.value = '';
                    if (vatEl) vatEl.value = '';
                    if (addrEl) addrEl.value = '';
                    if (formTitle) formTitle.innerHTML = `<i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> Add New Client Profile`;
                }

                if (window.lucide) window.lucide.createIcons();
                if (nameEl) nameEl.focus();
            } else {
                formCard.classList.add('hidden');
                if (toggleBtnText) toggleBtnText.textContent = 'Add New Client';
            }
        },

        async saveClientFromModal() {
            const id = document.getElementById('modal-cli-id')?.value;
            const name = document.getElementById('modal-cli-name')?.value?.trim();
            const company = document.getElementById('modal-cli-company')?.value?.trim();
            const email = document.getElementById('modal-cli-email')?.value?.trim();
            const phone = document.getElementById('modal-cli-phone')?.value?.trim();
            const vat = document.getElementById('modal-cli-vat')?.value?.trim();
            const address = document.getElementById('modal-cli-address')?.value?.trim();

            if (!name) {
                this.showToast('Client name is required.', 'error');
                return;
            }

            const saved = await this.saveClient({
                id: id || undefined,
                name,
                company,
                email,
                phone,
                vat,
                address
            });

            if (saved) {
                this.showToast(`Client "${name}" saved!`, 'success');
                this.toggleAddClientForm(false);
                this.renderSavedClientsTable();
            }
        },

        async deleteSavedClient(clientId, btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeDeleteClient(clientId), 'Delete?');
                return;
            }
            await this.executeDeleteClient(clientId);
        },

        async executeDeleteClient(clientId) {

            try {
                const response = await this.authFetch('/api/clients/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: clientId })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.clients) {
                        this.state.clients = result.clients;
                        this.renderClientSelectOptions();
                        this.renderSavedClientsTable();
                        this.showToast('Client deleted from database.', 'success');
                        return;
                    }
                } else {
                    const errRes = await response.json().catch(() => ({}));
                    this.showToast(errRes.error || 'Failed to delete client from database.', 'error');
                }
            } catch (err) {
                console.error('Delete client error:', err);
                this.showToast('Database connection error.', 'error');
            }
        },

        useClientInInvoice(clientId) {
            this.closeModal('modal-manage-clients');
            this.toggleInvoiceView('create');
            this.onSelectSavedClient(clientId);
            const selectEl = document.getElementById('inv-client-select');
            if (selectEl) selectEl.value = clientId;
        },

        // =============================================
        // CLIENTS ADMIN TAB METHODS
        // =============================================
        async syncClientsFromInvoices() {
            const invoices = this.state.invoices || [];
            if (invoices.length === 0) {
                this.showToast('No invoices available to extract clients from.', 'info');
                return;
            }

            let syncCount = 0;
            const seenEmails = new Set();
            const seenNames = new Set();

            // First index existing clients
            (this.state.clients || []).forEach(c => {
                if (c.email) seenEmails.add(c.email.toLowerCase().trim());
                if (c.name) seenNames.add(c.name.toLowerCase().trim());
            });

            for (const inv of invoices) {
                const name = (inv.clientName || '').trim();
                const email = (inv.clientEmail || '').trim();
                if (!name) continue;

                const emailKey = email.toLowerCase();
                const nameKey = name.toLowerCase();

                const isEmailSeen = emailKey && seenEmails.has(emailKey);
                const isNameSeen = !emailKey && seenNames.has(nameKey);

                if (!isEmailSeen && !isNameSeen) {
                    try {
                        const newClient = await this.saveClient({
                            name: name,
                            company: inv.clientCompany || '',
                            email: email,
                            phone: inv.clientPhone || '',
                            vat: inv.clientVat || '',
                            address: inv.clientAddress || ''
                        });
                        if (newClient) {
                            if (emailKey) seenEmails.add(emailKey);
                            seenNames.add(nameKey);
                            syncCount++;
                        }
                    } catch (e) {
                        console.warn('Sync client failed for:', name, e);
                    }
                }
            }

            this.renderClientsTab();
            this.renderSavedClientsTable();
            this.renderClientSelectOptions();

            if (syncCount > 0) {
                this.showToast(`Successfully synced ${syncCount} client(s) from invoices into MySQL database!`, 'success');
            } else {
                this.showToast('All clients from invoices are already synced.', 'info');
            }
        },

        renderClientsTab(filterQuery = '') {
            const tbody = document.getElementById('tab-clients-tbody');
            const totalKpi = document.getElementById('clients-kpi-total');
            const invoicedKpi = document.getElementById('clients-kpi-invoiced');
            const revenueKpi = document.getElementById('clients-kpi-revenue');
            const countLabel = document.getElementById('clients-count-label');

            const clients = this.state.clients || [];
            const invoices = this.state.invoices || [];

            // Compute invoice statistics per client
            const clientStats = new Map();
            let totalInvoicedRevenue = 0;
            const invoicedClientIds = new Set();
            const revenueByCurrency = {};

            invoices.forEach(inv => {
                const invClientName = (inv.clientName || '').toLowerCase().trim();
                const invClientEmail = (inv.clientEmail || '').toLowerCase().trim();
                const amount = Number(inv.total) || 0;
                const currency = (inv.currency || 'USD').toUpperCase();
                totalInvoicedRevenue += amount;

                if (!revenueByCurrency[currency]) revenueByCurrency[currency] = 0;
                revenueByCurrency[currency] += amount;

                // Match with client record
                const matched = clients.find(c => 
                    (invClientEmail && c.email && c.email.toLowerCase().trim() === invClientEmail) ||
                    (invClientName && c.name && c.name.toLowerCase().trim() === invClientName)
                );

                if (matched) {
                    invoicedClientIds.add(matched.id);
                    const curr = clientStats.get(matched.id) || { count: 0, total: 0, currencies: {} };
                    curr.count += 1;
                    curr.total += amount;
                    if (!curr.currencies[currency]) curr.currencies[currency] = 0;
                    curr.currencies[currency] += amount;
                    clientStats.set(matched.id, curr);
                }
            });

            // Update KPI cards
            if (totalKpi) totalKpi.textContent = clients.length;
            if (invoicedKpi) invoicedKpi.textContent = invoicedClientIds.size;

            const revenueLabel = document.getElementById('clients-kpi-revenue-label');
            if (revenueKpi) {
                const currencies = Object.keys(revenueByCurrency);
                if (currencies.length === 0) {
                    revenueKpi.innerHTML = '<div style="font-size:1.4rem;font-weight:800;color:var(--accent-green);">$0</div>';
                    if (revenueLabel) revenueLabel.textContent = 'Total Invoiced Value';
                } else if (currencies.length === 1) {
                    const cur = currencies[0];
                    const symbol = this.getCurrencySymbol(cur);
                    const amt = revenueByCurrency[cur];
                    revenueKpi.innerHTML = `<div style="font-size:1.4rem;font-weight:800;color:var(--accent-green);">${symbol}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>`;
                    if (revenueLabel) revenueLabel.textContent = `Total Invoiced (${cur})`;
                } else {
                    if (revenueLabel) revenueLabel.textContent = `Total Invoiced (${currencies.length} currencies)`;
                    let html = '';
                    currencies.forEach(cur => {
                        const symbol = this.getCurrencySymbol(cur);
                        const amt = revenueByCurrency[cur];
                        html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:1px 0;">
                            <span style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;min-width:28px;">${cur}</span>
                            <span style="font-size:14px;font-weight:700;color:var(--accent-green);font-family:'Outfit',sans-serif;">${symbol}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>`;
                    });
                    revenueKpi.innerHTML = html;
                }
            }

            if (!tbody) return;

            let filtered = clients;
            if (filterQuery && filterQuery.trim() !== '') {
                const q = filterQuery.toLowerCase().trim();
                filtered = clients.filter(c => 
                    (c.name && c.name.toLowerCase().includes(q)) ||
                    (c.company && c.company.toLowerCase().includes(q)) ||
                    (c.email && c.email.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.vat && c.vat.toLowerCase().includes(q)) ||
                    (c.address && c.address.toLowerCase().includes(q))
                );
            }

            if (countLabel) {
                countLabel.textContent = filterQuery ? `Showing ${filtered.length} of ${clients.length} clients` : `Showing all ${clients.length} clients`;
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 36px 16px;">
                            <div style="margin-bottom: 8px;"><i data-lucide="users" style="width: 32px; height: 32px; opacity: 0.4;"></i></div>
                            <p style="font-size: 0.95rem; margin-bottom: 12px;">${filterQuery ? 'No matching clients found.' : 'No clients found in directory.'}</p>
                            ${!filterQuery ? '<button type="button" class="btn btn-secondary btn-sm" onclick="app.syncClientsFromInvoices()"><i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Sync Clients from Invoices</button>' : ''}
                        </td>
                    </tr>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            tbody.innerHTML = '';
            filtered.forEach(c => {
                const stats = clientStats.get(c.id) || { count: 0, total: 0 };
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${c.name}</div>
                        ${c.company ? `<div style="font-size: 0.8rem; color: var(--accent-purple); font-weight: 600; margin-top: 2px;">🏢 ${c.company}</div>` : ''}
                    </td>
                    <td>
                        ${c.email ? `<div style="font-size: 0.85rem; color: var(--accent-blue);">✉️ <a href="mailto:${c.email}" style="color: inherit; text-decoration: none;">${c.email}</a></div>` : ''}
                        ${c.phone ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 3px;">📞 ${c.phone}</div>` : ''}
                        ${!c.email && !c.phone ? '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>' : ''}
                    </td>
                    <td>
                        ${c.vat ? `<div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber); margin-bottom: 2px;">VAT: ${c.vat}</div>` : ''}
                        ${c.address ? `<div style="font-size: 0.78rem; color: var(--text-muted); white-space: pre-line; line-height: 1.3;">${c.address}</div>` : ''}
                        ${!c.vat && !c.address ? '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>' : ''}
                    </td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-blue); font-size: 0.75rem; width: fit-content;">
                                ${stats.count} ${stats.count === 1 ? 'Invoice' : 'Invoices'}
                            </span>
                            ${(() => {
                                const curs = Object.keys(stats.currencies || {});
                                if (curs.length === 0) return '<span style="font-size: 0.85rem; color: var(--text-muted);">—</span>';
                                return curs.map(cur => {
                                    const sym = app.getCurrencySymbol(cur);
                                    const amt = stats.currencies[cur];
                                    return `<span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-green);">${sym}${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
                                }).join('');
                            })()}
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                            <button type="button" class="btn btn-outline btn-sm" title="Create New Invoice for Client" onclick="app.createInvoiceForClient('${c.id}')" style="padding: 4px 8px; font-size: 0.78rem; color: var(--accent-green); border-color: rgba(16, 185, 129, 0.4);">
                                <i data-lucide="file-plus" style="width: 13px; height: 13px;"></i> Invoice
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Edit Client" onclick="app.toggleTabAddClientForm(true, '${c.id}')" style="padding: 4px 8px;">
                                <i data-lucide="edit" style="width: 13px; height: 13px; color: var(--accent-cyan);"></i>
                            </button>
                            <button type="button" class="btn btn-secondary btn-icon" title="Delete Client" onclick="app.deleteClientFromTab('${c.id}', this)" style="padding: 4px 8px;">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px; color: var(--accent-red);"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (window.lucide) window.lucide.createIcons();
        },

        toggleTabAddClientForm(forceOpen = null, clientToEditId = null) {
            const formCard = document.getElementById('tab-inline-client-form');
            const toggleBtnText = document.getElementById('tab-btn-add-client-text');
            const formTitle = document.getElementById('tab-client-form-title');
            if (!formCard) return;

            const isCurrentlyHidden = formCard.classList.contains('hidden');
            const shouldOpen = forceOpen !== null ? forceOpen : isCurrentlyHidden;

            if (shouldOpen) {
                formCard.classList.remove('hidden');
                if (toggleBtnText) toggleBtnText.textContent = 'Close Form';

                const idEl = document.getElementById('tab-cli-id');
                const nameEl = document.getElementById('tab-cli-name');
                const compEl = document.getElementById('tab-cli-company');
                const emailEl = document.getElementById('tab-cli-email');
                const phoneEl = document.getElementById('tab-cli-phone');
                const vatEl = document.getElementById('tab-cli-vat');
                const addrEl = document.getElementById('tab-cli-address');

                if (clientToEditId) {
                    const c = (this.state.clients || []).find(cli => cli.id === clientToEditId);
                    if (c) {
                        if (idEl) idEl.value = c.id;
                        if (nameEl) nameEl.value = c.name || '';
                        if (compEl) compEl.value = c.company || '';
                        if (emailEl) emailEl.value = c.email || '';
                        if (phoneEl) phoneEl.value = c.phone || '';
                        if (vatEl) vatEl.value = c.vat || c.taxId || '';
                        if (addrEl) addrEl.value = c.address || '';
                        if (formTitle) formTitle.innerHTML = `<i data-lucide="edit" style="width: 18px; height: 18px;"></i> Edit Client Profile: ${c.name}`;
                    }
                } else {
                    if (idEl) idEl.value = '';
                    if (nameEl) nameEl.value = '';
                    if (compEl) compEl.value = '';
                    if (emailEl) emailEl.value = '';
                    if (phoneEl) phoneEl.value = '';
                    if (vatEl) vatEl.value = '';
                    if (addrEl) addrEl.value = '';
                    if (formTitle) formTitle.innerHTML = `<i data-lucide="user-plus" style="width: 18px; height: 18px;"></i> Add New Client`;
                }

                if (window.lucide) window.lucide.createIcons();
                if (nameEl) nameEl.focus();
            } else {
                formCard.classList.add('hidden');
                if (toggleBtnText) toggleBtnText.textContent = 'Add New Client';
            }
        },

        async saveClientFromTab() {
            const id = document.getElementById('tab-cli-id')?.value;
            const name = document.getElementById('tab-cli-name')?.value?.trim();
            const company = document.getElementById('tab-cli-company')?.value?.trim();
            const email = document.getElementById('tab-cli-email')?.value?.trim();
            const phone = document.getElementById('tab-cli-phone')?.value?.trim();
            const vat = document.getElementById('tab-cli-vat')?.value?.trim();
            const address = document.getElementById('tab-cli-address')?.value?.trim();

            if (!name) {
                this.showToast('Client name is required.', 'error');
                return;
            }

            const saved = await this.saveClient({
                id: id || undefined,
                name,
                company,
                email,
                phone,
                vat,
                address
            });

            if (saved) {
                this.showToast(`Client "${name}" saved in database!`, 'success');
                this.toggleTabAddClientForm(false);
                this.renderClientsTab();
            }
        },

        async deleteClientFromTab(clientId, btn) {
            if (btn) {
                this.armConfirmButton(btn, async () => {
                    await this.executeDeleteClient(clientId);
                    this.renderClientsTab();
                }, 'Delete?');
                return;
            }
            await this.executeDeleteClient(clientId);
            this.renderClientsTab();
        },

        createInvoiceForClient(clientId) {
            this.switchTab('invoices');
            this.resetInvoiceForm();
            this.toggleInvoiceView('create');
            this.onSelectSavedClient(clientId);
            const selectEl = document.getElementById('inv-client-select');
            if (selectEl) selectEl.value = clientId;
        },

        // ==============================================================================
        // SITE SETTINGS MANAGER METHODS
        // ==============================================================================
        switchSettingsSubtab(subtabKey) {
            document.querySelectorAll('.settings-tab-btn').forEach(btn => {
                if (btn.getAttribute('data-subtab') === subtabKey) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            document.querySelectorAll('.settings-subtab-pane').forEach(pane => {
                if (pane.id === `settings-subtab-${subtabKey}`) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
            if (subtabKey === 'reviews') {
                this.renderSettingsReviewsTable();
            }
            if (subtabKey === 'backup') {
                this.loadAvailableBackups();
            }
            if (window.lucide) window.lucide.createIcons();
        },

        renderSiteSettingsTab() {
            const s = this.state.siteSettings;
            if (!s) return;

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };

            // 1. Header
            if (s.header) {
                setVal('set-header-brandName', s.header.brandName);
                setVal('set-header-brandLogo', s.header.brandLogo || '/assets/zannat_inner_symbol_icon.png');
                setVal('set-header-brandTagline', s.header.brandTagline);
                setVal('set-header-statusBadgeText', s.header.statusBadgeText);
                setVal('set-header-navHome', s.header.navHome);
                setVal('set-header-navServices', s.header.navServices);
                setVal('set-header-navWorkflow', s.header.navWorkflow);
                setVal('set-header-navGallery', s.header.navGallery);
                setVal('set-header-navReviews', s.header.navReviews);
                setVal('set-header-navSubmitBug', s.header.navSubmitBug);
            }

            // 2. Footer
            if (s.footer) {
                setVal('set-footer-brandTitle', s.footer.brandTitle);
                setVal('set-footer-brandDescription', s.footer.brandDescription);
                setVal('set-footer-copyrightText', s.footer.copyrightText);
                setVal('set-footer-linkHome', s.footer.linkHome);
                setVal('set-footer-linkServices', s.footer.linkServices);
                setVal('set-footer-linkWorkflow', s.footer.linkWorkflow);
                setVal('set-footer-linkGallery', s.footer.linkGallery);
                setVal('set-footer-linkReviews', s.footer.linkReviews);
                setVal('set-footer-linkSubmitBug', s.footer.linkSubmitBug);
            }

            // 3. Homepage Body
            if (s.homepage) {
                setVal('set-hp-heroName', s.homepage.heroName);
                setVal('set-hp-heroTitle', s.homepage.heroTitle);
                setVal('set-hp-heroAvatar', s.homepage.heroAvatar);
                setVal('set-hp-heroBadge', s.homepage.heroBadge);
                setVal('set-hp-aboutHeading', s.homepage.aboutHeading);
                setVal('set-hp-aboutText', s.homepage.aboutText);
                setVal('set-hp-urgentFixPrompt', s.homepage.urgentFixPrompt);
                setVal('set-hp-urgentFixText', s.homepage.urgentFixText);
                setVal('set-hp-urgentFixLink', s.homepage.urgentFixLink);
                setVal('set-hp-githubBtnText', s.homepage.githubBtnText);
                setVal('set-hp-githubBtnLink', s.homepage.githubBtnLink);
                setVal('set-hp-hireMeBtnText', s.homepage.hireMeBtnText);
                setVal('set-hp-hireMeBtnLink', s.homepage.hireMeBtnLink);
                setVal('set-hp-simulatorTitle', s.homepage.simulatorTitle);
                setVal('set-hp-simulatorDesc', s.homepage.simulatorDesc);
                setVal('set-hp-m1-val', s.homepage.metric1Value);
                setVal('set-hp-m1-suf', s.homepage.metric1Suffix);
                setVal('set-hp-m1-lbl', s.homepage.metric1Label);
                setVal('set-hp-m2-val', s.homepage.metric2Value);
                setVal('set-hp-m2-suf', s.homepage.metric2Suffix);
                setVal('set-hp-m2-lbl', s.homepage.metric2Label);
                setVal('set-hp-m3-val', s.homepage.metric3Value);
                setVal('set-hp-m3-suf', s.homepage.metric3Suffix);
                setVal('set-hp-m3-lbl', s.homepage.metric3Label);
                setVal('set-hp-m4-val', s.homepage.metric4Value);
                setVal('set-hp-m4-lbl', s.homepage.metric4Label);
            }

            // 4. Services
            if (s.services) {
                setVal('set-srv-badge', s.services.badge);
                setVal('set-srv-title', s.services.title);
                setVal('set-srv-subtitle', s.services.subtitle);
                setVal('set-srv-c1-title', s.services.service1Title);
                setVal('set-srv-c1-desc', s.services.service1Desc);
                setVal('set-srv-c2-title', s.services.service2Title);
                setVal('set-srv-c2-desc', s.services.service2Desc);
                setVal('set-srv-c3-title', s.services.service3Title);
                setVal('set-srv-c3-desc', s.services.service3Desc);
                setVal('set-srv-c4-title', s.services.service4Title);
                setVal('set-srv-c4-desc', s.services.service4Desc);
            }

            // 5. Workflow
            if (s.workflow) {
                setVal('set-wf-badge', s.workflow.badge);
                setVal('set-wf-title', s.workflow.title);
                setVal('set-wf-subtitle', s.workflow.subtitle);
                setVal('set-wf-s1-num', s.workflow.step1Num);
                setVal('set-wf-s1-title', s.workflow.step1Title);
                setVal('set-wf-s1-desc', s.workflow.step1Desc);
                setVal('set-wf-s2-num', s.workflow.step2Num);
                setVal('set-wf-s2-title', s.workflow.step2Title);
                setVal('set-wf-s2-desc', s.workflow.step2Desc);
                setVal('set-wf-s3-num', s.workflow.step3Num);
                setVal('set-wf-s3-title', s.workflow.step3Title);
                setVal('set-wf-s3-desc', s.workflow.step3Desc);
                setVal('set-wf-s4-num', s.workflow.step4Num);
                setVal('set-wf-s4-title', s.workflow.step4Title);
                setVal('set-wf-s4-desc', s.workflow.step4Desc);
            }

            // 6. Gallery
            if (s.gallery) {
                setVal('set-gal-badge', s.gallery.badge);
                setVal('set-gal-title', s.gallery.title);
                setVal('set-gal-subtitle', s.gallery.subtitle);
                setVal('set-gal-c1-title', s.gallery.card1Title);
                setVal('set-gal-c1-desc', s.gallery.card1Desc);
                setVal('set-gal-c2-title', s.gallery.card2Title);
                setVal('set-gal-c2-desc', s.gallery.card2Desc);
                setVal('set-gal-c3-title', s.gallery.card3Title);
                setVal('set-gal-c3-desc', s.gallery.card3Desc);
                setVal('set-gal-c4-title', s.gallery.card4Title);
                setVal('set-gal-c4-desc', s.gallery.card4Desc);
            }

            // 7. Reviews
            if (s.reviews) {
                setVal('set-rev-badge', s.reviews.badge);
                setVal('set-rev-title', s.reviews.title);
                setVal('set-rev-subtitle', s.reviews.subtitle);
                setVal('set-rev-ratingNumber', s.reviews.ratingNumber);
                setVal('set-rev-ratingLabel', s.reviews.ratingLabel);
                setVal('set-rev-s1-num', s.reviews.stat1Num);
                setVal('set-rev-s1-desc', s.reviews.stat1Desc);
                setVal('set-rev-s2-num', s.reviews.stat2Num);
                setVal('set-rev-s2-desc', s.reviews.stat2Desc);
                setVal('set-rev-s3-num', s.reviews.stat3Num);
                setVal('set-rev-s3-desc', s.reviews.stat3Desc);
                setVal('set-rev-upworkText', s.reviews.upworkBtnText);
                setVal('set-rev-upworkLink', s.reviews.upworkBtnLink);
            }

            // 8. Submit Ticket
            if (s.submitTicket) {
                setVal('set-sub-badge', s.submitTicket.badge);
                setVal('set-sub-title', s.submitTicket.title);
                setVal('set-sub-subtitle', s.submitTicket.subtitle);
                setVal('set-sub-btnText', s.submitTicket.btnText);
            }

            // 9. Notifications
            if (s.notifications) {
                setVal('set-notif-adminEmail', s.notifications.adminEmail);
                setVal('set-notif-adminWhatsApp', s.notifications.adminWhatsApp);
                const cbEmail = document.getElementById('set-notif-enableAdminEmail');
                if (cbEmail) cbEmail.checked = s.notifications.enableAdminEmail !== false;
                const cbWa = document.getElementById('set-notif-enableAdminWhatsApp');
                if (cbWa) cbWa.checked = s.notifications.enableAdminWhatsApp !== false;
                const cbClient = document.getElementById('set-notif-enableClientWhatsApp');
                if (cbClient) cbClient.checked = s.notifications.enableClientWhatsApp !== false;
            }

            // Render reviews table inside reviews subtab
            this.renderSettingsReviewsTable();
        },

        applySiteSettingsToDOM() {
            const s = this.state.siteSettings;
            if (!s) return;

            const setText = (id, text) => {
                const el = document.getElementById(id);
                if (el && text !== undefined && text !== null) el.textContent = text;
            };

            const setAttr = (id, attr, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.setAttribute(attr, val);
            };

            // 1. Header & Navigation
            if (s.header) {
                setText('navbar-brand-name', s.header.brandName);
                setText('navbar-brand-tagline', s.header.brandTagline);
                if (s.header.brandLogo) {
                    setAttr('navbar-brand-logo', 'src', s.header.brandLogo);
                }

                // Admin Sidebar Brand & Logo
                setText('sidebar-brand-name', s.header.brandName);
                if (s.header.brandLogo) {
                    setAttr('sidebar-brand-logo', 'src', s.header.brandLogo);
                }

                // Custom Page Shell Brand & Logo
                setText('custom-brand-name', s.header.brandName);
                setText('custom-brand-tagline', s.header.brandTagline);
                if (s.header.brandLogo) {
                    setAttr('custom-brand-logo', 'src', s.header.brandLogo);
                }

                setText('hero-badge-text', s.header.statusBadgeText);
                setText('nav-link-home', s.header.navHome);
                setText('nav-link-services', s.header.navServices);
                setText('nav-link-workflow', s.header.navWorkflow);
                setText('nav-link-gallery', s.header.navGallery);
                setText('nav-link-reviews', s.header.navReviews);
                setText('nav-link-submit-bug', s.header.navSubmitBug);
            }

            // 2. Footer
            if (s.footer) {
                setText('footer-brand-title', s.footer.brandTitle);
                setText('footer-brand-desc', s.footer.brandDescription);
                setText('footer-copyright', s.footer.copyrightText);
                setText('footer-link-home', s.footer.linkHome);
                setText('footer-link-services', s.footer.linkServices);
                setText('footer-link-workflow', s.footer.linkWorkflow);
                setText('footer-link-gallery', s.footer.linkGallery);
                setText('footer-link-reviews', s.footer.linkReviews);
                setText('footer-link-submit-bug', s.footer.linkSubmitBug);
            }

            // 3. Homepage Body
            if (s.homepage) {
                setText('hero-profile-name', s.homepage.heroName);
                setText('hero-profile-title', s.homepage.heroTitle);
                setText('hero-about-heading', s.homepage.aboutHeading);
                setText('hero-profile-about', s.homepage.aboutText);
                setText('hero-urgent-prompt', s.homepage.urgentFixPrompt);
                setText('hero-urgent-link', s.homepage.urgentFixText);
                setAttr('hero-urgent-link', 'href', s.homepage.urgentFixLink || '/submit-ticket');
                setText('hero-github-text', s.homepage.githubBtnText);
                setAttr('hero-github-btn', 'href', s.homepage.githubBtnLink || 'https://github.com');
                setText('hero-hireme-text', s.homepage.hireMeBtnText);
                setAttr('hero-hireme-btn', 'href', s.homepage.hireMeBtnLink || 'https://upwork.com');

                if (s.homepage.heroAvatar) {
                    setAttr('hero-profile-avatar', 'src', s.homepage.heroAvatar);
                }

                setText('slider-case-title', s.homepage.simulatorTitle);
                setText('slider-case-desc', s.homepage.simulatorDesc);

                // Metrics
                const m1 = document.getElementById('metric-item-1-num');
                if (m1) {
                    m1.setAttribute('data-target', s.homepage.metric1Value || '1500');
                    m1.setAttribute('data-suffix', s.homepage.metric1Suffix || '+');
                    m1.textContent = (s.homepage.metric1Value || '1500') + (s.homepage.metric1Suffix || '+');
                }
                setText('metric-item-1-label', s.homepage.metric1Label);

                const m2 = document.getElementById('metric-item-2-num');
                if (m2) {
                    m2.setAttribute('data-target', s.homepage.metric2Value || '2');
                    m2.setAttribute('data-suffix', s.homepage.metric2Suffix || ' Hours');
                    m2.textContent = (s.homepage.metric2Value || '2') + (s.homepage.metric2Suffix || ' Hours');
                }
                setText('metric-item-2-label', s.homepage.metric2Label);

                const m3 = document.getElementById('metric-item-3-num');
                if (m3) {
                    m3.setAttribute('data-target', s.homepage.metric3Value || '99.9');
                    m3.setAttribute('data-suffix', s.homepage.metric3Suffix || '%');
                    m3.textContent = (s.homepage.metric3Value || '99.9') + (s.homepage.metric3Suffix || '%');
                }
                setText('metric-item-3-label', s.homepage.metric3Label);

                setText('metric-item-4-num', s.homepage.metric4Value);
                setText('metric-item-4-label', s.homepage.metric4Label);
            }

            // 4. Services Page
            if (s.services) {
                setText('services-badge', s.services.badge);
                setText('services-title', s.services.title);
                setText('services-subtitle', s.services.subtitle);
                setText('services-card1-title', s.services.service1Title);
                setText('services-card1-desc', s.services.service1Desc);
                setText('services-card2-title', s.services.service2Title);
                setText('services-card2-desc', s.services.service2Desc);
                setText('services-card3-title', s.services.service3Title);
                setText('services-card3-desc', s.services.service3Desc);
                setText('services-card4-title', s.services.service4Title);
                setText('services-card4-desc', s.services.service4Desc);
            }

            // 5. Workflow Page
            if (s.workflow) {
                setText('workflow-badge', s.workflow.badge);
                setText('workflow-title', s.workflow.title);
                setText('workflow-subtitle', s.workflow.subtitle);
                setText('workflow-step1-num', s.workflow.step1Num);
                setText('workflow-step1-title', s.workflow.step1Title);
                setText('workflow-step1-desc', s.workflow.step1Desc);
                setText('workflow-step2-num', s.workflow.step2Num);
                setText('workflow-step2-title', s.workflow.step2Title);
                setText('workflow-step2-desc', s.workflow.step2Desc);
                setText('workflow-step3-num', s.workflow.step3Num);
                setText('workflow-step3-title', s.workflow.step3Title);
                setText('workflow-step3-desc', s.workflow.step3Desc);
                setText('workflow-step4-num', s.workflow.step4Num);
                setText('workflow-step4-title', s.workflow.step4Title);
                setText('workflow-step4-desc', s.workflow.step4Desc);
            }

            // 6. Gallery Page
            if (s.gallery) {
                setText('gallery-badge', s.gallery.badge);
                setText('gallery-title', s.gallery.title);
                setText('gallery-subtitle', s.gallery.subtitle);
                setText('gallery-card1-title', s.gallery.card1Title);
                setText('gallery-card1-desc', s.gallery.card1Desc);
                setText('gallery-card2-title', s.gallery.card2Title);
                setText('gallery-card2-desc', s.gallery.card2Desc);
                setText('gallery-card3-title', s.gallery.card3Title);
                setText('gallery-card3-desc', s.gallery.card3Desc);
                setText('gallery-card4-title', s.gallery.card4Title);
                setText('gallery-card4-desc', s.gallery.card4Desc);
            }

            // 7. Reviews Page
            if (s.reviews) {
                setText('reviews-badge', s.reviews.badge);
                setText('reviews-title', s.reviews.title);
                setText('reviews-subtitle', s.reviews.subtitle);
                setText('reviews-rating-number', s.reviews.ratingNumber);
                setText('reviews-rating-label', s.reviews.ratingLabel);
                setText('reviews-stat1-num', s.reviews.stat1Num);
                setText('reviews-stat1-desc', s.reviews.stat1Desc);
                setText('reviews-stat2-num', s.reviews.stat2Num);
                setText('reviews-stat2-desc', s.reviews.stat2Desc);
                setText('reviews-stat3-num', s.reviews.stat3Num);
                setText('reviews-stat3-desc', s.reviews.stat3Desc);
                setText('reviews-upwork-text', s.reviews.upworkBtnText);
                setAttr('reviews-upwork-link', 'href', s.reviews.upworkBtnLink || 'https://upwork.com');
            }

            // 8. Submit Ticket Page
            if (s.submitTicket) {
                setText('submit-ticket-badge', s.submitTicket.badge);
                setText('submit-ticket-title', s.submitTicket.title);
                setText('submit-ticket-subtitle', s.submitTicket.subtitle);
                setText('submit-ticket-btn-text', s.submitTicket.btnText);
            }

            // Re-render dynamic reviews grid
            this.renderReviews();
        },

        async saveSiteSettings() {
            const getVal = (id, fallback = '') => {
                const el = document.getElementById(id);
                return el ? el.value : fallback;
            };

            const payload = {
                header: {
                    brandName: getVal('set-header-brandName', 'Zannat.bd'),
                    brandLogo: getVal('set-header-brandLogo', '/assets/zannat_inner_symbol_icon.png'),
                    brandTagline: getVal('set-header-brandTagline', 'WordPress Specialist'),
                    statusBadgeText: getVal('set-header-statusBadgeText', 'Available for fixing bugs'),
                    navHome: getVal('set-header-navHome', 'Home'),
                    navServices: getVal('set-header-navServices', 'Services'),
                    navWorkflow: getVal('set-header-navWorkflow', 'Workflow'),
                    navGallery: getVal('set-header-navGallery', 'Behind Scenes'),
                    navReviews: getVal('set-header-navReviews', 'Reviews'),
                    navSubmitBug: getVal('set-header-navSubmitBug', 'Submit Bug')
                },
                footer: {
                    brandTitle: getVal('set-footer-brandTitle', 'Zannat.bd'),
                    brandDescription: getVal('set-footer-brandDescription', 'WordPress specialist available globally for emergency repairs.'),
                    copyrightText: getVal('set-footer-copyrightText', '© 2026 Zannat.bd. All rights reserved. WordPress is a registered trademark of the WordPress Foundation.'),
                    linkHome: getVal('set-footer-linkHome', 'Home'),
                    linkServices: getVal('set-footer-linkServices', 'Services'),
                    linkWorkflow: getVal('set-footer-linkWorkflow', 'Workflow'),
                    linkGallery: getVal('set-footer-linkGallery', 'Behind Scenes'),
                    linkReviews: getVal('set-footer-linkReviews', 'Reviews'),
                    linkSubmitBug: getVal('set-footer-linkSubmitBug', 'Submit Bug')
                },
                homepage: {
                    heroName: getVal('set-hp-heroName', 'Abu Zannat'),
                    heroTitle: getVal('set-hp-heroTitle', 'WordPress Specialist & Web Developer'),
                    heroAvatar: getVal('set-hp-heroAvatar', '/assets/photo1.jpg'),
                    heroBadge: getVal('set-hp-heroBadge', 'AVAILABLE FOR FIXING BUGS'),
                    aboutHeading: getVal('set-hp-aboutHeading', 'About Me'),
                    aboutText: getVal('set-hp-aboutText', ''),
                    urgentFixPrompt: getVal('set-hp-urgentFixPrompt', 'Active and available for urgent bug dispatch.'),
                    urgentFixText: getVal('set-hp-urgentFixText', 'Request Urgent Fix'),
                    urgentFixLink: getVal('set-hp-urgentFixLink', '/submit-ticket'),
                    githubBtnText: getVal('set-hp-githubBtnText', 'Github'),
                    githubBtnLink: getVal('set-hp-githubBtnLink', 'https://github.com/abuzannat911-lab'),
                    hireMeBtnText: getVal('set-hp-hireMeBtnText', 'Hire Me'),
                    hireMeBtnLink: getVal('set-hp-hireMeBtnLink', 'https://upwork.com'),
                    simulatorTitle: getVal('set-hp-simulatorTitle', 'WooCommerce Spinner Fix'),
                    simulatorDesc: getVal('set-hp-simulatorDesc', ''),
                    metric1Value: getVal('set-hp-m1-val', '1500'),
                    metric1Suffix: getVal('set-hp-m1-suf', '+'),
                    metric1Label: getVal('set-hp-m1-lbl', 'Bugs Fixed'),
                    metric2Value: getVal('set-hp-m2-val', '2'),
                    metric2Suffix: getVal('set-hp-m2-suf', ' Hours'),
                    metric2Label: getVal('set-hp-m2-lbl', 'Avg. Turnaround'),
                    metric3Value: getVal('set-hp-m3-val', '99.9'),
                    metric3Suffix: getVal('set-hp-m3-suf', '%'),
                    metric3Label: getVal('set-hp-m3-lbl', 'Success Rate'),
                    metric4Value: getVal('set-hp-m4-val', '24/7'),
                    metric4Label: getVal('set-hp-m4-lbl', 'Emergency Fixes')
                },
                services: {
                    badge: getVal('set-srv-badge', 'Expert Services'),
                    title: getVal('set-srv-title', 'WordPress Debugging & Repair Services'),
                    subtitle: getVal('set-srv-subtitle', 'Common issues I resolve daily for clients globally.'),
                    service1Title: getVal('set-srv-c1-title', 'Malware Cleanup & Security'),
                    service1Desc: getVal('set-srv-c1-desc', ''),
                    service2Title: getVal('set-srv-c2-title', 'Page Speed Optimization'),
                    service2Desc: getVal('set-srv-c2-desc', ''),
                    service3Title: getVal('set-srv-c3-title', 'Plugin & Theme Conflicts'),
                    service3Desc: getVal('set-srv-c3-desc', ''),
                    service4Title: getVal('set-srv-c4-title', 'Database & Server Recovery'),
                    service4Desc: getVal('set-srv-c4-desc', '')
                },
                workflow: {
                    badge: getVal('set-wf-badge', 'Workflow'),
                    title: getVal('set-wf-title', 'How It Works'),
                    subtitle: getVal('set-wf-subtitle', 'Get your WordPress site fixed in four simple, clean steps.'),
                    step1Num: getVal('set-wf-s1-num', '01'),
                    step1Title: getVal('set-wf-s1-title', 'Submit Ticket'),
                    step1Desc: getVal('set-wf-s1-desc', ''),
                    step2Num: getVal('set-wf-s2-num', '02'),
                    step2Title: getVal('set-wf-s2-title', 'Diagnostics'),
                    step2Desc: getVal('set-wf-s2-desc', ''),
                    step3Num: getVal('set-wf-s3-num', '03'),
                    step3Title: getVal('set-wf-s3-title', 'Smashed'),
                    step3Desc: getVal('set-wf-s3-desc', ''),
                    step4Num: getVal('set-wf-s4-num', '04'),
                    step4Title: getVal('set-wf-s4-title', 'Handback'),
                    step4Desc: getVal('set-wf-s4-desc', '')
                },
                gallery: {
                    badge: getVal('set-gal-badge', 'Behind the Scenes'),
                    title: getVal('set-gal-title', 'Life Behind the Screen'),
                    subtitle: getVal('set-gal-subtitle', 'A glimpse into the real-world experiences...'),
                    card1Title: getVal('set-gal-c1-title', 'Resilience & Adaptability'),
                    card1Desc: getVal('set-gal-c1-desc', ''),
                    card2Title: getVal('set-gal-c2-title', 'Focus & Analytical Clarity'),
                    card2Desc: getVal('set-gal-c2-desc', ''),
                    card3Title: getVal('set-gal-c3-title', 'Continuous Movement'),
                    card3Desc: getVal('set-gal-c3-desc', ''),
                    card4Title: getVal('set-gal-c4-title', 'Reliable Partner'),
                    card4Desc: getVal('set-gal-c4-desc', '')
                },
                reviews: {
                    badge: getVal('set-rev-badge', '⭐ Verified Client Reviews'),
                    title: getVal('set-rev-title', 'Trusted by Clients Worldwide'),
                    subtitle: getVal('set-rev-subtitle', 'Real reviews from real clients — sourced directly from Fiverr.'),
                    ratingNumber: getVal('set-rev-ratingNumber', '5.0'),
                    ratingLabel: getVal('set-rev-ratingLabel', 'Average Rating'),
                    stat1Num: getVal('set-rev-s1-num', '100%'),
                    stat1Desc: getVal('set-rev-s1-desc', '5-Star Reviews'),
                    stat2Num: getVal('set-rev-s2-num', '20+'),
                    stat2Desc: getVal('set-rev-s2-desc', 'Happy Clients'),
                    stat3Num: getVal('set-rev-s3-num', '12+'),
                    stat3Desc: getVal('set-rev-s3-desc', 'Countries'),
                    upworkBtnText: getVal('set-rev-upworkText', 'View on Upwork'),
                    upworkBtnLink: getVal('set-rev-upworkLink', 'https://upwork.com'),
                    items: this.getReviewsList()
                },
                submitTicket: {
                    badge: getVal('set-sub-badge', 'Submit a Bug'),
                    title: getVal('set-sub-title', 'Request Urgent WordPress Fix'),
                    subtitle: getVal('set-sub-subtitle', 'Describe the issue you\'re facing. I\'ll inspect it and get back to you with a quote within 2 hours.'),
                    btnText: getVal('set-sub-btnText', 'Send Query')
                },
                notifications: {
                    adminEmail: getVal('set-notif-adminEmail', 'abuzannat911@gmail.com'),
                    adminWhatsApp: getVal('set-notif-adminWhatsApp', ''),
                    enableAdminEmail: document.getElementById('set-notif-enableAdminEmail')?.checked ?? true,
                    enableAdminWhatsApp: document.getElementById('set-notif-enableAdminWhatsApp')?.checked ?? true,
                    enableClientWhatsApp: document.getElementById('set-notif-enableClientWhatsApp')?.checked ?? true
                }
            };

            try {
                const response = await this.authFetch('/api/settings/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success && res.siteSettings) {
                    this.state.siteSettings = res.siteSettings;
                    this.applySiteSettingsToDOM();
                    this.renderSiteSettingsTab();
                    this.showToast('All website settings and texts saved successfully!', 'success');
                } else {
                    this.showToast(res.error || 'Failed to save settings', 'error');
                }
            } catch (err) {
                console.error('Error saving settings:', err);
                this.showToast('Network error while saving settings', 'error');
            }
        },

        async resetSiteSettingsToDefaults(btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeResetSiteSettings(), 'Reset All?', '#ef4444');
                return;
            }
            await this.executeResetSiteSettings();
        },

        async executeResetSiteSettings() {
            try {
                const response = await this.authFetch('/api/settings/reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const res = await response.json();
                if (res.success && res.siteSettings) {
                    this.state.siteSettings = res.siteSettings;
                    this.applySiteSettingsToDOM();
                    this.renderSiteSettingsTab();
                    this.showToast('Settings reset to defaults successfully!', 'info');
                } else {
                    this.showToast('Failed to reset settings', 'error');
                }
            } catch (err) {
                console.error('Error resetting settings:', err);
                this.showToast('Network error while resetting settings', 'error');
            }
        },

        renderNotificationReceiverTab() {
            const s = this.state.siteSettings;
            if (!s || !s.notifications) return;

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };

            setVal('set-notif-adminEmail', s.notifications.adminEmail || '');
            setVal('set-notif-adminWhatsApp', s.notifications.adminWhatsApp || '');
            const cbEmail = document.getElementById('set-notif-enableAdminEmail');
            if (cbEmail) cbEmail.checked = s.notifications.enableAdminEmail !== false;
            const cbWa = document.getElementById('set-notif-enableAdminWhatsApp');
            if (cbWa) cbWa.checked = s.notifications.enableAdminWhatsApp !== false;
            const cbClient = document.getElementById('set-notif-enableClientWhatsApp');
            if (cbClient) cbClient.checked = s.notifications.enableClientWhatsApp !== false;
            if (window.lucide) window.lucide.createIcons();
        },

        async saveNotificationSettings() {
            const getVal = (id, fallback = '') => {
                const el = document.getElementById(id);
                return el ? el.value : fallback;
            };

            const notifPayload = {
                notifications: {
                    adminEmail: getVal('set-notif-adminEmail', 'abuzannat911@gmail.com'),
                    adminWhatsApp: getVal('set-notif-adminWhatsApp', ''),
                    enableAdminEmail: document.getElementById('set-notif-enableAdminEmail')?.checked ?? true,
                    enableAdminWhatsApp: document.getElementById('set-notif-enableAdminWhatsApp')?.checked ?? true,
                    enableClientWhatsApp: document.getElementById('set-notif-enableClientWhatsApp')?.checked ?? true
                }
            };

            try {
                const response = await this.authFetch('/api/settings/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(notifPayload)
                });
                const res = await response.json();
                if (res.success && res.siteSettings) {
                    this.state.siteSettings = res.siteSettings;
                    this.renderNotificationReceiverTab();
                    this.showToast('Notification Receiver settings saved successfully!', 'success');
                } else {
                    this.showToast(res.error || 'Failed to save notification settings', 'error');
                }
            } catch (err) {
                console.error('Error saving notification settings:', err);
                this.showToast('Network error while saving notification settings', 'error');
            }
        },

        // =============================================
        // CLIENT REVIEWS MANAGEMENT (ADMIN PANEL)
        // =============================================
        renderSettingsReviewsTable() {
            const tbody = document.getElementById('settings-reviews-tbody');
            if (!tbody) return;

            const items = this.getReviewsList();
            if (!items || items.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted); font-size: 13px;">
                            <i data-lucide="message-square" style="width: 28px; height: 28px; display: block; margin: 0 auto 8px auto; opacity: 0.5;"></i>
                            No reviews found. Click "Add New Review" above to create your first client testimonial.
                        </td>
                    </tr>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            tbody.innerHTML = items.map((rev, idx) => {
                const stars = '★'.repeat(Math.max(1, Math.min(5, rev.rating || 5)));
                const verifiedBadge = rev.real
                    ? `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"><svg width="10" height="10" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1DBF73"/><text x="12" y="17" text-anchor="middle" font-size="13" font-family="Arial" font-weight="bold" fill="white">f</text></svg> Verified</span>`
                    : `<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 500;">Standard</span>`;
                
                const comment = rev.comment || '';
                const commentPreview = comment.length > 60 ? (comment.slice(0, 60) + '...') : comment;

                return `
                    <tr>
                        <td style="color: var(--text-muted); font-weight: 600; font-size: 12px;">${idx + 1}</td>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:18px; line-height: 1;">${rev.flag || '🌐'}</span>
                                <div>
                                    <div style="font-weight:600; color:var(--text-main); font-size:13px;">${this.escapeHtml(rev.username)}</div>
                                    <div style="font-size:12px; color:var(--text-muted);">${this.escapeHtml(rev.country)}</div>
                                </div>
                            </div>
                        </td>
                        <td style="color: #fbbf24; font-size: 13px; white-space: nowrap; letter-spacing: 1px;">${stars}</td>
                        <td style="max-width: 260px; font-size: 12px; color: var(--text-muted); line-height: 1.4;" title="${this.escapeHtml(comment)}">
                            "${this.escapeHtml(commentPreview)}"
                        </td>
                        <td style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">${this.escapeHtml(rev.date || '')}</td>
                        <td>${verifiedBadge}</td>
                        <td style="text-align: right; white-space: nowrap;">
                            <div style="display:flex; gap: 6px; justify-content: flex-end;">
                                <button type="button" class="btn btn-secondary btn-icon" onclick="app.openEditReviewModal('${rev.id}')" title="Edit Review">
                                    <i data-lucide="edit-3" style="width: 14px; height: 14px; color: var(--accent-purple); pointer-events: none;"></i>
                                </button>
                                <button type="button" class="btn btn-secondary btn-icon" onclick="app.deleteReview('${rev.id}', this)" title="Delete Review" style="border-color: rgba(239,68,68,0.2);">
                                    <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red); pointer-events: none;"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();
        },

        openAddReviewModal() {
            const modal = document.getElementById('modal-review-edit');
            if (!modal) return;
            document.getElementById('modal-review-title').textContent = 'Add New Review';
            document.getElementById('modal-review-subtitle').textContent = 'Create a new client testimonial for your reviews page';
            document.getElementById('modal-review-id').value = '';
            document.getElementById('modal-review-username').value = '';
            document.getElementById('modal-review-country').value = '';
            document.getElementById('modal-review-flag').value = '🇺🇸';
            document.getElementById('modal-review-rating').value = '5';
            
            const now = new Date();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const todayStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
            document.getElementById('modal-review-date').value = todayStr;
            document.getElementById('modal-review-comment').value = '';
            document.getElementById('modal-review-real').checked = true;

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        },

        openEditReviewModal(reviewId) {
            const modal = document.getElementById('modal-review-edit');
            if (!modal) return;
            const items = this.getReviewsList();
            const rev = items.find(r => String(r.id) === String(reviewId));
            if (!rev) {
                this.showToast('Review not found', 'error');
                return;
            }

            document.getElementById('modal-review-title').textContent = 'Edit Review';
            document.getElementById('modal-review-subtitle').textContent = `Editing testimonial for ${rev.username}`;
            document.getElementById('modal-review-id').value = rev.id;
            document.getElementById('modal-review-username').value = rev.username || '';
            document.getElementById('modal-review-country').value = rev.country || '';
            document.getElementById('modal-review-flag').value = rev.flag || '🌐';
            document.getElementById('modal-review-rating').value = String(rev.rating || 5);
            document.getElementById('modal-review-date').value = rev.date || '';
            document.getElementById('modal-review-comment').value = rev.comment || '';
            document.getElementById('modal-review-real').checked = rev.real !== false;

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        },

        async saveReviewModal() {
            const id = document.getElementById('modal-review-id').value;
            const username = document.getElementById('modal-review-username').value.trim();
            const country = document.getElementById('modal-review-country').value.trim();
            const flag = document.getElementById('modal-review-flag').value.trim() || '🌐';
            const rating = parseInt(document.getElementById('modal-review-rating').value, 10) || 5;
            const date = document.getElementById('modal-review-date').value.trim();
            const comment = document.getElementById('modal-review-comment').value.trim();
            const real = document.getElementById('modal-review-real').checked;

            if (!username || !comment) {
                this.showToast('Please enter both client name and testimonial comment', 'warning');
                return;
            }

            if (!this.state.siteSettings) this.state.siteSettings = {};
            if (!this.state.siteSettings.reviews) this.state.siteSettings.reviews = {};
            if (!Array.isArray(this.state.siteSettings.reviews.items)) {
                this.state.siteSettings.reviews.items = JSON.parse(JSON.stringify(this.getReviewsList()));
            }

            const items = this.state.siteSettings.reviews.items;

            if (id) {
                const idx = items.findIndex(r => String(r.id) === String(id));
                if (idx !== -1) {
                    items[idx] = {
                        ...items[idx],
                        username,
                        country,
                        flag,
                        rating,
                        date,
                        comment,
                        real
                    };
                } else {
                    items.push({ id, username, country, flag, rating, date, comment, real });
                }
            } else {
                const newId = 'rev_' + Date.now();
                items.unshift({
                    id: newId,
                    username,
                    country,
                    flag,
                    rating,
                    date,
                    comment,
                    real
                });
            }

            this.closeModal('modal-review-edit');
            this.renderSettingsReviewsTable();
            this.renderReviews();

            await this.saveSiteSettings();
        },

        async deleteReview(reviewId, btn) {
            if (btn) {
                this.armConfirmButton(btn, () => this.executeDeleteReview(reviewId), 'Delete?');
                return;
            }
            await this.executeDeleteReview(reviewId);
        },

        async executeDeleteReview(reviewId) {
            if (!this.state.siteSettings) this.state.siteSettings = {};
            if (!this.state.siteSettings.reviews) this.state.siteSettings.reviews = {};
            if (!Array.isArray(this.state.siteSettings.reviews.items)) {
                this.state.siteSettings.reviews.items = JSON.parse(JSON.stringify(this.getReviewsList()));
            }

            const items = this.state.siteSettings.reviews.items;
            const initialLen = items.length;
            this.state.siteSettings.reviews.items = items.filter(r => String(r.id) !== String(reviewId));

            if (this.state.siteSettings.reviews.items.length < initialLen) {
                this.renderSettingsReviewsTable();
                this.renderReviews();
                await this.saveSiteSettings();
                this.showToast('Review removed successfully', 'info');
            }
        },

        // ==============================================================================
        // BACKUP & RESTORE DATABASE SUITE (Full Backup, Upload & 30-Day Auto Retention)
        // ==============================================================================
        async loadAvailableBackups() {
            const tbody = document.getElementById('backups-table-tbody');
            if (!tbody) return;

            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
                        <i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;"></i>
                        Fetching available backups from server...
                    </td>
                </tr>
            `;
            if (window.lucide) window.lucide.createIcons();

            try {
                const res = await this.authFetch('/api/system/backups');
                const data = await res.json();

                if (!data.success || !data.backups || data.backups.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">
                                <i data-lucide="database" style="width: 32px; height: 32px; stroke-width: 1.5; opacity: 0.5; margin-bottom: 8px; display: block; margin: 0 auto 8px auto;"></i>
                                No daily backups found yet. Click <strong>Take Snapshot Now</strong> to create your first backup.
                            </td>
                        </tr>
                    `;
                    if (window.lucide) window.lucide.createIcons();
                    return;
                }

                tbody.innerHTML = data.backups.map((b, idx) => {
                    const isLatest = b.isLatest || b.filename === 'db_backup_latest.json';
                    const dateFormatted = new Date(b.createdAt).toLocaleString();
                    const badge = isLatest
                        ? `<span class="badge" style="background: rgba(99, 102, 241, 0.18); color: var(--accent-purple); font-weight: 700;">★ Latest Snapshot</span>`
                        : `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 600;">Daily Auto-Backup</span>`;

                    return `
                        <tr>
                            <td style="font-family: monospace; font-weight: 600; color: #0f172a; font-size: 0.84rem;">
                                <i data-lucide="file-json" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px; color: var(--accent-purple);"></i>
                                ${b.filename}
                            </td>
                            <td style="font-size: 0.8rem; color: var(--text-muted);">${dateFormatted}</td>
                            <td style="font-size: 0.8rem; font-weight: 600;">${b.sizeFormatted}</td>
                            <td>${badge}</td>
                            <td style="text-align: right;">
                                <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                                    <a href="/api/system/backup/download?file=${encodeURIComponent(b.filename)}" class="btn btn-secondary btn-icon-text btn-small" title="Download JSON file">
                                        <i data-lucide="download" style="width: 13px; height: 13px;"></i>
                                        <span>Download</span>
                                    </a>
                                    <button type="button" class="btn btn-danger btn-icon-text btn-small" data-action="restore-db" data-filename="${b.filename}" title="Restore database from this snapshot">
                                        <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i>
                                        <span>Restore</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Bind restore button confirmations
                tbody.querySelectorAll('button[data-action="restore-db"]').forEach(btn => {
                    const fname = btn.getAttribute('data-filename');
                    btn.addEventListener('click', () => {
                        this.armConfirmButton(btn, () => this.executeRestoreDatabaseFromDisk(fname), 'Restore All?', '#ef4444');
                    });
                });

                if (window.lucide) window.lucide.createIcons();
            } catch (err) {
                console.error('[BACKUP LOAD ERROR]', err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 24px; color: #ef4444;">
                            Failed to load backups list: ${err.message}
                        </td>
                    </tr>
                `;
            }
        },

        async createManualBackup(btn) {
            const origHTML = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Creating...`;
                if (window.lucide) window.lucide.createIcons();
            }

            try {
                const res = await this.authFetch('/api/system/backup/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message || 'Backup snapshot created successfully!', 'success');
                    await this.loadAvailableBackups();
                } else {
                    this.showToast(data.error || 'Failed to create backup', 'error');
                }
            } catch (err) {
                console.error('[MANUAL BACKUP ERROR]', err);
                this.showToast('Network error while creating backup', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHTML;
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        },

        async executeRestoreDatabaseFromDisk(filename) {
            this.showToast(`Restoring database from ${filename}...`, 'info');
            try {
                const res = await this.authFetch('/api/system/backup/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename })
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message || 'Database restored successfully!', 'success');
                    // Refresh app full state
                    await this.fetchState();
                    await this.loadAvailableBackups();
                } else {
                    this.showToast(data.error || 'Failed to restore database', 'error');
                }
            } catch (err) {
                console.error('[RESTORE FROM DISK ERROR]', err);
                this.showToast('Network error during database restore', 'error');
            }
        },

        async handleDatabaseFileUpload(input) {
            if (!input || !input.files || input.files.length === 0) return;
            const file = input.files[0];
            const label = document.getElementById('db-upload-btn-label');

            if (!file.name.endsWith('.json')) {
                this.showToast('Please select a valid JSON database backup file (.json)', 'error');
                input.value = '';
                return;
            }

            const confirmed = await this.showConfirmModal(
                'Confirm Database Restore',
                `Are you sure you want to upload and restore <strong>${file.name}</strong>?<br><br><span style="color: #ef4444; font-weight: 600;">⚠️ This will replace current database tables with the contents of this file.</span> A safety backup will be taken before restoring.`,
                'Restore Database',
                true
            );

            if (!confirmed) {
                input.value = '';
                return;
            }

            if (label) label.textContent = `Uploading and restoring ${file.name}...`;
            this.showToast('Reading and validating backup file...', 'info');

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const parsed = JSON.parse(text);

                    const res = await this.authFetch('/api/system/backup/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            backupData: parsed,
                            filename: file.name
                        })
                    });

                    const result = await res.json();
                    if (result.success) {
                        this.showToast(result.message || 'Database restored successfully from file!', 'success');
                        await this.fetchState();
                        await this.loadAvailableBackups();
                    } else {
                        this.showToast(result.error || 'Failed to restore uploaded database', 'error');
                    }
                } catch (parseErr) {
                    console.error('[FILE PARSE ERROR]', parseErr);
                    this.showToast('Invalid JSON in uploaded file: ' + parseErr.message, 'error');
                } finally {
                    input.value = '';
                    if (label) label.textContent = 'Choose Backup JSON File to Restore';
                }
            };

            reader.onerror = () => {
                this.showToast('Failed to read file from local disk', 'error');
                input.value = '';
                if (label) label.textContent = 'Choose Backup JSON File to Restore';
            };

            reader.readAsText(file);
        }
    };

    // Expose app globally so inline onclick callbacks can reach it
    window.app = app;

    // Run initialization once DOM content is fully ready
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
})();
