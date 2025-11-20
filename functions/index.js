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
 * Server-Side Rendering (SSR) - Pre-render index.html with content
 * Eliminates content flash by injecting data server-side
 * @param {boolean} isMobile - Device type
 * @returns {string} Pre-rendered HTML
 */
function renderIndexHTML(isMobile) {
  // Load content config
  const contentPath = path.join(__dirname, '..', 'public', 'js', 'config', 'content', 'desktop.js');

  let content = {
    hero: {
      icon: '🏪',
      title: 'Build Your Store in Minutes',
      subtitle: 'Create a professional online store with AI-powered chat - no coding required',
      description: 'Launch your custom store selling workshops, products, or services with intelligent chatbots that help your customers 24/7.',
      ctaPrimary: { text: 'See Demo Store', link: '/demo-desk.html' }
    },
    features: {
      title: 'Why Choose Our Platform',
      subtitle: 'Everything you need to launch your store',
      items: [
        { icon: '🎓', title: 'Sell Workshops', description: 'Create stores that sell educational workshops with booking, scheduling, and payment processing built-in.' },
        { icon: '📦', title: 'Sell Products', description: 'Launch product catalogs with inventory management, checkout, and order tracking automatically configured.' },
        { icon: '⚙️', title: 'Sell Services', description: 'Offer professional services with consultation booking, service packages, and client management tools.' },
        { icon: '🤖', title: 'Custom AI Chatbots', description: 'Each store includes an intelligent AI assistant trained on your business to help customers 24/7.' }
      ]
    },
    chat: {
      title: 'Try the AI Assistant (Demo)',
      subtitle: 'Every store gets a custom chatbot trained on your business',
      placeholder: 'Ask about creating your store, features, pricing...'
    },
    about: {
      title: 'The Platform for Modern Businesses',
      subtitle: 'Build, launch, and grow your online store effortlessly',
      content: [
        'We provide the platform that makes it easy for businesses to create their own professional online stores. Whether you\'re selling workshops, physical products, or professional services, our system handles everything - from product catalogs to checkout to customer support.',
        'Every store comes with a custom AI chatbot trained on your specific business. Your customers get instant answers about your offerings, pricing, and availability 24/7. No coding required, no technical expertise needed - just configure your content and launch.'
      ],
      emoji: '🚀'
    },
    cta: {
      title: 'Ready to Launch Your Store?',
      description: 'See our demo store in action - explore how your customers will shop workshops, products, and services with AI assistance.',
      buttonText: 'View Demo Store',
      buttonLink: '/shop-desk.html'
    },
    footer: {
      tagline: 'Your Store Platform - Launch Your Business Today',
      links: [
        { text: 'Demo Store', url: '/shop-desk.html' },
        { text: 'About', url: '/about-desk.html' },
        { text: 'Contact', url: '/contact-desk.html' }
      ],
      copyright: '© 2025 Your Store Platform. All rights reserved.'
    }
  };

  // Build features HTML
  const featuresHTML = content.features.items
    .map(f => `
      <div class="feature-card">
        <span class="feature-icon">${f.icon}</span>
        <h3 class="feature-title">${f.title}</h3>
        <p class="feature-description">${f.description}</p>
      </div>
    `)
    .join('');

  // Build about paragraphs HTML
  const aboutHTML = content.about.content
    .map(p => `<p>${p}</p>`)
    .join('');

  // Build footer links HTML
  const footerLinksHTML = content.footer.links
    .map(link => `<a href="${link.url}">${link.text}</a>`)
    .join('');

  // Build starter message HTML
  const starterMessageHTML = `
    <div class="message ai-message">
      <div class="message-content">
        <span class="message-icon">🤖</span>
        <div class="message-text">
          <p>Hi! 👋 I'm your AI assistant. I can help you learn about creating your store, features, pricing, or answer any questions about our platform. What would you like to know?</p>
        </div>
      </div>
    </div>
  `;

  // Determine CSS to load
  const cssFile = isMobile ? 'mobile-index.css' : 'desktop.css';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.footer.tagline}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="Your Store Platform - Build Your Store in Minutes">
    <meta property="og:description" content="Create a professional online store with AI-powered chat - no coding required">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🏪</text></svg>">

    <link rel="stylesheet" href="./css/desktop.css">
    ${isMobile ? `<link rel="stylesheet" href="./css/mobile-index.css">` : ''}
    <link rel="stylesheet" href="./libs/fontawesome/all.min.css">
    <link rel="stylesheet" href="./libs/flatpickr/flatpickr.min.css">
    <script src="./libs/flatpickr/flatpickr.min.js"></script>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-content">
            <span class="hero-icon">${content.hero.icon}</span>
            <h1 class="hero-title">${content.hero.title}</h1>
            <p class="hero-subtitle">${content.hero.subtitle}</p>
            <p class="hero-description">${content.hero.description}</p>
            <div class="hero-buttons">
                <a href="${content.hero.ctaPrimary.link}" class="btn btn-primary">${content.hero.ctaPrimary.text}</a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
        <div class="section-header">
            <h2 class="section-title">${content.features.title}</h2>
            <p class="section-subtitle">${content.features.subtitle}</p>
        </div>
        <div class="features-grid">
            ${featuresHTML}
        </div>
    </section>

    <!-- Chat Section -->
    <section class="chat-section" id="chat">
        <div class="chat-wrapper">
            <div class="section-header">
                <h2 class="section-title">${content.chat.title}</h2>
                <p class="section-subtitle">${content.chat.subtitle}</p>
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
                        <input type="text" id="userInput" placeholder="${content.chat.placeholder}" autocomplete="off" maxlength="4000">
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
                <h2>${content.about.title}</h2>
                <h3>${content.about.subtitle}</h3>
                <div>
                    ${aboutHTML}
                </div>
            </div>
            <div class="about-visual">
                <span class="about-emoji">${content.about.emoji}</span>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
        <div class="cta-content">
            <h2>${content.cta.title}</h2>
            <p>${content.cta.description}</p>
            <a href="${content.cta.buttonLink}" class="btn btn-primary">${content.cta.buttonText}</a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-content">
            <p class="footer-tagline">${content.footer.tagline}</p>
            <div class="footer-links">
                ${footerLinksHTML}
            </div>
            <p class="footer-copyright">${content.footer.copyright}</p>
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

  // === SPECIAL CASE: Root path / or index - Use SSR ===
  if (requestPath === '' || requestPath === 'index') {
    console.log('[Device Router] Serving SSR-rendered index.html');
    const renderedHTML = renderIndexHTML(isMobile);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.status(200).send(renderedHTML);
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
