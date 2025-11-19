# Portal Controller - Main Application Logic

**File**: `/public/js/portal-controller.js`
**Lines**: 1162
**Type**: ES6 Module
**Role**: **MAIN APPLICATION CONTROLLER**

---

## Overview

The **heart of the entire application**. This file orchestrates all functionality including:
- AI chat interface
- 3D moon logo rendering
- Device fingerprinting & security
- Booking flow coordination
- Audio/TTS system
- Cart management
- Backend API communication

**Think of it as**: The conductor of an orchestra - coordinates all other modules

---

## Module Dependencies (14 Imports)

### Core State & Logic
1. **portal-store.js** - Message state (user/AI messages, typing indicator)
2. **app-store.js** - Module state (is modal open? which modal?)
3. **conversation-intelligence-store.js** - Booking state tracking

### UI Systems
4. **jarvis-ui-manager.js** - UI module rendering (modals, forms)
5. **smart-message-renderer.js** - Booking flow UI, special message rendering
6. **hamburger-menu.js** - Navigation menu
7. **module-manager.js** - Module lifecycle management

### Audio Systems
8. **tts-manager.js** - Text-to-speech
9. **soundManager.js** - Sound effects (clicks, responses)
10. **audioStateManager.js** - Audio permissions

### E-commerce
11. **cart-store.js** - Shopping cart state

### Visual Systems
12. **asset-preloader.js** - Image preloading
13. **water.js** - Water background effect
14. **text_animator.js** - Text animations

### Configuration
15. **config/services-config.js** - IMAGE_PATHS_TO_PRELOAD array

---

## Global Constants

```javascript
const BACKEND_URL = "https://reconciliation-backend-934410532991.us-central1.run.app";
const UI = {}; // DOM element cache
let sessionId = null; // Current chat session
let welcomeMessageRendered = false; // Guard flag
const messageAudioCache = {}; // TTS audio cache
let ttsFirstUnlocked = false; // First TTS unlock tracking
```

---

## Security System - Device Fingerprinting

### Purpose
**Rate limiting** and **abuse prevention** on backend API

### Two-Layer System

#### Layer 1: Device Fingerprint
**Generated at**: Line 126 (`initializeDeviceDetector()`)

**Format**: `{formFactor}_{width}x{height}_{pixelDensity}`

**Examples**:
- Desktop: `desktop_1920x1080_1.0`
- Mobile: `mobile_375x812_2.0`
- Tablet: `tablet_768x1024_1.5`

**Data Collected**:
- Form factor (mobile/tablet/desktop)
- Screen dimensions (width x height)
- Pixel density (devicePixelRatio)
- Device capabilities (from DeviceDetector)

**Sent with**: Every backend API request

#### Layer 2: Fingerprint Signature (Replay Protection)
**Generated at**: Line 56 (`getFingerprintSignatureWithCache()`)

**How It Works**:
1. Frontend sends device fingerprint to backend `/sign-fingerprint` endpoint
2. Backend signs fingerprint with timestamp
3. Frontend caches signature for **2 minutes**
4. Signature sent with chat requests for validation

**Caching**:
- **Duration**: 2 minutes (120 seconds)
- **Why**: Reduces latency from 100-200ms to <1ms
- **Expires**: `fingerprintSignatureCache.expiresAt`

**Request Example**:
```javascript
fetch(`${BACKEND_URL}/chat`, {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Hello",
    session_id: "session_1234...",
    device_fingerprint: "desktop_1920x1080_1.0",
    fingerprint_signature: "abc123...",
    fingerprint_timestamp: 1700000000
  })
})
```

**Security Benefits**:
1. **Rate Limiting**: Backend can limit requests per device
2. **Replay Attack Prevention**: Timestamped signatures expire
3. **Bot Detection**: Unusual device fingerprints flagged
4. **Abuse Prevention**: Multiple accounts from same device detected

---

## Session Management

### Session Creation
**Function**: `getSessionId()` (line 110)

**Behavior**:
- **Always** creates fresh session on page load
- **Format**: `session_{timestamp}_{random9chars}`
- **Example**: `session_1700000000_a7x3k9q2m`
- **Storage**: `sessionStorage.setItem('moonTideSessionId', sessionId)`

**Why Fresh Sessions?**
> "Each page load = new conversation"

**Not Persistent**: Session lost on page refresh (intentional design)

---

## 3D Moon Logo System

### Architecture: Unified Render Loop

**Problem**: Each message creating independent WebGL context = **mobile crash**

**Solution**: Load model **once**, clone for each message, **single render loop**

### Shared 3D Assets Object

```javascript
const shared3D = {
  gltfLoader: new THREE.GLTFLoader(),
  loadedModel: null,          // Pre-loaded GLB model
  animations: [],             // Animation clips
  instances: [],              // All logo instances
  clock: new THREE.Clock(),   // Single global clock
  renderLoopPaused: false     // Pause during modals
};
```

### Initialization (Line 165)

**Function**: `initializeShared3DAssets()`

**Steps**:
1. Load `/moon_logo_3d.glb?v=11.0.12` via GLTFLoader
2. Store model in `shared3D.loadedModel`
3. Extract animations
4. **Start single global render loop** (line 174)

**Render Loop** (runs 60 FPS):
```javascript
function globalAnimateLoop() {
  requestAnimationFrame(globalAnimateLoop);

  if (shared3D.renderLoopPaused) return; // Pause during modals

  const delta = shared3D.clock.getDelta();
  for (const instance of shared3D.instances) {
    instance.mixer.update(delta);
    instance.renderer.render(instance.scene, instance.camera);
  }
}
```

**Critical**: Pause loop when modals open to prevent mobile crashes (line 538)

### Creating Logo for Message (Line 212)

**Function**: `create3dLogoForMessage()`

**Process**:
1. Clone pre-loaded model (fast!)
2. Create new WebGL renderer (50x50px)
3. Create scene + camera + lights
4. Scale model to fit (auto-sizing)
5. Create animation mixer
6. **Add to global instances array** (line 245)
7. Return container div

**Performance**:
- **Before**: Load model per message (~500ms each)
- **After**: Clone model (~5ms each)
- **Mobile Impact**: Prevents WebGL context limit (typically 8-16 contexts)

---

## Initialization Flow

### `init(skipRender = false)` (Line 257)

**Complete Startup Sequence**:

```
1. Initialize audioStateManager
   ↓
2. Initialize shared 3D assets (load moon model)
   ↓
3. Cache DOM elements
   ↓
4. Initialize soundManager (sound effects)
   ↓
5. Initialize hamburgerMenu (navigation)
   ↓
6. Setup event listeners (send button, input)
   ↓
7. Initialize cart system
   ↓
8. Initialize floating cart button
   ↓
9. Initialize DeviceDetector (fingerprinting)
   ↓
10. Create JarvisUIManager instance
    ↓
11. Expose global APIs (window.jarvisManager, etc.)
    ↓
12. Add state change listener (re-render on state change)
    ↓
13. Handle URL hash (deep linking: #SHOW_DELETE_DATA)
    ↓
14. Send wake-up ping to backend
    ↓
15. Preload images (assetPreloader)
    ↓
16. Render initial welcome message (unless skipRender)
    ↓
17. Initialize water background effect
```

**Exposed Global APIs** (line 278-283):
```javascript
window.jarvisManager = this.jarvisManager;
window.smartMessageRenderer = smartMessageRenderer;
window.conversationIntelligence = conversationIntelligence;
window.getSessionId = getSessionId;
window.cartStore = cartStore;
window.deviceFingerprint = deviceFingerprint;
window.toggleGlobalUI = toggleGlobalUI;
```

**Why Global?**: Other modules need access (event-driven architecture)

---

## Backend Integration

### Backend URL
```
https://reconciliation-backend-934410532991.us-central1.run.app
```

**Platform**: Google Cloud Run (serverless containers)

### Endpoints Used

#### 1. `/wakeup` (GET)
**Purpose**: Wake up backend on page load (prevents cold starts)
**When**: During init() (line 292)
**Response**: `{ status: "awake" }`

#### 2. `/sign-fingerprint` (POST)
**Purpose**: Get signed device fingerprint
**When**: Before each chat request (cached 2min)
**Payload**: `{ device_fingerprint: "desktop_1920x1080_1.0" }`
**Response**: `{ signature: "abc...", timestamp: 1700000000 }`

#### 3. `/chat` (POST)
**Purpose**: Send user message, get AI response
**When**: User sends message or silent command
**Payload**:
```javascript
{
  prompt: "Hello",
  session_id: "session_1234...",
  device_fingerprint: "desktop_1920x1080_1.0",
  fingerprint_signature: "abc...",
  fingerprint_timestamp: 1700000000
}
```
**Response**:
```javascript
{
  response: "AI response text",
  action: { type: "SHOW_WORKSHOP_GRID", workshops: [...] },
  booking: { workshop_id: "wksp_123", ... }
}
```

---

## Message Rendering System

### render() Function (Line 782)

**Triggered By**:
- State changes (portal-store dispatch)
- User sends message
- AI responds
- Module opens/closes

**State Sources**:
```javascript
const { lastUserMessage, lastAiMessage, isTyping } = portalStore.state;
const hasActiveModule = appStore.state.isModuleActive;
const currentModule = appStore.state.activeModule;
const isInBookingFlow = conversationIntelligence.state.booking.workshop_id;
```

**Render Logic**:

```
1. Clear messages div (always)
2. Clear module container (only if no active module)
3. Toggle typing indicator
   ↓
4. IF NOT typing AND NO active module:
   ↓
   A. IF first load (no messages, no welcome rendered):
      → Render welcome message (with <special> terms)
      → Set welcomeMessageRendered = true
   ↓
   B. IF has messages:
      → Render lastUserMessage
      → Render lastAiMessage (with 3D logo)
      → Play AI response sound
      ↓
      → IF in booking flow:
         → Re-render booking UI inline (hybrid mode)
   ↓
5. Render floating images (booking images or default chat images)
   ↓
6. Update button states (disable if typing)
   ↓
7. Auto-focus input (desktop only)
   ↓
8. Render schedule button (if not in module)
```

### Welcome Message

**Rendered Once**: Guard flag `welcomeMessageRendered` prevents re-render

**Content** (line 808):
```
"Welcome to <special>Moon Tide Reconciliation</special>.
We are a collective of <special>Indigenous Elders</special>,
<special>knowledge keepers</special>, and facilitators guided
by our lead contact, <special>Shona Sparrow</special>.

Our mission is to foster true <special>reconciliation</special>
through powerful, shared experiences. We offer a variety of
transformative <special>cultural workshops</special> designed
to open hearts and guide organizations on a meaningful journey.

Feel free to explore. You can click on any of the highlighted
<special>special terms</special> to learn more about them.
How may I help you today?"
```

**<special> Tags**: Clickable terms that trigger UI modules

**Skipped If**: `window.skipWelcomeMessage = true` (auto-booking)

### Hybrid Booking Flow (Line 834)

**Problem**: Chat messages + booking UI need to coexist

**Solution**: After rendering chat messages, check booking state:
```javascript
if (!hasActiveModule && bookingState && bookingState.workshop_id) {
  if (!isFinalStep) {
    // Render booking UI inline below conversation
    await smartMessageRenderer.renderSmartConciergeUI(...);
  }
}
```

**States**:
1. Workshop selected → Show org type selector
2. Org type selected → Show participants input
3. Participants entered → Show date picker
4. Date selected → Final API call → Full modal

---

## Sending Messages

### handleSendMessage() (Line 575)

**Triggers**: Send button click OR Enter key

**Flow**:
```
1. Get userText from input
2. Check if in booking flow
3. Determine if transactional call (booking API, not chat)
   ↓
4. Return early if:
   - No text AND not transactional AND button enabled
   - Send button disabled
   ↓
5. Dispatch 'startSendMessage' (shows typing indicator)
6. Clear input field
   ↓
7. Get fingerprint signature (cached)
   ↓
8. Send POST to /chat endpoint
   ↓
9. Receive response:
   - AI text
   - Action (UI to trigger)
   - Booking state update
   ↓
10. Update conversationIntelligence from backend
11. Dispatch 'receiveAiResponse'
12. Handle Jarvis action (if present)
    ↓
13. Error handling: Show fallback message
```

**Transactional Call Example**:
```javascript
// User in booking flow, no text, just confirming final booking
const isTransactionalBookingCall =
  bookingState.workshop_id && !userText;
```

**Why?**: Final booking submission has no user message, just API call

---

## Silent Commands

### sendSilentCommand(command, optionalAiMessage) (Line 349)

**Purpose**: Send command to backend **without** showing user message

**Use Cases**:
- `[EXIT_BOOKING_FLOW]` - User cancels booking
- `[CONFIRM_WORKSHOP]` - User confirms selection
- System actions that shouldn't appear as chat messages

**Difference from handleSendMessage()**:
```javascript
// Prevents user message from appearing
portalStore.dispatch('startSendMessage', { userText: null });
```

---

## TTS (Text-to-Speech) System

### Play Button States

**Locked State** (before first unlock):
- Icon: 🔇 (fa-volume-mute)
- Title: "Click to unlock TTS"

**Unlocked State**:
- Icon: ▶️ (fa-play)
- Title: "Play"

**Playing State**:
- Icon: ⏸️ (fa-pause)

**Loading State**:
- Icon: 🔄 (fa-spinner fa-spin)

### Two-Click System (Line 937)

**Click 1**: Unlock TTS
```javascript
if (isLocked) {
  await ttsManager.attemptTTSUnlock();
  updatePlayButtonStates(); // All buttons → play icon
  return; // Don't play yet!
}
```

**Click 2**: Play audio
```javascript
const audioBase64 = await ttsManager.getAudio(messageText, BACKEND_URL);
ttsManager.play(audioBase64);
```

**Why Two Clicks?**
- Browser requires user interaction to unlock audio
- First click = unlock audio context
- Second click = actually play

### First Unlock Glow Animation (Line 951)

**Trigger**: First TTS unlock sets `ttsFirstUnlocked = true`

**Animation** (injected CSS, line 412-456):
```css
@keyframes glow-pulse {
  0%   { scale(1),   box-shadow: 0 0 0 rgba(30,144,255,0.9); }
  50%  { scale(1.4), box-shadow: 0 0 30px 15px rgba(30,144,255,0.6); }
  100% { scale(1),   box-shadow: 0 0 0; }
}
```

**Duration**: 3.5s
**Purpose**: Celebrate TTS unlock, draw attention to feature

---

## Global UI Toggle (Line 510)

### toggleGlobalUI(isVisible)

**Hides/Shows**:
1. Floating cart button (`#floating-cart-container`)
2. Master speaker button (`#master-speaker-btn`)
3. Hamburger menu button (`#hamburger-button`)

**When Hidden**: Full-screen modals (Stripe checkout, workshop grid, etc.)

**Critical Side Effect** (line 538):
```javascript
shared3D.renderLoopPaused = !isVisible;
```

**Why?**: Pause 3D rendering during modals prevents mobile crashes

**Exposed Globally**: `window.toggleGlobalUI` (for module-manager.js)

---

## Cart System

### Initialization (Line 482)

**Button**: `#cart-button` (may be commented out in HTML)

**Event**: Click → `handleCartButtonClick()` → Opens cart modal

**Subscription**: Listens to cart changes, updates badge count

### Cart Badge (Line 500)

**Element**: `#cart-item-count`

**Updates**: Real-time when items added/removed

**Display**: Hidden if count = 0, visible if count > 0

### Cart Modal (Line 557)

**Opens**: `jarvisManager.loadAction('SHOW_CART_CHECKOUT', cartData)`

**Data Passed**:
```javascript
{
  items: cartStore.getItems(),
  total: cartStore.getTotal(),
  formattedTotal: cartStore.getFormattedTotal()
}
```

---

## URL Hash Routing (Line 323)

### handleUrlHash()

**Purpose**: Deep linking to specific modules

**Example**: `https://example.com/chat#SHOW_DELETE_DATA`

**Flow**:
1. Extract hash: `window.location.hash.substring(1)`
2. Map to action: `SHOW_DELETE_DATA` → jarvisManager.loadAction()
3. Wait 500ms for UI to settle
4. Open module

**Use Case**: Privacy policy "Delete My Data" link

**Future**: Add more hash mappings for different modules

---

## Design Patterns

### 1. Singleton Pattern
- Single PortalController instance
- Single 3D render loop
- Single session per page load

### 2. Observer Pattern
- State changes trigger re-renders
- Cart changes trigger UI updates
- Event listeners for user input

### 3. Factory Pattern
- `create3dLogoForMessage()` creates logo instances
- `createMessageElement()` creates message DOM nodes

### 4. Module Pattern
- ES6 modules with explicit imports
- Global APIs exposed selectively

### 5. Caching Pattern
- Fingerprint signature cached 2 minutes
- DOM elements cached in UI object
- TTS audio cached in messageAudioCache

---

## Performance Optimizations

### 1. 3D Model Cloning
**Before**: Load model per message (~500ms)
**After**: Clone pre-loaded model (~5ms)
**Impact**: 100x faster logo rendering

### 2. Fingerprint Signature Caching
**Before**: Sign request per chat (~100-200ms)
**After**: Cached signature (~<1ms)
**Impact**: 100-200x faster API requests

### 3. Single Render Loop
**Before**: N independent render loops (N = message count)
**After**: 1 unified render loop
**Impact**: Prevents WebGL context exhaustion on mobile

### 4. Image Preloading
**Method**: `assetPreloader.init(IMAGE_PATHS_TO_PRELOAD)`
**Impact**: Instant image display, no loading flicker

### 5. DOM Caching
**Method**: `cacheDOMElements()` stores references
**Impact**: No repeated `getElementById()` calls

---

## Security Features

### 1. Device Fingerprinting
- Multi-signal device identification
- Rate limiting enforcement
- Bot detection

### 2. Signed Fingerprints
- Replay attack prevention
- Timestamped signatures
- 2-minute expiry

### 3. Session Isolation
- Fresh session per page load
- No cross-session data leakage
- sessionStorage (tab-specific)

### 4. Fail-Open Design
```javascript
if (!response.ok) {
  console.warn('Signature request failed, continuing without signature');
  return { signature: null, timestamp: null };
}
```

**Philosophy**: If security layer fails, app still works (but backend can enforce stricter limits)

---

## Design Strengths

1. **Comprehensive**: Handles all app functionality
2. **Modular**: Clean separation via imports
3. **Performance-Focused**: Multiple optimization strategies
4. **Error-Resilient**: Try-catch blocks, fallbacks
5. **Security-Conscious**: Multi-layer protection
6. **Mobile-Optimized**: WebGL context management
7. **Accessibility**: TTS system, visual feedback
8. **Debug-Friendly**: Extensive console logging
9. **Event-Driven**: Reactive state updates
10. **Scalable**: Easy to add new modules/features

---

## Potential Issues Found

### Issue 1: Hard-Coded Backend URL
**Location**: Line 24
```javascript
const BACKEND_URL = "https://reconciliation-backend-934410532991.us-central1.run.app";
```
- **Problem**: No environment variable or config
- **Impact**: Can't easily switch staging/production
- **Recommendation**: Use config file or environment detection

### Issue 2: Welcome Message HTML Hardcoded
**Location**: Line 808
- **Problem**: 400+ character string in code
- **Impact**: Hard to edit, no i18n support
- **Recommendation**: Move to config/content file

### Issue 3: Global Namespace Pollution
**Location**: Lines 278-283
```javascript
window.jarvisManager = ...
window.smartMessageRenderer = ...
```
- **Problem**: 7 global variables
- **Impact**: Medium - could conflict with other libraries
- **Recommendation**: Namespace under single object: `window.MoonTide = {...}`

### Issue 4: DOM Caching Without Validation
**Location**: Line 397
```javascript
UI.messagesDiv = document.getElementById('messages');
```
- **Problem**: No check if element exists
- **Impact**: Could be null, causes crashes later
- **Recommendation**: Add existence checks

### Issue 5: Magic Numbers
**Examples**:
- Line 218: `renderer.setSize(50, 50)` - Logo size
- Line 224: `camera.position.z = 150` - Camera distance
- Line 90: `2 * 60 * 1000` - Signature cache duration
- Line 337: `500` - Hash routing delay

- **Problem**: Unexplained constants
- **Impact**: Low - functional but not maintainable
- **Recommendation**: Extract to named constants with comments

### Issue 6: Fingerprint Signature Fail-Open
**Location**: Line 100
```javascript
return { signature: null, timestamp: null };
```
- **Problem**: If signature fails, continues without error
- **Impact**: Low - backend can still enforce limits
- **Security Note**: Could be exploited if backend doesn't validate

### Issue 7: Session ID Not Cryptographically Secure
**Location**: Line 115
```javascript
sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```
- **Problem**: `Math.random()` is not cryptographically secure
- **Impact**: Low - session IDs could theoretically be guessed
- **Recommendation**: Use `crypto.randomUUID()` or `crypto.getRandomValues()`

---

## Next Modules to Investigate

Based on portal-controller.js imports and usage:

1. **smart-message-renderer.js** - Booking flow UI (used heavily)
2. **portal-store.js** - Message state management
3. **jarvis-ui-manager.js** - UI module system
4. **conversation-intelligence-store.js** - Booking state
5. **cart-store.js** - E-commerce state
6. **tts-manager.js** - Text-to-speech
7. **soundManager.js** - Sound effects
