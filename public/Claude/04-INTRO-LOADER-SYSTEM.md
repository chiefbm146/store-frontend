# Intro Loader System - Interactive Journey Begin Screen

**File**: `/public/js/intro-loader.js`
**Type**: ES6 Module (default export)
**External Dependencies**: Three.js (liquid background), audioStateManager

---

## Overview

A **production-ready, interactive pre-loading screen** featuring a dynamic water/ripple animation, liquid background, and immersive audio experience. Designed to create an engaging entry point to the application while masking initial load time.

---

## Core Features

### 1. Visual Design
- **Theme**: Blue/white color palette (replacing original red/black)
- **Background**: Gradient from #E3F2FD → #B3E5FC → #81D4FA (light to deep blues)
- **Animation**: Ripple effect with 5 expanding circles
- **Logo**: Custom SVG moon logo (viewBox: 794x1123)
- **Liquid Effect**: Three.js-powered interactive water simulation
- **Click Prompt**: Pulsing "Click To Begin Your Journey" text at bottom

### 2. Interaction Model
```
User lands on page
   ↓
Sees pulsing "Click To Begin Your Journey" text
   ↓
User clicks anywhere on overlay
   ↓
Expansion animation plays (3 seconds)
   ↓
Audio plays (water bubbles + optional walking sound)
   ↓
Minimum 3-second display after click
   ↓
Fade out (500ms)
   ↓
Redirect to /chat
```

### 3. Audio System Integration

#### Audio Files Used
1. **unlock.mp3** (./sounds/)
   - Volume: 0.001 (nearly silent)
   - Purpose: Trigger audio context unlock
   - Plays first on click

2. **water-bubbles-257594.mp3** (./sounds/)
   - Volume: 0 → 0.7 (fade-in over 500ms)
   - Purpose: Journey begin sound
   - Plays 100ms after unlock sound

3. **walking-in-water-199418.mp3** (./sounds/)
   - Volume: 0.5 (constant)
   - Purpose: Interactive drag/movement sound
   - Loops while user drags

#### Audio Permission Flow
```javascript
// Checks audioStateManager before playing
if (audioStateManager.state.isAudioEnabled &&
    audioStateManager.state.permissionStatus === 'granted') {
  // Play audio
}
```

---

## Technical Architecture

### State Management

```javascript
{
  isActive: Boolean,           // Loader currently in DOM?
  loaderElement: HTMLElement,  // Reference to overlay div
  initTime: Number,            // When user clicked (Date.now())
  MIN_DISPLAY_TIME: 3000,      // 3 seconds after click
  audioElement: Audio,         // Water bubbles audio
  hasUserClicked: Boolean,     // User has clicked to begin?
  walkingWaterAudio: Audio,    // Walking sound
  isUserDragging: Boolean      // User currently dragging?
}
```

### Public API

#### `init()`
```javascript
introLoader.init();
```
**Called in**: `index.html:81`

**Actions**:
1. Injects CSS styles into `<head>`
2. Injects HTML overlay into `<body>`
3. Sets up click handlers
4. Initializes Three.js liquid background
5. Returns immediately (doesn't wait for click)

#### `hide()` (async)
```javascript
await introLoader.hide();
```
**Called in**: `index.html:86`

**Returns**: Promise that resolves when loader fully hidden

**Logic**:
1. If user hasn't clicked: Wait for click (polls every 100ms)
2. Once clicked: Start 3-second countdown
3. After countdown: Fade out (500ms CSS transition)
4. Remove from DOM
5. Stop all audio
6. Show main content (.chat-section, .ai-portal)
7. Resolve promise

**Critical**: `index.html` waits for this promise before redirecting to `/chat`

---

## CSS Animations

### Idle State (Before Click)

**Ripple Animation** (`intro-ripple-idle`):
```css
0%   → scale(1),   shadow(0 10px 10px)
50%  → scale(1.3), shadow(0 30px 20px)
100% → scale(1),   shadow(0 10px 10px)
Duration: 3s infinite
```

**Logo Animation** (`intro-logo-idle`):
```css
0%   → opacity(0.7), scale(1)
50%  → opacity(1),   scale(1.1)
100% → opacity(0.7), scale(1)
Duration: 3s infinite
```

**Text Pulse** (`intro-pulse`):
```css
0%   → opacity(0.7)
50%  → opacity(1)
100% → opacity(0.7)
Duration: 2s infinite
```

### Clicked State (Expansion)

**Staggered Expansion**:
- Box 1: 0ms delay
- Box 2: 50ms delay
- Box 3: 100ms delay
- Box 4: 150ms delay
- Box 5: 200ms delay
- Logo: 0ms delay

**Expansion Animation** (`expand-out-box`):
```css
0%   → scale(1),   opacity(1)
100% → scale(3.5), opacity(0)
Duration: 3s ease-out
```

**Logo Expansion** (`expand-out-logo`):
```css
0%   → translate(-50%, -50%) scale(1),   opacity(1)
100% → translate(-50%, -50%) scale(3.5), opacity(0)
Duration: 3s ease-out
```

---

## Three.js Liquid Background

### Implementation
```javascript
// Dynamically imports from CDN
import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js')
```

### Configuration
- **Canvas**: `#intro-loader-liquid-canvas` (fullscreen absolute)
- **Image**: Programmatically generated blue gradient (512x512)
  - Gradient: #1E90FF → #29B6F6 → #0047AB
  - Wavy ring patterns for liquid effect
- **Material**:
  - Metalness: 0.75
  - Roughness: 0.25
  - Displacement Scale: 5
  - Rain: false

### Performance
- **External dependency**: Adds ~150KB from CDN
- **GPU rendering**: Uses WebGL
- **Fallback**: If load fails, gradient background still visible

---

## Event Handling

### Click to Begin
```javascript
overlay.addEventListener('click', () => {
  1. Set hasUserClicked = true
  2. Record initTime = Date.now()
  3. Add 'clicked-active' class (triggers expansion)
  4. Hide click text (opacity: 0)
  5. Play journey audio (unlock + bubbles)
});
```

### Drag for Walking Sound
```javascript
// Mouse events
mousedown  → isUserDragging = true
mousemove  → if dragging, play walking sound
mouseup    → stop walking sound
mouseleave → stop walking sound

// Touch events (same logic)
touchstart → isUserDragging = true
touchmove  → if dragging, play walking sound
touchend   → stop walking sound
```

**Walking Sound**:
- Volume: 0.5
- Loop: true (plays continuously while dragging)
- Stops immediately on release

---

## Content Reveal After Hide

When loader hides, it reveals:

1. **Remove hide style**:
   ```javascript
   document.getElementById('initial-hide-body')?.remove();
   ```

2. **Show chat section**:
   ```javascript
   document.querySelector('.chat-section').style.opacity = '1';
   document.querySelector('.chat-section').style.visibility = 'visible';
   ```

3. **Show AI portal**:
   ```javascript
   document.querySelector('.ai-portal').style.opacity = '1';
   document.querySelector('.ai-portal').style.visibility = 'visible';
   ```

**Note**: These elements (.chat-section, .ai-portal) suggest the app structure but don't exist in index.html (only in mobile.html/desktop.html).

---

## Design Strengths

1. **User Engagement**: Requires user interaction (click) to proceed
2. **Minimum Display Time**: Ensures users see the animation (3s after click)
3. **Smooth Transitions**: Fade-in/fade-out with CSS transitions
4. **Audio Integration**: Respects user preferences via audioStateManager
5. **Interactive Elements**: Drag-to-play walking sound adds delight
6. **Promise-Based**: Clean async flow for caller (index.html)
7. **Cleanup**: Properly stops audio and removes DOM elements
8. **GPU Acceleration**: Three.js uses WebGL for smooth liquid effect
9. **Responsive**: Works on mobile and desktop (touch and mouse events)
10. **Graceful Degradation**: If Three.js fails, gradient background still works

---

## Potential Issues Found

### Issue 1: External CDN Dependency
**Location**: Line 601
```javascript
import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js')
```
- **Problem**: Depends on external CDN availability
- **Risk**: If CDN down or blocked, liquid effect fails
- **Impact**: Medium - gradient background still works
- **Recommendation**: Bundle locally or add fallback

### Issue 2: Polling for Click
**Location**: Lines 664-674
```javascript
const clickCheckInterval = setInterval(() => {
  if (this.hasUserClicked) {
    clearInterval(clickCheckInterval);
    // ...
  }
}, 100);
```
- **Problem**: Polls every 100ms instead of using event/promise
- **Risk**: Slight CPU overhead
- **Impact**: Low - stops after click
- **Better Approach**: Promise + resolve in click handler

### Issue 3: Hard-Coded Audio Paths
**Location**: Lines 386, 396, 447
```javascript
./sounds/unlock.mp3
./sounds/water-bubbles-257594.mp3
./sounds/walking-in-water-199418.mp3
```
- **Problem**: No configuration or error handling if files missing
- **Impact**: Medium - console errors if files don't exist
- **Recommendation**: Add file existence checks or config object

### Issue 4: Content Selectors Don't Exist
**Location**: Lines 712-721
```javascript
const chatSection = document.querySelector('.chat-section');
const aiPortal = document.querySelector('.ai-portal');
```
- **Problem**: These elements don't exist in index.html (only in mobile/desktop.html)
- **Impact**: Low - code runs but does nothing in index.html context
- **Explanation**: This is fine - loader is reused in mobile/desktop.html where these exist
- **Recommendation**: Document where loader is reused

### Issue 5: Commented Code Not Removed
**Location**: Lines 744-761
- **Problem**: Large block of commented code
- **Impact**: Low - just code cleanliness
- **Recommendation**: Remove dead code

### Issue 6: No Error Boundary
- **Problem**: If Three.js import fails, only logs error to console
- **Impact**: Low - gradient background still visible
- **Recommendation**: Show fallback message or different animation

---

## Usage in App Flow

### In index.html
```javascript
// Step 1: Import
import('./js/intro-loader.js?v=11.0.12')

// Step 2: Initialize (shows loader)
introLoader.init()

// Step 3: Wait for user interaction + 3s
await introLoader.hide()

// Step 4: Redirect to /chat
window.location.replace('./chat')
```

### Timeline Example
```
0ms    → introLoader.init() called
0ms    → User sees liquid background + logo + "Click To Begin"
2500ms → User clicks
2500ms → Expansion animation starts + audio plays
5500ms → 3-second countdown complete
6000ms → Fade out (500ms)
6000ms → Redirect to /chat
```

---

## Audio Files Investigation Needed

**Next Steps**:
1. Verify `./sounds/` directory exists
2. Check if all 3 audio files are present
3. Document audio file sizes and formats
4. Test fallback if audio files missing

---

## Questions for Further Investigation

1. Are .chat-section and .ai-portal used in mobile.html/desktop.html?
2. What does `/chat` Cloud Function do after redirect?
3. Is there a #initial-hide-body style element somewhere?
4. Why is intro loader used in index.html if content elements don't exist?
5. Is intro loader also used in mobile.html/desktop.html?
