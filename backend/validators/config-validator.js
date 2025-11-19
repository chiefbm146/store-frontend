/**
 * Config Validator
 * Bulletproof validation for store configurations
 *
 * Validates configs match the frontend's expected structure
 * Multiple validation passes to ensure data integrity
 */

/**
 * Main validation function
 * Runs multiple validation passes on the config
 */
export function validateConfig(config, options = {}) {
    const errors = [];
    const warnings = [];

    const {
        strict = true,           // Strict mode fails on warnings
        validateImages = false,   // Check if images exist (requires fetch)
        maxRetries = 3          // Max validation retries with AI fixes
    } = options;

    console.log('🔍 Validating config...');

    // Pass 1: Structure validation
    const structureErrors = validateStructure(config);
    errors.push(...structureErrors);

    // Pass 2: Required fields
    const requiredErrors = validateRequiredFields(config);
    errors.push(...requiredErrors);

    // Pass 3: Data types
    const typeErrors = validateDataTypes(config);
    errors.push(...typeErrors);

    // Pass 4: Value constraints
    const constraintErrors = validateConstraints(config);
    errors.push(...constraintErrors);

    // Pass 5: Cross-references
    const refErrors = validateCrossReferences(config);
    errors.push(...refErrors);

    // Pass 6: Semantic validation
    const semanticWarnings = validateSemantics(config);
    warnings.push(...semanticWarnings);

    const isValid = errors.length === 0 && (!strict || warnings.length === 0);

    const result = {
        valid: isValid,
        errors: errors,
        warnings: warnings,
        summary: {
            total_errors: errors.length,
            total_warnings: warnings.length,
            passed: isValid
        }
    };

    if (isValid) {
        console.log('✅ Config validation passed');
    } else {
        console.error(`❌ Config validation failed: ${errors.length} errors, ${warnings.length} warnings`);
    }

    return result;
}

/**
 * Pass 1: Validate overall structure
 */
function validateStructure(config) {
    const errors = [];

    if (!config || typeof config !== 'object') {
        errors.push({
            field: 'root',
            message: 'Config must be an object',
            severity: 'error'
        });
        return errors;
    }

    // Check for main sections (at least one required)
    const mainSections = ['theme', 'brand', 'settings', 'services', 'products', 'pages'];
    const hasAnySect ion = mainSections.some(section => config[section]);

    if (!hasAnySection) {
        errors.push({
            field: 'root',
            message: 'Config must contain at least one main section (theme, brand, settings, services, products, or pages)',
            severity: 'error'
        });
    }

    return errors;
}

/**
 * Pass 2: Validate required fields
 */
function validateRequiredFields(config) {
    const errors = [];

    // Brand required fields
    if (config.brand) {
        const brandRequired = ['companyName', 'contact'];
        brandRequired.forEach(field => {
            if (!config.brand[field]) {
                errors.push({
                    field: `brand.${field}`,
                    message: `Missing required field: ${field}`,
                    severity: 'error'
                });
            }
        });

        if (config.brand.contact) {
            const contactRequired = ['email'];
            contactRequired.forEach(field => {
                if (!config.brand.contact[field]) {
                    errors.push({
                        field: `brand.contact.${field}`,
                        message: `Missing required field: ${field}`,
                        severity: 'error'
                    });
                }
            });
        }
    }

    // Services required fields
    if (config.services) {
        Object.keys(config.services).forEach(serviceId => {
            const service = config.services[serviceId];
            const requiredFields = ['id', 'name', 'type'];

            requiredFields.forEach(field => {
                if (!service[field]) {
                    errors.push({
                        field: `services.${serviceId}.${field}`,
                        message: `Missing required field: ${field}`,
                        severity: 'error'
                    });
                }
            });

            // Validate ID matches key
            if (service.id && service.id !== serviceId) {
                errors.push({
                    field: `services.${serviceId}.id`,
                    message: `Service ID mismatch: key is "${serviceId}" but id field is "${service.id}"`,
                    severity: 'error'
                });
            }
        });
    }

    // Products required fields
    if (config.products) {
        Object.keys(config.products).forEach(productId => {
            const product = config.products[productId];
            const requiredFields = ['id', 'name', 'type'];

            requiredFields.forEach(field => {
                if (!product[field]) {
                    errors.push({
                        field: `products.${productId}.${field}`,
                        message: `Missing required field: ${field}`,
                        severity: 'error'
                    });
                }
            });
        });
    }

    return errors;
}

/**
 * Pass 3: Validate data types
 */
function validateDataTypes(config) {
    const errors = [];

    // Theme colors must be valid hex
    if (config.theme?.colors) {
        Object.keys(config.theme.colors).forEach(colorName => {
            const color = config.theme.colors[colorName];
            if (typeof color === 'string' && !isValidHexColor(color)) {
                errors.push({
                    field: `theme.colors.${colorName}`,
                    message: `Invalid hex color: ${color}. Must be #RRGGBB format`,
                    severity: 'error'
                });
            }
        });
    }

    // Pricing must be integers (cents)
    if (config.services) {
        Object.keys(config.services).forEach(serviceId => {
            const pricing = config.services[serviceId].pricing;
            if (pricing) {
                ['community', 'corporate', 'price'].forEach(field => {
                    if (pricing[field] !== undefined) {
                        if (!Number.isInteger(pricing[field])) {
                            errors.push({
                                field: `services.${serviceId}.pricing.${field}`,
                                message: `Price must be an integer (cents), got ${typeof pricing[field]}: ${pricing[field]}`,
                                severity: 'error'
                            });
                        }
                        if (pricing[field] < 0) {
                            errors.push({
                                field: `services.${serviceId}.pricing.${field}`,
                                message: `Price cannot be negative: ${pricing[field]}`,
                                severity: 'error'
                            });
                        }
                    }
                });
            }
        });
    }

    // Email validation
    if (config.brand?.contact?.email) {
        if (!isValidEmail(config.brand.contact.email)) {
            errors.push({
                field: 'brand.contact.email',
                message: `Invalid email format: ${config.brand.contact.email}`,
                severity: 'error'
            });
        }
    }

    return errors;
}

/**
 * Pass 4: Validate value constraints
 */
function validateConstraints(config) {
    const errors = [];

    // URL validation
    const urlFields = [
        { path: 'brand.logos.main', field: 'Main logo' },
        { path: 'settings.backend.aiChatUrl', field: 'AI Chat URL' },
        { path: 'settings.backend.portalUrl', field: 'Portal URL' }
    ];

    urlFields.forEach(({ path, field }) => {
        const value = getNestedValue(config, path);
        if (value && typeof value === 'string') {
            if (!isValidUrl(value)) {
                errors.push({
                    field: path,
                    message: `${field} must be a valid URL or path: ${value}`,
                    severity: 'error'
                });
            }
        }
    });

    // Participant constraints
    if (config.services) {
        Object.keys(config.services).forEach(serviceId => {
            const participants = config.services[serviceId].participants;
            if (participants) {
                if (participants.min && participants.max) {
                    if (participants.min > participants.max) {
                        errors.push({
                            field: `services.${serviceId}.participants`,
                            message: `Min participants (${participants.min}) cannot be greater than max (${participants.max})`,
                            severity: 'error'
                        });
                    }
                }
            }
        });
    }

    return errors;
}

/**
 * Pass 5: Validate cross-references
 */
function validateCrossReferences(config) {
    const errors = [];

    // Validate service IDs are unique
    if (config.services) {
        const serviceIds = Object.keys(config.services);
        const duplicates = serviceIds.filter((id, index) => serviceIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push({
                field: 'services',
                message: `Duplicate service IDs found: ${duplicates.join(', ')}`,
                severity: 'error'
            });
        }
    }

    // Validate product IDs are unique
    if (config.products) {
        const productIds = Object.keys(config.products);
        const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push({
                field: 'products',
                message: `Duplicate product IDs found: ${duplicates.join(', ')}`,
                severity: 'error'
            });
        }
    }

    return errors;
}

/**
 * Pass 6: Semantic validation (warnings)
 */
function validateSemantics(config) {
    const warnings = [];

    // Check for placeholder content
    if (config.brand?.companyName?.includes('Your')) {
        warnings.push({
            field: 'brand.companyName',
            message: 'Company name appears to be a placeholder',
            severity: 'warning'
        });
    }

    // Check for empty services/products
    if (config.services && Object.keys(config.services).length === 0) {
        warnings.push({
            field: 'services',
            message: 'No services defined',
            severity: 'warning'
        });
    }

    if (config.products && Object.keys(config.products).length === 0) {
        warnings.push({
            field: 'products',
            message: 'No products defined',
            severity: 'warning'
        });
    }

    // Check for missing descriptions
    if (config.services) {
        Object.keys(config.services).forEach(serviceId => {
            const service = config.services[serviceId];
            if (!service.description || service.description.length < 10) {
                warnings.push({
                    field: `services.${serviceId}.description`,
                    message: 'Service description is too short or missing',
                    severity: 'warning'
                });
            }
        });
    }

    return warnings;
}

// Helper functions
function isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
    return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get validation summary
 */
export function getValidationSummary(validationResult) {
    return {
        passed: validationResult.valid,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        details: validationResult.errors.concat(validationResult.warnings)
    };
}

export default {
    validateConfig,
    getValidationSummary
};
