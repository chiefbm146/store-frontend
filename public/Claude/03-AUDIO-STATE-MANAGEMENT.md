# Audio State Management System

**File**: `/public/js/audioStateManager.js`
**Type**: ES6 Module (default export)
**Global**: Available as `window.audioStateManager`

---

## Overview

Industry-standard centralized audio state manager that handles browser audio permissions, user preferences, and persistence across sessions. Uses an event-driven architecture for state synchronization.

---

## Responsibilities

1. **Centralized State**: Single source of truth for all audio settings
2. **Persistence**: localStorage + sessionStorage for state preservation
3. **Permission Tracking**: Browser audio permission flow management
4. **Audio Unlock Status**: Tracks whether browser allows playback
5. **URL State Integration**: Supports `#audio=enabled/disabled` hash params
6. **Event System**: State change notifications for reactive updates
7. **Error Recovery**: Failure counting and recovery mechanisms

---

## State Schema

```javascript
state: {
  // User preference: explicitly enabled/disabled audio?
  isAudioEnabled: Boolean,          // Default: false

  // Browser permission status
  permissionStatus: String,         // 'unknown' | 'requested' | 'granted' | 'denied'

  // Can browser actually play audio?
  isAudioUnlocked: Boolean,         // Default: false

  // Has user ever interacted with audio system?
  hasUserInteracted: Boolean,       // Default: false

  // Current playing sound (prevents overlaps)
  currentlyPlayingSound: String | null,

  // Error recovery tracking
  failureCount: Number,             // Default: 0
  lastFailureTime: Number | null
}
```

---

## Persistence Strategy

### localStorage (Persistent)
Stores across browser sessions:
- `isAudioEnabled` - User's audio preference
- `permissionStatus` - Permission state
- `hasUserInteracted` - Whether user has engaged with audio

### Not Persisted (Session Only)
- `isAudioUnlocked` - Must be re-established each session
- `currentlyPlayingSound` - Runtime state
- `failureCount` - Reset on unlock

**Why?** Browser audio contexts reset on page reload, so unlock status cannot be trusted across sessions.

---

## Event System

### Available Events

| Event | When Fired | Data Payload |
|-------|-----------|--------------|
| `stateChange` | Audio enabled/disabled | `{ enabled: Boolean, reason: String }` |
| `audioUnlocked` | Playback succeeded | None |
| `audioLocked` | Playback blocked by browser | None |
| `permissionRequested` | Permission flow started | None |
| `permissionGranted` | User/browser granted permission | None |
| `permissionDenied` | User/browser denied permission | None |

### Usage Example
```javascript
audioStateManager.on('stateChange', ({ enabled, reason }) => {
  console.log(`Audio ${enabled ? 'enabled' : 'disabled'} - ${reason}`);
});
```

---

## Public API

### Initialization
```javascript
audioStateManager.init();
// Makes itself available at window.audioStateManager
```

**Called in**: `index.html:71` on page load

### State Setters

#### `setAudioEnabled(enabled, reason)`
```javascript
audioStateManager.setAudioEnabled(true, 'user-interaction');
```
- Updates `isAudioEnabled` state
- Marks `hasUserInteracted = true`
- Saves to localStorage
- Emits `stateChange` event
- **Idempotent**: Does nothing if state unchanged

#### `unlockAudio()`
```javascript
audioStateManager.unlockAudio();
```
- Marks audio as unlocked (playback succeeded)
- Sets `permissionStatus = 'granted'`
- Resets `failureCount = 0`
- Emits `audioUnlocked` + `permissionGranted`

#### `lockAudio()`
```javascript
audioStateManager.lockAudio();
```
- Marks audio as locked (browser blocked playback)
- Sets `permissionStatus = 'denied'`
- Increments `failureCount`
- Records `lastFailureTime`
- Emits `audioLocked` + `permissionDenied`

### Permission Flow

#### `requestAudioPermission()` (async)
```javascript
const granted = await audioStateManager.requestAudioPermission();
```
- Returns `true` if already unlocked
- Returns `false` if permission already requested
- Sets `permissionStatus = 'requested'`
- Emits `permissionRequested`
- **Returns Promise** resolved when user interacts with unlock UI

**Implementation Detail**: Stores resolver at `window.__audioPermissionResolver` for external resolution.

#### `grantAudioPermission()`
```javascript
audioStateManager.grantAudioPermission();
```
- Called when user explicitly grants permission
- Sets all states to enabled/granted/unlocked
- Saves to localStorage
- Emits multiple events: `permissionGranted`, `audioUnlocked`, `stateChange`

#### `denyAudioPermission()`
```javascript
audioStateManager.denyAudioPermission();
```
- Called when user explicitly denies permission
- Disables audio completely
- Sets `permissionStatus = 'denied'`
- Saves to localStorage

### State Getters

#### `getStatus()`
```javascript
const status = audioStateManager.getStatus();
// Returns full state snapshot
```

---

## Initialization Flow (index.html)

```
1. audioStateManager imported (line 69)
   ↓
2. audioStateManager.init() called (line 71)
   ↓
3. Sets window.audioStateManager = this
   ↓
4. Loads persisted state from localStorage
   ↓
5. Restores: isAudioEnabled, permissionStatus, hasUserInteracted
   ↓
6. Logs initialization complete
```

---

## Error Handling

### localStorage Failures
- **Try-catch** around `localStorage.getItem()` and `setItem()`
- **Fallback**: Continues with default state if parse fails
- **Warning logged**: Visible in console for debugging

### Event Listener Errors
- **Try-catch** around each event callback
- **Error logged**: Prevents one listener from breaking others
- **Graceful degradation**: Other listeners continue to execute

### Failure Tracking
- **Counter**: `failureCount` increments on each `lockAudio()` call
- **Timestamp**: `lastFailureTime` records when failure occurred
- **Reset**: Counter cleared on successful `unlockAudio()`

**Use Case**: Could implement exponential backoff or give up after N failures

---

## Design Patterns

### 1. Singleton Pattern
- Single instance (`audioStateManager` object)
- Global access via `window.audioStateManager`

### 2. Observer Pattern
- Event emitter with `on()` and `emit()` methods
- Multiple listeners can subscribe to state changes

### 3. Immutable State Updates
- State never mutated directly
- Updates go through setter methods
- Events dispatched after each change

### 4. Separation of Concerns
- State management separate from audio playback
- Doesn't play audio itself, just tracks state
- Other modules (intro-loader.js) handle actual audio

---

## Design Strengths

1. **Predictable State**: Single source of truth prevents conflicts
2. **Persistent Preferences**: User settings survive page reloads
3. **Event-Driven**: Reactive updates without polling
4. **Error Recovery**: Graceful handling of localStorage/browser failures
5. **Debug-Friendly**: Clear console logging with emoji indicators
6. **Browser Compatibility**: Handles audio permission variations across browsers
7. **Production-Ready**: Comprehensive error handling and fallbacks

---

## Potential Issues Found

### Issue 1: Global Promise Resolver
**Location**: Line 172
```javascript
window.__audioPermissionResolver = resolve;
```
- **Problem**: Stores Promise resolver in global scope
- **Risk**: Could be overwritten or called multiple times
- **Impact**: Medium - breaks permission flow if mishandled
- **Better Approach**: Store in module-level variable or use event system

### Issue 2: Debug Flag Unused
**Location**: Line 21
```javascript
config: { debug: false }
```
- **Problem**: Config exists but never checked in code
- **Impact**: Low - just dead code
- **Recommendation**: Remove or implement debug logging

### Issue 3: currentlyPlayingSound Never Set
**Location**: Line 39
```javascript
currentlyPlayingSound: null
```
- **Problem**: Property defined but never updated anywhere
- **Impact**: Low - unused feature or incomplete implementation
- **Recommendation**: Implement or remove

### Issue 4: No sessionStorage Usage
**Location**: Comment line 5 mentions sessionStorage
```javascript
// 1. Centralized audio state persistence (localStorage + sessionStorage)
```
- **Problem**: sessionStorage never actually used
- **Impact**: Low - just misleading documentation
- **Recommendation**: Update comment or implement sessionStorage

---

## Integration Points

**Used By**:
1. `index.html` - Initializes on page load
2. `intro-loader.js` - Likely uses for intro sound playback (TBD)
3. Unknown modules - Need to search for `audioStateManager` usage

**Next Investigation**:
- How does intro-loader.js use this?
- Are there audio files for intro sounds?
- What other modules interact with audio state?
