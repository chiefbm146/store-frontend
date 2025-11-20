/**
 * Pages Configuration
 * Static content for all pages in the application
 *
 * This file defines:
 * - About Us page content
 * - Founder profile content
 * - Contact page content
 * - Menu/navigation content
 * - All other static page content
 *
 * NOTE: Currently has "Your Store Here" placeholder content.
 * This will be fully configurable via Store Printer portal.
 */

export const pageContent = {
    // ===== ABOUT US PAGE (Config-Driven) =====
    about: {
        title: "About Your Store",
        description: "Learn about your store's vision and values",

        // Hero section (uses emoji icon, no image path)
        hero: {
            icon: "🏪",
            title: "Your Store Name",
            subtitle: "Your Store Tagline",
            description: "Your store description goes here"
        },

        // Vision section
        vision: {
            label: "Our Vision",
            title: "Your Store's Future",
            paragraphs: [
                "Our vision is to empower you to build and grow a store that truly represents your brand. We create an environment where your products and services shine, connecting authentically with your customers.",
                "We believe success is built through quality products, exceptional service, and genuine customer relationships. Your store is a reflection of your values, and we're here to help you bring that vision to life."
            ]
        },

        // Mission section
        mission: {
            label: "Our Mission",
            title: "Making Your Store Successful",
            paragraphs: [
                "We make it easy to create, customize, and manage a beautiful online store that sells. Our platform combines simplicity with powerful features.",
                "We guide you through every step—from setup to scaling—providing the tools and support you need to grow your business with confidence.",
                "Your success is our success. We're committed to helping you build a store that works as hard as you do."
            ]
        },

        // Values section (array for dynamic card rendering)
        values: [
            {
                icon: "🛍️",
                title: "Easy to Use",
                content: [
                    "Intuitive interface: Build your store without coding experience.",
                    "Drag & drop: Customize your store your way with simple tools.",
                    "Quick setup: Get online in minutes, not months."
                ]
            },
            {
                icon: "💪",
                title: "Powerful Features",
                content: [
                    "Complete e-commerce: Products, inventory, payments, shipping all included.",
                    "Professional design: Beautiful templates that convert visitors to customers.",
                    "Flexible customization: Make it yours without limitations."
                ]
            },
            {
                icon: "🌍",
                title: "Global Reach",
                content: [
                    "Sell worldwide: Accept payments from customers anywhere.",
                    "Multi-currency support: Reach international markets with ease.",
                    "Scalable platform: Grows with your business, no matter how fast."
                ]
            },
            {
                icon: "🤝",
                title: "Expert Support",
                content: [
                    "Dedicated help: Our team is here to support your success.",
                    "Resources & guides: Tutorials, docs, and best practices.",
                    "Community: Learn from other successful store owners."
                ]
            }
        ],

        // Quote section
        quote: {
            text: "Your store, your way. We provide the platform; you provide the passion.",
            attribution: "Building successful businesses, one store at a time."
        },

        // Footer section
        footer: {
            location: "Your Location Here"
        }
    },

    // ===== FOUNDER PROFILE PAGE =====
    founder: {
        name: "Jane Doe",
        title: "Founder & CEO",
        image: "/images/pages/founder.jpg",

        // Short bio (for cards, previews)
        bio: "Jane Doe is a visionary entrepreneur with over 10 years of experience in digital commerce and AI technology.",

        // Long bio (for full profile page)
        longBio: `Jane Doe is a visionary entrepreneur with over 10 years of experience in digital commerce and AI technology. She founded Your Brand in 2023 with a mission to democratize access to world-class e-commerce solutions.

Before founding Your Brand, Jane led product development at several Fortune 500 tech companies, where she pioneered innovative approaches to online retail and customer experience.

Jane holds a Master's degree in Computer Science from Stanford University and is a frequent speaker at industry conferences on topics ranging from AI-powered commerce to sustainable business practices.

When she's not building the future of e-commerce, Jane enjoys hiking, reading, and mentoring aspiring entrepreneurs.`,

        // Quote
        quote: "\"Building something meaningful is my passion. I believe technology should empower people, not complicate their lives.\"",

        // Stats/achievements
        stats: [
            { label: "Years Experience", value: "10+", icon: "📊" },
            { label: "Clients Helped", value: "500+", icon: "🤝" },
            { label: "Team Members", value: "25", icon: "👥" },
            { label: "Awards Won", value: "3", icon: "🏆" }
        ],

        // Career highlights
        highlights: [
            {
                year: "2023",
                title: "Founded Your Brand",
                description: "Launched the company with a vision to transform digital commerce.",
            },
            {
                year: "2020-2023",
                title: "VP of Product at TechCorp",
                description: "Led product development for e-commerce platform serving 1M+ merchants.",
            },
            {
                year: "2015-2020",
                title: "Senior Engineer at BigCo",
                description: "Built scalable systems processing billions of transactions.",
            },
            {
                year: "2013",
                title: "M.S. Computer Science, Stanford",
                description: "Specialized in machine learning and distributed systems.",
            },
        ],

        // Social media
        social: {
            linkedin: "https://linkedin.com/in/janedoe",
            twitter: "https://twitter.com/janedoe",
            email: "jane@yourbrand.com",
        },

        // Contact
        contact: {
            email: "jane@yourbrand.com",
            availableFor: ["Speaking engagements", "Mentorship", "Media inquiries"],
        },
    },

    // ===== CONTACT PAGE (Config-Driven) =====
    contact: {
        title: "Contact Your Store",
        description: "Get in touch with our team",

        // Hero section
        hero: {
            title: "Get in Touch",
            subtitle: "Have questions about your store or need support? We're here to help.",
        },

        // Left column - contact info
        contactInfo: {
            email: {
                label: "Email",
                value: "support@yourstore.com",
                note: "Respond within 24 hours"
            },
            phone: {
                label: "Phone",
                note: "Call us during business hours"
            }
        },

        // Right column - details
        details: [
            {
                icon: "📍",
                title: "Locations",
                content: [
                    "Vancouver, BC",
                    "Available Worldwide"
                ]
            },
            {
                icon: "👤",
                title: "Support Team",
                content: [
                    "Dedicated Account Manager",
                    "Email Support",
                    "Live Chat Available"
                ]
            },
            {
                icon: "🛠️",
                title: "What We Offer",
                content: [
                    "Store Setup & Configuration",
                    "Design Customization",
                    "Payment & Shipping Setup",
                    "Marketing Support",
                    "Technical Assistance",
                    "24/7 Monitoring"
                ]
            },
            {
                icon: "🤝",
                title: "Who We Serve",
                content: [
                    "Small to Medium Businesses",
                    "Entrepreneurs & Startups",
                    "Established Brands",
                    "Online Retailers",
                    "Service Providers"
                ]
            }
        ],

        // Hours
        hours: {
            heading: "Business Hours",
            weekdays: "Monday - Friday: 8:00 AM - 6:00 PM PT",
            weekends: "Saturday - Sunday: Support Available",
            timezone: "Pacific Time (PT)",
        }
    },

    // ===== MENU / HOME PAGE =====
    menu: {
        heading: "Explore Your Store",
        subheading: "Discover everything we have to offer",

        // Menu items (navigation)
        items: [
            {
                id: "chat",
                label: "AI Chat",
                route: "/chat",
                icon: "💬",
                description: "Talk to our AI assistant",
                featured: true,
            },
            {
                id: "services",
                label: "Services",
                route: "/workshops",
                icon: "🎓",
                description: "Browse our service catalog",
                featured: true,
            },
            {
                id: "products",
                label: "Products",
                route: "/products",
                icon: "🛍️",
                description: "Shop our products",
                featured: true,
            },
            {
                id: "about",
                label: "About Us",
                route: "/moon-tide",
                icon: "🌊",
                description: "Learn about our mission",
                featured: false,
            },
            {
                id: "founder",
                label: "Our Founder",
                route: "/shona",
                icon: "👤",
                description: "Meet our founder",
                featured: false,
            },
            {
                id: "contact",
                label: "Contact",
                route: "/contact",
                icon: "📞",
                description: "Get in touch with us",
                featured: false,
            },
            {
                id: "account",
                label: "My Account",
                route: "/Account",
                icon: "👤",
                description: "View your account",
                featured: false,
            },
            {
                id: "cart",
                label: "Cart",
                route: "/cart",
                icon: "🛒",
                description: "View your cart",
                featured: false,
            },
        ],

        // Featured sections
        featuredSections: [
            {
                title: "New Arrivals",
                description: "Check out our latest offerings",
                image: "/images/pages/new-arrivals.jpg",
                link: "/products",
            },
            {
                title: "Best Sellers",
                description: "Our most popular items",
                image: "/images/pages/best-sellers.jpg",
                link: "/workshops",
            },
            {
                title: "Special Offers",
                description: "Limited time deals",
                image: "/images/pages/special-offers.jpg",
                link: "/products",
            },
        ],
    },

    // ===== ACCOUNT / DASHBOARD PAGE =====
    account: {
        heading: "My Account",
        subheading: "Manage your orders, profile, and preferences",

        // Sections
        sections: [
            {
                id: "orders",
                title: "Order History",
                icon: "📦",
                description: "View your past orders and receipts",
            },
            {
                id: "profile",
                title: "Profile Settings",
                icon: "👤",
                description: "Update your personal information",
            },
            {
                id: "billing",
                title: "Billing & Payments",
                icon: "💳",
                description: "Manage payment methods and invoices",
            },
            {
                id: "preferences",
                title: "Preferences",
                icon: "⚙️",
                description: "Customize your experience",
            },
        ],

        // Loyalty program (mockup)
        loyalty: {
            enabled: false, // Future feature
            tiers: [
                { name: "New", minSpend: 0, discount: 0 },
                { name: "Valued", minSpend: 50000, discount: 5 }, // $500 in cents
                { name: "Trusted", minSpend: 200000, discount: 10 },
                { name: "Premier", minSpend: 500000, discount: 15 },
            ],
        },
    },

    // ===== CART PAGE =====
    cart: {
        heading: "Your Cart",
        emptyMessage: "Your cart is empty",
        emptySubtext: "Add some items to get started!",
        continueShoppingText: "Continue Shopping",
        proceedToCheckoutText: "Proceed to Checkout",
    },

    // ===== CHECKOUT PAGE =====
    checkout: {
        heading: "Checkout",
        steps: [
            { id: "contact", label: "Contact Info", icon: "📧" },
            { id: "shipping", label: "Shipping", icon: "🚚" },
            { id: "payment", label: "Payment", icon: "💳" },
            { id: "review", label: "Review", icon: "✅" },
        ],
        termsText: "By placing this order, you agree to our Terms of Service and Privacy Policy.",
        placeOrderText: "Place Order",
    },

    // ===== PRIVACY POLICY PAGE =====
    privacy: {
        title: "Privacy Policy",
        lastUpdated: "November 19, 2025",
        intro: "Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.",
        // Full policy content would go here (too long for this example)
    },

    // ===== TERMS OF SERVICE PAGE =====
    terms: {
        title: "Terms of Service",
        lastUpdated: "November 19, 2025",
        intro: "By using our services, you agree to these terms and conditions.",
        // Full terms content would go here
    },

    // ===== 404 ERROR PAGE =====
    error404: {
        heading: "404 - Page Not Found",
        message: "Oops! The page you're looking for doesn't exist.",
        homeButtonText: "Go Home",
        searchPlaceholder: "Search our site...",
    },

    // ===== DEVELOPER PAGE =====
    developer: {
        heading: "Developer Portfolio",
        subheading: "Building the Future of Digital Commerce",

        intro: "Showcase your technical capabilities and attract new clients.",

        capabilities: [
            {
                title: "AI Integration",
                description: "Advanced AI chat systems powered by latest language models",
                icon: "🤖",
                technologies: ["GPT-4", "Gemini", "Claude"],
            },
            {
                title: "E-Commerce Solutions",
                description: "Full-featured shopping carts and checkout systems",
                icon: "🛒",
                technologies: ["Stripe", "PayPal", "Square"],
            },
            {
                title: "3D Web Graphics",
                description: "Stunning 3D visuals using WebGL and Three.js",
                icon: "🎨",
                technologies: ["Three.js", "WebGL", "GLSL"],
            },
            {
                title: "Security & Performance",
                description: "Enterprise-grade security and blazing-fast performance",
                icon: "🔐",
                technologies: ["Firebase", "Cloud Run", "CDN"],
            },
        ],

        cta: {
            heading: "Let's Build Something Amazing",
            body: "Contact us to discuss your project.",
            buttonText: "Get in Touch",
            buttonUrl: "/contact",
        },
    },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get page content by page name
 */
export function getPageContent(pageName) {
    return pageContent[pageName] || null;
}

/**
 * Get menu items
 */
export function getMenuItems() {
    return pageContent.menu.items;
}

/**
 * Get featured menu items
 */
export function getFeaturedMenuItems() {
    return pageContent.menu.items.filter(item => item.featured);
}

// Export default
export default pageContent;
