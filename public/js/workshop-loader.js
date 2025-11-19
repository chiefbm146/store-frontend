/**
 * Workshop Loader - Dynamically loads workshop data into detail pages
 * Reads URL parameters and populates the page with appropriate workshop info
 */

import workshopData from './workshop-data.js';

const WorkshopLoader = {
    /**
     * Get workshop ID from URL parameter
     */
    getWorkshopId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    },

    /**
     * Get workshop data by ID
     */
    getWorkshop(id) {
        return workshopData[id] || null;
    },

    /**
     * Navigate back to world page
     * Cloud Function will handle device detection and serve correct version
     */
    goBackToWorld() {
        console.log('[WorkshopLoader] Navigating to /world (Cloud Function will route to correct version)');
        // Navigate to clean URL - Cloud Function will detect device and route accordingly
        window.location.href = './world';
    },

    /**
     * Populate the page with workshop data
     */
    loadWorkshop() {
        const workshopId = this.getWorkshopId();

        if (!workshopId) {
            console.error('[WorkshopLoader] No workshop ID provided');
            this.showError('No workshop specified');
            return;
        }

        const workshop = this.getWorkshop(workshopId);

        if (!workshop) {
            console.error('[WorkshopLoader] Workshop not found:', workshopId);
            this.showError('Workshop not found');
            return;
        }

        console.log('[WorkshopLoader] Loading workshop:', workshop.title);

        // Populate page elements
        this.populateContent(workshop);
    },

    /**
     * Populate page content with workshop data
     */
    populateContent(workshop) {
        // Title
        const titleEl = document.getElementById('workshop-title');
        if (titleEl) {
            titleEl.textContent = workshop.title;
            titleEl.classList.remove('loading-skeleton');
        }

        // Type badge
        const typeEl = document.getElementById('workshop-type');
        if (typeEl) {
            typeEl.textContent = workshop.type;
            typeEl.classList.remove('loading-skeleton');
        }

        // Breadcrumb
        const breadcrumbTitle = document.getElementById('breadcrumb-title');
        if (breadcrumbTitle) breadcrumbTitle.textContent = workshop.title;

        // Image
        const imageEl = document.getElementById('workshop-image');
        if (imageEl && workshop.image) {
            imageEl.src = workshop.image;
            imageEl.alt = workshop.title;
            imageEl.style.display = 'block';
        }

        // Short description
        const descEl = document.getElementById('workshop-description');
        if (descEl) {
            descEl.textContent = workshop.description;
            descEl.classList.remove('loading-skeleton');
        }

        // Long description
        const longDescEl = document.getElementById('workshop-long-description');
        if (longDescEl) {
            // Split by paragraphs and wrap in <p> tags
            const paragraphs = workshop.longDescription.split('\n\n');
            longDescEl.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        }

        // Quick Info Bar (new professional layout)
        const quickInfoGrid = document.getElementById('quick-info-grid');
        if (quickInfoGrid) {
            quickInfoGrid.innerHTML = `
                <div class="quick-info-item">
                    <div class="quick-info-label">Duration</div>
                    <div class="quick-info-value">${workshop.duration}</div>
                </div>
                <div class="quick-info-item">
                    <div class="quick-info-label">Participants</div>
                    <div class="quick-info-value">${workshop.participants}</div>
                </div>
                <div class="quick-info-item">
                    <div class="quick-info-label">Location</div>
                    <div class="quick-info-value">${workshop.location}</div>
                </div>
                <div class="quick-info-item">
                    <div class="quick-info-label">Format</div>
                    <div class="quick-info-value">${workshop.type}</div>
                </div>
            `;
        }

        // Highlights with proper card structure
        const highlightsEl = document.getElementById('workshop-highlights');
        if (highlightsEl && workshop.highlights) {
            highlightsEl.innerHTML = workshop.highlights
                .map((highlight, index) => `
                    <div class="highlight-card">
                        <div class="highlight-icon">✓</div>
                        <div class="highlight-text">${highlight}</div>
                    </div>
                `)
                .join('');
        }

        // Pricing Grid (new section)
        const pricingGrid = document.getElementById('pricing-grid');
        if (pricingGrid) {
            // Parse pricing from workshop.price (e.g., "Corporate: $375/person | Community: $225/person")
            const pricingHTML = this.parsePricing(workshop.price);
            pricingGrid.innerHTML = pricingHTML;
        }

        // Update page title
        document.title = `${workshop.title} - Moon Tide Reconciliation`;
    },

    /**
     * Parse pricing string and create pricing cards
     */
    parsePricing(priceString) {
        // Handle different price formats
        if (priceString.includes('|')) {
            // Format: "Corporate: $375/person | Community: $225/person"
            const parts = priceString.split('|').map(p => p.trim());
            return parts.map(part => {
                const [type, price] = part.split(':').map(s => s.trim());
                return `
                    <div class="pricing-card">
                        <div class="pricing-type">${type}</div>
                        <div class="pricing-amount">${price.replace('/person', '')}</div>
                        <div class="pricing-period">per person</div>
                        <ul class="pricing-features">
                            <li>All materials included</li>
                            <li>Expert facilitation</li>
                            <li>Digital resources</li>
                            <li>Certificate of completion</li>
                        </ul>
                    </div>
                `;
            }).join('');
        } else {
            // Single price format
            return `
                <div class="pricing-card" style="grid-column: 1 / -1;">
                    <div class="pricing-type">Workshop Investment</div>
                    <div class="pricing-amount">${priceString.replace('/person', '')}</div>
                    <div class="pricing-period">per person</div>
                    <ul class="pricing-features">
                        <li>All materials included</li>
                        <li>Expert facilitation</li>
                        <li>Digital resources</li>
                        <li>Certificate of completion</li>
                    </ul>
                </div>
            `;
        }
    },

    /**
     * Show error message
     */
    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>${message}</h2>
                    <p>This workshop could not be found. Please return to Moon Tide World.</p>
                    <button onclick="WorkshopLoader.goBackToWorld()" class="back-button">
                        Return to Moon Tide World
                    </button>
                </div>
            `;
            errorContainer.style.display = 'flex';
        }

        // Hide main content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
    },

    /**
     * Initialize the workshop loader
     */
    init() {
        console.log('[WorkshopLoader] Initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadWorkshop());
        } else {
            this.loadWorkshop();
        }
    }
};

// Make globally available
window.WorkshopLoader = WorkshopLoader;

export default WorkshopLoader;
