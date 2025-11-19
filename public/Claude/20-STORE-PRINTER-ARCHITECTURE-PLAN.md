# STORE PRINTER ARCHITECTURE - TRANSFORMATION PLAN

**Project**: STORE-FRONTEND (formerly MOON-FRONTEND)
**Goal**: Transform bespoke Moon Tide app into multi-tenant "Store Printer" platform
**Date**: November 19, 2025
**Investigator**: Claude AI (Sonnet 4.5)
**Status**: PLANNING PHASE

---

## Executive Summary

This document outlines the complete architectural transformation from a hardcoded Moon Tide Reconciliation storefront into a **configurable, multi-tenant platform** where clients can create custom stores via a backend portal.

### Vision: The "Store Printer"

**Future Workflow**:
1. Client logs into Admin Portal
2. Fills out store configuration form (brand, colors, services/products, content)
3. Portal backend generates `store_config_client123.json`
4. STORE-FRONTEND loads, fetches client config, and renders custom store
5. Client has a fully branded storefront in minutes

### Current Phase Goals:
1. Extract ALL hardcoded data into config files
2. Make frontend 100% data-driven from configs
3. Replace Moon Tide content with "Your Store Here" placeholders
4. **Kill the booking flow** - replace with cart-based checkout
5. Prepare for future backend integration

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Config File Architecture](#config-file-architecture)
3. [Major Architectural Changes](#major-architectural-changes)
4. [Implementation Roadmap](#implementation-roadmap)
5. [File-by-File Transformation Guide](#file-by-file-transformation-guide)
6. [Testing Strategy](#testing-strategy)
7. [Future Backend Integration](#future-backend-integration)

---

## Current State Analysis

### Hardcoded Data Locations (Problems)

| File | Hardcoded Data | Impact |
|------|---------------|--------|
| `workshop-data.js` | 12 workshops, prices, descriptions | HIGH - Core product catalog |
| `smart-message-renderer.js` | DUPLICATE workshop registry (lines 19-160) | CRITICAL - Duplication bug |
| `services-config.js` | Image paths, service metadata | HIGH - Asset management |
| `portal-controller.js` | Backend URL, branding in welcome message | HIGH - Core app logic |
| `mobile.html` / `desktop.html` | Meta tags, titles, inline styles | MEDIUM - SEO and styling |
| All HTML files | Inline `<style>` blocks with colors/fonts | HIGH - Theming nightmare |
| `menu-mobile.html` | Hardcoded navigation links | MEDIUM - Navigation structure |
| `shona-*.html` | Founder profile content | LOW - Page-specific content |
| `moon-tide-*.html` | About Us content | LOW - Page-specific content |
| `contact-*.html` | Contact info, email addresses | HIGH - Client-specific data |

### Current System Strengths (Keep These!)

✅ **Modular ES6 Architecture** - Clean separation of concerns
✅ **Device Detection** - Firebase Cloud Functions routing
✅ **Asset Preloader** - Performance optimization
✅ **3D Render System** - Unified loop prevents WebGL exhaustion
✅ **State Management** - Centralized stores (portal-store, cart-store, app-store)
✅ **URL Cleanup** - Clean URLs via client-side rewriting

### Critical Issue: BOOKING FLOW IS DEAD

**Problem**: The current booking flow in `smart-message-renderer.js` is:
- Workshop-specific (not for products/generic services)
- Tightly coupled to AI conversation
- Multi-step wizard (org type → participants → date → checkout)
- **Does NOT fit a product store or self-service checkout**

**Solution**: KILL IT. Replace with:
- **Add to Cart** buttons everywhere
- Unified **Cart System** (services + workshops + products)
- Single **Checkout Flow** (like Shopify/WooCommerce)
- AI stays separate (context-driven recommendations only)

---

## Config File Architecture

### Proposed Hierarchy

```
public/js/config/
├── index.js                    # Master config loader/aggregator
├── core/
│   ├── theme.js               # Colors, fonts, CSS variables
│   ├── brand.js               # Company name, logos, meta tags
│   └── settings.js            # Backend URLs, GLB paths, feature flags
├── content/
│   ├── pages.js               # Static page content (about, founder, etc.)
│   ├── services.js            # Service catalog (workshops, consulting, etc.)
│   ├── products.js            # Physical/digital products catalog
│   └── navigation.js          # Menu structure, links
├── assets/
│   ├── images.js              # All image path mappings
│   ├── models.js              # 3D GLB model options
│   └── audio.js               # Audio file paths (future)
└── pricing/
    ├── stripe-config.js       # Stripe account IDs, webhook URLs
    └── tax-shipping.js        # Tax rates, shipping rules (future)
```

### Config File Details

#### 1. `core/theme.js` - Visual Identity

```javascript
export const theme = {
    // Primary brand colors
    colors: {
        primary: '#1E90FF',          // Main brand color
        primaryDark: '#0047AB',      // Dark variant
        accent: '#FFD700',           // Accent/CTA color
        accentHover: '#FFC700',      // Hover state
        textPrimary: '#1a1a1a',      // Body text
        textSecondary: '#555',       // Secondary text
        textLight: '#FFFFFF',        // Light text
        background: '#F5F1E8',       // Page background
        surface: '#FFFFFF',          // Card backgrounds
        border: '#E0E0E0',           // Borders
        success: '#50C878',          // Success states
        error: '#E63E54',            // Error states
        warning: '#FFD700',          // Warning states
    },

    // Typography
    fonts: {
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        mono: "'Courier New', monospace",
    },

    // Spacing scale
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
    },

    // Border radius
    radius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        full: '9999px',
    },

    // Shadows
    shadows: {
        sm: '0 2px 4px rgba(0,0,0,0.1)',
        md: '0 4px 8px rgba(0,0,0,0.15)',
        lg: '0 8px 16px rgba(0,0,0,0.2)',
    },
};
```

#### 2. `core/brand.js` - Company Information

```javascript
export const brand = {
    // Company identity
    companyName: "Your Brand Here",
    tagline: "A Modern Digital Storefront",
    description: "Experience a live demo of a custom-built, AI-powered digital storefront.",

    // Contact information
    contact: {
        name: "Jane Doe",
        title: "Founder & Visionary",
        email: "contact@yourbrand.com",
        phone: "(555) 555-5555",
        address: {
            street: "123 Main Street",
            city: "Your City",
            province: "Your Province",
            postal: "A1A 1A1",
            country: "Canada",
        },
    },

    // Visual assets
    logos: {
        main: "/images/placeholders/logo.png",
        mainAlt: "/images/placeholders/logo-white.png",
        favicon: "🛍️",
        ogImage: "/images/placeholders/storefront-og.png",
    },

    // SEO/Meta tags
    meta: {
        title: "Your Custom Storefront | Powered by AI",
        titleTemplate: "%s | Your Brand", // %s = page title
        description: "A live demo of a custom-built, AI-powered digital storefront. Secure, intelligent, and beautifully designed for your business.",
        keywords: ["custom storefront", "e-commerce", "AI assistant", "digital store"],
        siteUrl: "https://yourbrand.com",
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterHandle: "@yourbrand",
    },

    // Social media links
    social: {
        facebook: "https://facebook.com/yourbrand",
        instagram: "https://instagram.com/yourbrand",
        twitter: "https://twitter.com/yourbrand",
        linkedin: "https://linkedin.com/company/yourbrand",
    },

    // Legal
    legal: {
        businessNumber: "123456789RT0001",
        privacyPolicyUrl: "/privacy-policy",
        termsOfServiceUrl: "/terms",
    },
};
```

#### 3. `core/settings.js` - Functional Configuration

```javascript
export const settings = {
    // Backend services
    backend: {
        aiChatUrl: "https://your-ai-backend.run.app",
        portalUrl: "https://your-portal-backend.run.app",
        stripeWebhookUrl: "https://your-backend.run.app/stripe-webhook",
    },

    // Feature flags
    features: {
        enableAI: true,
        enableTTS: true,
        enable3DLogos: true,
        enableCart: true,
        enableCheckout: true,
        enableAutoBooking: false,  // OLD BOOKING FLOW - DISABLED
        enableProducts: true,       // NEW
        enableServices: true,       // NEW
        enableGuestCheckout: true,
    },

    // AI Chat configuration
    chat: {
        welcomeMessage: "Welcome to <special>Your Digital Storefront</special>. I'm your AI assistant. Ask me about our services, products, or anything else!",
        aiModel: "gemini-2.0-flash",
        maxTokens: 2000,
        temperature: 0.7,
        enableTypingIndicator: true,
    },

    // 3D Model configuration
    threeD: {
        // Current GLB for chat message bubbles
        mainLogoModel: "/moon_logo_3d.glb",

        // Available GLB options (future: clients can choose)
        availableModels: [
            {
                id: "moon-logo",
                name: "Moon Logo",
                path: "/moon_logo_3d.glb",
                thumbnail: "/images/models/moon-thumb.jpg",
                price: 0, // Free/included
            },
            {
                id: "generic-cube",
                name: "Generic Cube",
                path: "/models/cube.glb",
                thumbnail: "/images/models/cube-thumb.jpg",
                price: 0, // Free/included
            },
            // Future: Custom models (paid feature)
        ],

        // Render settings
        renderSettings: {
            antialias: true,
            alpha: true,
            pauseDuringModals: true,
        },
    },

    // Asset preloading
    preload: {
        delay: 1500, // ms
        // Images will be dynamically built from other configs
    },

    // Navigation
    navigation: {
        defaultRoute: "/chat",
        homeRoute: "/menu",
    },
};
```

#### 4. `content/services.js` - Service Catalog (REPLACES workshop-data.js)

```javascript
export const services = {
    'service-001': {
        id: 'service-001',
        type: 'service', // 'service' | 'workshop' | 'consultation'
        name: 'Premium Service Package',
        shortName: 'Premium Service',
        slug: 'premium-service',
        emoji: '🌟',
        icon: 'fas fa-star',

        // Descriptions
        description: 'Our top-tier service offering with comprehensive features.',
        longDescription: `This is a longer description with multiple paragraphs.

        It can include markdown-style formatting that will be rendered on detail pages.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'fixed',  // 'fixed' | 'per_person' | 'variable' | 'quote'
            currency: 'CAD',
            community: 39900,  // in cents
            corporate: 49900,  // in cents
            displayPrice: '$499 (Corporate) / $399 (Community)',
        },

        // Details
        duration: 'Monthly Subscription',
        participants: {
            min: 1,
            max: 999,
            recommended: '1-5',
        },
        location: 'Virtual or On-Site',

        // Visual assets
        image: '/images/services/service-001.jpg',
        gallery: [
            '/images/services/service-001-1.jpg',
            '/images/services/service-001-2.jpg',
        ],

        // SEO
        keywords: ['premium', 'service', 'package', 'comprehensive'],
        metaTitle: 'Premium Service Package - Your Brand',
        metaDescription: 'Our top-tier service offering with comprehensive features.',

        // Features/highlights
        highlights: [
            '24/7 Support',
            'Dedicated Account Manager',
            'Custom Integration',
            'Priority Queue',
            'Advanced Analytics',
        ],

        // What's included
        included: [
            'Feature A',
            'Feature B',
            'Feature C',
        ],

        // CTA
        ctaText: 'Add to Cart',
        ctaUrl: null, // null = use cart system

        // Availability
        available: true,
        featured: true,
        comingSoon: false,

        // Related services
        related: ['service-002', 'service-003'],

        // Categories/tags
        categories: ['premium', 'enterprise'],
        tags: ['popular', 'recommended'],
    },

    'service-002': {
        // ... another service
    },

    // PLACEHOLDER DATA (6 services for demo)
    // In future, this entire object will be generated by backend
};
```

#### 5. `content/products.js` - Product Catalog (NEW)

```javascript
export const products = {
    'product-001': {
        id: 'product-001',
        type: 'physical', // 'physical' | 'digital' | 'subscription'
        sku: 'PROD-001',
        name: 'Example Product',
        slug: 'example-product',

        // Descriptions
        description: 'A wonderful physical product.',
        longDescription: `Full product description here.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'fixed',
            currency: 'CAD',
            price: 2999, // $29.99 in cents
            compareAtPrice: 3999, // $39.99 (strikethrough price)
            displayPrice: '$29.99',
            salePrice: null,
            onSale: false,
        },

        // Inventory
        inventory: {
            tracked: true,
            quantity: 100,
            allowBackorder: false,
            lowStockThreshold: 10,
        },

        // Shipping
        shipping: {
            required: true,
            weight: 500, // grams
            dimensions: {
                length: 10, // cm
                width: 10,
                height: 5,
            },
        },

        // Visual assets
        image: '/images/products/product-001.jpg',
        gallery: [],

        // Variants (future)
        variants: [],

        // SEO
        keywords: ['product', 'example'],

        // Availability
        available: true,
        featured: false,

        // Categories
        categories: ['physical-goods'],
        tags: ['new-arrival'],
    },

    // Future: Hundreds of products
};
```

#### 6. `content/pages.js` - Static Page Content

```javascript
export const pageContent = {
    // About Us page
    about: {
        title: "About Your Company",
        subtitle: "Our Mission & Vision",
        hero: {
            image: "/images/pages/about-hero.jpg",
            text: "Building the future of digital commerce",
        },
        sections: [
            {
                id: "mission",
                heading: "Our Mission",
                body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
                image: "/images/pages/mission.jpg",
            },
            {
                id: "vision",
                heading: "Our Vision",
                body: "Sed do eiusmod tempor incididunt ut labore...",
                image: "/images/pages/vision.jpg",
            },
            {
                id: "values",
                heading: "Our Values",
                body: "Ut enim ad minim veniam, quis nostrud exercitation...",
                values: [
                    { title: "Integrity", description: "We do what's right." },
                    { title: "Innovation", description: "We embrace change." },
                    { title: "Excellence", description: "We strive for quality." },
                    { title: "Community", description: "We support each other." },
                ],
            },
        ],
    },

    // Founder page
    founder: {
        name: "Jane Doe",
        title: "Founder & CEO",
        image: "/images/pages/founder.jpg",
        bio: "Jane Doe is a visionary entrepreneur...",
        longBio: `Longer biography with multiple paragraphs.

        Can include career highlights, achievements, etc.`,
        quote: "\"Building something meaningful is my passion.\"",
        stats: [
            { label: "Years Experience", value: "10+" },
            { label: "Clients Served", value: "500+" },
            { label: "Team Members", value: "25" },
        ],
        social: {
            linkedin: "https://linkedin.com/in/janedoe",
            twitter: "https://twitter.com/janedoe",
        },
    },

    // Contact page
    contact: {
        heading: "Get In Touch",
        subheading: "We'd love to hear from you",
        email: "contact@yourbrand.com",
        phone: "(555) 555-5555",
        address: {
            street: "123 Main Street",
            city: "Your City",
            province: "Your Province",
            postal: "A1A 1A1",
        },
        hours: {
            weekdays: "9:00 AM - 5:00 PM",
            weekends: "Closed",
        },
        mapEmbed: null, // Google Maps embed URL
    },

    // Home/Menu page
    menu: {
        heading: "Explore Your Store",
        subheading: "Discover what we offer",
        items: [
            { label: "AI Chat", route: "/chat", icon: "💬" },
            { label: "Services", route: "/workshops", icon: "🎓" },
            { label: "Products", route: "/products", icon: "🛍️" },
            { label: "About Us", route: "/moon-tide", icon: "🌊" },
            { label: "Contact", route: "/contact", icon: "📞" },
            { label: "Account", route: "/Account", icon: "👤" },
        ],
    },
};
```

#### 7. `assets/images.js` - Image Path Registry

```javascript
// Auto-generated from other configs (brand, services, products, pages)
export const images = {
    // Brand images
    logo: "/images/placeholders/logo.png",
    logoWhite: "/images/placeholders/logo-white.png",
    ogImage: "/images/placeholders/storefront-og.png",

    // Service images (mapped from services.js)
    services: {
        'service-001': "/images/services/service-001.jpg",
        // ... auto-populated
    },

    // Product images
    products: {
        'product-001': "/images/products/product-001.jpg",
        // ... auto-populated
    },

    // Page images
    pages: {
        aboutHero: "/images/pages/about-hero.jpg",
        founder: "/images/pages/founder.jpg",
        // ... auto-populated
    },

    // Placeholders
    placeholders: {
        service: "/images/placeholders/service.jpg",
        product: "/images/placeholders/product.jpg",
        person: "/images/placeholders/person.jpg",
    },
};

// Helper function to get all unique image paths for preloading
export function getAllImagePaths() {
    const paths = [];

    // Flatten all image objects
    Object.values(images).forEach(value => {
        if (typeof value === 'string') {
            paths.push(value);
        } else if (typeof value === 'object') {
            Object.values(value).forEach(path => {
                if (typeof path === 'string') paths.push(path);
            });
        }
    });

    return [...new Set(paths)]; // Remove duplicates
}
```

#### 8. `config/index.js` - Master Config Loader

```javascript
// Master config aggregator
import { theme } from './core/theme.js';
import { brand } from './core/brand.js';
import { settings } from './core/settings.js';
import { services } from './content/services.js';
import { products } from './content/products.js';
import { pageContent } from './content/pages.js';
import { images, getAllImagePaths } from './assets/images.js';

// Export everything in one place
export const appConfig = {
    theme,
    brand,
    settings,
    services,
    products,
    pages: pageContent,
    images,
};

// Helper function: Get all images for preloading
export function getPreloadImages() {
    return getAllImagePaths();
}

// Helper: Generate page title
export function getPageTitle(pageTitle) {
    return brand.meta.titleTemplate.replace('%s', pageTitle);
}

// Helper: Get service by ID
export function getService(id) {
    return services[id] || null;
}

// Helper: Get product by ID
export function getProduct(id) {
    return products[id] || null;
}

// Helper: Get all services as array
export function getAllServices() {
    return Object.values(services);
}

// Helper: Get featured services
export function getFeaturedServices() {
    return Object.values(services).filter(s => s.featured);
}

// Helper: Get available services
export function getAvailableServices() {
    return Object.values(services).filter(s => s.available);
}

// Export individual configs for direct import
export { theme, brand, settings, services, products, pageContent as pages, images };

// Default export
export default appConfig;
```

---

## Major Architectural Changes

### 1. KILL THE BOOKING FLOW ☠️

**Current System** (`smart-message-renderer.js`):
- Lines 19-160: Duplicate workshop registry
- Multi-step booking wizard (workshop → org type → participants → date → checkout)
- Tightly coupled to AI conversation
- Only works for workshops

**New System** (Cart-Based):
1. **Add to Cart** buttons on all service/product pages
2. Cart icon in header (shows item count)
3. Unified cart page (cart-desk.html, cart-mobile.html)
4. Single checkout flow (checkout-desk.html, checkout-mobile.html)
5. AI provides recommendations but doesn't control booking

**Implementation**:
- Delete booking flow code from `smart-message-renderer.js`
- Create `js/cart-system.js` (add/remove items, update quantities)
- Create `js/checkout-flow.js` (form validation, Stripe integration)
- Update `cart-store.js` to handle services AND products
- Create cart HTML pages
- Create checkout HTML pages

### 2. Unified Service/Product/Workshop System

**Problem**: Currently duplicated data in:
- `workshop-data.js` (12 workshops with full details)
- `smart-message-renderer.js` (duplicate registry)
- `services-config.js` (image mappings)

**Solution**: Single source of truth in `content/services.js`

**Migration Path**:
1. Copy data from `workshop-data.js` into new `content/services.js` format
2. Delete `workshop-data.js`
3. Delete workshop registry from `smart-message-renderer.js`
4. Update `workshop-loader.js` to import from `content/services.js`
5. Update all components to use new config

### 3. CSS Theme System

**Problem**: 10+ HTML files with duplicate inline `<style>` blocks containing hardcoded colors

**Solution**: CSS Variables + Theme Injector

**Implementation**:
1. Create `js/theme-injector.js`:
   ```javascript
   import { theme } from './config/core/theme.js';

   export function injectTheme() {
       const root = document.documentElement;

       // Inject color variables
       Object.entries(theme.colors).forEach(([name, value]) => {
           root.style.setProperty(`--color-${name}`, value);
       });

       // Inject font variables
       root.style.setProperty('--font-body', theme.fonts.body);
       root.style.setProperty('--font-heading', theme.fonts.heading);

       // Inject spacing
       Object.entries(theme.spacing).forEach(([name, value]) => {
           root.style.setProperty(`--spacing-${name}`, value);
       });

       console.log('✅ Theme injected - CSS variables ready');
   }
   ```

2. Load theme-injector FIRST in every HTML file:
   ```html
   <script type="module">
       import { injectTheme } from './js/theme-injector.js';
       injectTheme();
   </script>
   ```

3. Replace all hardcoded colors in CSS:
   ```css
   /* Before */
   background: #1E90FF;
   color: #1a1a1a;

   /* After */
   background: var(--color-primary);
   color: var(--color-textPrimary);
   ```

### 4. Content Loader System

**Problem**: Static text hardcoded in HTML files

**Solution**: Dynamic content injection via JavaScript

**Implementation**:
1. Create `js/content-loader.js`:
   ```javascript
   import { brand, pages } from './config/index.js';

   export function loadPageContent(pageName) {
       // Load brand info
       document.title = brand.meta.title;

       // Update meta tags
       const ogTitle = document.querySelector('meta[property="og:title"]');
       if (ogTitle) ogTitle.setAttribute('content', brand.meta.title);

       // Load page-specific content
       if (pageName && pages[pageName]) {
           const content = pages[pageName];
           // Populate elements by ID
           Object.keys(content).forEach(key => {
               const el = document.getElementById(`content-${key}`);
               if (el) el.textContent = content[key];
           });
       }

       console.log('✅ Page content loaded from config');
   }
   ```

2. Update HTML structure:
   ```html
   <!-- Before -->
   <h1>Moon Tide Reconciliation</h1>

   <!-- After -->
   <h1 id="content-companyName"></h1>

   <script type="module">
       import { loadPageContent } from './js/content-loader.js';
       loadPageContent('home');
   </script>
   ```

### 5. Dynamic Image Loading

**Problem**: Hardcoded image paths scattered across files

**Solution**: Centralized image registry + dynamic loading

**Update**: `asset-preloader.js` to use config:
```javascript
import { getPreloadImages } from './config/index.js';
import assetPreloader from './asset-preloader.js';

// Automatically preload all images from config
const imagesToPreload = getPreloadImages();
assetPreloader.init(imagesToPreload);
```

---

## Implementation Roadmap

### Phase 1: Config Infrastructure (Week 1)

**Goal**: Create all config files with placeholder "Your Store Here" content

1. ✅ Create `config/` directory structure
2. ✅ Create all 8 config files (theme, brand, settings, services, products, pages, images, index)
3. ✅ Populate with placeholder data (6 services, 3 products, generic pages)
4. ✅ Create `theme-injector.js`
5. ✅ Create `content-loader.js`
6. ✅ Create `config/index.js` master loader

**Deliverable**: Config system ready, no app changes yet

### Phase 2: Core App Refactoring (Week 2-3)

**Goal**: Update main app files to use configs

1. **portal-controller.js**:
   - Import `brand` and `settings`
   - Replace hardcoded `BACKEND_URL` with `settings.backend.aiChatUrl`
   - Replace welcome message with `settings.chat.welcomeMessage`
   - Replace GLB path with `settings.threeD.mainLogoModel`

2. **smart-message-renderer.js**:
   - ☠️ **DELETE booking flow code** (lines 162-end)
   - ☠️ **DELETE duplicate workshop registry** (lines 19-160)
   - Import `services` from `config/index.js`
   - Keep only context-aware message rendering
   - Add "Add to Cart" button rendering

3. **workshop-loader.js**:
   - Import `services` instead of `workshopData`
   - Update all references

4. **workshop-data.js**:
   - ☠️ **DELETE THIS FILE** (replaced by `config/content/services.js`)

5. **services-config.js**:
   - Migrate image mappings to `config/assets/images.js`
   - ☠️ **DELETE THIS FILE**

6. **asset-preloader.js**:
   - Update to use `getPreloadImages()` from config

**Deliverable**: Core app using config system, booking flow removed

### Phase 3: HTML File Updates (Week 4)

**Goal**: Update all HTML files to use theme and content loaders

1. **Global Changes** (apply to ALL HTML files):
   - Add `theme-injector.js` script (load FIRST)
   - Replace inline colors with CSS variables
   - Add `content-loader.js` for dynamic content
   - Update meta tags to use `brand` config

2. **mobile.html / desktop.html** (Chat pages):
   - Update portal title to use `brand.companyName`
   - Update welcome message source
   - Update meta tags

3. **menu-mobile.html / menu-desk.html**:
   - Dynamic menu items from `pages.menu.items` config
   - Theme colors from CSS variables

4. **contact-mobile.html / contact-desk.html**:
   - Contact info from `brand.contact` config
   - Email, phone, address all dynamic

5. **shona-mobile.html / shona-desk.html** (Founder pages):
   - Content from `pages.founder` config
   - Change to generic "Founder Profile" template

6. **moon-tide-mobile.html / moon-tide-desk.html** (About pages):
   - Content from `pages.about` config
   - Change to generic "About Us" template

7. **workshop pages**:
   - Use `content/services.js` as data source
   - Add "Add to Cart" buttons (remove "Book Now")

**Deliverable**: All HTML files theme-aware and content-driven

### Phase 4: Cart & Checkout System (Week 5-6)

**Goal**: Build new cart-based e-commerce flow

1. **Create Cart System**:
   - `js/cart-system.js` - Core cart logic (add, remove, update, clear)
   - `js/cart-ui.js` - Cart UI components (mini cart, full cart page)
   - Update `cart-store.js` to handle services + products

2. **Create Cart Pages**:
   - `cart-mobile.html` - Mobile cart page
   - `cart-desk.html` - Desktop cart page
   - Line items, quantity controls, remove buttons
   - Subtotal, tax (future), total
   - "Proceed to Checkout" CTA

3. **Create Checkout Pages**:
   - `checkout-mobile.html` - Mobile checkout flow
   - `checkout-desk.html` - Desktop checkout flow
   - `js/checkout-flow.js` - Form validation, Stripe integration
   - Form sections: Contact info, billing, payment
   - Order summary sidebar
   - Stripe Elements integration

4. **Update Navigation**:
   - Add cart icon to header (all pages)
   - Cart badge showing item count
   - Link to cart page

5. **Update Service/Product Pages**:
   - Replace "Book Now" with "Add to Cart"
   - Quantity selector for products
   - "View Cart" action after adding

**Deliverable**: Full cart-based checkout system

### Phase 5: Products System (Week 7)

**Goal**: Add product catalog support (separate from services)

1. **Create Product Pages**:
   - `products-mobile.html` - Mobile product grid
   - `products-desk.html` - Desktop product grid
   - `product-detail-mobile.html` - Mobile product details
   - `product-detail-desk.html` - Desktop product details

2. **Create Product Loader**:
   - `js/product-loader.js` - Similar to workshop-loader
   - Loads from `config/content/products.js`
   - Populates product detail pages

3. **Integrate with Cart**:
   - Add to Cart from product pages
   - Inventory tracking
   - Variant support (future)

**Deliverable**: Product catalog live with cart integration

### Phase 6: Testing & Polish (Week 8)

**Goal**: Ensure everything works, fix bugs, optimize

1. **Testing Checklist**:
   - [ ] All pages load correctly
   - [ ] Theme variables apply correctly
   - [ ] Content loads from configs
   - [ ] Services display properly
   - [ ] Products display properly (if implemented)
   - [ ] Cart add/remove/update works
   - [ ] Checkout flow works (test mode)
   - [ ] Mobile responsive on all pages
   - [ ] Desktop looks good
   - [ ] Navigation works
   - [ ] Back button behavior
   - [ ] No console errors

2. **Performance Optimization**:
   - Minimize config file sizes
   - Optimize image loading
   - Check for duplicate code

3. **Documentation**:
   - Update Claude folder docs
   - Create config editing guide
   - Document cart system
   - Document checkout flow

**Deliverable**: Production-ready "Your Store Here" demo

---

## File-by-File Transformation Guide

### Files to DELETE ☠️

1. `public/js/workshop-data.js` - Replaced by `config/content/services.js`
2. `public/js/config/services-config.js` - Replaced by new config system
3. Outdated UI modules:
   - `public/js/ui-modules/modules/cart-checkout.js`
   - `public/js/ui-modules/modules/chrystal.js`
   - `public/js/ui-modules/modules/contact.js`
   - `public/js/ui-modules/modules/delete-data.js`
   - `public/js/ui-modules/modules/musqueam.js`
   - `public/js/ui-modules/modules/product-sections.js`
   - `public/js/ui-modules/modules/product-store.js`

### Files to IGNORE (Moon Tide Specific - Not for Next Client)

**Do NOT spend time configuring these - they won't be in template**:
1. `custom-creations-desk.html` / `custom-creations-mobile.html`
2. `downloads-desk.html` / `downloads-mobile.html`
3. `infinite-story-desk.html` / `infinite-story-mobile.html`
4. `podcasts-desk.html` / `podcasts-mobile.html`
5. `reconciliation-desk.html` / `reconciliation-mobile.html`
6. `world-desk.html` / `world-mobile.html`

### Files to CONFIGURE (Will be in Template)

**These become template pages with configurable content**:

1. **Chat Interface**:
   - `mobile.html` / `desktop.html`
   - `js/portal-controller.js`
   - `js/smart-message-renderer.js`

2. **Menu/Navigation**:
   - `menu-mobile.html` / `menu-desk.html`

3. **Services/Workshops**:
   - `workshops-mobile.html` / `workshops-desk.html` (Service Grid)
   - `workshop-list-mobile.html` / `workshop-list-desk.html` (Service List)
   - `workshop-detail-mobile.html` / `workshop-detail-desk.html` (Service Details)
   - `js/workshop-loader.js` → Rename to `service-loader.js`

4. **About Pages**:
   - `moon-tide-mobile.html` / `moon-tide-desk.html` → Generic "About Us"
   - `shona-mobile.html` / `shona-desk.html` → Generic "Founder Profile"

5. **Contact**:
   - `contact-mobile.html` / `contact-desk.html`

6. **Account**:
   - `account-mobile.html` / `account-desk.html`

7. **Utilities**:
   - `delete-data-mobile.html` / `delete-data-desk.html`
   - `developer-mobile.html` / `developer-desk.html`

### Files to CREATE (New for Template)

1. **Config System**:
   - `js/config/index.js`
   - `js/config/core/theme.js`
   - `js/config/core/brand.js`
   - `js/config/core/settings.js`
   - `js/config/content/services.js`
   - `js/config/content/products.js`
   - `js/config/content/pages.js`
   - `js/config/content/navigation.js`
   - `js/config/assets/images.js`
   - `js/config/assets/models.js`

2. **Theme System**:
   - `js/theme-injector.js`
   - `js/content-loader.js`

3. **Cart System**:
   - `js/cart-system.js`
   - `js/cart-ui.js`
   - `cart-mobile.html`
   - `cart-desk.html`

4. **Checkout**:
   - `js/checkout-flow.js`
   - `checkout-mobile.html`
   - `checkout-desk.html`

5. **Products**:
   - `products-mobile.html`
   - `products-desk.html`
   - `product-detail-mobile.html`
   - `product-detail-desk.html`
   - `js/product-loader.js`

6. **Documentation**:
   - `public/Claude/20-STORE-PRINTER-ARCHITECTURE-PLAN.md` (this file)
   - `public/Claude/21-CONFIG-SYSTEM-GUIDE.md`
   - `public/Claude/22-CART-CHECKOUT-SYSTEM.md`
   - `public/Claude/23-THEME-CUSTOMIZATION-GUIDE.md`

---

## Testing Strategy

### Unit Tests (Future - Not in Current Scope)

- Test config loaders
- Test cart system functions
- Test checkout validation

### Manual Testing Checklist

**After Each Phase**:

1. **Desktop Browser Test**:
   - Chrome, Firefox, Safari
   - All pages load
   - All features work
   - No console errors

2. **Mobile Device Test**:
   - iOS Safari (real device if possible)
   - Android Chrome
   - Responsive design works
   - Touch interactions work

3. **Config Test**:
   - Change a color in `theme.js` → Verify it applies
   - Change company name in `brand.js` → Verify it updates
   - Add a service in `services.js` → Verify it appears
   - Change logo in `brand.js` → Verify it loads

4. **Cart Test**:
   - Add service to cart
   - Add product to cart
   - Update quantities
   - Remove items
   - Clear cart
   - Navigate to checkout

5. **Checkout Test**:
   - Fill out form
   - Validate fields
   - Submit to Stripe (test mode)
   - Handle errors

6. **Navigation Test**:
   - All menu items work
   - Back button works
   - Deep links work
   - Clean URLs maintained

### Test Scenarios

1. **New Client Onboarding Simulation**:
   - Clone repo
   - Edit all config files with new client data
   - Run app
   - Verify everything reflects new client

2. **Theme Swap**:
   - Change primary color
   - Change fonts
   - Verify entire app updates

3. **Service Catalog Swap**:
   - Replace all services with new ones
   - Verify grid, detail pages, cart all work

---

## Future Backend Integration

### How Config System Connects to Portal Backend

**Current State** (After This Project):
- Frontend has ALL data in local config files
- Config files are manually edited
- Git-based deployment

**Future State** (Portal Backend Integration):

1. **Client Onboarding in Portal**:
   - Client fills out form in admin portal
   - Chooses theme colors (color picker)
   - Uploads logo
   - Enters services/products
   - Writes about page content

2. **Portal Backend Generates Config**:
   ```javascript
   // Portal backend endpoint
   POST /api/stores/generate-config

   // Takes client input, generates:
   {
       "client_id": "client_123",
       "config": {
           "theme": { /* colors, fonts */ },
           "brand": { /* name, logos, contact */ },
           "services": { /* catalog */ },
           // ... full config object
       }
   }

   // Saves to database
   // Returns config JSON
   ```

3. **Frontend Loads Config Dynamically**:
   ```javascript
   // On app load:
   // 1. Determine client (from subdomain or URL)
   // 2. Fetch config from backend
   const clientId = getClientIdFromUrl(); // e.g., from subdomain
   const config = await fetch(`/api/stores/${clientId}/config`);

   // 3. Override local configs with fetched config
   Object.assign(appConfig, config);

   // 4. Inject theme and render
   injectTheme();
   loadPageContent();
   ```

4. **Deployment Models**:
   - **Option A**: Multi-tenant (same codebase, different configs)
     - `client1.yourstoreplatform.com` → Loads config for client1
     - `client2.yourstoreplatform.com` → Loads config for client2

   - **Option B**: Per-client deployment
     - Portal builds custom package for each client
     - Deploys to Firebase Hosting
     - Custom domain per client

### Backend API Endpoints Needed (Future)

```
GET  /api/stores/:clientId/config       # Get store config
POST /api/stores/:clientId/config       # Update store config
GET  /api/stores/:clientId/services     # Get service catalog
POST /api/stores/:clientId/services     # Add service
PUT  /api/stores/:clientId/services/:id # Update service
GET  /api/stores/:clientId/products     # Get product catalog
POST /api/stores/:clientId/checkout     # Create Stripe checkout
POST /api/stores/:clientId/orders       # Create order
```

### Migration Path

**Phase 1** (Current Project):
- All configs local in frontend
- Manually edit files
- Git commit to deploy

**Phase 2** (Portal V1):
- Portal backend stores configs in database
- Frontend fetches config on load
- Still manual editing in portal UI

**Phase 3** (Portal V2):
- Portal has WYSIWYG editor
- Live preview
- One-click deploy
- Custom domain setup

**Phase 4** (Full SaaS):
- Client self-service onboarding
- Stripe Connect for payouts
- Analytics dashboard
- Template marketplace

---

## Critical Decisions & Trade-offs

### Decision 1: Kill Booking Flow vs. Adapt It

**Options**:
- **A**: Adapt booking flow to work with products
- **B**: Kill booking flow, use cart-based checkout

**Decision**: **B - Kill It**

**Rationale**:
- Booking flow is workshop-specific (org type, participants, date)
- Products don't need multi-step wizard
- Cart-based is universal (works for services, workshops, products)
- Easier for clients to understand
- Industry standard (Shopify, WooCommerce)

### Decision 2: Config File Format (JSON vs. JS)

**Options**:
- **A**: JSON files (`.json`)
- **B**: JavaScript modules (`.js`)

**Decision**: **B - JavaScript Modules**

**Rationale**:
- Can include comments
- Can include helper functions
- Easier to import/export
- Supports complex data structures
- Can be converted to JSON for backend later

### Decision 3: Theme System (Build-time vs. Runtime)

**Options**:
- **A**: Build-time CSS generation (SCSS variables)
- **B**: Runtime CSS variable injection

**Decision**: **B - Runtime Injection**

**Rationale**:
- No build step required
- Instant theme changes
- Works with Firebase Hosting (no server-side build)
- Can fetch theme from backend dynamically

### Decision 4: Image Management

**Options**:
- **A**: Keep images in frontend, paths in config
- **B**: Upload images to CDN, URLs in config

**Decision**: **A for now, B in future**

**Rationale**:
- Phase 1: Keep images in `/images/` folder, paths in config
- Future: Portal uploads to Cloud Storage, generates URLs
- Easy migration path (just update paths in config)

---

## Success Criteria

### Phase 1 Success (Config Infrastructure):
✅ All config files created
✅ Placeholder "Your Store Here" content
✅ Theme injector working
✅ Content loader working

### Phase 2 Success (Core Refactoring):
✅ Booking flow deleted
✅ App loads from configs
✅ No hardcoded data in JS files
✅ Workshop system uses config

### Phase 3 Success (HTML Updates):
✅ All HTML pages use theme variables
✅ All HTML pages use content loader
✅ "Your Brand Here" everywhere
✅ No "Moon Tide" references

### Phase 4 Success (Cart System):
✅ Cart add/remove/update works
✅ Cart UI renders correctly
✅ Checkout form validates
✅ Stripe integration works (test mode)

### Phase 5 Success (Products):
✅ Product grid displays
✅ Product details load
✅ Add to cart from products

### Final Success (Complete):
✅ **Complete "Your Store Here" demo**
✅ **Any client data can be swapped via configs**
✅ **No code changes needed to rebrand**
✅ **Cart-based checkout works end-to-end**
✅ **Mobile and desktop both work**
✅ **Documentation complete**

---

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Config Infrastructure | 1 week | 30 hours |
| Phase 2: Core Refactoring | 2 weeks | 60 hours |
| Phase 3: HTML Updates | 1 week | 30 hours |
| Phase 4: Cart & Checkout | 2 weeks | 60 hours |
| Phase 5: Products System | 1 week | 30 hours |
| Phase 6: Testing & Polish | 1 week | 30 hours |
| **TOTAL** | **8 weeks** | **240 hours** |

**Note**: This is a BIG project. Solo developer, full-time = 2 months.

---

## Next Steps

### Immediate (Today):
1. ✅ Create this planning document
2. Create config directory structure
3. Create first config file (theme.js) with Moon Tide colors
4. Create theme-injector.js
5. Test on one HTML file (menu-mobile.html)

### This Week:
1. Complete all config files
2. Test theme injection on all pages
3. Begin portal-controller.js refactoring
4. Document config system

### Next Week:
1. Refactor smart-message-renderer.js (kill booking flow)
2. Update workshop-loader.js
3. Migrate workshop-data.js content
4. Delete obsolete files

---

## Questions & Answers

### Q: Can clients use custom GLB models?
**A**: Phase 1: No, only pre-made options. Future: Yes, paid feature. Portal will upload GLB to Cloud Storage and update config.

### Q: How will images be managed long-term?
**A**: Phase 1: Local images, paths in config. Future: Portal uploads to Cloud Storage, generates CDN URLs, updates config.

### Q: Will there be user authentication?
**A**: Not in Phase 1. Future: Stripe Connect for client payouts requires client accounts in portal backend.

### Q: How will the portal backend generate configs?
**A**: Takes client input from forms → Validates → Builds JSON object → Saves to Firestore → Returns JSON. Frontend fetches on load.

### Q: Can clients have multiple stores?
**A**: Future: Yes. One portal account → Multiple store configs → Different subdomains or domains.

---

## Conclusion

This transformation is **ambitious but achievable**. The current codebase is well-structured, making config extraction cleaner than it could be.

**Key Success Factors**:
1. **Don't rush** - Each phase builds on previous
2. **Test frequently** - After every major change
3. **Document everything** - Future you will thank you
4. **Keep it simple** - Resist over-engineering

**The Payoff**:
A truly multi-tenant platform where clients can create stores in minutes, not months. The foundation for a profitable SaaS business.

**Let's build it.** 🚀

---

**Document Version**: 1.0
**Last Updated**: November 19, 2025
**Author**: Claude AI (Sonnet 4.5)
**Status**: APPROVED - Ready for Implementation
