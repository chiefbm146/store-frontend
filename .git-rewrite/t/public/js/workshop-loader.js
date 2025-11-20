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
     * Determine if we're on desktop or mobile
     */
    isMobile() {
        return window.location.pathname.includes('mobile');
    },

    /**
     * Navigate back to appropriate world page
     */
    goBackToWorld() {
        const worldPage = this.isMobile() ? './world-mobile.html' : './world-desk.html';
        window.location.href = worldPage;
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
        if (titleEl) titleEl.textContent = workshop.title;

        // Type badge
        const typeEl = document.getElementById('workshop-type');
        if (typeEl) typeEl.textContent = workshop.type;

        // Icon
        const iconEl = document.getElementById('workshop-icon');
        if (iconEl) iconEl.className = workshop.icon;

        // Image
        const imageEl = document.getElementById('workshop-image');
        if (imageEl && workshop.image) {
            imageEl.src = workshop.image;
            imageEl.alt = workshop.title;
            imageEl.style.display = 'block';
        }

        // Short description
        const descEl = document.getElementById('workshop-description');
        if (descEl) descEl.textContent = workshop.description;

        // Long description
        const longDescEl = document.getElementById('workshop-long-description');
        if (longDescEl) {
            // Split by paragraphs and wrap in <p> tags
            const paragraphs = workshop.longDescription.split('\n\n');
            longDescEl.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        }

        // Details
        const detailsContainer = document.getElementById('workshop-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = `
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <strong>Duration</strong>
                        <p>${workshop.duration}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <div>
                        <strong>Participants</strong>
                        <p>${workshop.participants}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>Location</strong>
                        <p>${workshop.location}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <strong>Investment</strong>
                        <p>${workshop.price}</p>
                    </div>
                </div>
            `;
        }

        // Highlights
        const highlightsEl = document.getElementById('workshop-highlights');
        if (highlightsEl && workshop.highlights) {
            highlightsEl.innerHTML = workshop.highlights
                .map(highlight => `<li>${highlight}</li>`)
                .join('');
        }

        // What to Expect
        const expectEl = document.getElementById('workshop-expect');
        if (expectEl && workshop.whatToExpect) {
            expectEl.innerHTML = workshop.whatToExpect
                .map(item => `<li>${item}</li>`)
                .join('');
        }

        // Update page title
        document.title = `${workshop.title} - Moon Tide Reconciliation`;
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
