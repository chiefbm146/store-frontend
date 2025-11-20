/**
 * Products Configuration
 * Central catalog for all products
 */

export const products = {
    'product-1': {
        id: 'product-1',
        type: 'product',
        category: 'physical',

        // Basic info
        name: 'Product 1',
        shortName: 'Product 1',
        slug: 'product-1',
        emoji: '📦',
        icon: 'fas fa-box',

        // Descriptions
        description: 'A high-quality product designed to meet your needs. Features premium materials and exceptional craftsmanship.',
        longDescription: `This is Product 1, a versatile and reliable item that has been crafted with attention to detail and quality. Whether you're looking for functionality, style, or both, this product delivers on all fronts.

Perfect for everyday use or special occasions, Product 1 combines innovative design with practical features. Each unit is carefully inspected to ensure it meets our high standards of excellence.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'fixed',
            currency: 'USD',
            base: 4999,  // $49.99 in cents
            displayPrice: '$49.99',
            priceUnit: 'per item',
        },

        // Details
        dimensions: '10" x 8" x 6"',
        weight: '2 lbs',
        material: 'Premium materials',
        madeIn: 'Your Location',

        // Visual assets - using emoji by default, but images can be added
        image: null,  // null = use emoji
        gallery: [],

        // SEO
        keywords: ['product', 'quality', 'premium', 'versatile'],
        metaTitle: 'Product 1 | Your Store',
        metaDescription: 'A high-quality product designed to meet your needs.',

        // Features/highlights
        highlights: [
            'Premium quality materials',
            'Durable construction',
            'Versatile design',
            'Easy to use',
            'Satisfaction guaranteed',
            'Fast shipping available'
        ],

        // What's included
        included: [
            'Product 1 unit',
            'User manual',
            'Warranty card',
            'Thank you note',
        ],

        // Specifications
        specifications: {
            'Dimensions': '10" x 8" x 6"',
            'Weight': '2 lbs',
            'Material': 'Premium materials',
            'Color Options': 'Multiple colors available',
            'Warranty': '1 year limited warranty',
            'Made In': 'Your Location'
        },

        // CTA
        ctaText: 'Add to Cart',
        ctaUrl: null,

        // Availability
        available: true,
        featured: true,
        comingSoon: false,
        inStock: true,
        stockQuantity: 100,

        // Related products
        related: [],

        // Categories/tags
        categories: ['products', 'featured'],
        tags: ['new', 'popular', 'bestseller'],
    },
};

// Helper functions
export function getProduct(id) {
    return products[id] || null;
}

export function getAllProducts() {
    return Object.values(products);
}

export function getAvailableProducts() {
    return Object.values(products).filter(p => p.available && p.inStock);
}

export function getFeaturedProducts() {
    return Object.values(products).filter(p => p.featured);
}

export default products;
