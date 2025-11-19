/**
 * Products Configuration
 * Central catalog for physical and digital products
 *
 * This file defines:
 * - Product catalog (physical, digital, subscriptions)
 * - SKU and inventory management
 * - Pricing information
 * - Shipping details
 * - Product variants (size, color, etc.)
 *
 * NOTE: Currently has 3 placeholder products for demo.
 * In future, this will be fully configurable via Store Printer portal.
 *
 * FUTURE FEATURES:
 * - Products will have own HTML pages (product-detail-desk/mobile.html)
 * - Products grid page (products-desk/mobile.html)
 * - Integration with cart system
 * - Inventory tracking
 * - Variant support (size, color, etc.)
 */

export const products = {
    // ===== PRODUCT 1: EXAMPLE PHYSICAL PRODUCT =====
    'product-001': {
        id: 'product-001',
        type: 'physical',      // 'physical' | 'digital' | 'subscription' | 'bundle'
        sku: 'PROD-001',       // Stock keeping unit

        // Basic info
        name: 'Example Physical Product',
        shortName: 'Example Product',
        slug: 'example-product',
        brand: 'Your Brand',   // Product brand (may differ from store brand)

        // Descriptions
        description: 'A wonderful physical product that your customers will love.',
        longDescription: `This is a longer description of the product with multiple paragraphs.

It can include details about materials, craftsmanship, sustainability, and any other selling points.

You can also mention care instructions, dimensions, or any other relevant information.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'fixed',        // 'fixed' | 'variable' | 'tiered' | 'subscription'
            currency: 'CAD',
            price: 2999,           // $29.99 in cents
            compareAtPrice: 3999,  // $39.99 (original/strike-through price)
            displayPrice: '$29.99',
            onSale: true,
            salePercentage: 25,    // 25% off
            taxable: true,
        },

        // Inventory
        inventory: {
            tracked: true,         // Track inventory
            quantity: 100,         // Current stock
            lowStockThreshold: 10, // Show "low stock" warning
            allowBackorder: false, // Allow orders when out of stock
            stockStatus: 'in_stock', // 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder'
        },

        // Shipping
        shipping: {
            required: true,        // Requires shipping
            weight: 500,           // 500 grams
            weightUnit: 'g',       // 'g' | 'kg' | 'lb' | 'oz'
            dimensions: {
                length: 10,        // cm
                width: 10,
                height: 5,
            },
            dimensionsUnit: 'cm',  // 'cm' | 'in'
            freeShippingEligible: false,
            shippingClass: 'standard', // 'standard' | 'express' | 'fragile' | 'oversized'
        },

        // Visual assets
        image: '/images/products/product-001.jpg',
        gallery: [
            '/images/products/product-001-1.jpg',
            '/images/products/product-001-2.jpg',
            '/images/products/product-001-3.jpg',
        ],

        // SEO
        keywords: ['product', 'example', 'physical', 'item'],
        metaTitle: 'Example Physical Product - Your Brand',
        metaDescription: 'A wonderful physical product that your customers will love.',

        // Features/highlights
        features: [
            'High-quality materials',
            'Eco-friendly production',
            'Handcrafted with care',
            'Made in Canada',
            '1-year warranty',
        ],

        // Specifications
        specifications: [
            { label: 'Material', value: 'Organic Cotton' },
            { label: 'Dimensions', value: '10 x 10 x 5 cm' },
            { label: 'Weight', value: '500g' },
            { label: 'Color', value: 'Natural' },
            { label: 'Care', value: 'Hand wash only' },
        ],

        // Variants (future feature)
        variants: [],
        // Example variant structure:
        // variants: [
        //     {
        //         id: 'product-001-small-blue',
        //         sku: 'PROD-001-S-BLU',
        //         attributes: { size: 'Small', color: 'Blue' },
        //         price: 2999,
        //         inventory: { quantity: 50 },
        //         image: '/images/products/product-001-small-blue.jpg',
        //     },
        // ],

        // CTA
        ctaText: 'Add to Cart',
        ctaUrl: null, // null = use cart system

        // Availability
        available: true,
        featured: true,
        comingSoon: false,
        preorder: false,

        // Related products
        related: ['product-002', 'product-003'],

        // Categories/tags
        categories: ['physical-goods', 'new-arrivals'],
        tags: ['featured', 'popular', 'eco-friendly', 'handmade'],

        // Additional info
        madeIn: 'Canada',
        materials: ['Organic Cotton', 'Recycled Polyester'],
        certifications: ['Fair Trade', 'Organic'],
    },

    // ===== PRODUCT 2: EXAMPLE DIGITAL PRODUCT =====
    'product-002': {
        id: 'product-002',
        type: 'digital',
        sku: 'DIGI-001',

        name: 'Example Digital Product',
        shortName: 'Digital Product',
        slug: 'example-digital-product',
        brand: 'Your Brand',

        description: 'An instant-download digital product (e-book, template, course, etc.)',
        longDescription: `This digital product is delivered instantly via email after purchase.

Perfect for customers who want immediate access to valuable digital content.

Includes lifetime access and free updates.`,

        pricing: {
            enabled: true,
            model: 'fixed',
            currency: 'CAD',
            price: 1499,           // $14.99
            compareAtPrice: null,  // No sale price
            displayPrice: '$14.99',
            onSale: false,
            taxable: true,         // Digital goods may be taxable depending on jurisdiction
        },

        // Digital products don't track inventory the same way
        inventory: {
            tracked: false,        // Infinite digital copies
            quantity: null,
            allowBackorder: true,  // Always available
            stockStatus: 'in_stock',
        },

        // Digital products don't need shipping
        shipping: {
            required: false,
            digital: true,
            deliveryMethod: 'email', // 'email' | 'download_link' | 'license_key'
        },

        // Visual assets
        image: '/images/products/product-002.jpg',
        gallery: [
            '/images/products/product-002-preview1.jpg',
            '/images/products/product-002-preview2.jpg',
        ],

        keywords: ['digital', 'download', 'instant', 'ebook'],
        metaTitle: 'Example Digital Product - Your Brand',
        metaDescription: 'Instant-download digital product with lifetime access.',

        features: [
            'Instant download',
            'Lifetime access',
            'Free updates',
            'PDF + ePub formats',
            'No DRM',
        ],

        specifications: [
            { label: 'Format', value: 'PDF, ePub' },
            { label: 'File Size', value: '5 MB' },
            { label: 'Pages', value: '120' },
            { label: 'Language', value: 'English' },
            { label: 'License', value: 'Personal use only' },
        ],

        variants: [],

        ctaText: 'Buy & Download',
        ctaUrl: null,

        available: true,
        featured: false,
        comingSoon: false,

        related: ['product-001', 'product-003'],

        categories: ['digital-products', 'ebooks'],
        tags: ['digital', 'instant-access', 'bestseller'],

        // Digital-specific fields
        fileFormats: ['PDF', 'ePub'],
        fileSize: '5 MB',
        license: 'Personal use only',
    },

    // ===== PRODUCT 3: EXAMPLE SUBSCRIPTION PRODUCT =====
    'product-003': {
        id: 'product-003',
        type: 'subscription',
        sku: 'SUB-001',

        name: 'Example Subscription Product',
        shortName: 'Subscription',
        slug: 'example-subscription',
        brand: 'Your Brand',

        description: 'A monthly subscription with recurring billing and exclusive benefits.',
        longDescription: `Join our exclusive subscription program and get access to:

- Monthly curated box
- Exclusive member discounts
- Early access to new products
- Free shipping on all orders

Cancel anytime, no commitments.`,

        pricing: {
            enabled: true,
            model: 'subscription',
            currency: 'CAD',
            price: 4900,           // $49/month
            displayPrice: '$49/month',
            billingInterval: 'month', // 'day' | 'week' | 'month' | 'year'
            billingIntervalCount: 1,   // Every 1 month
            trialPeriodDays: 7,        // 7-day free trial
            onSale: false,
            taxable: true,
        },

        inventory: {
            tracked: true,
            quantity: 50,          // 50 subscription slots available
            lowStockThreshold: 10,
            allowBackorder: false,
            stockStatus: 'in_stock',
        },

        shipping: {
            required: true,        // Monthly box requires shipping
            weight: 1000,          // 1kg
            weightUnit: 'g',
            freeShippingEligible: true, // Free shipping for subscribers
        },

        image: '/images/products/product-003.jpg',
        gallery: [
            '/images/products/product-003-box.jpg',
            '/images/products/product-003-contents.jpg',
        ],

        keywords: ['subscription', 'monthly', 'membership', 'box'],
        metaTitle: 'Example Subscription - Your Brand',
        metaDescription: 'Monthly subscription box with exclusive benefits. Try free for 7 days!',

        features: [
            'Monthly curated box',
            'Free shipping',
            '10% discount on all products',
            'Early access to new releases',
            'Cancel anytime',
            '7-day free trial',
        ],

        specifications: [
            { label: 'Billing', value: 'Monthly' },
            { label: 'Trial Period', value: '7 days free' },
            { label: 'Cancellation', value: 'Anytime' },
            { label: 'Shipping', value: 'Free (Canada only)' },
        ],

        variants: [],

        ctaText: 'Start Free Trial',
        ctaUrl: null,

        available: true,
        featured: true,
        comingSoon: false,

        related: ['product-001', 'product-002'],

        categories: ['subscriptions', 'featured'],
        tags: ['subscription', 'popular', 'free-trial', 'exclusive'],

        // Subscription-specific fields
        subscription: {
            billingInterval: 'month',
            billingIntervalCount: 1,
            trialPeriodDays: 7,
            cancellationPolicy: 'Cancel anytime. No fees or penalties.',
            renewalPolicy: 'Automatically renews unless cancelled.',
        },
    },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get product by ID
 */
export function getProduct(id) {
    return products[id] || null;
}

/**
 * Get all products as array
 */
export function getAllProducts() {
    return Object.values(products);
}

/**
 * Get products by type
 */
export function getProductsByType(type) {
    return Object.values(products).filter(p => p.type === type);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category) {
    return Object.values(products).filter(p => p.categories.includes(category));
}

/**
 * Get featured products
 */
export function getFeaturedProducts() {
    return Object.values(products).filter(p => p.featured);
}

/**
 * Get available products
 */
export function getAvailableProducts() {
    return Object.values(products).filter(p => p.available && p.inventory.stockStatus !== 'out_of_stock');
}

/**
 * Get products on sale
 */
export function getProductsOnSale() {
    return Object.values(products).filter(p => p.pricing.onSale);
}

/**
 * Search products by keyword
 */
export function searchProducts(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(products).filter(product => {
        return (
            product.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery) ||
            product.keywords.some(k => k.includes(lowerQuery))
        );
    });
}

/**
 * Check if product is in stock
 */
export function isInStock(productId) {
    const product = getProduct(productId);
    if (!product) return false;

    // Digital products are always in stock
    if (product.type === 'digital') return true;

    // Check inventory
    if (!product.inventory.tracked) return true;
    return product.inventory.quantity > 0 || product.inventory.allowBackorder;
}

// Export default
export default products;
