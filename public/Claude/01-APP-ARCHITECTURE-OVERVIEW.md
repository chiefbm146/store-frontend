# MOON-FRONTEND Application Architecture Overview

**Investigation Date**: November 19, 2025
**App Version**: 11.0.12
**Investigator**: Claude AI

---

## Entry Point: index.html

**Location**: `/public/index.html`
**Purpose**: Primary router and entry point for the entire application

### Routing Logic

The index.html file serves **two distinct purposes** based on user type:

#### 1. **For Social Media Crawlers** (Facebook, Twitter, LinkedIn, Google)
- **Detection Method**: User-agent string matching
- **Regex**: `/facebookexternalhit|Twitterbot|LinkedInBot|Googlebot|bingbot/i`
- **Behavior**: Serves static index.html with Open Graph meta tags
- **Why**: Ensures proper social media preview cards when app is shared

#### 2. **For Regular Users**
Executes a **4-step initialization flow**:

```
STEP 1: Initialize Audio System
   ↓ (import audioStateManager.js)
STEP 2: Import Intro Loader Module
   ↓ (import intro-loader.js)
STEP 3: Display Intro Loader UI
   ↓ (user sees loading animation)
STEP 4: Wait for User Interaction/Timer
   ↓ (await introLoader.hide())
STEP 5: Redirect to /chat
   ↓ (Cloud Function handles device detection)
```

### Critical Dependencies (Loaded in Order)

1. **device-detector.js** (v11.0.12)
   - Loaded via script tag (line 46)
   - Purpose: Unknown at this stage (needs investigation)

2. **audioStateManager.js** (v11.0.12)
   - Dynamically imported (line 69)
   - Purpose: Manages audio state for intro loader sounds
   - Initialized via `.init()` method

3. **intro-loader.js** (v11.0.12)
   - Dynamically imported (line 75)
   - Purpose: Displays loading animation/intro screen
   - Has `.init()` and `.hide()` methods (returns Promise)

### Meta Tags & SEO

**Open Graph Tags** (lines 11-20):
- Title: "Moon Tide Reconciliation"
- Description: Transformative workshops and Indigenous cultural experiences
- Image: `/images/musqueam/moon9.png` (794x1123px PNG)
- Updated: 2025-11-12

**Twitter Cards** (lines 22-27):
- Card type: `summary_large_image`
- Uses same metadata as OG tags

### Versioning Strategy

- **Version**: 11.0.12 (line 10)
- **Cache Busting**: All script imports include `?v=11.0.12` parameter
- **Auto-Update**: Comment indicates version is managed by `version-update.js`

### Error Handling

- **Fallback**: If audio/intro loader fails, still redirects to `/chat`
- **Error Logging**: Logs errors to console before fallback (line 96)
- **Graceful Degradation**: Always ensures user can access the app

### Redirect Behavior

**Final URL**: `/chat` + query params + hash
**Method**: `window.location.replace()` (no browser history entry)
**Preserves**: URL search params and hash fragments

---

## Questions for Further Investigation

1. What does device-detector.js actually do? (Not used in index.html logic)
2. What audio plays during intro loader?
3. What does the intro loader animation look like?
4. Where does `/chat` redirect go? (Cloud Function routing)
5. How does the app determine mobile vs desktop after `/chat` redirect?

---

## Next Files to Investigate

1. `js/device-detector.js` - Device detection logic
2. `js/audioStateManager.js` - Audio system initialization
3. `js/intro-loader.js` - Intro animation and user interaction
4. Firebase Functions (to understand `/chat` routing)
