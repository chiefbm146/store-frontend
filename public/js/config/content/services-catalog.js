/**
 * Services Catalog Configuration
 * Central catalog for all service offerings (consultations, support, etc.)
 * NOTE: Different from workshops in services.js
 */

export const servicesCatalog = {
    'service-1': {
        id: 'service-1',
        type: 'service',
        category: 'consultation',

        // Basic info
        name: 'Service 1',
        shortName: 'Service 1',
        slug: 'service-1',
        emoji: '⚙️',
        icon: 'fas fa-cog',

        // Descriptions
        description: 'Professional service tailored to your specific needs. Expert consultation and support to help you achieve your goals.',
        longDescription: `Service 1 provides comprehensive support and consultation for your unique requirements. Our experienced team works closely with you to understand your goals and deliver customized solutions.

Whether you need ongoing support or a one-time consultation, Service 1 is designed to provide exceptional value and results. We pride ourselves on our attention to detail and commitment to excellence.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'hourly',
            currency: 'USD',
            hourly: 12500,  // $125/hour in cents
            displayPrice: '$125/hour',
            priceUnit: 'per hour',
        },

        // Details
        duration: '1-2 hours per session',
        format: 'In-person or virtual',
        availability: 'By appointment',

        // Visual assets - using emoji by default
        image: null,  // null = use emoji
        gallery: [],

        // SEO
        keywords: ['service', 'consultation', 'professional', 'expert'],
        metaTitle: 'Service 1 | Your Store',
        metaDescription: 'Professional service tailored to your specific needs.',

        // Features/highlights
        highlights: [
            'Expert consultation',
            'Customized solutions',
            'Flexible scheduling',
            'In-person or virtual options',
            'Satisfaction guaranteed',
            'Follow-up support included'
        ],

        // What's included
        included: [
            'Initial consultation',
            'Detailed analysis',
            'Custom recommendations',
            'Action plan',
            '30-day follow-up support',
        ],

        // Service details
        whatToExpect: [
            'Thorough needs assessment',
            'Expert guidance and recommendations',
            'Practical solutions you can implement',
            'Ongoing support and resources'
        ],

        // CTA
        ctaText: 'Add to Cart',
        ctaUrl: null,

        // Availability
        available: true,
        featured: true,
        comingSoon: false,

        // Related services
        related: [],

        // Categories/tags
        categories: ['services', 'consultation'],
        tags: ['professional', 'expert', 'popular'],
    },
};

// Helper functions
export function getServiceItem(id) {
    return servicesCatalog[id] || null;
}

export function getAllServiceItems() {
    return Object.values(servicesCatalog);
}

export function getAvailableServiceItems() {
    return Object.values(servicesCatalog).filter(s => s.available);
}

export function getFeaturedServiceItems() {
    return Object.values(servicesCatalog).filter(s => s.featured);
}

export default servicesCatalog;
