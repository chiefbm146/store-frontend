/**
 * Product Store Module - Full Screen Product Display & Cart Management
 *
 * Displays products for a selected product section in a beautiful fullscreen modal.
 * Allows users to add items to cart or proceed to purchase.
 */

const productStoreModule = {
    // Pricing by section
    pricingBySection: {
        'shirts': 29.99,
        'mugs': 15.99,
        'pendants': 24.99,
        'pins': 12.99,
        'stickers': 4.99,
        'prints': 19.99,
        'touques': 34.99
    },

    async getHtml(payload = {}) {
        const { section, sectionName, image, fallback } = payload;
        const basePrice = this.pricingBySection[section] || 19.99;

        let productsHTML = '<div class="services-grid">';
        for (let i = 1; i <= 10; i++) {
            const productId = `${section}-${i}`;
            const productName = `${sectionName.replace('Sparrow ', '')} #${i}`;
            const productPrice = (basePrice + (i * 0.5)).toFixed(2);

            productsHTML += `
                <div class="service-card">
                    <div class="service-card-image">
                        <img src="${image}" alt="${productName}" onerror="this.src='${fallback}';" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="service-card-content">
                        <h3 class="service-card-name">${productName}</h3>
                        <div style="font-size: 18px; font-weight: 700; color: #C41E3A; margin: 8px 0;">$${productPrice}</div>
                        <div style="display: flex; align-items: center; gap: 8px; margin: 12px 0;">
                            <label style="font-weight: 600;">Qty:</label>
                            <input type="number" class="qty-input" id="qty-${productId}" value="1" min="1" max="99" style="width: 50px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
                        </div>
                        <button class="service-card-action btn-add-cart" data-product-id="${productId}" data-product-name="${productName}" data-product-price="${productPrice}" data-product-section="${section}" data-product-image="${image}" data-product-fallback="${fallback}" style="margin-bottom: 8px;">🛒 Add to Cart</button>
                        <button class="service-card-action btn-buy-now" data-product-id="${productId}" data-product-name="${productName}" data-product-price="${productPrice}" data-product-section="${section}" data-product-image="${image}" data-product-fallback="${fallback}" style="background: linear-gradient(135deg, #C41E3A 0%, #8B1528 100%); color: white; font-weight: 700;">💳 Buy Now</button>
                    </div>
                </div>
            `;
        }
        productsHTML += '</div>';

        const cartCount = window.cartStore ? window.cartStore.getItemCount() : 0;

        const html = `
            <div class="fullscreen-modal-backdrop">
                <div class="fullscreen-modal">
                    <div class="modal-header-game">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <span class="modal-title-emoji">🛍️</span>
                            <h1 class="modal-title-game" style="margin: 0;">${sectionName}</h1>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button id="back-button-product-store" style="background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.5); color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; flex-shrink: 0;" onclick="window.history.back()">← Back</button>
                            <button class="cart-circle-btn" id="cartNavBtn" title="View Cart" style="position: relative;">
                                🛒
                                <span id="cart-count-store" style="position: absolute; top: -8px; right: -8px; background: #FF0000; color: white; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; display: none; align-items: center; justify-content: center; font-weight: bold; line-height: 1;">0</span>
                            </button>
                            <button class="modal-close-btn" onclick="window.moduleManager.closeCurrentModule()">✕</button>
                        </div>
                    </div>

                    <!-- Mobile-specific styles for product-store module -->
                    <style>
                        @media (max-width: 768px) {
                            #back-button-product-store {
                                display: none !important;
                            }
                        }
                    </style>

                    <div class="modal-content-game">
                        ${productsHTML}
                    </div>

                    <div style="display: flex; justify-content: center; gap: 20px; padding: 20px 30px; background: #FBF8F3; border-top: 2px solid #E8DDD4; flex-shrink: 0;">
                        <button class="modal-footer-close-btn" onclick="window.history.back()">← Back to Collections</button>
                        <button class="modal-footer-close-btn" style="background: linear-gradient(135deg, #C41E3A 0%, #8B1528 100%); color: white;" onclick="window.jarvisManager.loadAction('SHOW_CART_CHECKOUT', {})">View Cart (${cartCount}) →</button>
                    </div>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners() {
        // Add to Cart buttons
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                const productPrice = parseFloat(btn.dataset.productPrice);
                const productSection = btn.dataset.productSection;
                const productImage = btn.dataset.productImage;
                const qtyInput = document.getElementById(`qty-${productId}`);
                const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

                this.handleAddToCart(productId, productName, productPrice, productSection, productImage, quantity);
                if (qtyInput) qtyInput.value = 1;
            });
        });

        // Buy Now buttons
        document.querySelectorAll('.btn-buy-now').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                const productPrice = parseFloat(btn.dataset.productPrice);
                const productSection = btn.dataset.productSection;
                const productImage = btn.dataset.productImage;
                const qtyInput = document.getElementById(`qty-${productId}`);
                const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

                this.handleBuyNow(productId, productName, productPrice, productSection, productImage, quantity);
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
        const countBadge = document.getElementById('cart-count-store');
        if (countBadge && window.cartStore) {
            const count = window.cartStore.getItemCount();
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    handleAddToCart(productId, productName, productPrice, section, image, quantity) {
        if (window.cartStore) {
            window.cartStore.addToCart({
                id: productId,
                name: productName,
                price: productPrice,
                section: section,
                image: image
            }, quantity);

            this.showToast(`✓ Added ${quantity}x ${productName} to cart!`);
        }
    },

    handleBuyNow(productId, productName, productPrice, section, image, quantity) {
        if (window.cartStore) {
            window.cartStore.addToCart({
                id: productId,
                name: productName,
                price: productPrice,
                section: section,
                image: image
            }, quantity);

            // Go directly to checkout
            window.jarvisManager.loadAction('SHOW_CART_CHECKOUT', {
                items: window.cartStore.getItems(),
                total: window.cartStore.getTotal(),
                formattedTotal: window.cartStore.getFormattedTotal()
            });
        }
    },

    handleCartClick() {
        console.log('[ProductStore] Cart button clicked');

        // Show the cart checkout module
        if (window.jarvisManager && window.jarvisManager.loadAction) {
            window.jarvisManager.loadAction('SHOW_CART_CHECKOUT', {
                items: window.cartStore ? window.cartStore.getItems() : [],
                total: window.cartStore ? window.cartStore.getTotal() : 0,
                formattedTotal: window.cartStore ? window.cartStore.getFormattedTotal() : '$0.00'
            });
        }
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 20000;
            font-weight: 600;
            font-size: 15px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

export default productStoreModule;
