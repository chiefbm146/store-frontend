/**
 * Services Configuration
 * Central catalog for all services, workshops, and offerings
 *
 * NOTE: Simplified to generic "Your Store" content
 */

export const services = {
    // ===== WORKSHOP 1 (GENERIC) =====
    'workshop-1': {
        id: 'workshop-1',
        type: 'workshop',
        category: 'in-person',

        // Basic info
        name: 'Workshop 1',
        shortName: 'Workshop 1',
        slug: 'workshop-1',
        emoji: '🎓',
        icon: 'fas fa-graduation-cap',

        // Descriptions
        description: 'An engaging and interactive workshop designed to provide valuable skills and knowledge. Perfect for groups and teams looking to learn something new.',
        longDescription: `Workshop 1 is a comprehensive learning experience that combines theory with hands-on practice. Our expert facilitators guide participants through engaging activities and discussions, ensuring everyone leaves with actionable insights and new skills.

This workshop is designed to be accessible to beginners while also providing value to more experienced participants. We create a supportive learning environment where questions are encouraged and collaboration is fostered.`,

        // Pricing
        pricing: {
            enabled: true,
            model: 'per_person',
            currency: 'USD',
            community: 7500,       // $75 in cents
            corporate: 10000,      // $100 in cents
            displayPrice: '$75 (Community) / $100 (Corporate)',
            priceUnit: 'per person',
        },

        // Details
        duration: '2-3 hours',
        participants: {
            min: 10,
            max: 30,
            recommended: '10-30 people',
        },
        location: 'Your location or ours',

        // Visual assets - using emoji by default, but image capability remains
        image: null,  // null = use emoji
        gallery: [],

        // SEO
        keywords: ['workshop', 'training', 'learning', 'education', 'skills'],
        metaTitle: 'Workshop 1 | Your Store',
        metaDescription: 'An engaging and interactive workshop designed to provide valuable skills.',

        // Features/highlights
        highlights: [
            'Interactive group activities',
            'Expert facilitation',
            'Hands-on learning experience',
            'Comprehensive materials included',
            'Certificate of completion',
            'Follow-up resources provided'
        ],

        // What's included
        included: [
            'All workshop materials',
            'Expert facilitator',
            'Participant workbook',
            'Certificate of completion',
        ],

        // What to expect
        whatToExpect: [
            'Engaging group discussions',
            'Practical exercises',
            'Q&A opportunities',
            'Networking with other participants'
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
        categories: ['workshops', 'in-person', 'education'],
        tags: ['featured', 'popular', 'beginner-friendly'],
    },
};

// ===== ADDITIONAL BOOKING INFORMATION =====
export const BOOKING_INFO = {
    minimumParticipants: 10,
    bookingPolicy: 'Payment required to confirm booking',
    contact: {
        name: 'Your Store',
        email: 'contact@yourstore.com',
        phone: '555-1234'
    },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get service by ID
 */
export function getService(id) {
    return services[id] || null;
}

/**
 * Get all services as array
 */
export function getAllServices() {
    return Object.values(services);
}

/**
 * Get services by type
 */
export function getServicesByType(type) {
    return Object.values(services).filter(s => s.type === type);
}

/**
 * Get services by category
 */
export function getServicesByCategory(category) {
    return Object.values(services).filter(s => s.category === category);
}

/**
 * Get featured services
 */
export function getFeaturedServices() {
    return Object.values(services).filter(s => s.featured);
}

/**
 * Get available services
 */
export function getAvailableServices() {
    return Object.values(services).filter(s => s.available);
}

/**
 * Search services by keyword
 */
export function searchServices(query) {
    const lowerQuery = query.toLowerCase();
    return Object.values(services).filter(service => {
        return (
            service.name.toLowerCase().includes(lowerQuery) ||
            service.description.toLowerCase().includes(lowerQuery) ||
            service.keywords.some(k => k.includes(lowerQuery))
        );
    });
}

// Export default
export default services;
