/**
 * Cart Checkout Module - Full Screen Shopping Cart Display & Checkout
 *
 * Displays cart contents in a beautiful fullscreen modal and provides checkout functionality.
 * Uses dynamic DOM updates to avoid UI flashing on item changes.
 */

const cartCheckoutModule = {
    async getHtml(payload = {}) {
        const items = window.cartStore ? window.cartStore.getItems() : [];

        let cartItemsHTML = '';

        if (!items || items.length === 0) {
            cartItemsHTML = `
                <div id="cart-empty-state" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; text-align: center;">
                    <div style="font-size: 80px;">🛒</div>
                    <h3 style="color: #4A4A4A; font-size: 24px; margin: 0;">Your cart is empty</h3>
                    <p style="color: #6B6B6B; font-size: 16px; margin: 0;">Browse our products and add items to your cart.</p>
                </div>
            `;
        } else {
            cartItemsHTML = '<div id="cart-items-container" style="display: grid; grid-template-columns: 1fr; gap: 16px; padding: 0; margin-bottom: 20px;">';

            items.forEach(item => {
                const itemTotal = (item.price * item.quantity).toFixed(2);
                cartItemsHTML += `
                    <div class="cart-item" data-product-id="${item.id}" style="background: white; border: 2px solid #E8DDD4; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 80px 1fr auto auto auto; gap: 16px; align-items: center; transition: all 0.2s ease;">
                        <div style="width: 80px; height: 80px; background: #f5f5f5; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.textContent='📦';">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <h4 style="margin: 0; font-size: 16px; color: #4A4A4A;">${item.name}</h4>
                            <p style="margin: 0; font-size: 14px; color: #6B6B6B;">$${item.price.toFixed(2)} each</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-weight: 600;">Qty:</label>
                            <input type="number" class="qty-input" data-product-id="${item.id}" value="${item.quantity}" min="1" max="99" style="width: 50px; padding: 6px; border: 1px solid #ddd; border-radius: 4px; text-align: center;">
                        </div>
                        <div class="item-total" style="font-size: 16px; font-weight: 700; color: #C41E3A; min-width: 80px; text-align: right;">$${itemTotal}</div>
                        <button class="btn-remove-item" data-product-id="${item.id}" style="background: #C41E3A; color: white; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 18px; font-weight: 700; flex-shrink: 0; transition: all 0.2s ease;">✕</button>
                    </div>
                `;
            });

            cartItemsHTML += '</div>';

            // Cart Summary
            const formattedTotal = window.cartStore ? window.cartStore.getFormattedTotal() : '$0.00';
            cartItemsHTML += `
                <div id="cart-summary" style="background: white; border: 2px solid #E8DDD4; border-radius: 12px; padding: 20px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; margin-top: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 15px;">
                            <span style="color: #6B6B6B;">Subtotal:</span>
                            <span id="subtotal-value" style="font-weight: 600; color: #4A4A4A;">${formattedTotal}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 15px;">
                            <span style="color: #6B6B6B;">Shipping:</span>
                            <span style="font-weight: 600; color: #4A4A4A;">TBD</span>
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #999;">* Shipping will be calculated at checkout</p>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <span style="font-size: 14px; color: #6B6B6B;">Total:</span>
                        <div id="total-value" style="font-size: 24px; font-weight: 700; color: #C41E3A;">${formattedTotal}</div>
                    </div>
                </div>
            `;
        }

        const checkoutButton = items && items.length > 0 ? `
            <button id="proceed-to-payment-btn" style="background: linear-gradient(135deg, #C41E3A 0%, #FF7B2A 100%); color: white; font-weight: 600; flex-shrink: 0; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Proceed to Payment →</button>
        ` : '';

        const clearButton = items && items.length > 0 ? `
            <button id="clear-cart-btn" style="background: #C41E3A; color: white; font-weight: 600; flex-shrink: 0; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Clear All</button>
        ` : '';

        const html = `
            <div class="fullscreen-modal-backdrop">
                <div class="fullscreen-modal">
                    <div class="modal-header-game">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="modal-title-emoji">🛒</span>
                            <h1 class="modal-title-game" style="margin: 0;">Your Cart</h1>
                        </div>
                        <button class="modal-close-btn" onclick="window.moduleManager.closeCurrentModule()">✕</button>
                    </div>

                    <div class="modal-content-game">
                        ${cartItemsHTML}
                    </div>

                    <div style="display: flex; justify-content: center; gap: 20px; padding: 20px 30px; background: #FBF8F3; border-top: 2px solid #E8DDD4; flex-shrink: 0;">
                        <button class="modal-footer-close-btn" onclick="window.history.back()">← Continue Shopping</button>
                        ${clearButton}
                        ${checkoutButton}
                    </div>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners() {
        // Remove item buttons
        document.querySelectorAll('.btn-remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                this.handleRemoveItemDynamic(productId);
            });
        });

        // Quantity change
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', () => {
                const productId = input.dataset.productId;
                const newQty = parseInt(input.value);
                this.handleQuantityChangeDynamic(productId, newQty);
            });
        });

        // Clear cart button
        const clearBtn = document.getElementById('clear-cart-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your entire cart?')) {
                    this.handleClearCart();
                }
            });
        }

        // Proceed to Payment button
        const proceedBtn = document.getElementById('proceed-to-payment-btn');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => {
                this.handleProceedToPayment();
            });
        }
    },

    handleProceedToPayment() {
        if (!window.jarvisManager) return;

        const items = window.cartStore ? window.cartStore.getItems() : [];
        const total = window.cartStore ? window.cartStore.getTotal() : 0;
        const formattedTotal = window.cartStore ? window.cartStore.getFormattedTotal() : '$0.00';

        console.log('[CartCheckout] 💳 Proceeding to INDEPENDENT Stripe checkout with', items.length, 'items, total:', formattedTotal);

        // Load the NEW independent Stripe checkout (not nested in chat viewport!)
        window.jarvisManager.loadAction('SHOW_STRIPE_CHECKOUT', {
            items: items,
            total: total,
            formattedTotal: formattedTotal
        });
    },

    handleRemoveItemDynamic(productId) {
        if (!window.cartStore) return;

        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (cartItem) {
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'scale(0.9)';
            cartItem.style.transition = 'all 0.2s ease';

            setTimeout(() => {
                window.cartStore.removeFromCart(productId);
                cartItem.remove();
                this.updateCartSummary();
                this.checkEmptyCart();
            }, 200);
        }
    },

    handleQuantityChangeDynamic(productId, newQuantity) {
        if (!window.cartStore) return;

        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (cartItem && newQuantity > 0) {
            window.cartStore.updateQuantity(productId, newQuantity);

            const item = window.cartStore.getItems().find(i => i.id === productId);
            if (item) {
                const itemTotalElement = cartItem.querySelector('.item-total');
                const itemTotal = (item.price * item.quantity).toFixed(2);
                itemTotalElement.textContent = `$${itemTotal}`;
            }

            this.updateCartSummary();
        }
    },

    handleClearCart() {
        if (!window.cartStore) return;

        const cartItemsContainer = document.getElementById('cart-items-container');
        if (cartItemsContainer) {
            cartItemsContainer.style.opacity = '0';
            cartItemsContainer.style.transform = 'scale(0.95)';
            cartItemsContainer.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                window.cartStore.clearCart();
                this.checkEmptyCart();
            }, 300);
        }
    },

    updateCartSummary() {
        if (!window.cartStore) return;

        const formattedTotal = window.cartStore.getFormattedTotal();
        const subtotalValue = document.getElementById('subtotal-value');
        const totalValue = document.getElementById('total-value');

        if (subtotalValue) subtotalValue.textContent = formattedTotal;
        if (totalValue) totalValue.textContent = formattedTotal;
    },

    checkEmptyCart() {
        if (!window.cartStore) return;

        const items = window.cartStore.getItems();
        const modalContent = document.querySelector('.modal-content-game');

        if (items.length === 0) {
            // Show empty state
            const emptyState = document.getElementById('cart-empty-state');
            const cartSummary = document.getElementById('cart-summary');
            const cartItems = document.getElementById('cart-items-container');

            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            if (cartSummary) cartSummary.style.display = 'none';
            if (cartItems) cartItems.style.display = 'none';

            // Hide checkout button and clear button
            document.querySelectorAll('.modal-footer-close-btn').forEach(btn => {
                if (btn.textContent.includes('Payment') || btn.textContent.includes('Clear')) {
                    btn.style.display = 'none';
                }
            });
        }
    }
};

export default cartCheckoutModule;
