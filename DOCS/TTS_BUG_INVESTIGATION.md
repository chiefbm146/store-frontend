# TTS Playback Bug Investigation

## Summary
TTS (Text-to-Speech) works in `demo-desk.html` but fails in `index.html` with identical code calling the same backend.

## Error
```
[TTS] ❌ Playback failed: NotSupportedError: Failed to load because no supported source was found.
Audio error code: 4 (MEDIA_ERR_SRC_NOT_SUPPORTED)
```

## Console Output Comparison

### demo-desk.html (WORKS)
```
[Demo Chat] Sending: HI...
[Demo Chat] Response: Greetings. It's a good day to connect...
[TTS] ✅ Audio unlocked
[TTS] ✅ Playing audio
```

### index.html (BROKEN)
```
[Index Chat] Initialized with TTS & Special Tags
[TTS] ✅ Audio unlocked
[TTS] ❌ Playback failed: NotSupportedError: Failed to load because no supported source was found.
```

The unlock sound (`/sounds/unlock.mp3`) plays fine in both. The TTS audio from the backend fails only in index.html.

## Base64 Audio Data Received
From earlier debug logs in index.html:
```
[TTS] Audio base64 length: 47360
[TTS] Audio base64 preview: //OExAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
[TTS] Using MIME type: audio/mpeg
[TTS] Audio error code: 4
```

Note: The base64 starts with `//OE` (not `//u`), which decodes to `0xFF 0xF3 0x84` - an MP3 frame header. The repeated `AAAA` indicates null bytes (silence/padding).

## Backend Logs (Both pages hit same backend successfully)
```
Successfully generated 42240 bytes of audio.
Successfully generated 35520 bytes of audio.
```

Backend returns audio successfully for both pages.

---

## Files Involved

### Primary Files (Chat Implementation)

| File | Status | Description |
|------|--------|-------------|
| `public/index.html` | BROKEN | Main site chat - TTS fails |
| `public/demo-desk.html` | WORKS | Demo store chat - TTS works |
| `public/ai-chat-desk.html` | WORKS | Dedicated AI chat page |

### TTS-Related JavaScript Modules (NOT used by demo-desk or index)

| File | Description |
|------|-------------|
| `public/js/tts-manager.js` | TTS manager module (uses `audio/mp3`) |
| `public/js/audioStateManager.js` | Audio state persistence |
| `public/js/audioPermissionUI.js` | Audio permission modal |
| `public/js/soundManager.js` | Sound effects manager |

**Note:** `demo-desk.html` and `index.html` do NOT import these modules. They have inline TTS code.

### Backend
- URL: `https://stores-backend-phhl2xgwwa-uc.a.run.app`
- TTS Endpoint: `/tts`
- Returns: `{ "audio": "<base64 string>" }`

---

## Code Comparison

### The TTS code in both files is NOW IDENTICAL:

**Location in demo-desk.html:** Lines 441-474
**Location in index.html:** Lines 1890-1936

```javascript
async function playTTSAudio(base64Audio) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Detect MIME type from base64 header
    let mimeType = 'audio/mpeg';
    if (base64Audio.startsWith('T2d')) {
        mimeType = 'audio/ogg';
    } else if (base64Audio.startsWith('Ukl')) {
        mimeType = 'audio/wav';
    } else if (base64Audio.startsWith('//u') || base64Audio.startsWith('SUQ')) {
        mimeType = 'audio/mpeg';
    }

    ttsAudio.src = `data:${mimeType};base64,${base64Audio}`;
    ttsAudio.volume = 1.0;
    isPlaying = true;
    currentAudio = ttsAudio;

    ttsAudio.onended = () => {
        isPlaying = false;
        updatePlayButtonStates();
    };

    try {
        await ttsAudio.play();
        console.log('[TTS] ✅ Playing audio');
    } catch (err) {
        console.error('[TTS] ❌ Playback failed:', err);
        isPlaying = false;
    }
}
```

### Audio Element (Both files identical)
```html
<audio id="ttsAudio"></audio>
```

### Audio Element Reference (Both files identical)
```javascript
const ttsAudio = document.getElementById('ttsAudio');
```

### Backend URL (Both files identical)
```javascript
const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';
const TTS_ENDPOINT = '/tts';
```

### getTTSAudio Function (Both files identical)
```javascript
async function getTTSAudio(text) {
    const cacheKey = text.substring(0, 100);
    if (audioCache.has(cacheKey)) {
        return audioCache.get(cacheKey);
    }

    try {
        const response = await fetch(`${BACKEND_URL}${TTS_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (response.ok) {
            const data = await response.json();
            const audioData = data.audio || data.audio_base64;
            if (audioData) {
                audioCache.set(cacheKey, audioData);
                return audioData;
            }
        }
    } catch (error) {
        console.error('[TTS] Failed to fetch audio:', error);
    }
    return null;
}
```

---

## What's Different Between The Files

### 1. Script Structure
- **demo-desk.html**: Has `<script type="module">` for config (line 220), then `<script>` for chat (line 302)
- **index.html**: Only has `<script>` for chat (line 1758)

### 2. Page Complexity
- **demo-desk.html**: ~808 lines, simpler page structure
- **index.html**: ~2200+ lines, more complex with additional features

### 3. CSS
Both have `#ttsAudio { display: none; }` which is standard.

### 4. External Scripts
- **demo-desk.html**: `clean-url.js`, `theme-injector.js`, `demo-store.js`
- **index.html**: `clean-url.js`

---

## Debug Logging Added (Current State)

`index.html` now has debug logging in `playTTSAudio`:

```javascript
console.log('[TTS DEBUG] base64Audio type:', typeof base64Audio);
console.log('[TTS DEBUG] base64Audio length:', base64Audio.length);
console.log('[TTS DEBUG] first 100 chars:', base64Audio.substring(0, 100));
console.log('[TTS DEBUG] last 50 chars:', base64Audio.substring(base64Audio.length - 50));
console.log('[TTS DEBUG] Using MIME:', mimeType);
console.log('[TTS DEBUG] dataUrl length:', dataUrl.length);
console.log('[TTS DEBUG] dataUrl first 150:', dataUrl.substring(0, 150));
```

---

## Theories to Investigate

1. **Browser caching** - Clear cache and test both pages fresh
2. **Race condition** - Something in index.html modifying the audio element
3. **CORS/Security** - Different page origins causing issues
4. **Data corruption** - Something modifying the base64 string
5. **Audio element state** - Previous state interfering with playback
6. **Other scripts** - Something else on the page interfering

---

## How to Test

1. Open browser DevTools (F12)
2. Go to Network tab, check "Disable cache"
3. Go to Console tab
4. Load `demo-desk.html`, send a message, click play - should work
5. Load `index.html`, send a message, click play - should fail
6. Compare the console logs, especially the DEBUG lines

---

## Files to Examine

```
public/
├── index.html              <- BROKEN (lines 1758-2200 contain chat code)
├── demo-desk.html          <- WORKS (lines 302-806 contain chat code)
├── ai-chat-desk.html       <- WORKS (reference implementation)
├── js/
│   ├── tts-manager.js      <- Module version (not used by index/demo)
│   ├── audioStateManager.js
│   ├── audioPermissionUI.js
│   └── soundManager.js
├── css/
│   └── demo-store.css      <- Contains TTS button styles
└── sounds/
    └── unlock.mp3          <- Unlock sound (works in both)
```

---

## Contact
Bug identified: 2025-11-23
Last commit: f1e4a63 (Debug TTS playback issue in index.html)
