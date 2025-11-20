/**
 * ====================================================================
 * STRIPE CHECKOUT MODULE - INDEPENDENT FULL-SCREEN PAYMENT EXPERIENCE
 * ====================================================================
 *
 * This is a STANDALONE payment module that operates COMPLETELY INDEPENDENTLY
 * from the chat viewport. No CSS fighting. No viewport constraints.
 *
 * TRIGGERS:
 * - From cart-checkout.js: When user clicks "Proceed to Payment"
 * - From workshop booking: When user completes workshop selection
 *
 * FEATURES:
 * - True full-screen overlay (position: fixed, z-index: 10000)
 * - Handles BOTH cart products AND workshop bookings
 * - Unified Stripe Elements integration
 * - Clean, modern UI with proper mobile responsiveness
 * - NO dependencies on chat UI or .messages-container
 * - Displays workshop and product images from services-config
 */

import servicesConfig from '../../config/services-config.js';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Rp7gdRuBpQt4n9NyNv9RHiHf3QOmJdETL8Boyu7uC2YUKJUz2OIXXzgAN4h91WC2F21qhXHs7T2QUbDEGCEwMeg00bJbhDvn6';
const BACKEND_URL = 'https://reconciliation-backend-934410532991.us-central1.run.app';

const stripeCheckoutModule = {
    stripeInstance: null,
    elements: null,
    clientSecret: null,
    addressComplete: false,   // e.complete from AddressElement (billing address required)
    paymentComplete: false,   // e.complete from PaymentElement (card required)

    /**
     * Generate the HTML for the independent checkout overlay
     */
    async getHtml(payload = {}) {
        console.log('[StripeCheckout] 🎬 Generating checkout UI with payload:', payload);

        // Gather data from multiple sources
        const workshopData = window.conversationIntelligence?.state?.booking || {};
        const cartItems = window.cartStore ? window.cartStore.getItems() : [];

        const hasWorkshop = !!(workshopData.workshop_id && workshopData.participants);
        const hasProducts = cartItems.length > 0;

        // Calculate total
        const workshopCost = hasWorkshop ? (parseFloat(payload.total_cost?.replace(/[\$,]/g, '')) || 0) : 0;
        const productCost = hasProducts ? window.cartStore.getTotal() : 0;
        const totalCost = workshopCost + productCost;
        const formattedTotal = `$${totalCost.toFixed(2)}`;

        // Build order summary items
        let orderItemsHtml = '';

        if (hasWorkshop) {
            // --- START: GET WORKSHOP IMAGE FROM CONFIG ---
            const workshopImage = servicesConfig.getImagePath(workshopData.workshop_id);
            const imageElement = workshopImage
                ? `<img src="${workshopImage}" alt="${workshopData.workshop_name}" class="order-item-image" onerror="this.outerHTML='<div class=order-item-icon>🎓</div>'">`
                : `<div class="order-item-icon">🎓</div>`;
            // --- END: GET WORKSHOP IMAGE FROM CONFIG ---

            orderItemsHtml += `
                <div class="stripe-order-item">
                    ${imageElement}
                    <div class="order-item-details">
                        <div class="order-item-name">${workshopData.workshop_name || 'Workshop Registration'}</div>
                        <div class="order-item-meta">${workshopData.organization_type || 'Community'} • ${workshopData.participants || 'N/A'} participants</div>
                    </div>
                    <div class="order-item-price">$${workshopCost.toFixed(2)}</div>
                </div>
            `;
        }

        if (hasProducts) {
            cartItems.forEach(item => {
                const itemTotal = (item.price * item.quantity).toFixed(2);
                orderItemsHtml += `
                    <div class="stripe-order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-image" onerror="this.outerHTML='<div class=order-item-icon>📦</div>'">
                        <div class="order-item-details">
                            <div class="order-item-name">${item.name}</div>
                            <div class="order-item-meta">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
                        </div>
                        <div class="order-item-price">$${itemTotal}</div>
                    </div>
                `;
            });
        }

        // Generate the full-screen checkout HTML
        const html = `
            <div id="stripe-checkout-overlay" class="stripe-checkout-overlay">
                <div class="stripe-checkout-container">
                    <!-- Header -->
                    <div class="stripe-checkout-header">
                        <div class="stripe-header-left">
                            <h1 class="stripe-checkout-title">🌊 Secure Checkout</h1>
                            <p class="stripe-checkout-subtitle">Moon Tide Reconciliation</p>
                        </div>
                        <div class="stripe-header-right">
                            <button id="stripe-exit-booking-btn" class="stripe-exit-booking-btn" aria-label="Exit Booking Flow">
                                ← Exit Booking
                            </button>
                            <button id="stripe-close-btn" class="stripe-close-btn" aria-label="Close checkout">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="stripe-checkout-content">
                        <!-- Left Panel: Order Summary -->
                        <div class="stripe-order-summary">
                            <h2 class="stripe-section-title">
                                <i class="fas fa-shopping-bag"></i>
                                Order Summary
                            </h2>

                            <div class="stripe-order-items">
                                ${orderItemsHtml}
                            </div>

                            <div class="stripe-order-total">
                                <div class="order-total-row">
                                    <span>Subtotal</span>
                                    <span>$${totalCost.toFixed(2)}</span>
                                </div>
                                ${hasProducts ? `
                                <div class="order-total-row order-shipping">
                                    <span>Shipping</span>
                                    <span>Calculated at delivery</span>
                                </div>
                                ` : ''}
                                <div class="order-total-row order-total-final">
                                    <span>Total</span>
                                    <span class="total-amount">${formattedTotal}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel: Payment Form -->
                        <div class="stripe-payment-panel">
                            <h2 class="stripe-section-title">
                                <i class="fas fa-lock"></i>
                                Payment Details
                            </h2>

                            <form id="stripe-payment-form" class="stripe-payment-form">
                                <!-- CUSTOMER INFO SECTION -->
                                <div class="stripe-customer-info">
                                    <h4 class="stripe-customer-title">
                                        <i class="fas fa-user"></i>
                                        Your Information
                                    </h4>

                                    <input type="text" id="customer-name" placeholder="Full Name" required class="stripe-custom-input">
                                    <input type="email" id="customer-email" placeholder="Email Address" required class="stripe-custom-input">
                                    <input type="tel" id="customer-phone" placeholder="Phone Number" required class="stripe-custom-input">

                                    <!-- Terms & Conditions Checkbox -->
                                    <div class="stripe-terms-wrapper">
                                        <input type="checkbox" id="accept-terms" required>
                                        <label for="accept-terms">
                                            I agree to share my information for order fulfillment and communications.
                                            I have read and accept the
                                            <a href="/privacy-policy.html" target="_blank" class="stripe-policy-link">Privacy Policy</a>
                                        </label>
                                    </div>
                                </div>

                                <!-- PAYMENT SECTION -->
                                <div class="stripe-payment-section">
                                    <h3 class="stripe-section-title">
                                        <i class="fas fa-lock"></i>
                                        Payment Method
                                    </h3>

                                    <!-- Payment Element (Card Only) -->
                                    <div id="stripe-payment-element" class="stripe-element-container"></div>
                                </div>

                                <!-- Error Message -->
                                <div id="stripe-payment-error" class="stripe-error-message" style="display: none;"></div>

                                <!-- Submit Button -->
                                <button type="submit" id="stripe-submit-btn" class="stripe-submit-btn" disabled>
                                    <i class="fas fa-spinner fa-spin" id="stripe-loading-spinner" style="display: none;"></i>
                                    <span id="stripe-button-text">Pay ${formattedTotal}</span>
                                </button>

                                <!-- Security Badge -->
                                <div class="stripe-security-badge">
                                    <i class="fas fa-shield-alt"></i>
                                    Secured by Stripe • Your payment information is encrypted
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Attach event listeners and initialize Stripe
     */
    async attachEventListeners(payload = {}) {
        console.log('[StripeCheckout] 🔧 Attaching event listeners...');

        // Exit Booking button
        const exitBtn = document.getElementById('stripe-exit-booking-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.handleClose());
        }

        // Close button
        const closeBtn = document.getElementById('stripe-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.handleClose());
        }

        // ESC key to exit booking
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleClose();
            }
        };
        document.addEventListener('keydown', escHandler);
        // Store reference for cleanup
        this._escHandler = escHandler;

        // Initialize Stripe Elements
        await this.initializeStripe(payload);
    },

    /**
     * Initialize Stripe.js and Elements
     */
    async initializeStripe(payload) {
        console.log('[StripeCheckout] 💳 Initializing Stripe...');

        try {
            // Load Stripe.js if not already loaded
            if (!window.Stripe) {
                console.log('[StripeCheckout] Loading Stripe.js library...');
                await this.loadStripeScript();
            }

            // Create Stripe instance
            if (!this.stripeInstance) {
                this.stripeInstance = Stripe(STRIPE_PUBLISHABLE_KEY);
                console.log('[StripeCheckout] ✅ Stripe instance created');
            }

            // Prepare payload for backend
            const workshopData = window.conversationIntelligence?.state?.booking || {};
            const cartItems = window.cartStore ? window.cartStore.getItems() : [];

            const intentPayload = {
                workshop_id: workshopData.workshop_id || null,
                organization_type: workshopData.organization_type || null,
                participants: workshopData.participants || null,
                items: cartItems,
            };

            console.log('[StripeCheckout] 📤 Creating Payment Intent with payload:', intentPayload);

            // Create Payment Intent
            const response = await fetch(`${BACKEND_URL}/create-payment-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intentPayload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Backend error: ${response.status}`);
            }

            const { clientSecret, amount, currency } = await response.json();
            this.clientSecret = clientSecret;
            this.paymentAmount = amount;
            this.paymentCurrency = currency || 'cad';

            console.log('[StripeCheckout] ✅ Payment Intent created');

            // Initialize Elements
            this.elements = this.stripeInstance.elements({ clientSecret });

            const submitBtn = document.getElementById('stripe-submit-btn');

            // --- PAYMENT ELEMENT (Card Only) ---
            const paymentElement = this.elements.create('payment', {
                wallets: {
                    link: 'never',
                    applePay: 'auto',
                    googlePay: 'auto'
                }
            });
            paymentElement.mount('#stripe-payment-element');
            console.log('[StripeCheckout] ✅ Payment Element mounted (card only)');

            // Track payment completion
            paymentElement.on('change', (event) => {
                this.paymentComplete = event.complete;
                this.updateSubmitButton();
            });

            // Button starts disabled - user must complete address AND card
            if (submitBtn) {
                submitBtn.disabled = true;
            }

            // Attach form submit handler
            const form = document.getElementById('stripe-payment-form');
            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            // Attach event listeners to custom form fields to update button state
            const customFields = [
                document.getElementById('customer-name'),
                document.getElementById('customer-email'),
                document.getElementById('customer-phone'),
                document.getElementById('accept-terms')
            ];

            customFields.forEach(field => {
                if (field) {
                    field.addEventListener('input', () => this.updateSubmitButton());
                    field.addEventListener('change', () => this.updateSubmitButton());
                }
            });

        } catch (error) {
            console.error('[StripeCheckout] ❌ Stripe initialization failed:', error);
            this.showError(error.message || 'Failed to initialize payment form');
        }
    },

    /**
     * Load Stripe.js script dynamically
     */
    async loadStripeScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Stripe.js'));
            document.head.appendChild(script);
        });
    },

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        console.log('[StripeCheckout] 💰 Processing payment...');

        const submitBtn = document.getElementById('stripe-submit-btn');
        const spinner = document.getElementById('stripe-loading-spinner');
        const buttonText = document.getElementById('stripe-button-text');
        const errorDiv = document.getElementById('stripe-payment-error');

        // Disable button and show loading
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        buttonText.style.display = 'none';
        errorDiv.style.display = 'none';

        try {
            // Collect custom form data
            const customerName = document.getElementById('customer-name')?.value;
            const customerEmail = document.getElementById('customer-email')?.value;
            const customerPhone = document.getElementById('customer-phone')?.value;

            console.log('[StripeCheckout] 📋 Customer data collected:', { customerName, customerEmail, customerPhone });

            // Confirm payment with Stripe
            console.log('[StripeCheckout] 💳 Confirming payment with card...');

            const { error } = await this.stripeInstance.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: window.location.href.split('?')[0]
                    // Customer data is handled on success via handlePaymentSuccess()
                    // which stores it in Firestore
                },
                redirect: 'if_required',
            });

            if (error) {
                // Payment failed
                console.error('[StripeCheckout] ❌ Payment failed:', error.message);
                this.showError(error.message);
                submitBtn.disabled = false;
                spinner.style.display = 'none';
                buttonText.style.display = 'inline-block';
            } else {
                // Payment succeeded!
                console.log('[StripeCheckout] ✅ Payment successful!');
                this.handlePaymentSuccess();
            }
        } catch (err) {
            console.error('[StripeCheckout] ❌ Payment error:', err);
            this.showError(err.message || 'An unexpected error occurred');
            submitBtn.disabled = false;
            spinner.style.display = 'none';
            buttonText.style.display = 'inline-block';
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('stripe-payment-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    },

    /**
     * Update submit button disabled state based on form completion
     */
    updateSubmitButton() {
        const submitBtn = document.getElementById('stripe-submit-btn');
        if (!submitBtn) return;

        // Check custom form fields
        const nameField = document.getElementById('customer-name');
        const emailField = document.getElementById('customer-email');
        const phoneField = document.getElementById('customer-phone');
        const termsCheckbox = document.getElementById('accept-terms');

        const customFieldsComplete =
            nameField?.value?.trim() &&
            emailField?.value?.trim() &&
            phoneField?.value?.trim() &&
            termsCheckbox?.checked;

        // Button enabled when ALL fields are complete: custom form + card payment
        const allComplete = customFieldsComplete && this.paymentComplete;
        submitBtn.disabled = !allComplete;

        console.log(`[StripeCheckout] 📋 Form state: customFields=${customFieldsComplete}, card=${this.paymentComplete}, button=${allComplete ? 'enabled' : 'disabled'}`);
    },

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess() {
        console.log('[StripeCheckout] 🎉 Payment successful. Calling orchestrator endpoint...');

        // 📋 STEP 1: GATHER ONLY THE DATA THE BACKEND DOESN'T KNOW
        // The backend will fetch the full financial details from Stripe itself
        const stripePaymentId = this.clientSecret?.split('_secret_')[0] || '';
        const nameField = document.getElementById('customer-name');
        const emailField = document.getElementById('customer-email');
        const phoneField = document.getElementById('customer-phone');
        const workshopData = window.conversationIntelligence?.state?.booking || {};

        const frontendPayload = {
            stripePaymentId: stripePaymentId,
            name: nameField?.value?.trim() || '',
            email: emailField?.value?.trim() || '',
            phone: phoneField?.value?.trim() || '',
            items: window.cartStore ? window.cartStore.getItems() : [],
            workshopId: workshopData.workshop_id || null,
            workshopDetails: {
                workshop_name: workshopData.workshop_name || '',
                organization_type: workshopData.organization_type || '',
                participants: workshopData.participants || 0,
                requested_date: workshopData.requested_date || '',
                requested_time: workshopData.requested_time || ''
            }
        };

        console.log('[StripeCheckout] 📤 Payload to orchestrator:', {
            stripePaymentId: frontendPayload.stripePaymentId,
            name: frontendPayload.name,
            email: frontendPayload.email,
            phone: frontendPayload.phone,
            workshopId: frontendPayload.workshopId
        });

        // ✅ STEP 2: MAKE A SINGLE CALL TO THE MOON BACKEND ORCHESTRATOR
        // The orchestrator will:
        // 1. Fetch full transaction details from Stripe (including fees)
        // 2. Create the "Golden Record"
        // 3. Write to both MOON and Portal Firestores
        if (frontendPayload.name && frontendPayload.email && frontendPayload.phone) {
            const MOON_BACKEND_URL = "https://reconciliation-backend-934410532991.us-central1.run.app";

            try {
                console.log('[StripeCheckout] 📡 Making orchestrator request...');
                const orchestratorResponse = await fetch(`${MOON_BACKEND_URL}/record-and-distribute-transaction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(frontendPayload)
                });

                if (orchestratorResponse.ok) {
                    const result = await orchestratorResponse.json();
                    console.log('[StripeCheckout] ✅ Orchestrator SUCCESS:', {
                        status: result.status,
                        message: result.message
                    });
                } else {
                    console.error('[StripeCheckout] ⚠️ Orchestrator returned error:', orchestratorResponse.statusText);
                    const errorBody = await orchestratorResponse.text();
                    console.error('[StripeCheckout]    Error body:', errorBody);
                }
            } catch (err) {
                console.error('[StripeCheckout] ⚠️ CRITICAL: Network call to orchestrator failed:', err);
                // Note: We don't fail the checkout experience even if the API call fails
                // The user has completed payment successfully, and we'll handle the data write retry later
            }
        } else {
            console.warn('[StripeCheckout] ⚠️ Missing customer data (name, email, or phone), skipping orchestrator call');
        }

        // --- End of Orchestrator Call ---

        // 🧹 STEP 3: CLEAN UP UI (IMMEDIATELY - DON'T WAIT FOR BACKEND)
        // Clear cart if products were purchased
        if (window.cartStore && window.cartStore.getItems().length > 0) {
            window.cartStore.clearCart();
        }

        // Close checkout
        this.handleClose();

        // Show confirmation message to user
        if (window.jarvisManager) {
            window.jarvisManager.loadAction('SHOW_CONFIRMATION', {
                message: '✨ Payment Successful!\n\nThank you for your order. You will receive a confirmation email shortly.',
            });
        }

        // Reset booking state
        if (window.conversationIntelligence) {
            window.conversationIntelligence.reset();
        }
    },

    /**
     * Close checkout and return to previous view by triggering the full booking cancellation flow.
     * This correctly resets state, cleans up UI, and displays a cancellation message to the user.
     */
    handleClose() {
        console.log('[StripeCheckout] 🚪 Closing checkout and triggering booking cancellation flow...');

        // Clean up event listeners specific to this module
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null; // Prevent memory leaks
        }

        // CRITICAL FIX: Call the high-level exit function instead of just closing the module.
        // This function correctly handles state reset, UI cleanup, and displaying the cancellation message.
        if (window.smartMessageRenderer && typeof window.smartMessageRenderer.exitBookingFlow === 'function') {
            console.log('[StripeCheckout] ✓ Calling exitBookingFlow to properly reset booking state');
            window.smartMessageRenderer.exitBookingFlow();
        } else {
            // Fallback in case the renderer isn't available (should not happen in production)
            console.error('[StripeCheckout] ❌ Cannot find exitBookingFlow function! Closing module directly as fallback.');
            if (window.moduleManager) {
                window.moduleManager.closeCurrentModule();
            }
        }
    },
};

export default stripeCheckoutModule;
