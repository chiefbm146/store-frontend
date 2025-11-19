# URL Cleanup System

**File**: `/public/js/clean-url.js`
**Loaded**: **FIRST** in mobile.html/desktop.html (before all other scripts)
**Purpose**: Replace device-specific URLs with clean, shareable URLs

---

## Overview

An **immediately-invoked function** (IIFE) that detects device-specific URLs and rewrites them to clean versions using `history.replaceState()`. This ensures users can share clean URLs even if they somehow access the device-specific files directly.

---

## Problem This Solves

### Scenario Without clean-url.js

```
User visits /chat
   ↓
deviceRouter serves mobile.html
   ↓
URL stays: /chat ✅

User shares URL with friend
   ↓
Friend sees: /chat ✅
```

### Edge Case This Handles

```
User types /mobile.html directly in browser
   ↓
File loads (Firebase Hosting serves it)
   ↓
URL shows: /mobile.html ❌ (ugly, device-specific)
   ↓
clean-url.js runs
   ↓
URL changed to: /chat ✅ (clean, shareable)
```

**Result**: Even if user accesses wrong URL, it self-corrects

---

## How It Works

### 1. URL Mapping Table

```javascript
const cleanUrls = {
  '/desktop.html': '/chat',
  '/mobile.html': '/chat',
  '/infinite-story-desk.html': '/infinite-story',
  '/infinite-story-mobile.html': '/infinite-story',
  ... // 17 paired pages × 2 versions = 34 mappings
};
```

**Total Mappings**: 34 (all paired pages)

### 2. Execution Flow

```javascript
1. Get current pathname (e.g., /mobile.html)
   ↓
2. Look up in cleanUrls mapping
   ↓
3. If mapping exists + history.replaceState supported:
   ↓
4. Preserve query parameters (?book=xyz)
   ↓
5. Replace URL in address bar (no page reload!)
   ↓
6. Log change to console
```

### 3. URL Replacement

**Method**: `window.history.replaceState(null, '', newUrl)`

**Behavior**:
- Changes address bar URL
- **Does NOT reload page**
- **Does NOT create browser history entry**
- Preserves scroll position
- Preserves page state

**Example**:
```javascript
Before: /mobile.html?book=wksp_123
After:  /chat?book=wksp_123
```

---

## Implementation Details

### IIFE Pattern

```javascript
(function() {
  // Code executes immediately
})();
```

**Why IIFE?**
- Runs immediately on script load
- No global variables
- Self-contained
- No external dependencies

### Query Parameter Preservation

```javascript
const queryString = window.location.search;
const newUrl = cleanUrl + queryString;
```

**Preserves**:
- `?book=wksp_123` (auto-booking)
- `?utm_source=...` (analytics)
- Any other query parameters

**Use Case**: User clicks "Book Now" on workshop page → `/chat?book=wksp_123`
- If somehow /mobile.html loads, clean-url.js fixes to `/chat?book=wksp_123`

### Browser Compatibility Check

```javascript
if (cleanUrl && window.history && window.history.replaceState) {
  // Only run if:
  // 1. URL needs cleaning
  // 2. History API supported
}
```

**Fallback**: If browser doesn't support History API (old browsers), URL stays as-is
- Still functional, just ugly URL

---

## Logging

```javascript
console.log(`[Clean URL] Changed ${currentPath}${queryString} → ${newUrl}`);
```

**Example Output**:
```
[Clean URL] Changed /mobile.html?book=wksp_123 → /chat?book=wksp_123
```

**Use Case**: Debugging, confirming script ran

---

## All Mapped URLs

| Device-Specific URL | Clean URL |
|---------------------|-----------|
| /desktop.html | /chat |
| /mobile.html | /chat |
| /infinite-story-desk.html | /infinite-story |
| /infinite-story-mobile.html | /infinite-story |
| /podcasts-desk.html | /podcasts |
| /podcasts-mobile.html | /podcasts |
| /world-desk.html | /world |
| /world-mobile.html | /world |
| /downloads-desk.html | /downloads |
| /downloads-mobile.html | /downloads |
| /custom-creations-desk.html | /custom-creations |
| /custom-creations-mobile.html | /custom-creations |
| /workshop-detail-desk.html | /workshop-detail |
| /workshop-detail-mobile.html | /workshop-detail |
| /reconciliation-desk.html | /reconciliation |
| /reconciliation-mobile.html | /reconciliation |
| /developer-desk.html | /developer |
| /developer-mobile.html | /developer |
| /account-desk.html | /Account |
| /account-mobile.html | /Account |
| /menu-desk.html | /menu |
| /menu-mobile.html | /menu |
| /shona-desk.html | /shona |
| /shona-mobile.html | /shona |
| /moon-tide-desk.html | /moon-tide |
| /moon-tide-mobile.html | /moon-tide |
| /contact-desk.html | /contact |
| /contact-mobile.html | /contact |
| /delete-data-desk.html | /delete-data |
| /delete-data-mobile.html | /delete-data |
| /workshop-list-desk.html | /workshop-list |
| /workshop-list-mobile.html | /workshop-list |
| /workshops-desk.html | /workshops |
| /workshops-mobile.html | /workshops |

**Note**: Must match PAIRED_PAGES array in functions/index.js

---

## Integration with Firebase Routing

### Complete URL Flow

```
User visits /chat
   ↓
Firebase Hosting rewrite → deviceRouter Cloud Function
   ↓
deviceRouter detects device → serves mobile.html
   ↓
mobile.html loads
   ↓
clean-url.js runs (line 5 in mobile.html)
   ↓
Checks if URL is /mobile.html
   ↓
Replaces with /chat
   ↓
Result: Address bar shows /chat, not /mobile.html
```

**Why Needed?**
- Firebase deviceRouter serves correct file
- But user might bookmark or directly access /mobile.html
- clean-url.js fixes it client-side

---

## Edge Cases Handled

### 1. Direct File Access
```
User types: https://example.com/mobile.html
Browser loads: mobile.html file
clean-url.js: Changes URL to /chat
Result: Works correctly ✅
```

### 2. With Query Parameters
```
URL: /mobile.html?book=wksp_123
clean-url.js: Preserves ?book=wksp_123
New URL: /chat?book=wksp_123
Result: Auto-booking still works ✅
```

### 3. With Hash Fragments
```
URL: /mobile.html#section
clean-url.js: Only changes pathname
New URL: /chat#section
Result: Hash preserved ✅
```

**Note**: Code only uses `window.location.search` (query), not hash
- Hash is preserved automatically by replaceState

### 4. Old Browser
```
Browser: IE 9 (no History API)
clean-url.js: if check fails
Result: URL stays /mobile.html, but app still works
```

---

## Design Strengths

1. **Minimal Code**: 57 lines, single responsibility
2. **No Dependencies**: Pure JavaScript, no libraries
3. **Runs First**: Loaded before all other scripts
4. **Non-Breaking**: If it fails, app still works
5. **SEO-Friendly**: Clean URLs for sharing
6. **Query Preservation**: Doesn't break deep links
7. **No Page Reload**: Smooth UX, instant change
8. **Logging**: Easy to debug
9. **Browser Compatibility**: Graceful degradation
10. **Comprehensive**: Covers all 17 paired pages

---

## Potential Issues Found

### Issue 1: Doesn't Update OG Meta Tags
- **Problem**: URL changes but OG tags still say `/mobile.html`
- **Impact**: Medium - social media previews show wrong URL
- **Example**: Facebook scrapes `/mobile.html` from meta tag
- **Recommendation**: Update meta tags after URL change

### Issue 2: No Hash Fragment Handling
**Location**: Line 51
```javascript
const queryString = window.location.search; // Only query params
```
- **Problem**: Hash fragments not explicitly preserved
- **Impact**: Low - replaceState preserves hash automatically
- **Recommendation**: Document this behavior or explicitly handle

### Issue 3: Hard-Coded Mapping Table
- **Problem**: Must manually update if new pages added
- **Impact**: Low - happens rarely
- **Recommendation**: Generate from PAIRED_PAGES array

### Issue 4: No Error Handling
- **Problem**: If `replaceState()` throws error, no fallback
- **Impact**: Very Low - API is stable
- **Recommendation**: Add try-catch for robustness

### Issue 5: Runs on Every Page Load
- **Problem**: Even if URL already clean, script runs
- **Impact**: Very Low - ~0.1ms overhead
- **Optimization**: Early return if URL already clean

---

## Why It Loads First

**Location in mobile.html**: Line 5 (immediately after charset meta tag)

**Reasons**:
1. **Visual Consistency**: Address bar updates before user notices
2. **Analytics**: Correct URL logged by subsequent tracking scripts
3. **No Dependencies**: Doesn't need DOM, other scripts, etc.
4. **Blocking OK**: Script is tiny, executes in <1ms
5. **SEO**: Ensures canonical URL is set before anything else

---

## Relationship to Other Systems

### Works With:
- **Firebase deviceRouter** - Complements server-side routing
- **Firebase Hosting** - Fixes direct file access
- **Auto-Booking** - Preserves ?book= parameter
- **Analytics** - Ensures correct URL tracking

### Doesn't Interfere With:
- DOM manipulation (no DOM access)
- Event listeners (runs before DOM ready)
- Other scripts (no global variables)

---

## Testing Scenarios

### Manual Test Cases

1. **Visit /mobile.html directly**:
   - Expected: URL changes to /chat
   - Verify: Check address bar

2. **Visit /mobile.html?book=wksp_123**:
   - Expected: URL changes to /chat?book=wksp_123
   - Verify: Auto-booking still triggers

3. **Visit /chat**:
   - Expected: URL stays /chat (no change)
   - Verify: Console has no "[Clean URL]" message

4. **Visit /podcasts-mobile.html**:
   - Expected: URL changes to /podcasts
   - Verify: Address bar updates

---

## Questions for Further Investigation

1. Should meta tags be updated after URL change?
2. Is there a version-update.js that generates this mapping?
3. How often are new paired pages added?
4. Are there analytics events tracking URL changes?
