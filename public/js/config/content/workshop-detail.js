/**
 * Workshop Detail Page Template Structure
 *
 * This file defines the TEMPLATE structure for workshop detail pages.
 * Actual workshop data comes from services.js - this just defines the layout sections.
 *
 * Real workshop data is merged with this template and rendered dynamically.
 */

export const workshopDetailTemplate = {
    // Sections that appear on every workshop detail page
    sections: {
        // About section - workshop description
        about: {
            label: "About This Service",
            heading: "[Workshop Title]",
            icon: "ℹ️"
        },

        // Highlights section - key features/benefits (array)
        highlights: {
            label: "Key Benefits",
            icon: "⭐",
            heading: "What You'll Get"
        },

        // Details section - quick info bar (date, time, price, duration)
        details: {
            label: "Quick Details"
        },

        // Pricing section - cost options (array)
        pricing: {
            label: "Pricing Options",
            heading: "Investment"
        },

        // CTA section - final call to action
        cta: {
            label: "Ready to Begin?",
            buttonText: "Book Now",
            buttonIcon: "→"
        }
    },

    // Default structure for quick info items
    quickInfoItems: [
        { label: "Duration", icon: "⏱️" },
        { label: "Format", icon: "🎯" },
        { label: "Level", icon: "📊" },
        { label: "Price", icon: "💰" }
    ]
};

/**
 * USAGE:
 *
 * 1. Service data from services.js includes:
 *    - id, name, icon/image, description
 *    - features (array) → highlights section
 *    - duration, format, level, price → quick info
 *    - pricing (array) → pricing cards
 *
 * 2. renderWorkshopDetail() merges:
 *    - Workshop data from services.js
 *    - This template structure
 *    - HTML elements from workshop-detail-desk.html
 *
 * 3. Result: Fully rendered workshop detail page
 */
