/**
 * Firebase Cloud Functions - Device Router
 * Detects user device and serves appropriate HTML version
 * Supports: Mobile, Tablet, Desktop
 *
 * ARCHITECTURE: Internal Rewrite (NO REDIRECT)
 * - Serves HTML files directly without changing URL
 * - Eliminates redirect caching issues
 * - Clean URLs stay clean for crawlers/bots
 */

const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');

/**
 * List of pages with mobile/desktop versions
 * Add new pages here as needed
 */
const PAIRED_PAGES = [
  'chat',
  'infinite-story',
  'podcasts',
  'world',
  'downloads',
  'custom-creations',
  'workshop-detail',
  'reconciliation',
  'developer',
  'Account',
  'menu',
  'shona',
  'moon-tide',
  'contact',
  'delete-data',
  'workshop-list',
  'workshops'
];

/**
 * Device detection using User-Agent - BULLETPROOF VERSION WITH PHASE 0
 *
 * STRATEGY:
 * 0. IN-APP BROWSERS (FB/IG/TikTok) - checked FIRST, always mobile
 * 1. Desktop patterns - if matched, NOT mobile
 * 2. Mobile patterns - must be explicit
 * 3. Logical corrections for edge cases (iPad, Surface, etc.)
 *
 * @param {string} userAgent - Request User-Agent header
 * @returns {boolean} True if mobile device
 */
function isMobileDevice(userAgent) {
  const ua = userAgent || '';

  // ===== PHASE 0: IN-APP BROWSERS (MUST CHECK FIRST!) =====
  // Facebook Messenger, Instagram, TikTok, etc. are ALWAYS mobile
  // These send User-Agents with [FBAN/...], [FB_IAB/...], etc.
  if (
    /\[FB_IAB|FBAN|FBAV/i.test(ua) ||
    /FBLC|FBDV|FBUG|FBCR|FBDM/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /Messenger/i.test(ua) ||
    /TikTok/i.test(ua)
  ) {
    console.log('[Device Router] In-app browser detected (FB/IG/TikTok) → MOBILE');
    return true;
  }

  // ===== PHASE 0: IN-APP BROWSER DETECTION (HIGHEST PRIORITY) =====
  // Facebook, Instagram, TikTok in-app browsers - ALWAYS mobile
  // These browsers report desktop OS but run on mobile devices
  const inAppBrowserPatterns = {
    facebook: /FBAN|FBAV|FB_IAB/i,        // Facebook in-app browser
    instagram: /Instagram/i,               // Instagram in-app browser
    tiktok: /TikTok/i,                     // TikTok in-app browser
    messenger: /Messenger/i                // Messenger app
  };

  const isInAppBrowser = Object.values(inAppBrowserPatterns)
    .some(pattern => pattern.test(ua));

  if (isInAppBrowser) {
    console.log('[Device Router] In-app browser detected - forcing mobile');
    return true; // Always mobile for in-app browsers
  }

  // ===== PHASE 1: DESKTOP DETECTION =====
  // If ANY of these match, it's DEFINITELY desktop - return false immediately
  // ===== PHASE 1: DESKTOP DETECTION =====
  // Only check desktop if not in-app browser
  const desktopPatterns = {
    windows: /Windows NT/i,
    mac: /Mac OS X(?!.*Mobile)/i,  // Exclude iOS/Mobile
    linux: /Linux(?!.*Android)/i,  // Exclude Android
    chromeos: /CrOS/i,
    x11: /X11/i
  };

  const isDesktop = Object.values(desktopPatterns).some(pattern => pattern.test(ua));
  if (isDesktop) {
    return false;
  }

  // ===== PHASE 2: MOBILE/TABLET DETECTION =====
  const mobilePatterns = {
    ipad: /iPad/i,
    surface: /Windows NT.*Touch/i,
    lenovoYoga: /Yoga|ThinkPad.*Touch/i,
    androidMobile: /Android.*Mobile/i,
    android: /Android/i,
    ios: /iPhone|iPod/i,
    webos: /webOS/i,
    blackberry: /BlackBerry/i,
    windowsPhone: /Windows Phone/i,
    ieMobile: /IEMobile/i,
    operaMini: /Opera Mini/i,
    mobileSafari: /Mobile.*Safari/i
  };

  // iPad = mobile-like
  if (mobilePatterns.ipad.test(ua)) {
    return true;
  }

  // Hybrid tablets = desktop
  if (mobilePatterns.surface.test(ua) || mobilePatterns.lenovoYoga.test(ua)) {
    return false;
  }

  // Android phone
  if (mobilePatterns.android.test(ua)) {
    return mobilePatterns.androidMobile.test(ua);
  }

  // iOS phones and other mobile devices
  if (mobilePatterns.ios.test(ua) ||
      mobilePatterns.webos.test(ua) ||
      mobilePatterns.blackberry.test(ua) ||
      mobilePatterns.windowsPhone.test(ua) ||
      mobilePatterns.ieMobile.test(ua) ||
      mobilePatterns.operaMini.test(ua) ||
      mobilePatterns.mobileSafari.test(ua)) {
    return true;
  }

  // Default: not mobile
  return false;
}

/**
 * Main device router function - INTERNAL REWRITE (NO REDIRECT)
 * Called by Firebase Hosting rewrites
 */
exports.deviceRouter = functions.https.onRequest((req, res) => {
  // Get User-Agent header
  const userAgent = req.headers['user-agent'] || '';
  const host = req.headers['host'] || 'unknown';

  // Get requested path (e.g., /infinite-story)
  const requestPath = req.path.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes

  // Detect device type
  const isMobile = isMobileDevice(userAgent);

  // Log FULL User-Agent and detection result for debugging
  console.log(`[Device Router] Host: ${host}`);
  console.log(`[Device Router] Path: ${requestPath}`);
  console.log(`[Device Router] User-Agent: ${userAgent}`);
  console.log(`[Device Router] Detected as: ${isMobile ? 'MOBILE' : 'DESKTOP'}`);

  // Determine correct file
  let targetFile;

  if (PAIRED_PAGES.includes(requestPath)) {
    // Special case: 'chat' maps to desktop.html and mobile.html (not chat-desk.html)
    if (requestPath === 'chat') {
      targetFile = isMobile ? 'mobile.html' : 'desktop.html';
    }
    // Special case: 'Account' maps to lowercase account files
    else if (requestPath === 'Account') {
      targetFile = isMobile ? 'account-mobile.html' : 'account-desk.html';
    }
    else {
      // Standard paired pages - serve device-specific version
      targetFile = isMobile
        ? `${requestPath}-mobile.html`
        : `${requestPath}-desk.html`;
    }
  } else {
    // Non-paired page - serve as-is
    targetFile = `${requestPath}.html`;
  }

  console.log(`[Device Router] Serving file: ${targetFile}`);

  // INTERNAL REWRITE: Read and serve file directly (NO REDIRECT)
  const filePath = path.join(__dirname, 'templates', targetFile);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[Device Router] Error reading ${targetFile}:`, err);
      // Set no-cache headers even for errors - forces Facebook to re-validate
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Page Not Found</title></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
        </body>
        </html>
      `);
    }

    // Serve HTML directly - URL stays clean
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).send(data);
  });
});

/**
 * Health check endpoint (optional but recommended)
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pairedPages: PAIRED_PAGES,
    architecture: 'internal-rewrite'
  });
});
