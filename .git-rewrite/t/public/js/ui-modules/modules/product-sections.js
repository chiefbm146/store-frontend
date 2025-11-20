/**
 * Product Sections Modal - Full Screen Product Category Selection
 * Displays all 7 Moon Tide product categories in a beautiful fullscreen game-like modal
 */

const productSectionsModule = {
    sections: [
        { id: 'shirts', name: 'Moon Tide Shirts', emoji: '👕', image: '/images/webp/shirts.webp', fallback: '/images/1/shirts.png', description: 'High-quality shirts featuring unique Moon Tide designs.' },
        { id: 'mugs', name: 'Moon Tide Mugs', emoji: '☕', image: '/images/webp/mugs.webp', fallback: '/images/1/mugs.png', description: 'Premium ceramic mugs featuring unique Moon Tide designs.' },
        { id: 'pendants', name: 'Moon Tide Pendants', emoji: '✨', image: '/images/webp/pendants.webp', fallback: '/images/1/pendants.png', description: 'Elegant pendants featuring unique Moon Tide designs.' },
        { id: 'pins', name: 'Moon Tide Pins', emoji: '📌', image: '/images/webp/pins.webp', fallback: '/images/1/pins.png', description: 'Collectible pins featuring unique Moon Tide designs.' },
        { id: 'stickers', name: 'Moon Tide Stickers', emoji: '🎨', image: '/images/webp/stickers.webp', fallback: '/images/1/stickers.png', description: 'Colorful stickers featuring unique Moon Tide designs.' },
        { id: 'prints', name: 'Moon Tide Prints', emoji: '🖼️', image: '/images/webp/prints.webp', fallback: '/images/1/prints.png', description: 'Beautiful art prints featuring unique Moon Tide designs.' },
        { id: 'touques', name: 'Moon Tide Touques', emoji: '🧢', image: '/images/webp/touques.webp', fallback: '/images/1/touques.png', description: 'Cozy winter touques featuring unique Moon Tide designs.' }
    ],

    async getHtml(payload = {}) {
        let cardsHTML = '';

        this.sections.forEach(section => {
            cardsHTML += `
                <div class="service-card">
                    <div class="service-card-image">
                        <img
                            src="${section.image}"
                            alt="${section.name}"
                            onerror="this.src='${section.fallback}';"
                            style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="service-card-content">
                        <div class="service-card-emoji">${section.emoji}</div>
                        <h3 class="service-card-name">${section.name}</h3>
                        <p class="service-card-description">${section.description}</p>
                        <button class="service-card-action" data-section-id="${section.id}" data-section-name="${section.name}" style="margin-top: auto;">
                            Select Collection →
                        </button>
                    </div>
                </div>
            `;
        });

        const html = `
            <div class="fullscreen-modal-backdrop">
                <div class="fullscreen-modal">
                    <div class="modal-header-game">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="modal-title-emoji">🛍️</span>
                            <h1 class="modal-title-game" style="margin: 0;">Moon Tide Collections</h1>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button class="cart-circle-btn" id="cartNavBtn" title="View Cart" style="position: relative;">
                                🛒
                                <span id="cart-count-sections" style="position: absolute; top: -8px; right: -8px; background: #FF0000; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; display: none; align-items: center; justify-content: center; font-weight: bold; line-height: 1;">0</span>
                            </button>
                            <button class="modal-close-btn" onclick="window.moduleManager.closeCurrentModule()">✕</button>
                        </div>
                    </div>

                    <div class="modal-content-game">
                        <div class="services-grid">
                            ${cardsHTML}
                        </div>
                    </div>

                    <div style="display: flex; justify-content: center; gap: 20px; padding: 20px 30px; background: #FBF8F3; border-top: 2px solid #E8DDD4; flex-shrink: 0;">
                        <button class="modal-footer-close-btn" onclick="window.moduleManager.closeCurrentModule()">Close</button>
                    </div>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners() {
        // Select buttons
        document.querySelectorAll('[data-section-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = btn.dataset.sectionId;
                const sectionName = btn.dataset.sectionName;
                this.handleSelectSection(sectionId, sectionName);
            });
        });

        // Cart button
        const cartBtn = document.getElementById('cartNavBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleCartClick();
            });
        }

        // Update cart count
        this.updateCartCount();

        // Subscribe to cart changes
        if (window.cartStore) {
            window.cartStore.subscribe(() => {
                this.updateCartCount();
            });
        }
    },

    updateCartCount() {
        const countBadge = document.getElementById('cart-count-sections');
        if (countBadge && window.cartStore) {
            const count = window.cartStore.getItemCount();
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    handleSelectSection(sectionId, sectionName) {
        console.log('[ProductSections] Selected section:', sectionId);

        if (window.jarvisManager && window.jarvisManager.loadAction) {
            window.jarvisManager.loadAction('SHOW_PRODUCT_STORE', {
                section: sectionId,
                sectionName: sectionName,
                image: `/images/webp/${sectionId}.webp`,
                fallback: `/images/1/${sectionId}.png`
            });
        }
    },

    handleCartClick() {
        console.log('[ProductSections] Cart button clicked');

        // Close the collections module
        if (window.moduleManager) {
            window.moduleManager.closeCurrentModule();
        }

        // Clear the URL hash state
        window.location.hash = '';

        // Show the cart checkout module
        if (window.jarvisManager && window.jarvisManager.loadAction) {
            window.jarvisManager.loadAction('SHOW_CART_CHECKOUT', {
                items: window.cartStore ? window.cartStore.getItems() : [],
                total: window.cartStore ? window.cartStore.getTotal() : 0,
                formattedTotal: window.cartStore ? window.cartStore.getFormattedTotal() : '$0.00'
            });
        }
    }
};

export default productSectionsModule;
