/**
 * =================================================================================
 * Moon Tide AI - Advanced Cache Management System v1.0.0
 * =================================================================================
 *
 * Intelligent version checking and cache management for Moon Tide AI.
 * Handles version detection, cache busting, and Facebook in-app browser issues.
 *
 * Features:
 * - Version checking from /version.json (with no-cache)
 * - Automatic cache busting when new version detected
 * - Facebook in-app browser detection and forceful reload
 * - Service worker unregistration before reload
 * - Dynamic asset versioning on current page
 *
 * @author Moon Tide AI Development Team
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // =============================================================================
    // CONFIGURATION & CONSTANTS
    // =============================================================================

    const CONFIG = {
        VERSION_ENDPOINT: '/version.json',
        LOCAL_VERSION_KEY: 'moon_tide_app_version',
        CACHE_BUST_KEY: 'moon_tide_cache_bust',
        CHECK_INTERVAL: 30000, // 30 seconds between checks
        TIMEOUT_DURATION: 10000, // 10 seconds timeout for fetch
        MAX_RETRIES: 3,
        FACEBOOK_RELOAD_INTERVAL: 900000, // 15 minutes for Facebook safety reload
        DEBUG: false
    };

    const BROWSER_TYPES = {
        FACEBOOK: 'facebook',
        CHROME: 'chrome',
        SAFARI: 'safari',
        EDGE: 'edge',
        FIREFOX: 'firefox',
        MOBILE: 'mobile',
        UNKNOWN: 'unknown'
    };

    let periodicCheckInterval = null;
    let checkInProgress = false;

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    /**
     * Logging utility
     */
    function log(message, data = null) {
        if (CONFIG.DEBUG) {
            if (data) {
                console.log(`[Version Manager] ${message}`, data);
            } else {
                console.log(`[Version Manager] ${message}`);
            }
        }
    }

    /**
     * Detect browser type and context
     */
    function detectBrowserContext() {
        const ua = navigator.userAgent;
        const href = window.location.href;
        const referrer = document.referrer;

        let context = {
            type: BROWSER_TYPES.UNKNOWN,
            isInApp: false,
            isFacebook: false,
            isMobile: false,
            supportsServiceWorker: 'serviceWorker' in navigator
        };

        // Facebook detection (multiple methods)
        if (/FBAN|FBAV|FB_IAB/i.test(ua) ||
            href.includes('fb_source') ||
            referrer.includes('facebook.com') ||
            referrer.includes('m.facebook.com')) {
            context.type = BROWSER_TYPES.FACEBOOK;
            context.isFacebook = true;
            context.isInApp = true;
            log('Detected Facebook in-app browser');
        }
        // Other browser detection
        else if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
            context.type = BROWSER_TYPES.CHROME;
        } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
            context.type = BROWSER_TYPES.SAFARI;
        } else if (/Edge/i.test(ua)) {
            context.type = BROWSER_TYPES.EDGE;
        } else if (/Firefox/i.test(ua)) {
            context.type = BROWSER_TYPES.FIREFOX;
        }

        // Mobile detection
        context.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        // Other in-app browsers
        if (/Instagram|Twitter|LinkedIn|WhatsApp|Telegram/i.test(ua)) {
            context.isInApp = true;
        }

        return context;
    }

    /**
     * Safely access localStorage
     */
    function safeStorage(operation, key, value = null) {
        try {
            switch (operation) {
                case 'get':
                    return localStorage.getItem(key);
                case 'set':
                    localStorage.setItem(key, value);
                    return true;
                case 'remove':
                    localStorage.removeItem(key);
                    return true;
                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    }

    /**
     * Generate cache-busting timestamp
     */
    function generateCacheBust() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Check if force refresh parameter is present
     */
    function shouldForceRefresh() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('forceFresh') === 'true' ||
               urlParams.get('bust') === 'true' ||
               urlParams.get('refresh') === 'true';
    }

    // =============================================================================
    // CACHE MANAGEMENT FUNCTIONS
    // =============================================================================

    /**
     * Unregister all service workers
     */
    async function clearServiceWorkerCache() {
        if (!('serviceWorker' in navigator)) {
            return true;
        }

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            for (const registration of registrations) {
                await registration.unregister();
                log('Unregistered service worker:', registration.scope);
            }

            return true;
        } catch (error) {
            log('Error unregistering service worker:', error.message);
            return false;
        }
    }

    /**
     * Apply cache-busting to all assets on the page
     */
    function bustPageAssets(version) {
        const cacheBust = version || generateCacheBust();
        let assetsProcessed = 0;

        try {
            // Bust script tags
            document.querySelectorAll('script[src]').forEach(script => {
                const src = script.src;
                if (src && !src.includes('?')) {
                    script.src = `${src}?v=${cacheBust}`;
                    assetsProcessed++;
                } else if (src && !src.includes(`v=${cacheBust}`)) {
                    script.src = src.replace(/(\?|&)v=[^&]*/, '') + `&v=${cacheBust}`;
                    assetsProcessed++;
                }
            });

            // Bust link tags (CSS)
            document.querySelectorAll('link[href]').forEach(link => {
                const href = link.href;
                if (href && (href.includes('.css') || link.rel === 'stylesheet')) {
                    if (!href.includes('?')) {
                        link.href = `${href}?v=${cacheBust}`;
                        assetsProcessed++;
                    } else if (!href.includes(`v=${cacheBust}`)) {
                        link.href = href.replace(/(\?|&)v=[^&]*/, '') + `&v=${cacheBust}`;
                        assetsProcessed++;
                    }
                }
            });

            log(`Cache-busted ${assetsProcessed} assets`);
            return true;
        } catch (error) {
            log('Error busting assets:', error.message);
            return false;
        }
    }

    // =============================================================================
    // VERSION MANAGEMENT
    // =============================================================================

    /**
     * Fetch version information from server (with no-cache headers)
     */
    async function fetchVersionInfo(retryCount = 0) {
        const maxRetries = CONFIG.MAX_RETRIES;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_DURATION);

            // Use cache-busting parameter to force fresh fetch
            const cacheBust = generateCacheBust();
            const response = await fetch(`${CONFIG.VERSION_ENDPOINT}?cb=${cacheBust}`, {
                method: 'GET',
                cache: 'no-cache',
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const versionInfo = await response.json();

            log('Version info fetched:', versionInfo);

            return {
                success: true,
                data: versionInfo,
                timestamp: Date.now()
            };

        } catch (error) {
            log('Fetch error (attempt ' + (retryCount + 1) + '):', error.message);

            if (retryCount < maxRetries - 1) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(fetchVersionInfo(retryCount + 1));
                    }, delay);
                });
            } else {
                return {
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                };
            }
        }
    }

    /**
     * Compare versions (semantic versioning)
     */
    function compareVersions(current, latest) {
        if (!current || !latest) return true; // Assume update needed

        const currentParts = current.split('.').map(Number);
        const latestParts = latest.split('.').map(Number);

        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const latestPart = latestParts[i] || 0;

            if (latestPart > currentPart) return true; // Update needed
            if (latestPart < currentPart) return false; // Current is newer
        }

        return false; // Versions are equal
    }

    // =============================================================================
    // FACEBOOK IN-APP BROWSER HANDLING
    // =============================================================================

    /**
     * Handle Facebook in-app browser cache issues
     */
    function handleFacebookBrowser() {
        try {
            const cacheBust = generateCacheBust();
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('fbt', cacheBust);

            // Add meta tags for Facebook cache control
            const metaTags = [
                { property: 'og:updated_time', content: new Date().toISOString() },
                { property: 'og:version', content: cacheBust },
                { name: 'facebook-domain-verification', content: cacheBust }
            ];

            metaTags.forEach(tag => {
                const key = Object.keys(tag)[0];
                const value = Object.values(tag)[0];
                const existing = document.querySelector(`meta[${key}="${value}"]`);

                if (existing) {
                    existing.remove();
                }

                const meta = document.createElement('meta');
                Object.entries(tag).forEach(([k, v]) => {
                    meta.setAttribute(k, v);
                });
                document.head.appendChild(meta);
            });

            // Cloud Function already handles cache busting via Cache-Control headers
            // No need for aggressive reload - it causes infinite loop on mobile Messenger
            log('Facebook browser detected - Cloud Function will handle cache control');
            return false;
        } catch (error) {
            log('Error handling Facebook browser:', error.message);
            return false;
        }
    }

    /**
     * Show update notification to user
     */
    function showUpdateNotification(oldVersion, newVersion) {
        try {
            if (document.body) {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #FF6B35 0%, #D84315 100%);
                    color: #FFFFFF;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    z-index: 99999;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
                    animation: slideDown 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
                    font-size: 14px;
                    max-width: 90%;
                    text-align: center;
                `;

                notification.textContent = `🚀 Updated to v${newVersion}`;
                document.body.appendChild(notification);

                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 5000);
            }
        } catch (error) {
            log('Error showing notification:', error.message);
        }
    }

    // =============================================================================
    // MAIN CACHE ORCHESTRATOR
    // =============================================================================

    /**
     * Main version checking and update function
     */
    async function ensureLatestVersion(callback = null, options = {}) {
        // DISABLED: Version checking is now handled by Service Worker + Cloud Function Cache-Control headers
        // This prevents infinite reload loops on mobile Messenger
        console.log('[Version Manager] Version checking DISABLED - Cloud Function + Service Worker handle caching');
        return;
    }

    /**
     * Start periodic version checks
     */
    function startPeriodicChecks() {
        if (periodicCheckInterval) {
            clearInterval(periodicCheckInterval);
        }

        periodicCheckInterval = setInterval(() => {
            ensureLatestVersion();
        }, CONFIG.CHECK_INTERVAL);

        log('Started periodic version checks (every 30 seconds)');
    }

    /**
     * Stop periodic version checks
     */
    function stopPeriodicChecks() {
        if (periodicCheckInterval) {
            clearInterval(periodicCheckInterval);
            periodicCheckInterval = null;
            log('Stopped periodic version checks');
        }
    }

    // =============================================================================
    // PUBLIC API
    // =============================================================================

    const versionManager = {
        ensureLatestVersion,
        startPeriodicChecks,
        stopPeriodicChecks,
        getBrowserContext: detectBrowserContext,
        config: CONFIG,
        version: '1.0.0'
    };

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    if (typeof window !== 'undefined') {
        // Attach to window
        window.versionManager = versionManager;

        // Add CSS for animations
        if (document.head) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Version checking is disabled - handled by Cloud Function Cache-Control headers
        // Service Worker provides proper cache management without page reloads

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            stopPeriodicChecks();
        });
    }

    // =============================================================================
    // EXPORT FOR MODULE SYSTEMS
    // =============================================================================

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = versionManager;
    }

})(typeof window !== 'undefined' ? window : {});
