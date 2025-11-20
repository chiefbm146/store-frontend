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
 * Render Workshop Detail Page
 * Called by WorkshopLoader.js after loading workshop data
 * Populates HTML template with workshop-specific content
 */
export function renderWorkshopDetail(workshopData) {
    if (!workshopData) return 0;

    let updates = 0;

    // Hero section
    if (workshopData.name) {
        updates += setElementContent('[data-content="workshop.title"]', workshopData.name);
        updates += setElementContent('[data-content="workshop.description"]', workshopData.description || '');
        updates += setElementContent('[data-content="workshop.badge"]', workshopData.category || 'Workshop');
    }

    // Icon/Image
    if (workshopData.icon) {
        const iconElement = document.querySelector('[data-content="workshop.icon"]');
        if (iconElement) {
            iconElement.textContent = workshopData.icon;
            updates++;
        }
    }

    // Quick Info (duration, format, level, price)
    updates += populateQuickInfo(workshopData);

    // About section (full description)
    if (workshopData.longDescription) {
        const aboutContent = document.querySelector('[data-content="workshop.about"]');
        if (aboutContent) {
            aboutContent.innerHTML = `<p>${workshopData.longDescription.split('\n\n').join('</p><p>')}</p>`;
            updates++;
        }
    }

    // Highlights (features array)
    if (workshopData.features && Array.isArray(workshopData.features)) {
        updates += renderHighlights(workshopData.features);
    }

    // Pricing section (pricing array)
    if (workshopData.pricing && Array.isArray(workshopData.pricing)) {
        updates += renderPricing(workshopData.pricing);
    }

    return updates;
}

/**
 * Populate quick info bar with workshop details
 */
function populateQuickInfo(workshopData) {
    let updates = 0;

    const quickInfoItems = document.querySelectorAll('.quick-info-item');
    if (quickInfoItems.length === 0) return 0;

    const infoData = [
        { label: 'Duration', value: workshopData.duration || 'Flexible' },
        { label: 'Format', value: workshopData.format || 'In-Person' },
        { label: 'Level', value: workshopData.level || 'All Levels' },
        { label: 'Price', value: workshopData.price || 'TBD' }
    ];

    quickInfoItems.forEach((item, index) => {
        if (infoData[index]) {
            const label = item.querySelector('.quick-info-label');
            const value = item.querySelector('.quick-info-value');

            if (label) {
                label.textContent = infoData[index].label;
                updates++;
            }
            if (value) {
                value.textContent = infoData[index].value;
                updates++;
            }
        }
    });

    return updates;
}

/**
 * Render highlights/features as cards
 */
function renderHighlights(featuresArray) {
    const container = document.querySelector('[data-content="workshop.highlights"]');
    if (!container) return 0;

    container.innerHTML = featuresArray.slice(0, 4).map((feature, idx) => `
        <div class="highlight-card">
            <div class="highlight-icon">${idx + 1}</div>
            <div class="highlight-text">${feature}</div>
        </div>
    `).join('');

    return 1;
}

/**
 * Render pricing options as cards
 */
function renderPricing(pricingArray) {
    const container = document.querySelector('[data-content="workshop.pricing"]');
    if (!container) return 0;

    container.innerHTML = pricingArray.map(option => `
        <div class="pricing-card">
            <div class="pricing-type">${option.type || 'Option'}</div>
            <div class="pricing-amount">${option.amount || 'Contact'}</div>
            <div class="pricing-period">${option.period || ''}</div>
            ${option.features ? `
                <ul class="pricing-features">
                    ${option.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');

    return 1;
}

/**
 * Load Contact page content specifically (with hero, contact info, details array)
 */
export function loadContactPageContent() {
    const pageConfig = getPageContent('contact');
    if (!pageConfig) return 0;

    let updates = 0;

    // Hero section
    if (pageConfig.hero) {
        updates += setElementContent('[data-content="hero.title"]', pageConfig.hero.title);
        updates += setElementContent('[data-content="hero.subtitle"]', pageConfig.hero.subtitle);
    }

    // Contact info (left column)
    if (pageConfig.contactInfo) {
        if (pageConfig.contactInfo.email) {
            updates += setElementContent('[data-content="contact.email.label"]', pageConfig.contactInfo.email.label);
            updates += setElementContent('[data-content="contact.email.value"]', pageConfig.contactInfo.email.value);
            updates += setElementContent('[data-content="contact.email.note"]', pageConfig.contactInfo.email.note);
        }
        if (pageConfig.contactInfo.phone) {
            updates += setElementContent('[data-content="contact.phone.label"]', pageConfig.contactInfo.phone.label);
            updates += setElementContent('[data-content="contact.phone.note"]', pageConfig.contactInfo.phone.note);
        }
    }

    // Details array (right column)
    if (pageConfig.details && Array.isArray(pageConfig.details)) {
        updates += renderContactDetails(pageConfig.details);
    }

    // Hours section
    if (pageConfig.hours) {
        updates += setElementContent('[data-content="hours.heading"]', pageConfig.hours.heading);
        updates += setElementContent('[data-content="hours.weekdays"]', pageConfig.hours.weekdays);
        updates += setElementContent('[data-content="hours.weekends"]', pageConfig.hours.weekends);
        updates += setElementContent('[data-content="hours.timezone"]', pageConfig.hours.timezone);
    }

    return updates;
}

/**
 * Render contact details from config array
 */
function renderContactDetails(detailsArray) {
    const container = document.querySelector('[data-content="contact.details"]');
    if (!container) return 0;

    container.innerHTML = detailsArray.map(detail => `
        <div class="detail-block">
            <h3 class="detail-title">${detail.icon} ${detail.title}</h3>
            <div class="detail-content">
                ${detail.content.map(text => `<p>${text}</p>`).join('')}
            </div>
        </div>
    `).join('');

    return 1; // Count as 1 update (entire details section)
}

/**
 * Load About page content specifically (with hero, sections, values array)
 */
export function loadAboutPageContent() {
    const pageConfig = getPageContent('about');
    if (!pageConfig) return 0;

    let updates = 0;

    // Hero section
    if (pageConfig.hero) {
        updates += setElementContent('[data-content="hero.title"]', pageConfig.hero.title);
        updates += setElementContent('[data-content="hero.subtitle"]', pageConfig.hero.subtitle);
        updates += setElementContent('[data-content="hero.description"]', pageConfig.hero.description);
        updates += setElementContent('.hero-icon', pageConfig.hero.icon);
    }

    // Vision section
    if (pageConfig.vision) {
        updates += setElementContent('[data-content="vision.label"]', pageConfig.vision.label);
        updates += setElementContent('[data-content="vision.title"]', pageConfig.vision.title);

        // Handle vision paragraphs
        const visionContent = document.querySelector('[data-content="vision.content"]');
        if (visionContent && pageConfig.vision.paragraphs) {
            visionContent.innerHTML = pageConfig.vision.paragraphs
                .map(p => `<p>${p}</p>`)
                .join('');
            updates++;
        }
    }

    // Mission section
    if (pageConfig.mission) {
        updates += setElementContent('[data-content="mission.label"]', pageConfig.mission.label);
        updates += setElementContent('[data-content="mission.title"]', pageConfig.mission.title);

        // Handle mission paragraphs
        const missionContent = document.querySelector('[data-content="mission.content"]');
        if (missionContent && pageConfig.mission.paragraphs) {
            missionContent.innerHTML = pageConfig.mission.paragraphs
                .map(p => `<p>${p}</p>`)
                .join('');
            updates++;
        }
    }

    // Values array (render cards)
    if (pageConfig.values && Array.isArray(pageConfig.values)) {
        updates += renderValuesCards(pageConfig.values);
    }

    // Quote section
    if (pageConfig.quote) {
        updates += setElementContent('[data-content="quote.text"]', pageConfig.quote.text);
        updates += setElementContent('[data-content="quote.attribution"]', pageConfig.quote.attribution);
    }

    // Footer section
    if (pageConfig.footer) {
        updates += setElementContent('[data-content="footer.location"]', pageConfig.footer.location);
    }

    return updates;
}

/**
 * Render values cards from config array
 */
function renderValuesCards(valuesArray) {
    const container = document.querySelector('[data-content="values.cards"]');
    if (!container) return 0;

    container.innerHTML = valuesArray.map(value => `
        <div class="value-card">
            <span class="value-icon">${value.icon}</span>
            <h3 class="value-title">${value.title}</h3>
            <div class="value-text">
                ${value.content.map(text => `<p>${text}</p>`).join('')}
            </div>
        </div>
    `).join('');

    return 1; // Count as 1 update (entire card section)
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
