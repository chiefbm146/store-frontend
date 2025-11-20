/**
 * Desktop Landing Page Configuration
 * Config-driven content for the main landing page
 */

export const desktopPage = {
    // Hero Section
    hero: {
        icon: '🏪',
        title: 'Welcome to Your Store',
        subtitle: 'Your one-stop shop for amazing products, services, and workshops',
        description: 'Discover quality products, professional services, and engaging workshops tailored to your needs.',
        ctaPrimary: {
            text: 'Browse Store',
            link: '/shop-desk.html'
        },
        ctaSecondary: {
            text: 'Learn More',
            link: '#about'
        }
    },

    // Features Section
    features: {
        title: 'Why Choose Us',
        subtitle: 'Everything you need in one place',
        items: [
            {
                icon: '🎓',
                title: 'Expert Workshops',
                description: 'Learn new skills with our interactive workshops led by experienced facilitators.'
            },
            {
                icon: '📦',
                title: 'Quality Products',
                description: 'Premium products crafted with attention to detail and exceptional quality.'
            },
            {
                icon: '⚙️',
                title: 'Professional Services',
                description: 'Comprehensive services tailored to meet your specific needs and goals.'
            },
            {
                icon: '🤖',
                title: 'AI Assistant',
                description: 'Get instant answers to your questions with our intelligent AI chat assistant.'
            }
        ]
    },

    // Chat Section
    chat: {
        title: 'Have Questions? Ask Our AI Assistant',
        subtitle: 'Get instant help with product info, booking, and more',
        placeholder: 'Ask about our products, services, or workshops...'
    },

    // About Section
    about: {
        title: 'About Your Store',
        subtitle: 'Quality and excellence in everything we do',
        content: [
            'We are dedicated to providing exceptional products, services, and educational experiences to our customers. Every item in our catalog has been carefully selected to meet our high standards of quality and value.',
            'Whether you\'re looking to purchase a product, book a service, or attend a workshop, our team is here to ensure you have the best possible experience. We believe in building lasting relationships with our customers through trust, transparency, and outstanding service.'
        ],
        image: null, // Can add image path here
        emoji: '🎯'
    },

    // Final CTA Section
    cta: {
        title: 'Ready to Get Started?',
        description: 'Browse our full catalog of products, services, and workshops today.',
        buttonText: 'Explore Store',
        buttonLink: '/shop-desk.html'
    },

    // Footer
    footer: {
        tagline: 'Your Store - Quality You Can Trust',
        links: [
            { text: 'Shop', url: '/shop-desk.html' },
            { text: 'About Us', url: '/moon-tide-desk.html' },
            { text: 'Contact', url: '/contact-desk.html' }
        ],
        copyright: '© 2025 Your Store. All rights reserved.'
    }
};

export default desktopPage;
