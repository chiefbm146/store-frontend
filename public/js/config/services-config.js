/**
 * Services Configuration
 * Manages service metadata, images, and display properties
 *
 * This config file allows you to:
 * 1. Map service IDs to image paths
 * 2. Customize service display properties
 * 3. Manage placeholder images
 * 4. Override service names/descriptions
 * 5. Version tracking for cache busting
 */

// VERSION: 8.0.2
// DO NOT MANUALLY EDIT - Updated by version-update.js
const APP_VERSION = '8.0.2';
const APP_BUILD = 56;
const APP_UPDATED = '2025-10-29T08:44:31.348Z';

export const servicesConfig = {
    // Version information (for cache busting and debugging)
    version: APP_VERSION,
    buildNumber: APP_BUILD,
    lastUpdated: APP_UPDATED,

    // Image folder path - update this to point to your images directory
    imagePath: '/images/services/',

    // Placeholder image (used when image not found)
    placeholderImage: '/moon-logo.avif?v=8.0.2',

    // Service-specific configurations
    services: {
        'cedar-bracelet': {
            image: 'cedar bracelets.jpg',
            displayName: 'Cedar Woven Bracelet',
            displayEmoji: '🪵'
        },
        'cedar-rope-bracelet': {
            image: 'cedar rope bracelet.jpg',
            displayName: 'Cedar Rope Bracelet with Beads',
            displayEmoji: '🪵'
        },
        'cedar-heart': {
            image: 'cedar hearts.jpg',
            displayName: 'Weaving a Cedar Heart',
            displayEmoji: '❤️'
        },
        'medicine-pouch': {
            image: 'medicines pouches.jpg',
            displayName: 'Healing Through Medicine Pouch Making',
            displayEmoji: '🫶'
        },
        'orange-shirt-day-inperson': {
            image: 'orange shirt.png',
            displayName: 'Orange Shirt Day Awareness Beading - In-Person',
            displayEmoji: '🧡'
        },
        'orange-shirt-day-virtual': {
            image: 'orange shirt.png',
            displayName: 'Orange Shirt Day Awareness Beading - Virtual',
            displayEmoji: '🧡'
        },
        'mmiwg2s-inperson': {
            image: 'mmiwg2s.png',
            displayName: 'MMIWG2S In-Person',
            displayEmoji: '🤝'
        },
        'mmiwg2s-virtual': {
            image: 'mmiwg2s.png',
            displayName: 'MMIWG2S Virtual',
            displayEmoji: '🤝'
        },
        'cedar-coasters': {
            image: 'cedar coasters.png',
            displayName: 'Cedar Coasters',
            displayEmoji: '☕'
        },
        'cedar-basket': {
            image: 'Cedar Baskets.jpg',
            displayName: 'Cedar Basket Weaving',
            displayEmoji: '🧺'
        },
        'kairos-blanket-inperson': {
            image: 'kairos in person.jpg',
            displayName: 'Kairos Blanket Exercise - In-Person',
            displayEmoji: '🛏️'
        },
        'kairos-blanket-virtual': {
            image: 'kairos virtual.png',
            displayName: 'Kairos Blanket Exercise - Virtual',
            displayEmoji: '🛏️'
        }
    },

    /**
     * Get image path for a service
     * @param {string} serviceId - The service ID
     * @returns {string|null} Full path to the image, null to use emoji only
     */
    getImagePath(serviceId) {
        const config = this.services[serviceId];
        if (config && config.image !== null && config.image) {
            return this.imagePath + config.image;
        }
        if (config && config.image === null) {
            return null; // Use emoji placeholder
        }
        return this.placeholderImage;
    },

    /**
     * Get display name for a service
     * @param {string} serviceId - The service ID
     * @param {string} fallbackName - Fallback name from registry
     * @returns {string} Display name
     */
    getDisplayName(serviceId, fallbackName) {
        const config = this.services[serviceId];
        return config?.displayName || fallbackName;
    },

    /**
     * Get emoji for a service
     * @param {string} serviceId - The service ID
     * @param {string} fallbackEmoji - Fallback emoji from registry
     * @returns {string} Emoji
     */
    getDisplayEmoji(serviceId, fallbackEmoji) {
        const config = this.services[serviceId];
        return config?.displayEmoji || fallbackEmoji;
    }
};

// Export image paths for preloading
export const IMAGE_PATHS_TO_PRELOAD = [
    '/images/services/cedar bracelets.jpg',
    '/images/services/cedar rope bracelet.jpg',
    '/images/services/cedar hearts.jpg',
    '/images/services/medicines pouches.jpg',
    '/images/services/orange shirt.png',
    '/images/services/mmiwg2s.png',
    '/images/services/cedar coasters.png',
    '/images/services/Cedar Baskets.jpg',
    '/images/services/kairos in person.jpg',
    '/images/services/kairos virtual.png',
    '/images/webp/moon9.webp',
    '/images/MOON TIDE/SHONA.jpg',
    '/images/MOON TIDE/moon-logo.png',
    '/moon-logo.avif'
];

export default servicesConfig;
