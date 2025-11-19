/**
 * Settings Configuration
 * Controls functional aspects of the application
 *
 * This file defines:
 * - Backend service URLs
 * - Feature flags
 * - AI chat configuration
 * - 3D model settings
 * - Asset preloading settings
 * - Navigation defaults
 * - Performance settings
 *
 * NOTE: Currently using Moon Tide's backend URLs.
 * These will be customizable per client via Store Printer portal.
 */

export const settings = {
    // ===== ENVIRONMENT =====
    environment: 'production', // 'development' | 'staging' | 'production'
    debug: false, // Enable verbose logging
    version: '11.0.12', // App version (from version.json)

    // ===== BACKEND SERVICES =====
    backend: {
        // AI Chat backend (Cloud Run)
        aiChatUrl: "https://reconciliation-backend-934410532991.us-central1.run.app",

        // Portal backend (for future client dashboard - NOT YET IMPLEMENTED)
        portalUrl: "https://your-portal-backend.run.app",

        // Stripe webhook URL (handled by backend)
        stripeWebhookUrl: "https://reconciliation-backend-934410532991.us-central1.run.app/stripe-webhook",

        // Other endpoints
        endpoints: {
            chat: "/chat",
            signFingerprint: "/sign-fingerprint",
            createCheckout: "/create-checkout-session",
            stripeWebhook: "/stripe-webhook",
        },
    },

    // ===== FEATURE FLAGS =====
    // Enable/disable features across the entire app
    features: {
        // Core features
        enableAI: true,              // AI chat assistant
        enableTTS: true,             // Text-to-speech for AI messages
        enable3DLogos: true,         // 3D rotating logos in chat bubbles
        enableCart: true,            // Shopping cart system
        enableCheckout: true,        // Checkout flow

        // DEPRECATED/DISABLED features
        enableAutoBooking: false,    // OLD booking flow - DISABLED ☠️
        enableBookingWizard: false,  // Multi-step booking wizard - DISABLED ☠️

        // NEW features
        enableProducts: true,        // Product catalog support
        enableServices: true,        // Service catalog support
        enableWorkshops: true,       // Workshop catalog support (legacy name for services)
        enableGuestCheckout: true,   // Allow checkout without account
        enableWishlist: false,       // Wishlist feature (future)
        enableReviews: false,        // Product/service reviews (future)
        enableLoyaltyProgram: false, // Loyalty rewards (future - account page has mockup)

        // UI features
        enableDarkMode: false,       // Dark mode toggle (future)
        enableAnimations: true,      // Enable UI animations
        enableSoundEffects: true,    // UI sound effects
        enableNotifications: false,  // Push notifications (future)

        // Admin features
        enableAdminPanel: false,     // Admin dashboard (future)
        enableAnalytics: false,      // Analytics tracking (future)
    },

    // ===== AI CHAT CONFIGURATION =====
    chat: {
        // Welcome message (shown on first load)
        welcomeMessage: "Welcome to <special>Your Digital Storefront</special>. I'm your AI assistant, here to help you discover amazing products and services.\n\nAsk me about our offerings, browse the menu, or let me guide you to what you're looking for. How can I help you today?",

        // AI model settings
        aiModel: "gemini-2.0-flash", // Model name
        maxTokens: 2000,             // Max tokens per response
        temperature: 0.7,            // Creativity (0.0-1.0)

        // UI settings
        enableTypingIndicator: true, // Show "..." while AI is thinking
        typingSpeed: 30,             // ms per character for typing animation
        enableSpecialTerms: true,    // Enable <special> term highlighting

        // Rate limiting
        maxMessagesPerMinute: 10,    // Prevent spam
        messageDelay: 500,           // ms delay between messages

        // Audio settings
        ttsEnabled: true,            // Text-to-speech available
        ttsAutoPlay: false,          // Auto-play TTS (false = user must click)
        ttsVoice: null,              // Specific voice (null = default)
    },

    // ===== 3D MODEL CONFIGURATION =====
    threeD: {
        // Current GLB model for chat message bubbles
        mainLogoModel: "/moon_logo_3d.glb",

        // Available GLB options (clients can choose from these)
        // In future, portal will let clients upload custom GLBs
        availableModels: [
            {
                id: "moon-logo",
                name: "Moon Logo",
                path: "/moon_logo_3d.glb",
                thumbnail: "/images/models/moon-thumb.jpg",
                price: 0, // Free (included)
                category: "default",
            },
            {
                id: "generic-cube",
                name: "Generic Cube",
                path: "/models/cube.glb",
                thumbnail: "/images/models/cube-thumb.jpg",
                price: 0, // Free (included)
                category: "default",
            },
            // Future: Custom models (paid feature)
            // {
            //     id: "custom-1",
            //     name: "Custom Model",
            //     path: "/models/custom.glb",
            //     price: 9900, // $99 in cents
            //     category: "custom",
            // },
        ],

        // Render settings
        renderSettings: {
            antialias: true,            // Smooth edges
            alpha: true,                // Transparent background
            pauseDuringModals: true,    // Pause 3D rendering when modal open (mobile optimization)
            autoRotate: true,           // Auto-rotate models
            rotationSpeed: 0.005,       // Rotation speed
            enableShadows: false,       // Shadows (performance impact)
        },

        // Performance settings
        performance: {
            maxInstances: 100,          // Max 3D logos in DOM before cleanup
            cleanupThreshold: 50,       // Start cleanup when this many instances
            enableUnifiedRenderLoop: true, // Use single render loop (prevents WebGL exhaustion)
        },
    },

    // ===== ASSET PRELOADING =====
    preload: {
        enabled: true,               // Enable image preloading
        delay: 1500,                 // ms delay before starting preload
        // Images will be dynamically built from other configs (see assets/images.js)
    },

    // ===== NAVIGATION =====
    navigation: {
        defaultRoute: "/chat",       // Where to redirect on /
        homeRoute: "/menu",          // Home/menu page
        loginRoute: "/Account",      // Login page (future)
        cartRoute: "/cart",          // Cart page (when created)
        checkoutRoute: "/checkout",  // Checkout page (when created)

        // Deep linking
        enableAutoBooking: false,    // Auto-start booking from ?book= param (DISABLED)
        enableAutoAddToCart: true,   // Auto-add to cart from ?add= param (NEW)
    },

    // ===== CART SETTINGS =====
    cart: {
        // Persistence
        persistCart: true,           // Save cart to localStorage
        cartStorageKey: 'storeCart', // localStorage key
        cartExpiryDays: 7,           // Days before cart expires

        // Limits
        maxItems: 99,                // Max quantity per item
        maxUniqueItems: 50,          // Max different items in cart

        // UI
        showCartBadge: true,         // Show item count on cart icon
        cartBadgePosition: 'top-right', // Badge position
    },

    // ===== CHECKOUT SETTINGS =====
    checkout: {
        // Payment provider
        paymentProvider: 'stripe',   // 'stripe' | 'paypal' | 'square' (only Stripe implemented)

        // Stripe
        stripePublicKey: null,       // Will be set by backend or config (future)
        stripeMode: 'test',          // 'test' | 'live'

        // Required fields
        requireEmail: true,
        requirePhone: true,
        requireAddress: true,

        // Guest checkout
        allowGuestCheckout: true,    // Allow checkout without account

        // Shipping
        requireShipping: false,      // Require shipping address (for physical products)
        shippingCalculation: 'flat', // 'flat' | 'calculated' | 'free'
        flatShippingRate: 0,         // Cents (if flat shipping)

        // Tax
        taxEnabled: false,           // Calculate tax (future)
        taxRate: 0.12,               // 12% (example - will be configurable)
    },

    // ===== DEVICE DETECTION =====
    deviceDetection: {
        enabled: true,               // Enable device fingerprinting
        debugMode: false,            // Log detection details

        // Fingerprint signature caching
        signatureCacheDuration: 120000, // 2 minutes in ms
    },

    // ===== SECURITY SETTINGS =====
    security: {
        // Session management
        sessionStorageKey: 'moonTideSessionId', // Will be renamed per store
        sessionExpiryHours: 24,      // Session duration

        // Rate limiting (handled by backend, these are frontend hints)
        rateLimitEnabled: true,
        maxRequestsPerMinute: 60,

        // CORS
        corsEnabled: true,           // Enable CORS headers
    },

    // ===== PERFORMANCE =====
    performance: {
        // Image optimization
        lazyLoadImages: true,        // Lazy load images
        imageQuality: 85,            // JPEG quality (0-100)

        // Code splitting
        enableCodeSplitting: false,  // Dynamic imports (future)

        // Caching
        enableServiceWorker: false,  // PWA support (future)
        cacheVersion: 'v1',          // Cache version for SW
    },

    // ===== ANALYTICS =====
    // (Future integration)
    analytics: {
        enabled: false,
        provider: null,              // 'google' | 'plausible' | 'fathom'
        trackingId: null,
        anonymizeIp: true,
        cookieConsent: false,        // Require cookie consent
    },

    // ===== ERROR HANDLING =====
    errorHandling: {
        showErrorDetails: false,     // Show technical error details to user
        logErrors: true,             // Log errors to console
        reportErrors: false,         // Send errors to backend (future)
    },

    // ===== ACCESSIBILITY =====
    accessibility: {
        enableKeyboardNav: true,     // Keyboard navigation
        enableScreenReader: true,    // Screen reader support
        enableHighContrast: false,   // High contrast mode (future)
        enableReducedMotion: false,  // Respect prefers-reduced-motion (future)
    },

    // ===== EXPERIMENTAL FEATURES =====
    // (For testing - not exposed to users yet)
    experimental: {
        enableAIProductRecommendations: false, // AI-powered product recommendations
        enableVirtualTryOn: false,   // AR/VR product preview (future)
        enableChatbotOrdering: false, // Order directly in chat (future)
        enableVoiceCommands: false,  // Voice control (future)
    },
};

// Export default
export default settings;
