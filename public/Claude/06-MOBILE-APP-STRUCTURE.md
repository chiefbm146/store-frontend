# Mobile App Structure - Main Interface

**File**: `/public/mobile.html`
**Served via**: `/chat` → Firebase deviceRouter → mobile.html
**Purpose**: Main mobile application interface - AI chat with workshop booking

---

## Overview

A **minimal HTML shell** that loads a sophisticated JavaScript-driven AI chat interface. The HTML provides structure while JavaScript modules handle all functionality including chat, booking, audio, and UI interactions.

---

## HTML Structure

### Minimal DOM Elements

```html
<body>
  <div class="loading-spinner-overlay">...</div>

  <div class="ai-portal">
    <div class="portal-header">
      <h1>🌊 Moon Tide</h1>
      <div class="header-buttons-group">
        <div id="header-left-container"></div>   <!-- JS adds speaker button -->
        <div id="header-right-container"></div>  <!-- JS adds hamburger menu -->
      </div>
      <div class="ai-status">
        <div class="status-indicator"></div>
        <span>ONLINE</span>
      </div>
    </div>

    <div class="messages-container">
      <div id="messages"></div>                  <!-- Chat messages -->
      <div id="typingIndicator">...</div>        <!-- Typing animation -->
      <div id="moduleContainer"></div>           <!-- UI modules (booking, etc.) -->
    </div>

    <div class="input-area">
      <input id="userInput" maxlength="4000" />
      <button id="sendButton">
        <i class="fas fa-arrow-up"></i>
      </button>
    </div>
  </div>

  <audio id="ttsPlayer" style="display: none;"></audio>
</body>
```

**Design Philosophy**: Minimal markup, maximal JavaScript control

---

## CSS Architecture

### Loaded Stylesheets (in order)

1. **External Libraries**:
   - Font Awesome 5.15.4 (icons)
   - Flatpickr (date picker styling)

2. **Feature-Specific CSS**:
   - `smart-message.css` - Chat message styling
   - `fullscreen-modals.css` - Workshop selection, payment modals
   - `hamburger-menu.css` - Slide-out navigation menu
   - `delete-data.css` - Data deletion UI
   - `stripe-checkout.css` - Payment form styling
   - `mobile.css` - **Mobile-specific overrides**

**All CSS**: Cache-busted with `?v=11.0.12`

---

## JavaScript Module Architecture

### Loading Order (Critical!)

```
1. clean-url.js (line 5)          ← Runs FIRST (removes URL clutter)
2. device-detector.js (line 55)   ← Device capabilities
3. audioStateManager.js (line 58) ← Audio system core
4. audioPermissionUI.js (line 59) ← Audio permission dialogs
5. soundManager.js (line 60)      ← Sound effects
6. version-manager.js (line 122)  ← Cache control
7. portal-store.js (line 135)     ← State management
8. tts-manager.js (line 136)      ← Text-to-speech
9. jarvis-ui-manager.js (line 137)← UI action handlers
10. portal-controller.js (line 138)← **MAIN CONTROLLER**
11. hamburger-menu.js (line 139)  ← Navigation menu
12. smart-message-renderer.js (143)← Booking flow
13. intro-loader.js (line 186)    ← Reused for spinner timing
```

### Module Types

**ES6 Modules** (type="module"):
- portal-store.js
- tts-manager.js
- jarvis-ui-manager.js
- portal-controller.js
- hamburger-menu.js
- smart-message-renderer.js
- audioStateManager.js
- audioPermissionUI.js
- soundManager.js
- intro-loader.js (for spinner)

**Classic Scripts**:
- device-detector.js (global class)
- version-manager.js (cache control)
- clean-url.js (URL cleanup)

---

## External Dependencies

### CDN Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Font Awesome | 5.15.4 | Icons (arrows, hamburger, etc.) |
| Flatpickr | Latest | Date picker for workshop booking |
| Three.js | r134 | 3D moon logo rendering |
| GLTFLoader | 0.134 | Loading 3D models for logo |

**Note**: All external CDN URLs include `?v=11.0.12` for consistency

---

## Key Features

### 1. Auto-Booking Flow

**Trigger**: URL parameter `?book=workshop-id`

**Example**: `/chat?book=wksp_12345`

**Flow**:
```javascript
1. URL parameter detected (line 128)
2. Set window.skipWelcomeMessage = true
3. Wait for smartMessageRenderer to load
4. Clear messages div (removes welcome)
5. Call smartMessageRenderer.selectWorkshop(id)
6. Clean URL (remove ?book parameter)
```

**Retry Logic**: Polls every 100ms until SmartMessageRenderer ready

**Use Case**: Workshop detail pages have "Book Now" button → Redirects to /chat?book=id

### 2. Loading Spinner Management

**Purpose**: Show spinner between intro loader and UI ready

**Flow**:
```
Intro loader hides
   ↓
Spinner shows (line 209)
   ↓
Poll for UI readiness (line 218)
   ↓
Check: portalController + messages.children.length > 0
   ↓
Wait 800ms (typing animation visible)
   ↓
Fade out spinner (500ms transition)
   ↓
Remove from DOM
```

**Spinner UI**: 4 concentric blue rings + "LOADING..." text

**Styling**: `mobile.css` lines 44-128 (from CLAUDE.md)

### 3. Audio System (3-Module Architecture)

**audioStateManager.js**:
- Persistent state (localStorage)
- Permission tracking

**audioPermissionUI.js**:
- Permission dialogs
- User interaction prompts

**soundManager.js**:
- Sound effect playback
- Audio unlocking

**tts-manager.js**:
- Text-to-speech
- `<audio id="ttsPlayer">` element

### 4. Skip Welcome Message Flag

**Set by**: Auto-booking detection (line 129)

```javascript
if (urlParams.get('book')) {
  window.skipWelcomeMessage = true;
}
```

**Used by**: Portal controller to skip initial greeting

---

## Portal Header Structure

### Dynamic Button Containers

**Left Container** (`header-left-container`):
- Populated by JavaScript
- **Purpose**: Master speaker toggle button
- **Added by**: soundManager.js or portal-controller.js

**Right Container** (`header-right-container`):
- Populated by JavaScript
- **Purpose**: Hamburger menu button
- **Added by**: hamburger-menu.js

**Why empty?**: Allows modules to control button visibility and state

### AI Status Indicator

```html
<div class="ai-status">
  <div class="status-indicator"></div>
  <span class="status-text">ONLINE</span>
</div>
```

**States**: Likely animated via CSS (pulsing, color changes)

**Location**: Below Moon Tide title

---

## Messages Container Architecture

### Three Zones

1. **#messages** (line 98)
   - Chat message history
   - AI responses
   - User messages
   - Populated by portal-controller.js

2. **#typingIndicator** (line 101)
   - 3 animated dots
   - Shows when AI is "thinking"
   - Controlled by portal-controller.js

3. **#moduleContainer** (line 106)
   - **Jarvis UI modules**
   - Workshop selection grid
   - Organization type selector
   - Date picker
   - Payment forms
   - Rendered by jarvis-ui-manager.js

**Design**: Modules appear below messages, not inline

---

## Input Area

### Input Field
```html
<input id="userInput"
       placeholder="Send a message..."
       autocomplete="off"
       maxlength="4000">
```

**Max Length**: 4000 characters
**Autocomplete**: Disabled (privacy)

### Send Button
```html
<button id="sendButton">
  <i class="fas fa-arrow-up"></i>
</button>
```

**Icon**: Font Awesome up arrow
**Behavior**: Sends message when clicked or Enter pressed

---

## Meta Tags & SEO

### Mobile-Specific OG Tags

```html
og:title: "Moon Tide Reconciliation - Workshops & Indigenous Art"
og:description: "Join transformative workshops and explore Indigenous cultural wisdom on mobile"
og:image: /images/musqueam/moon9.png (794x1123)
og:url: https://reconciliation-storefront.web.app/mobile.html
```

**Note**: URL says `/mobile.html` but actual URL is `/chat` (deviceRouter handles this)

### Keywords
```
reconciliation, indigenous workshops, moon tide, musqueam,
mobile app, cultural education
```

### Viewport Settings

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1.0,
               maximum-scale=1.0, user-scalable=no">
```

**Critical**: `user-scalable=no` prevents accidental pinch-zoom on mobile

---

## Favicon

```html
<link rel="icon" href="data:image/svg+xml,<svg...><text>🌊</text></svg>">
```

**Type**: Inline SVG data URL
**Emoji**: 🌊 (wave emoji)

**Why SVG?**: Scales to any size, no image file needed

---

## Commented Code

### Floating Cart Button (lines 82-87)

```html
<!-- <div id="floating-cart-container">
    <button id="cart-button" title="View Cart">
        🛒
        <span id="cart-item-count">0</span>
    </button>
</div> -->
```

**Status**: Disabled
**Reason**: Likely moved to hamburger menu or removed feature
**Note**: Cart system may still exist in JavaScript

---

## Version Management

### Cache Busting Strategy

**All Assets**: `?v=11.0.12` query parameter

**version-manager.js** (line 122):
- Advanced cache control
- Facebook Messenger optimization
- Forces cache refresh on version change

**Comment** (line 11):
```html
<!-- VERSION: 11.0.12 - DO NOT MANUALLY EDIT - Updated by version-update.js -->
```

**Implication**: Automated version bumping system

---

## Design Strengths

1. **Minimal HTML**: ~260 lines, mostly scripts/CSS
2. **Module System**: ES6 modules for clean dependencies
3. **Progressive Enhancement**: Works without JavaScript (shows structure)
4. **Cache Control**: Comprehensive versioning system
5. **Loading UX**: Spinner prevents blank screen anxiety
6. **Auto-Booking**: Deep linking to specific workflows
7. **Responsive**: Mobile-first design with viewport meta tag
8. **Accessibility**: Semantic HTML, ARIA-friendly structure
9. **Performance**: Async script loading, CDN resources
10. **Maintainability**: Clear separation of concerns

---

## Potential Issues Found

### Issue 1: Commented Cart Button
**Location**: Lines 82-87
- **Problem**: Dead code not removed
- **Impact**: Low - just code cleanliness
- **Recommendation**: Remove or document why commented

### Issue 2: OG URL Mismatch
**Location**: Line 13
```html
<meta property="og:url" content=".../mobile.html">
```
- **Problem**: Actual URL is `/chat`, not `/mobile.html`
- **Impact**: Medium - social media previews show wrong URL
- **Recommendation**: Update to `/chat` or use deviceRouter

### Issue 3: Hard-Coded Version
**Location**: Multiple lines (11, 38-61, 122-139)
- **Problem**: Manual version updates required despite automation claim
- **Impact**: Low - version-update.js handles this
- **Recommendation**: Verify version-update.js works correctly

### Issue 4: No Noscript Fallback
- **Problem**: If JavaScript disabled, app is unusable
- **Impact**: Low - mobile apps assume JavaScript
- **Recommendation**: Add `<noscript>` message for accessibility

### Issue 5: External CDN Dependencies
**Location**: Lines 38-52
- **Problem**: Relies on external CDNs (Font Awesome, Three.js, Flatpickr)
- **Risk**: If CDN down, features break
- **Impact**: Medium
- **Recommendation**: Bundle critical libraries locally

### Issue 6: Polling for SmartMessageRenderer
**Location**: Lines 174-176
```javascript
setTimeout(startBookingFlow, 100);
```
- **Problem**: Polls every 100ms instead of event-driven
- **Impact**: Low - stops after ready
- **Better Approach**: Custom event when SmartMessageRenderer loads

### Issue 7: Magic Numbers
**Location**: Lines 172 (500ms), 226 (800ms), 237 (500ms), 242 (100ms)
- **Problem**: Hard-coded timing values without explanation
- **Impact**: Low - functional but not maintainable
- **Recommendation**: Extract to config constants with comments

---

## Next Files to Investigate

### Critical Path (in loading order)
1. **clean-url.js** - URL cleanup logic
2. **version-manager.js** - Cache control
3. **portal-store.js** - State management
4. **portal-controller.js** - **MAIN CONTROLLER** (most important!)
5. **jarvis-ui-manager.js** - UI module rendering
6. **smart-message-renderer.js** - Booking flow
7. **hamburger-menu.js** - Navigation

### Supporting Systems
8. **soundManager.js** - Audio playback
9. **tts-manager.js** - Text-to-speech
10. **audioPermissionUI.js** - Permission dialogs

### CSS Files
11. **mobile.css** - Mobile-specific styles
12. **smart-message.css** - Chat styling
13. **fullscreen-modals.css** - Modal system
14. **stripe-checkout.css** - Payment forms

---

## Questions for Investigation

1. What does portal-controller.js do on initialization?
2. How does SmartMessageRenderer handle the booking flow?
3. What UI modules does jarvis-ui-manager.js support?
4. Is the cart system still functional (commented button)?
5. What's in clean-url.js and why does it load first?
6. How does version-manager.js optimize for Facebook Messenger?
7. What's the structure of portal-store.js state?
