/**
 * Demo Store Configuration
 * Example product-focused store to showcase the platform
 */

export const demoStore = {
    // Store Info
    storeName: 'AARIE.CA',
    storeTagline: 'Your Website Live in 7 Days',
    storeIcon: '🏪',

    // Navigation
    navigation: {
        links: [
            { text: 'Get a Store', url: '/store-booking.html', icon: '🏪' },
            { text: 'About', url: '#about', icon: 'ℹ️' },
            { text: 'Contact', url: '/contact-desk.html', icon: '📬' },
            { text: 'A.I. Chat', url: '#chat', icon: '🤖' }
        ]
    },

    // Hero Section
    hero: {
        title: 'The 7-Day Launchpad',
        subtitle: 'See your first design mockup in 72 hours. Go live in 7-10 days.',
        description: 'Stop waiting months for a website. We handle everything - design, setup, products, checkout, and a custom AI chatbot. You focus on your business, we build your online presence. Only 4 projects per month.',
        ctaText: 'Start Your Project',
        ctaLink: '/store-booking.html',
        backgroundImage: null,
        backgroundEmoji: '🏪'
    },

    // Featured Products
    featuredProducts: {
        title: 'The 7-Day Launchpad Package',
        subtitle: 'Design mockup in 72 hours. Live website in 7-10 days.',
        products: [
            {
                id: 'deposit-1',
                name: 'Basic Website Package',
                description: 'Professional website with product catalog, checkout, and AI chatbot included. Up to 5 pages.',
                price: '$499',
                emoji: '📦',
                link: '/store-booking.html'
            },
            {
                id: 'deposit-2',
                name: 'Workshop Website Package',
                description: 'Sell workshops and courses with booking, scheduling, and payment processing built-in.',
                price: '$499',
                emoji: '🎁',
                link: '/store-booking.html'
            },
            {
                id: 'deposit-3',
                name: 'Service Website Package',
                description: 'Service business website with consultation booking and client management tools.',
                price: '$499',
                emoji: '⭐',
                link: '/store-booking.html'
            }
        ]
    },

    // About Section
    about: {
        title: 'Why Choose AARIE.CA',
        subtitle: 'Your online store, built by professionals',
        content: [
            'AARIE.CA builds professional websites for your business - you don\'t have to do anything. Whether you\'re selling workshops, physical products, or professional services, we handle everything from design to checkout to customer support.',
            'Every website we build comes with a custom AI chatbot trained specifically on your business. Your customers get instant answers about your offerings 24/7. No coding required, no technical expertise needed - we build it, you run your business.'
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
        tagline: 'AARIE.CA - Your Website Live in 7 Days',
        copyright: '© 2025 AARIE.CA. All rights reserved.',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    }
};

export default demoStore;
