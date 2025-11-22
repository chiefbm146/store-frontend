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
            text: 'GET A STORE',
            link: '/demo-desk.html'
        },
        ctaSecondary: {
            text: 'MOON TIDE',
            link: 'https://moontidereconciliation.com'
        },
        clientExploreText: 'Explore a Clients Site'
    },

    // Who Is This For Section
    whoIsThisFor: {
        title: 'This Is For You',
        subtitle: 'Anyone can start selling online - no business degree required',
        highlight: 'Accept payments through Stripe under your own name, sole proprietorship, or registered business. You don\'t need a corporation to start making money.',
        businessTypes: [
            {
                icon: '👤',
                title: 'Individuals',
                description: 'Sell under your own name - artists, freelancers, creators, hobbyists turning passion into profit'
            },
            {
                icon: '📋',
                title: 'Sole Proprietors',
                description: 'Small business owners ready to take their services online and reach more customers'
            },
            {
                icon: '🏢',
                title: 'Registered Businesses',
                description: 'Established companies looking for a professional online presence with AI support'
            }
        ],
        examples: {
            title: 'What Can You Sell?',
            items: [
                { icon: '🎨', text: 'Art & Handmade Crafts' },
                { icon: '📚', text: 'Online Courses & Workshops' },
                { icon: '💆', text: 'Wellness & Healing Services' },
                { icon: '🔧', text: 'Consulting & Professional Services' },
                { icon: '📦', text: 'Physical Products & Merchandise' },
                { icon: '🎵', text: 'Music, Books & Digital Downloads' },
                { icon: '🏋️', text: 'Fitness & Coaching Programs' },
                { icon: '🍰', text: 'Food, Baking & Catering' }
            ]
        },
        advantage: {
            icon: '⚡',
            title: 'Start Making Money Right Away',
            description: 'Your store goes live in 24-48 hours. While others spend months building websites, you\'ll already be accepting orders and growing your customer base.'
        }
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
            text: 'GET A STORE',
            link: '/demo-desk.html'
        },
        buttonSecondary: {
            text: 'MOON TIDE',
            link: 'https://moontidereconciliation.com'
        }
    },

    // Footer
    footer: {
        tagline: 'GET A STORE - We Build Your Business Online',
        links: [
            { text: 'GET A STORE', url: '/demo-desk.html' },
            { text: 'About', url: '/about-desk.html' },
            { text: 'Contact', url: '/contact-desk.html' }
        ],
        copyright: '© 2025 AARIE.CA. All rights reserved.'
    }
};

export default desktopPage;
