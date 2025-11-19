/**
 * Content Loader
 * Dynamically loads content from configuration into HTML elements
 *
 * This module:
 * - Reads content from config (brand, pages, etc.)
 * - Populates HTML elements by ID or data attribute
 * - Updates meta tags
 * - Makes pages data-driven instead of hardcoded
 *
 * Usage:
 * import { loadPageContent } from './content-loader.js';
 * loadPageContent('about'); // Loads 'about' page content
 *
 * HTML structure:
 * <h1 data-content="companyName"></h1>
 * <p data-content="tagline"></p>
 * <img data-content-src="logo" />
 */

import { brand, pages, getPageContent, getPageTitle, getMetaDescription } from './config/index.js';

/**
 * Load page content from config
 * @param {string} pageName - Name of page in config (e.g., 'about', 'founder', 'contact')
 * @param {object} options - Loading options
 */
export function loadPageContent(pageName = null, options = {}) {
    const {
        updateMetaTags = true,
        updateTitle = true,
        logChanges = true,
    } = options;

    console.log('[Content Loader] Loading content...');

    let updates = 0;

    try {
        // ===== UPDATE META TAGS =====
        if (updateMetaTags) {
            updates += updateMetaTagsFromConfig(pageName);
        }

        // ===== UPDATE PAGE TITLE =====
        if (updateTitle && pageName) {
            const pageConfig = getPageContent(pageName);
            if (pageConfig && pageConfig.title) {
                document.title = getPageTitle(pageConfig.title);
                updates++;
            }
        }

        // ===== LOAD BRAND CONTENT =====
        updates += loadBrandContent();

        // ===== LOAD PAGE-SPECIFIC CONTENT =====
        if (pageName) {
            const pageConfig = getPageContent(pageName);
            if (pageConfig) {
                updates += loadObjectContent(pageConfig, pageName);
            }
        }

        if (logChanges) {
            console.log(`✅ Content Loader: ${updates} elements updated`);
        }

        // Emit custom event
        const contentLoadedEvent = new CustomEvent('contentLoaded', {
            detail: { pageName, updates }
        });
        document.dispatchEvent(contentLoadedEvent);

        return {
            success: true,
            updates,
        };

    } catch (error) {
        console.error('❌ Content Loader: Failed to load content', error);

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Load brand content (company name, contact, etc.)
 */
function loadBrandContent() {
    let updates = 0;

    // Company name
    updates += setElementContent('[data-content="companyName"]', brand.companyName);
    updates += setElementContent('#company-name', brand.companyName);

    // Tagline
    updates += setElementContent('[data-content="tagline"]', brand.tagline);
    updates += setElementContent('#tagline', brand.tagline);

    // Contact info
    updates += setElementContent('[data-content="email"]', brand.contact.email);
    updates += setElementContent('[data-content="phone"]', brand.contact.phone);
    updates += setElementContent('#contact-email', brand.contact.email);
    updates += setElementContent('#contact-phone', brand.contact.phone);

    // Contact person
    updates += setElementContent('[data-content="contactName"]', brand.contact.name);
    updates += setElementContent('[data-content="contactTitle"]', brand.contact.title);

    // Address
    if (brand.contact.address) {
        const addr = brand.contact.address;
        const fullAddress = `${addr.street}${addr.suite ? ', ' + addr.suite : ''}\n${addr.city}, ${addr.province} ${addr.postal}\n${addr.country}`;
        updates += setElementContent('[data-content="address"]', fullAddress);
    }

    // Logo images
    updates += setElementAttribute('[data-content-src="logo"]', 'src', brand.logos.main);
    updates += setElementAttribute('[data-content-src="logoLight"]', 'src', brand.logos.mainLight);
    updates += setElementAttribute('#logo-image', 'src', brand.logos.main);

    // Mission & values (for about page)
    if (brand.mission) {
        updates += setElementContent('[data-content="missionStatement"]', brand.mission.statement);
        updates += setElementContent('[data-content="vision"]', brand.mission.vision);
    }

    return updates;
}

/**
 * Load content from any object (recursive)
 */
function loadObjectContent(obj, prefix = '') {
    let updates = 0;

    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const selector = prefix ? `[data-content="${prefix}.${key}"]` : `[data-content="${key}"]`;

        if (typeof value === 'string' || typeof value === 'number') {
            // Simple value - set content
            updates += setElementContent(selector, value);

        } else if (Array.isArray(value)) {
            // Array - handle specially (might be list of items)
            // Skip for now - needs custom handling per page

        } else if (value && typeof value === 'object') {
            // Nested object - recurse
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            updates += loadObjectContent(value, newPrefix);
        }
    });

    return updates;
}

/**
 * Set element content by selector
 */
function setElementContent(selector, content) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = content;
        } else {
            el.textContent = content;
        }
    });

    return elements.length;
}

/**
 * Set element attribute by selector
 */
function setElementAttribute(selector, attribute, value) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        el.setAttribute(attribute, value);
    });

    return elements.length;
}

/**
 * Update meta tags from config
 */
function updateMetaTagsFromConfig(pageName = null) {
    let updates = 0;

    // Title
    document.title = brand.meta.title;
    updates++;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', getMetaDescription());
        updates++;
    }

    // Meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && brand.meta.keywords) {
        metaKeywords.setAttribute('content', brand.meta.keywords.join(', '));
        updates++;
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', brand.meta.title);
        updates++;
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
        ogDesc.setAttribute('content', brand.meta.description);
        updates++;
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && brand.logos.ogImage) {
        const fullUrl = brand.meta.siteUrl + brand.logos.ogImage;
        ogImage.setAttribute('content', fullUrl);
        updates++;
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', brand.meta.siteUrl + window.location.pathname);
        updates++;
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) {
        ogType.setAttribute('content', brand.meta.ogType);
        updates++;
    }

    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
        ogSiteName.setAttribute('content', brand.meta.siteName || brand.companyName);
        updates++;
    }

    // Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (twitterCard) {
        twitterCard.setAttribute('content', brand.meta.twitterCard);
        updates++;
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
        twitterTitle.setAttribute('content', brand.meta.title);
        updates++;
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
        twitterDesc.setAttribute('content', brand.meta.description);
        updates++;
    }

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && brand.logos.ogImage) {
        const fullUrl = brand.meta.siteUrl + brand.logos.ogImage;
        twitterImage.setAttribute('content', fullUrl);
        updates++;
    }

    return updates;
}

/**
 * Load specific section content (e.g., founder profile)
 */
export function loadSectionContent(sectionName, containerSelector) {
    console.log(`[Content Loader] Loading section: ${sectionName}`);

    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`Container not found: ${containerSelector}`);
        return 0;
    }

    // This is a placeholder - specific section loaders would go here
    // Example: loadFounderProfile(), loadAboutSections(), etc.

    return 0;
}

/**
 * Reload all content (useful after config changes)
 */
export function reloadContent(pageName = null) {
    console.log('[Content Loader] Reloading all content...');

    return loadPageContent(pageName, {
        updateMetaTags: true,
        updateTitle: true,
        logChanges: true,
    });
}

/**
 * Get current page name from URL or data attribute
 */
export function getCurrentPageName() {
    // Try data attribute first
    const pageEl = document.querySelector('[data-page]');
    if (pageEl) {
        return pageEl.getAttribute('data-page');
    }

    // Try to infer from URL path
    const path = window.location.pathname;

    // Map common paths to page names
    const pathMap = {
        '/moon-tide': 'about',
        '/shona': 'founder',
        '/contact': 'contact',
        '/menu': 'menu',
        '/chat': 'chat',
        '/Account': 'account',
    };

    return pathMap[path] || null;
}

/**
 * Auto-load content based on current page
 */
export function autoLoadContent() {
    const pageName = getCurrentPageName();

    console.log(`[Content Loader] Auto-loading content for page: ${pageName || 'unknown'}`);

    return loadPageContent(pageName);
}

/**
 * Initialize content loader (can be called once on DOMContentLoaded)
 */
export function initContentLoader() {
    console.log('[Content Loader] Initializing...');

    // Auto-load on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoLoadContent);
    } else {
        autoLoadContent();
    }
}

// Export default function
export default loadPageContent;
