/**
 * Demo Store Configuration
 * Example product-focused store to showcase the platform
 */

export const demoStore = {
    // Store Info
    storeName: 'AARIE.CA',
    storeTagline: 'We Build Your Store in 24-48 Hours',
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
        title: 'Let Us Build Your Store',
        subtitle: 'Place a deposit today and get your store live in 24-48 hours',
        description: 'Stop waiting months for a website. We handle everything - design, setup, products, checkout, and a custom AI chatbot. You focus on your business, we build your online presence.',
        ctaText: 'Get Started Now',
        ctaLink: '/contact-desk.html',
        backgroundImage: null,
        backgroundEmoji: '🏪'
    },

    // Featured Products
    featuredProducts: {
        title: 'Book Your Store Today',
        subtitle: 'Start selling online with just a deposit',
        products: [
            {
                id: 'deposit-1',
                name: 'Basic Store Package',
                description: 'Professional online store with product catalog, checkout, and AI chatbot included.',
                price: '$99 Deposit',
                emoji: '📦',
                link: '/contact-desk.html'
            },
            {
                id: 'deposit-2',
                name: 'Workshop Store Package',
                description: 'Sell workshops and courses with booking, scheduling, and payment processing built-in.',
                price: '$99 Deposit',
                emoji: '🎁',
                link: '/contact-desk.html'
            },
            {
                id: 'deposit-3',
                name: 'Service Store Package',
                description: 'Service business website with consultation booking and client management tools.',
                price: '$99 Deposit',
                emoji: '⭐',
                link: '/contact-desk.html'
            }
        ]
    },

    // About Section
    about: {
        title: 'Why Choose AARIE.CA',
        subtitle: 'Your online store, built by professionals',
        content: [
            'AARIE.CA builds professional online stores for your business - you don\'t have to do anything. Whether you\'re selling workshops, physical products, or professional services, we handle everything from design to checkout to customer support.',
            'Every store we build comes with a custom AI chatbot trained specifically on your business. Your customers get instant answers about your offerings 24/7. No coding required, no technical expertise needed - we build it, you run your business.'
        ],
        emoji: '💳'
    },

    // Features
    features: [
        {
            icon: '🌍',
            title: 'Global Reach',
            description: 'Set up your store to serve customers anywhere in the world.'
        },
        {
            icon: '🔒',
            title: 'Trusted Payment Gateway',
            description: 'Leverage industry-leading payment solutions for peace of mind.'
        },
        {
            icon: '🎨',
            title: 'Customizable Storefronts',
            description: 'Design a unique shopping experience that reflects your brand.'
        },
        {
            icon: '🤖',
            title: '24/7 AI Assistant',
            description: 'Empower your customers with instant information and support around the clock.'
        }
    ],

    // Footer
    footer: {
        tagline: 'AARIE.CA - We Build Your Store in 24-48 Hours',
        copyright: '© 2025 AARIE.CA. All rights reserved.',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    }
};

export default demoStore;
