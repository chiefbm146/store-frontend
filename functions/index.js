/**
 * Firebase Cloud Functions - Device Router + SSR
 * Detects user device and serves appropriate HTML version
 * Supports: Mobile, Tablet, Desktop
 * Includes Server-Side Rendering (SSR) for index page
 *
 * ARCHITECTURE: Internal Rewrite (NO REDIRECT)
 * - Serves HTML files directly without changing URL
 * - Eliminates redirect caching issues
 * - Clean URLs stay clean for crawlers/bots
 * - SSR pre-renders content to eliminate flash
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp();

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
 * Dynamic SSR - Render store with all content + CSS
 * Eliminates flash by serving complete styled HTML
 * @param {object} store - Store data from Firestore
 * @param {boolean} isMobile - Device type
 * @returns {string} Complete rendered HTML
 */
async function renderStoreSSR(store, isMobile) {
  // Read CSS files to inline
  const desktopCSSPath = path.join(__dirname, '..', 'public', 'css', 'desktop.css');
  const desktopCSS = fs.readFileSync(desktopCSSPath, 'utf8');

  let mobileCSS = '';
  if (isMobile) {
    const mobileCSSPath = path.join(__dirname, '..', 'public', 'css', 'mobile-index.css');
    mobileCSS = fs.readFileSync(mobileCSSPath, 'utf8');
  }

  // Build features HTML from store data
  const featuresHTML = (store.features || [])
    .map(f => `
      <div class="feature-card">
        <span class="feature-icon">${f.icon || '✨'}</span>
        <h3 class="feature-title">${f.title || ''}</h3>
        <p class="feature-description">${f.description || ''}</p>
      </div>
    `)
    .join('');

  // Build about content
  const aboutHTML = (store.about?.content || [])
    .map(p => `<p>${p}</p>`)
    .join('');

  // Build footer links
  const footerLinksHTML = (store.footer?.links || [])
    .map(link => `<a href="${link.url}">${link.text}</a>`)
    .join('');

  // Build starter message
  const starterMessageHTML = `
    <div class="message ai-message">
      <div class="message-content">
        <span class="message-icon">🤖</span>
        <div class="message-text">
          <p>${store.chatWelcome || "Hi! 👋 I'm your AI assistant. What would you like to know?"}</p>
        </div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${store.title || 'Store'}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${store.title || 'Store'}">
    <meta property="og:description" content="${store.description || ''}">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>${store.icon || '🏪'}</text></svg>">

    <style>
      /* Critical CSS inlined for instant styling */
      ${desktopCSS}
      ${mobileCSS}
    </style>

    <link rel="stylesheet" href="./libs/fontawesome/all.min.css">
    <link rel="stylesheet" href="./libs/flatpickr/flatpickr.min.css">
    <script src="./libs/flatpickr/flatpickr.min.js"></script>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-content">
            <span class="hero-icon">${store.hero?.icon || '🏪'}</span>
            <h1 class="hero-title">${store.hero?.title || store.title || ''}</h1>
            <p class="hero-subtitle">${store.hero?.subtitle || store.description || ''}</p>
            <p class="hero-description">${store.hero?.description || ''}</p>
            <div class="hero-buttons">
                <a href="${store.hero?.ctaLink || '#'}" class="btn btn-primary">${store.hero?.ctaText || 'Get Started'}</a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
        <div class="section-header">
            <h2 class="section-title">${store.featuresTitle || 'Features'}</h2>
            <p class="section-subtitle">${store.featuresSubtitle || ''}</p>
        </div>
        <div class="features-grid">
            ${featuresHTML}
        </div>
    </section>

    <!-- Chat Section -->
    <section class="chat-section" id="chat">
        <div class="chat-wrapper">
            <div class="section-header">
                <h2 class="section-title">${store.chatTitle || 'AI Assistant'}</h2>
                <p class="section-subtitle">${store.chatSubtitle || ''}</p>
            </div>
            <div class="chat-container">
                <div class="chat-header">
                    <span class="chat-icon">🤖</span>
                    <h3 class="chat-title">AI Chat Assistant</h3>
                </div>
                <div class="messages-container">
                    <div class="messages">
                        ${starterMessageHTML}
                    </div>
                </div>
                <div class="input-area">
                    <div class="input-wrapper">
                        <input type="text" id="userInput" placeholder="${store.chatPlaceholder || 'Ask me anything...'}" autocomplete="off" maxlength="4000">
                    </div>
                    <button id="sendButton">Send</button>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about-section" id="about">
        <div class="about-content">
            <div class="about-text">
                <h2>${store.about?.title || 'About'}</h2>
                <h3>${store.about?.subtitle || ''}</h3>
                <div>
                    ${aboutHTML}
                </div>
            </div>
            <div class="about-visual">
                <span class="about-emoji">${store.about?.emoji || '🚀'}</span>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="cta-content">
            <h2>${store.cta?.title || 'Ready?'}</h2>
            <p>${store.cta?.description || ''}</p>
            <a href="${store.cta?.link || '#'}" class="btn btn-primary">${store.cta?.buttonText || 'Get Started'}</a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <p class="footer-tagline">${store.footer?.tagline || store.title || ''}</p>
            <div class="footer-links">
                ${footerLinksHTML}
            </div>
            <p class="footer-copyright">${store.footer?.copyright || ''}</p>
        </div>
    </footer>

    <audio id="ttsPlayer" style="display: none;"></audio>

    <script src="./js/device-detector.js"></script>
    <script src="./js/version-manager.js"></script>
</body>
</html>`;
}

/**
 * Main device router function - INTERNAL REWRITE (NO REDIRECT)
 * Called by Firebase Hosting rewrites
 */
exports.deviceRouter = functions.https.onRequest(async (req, res) => {
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

  // === SPECIAL CASE: Root path / or index - Dynamic SSR ===
  if (requestPath === '' || requestPath === 'index') {
    console.log('[Device Router] Rendering SSR with dynamic store data');
    try {
      // TODO: Extract store ID from hostname/path
      // For now, use a default store ID or fetch from request
      const storeId = req.query?.storeId || 'default';

      // Fetch store data from Firestore
      const storeDoc = await admin.firestore().collection('stores').doc(storeId).get();

      if (!storeDoc.exists) {
        console.log('[Device Router] Store not found:', storeId);
        return res.status(404).send('<h1>Store not found</h1>');
      }

      const store = storeDoc.data();
      const html = await renderStoreSSR(store, isMobile);

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
      return res.status(200).send(html);
    } catch (err) {
      console.error('[Device Router] Error rendering SSR:', err);
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send('<h1>Error rendering store</h1>');
    }
  }

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
