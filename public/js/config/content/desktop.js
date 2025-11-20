/**
 * Desktop Landing Page Configuration
 * Config-driven content for the main landing page
 */

export const desktopPage = {
    // Hero Section
    hero: {
        icon: '🏪',
        title: 'Build Your Store in Minutes',
        subtitle: 'Create a professional online store with AI-powered chat - no coding required',
        description: 'Launch your custom store selling workshops, products, or services with intelligent chatbots that help your customers 24/7.',
        ctaPrimary: {
            text: 'See Demo Store',
            link: '/shop-desk.html'
        },
        ctaSecondary: {
            text: 'Learn More',
            link: '#about'
        }
    },

    // Features Section
    features: {
        title: 'Why Choose Our Platform',
        subtitle: 'Everything you need to launch your store',
        items: [
            {
                icon: '🎓',
                title: 'Sell Workshops',
                description: 'Create stores that sell educational workshops with booking, scheduling, and payment processing built-in.'
            },
            {
                icon: '📦',
                title: 'Sell Products',
                description: 'Launch product catalogs with inventory management, checkout, and order tracking automatically configured.'
            },
            {
                icon: '⚙️',
                title: 'Sell Services',
                description: 'Offer professional services with consultation booking, service packages, and client management tools.'
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
        title: 'Try the AI Assistant (Demo)',
        subtitle: 'Every store gets a custom chatbot trained on your business',
        placeholder: 'Ask about creating your store, features, pricing...'
    },

    // About Section
    about: {
        title: 'The Platform for Modern Businesses',
        subtitle: 'Build, launch, and grow your online store effortlessly',
        content: [
            'We provide the platform that makes it easy for businesses to create their own professional online stores. Whether you\'re selling workshops, physical products, or professional services, our system handles everything - from product catalogs to checkout to customer support.',
            'Every store comes with a custom AI chatbot trained on your specific business. Your customers get instant answers about your offerings, pricing, and availability 24/7. No coding required, no technical expertise needed - just configure your content and launch.'
        ],
        image: null, // Can add image path here
        emoji: '🚀'
    },

    // Final CTA Section
    cta: {
        title: 'Ready to Launch Your Store?',
        description: 'See our demo store in action - explore how your customers will shop workshops, products, and services with AI assistance.',
        buttonText: 'View Demo Store',
        buttonLink: '/shop-desk.html'
    },

    // Footer
    footer: {
        tagline: 'Your Store Platform - Launch Your Business Today',
        links: [
            { text: 'Demo Store', url: '/shop-desk.html' },
            { text: 'About', url: '/moon-tide-desk.html' },
            { text: 'Contact', url: '/contact-desk.html' }
        ],
        copyright: '© 2025 Your Store Platform. All rights reserved.'
    }
};

export default desktopPage;
