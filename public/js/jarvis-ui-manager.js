// public/js/jarvis-ui-manager.js
// Manages Jarvis UI module lifecycle and rendering

// import servicesConfig from './config/services-config.js';
import moduleManager from './module-manager.js';

class JarvisUIManager {
    constructor() {
        this.moduleContainer = null;
        this.currentModule = null;
        this.modules = {}; // Cache loaded modules
        this.state = {}; // Shared state between modules
    }

    init() {
        console.log("🎭 Initializing Jarvis UI Manager...");
        this.moduleContainer = document.getElementById('moduleContainer');

        if (!this.moduleContainer) {
            console.error("❌ Module container not found!");
            return false;
        }

        console.log("✓ Jarvis UI Manager initialized");
        return true;
    }

    /**
     * Load and execute a Jarvis action
     */
    async loadAction(actionType, payload) {
        console.log(`🎯 Loading Jarvis action: ${actionType}`, payload);

        try {
            // Get the module handler
            const handler = this.getActionHandler(actionType);

            if (!handler) {
                console.error(`❌ No handler for action: ${actionType}`);
                this.showError(`Unknown action: ${actionType}`);
                return;
            }

            // Get the HTML content from the handler
            const moduleHtml = await handler.call(this, payload);

            if (moduleHtml) {
                // Track that a module is active
                this.currentModule = actionType;

                // Use moduleManager to open the module with payload for URL state
                // (it handles replacing any existing module without hash manipulation)
                moduleManager.openModule(actionType, moduleHtml, payload);

                // Attach event listeners for product and payment modules
                const uiModules = {
                    'SHOW_PRODUCT_SECTIONS': 'product-sections',
                    'SHOW_PRODUCT_STORE': 'product-store',
                    'SHOW_CART_CHECKOUT': 'cart-checkout',
                    'SHOW_STRIPE_CHECKOUT': 'stripe-checkout',
                    'SHOW_PAYMENT': 'stripe-checkout',
                    'SHOW_WORKSHOP_BOOKING': 'stripe-checkout',
                    'SHOW_ABOUT_FOUNDER': 'chrystal',
                    'SHOW_MOON_TIDE_VISION': 'musqueam',
                    'SHOW_CONTACT_INFO': 'contact',
                    'SHOW_DELETE_DATA': 'delete-data'
                };

                if (uiModules[actionType]) {
                    const moduleName = uiModules[actionType];
                    try {
                        const module = await import(`./ui-modules/modules/${moduleName}.js`);
                        // Call attachEventListeners after moduleManager renders
                        setTimeout(() => {
                            if (module.default.attachEventListeners) {
                                module.default.attachEventListeners(payload);
                            }
                        }, 0);
                    } catch (e) {
                        console.warn(`Could not attach listeners for ${moduleName}:`, e);
                    }
                }
            } else {
                console.warn(`Handler for ${actionType} did not return HTML content.`);
            }

        } catch (error) {
            console.error("❌ Error loading Jarvis action:", error);
            this.showError(`Failed to load ${actionType}`);
        }
    }

    /**
     * Get the handler function for an action type
     */
    getActionHandler(actionType) {
        const handlers = {
            'SHOW_CONTACT_FORM': this.showContactForm,
            'SHOW_WORKSHOP_DETAILS': this.showWorkshopDetails,
            'SHOW_CONFIRMATION': this.showConfirmation,
            'SHOW_PRODUCT_SECTIONS': this.showProductSections,
            'SHOW_PRODUCT_STORE': this.showProductStore,
            'SHOW_CART_CHECKOUT': this.showCartCheckout,
            'SHOW_STRIPE_CHECKOUT': this.showStripeCheckout,  // ← NEW: Independent Stripe checkout
            'SHOW_PAYMENT': this.showStripeCheckout,          // ← UNIFIED: Products AND workshops use new checkout
            'SHOW_WORKSHOP_BOOKING': this.showStripeCheckout, // ← DEPRECATED: Use SHOW_PAYMENT instead
            'SHOW_ABOUT_FOUNDER': this.showAboutFounder,
            'SHOW_MOON_TIDE_VISION': this.showMoonTideVision,
            'SHOW_CONTACT_INFO': this.showContactInfo,
            'SHOW_DELETE_DATA': this.showDeleteData
        };

        return handlers[actionType] || null;
    }

    /**
     * Generic showModule method for product modules
     * Usage: jarvisUI.showModule('product-sections', {})
     */
    async showModule(moduleName, payload = {}) {
        console.log(`[JarvisUI] Showing module: ${moduleName}`, payload);

        try {
            // Map module names to action types
            const moduleActionMap = {
                'product-sections': 'SHOW_PRODUCT_SECTIONS',
                'product-store': 'SHOW_PRODUCT_STORE',
                'cart-checkout': 'SHOW_CART_CHECKOUT'
            };

            const actionType = moduleActionMap[moduleName];
            if (actionType) {
                // Use loadAction which handles HTML rendering and moduleManager
                await this.loadAction(actionType, payload);
            } else {
                console.warn(`[JarvisUI] Unknown module: ${moduleName}`);
            }
        } catch (error) {
            console.error(`[JarvisUI] Error showing module ${moduleName}:`, error);
        }
    }

    /**
     * Show contact form module
     */
    async showContactForm(payload) {
        console.log("📧 Showing contact form...");

        const html = `
            <div class="jarvis-module contact-form-module">
                <div class="module-header">
                    <h3>📬 Get in Touch with Chrystal Sparrow</h3>
                    <p>We'd love to hear from you. Send us a message and we'll get back to you soon!</p>
                </div>

                <form id="contactForm" class="module-form">
                    <div class="form-group">
                        <label for="contactEmail">Your Email</label>
                        <input type="email" id="contactEmail" name="email" placeholder="you@example.com" required>
                        <span class="form-error" id="contactEmailError"></span>
                    </div>

                    <div class="form-group">
                        <label for="contactSubject">Subject</label>
                        <input type="text" id="contactSubject" name="subject" placeholder="What is this about?" required>
                        <span class="form-error" id="contactSubjectError"></span>
                    </div>

                    <div class="form-group">
                        <label for="contactMessage">Message</label>
                        <textarea id="contactMessage" name="message" placeholder="Tell us more..." rows="4" required></textarea>
                        <span class="form-error" id="contactMessageError"></span>
                    </div>

                    <div class="module-actions">
                        <button type="button" class="module-button continue" onclick="window.moduleManager.closeCurrentModule()">↓ Continue Chatting</button>
                        <button type="submit" class="module-button primary">Send Message</button>
                    </div>
                </form>
            </div>
        `;

        // Attach form handler AFTER the module is rendered by moduleManager
        // This function will be called by moduleManager after it renders the HTML
        setTimeout(() => {
            document.getElementById('contactForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactFormSubmit();
            });
        }, 0);

        return html;
    }

    /**
     * Handle contact form submission
     */
    handleContactFormSubmit() {
        console.log("📤 Submitting contact form...");

        const email = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        // Validate
        let isValid = true;

        if (!email || !this.isValidEmail(email)) {
            document.getElementById('contactEmailError').textContent = 'Valid email required';
            isValid = false;
        } else {
            document.getElementById('contactEmailError').textContent = '';
        }

        if (!subject) {
            document.getElementById('contactSubjectError').textContent = 'Subject required';
            isValid = false;
        } else {
            document.getElementById('contactSubjectError').textContent = '';
        }

        if (!message) {
            document.getElementById('contactMessageError').textContent = 'Message required';
            isValid = false;
        } else {
            document.getElementById('contactMessageError').textContent = '';
        }

        if (!isValid) return;

        // Show success
        this.showSuccess(`✨ Thank you! Your message has been sent.\n\n**From:** ${email}\n**Subject:** ${subject}\n\nWe'll get back to you shortly!`);

        // Close after delay
        setTimeout(() => this.closeCurrentModule(), 2000);
    }

    /**
     * Show independent Stripe checkout (NEW - NOT NESTED IN CHAT!)
     */
    async showStripeCheckout(payload = {}) {
        console.log("[JarvisUI] 💳 Loading INDEPENDENT Stripe checkout module...", payload);
        try {
            const module = await import('./ui-modules/modules/stripe-checkout.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] ❌ Error loading Stripe checkout:", error);
            this.showError("Failed to load payment checkout");
            return null;
        }
    }

    /**
     * Show workshop details
     */
    async showWorkshopDetails(payload) {
        console.log("ℹ️ Showing workshop details...", payload);

        const workshopId = payload.workshop_id || '';
        const workshop = payload.workshop_name || 'Workshop Details';

        const html = `
            <div class="jarvis-module workshop-details-module">
                <div class="module-header">
                    <h3>ℹ️ ${workshop}</h3>
                </div>

                <div class="module-content">
                    <p><strong>Duration:</strong> ${payload.duration || 'Contact for details'}</p>
                    <p><strong>Price:</strong> ${payload.price || 'Contact for pricing'}</p>
                    <p><strong>Format:</strong> ${payload.format || 'Contact for details'}</p>

                    <h4 style="margin-top: 20px; color: var(--accent-orange);">What's Included:</h4>
                    <ul>
                        <li>Expert facilitation from experienced practitioners</li>
                        <li>All materials provided</li>
                        <li>Inclusive, welcoming space</li>
                        <li>Connection to Indigenous traditions</li>
                    </ul>

                    <div class="info-box" style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-left: 4px solid #4a90e2; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #2c5aa0;">✨ <strong>Travel:</strong> A travel fee of $0.75/km applies for locations more than 25km away. Overnight accommodations (parking, room, board, meals) can be included in your quote.</p>
                    </div>
                </div>

                <div class="module-actions">
                    <button type="button" class="module-button continue" onclick="window.moduleManager.closeCurrentModule()">↓ Continue Chatting</button>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Show confirmation message
     */
    async showConfirmation(payload) {
        console.log("✅ Showing confirmation...", payload);

        const message = payload.message || 'Thank you for your booking! Your confirmation is being processed.';

        const html = `
            <div class="confirmation-module-premium">
                <!-- Animated Background Elements -->
                <div class="confirmation-bg-decoration"></div>

                <!-- Main Content Container -->
                <div class="confirmation-content-wrapper">
                    <!-- Animated Checkmark -->
                    <div class="confirmation-checkmark-container">
                        <svg class="confirmation-checkmark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle class="checkmark-circle" cx="50" cy="50" r="45" fill="none" stroke="#1E90FF" stroke-width="3"/>
                            <path class="checkmark-path" d="M 30 50 L 45 65 L 70 35" fill="none" stroke="#1E90FF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>

                    <!-- Confirmation Title -->
                    <h2 class="confirmation-title">Payment Successful!</h2>

                    <!-- Message Box -->
                    <div class="confirmation-message-box">
                        <p class="confirmation-message">${message}</p>
                    </div>

                    <!-- Info Card -->
                    <div class="confirmation-info-card">
                        <div class="info-item">
                            <span class="info-icon">📧</span>
                            <span class="info-text">Check your email for confirmation details</span>
                        </div>
                    </div>

                    <!-- Return Button -->
                    <button type="button" class="confirmation-return-btn" onclick="(() => { window.jarvisManager.resetAndClose(); })()">
                        <span>↓ Return to Chat</span>
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Show error message
     */
    showError(message) {
        const html = `
            <div class="jarvis-module error-module">
                <div class="module-header">
                    <h3>⚠️ Error</h3>
                </div>

                <div class="module-content" style="padding: 20px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px; color: #c62828;">
                    <p>${message}</p>
                </div>

                <div class="module-actions">
                    <button type="button" class="module-button continue" onclick="window.moduleManager.closeCurrentModule()">↓ Continue Chatting</button>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const html = `
            <div class="jarvis-module success-module">
                <div class="module-header">
                    <h3>✨ Success!</h3>
                </div>

                <div class="module-content" style="padding: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; color: #2e7d32; line-height: 1.6;">
                    ${message.split('\n').map(line => {
                        if (line.includes('**')) {
                            return '<p style="margin: 10px 0;">' + line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</p>';
                        }
                        return '<p style="margin: 10px 0;">' + line + '</p>';
                    }).join('')}
                </div>
            </div>
        `;

        return html;
    }



    /**
     * Close current module and return to chat - SINGLE VIEWPORT MODE
     * Triggers a render to show the last AI message
     */
    closeCurrentModule() {
        moduleManager.closeCurrentModule();
    }

    /**
     * Reset booking context and close module (after payment confirmation)
     * This clears all booking data and returns to a clean chat state
     */
    resetAndClose() {
        console.log("✅ PROCESSING SUCCESSFUL BOOKING (CORRECT STATE MANAGEMENT)...");

        // 1. Get final booking details BEFORE resetting.
        //    CRITICAL: Retrieve the actual workshop_name and participants from the
        //    conversationIntelligence store BEFORE it gets reset.
        const finalBookingState = window.conversationIntelligence?.state.booking || {};
        // Ensure workshopName is extracted correctly; provide intelligent fallbacks
        const workshopName = finalBookingState.workshop_name || finalBookingState.workshop_id || 'the selected workshop';
        const participants = finalBookingState.participants || 'your group'; // Ensure participant count is also passed

        console.log(`📋 Extracted booking data: ${workshopName}, ${participants} participants`);

        // 2. Instantly clean the UI of temporary elements.
        document.querySelector('.booking-image-boxes-wrapper')?.remove();
        moduleManager.closeCurrentModule(); // Use moduleManager to close

        // 3. Reset all business-logic data stores.
        if (window.smartMessageRenderer) window.smartMessageRenderer.resetState();
        if (window.conversationIntelligence) window.conversationIntelligence.reset(); // Reset AFTER data is extracted

        // 4. Dispatch the final, correct success message to the UI store.
        //    Pass the EXTRACTED workshopName and participants.
        if (window.portalStore) {
            window.portalStore.dispatch('showSuccessMessage', { workshopName, participants });
        }
    }

    /**
     * Show product sections modal
     */
    async showProductSections(payload = {}) {
        console.log("[JarvisUI] Loading product sections module...");
        try {
            const module = await import('./ui-modules/modules/product-sections.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading product sections:", error);
            this.showError("Failed to load products");
            return null;
        }
    }

    /**
     * Show product store module
     */
    async showProductStore(payload = {}) {
        console.log("[JarvisUI] Loading product store module...", payload);
        try {
            const module = await import('./ui-modules/modules/product-store.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading product store:", error);
            this.showError("Failed to load store");
            return null;
        }
    }

    /**
     * Show cart checkout module
     */
    async showCartCheckout(payload = {}) {
        console.log("[JarvisUI] Loading cart checkout module...", payload);
        try {
            const module = await import('./ui-modules/modules/cart-checkout.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading cart:", error);
            this.showError("Failed to load cart");
            return null;
        }
    }

    /**
     * Show About Founder biography module
     */
    async showAboutFounder(payload = {}) {
        console.log("[JarvisUI] Loading About Founder biography module...");
        try {
            const module = await import('./ui-modules/modules/chrystal.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading founder bio:", error);
            this.showError("Failed to load biography");
            return null;
        }
    }

    /**
     * Show Moon Tide Reconciliation vision and mission module
     */
    async showMoonTideVision(payload = {}) {
        console.log("[JarvisUI] Loading Moon Tide vision module...");
        try {
            const module = await import('./ui-modules/modules/musqueam.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading Moon Tide vision:", error);
            this.showError("Failed to load vision information");
            return null;
        }
    }

    /**
     * Show contact information module
     */
    async showContactInfo(payload = {}) {
        console.log("[JarvisUI] Loading contact info module...");
        try {
            const module = await import('./ui-modules/modules/contact.js');
            const html = await module.default.getHtml(payload);
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading contact info:", error);
            this.showError("Failed to load contact information");
            return null;
        }
    }

    /**
     * Show PII deletion request module
     */
    async showDeleteData(payload = {}) {
        console.log("[JarvisUI] Loading delete data module...");
        try {
            const module = await import('./ui-modules/modules/delete-data.js');
            const html = module.default.render();
            return html;
        } catch (error) {
            console.error("[JarvisUI] Error loading delete data module:", error);
            this.showError("Failed to load data deletion request form");
            return null;
        }
    }


    /**
     * Utility: Escape HTML special characters to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Utility: Validate email
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}

// Make it globally accessible
window.jarvisManager = new JarvisUIManager();

export default JarvisUIManager;