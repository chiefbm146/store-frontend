/**
 * Desktop Landing Page Configuration
 * Config-driven content for the main landing page
 */

export const desktopPage = {
    // Hero Section
    hero: {
        icon: '🏪',
        title: 'Your Store Built in 48 Hours',
        subtitle: 'AARIE.CA creates professional online stores with AI-powered chat - you don\'t have to lift a finger',
        description: 'We build your custom store selling workshops, products, or services with intelligent chatbots that help your customers 24/7. Desktop and mobile optimized.',
        ctaPrimary: {
            text: 'AARIES STORE',
            link: '/demo-desk.html'
        },
        ctaSecondary: {
            text: 'MOON TIDE',
            link: 'https://moontidereconciliation.com'
        },
        clientExploreText: 'Explore a Clients Site'
    },

    // Features Section
    features: {
        title: 'Why Choose AARIE.CA',
        subtitle: 'Everything you need - we handle it all',
        items: [
            {
                icon: '🎓',
                title: 'Sell Workshops',
                description: 'We create stores that sell educational workshops with booking, scheduling, and payment processing built-in.'
            },
            {
                icon: '📦',
                title: 'Sell Products',
                description: 'We launch product catalogs with inventory management, checkout, and order tracking automatically configured.'
            },
            {
                icon: '⚙️',
                title: 'Sell Services',
                description: 'We build service pages with consultation booking, service packages, and client management tools.'
            },
            {
                icon: '🤖',
                title: 'Custom AI Chatbots',
                description: 'Each store includes an intelligent AI assistant trained on your business to help customers 24/7.'
            }
        ]
    },

    // Chat Section
    chat: {
        title: 'Meet Your Custom AI Assistant',
        subtitle: 'Every store we build includes a chatbot trained specifically on your business',
        placeholder: 'Ask about how we build your store, features, pricing...'
    },

    // About Section
    about: {
        title: 'AARIE.CA Builds Your Store',
        subtitle: 'Professional websites delivered in 24-48 hours',
        content: [
            'AARIE.CA builds professional online stores and custom websites for your business - you don\'t have to do anything. Whether you\'re selling workshops, physical products, or professional services, we handle everything - from design to product catalogs to checkout to customer support. Your store will be live in 24-48 hours.',
            'Every store we build comes with a custom AI chatbot trained on your specific business. Your customers get instant answers about your offerings, pricing, and availability 24/7. No coding required, no technical expertise needed from you - we build it, you run your business.'
        ],
        image: null, // Can add image path here
        emoji: '🚀'
    },

    // Final CTA Section
    cta: {
        title: 'See What We\'ve Built',
        description: 'Check out Moon Tide Reconciliation - a store we built for a client. See how your customers will shop workshops, products, and services with AI assistance.',
        buttonPrimary: {
            text: 'AARIES STORE',
            link: '/demo-desk.html'
        },
        buttonSecondary: {
            text: 'MOON TIDE',
            link: 'https://moontidereconciliation.com'
        }
    },

    // Footer
    footer: {
        tagline: 'AARIES STORE - We Build Your Business Online',
        links: [
            { text: 'AARIES STORE', url: '/demo-desk.html' },
            { text: 'About', url: '/about-desk.html' },
            { text: 'Contact', url: '/contact-desk.html' }
        ],
        copyright: '© 2025 AARIE.CA. All rights reserved.'
    }
};

export default desktopPage;
