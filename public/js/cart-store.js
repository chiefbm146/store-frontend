const cartStore = {
    state: {
        items: [],
        total: 0,
        itemCount: 0,
    },
    listeners: [],

    init() {
        this.loadCart();
        this.updateSummary();
        console.log('🛒 Cart Store Initialized', this.state);
    },

    loadCart() {
        try {
            const storedCart = localStorage.getItem('melaney_cart');
            if (storedCart) {
                const parsedCart = JSON.parse(storedCart);
                this.state.items = parsedCart.items || [];
            }
        } catch (e) {
            console.error("Error loading cart from localStorage:", e);
            this.state.items = [];
        }
    },

    saveCart() {
        localStorage.setItem('melaney_cart', JSON.stringify({ items: this.state.items }));
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify(event, data) {
        this.listeners.forEach(listener => listener(event, data));
    },

    updateSummary() {
        this.state.total = this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        this.state.itemCount = this.state.items.reduce((sum, item) => sum + item.quantity, 0);
        this.saveCart();
        this.notify('updated', this.state);
    },

    // Actions
    addToCart(product, quantity = 1) {
        const existingItemIndex = this.state.items.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            this.state.items[existingItemIndex].quantity += quantity;
        } else {
            this.state.items.push({ ...product, quantity });
        }
        this.updateSummary();
        console.log('🛒 Added to cart:', product.name, 'Quantity:', quantity);
    },

    removeFromCart(productId) {
        this.state.items = this.state.items.filter(item => item.id !== productId);
        this.updateSummary();
        console.log('🛒 Removed from cart:', productId);
    },

    updateQuantity(productId, quantity) {
        const item = this.state.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            }
            this.updateSummary();
            console.log('🛒 Updated quantity for:', productId, 'to', quantity);
        }
    },

    clearCart() {
        this.state.items = [];
        this.updateSummary();
        console.log('🛒 Cart cleared.');
    },

    // Getters
    getItems() {
        return [...this.state.items];
    },

    getTotal() {
        return this.state.total;
    },

    getFormattedTotal() {
        return `$${this.state.total.toFixed(2)}`;
    },

    getItemCount() {
        return this.state.itemCount;
    },

    getSummary() {
        return { ...this.state };
    }
};

cartStore.init();

export default cartStore;