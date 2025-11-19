/**
 * Theme Configuration
 * Controls the entire visual identity of the store
 *
 * This file defines:
 * - Color palette
 * - Typography (fonts)
 * - Spacing scale
 * - Border radius
 * - Shadows
 * - Transitions
 *
 * NOTE: Currently populated with Moon Tide's existing colors.
 * These will be customizable via the Store Printer portal in the future.
 */

export const theme = {
    // ===== COLOR PALETTE =====
    colors: {
        // Primary brand colors (Blue - Moon Tide theme)
        primary: '#1E90FF',          // Dodger Blue - Main brand color
        primaryDark: '#0047AB',      // Cobalt Blue - Dark variant
        primaryLight: '#87CEEB',     // Sky Blue - Light variant

        // Accent colors
        accent: '#FFD700',           // Gold - Accent/CTA color
        accentHover: '#FFC700',      // Darker gold - Hover state
        accentDark: '#B8860B',       // Dark goldenrod

        // Secondary colors
        secondary: '#50C878',        // Emerald green - Success/positive
        secondaryDark: '#228B22',    // Forest green

        // Alert/Status colors
        success: '#50C878',          // Emerald green - Success states
        error: '#E63E54',            // Red - Error states
        warning: '#FFD700',          // Gold - Warning states
        info: '#1E90FF',             // Blue - Info states

        // Text colors
        textPrimary: '#1a1a1a',      // Almost black - Primary text
        textSecondary: '#555555',    // Dark gray - Secondary text
        textTertiary: '#888888',     // Medium gray - Tertiary text
        textLight: '#FFFFFF',        // White - Light text on dark backgrounds
        textMuted: '#999999',        // Light gray - Muted/disabled text

        // Background colors
        background: '#F5F1E8',       // Cream/beige - Page background
        backgroundDark: '#1a1a1a',   // Dark background (for dark mode future)
        surface: '#FFFFFF',          // White - Card/surface backgrounds
        surfaceHover: '#F9F9F9',     // Light gray - Hover state for surfaces
        overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black - Modal overlays

        // Border colors
        border: '#E0E0E0',           // Light gray - Default borders
        borderDark: '#CCCCCC',       // Medium gray - Darker borders
        borderLight: '#F0F0F0',      // Very light gray - Subtle borders

        // Special colors (Moon Tide specific)
        moonBlue: '#1E90FF',         // Moon blue
        moonDark: '#0047AB',         // Dark moon blue
        oceanBlue: '#4A90E2',        // Ocean blue
        waterBlue: '#5DA9E9',        // Water blue

        // Transparent variants (for gradients/overlays)
        primaryAlpha: 'rgba(30, 144, 255, 0.1)',    // 10% primary
        primaryAlpha20: 'rgba(30, 144, 255, 0.2)',  // 20% primary
        primaryAlpha50: 'rgba(30, 144, 255, 0.5)',  // 50% primary
        accentAlpha: 'rgba(255, 215, 0, 0.1)',      // 10% accent
        blackAlpha: 'rgba(0, 0, 0, 0.1)',           // 10% black
    },

    // ===== TYPOGRAPHY =====
    fonts: {
        // Font families
        body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
        mono: "'Courier New', 'Monaco', 'Consolas', monospace",

        // Font sizes
        sizes: {
            xs: '0.75rem',      // 12px
            sm: '0.875rem',     // 14px
            base: '1rem',       // 16px
            lg: '1.125rem',     // 18px
            xl: '1.25rem',      // 20px
            '2xl': '1.5rem',    // 24px
            '3xl': '1.875rem',  // 30px
            '4xl': '2.25rem',   // 36px
            '5xl': '3rem',      // 48px
            '6xl': '3.75rem',   // 60px
        },

        // Font weights
        weights: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
        },

        // Line heights
        lineHeights: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.75,
            loose: 2,
        },
    },

    // ===== SPACING SCALE =====
    // Based on 4px increments (tailwind-style)
    spacing: {
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        7: '1.75rem',   // 28px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
        32: '8rem',     // 128px

        // Named spacing (semantic)
        xs: '0.25rem',  // 4px
        sm: '0.5rem',   // 8px
        md: '1rem',     // 16px
        lg: '1.5rem',   // 24px
        xl: '2rem',     // 32px
        '2xl': '3rem',  // 48px
        '3xl': '4rem',  // 64px
    },

    // ===== BORDER RADIUS =====
    radius: {
        none: '0',
        sm: '0.25rem',      // 4px
        base: '0.5rem',     // 8px
        md: '0.5rem',       // 8px
        lg: '1rem',         // 16px
        xl: '1.5rem',       // 24px
        '2xl': '2rem',      // 32px
        full: '9999px',     // Fully rounded (pills/circles)
    },

    // ===== SHADOWS =====
    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

        // Colored shadows (for buttons, etc.)
        primaryGlow: '0 0 20px rgba(30, 144, 255, 0.5)',
        accentGlow: '0 0 20px rgba(255, 215, 0, 0.5)',
    },

    // ===== TRANSITIONS =====
    transitions: {
        // Durations
        durations: {
            fast: '150ms',
            base: '200ms',
            medium: '300ms',
            slow: '500ms',
        },

        // Easing functions
        easings: {
            linear: 'linear',
            ease: 'ease',
            easeIn: 'ease-in',
            easeOut: 'ease-out',
            easeInOut: 'ease-in-out',
            spring: 'cubic-bezier(0.4, 0, 0.2, 1)', // Custom spring-like easing
        },

        // Common transitions (property + duration + easing)
        all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // ===== Z-INDEX SCALE =====
    // Prevents z-index chaos
    zIndex: {
        dropdown: 1000,
        sticky: 1020,
        fixed: 1030,
        modalBackdrop: 1040,
        modal: 1050,
        popover: 1060,
        tooltip: 1070,
    },

    // ===== BREAKPOINTS =====
    // Media query breakpoints
    breakpoints: {
        sm: '640px',    // Small devices
        md: '768px',    // Medium devices (tablets)
        lg: '1024px',   // Large devices (desktops)
        xl: '1280px',   // Extra large devices
        '2xl': '1536px', // 2X large devices
    },
};

// Export default
export default theme;
