/**
 * Demo Store Configuration
 * Example product-focused store to showcase the platform
 */

export const demoStore = {
    // Store Info
    storeName: 'Premium Goods Co.',
    storeTagline: 'Quality Products for Modern Living',
    storeIcon: '🏪',

    // Navigation
    navigation: {
        links: [
            { text: 'Store', url: '/shop-desk.html', icon: '🛍️' },
            { text: 'About', url: '#about', icon: 'ℹ️' },
            { text: 'Contact', url: '/contact-desk.html', icon: '📬' },
            { text: 'A.I. Chat', url: '#chat', icon: '🤖' },
            { text: 'Cart', url: '/cart-desk.html', icon: '🛒' }
        ]
    },

    // Hero Section
    hero: {
        title: 'Welcome to Premium Goods Co.',
        subtitle: 'Discover quality products for your lifestyle',
        description: 'We curate the finest selection of products designed to enhance your everyday life. From home essentials to unique finds, every item is chosen with care.',
        ctaText: 'Browse Products',
        ctaLink: '/shop-desk.html',
        backgroundImage: null, // Can add image path
        backgroundEmoji: '✨'
    },

    // Featured Products
    featuredProducts: {
        title: 'Featured Products',
        subtitle: 'Hand-picked items just for you',
        products: [
            {
                id: 'product-1',
                name: 'Premium Product 1',
                description: 'High-quality item perfect for everyday use',
                price: '$49.99',
                emoji: '📦',
                link: '/product-detail-desk.html?id=product-1'
            },
            {
                id: 'product-2',
                name: 'Premium Product 2',
                description: 'Expertly crafted with attention to detail',
                price: '$79.99',
                emoji: '🎁',
                link: '/product-detail-desk.html?id=product-1'
            },
            {
                id: 'product-3',
                name: 'Premium Product 3',
                description: 'A customer favorite and bestseller',
                price: '$59.99',
                emoji: '⭐',
                link: '/product-detail-desk.html?id=product-1'
            }
        ]
    },

    // About Section
    about: {
        title: 'About Our Store',
        subtitle: 'Quality you can trust',
        content: [
            'Welcome to Premium Goods Co., where quality meets convenience. We\'ve been serving customers since 2025, providing carefully selected products that enhance everyday living.',
            'Our mission is simple: offer the best products at fair prices with exceptional customer service. Every item in our catalog has been tested and approved by our team to ensure it meets our high standards.'
        ],
        emoji: '🎯'
    },

    // Features
    features: [
        {
            icon: '🚚',
            title: 'Fast Shipping',
            description: 'Free shipping on orders over $50'
        },
        {
            icon: '🔒',
            title: 'Secure Checkout',
            description: 'Your payment information is safe with us'
        },
        {
            icon: '↩️',
            title: 'Easy Returns',
            description: '30-day return policy on all items'
        },
        {
            icon: '🤖',
            title: '24/7 AI Support',
            description: 'Get instant answers from our AI assistant'
        }
    ],

    // Footer
    footer: {
        tagline: 'Premium Goods Co. - Quality for Modern Living',
        copyright: '© 2025 Premium Goods Co. All rights reserved.',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    }
};

export default demoStore;
