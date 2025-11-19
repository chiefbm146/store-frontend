/**
 * Theme Injector
 * Injects theme configuration as CSS variables at runtime
 *
 * This module:
 * - Reads theme config (colors, fonts, spacing, etc.)
 * - Injects CSS variables into :root
 * - Allows instant theme changes without page reload
 * - Makes entire app theme-able via config
 *
 * Usage:
 * import { injectTheme } from './theme-injector.js';
 * injectTheme(); // Call once on page load
 *
 * Then in CSS:
 * background: var(--color-primary);
 * font-family: var(--font-body);
 * padding: var(--spacing-md);
 */

import { theme } from './config/index.js';

/**
 * Inject theme as CSS variables
 * Sets all theme values as CSS custom properties on :root
 */
export function injectTheme() {
    console.log('[Theme Injector] Loading theme configuration...');

    const root = document.documentElement;
    let variablesSet = 0;

    try {
        // ===== INJECT COLORS =====
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([name, value]) => {
                root.style.setProperty(`--color-${name}`, value);
                variablesSet++;
            });
        }

        // ===== INJECT FONTS =====
        if (theme.fonts) {
            // Font families
            if (theme.fonts.body) {
                root.style.setProperty('--font-body', theme.fonts.body);
                variablesSet++;
            }
            if (theme.fonts.heading) {
                root.style.setProperty('--font-heading', theme.fonts.heading);
                variablesSet++;
            }
            if (theme.fonts.mono) {
                root.style.setProperty('--font-mono', theme.fonts.mono);
                variablesSet++;
            }

            // Font sizes
            if (theme.fonts.sizes) {
                Object.entries(theme.fonts.sizes).forEach(([name, value]) => {
                    root.style.setProperty(`--font-size-${name}`, value);
                    variablesSet++;
                });
            }

            // Font weights
            if (theme.fonts.weights) {
                Object.entries(theme.fonts.weights).forEach(([name, value]) => {
                    root.style.setProperty(`--font-weight-${name}`, value);
                    variablesSet++;
                });
            }

            // Line heights
            if (theme.fonts.lineHeights) {
                Object.entries(theme.fonts.lineHeights).forEach(([name, value]) => {
                    root.style.setProperty(`--line-height-${name}`, value);
                    variablesSet++;
                });
            }
        }

        // ===== INJECT SPACING =====
        if (theme.spacing) {
            Object.entries(theme.spacing).forEach(([name, value]) => {
                root.style.setProperty(`--spacing-${name}`, value);
                variablesSet++;
            });
        }

        // ===== INJECT BORDER RADIUS =====
        if (theme.radius) {
            Object.entries(theme.radius).forEach(([name, value]) => {
                root.style.setProperty(`--radius-${name}`, value);
                variablesSet++;
            });
        }

        // ===== INJECT SHADOWS =====
        if (theme.shadows) {
            Object.entries(theme.shadows).forEach(([name, value]) => {
                root.style.setProperty(`--shadow-${name}`, value);
                variablesSet++;
            });
        }

        // ===== INJECT TRANSITIONS =====
        if (theme.transitions) {
            // Transition durations
            if (theme.transitions.durations) {
                Object.entries(theme.transitions.durations).forEach(([name, value]) => {
                    root.style.setProperty(`--transition-duration-${name}`, value);
                    variablesSet++;
                });
            }

            // Transition easings
            if (theme.transitions.easings) {
                Object.entries(theme.transitions.easings).forEach(([name, value]) => {
                    root.style.setProperty(`--transition-easing-${name}`, value);
                    variablesSet++;
                });
            }

            // Pre-built transitions
            if (theme.transitions.all) {
                root.style.setProperty('--transition-all', theme.transitions.all);
                variablesSet++;
            }
            if (theme.transitions.colors) {
                root.style.setProperty('--transition-colors', theme.transitions.colors);
                variablesSet++;
            }
            if (theme.transitions.opacity) {
                root.style.setProperty('--transition-opacity', theme.transitions.opacity);
                variablesSet++;
            }
            if (theme.transitions.transform) {
                root.style.setProperty('--transition-transform', theme.transitions.transform);
                variablesSet++;
            }
        }

        // ===== INJECT Z-INDEX =====
        if (theme.zIndex) {
            Object.entries(theme.zIndex).forEach(([name, value]) => {
                root.style.setProperty(`--z-index-${name}`, value);
                variablesSet++;
            });
        }

        // ===== INJECT BREAKPOINTS =====
        // Note: Breakpoints can't be used in CSS variables for media queries
        // But we can expose them for JavaScript usage
        if (theme.breakpoints) {
            Object.entries(theme.breakpoints).forEach(([name, value]) => {
                root.style.setProperty(`--breakpoint-${name}`, value);
                variablesSet++;
            });
        }

        console.log(`✅ Theme Injector: ${variablesSet} CSS variables injected`);
        console.log(`   Primary Color: ${theme.colors.primary}`);
        console.log(`   Font: ${theme.fonts.body}`);

        // Emit custom event for theme loaded
        const themeLoadedEvent = new CustomEvent('themeLoaded', {
            detail: { theme, variablesSet }
        });
        document.dispatchEvent(themeLoadedEvent);

        return {
            success: true,
            variablesSet,
        };

    } catch (error) {
        console.error('❌ Theme Injector: Failed to inject theme', error);

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Update a single theme variable
 * Useful for dynamic theme changes (dark mode toggle, color picker, etc.)
 */
export function updateThemeVariable(category, name, value) {
    const root = document.documentElement;

    try {
        // Build CSS variable name based on category
        let varName;

        switch (category) {
            case 'color':
                varName = `--color-${name}`;
                break;
            case 'font':
                varName = `--font-${name}`;
                break;
            case 'spacing':
                varName = `--spacing-${name}`;
                break;
            case 'radius':
                varName = `--radius-${name}`;
                break;
            case 'shadow':
                varName = `--shadow-${name}`;
                break;
            default:
                varName = `--${category}-${name}`;
        }

        // Set the variable
        root.style.setProperty(varName, value);

        console.log(`✅ Theme Injector: Updated ${varName} = ${value}`);

        // Emit custom event for theme variable updated
        const varUpdatedEvent = new CustomEvent('themeVariableUpdated', {
            detail: { category, name, value, varName }
        });
        document.dispatchEvent(varUpdatedEvent);

        return true;

    } catch (error) {
        console.error(`❌ Theme Injector: Failed to update ${category}.${name}`, error);
        return false;
    }
}

/**
 * Get current theme variable value
 */
export function getThemeVariable(varName) {
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue(varName).trim();
}

/**
 * Remove theme (reset to browser defaults)
 */
export function removeTheme() {
    const root = document.documentElement;

    // Get all CSS variables starting with our prefixes
    const prefixes = ['--color-', '--font-', '--spacing-', '--radius-', '--shadow-', '--transition-', '--z-index-', '--breakpoint-'];

    let removed = 0;

    prefixes.forEach(prefix => {
        // This is a bit hacky but works
        Array.from(root.style).forEach(prop => {
            if (prop.startsWith(prefix)) {
                root.style.removeProperty(prop);
                removed++;
            }
        });
    });

    console.log(`✅ Theme Injector: ${removed} CSS variables removed`);

    return removed;
}

/**
 * Reload theme (useful after config changes)
 */
export function reloadTheme() {
    console.log('[Theme Injector] Reloading theme...');

    // Remove old theme
    removeTheme();

    // Re-inject
    return injectTheme();
}

/**
 * Export theme config for debugging
 */
export function getThemeConfig() {
    return theme;
}

/**
 * Apply dark mode (future feature)
 * Swaps light/dark colors
 */
export function applyDarkMode(enabled = true) {
    const root = document.documentElement;

    if (enabled) {
        // Swap colors for dark mode
        root.style.setProperty('--color-background', theme.colors.backgroundDark || '#1a1a1a');
        root.style.setProperty('--color-textPrimary', theme.colors.textLight || '#FFFFFF');
        root.style.setProperty('--color-surface', '#2a2a2a');

        console.log('✅ Dark mode enabled');
    } else {
        // Reset to light mode
        root.style.setProperty('--color-background', theme.colors.background);
        root.style.setProperty('--color-textPrimary', theme.colors.textPrimary);
        root.style.setProperty('--color-surface', theme.colors.surface);

        console.log('✅ Light mode enabled');
    }

    // Emit event
    const modeChangedEvent = new CustomEvent('themeModeChanged', {
        detail: { darkMode: enabled }
    });
    document.dispatchEvent(modeChangedEvent);
}

/**
 * Get all injected CSS variables
 * Useful for debugging
 */
export function getAllThemeVariables() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const variables = {};

    // Get all CSS variables
    Array.from(root.style).forEach(prop => {
        if (prop.startsWith('--')) {
            variables[prop] = styles.getPropertyValue(prop).trim();
        }
    });

    return variables;
}

// Export default function
export default injectTheme;
