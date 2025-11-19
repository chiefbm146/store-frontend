/**
 * Master Config Loader
 * Single import point for entire application configuration
 *
 * Usage:
 * import { appConfig, theme, brand, settings } from './config/index.js';
 * import { getService, getProduct } from './config/index.js';
 *
 * This file:
 * - Aggregates all configuration modules
 * - Provides unified API for accessing config data
 * - Exports helper functions
 * - Can be extended with validation, defaults, etc.
 */

// ===== CORE CONFIGURATION =====
import { theme } from './core/theme.js';
import { brand } from './core/brand.js';
import { settings } from './core/settings.js';

// ===== CONTENT CONFIGURATION =====
import { services } from './content/services.js';
import { products } from './content/products.js';
import { pageContent } from './content/pages.js';

// Import service helpers
import {
    getService,
    getAllServices,
    getServicesByType,
    getServicesByCategory,
    getFeaturedServices,
    getAvailableServices,
    searchServices,
} from './content/services.js';

// Import product helpers
import {
    getProduct,
    getAllProducts,
    getProductsByType,
    getProductsByCategory,
    getFeaturedProducts,
    getAvailableProducts,
    getProductsOnSale,
    searchProducts,
    isInStock,
} from './content/products.js';

// Import page helpers
import {
    getPageContent,
    getMenuItems,
    getFeaturedMenuItems,
} from './content/pages.js';

// ===== ASSET CONFIGURATION =====
import {
    images,
    getAllImagePaths,
    getBrandImages,
    getServiceImages,
    getProductImages,
    getPageImages,
    getServiceImage,
    getProductImage,
    getPriorityImages,
    getPreloadImages,
    hasImage,
    getFallbackImage,
} from './assets/images.js';

// ===== MASTER CONFIG OBJECT =====
// Aggregate all configs into single object
export const appConfig = {
    // Core configs
    theme,
    brand,
    settings,

    // Content configs
    services,
    products,
    pages: pageContent,

    // Asset configs
    images,

    // Metadata
    version: settings.version || '1.0.0',
    environment: settings.environment || 'production',
    debug: settings.debug || false,
};

// ===== EXPORT INDIVIDUAL CONFIGS =====
// For direct imports: import { theme } from './config/index.js'
export { theme, brand, settings, services, products, pageContent, images };

// Alias for convenience
export const pages = pageContent;

// ===== EXPORT HELPER FUNCTIONS =====

// Service helpers
export {
    getService,
    getAllServices,
    getServicesByType,
    getServicesByCategory,
    getFeaturedServices,
    getAvailableServices,
    searchServices,
};

// Product helpers
export {
    getProduct,
    getAllProducts,
    getProductsByType,
    getProductsByCategory,
    getFeaturedProducts,
    getAvailableProducts,
    getProductsOnSale,
    searchProducts,
    isInStock,
};

// Page helpers
export {
    getPageContent,
    getMenuItems,
    getFeaturedMenuItems,
};

// Image helpers
export {
    getAllImagePaths,
    getBrandImages,
    getServiceImages,
    getProductImages,
    getPageImages,
    getServiceImage,
    getProductImage,
    getPriorityImages,
    getPreloadImages,
    hasImage,
    getFallbackImage,
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate page title using brand template
 */
export function getPageTitle(pageTitle) {
    if (!pageTitle) return brand.meta.title;
    return brand.meta.titleTemplate.replace('%s', pageTitle);
}

/**
 * Generate meta description
 */
export function getMetaDescription(customDescription = null) {
    return customDescription || brand.meta.description;
}

/**
 * Get full config as JSON (for debugging or backend sync)
 */
export function getConfigAsJSON() {
    return JSON.stringify(appConfig, null, 2);
}

/**
 * Validate config (basic validation - can be expanded)
 */
export function validateConfig() {
    const errors = [];

    // Check required brand fields
    if (!brand.companyName) errors.push('brand.companyName is required');
    if (!brand.contact.email) errors.push('brand.contact.email is required');

    // Check required theme fields
    if (!theme.colors.primary) errors.push('theme.colors.primary is required');

    // Check required settings
    if (!settings.backend.aiChatUrl) errors.push('settings.backend.aiChatUrl is required');

    // Check if at least one service exists
    if (Object.keys(services).length === 0) {
        console.warn('Warning: No services defined');
    }

    // Return validation result
    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get config value by path (dot notation)
 * Example: getConfigValue('brand.companyName') => 'Your Brand Here'
 */
export function getConfigValue(path, defaultValue = null) {
    const keys = path.split('.');
    let value = appConfig;

    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }

    return value !== undefined ? value : defaultValue;
}

/**
 * Deep merge configs (for future: override configs from backend)
 */
export function mergeConfig(overrides) {
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    return deepMerge({ ...appConfig }, overrides);
}

/**
 * Initialize config system (run once on app load)
 * Can be used for validation, logging, etc.
 */
export function initConfig() {
    console.log('✅ Config System Initialized');
    console.log(`   Version: ${appConfig.version}`);
    console.log(`   Environment: ${appConfig.environment}`);
    console.log(`   Brand: ${appConfig.brand.companyName}`);
    console.log(`   Services: ${Object.keys(appConfig.services).length}`);
    console.log(`   Products: ${Object.keys(appConfig.products).length}`);

    // Validate config
    if (appConfig.debug) {
        const validation = validateConfig();
        if (!validation.valid) {
            console.error('❌ Config validation errors:', validation.errors);
        } else {
            console.log('✅ Config validation passed');
        }
    }

    return appConfig;
}

// ===== EXPORT DEFAULT =====
export default appConfig;

// ===== AUTO-INIT IN DEBUG MODE =====
// If debug mode is enabled, auto-init and log config
if (appConfig.debug) {
    console.log('🔧 Debug mode enabled - auto-initializing config');
    initConfig();
}
