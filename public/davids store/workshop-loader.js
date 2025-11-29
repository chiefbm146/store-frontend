/**
 * Workshop Loader - Dynamically loads workshop data into detail pages
 * Reads URL parameters and populates the page with appropriate workshop info
 */

window.WorkshopLoader = {
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
        return (window.workshopData && window.workshopData[id]) || null;
    },

    /**
     * Navigate back to world page
     * Cloud Function will handle device detection and serve correct version
     */
    goBackToWorld() {
        // Navigate to clean URL - Cloud Function will detect device and route accordingly
        window.location.href = './world';
    },

    /**
     * Populate the page with workshop data
     */
    loadWorkshop() {
        const workshopId = this.getWorkshopId();

        if (!workshopId) {
            this.showError('No workshop specified');
            return;
        }

        const workshop = this.getWorkshop(workshopId);

        if (!workshop) {
            this.showError('Workshop not found');
            return;
        }

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

        // Image or Icon
        const imageEl = document.getElementById('workshop-image');
        const imageContainer = document.querySelector('.hero-image-container');
        if (workshop.icon && imageContainer) {
            // Display icon instead of image
            const iconEl = document.createElement('div');
            iconEl.className = 'workshop-icon';
            iconEl.textContent = workshop.icon;
            // Clear container and add icon
            imageContainer.innerHTML = '';
            imageContainer.appendChild(iconEl);
        } else if (imageEl && workshop.image) {
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
        if (longDescEl && workshop.longDescription) {
            // Split by paragraphs and wrap in <p> tags
            const paragraphs = workshop.longDescription.split('\n\n');
            longDescEl.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        } else if (longDescEl) {
            // Fallback if longDescription is missing
            longDescEl.innerHTML = `<p>${workshop.description || 'No description available'}</p>`;
        }

        // Quick Info Bar (new professional layout) - Customize based on type
        const quickInfoGrid = document.getElementById('quick-info-grid');
        if (quickInfoGrid) {
            let quickInfoHTML = '';

            if (workshop.type === 'Product' || workshop.type === 'Merchandise') {
                // Product layout
                quickInfoHTML = `
                    <div class="quick-info-item">
                        <div class="quick-info-label">Format</div>
                        <div class="quick-info-value">${workshop.duration || 'Ready to use'}</div>
                    </div>
                    <div class="quick-info-item">
                        <div class="quick-info-label">Shipping</div>
                        <div class="quick-info-value">${workshop.location || 'Ships to Canada'}</div>
                    </div>
                    <div class="quick-info-item">
                        <div class="quick-info-label">Usage</div>
                        <div class="quick-info-value">${workshop.participants || 'Individual use'}</div>
                    </div>
                    <div class="quick-info-item">
                        <div class="quick-info-label">Type</div>
                        <div class="quick-info-value">Handcrafted Medicine</div>
                    </div>
                `;
            } else {
                // Course/Workshop layout
                quickInfoHTML = `
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
            quickInfoGrid.innerHTML = quickInfoHTML;
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
            const pricingHTML = this.parsePricing(workshop);
            pricingGrid.innerHTML = pricingHTML;
        }

        // Update page title
        document.title = `${workshop.title} - Sxexet Spath (David Peters)`;

        // Update labels based on type
        this.updateLabelsForType(workshop.type);
    },

    /**
     * Update page labels based on item type
     */
    updateLabelsForType(type) {
        if (type === 'Product' || type === 'Merchandise') {
            // Product labels
            document.getElementById('section-label-1').textContent = 'Overview';
            document.getElementById('section-title-1').textContent = 'About This Medicine';
            document.getElementById('section-label-2').textContent = 'Features';
            document.getElementById('section-title-2').textContent = 'Key Benefits';
            document.getElementById('section-subtitle-2').textContent = 'Healing properties and uses';
            document.getElementById('section-label-3').textContent = 'Pricing';
            document.getElementById('section-title-3').textContent = 'Select Your Option';
            document.getElementById('section-subtitle-3').textContent = 'Choose the size that works for you';
            document.getElementById('cta-title').textContent = 'Ready to Order?';
            document.getElementById('cta-text').textContent = 'Add this handcrafted medicine to your cart and experience traditional healing.';
        } else {
            // Course/Workshop labels
            document.getElementById('section-label-1').textContent = 'Overview';
            document.getElementById('section-title-1').textContent = 'About This Workshop';
            document.getElementById('section-label-2').textContent = 'What\'s Included';
            document.getElementById('section-title-2').textContent = 'You Will Experience';
            document.getElementById('section-subtitle-2').textContent = 'Everything you need for a transformative learning experience';
            document.getElementById('section-label-3').textContent = 'Investment';
            document.getElementById('section-title-3').textContent = 'Pricing';
            document.getElementById('section-subtitle-3').textContent = 'Transparent pricing for all participants';
            document.getElementById('cta-title').textContent = 'Ready to Book This Workshop?';
            document.getElementById('cta-text').textContent = 'Schedule this transformative experience for your group or organization.';
        }
    },

    /**
     * Parse the new pricing object and create pricing cards
     */
    parsePricing(workshop) {
        if (!workshop.pricing || !workshop.pricing.model) {
            return '<p>Pricing information is not available for this item.</p>';
        }

        const { model, tiers } = workshop.pricing;
        let html = '';

        for (const key in tiers) {
            const tier = tiers[key];
            let amountHTML = '';
            let periodHTML = '';
            let features = `
                <ul class="pricing-features">
                    <li>High-quality materials</li>
                    <li>Traditional preparation</li>
                    <li>Ready to use</li>
                    <li>Fast shipping</li>
                </ul>
            `;

            if (model === 'per_unit') {
                // Product pricing
                amountHTML = `$${tier.rate / 100}`;
                periodHTML = 'one-time purchase';
                features = `
                    <ul class="pricing-features">
                        <li>Hand-prepared with care</li>
                        <li>Ethically sourced</li>
                        <li>Ships to Canada</li>
                        <li>Long shelf life</li>
                    </ul>
                `;
            } else if (model === 'per_item') {
                // Merchandise pricing
                amountHTML = `$${tier.rate / 100}`;
                periodHTML = 'each';
                features = `
                    <ul class="pricing-features">
                        <li>High-quality materials</li>
                        <li>Ethical production</li>
                        <li>Fast shipping</li>
                        <li>Various sizes</li>
                    </ul>
                `;
            } else if (model === 'per_person') {
                // Course/workshop pricing
                amountHTML = `$${tier.rate / 100}`;
                periodHTML = 'per person';
                features = `
                    <ul class="pricing-features">
                        <li>All materials included</li>
                        <li>Expert facilitation</li>
                        <li>Digital resources</li>
                        <li>Certificate of completion</li>
                    </ul>
                `;
            }
            else if (model === 'tiered_event') {
                amountHTML = `$${(tier.min_total_price / 100).toLocaleString()}`;

                let details = `for up to ${tier.base_participants} participants`;
                if (tier.price_per_additional > 0) {
                    details += `<br>+ $${tier.price_per_additional / 100} per additional person`;
                }
                periodHTML = details;
            }
            else if (model === 'hourly') {
                amountHTML = `$${tier.rate / 100}`;
                periodHTML = 'per hour';
            }

            html += `
                <div class="pricing-card">
                    <div class="pricing-type">${tier.label}</div>
                    <div class="pricing-amount">${amountHTML}</div>
                    <div class="pricing-period">${periodHTML}</div>
                    ${features}
                </div>
            `;
        }

        return html;
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
                    <p>This offering could not be found. Please return to the products page.</p>
                    <button onclick="WorkshopLoader.goBackToWorld()" class="back-button">
                        Return to Products & Services
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
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadWorkshop());
        } else {
            this.loadWorkshop();
        }
    }
};

// WorkshopLoader is already available globally as window.WorkshopLoader
