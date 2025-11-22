# Clean URL System Documentation
## Moon Tide Reconciliation - Complete Architecture Guide

**Created:** November 21, 2025
**Purpose:** Reference guide for recreating the clean URL system in other stores
**Status:** LOCAL REFERENCE ONLY - DO NOT DEPLOY TO GIT

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Device Router (Cloud Functions)](#device-router-cloud-functions)
4. [Firebase Hosting Configuration](#firebase-hosting-configuration)
5. [Client-Side Clean URL Handling](#client-side-clean-url-handling)
6. [File Structure](#file-structure)
7. [How It All Works Together](#how-it-all-works-together)
8. [Implementation Checklist](#implementation-checklist)

---

## System Overview

The clean URL system is a **three-layer architecture** that:
1. **Eliminates file extensions** from URLs (`/workshops` instead of `/workshops-desk.html`)
2. **Detects device type** (mobile/desktop) server-side
3. **Serves the correct HTML file** without redirects (internal rewrites)
4. **Maintains clean URLs** in the address bar for sharing and SEO

### Key Benefits
- ✅ Beautiful URLs for users and bots (crawlers)
- ✅ Single source of truth (no redirect caching issues)
- ✅ Fast page loads (no redirect round-trip)
- ✅ Works on social media (clean URLs don't get cached with old redirects)
- ✅ Automatic device detection (no client-side guessing)

---

## Architecture Components

### Layer 1: Firebase Hosting Rewrites
**File:** `firebase.json`
**Purpose:** Route clean URLs to the cloud function

### Layer 2: Cloud Function (Device Router)
**File:** `functions/index.js`
**Purpose:** Detect device and serve correct HTML file

### Layer 3: Client-Side Clean URL Updates
**File:** `public/js/clean-url.js`
**Purpose:** Update address bar for device-specific files not in rewrites

---

## Device Router (Cloud Functions)

### Location
```
functions/index.js
```

### Core Function: `isMobileDevice(userAgent)`

The device detection uses a **3-phase strategy**:

#### Phase 0: In-App Browser Detection (HIGHEST PRIORITY)
```javascript
// Facebook, Instagram, TikTok in-app browsers
// These browsers claim to be desktop but run on mobile
if (/\[FB_IAB|FBAN|FBAV/i.test(ua) || /Instagram|TikTok|Messenger/i.test(ua)) {
  return true; // Always mobile for in-app browsers
}
```

**Why this matters:** Facebook in-app browsers send desktop User-Agents but are on mobile devices. You MUST check this first or you'll serve desktop to mobile users.

#### Phase 1: Desktop Detection
```javascript
// If ANY of these match, it's DEFINITELY desktop
const desktopPatterns = {
  windows: /Windows NT/i,
  mac: /Mac OS X(?!.*Mobile)/i,  // Exclude iOS
  linux: /Linux(?!.*Android)/i,  // Exclude Android
  chromeos: /CrOS/i,
  x11: /X11/i
};

if (isDesktop) return false;
```

**Why Phase 1 first:** Desktop detection is more reliable than mobile detection. If we see Windows NT, it's definitely desktop (no ambiguity).

#### Phase 2: Mobile Detection (Fallback)
```javascript
// Only reaches here if not desktop
const mobilePatterns = {
  ipad: /iPad/i,              // iPad is mobile-like
  surface: /Windows NT.*Touch/i,  // Surface is hybrid, treat as desktop
  android: /Android/i,
  ios: /iPhone|iPod/i,
  webos: /webOS/i,
  // ... etc
};
```

### Main Router Function: `exports.deviceRouter`

```javascript
exports.deviceRouter = functions.https.onRequest((req, res) => {
  const userAgent = req.headers['user-agent'];
  const requestPath = req.path.replace(/^\/|\/$/g, ''); // Remove slashes

  // Detect device
  const isMobile = isMobileDevice(userAgent);

  // Determine target file
  let targetFile;
  if (PAIRED_PAGES.includes(requestPath)) {
    // Special case for 'chat' (maps to desktop.html, not chat-desk.html)
    if (requestPath === 'chat') {
      targetFile = isMobile ? 'mobile.html' : 'desktop.html';
    }
    // Special case for 'Account' (capital A)
    else if (requestPath === 'Account') {
      targetFile = isMobile ? 'account-mobile.html' : 'account-desk.html';
    }
    // Standard: /workshops → workshops-desk.html or workshops-mobile.html
    else {
      targetFile = isMobile
        ? `${requestPath}-mobile.html`
        : `${requestPath}-desk.html`;
    }
  }

  // CRITICAL: Internal rewrite, NOT redirect
  // Read file directly and serve (no HTTP redirect)
  fs.readFile(path.join(__dirname, 'templates', targetFile), 'utf8', (err, data) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.status(200).send(data);
  });
});
```

### Key Points
1. **Internal Rewrite:** The function reads and serves HTML directly using `fs.readFile()`. The URL NEVER changes (no redirect).
2. **Paired Pages List:** You must add new routes to the `PAIRED_PAGES` array if you add new pages.
3. **Caching Headers:** `max-age=0` ensures Facebook and browsers don't cache outdated versions.

---

## Firebase Hosting Configuration

### Location
```
firebase.json → hosting[0].rewrites
```

### Structure
```json
"rewrites": [
  {
    "source": "/chat",
    "function": "deviceRouter"
  },
  {
    "source": "/infinite-story",
    "function": "deviceRouter"
  },
  // ... more pages
  {
    "source": "/**",
    "destination": "/index.html"
  }
]
```

### How It Works
1. **Specific rewrites FIRST:** `/chat`, `/workshops`, etc. → Cloud Function
2. **Catch-all LAST:** `/**` → `/index.html` (for non-paired pages and root)

**CRITICAL ORDER:** Specific rewrites must come BEFORE the catch-all `/**`, or the catch-all will intercept everything.

### Cache Control Headers
```json
{
  "source": "**/*.@(js|css|html)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
    }
  ]
}
```

**Why `s-maxage=0`:** Tells CDN (Firebase Hosting edge nodes) not to cache. This is crucial for catching updates from social media crawlers.

---

## Client-Side Clean URL Handling

### Location
```
public/js/clean-url.js
```

### Purpose
For pages that are NOT in the Firebase rewrites (like `/index.html`), this script updates the address bar after page load.

### How It Works
```javascript
(function() {
  const currentPath = window.location.pathname;

  const cleanUrls = {
    '/index.html': '/',
    '/desktop.html': '/chat',
    '/mobile.html': '/chat',
    '/workshops-desk.html': '/workshops',
    '/workshops-mobile.html': '/workshops',
    // ... mapping of all device-specific files
  };

  const cleanUrl = cleanUrls[currentPath];

  if (cleanUrl && window.history.replaceState) {
    // Replace URL in address bar WITHOUT reloading page
    const queryString = window.location.search;
    window.history.replaceState(null, '', cleanUrl + queryString);
  }
})();
```

### Key Points
1. **`replaceState()` NOT `pushState()`:** We're fixing the URL that was loaded, not creating a new history entry.
2. **Preserves query parameters:** `window.location.search` keeps any `?` parameters intact.
3. **Runs on every page:** Must be loaded in `<head>` of every HTML file.
4. **User never sees device suffix:** If user lands on `/desktop.html`, they see `/chat`.

---

## File Structure

```
moon-frontend/
├── public/
│   ├── index.html                    (landing page)
│   ├── desktop.html                  (chat for desktop - served as /chat)
│   ├── mobile.html                   (chat for mobile - served as /chat)
│   ├── workshops-desk.html           (workshops desktop - served as /workshops)
│   ├── workshops-mobile.html         (workshops mobile - served as /workshops)
│   ├── [other paired pages...]
│   ├── css/
│   │   └── [styling files]
│   └── js/
│       ├── clean-url.js              (CLIENT: Update address bar)
│       └── [other JS modules]
│
├── functions/
│   ├── index.js                      (CLOUD FUNCTION: Device router)
│   ├── templates/                    (Same HTML files as public/)
│   │   ├── index.html
│   │   ├── desktop.html
│   │   ├── mobile.html
│   │   └── [same structure as public/]
│   └── package.json
│
├── firebase.json                     (Firebase config - rewrites & caching)
└── .firebaserc                       (Firebase project ID)
```

### Why Duplicate HTML?
- **public/**: Served directly by Firebase Hosting (static files)
- **functions/templates/**: Served by Cloud Function (dynamic routing)

Users might access either path, so we need both sets of files synced.

---

## How It All Works Together

### User Accesses `/workshops` on Mobile

```
1. User types: https://moontidereconciliation.com/workshops
   ↓
2. Firebase Hosting receives request
   ↓
3. firebase.json rewrite rule matches: "/workshops" → "deviceRouter"
   ↓
4. Cloud Function (functions/index.js) is invoked
   ↓
5. Function reads User-Agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6..."
   ↓
6. isMobileDevice() → true
   ↓
7. For 'workshops' page: targetFile = "workshops-mobile.html"
   ↓
8. Function reads /functions/templates/workshops-mobile.html
   ↓
9. Response includes: <script src="./js/clean-url.js"></script>
   ↓
10. Mobile version served with address bar still showing: /workshops
   ↓
11. Page loads, clean-url.js checks if current path is in mapping
    (it's not - it's already /workshops from the rewrite)
   ↓
12. User sees: Clean URL /workshops + mobile layout ✅
```

### User Accesses `/workshops` on Desktop

```
1. User types: https://moontidereconciliation.com/workshops
   ↓
2. Firebase Hosting receives request
   ↓
3. firebase.json rewrite matches: "/workshops" → "deviceRouter"
   ↓
4. Cloud Function invoked
   ↓
5. User-Agent detected as desktop
   ↓
6. targetFile = "workshops-desk.html"
   ↓
7. Desktop version served with clean URL /workshops
   ↓
8. User sees: Clean URL /workshops + desktop layout ✅
```

### User Directly Accesses `/desktop.html`

```
1. User types: https://moontidereconciliation.com/desktop.html
   ↓
2. Firebase Hosting serves public/desktop.html directly
   (no Cloud Function involved)
   ↓
3. Page loads with: <script src="./js/clean-url.js"></script>
   ↓
4. clean-url.js runs:
   - currentPath = "/desktop.html"
   - cleanUrl = "/chat"
   - window.history.replaceState(null, '', '/chat')
   ↓
5. Address bar updates: /desktop.html → /chat ✅
   (page doesn't reload, just URL changes)
```

---

## Implementation Checklist

When recreating this in another store, follow this sequence:

### Step 1: Project Setup
- [ ] Create Firebase project
- [ ] Initialize Firebase Hosting and Cloud Functions
- [ ] Run `npm install` in functions/ directory
- [ ] Install firebase-functions and other dependencies

### Step 2: File Structure
- [ ] Create public/ directory with all HTML files
- [ ] Create functions/templates/ with duplicate HTML files
- [ ] Add clean-url.js to public/js/
- [ ] Ensure both public/ and functions/templates/ are kept in sync

### Step 3: Cloud Function
- [ ] Copy functions/index.js to your project
- [ ] Update PAIRED_PAGES array with your page names
- [ ] Handle special cases (like 'chat' → desktop.html/mobile.html)
- [ ] Test device detection with different User-Agents

### Step 4: Firebase Configuration
- [ ] Create firebase.json with rewrites for each page
- [ ] Add cache control headers (max-age=0 for HTML/CSS/JS)
- [ ] Ensure specific rewrites come BEFORE catch-all /**
- [ ] Configure S3/CDN caching appropriately

### Step 5: Client-Side
- [ ] Add clean-url.js to <head> of every HTML file
- [ ] Update cleanUrls mapping object with your file names
- [ ] Test that address bar updates correctly

### Step 6: Deployment
- [ ] Test locally with `firebase serve`
- [ ] Deploy with `firebase deploy --only hosting,functions`
- [ ] Verify mobile and desktop versions load correctly
- [ ] Check that address bars show clean URLs

### Step 7: Social Media Testing
- [ ] Share URL on Facebook and check crawler sees clean URL
- [ ] Test in Instagram in-app browser
- [ ] Verify TikTok in-app browser serves mobile version

---

## Common Pitfalls & Solutions

### Problem: Desktop users seeing mobile version
**Cause:** Phase 0 (in-app browser detection) may be too aggressive
**Solution:** Test with real User-Agents, not just patterns

### Problem: URLs showing file extensions (e.g., /workshops-desk.html)
**Cause:** clean-url.js not loaded or not running
**Solution:**
- Verify `<script src="./js/clean-url.js"></script>` is in `<head>`
- Check browser console for errors
- Ensure cleanUrls mapping includes all file names

### Problem: Facebook caching old versions
**Cause:** Cache-Control headers too permissive
**Solution:** Set `max-age=0, s-maxage=0` for all HTML/CSS/JS files

### Problem: New pages not routing correctly
**Cause:** Not added to PAIRED_PAGES in functions/index.js or firebase.json
**Solution:**
1. Add to firebase.json rewrites
2. Add to PAIRED_PAGES array in functions/index.js
3. Add to cleanUrls mapping in clean-url.js
4. Deploy both hosting AND functions: `firebase deploy`

### Problem: iPad showing desktop instead of mobile
**Cause:** iPad device detection treating it as desktop
**Solution:** In functions/index.js, iPad pattern should return true:
```javascript
if (mobilePatterns.ipad.test(ua)) {
  return true; // iPad is mobile-like
}
```

---

## Testing User-Agents

### Simulate Different Devices
```bash
# macOS Safari
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15

# iPhone Safari
Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1

# Android Chrome
Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Mobile Safari/537.36

# Facebook In-App (Desktop User-Agent, but MUST serve mobile)
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36 [FBAN/FBAV;...]
```

### Test with Firebase Emulator
```bash
cd functions
npm install
firebase emulator:start
# Visit http://localhost:5000/chat in different browsers
```

---

## Performance Metrics

With this architecture, you should see:
- **First Paint:** < 1.5s (no redirects)
- **Time to Interactive:** < 3s (depends on JS size)
- **Lighthouse Score:** 85+ (no redirect penalty)

### Comparison: Redirect vs. Rewrite
```
OLD (Redirect):
  Request /chat → 301 Redirect → Request /desktop.html → Response
  (2 round-trips, slower)

NEW (Internal Rewrite):
  Request /chat → Cloud Function reads desktop.html → Response
  (1 round-trip, faster)
```

---

## Support & Troubleshooting

### Enable Debug Logging
In functions/index.js, the code already logs extensively:
```javascript
console.log('[Device Router] Path: ${requestPath}');
console.log('[Device Router] Detected as: ${isMobile ? 'MOBILE' : 'DESKTOP'}');
console.log('[Device Router] Serving file: ${targetFile}');
```

View logs:
```bash
firebase functions:log
```

### Monitor Deployed Function
```bash
# View real-time logs
firebase functions:log --follow

# Download last 1000 lines
firebase functions:log > logs.txt
```

---

## Files to Copy to New Project

```
From MOON-FRONTEND:

1. functions/index.js
2. public/js/clean-url.js
3. firebase.json (as template)
4. public/index.html (for HTML structure)
5. All HTML files (desktop.html, mobile.html, etc.)
```

Then customize:
- Page names in PAIRED_PAGES
- cleanUrls mapping
- Special cases (like 'chat' → desktop.html)
- File paths to match your structure

---

## Summary

This clean URL system is a **production-grade solution** that:
1. ✅ Eliminates redirects (faster)
2. ✅ Maintains clean URLs (better UX + SEO)
3. ✅ Detects devices server-side (accurate)
4. ✅ Works with social media crawlers (no caching issues)
5. ✅ Scales to many pages (firebase.json configuration)

The key innovation is **internal rewriting** instead of HTTP redirects, combined with client-side address bar updates for fallback cases.

---

**Last Updated:** November 21, 2025
**Author:** Claude Code
**Status:** LOCAL REFERENCE - DO NOT COMMIT TO GIT
