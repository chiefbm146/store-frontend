# Firebase Cloud Functions - Device Router

**File**: `/functions/index.js`
**Purpose**: Device detection and internal HTML serving without URL changes
**Architecture**: Internal Rewrite (NO redirect, clean URLs)

---

## Overview

A **bulletproof device detection system** that serves mobile or desktop HTML based on User-Agent analysis. Uses Firebase Cloud Functions to perform **internal rewrites** instead of redirects, maintaining clean URLs for SEO and social media sharing.

---

## Key Architecture Decision: Internal Rewrite vs Redirect

### Traditional Approach (Redirect)
```
/chat → Detect device → 302 Redirect → /mobile.html or /desktop.html
Problem: URL changes, cache issues, poor UX
```

### This App's Approach (Internal Rewrite)
```
/chat → Detect device → Serve mobile.html or desktop.html → URL stays /chat
Benefit: Clean URLs, no caching issues, works with crawlers
```

**Files Served From**: `/functions/templates/` directory

---

## Paired Pages (Device-Specific Versions)

The following pages have both mobile and desktop versions:

| Page Path | Mobile File | Desktop File | Notes |
|-----------|-------------|--------------|-------|
| `/chat` | mobile.html | desktop.html | **Special case** - not chat-mobile.html |
| `/infinite-story` | infinite-story-mobile.html | infinite-story-desk.html | |
| `/podcasts` | podcasts-mobile.html | podcasts-desk.html | |
| `/world` | world-mobile.html | world-desk.html | |
| `/downloads` | downloads-mobile.html | downloads-desk.html | |
| `/custom-creations` | custom-creations-mobile.html | custom-creations-desk.html | |
| `/workshop-detail` | workshop-detail-mobile.html | workshop-detail-desk.html | |
| `/reconciliation` | reconciliation-mobile.html | reconciliation-desk.html | |
| `/developer` | developer-mobile.html | developer-desk.html | |
| `/Account` | account-mobile.html | account-desk.html | **Special case** - lowercase file |
| `/menu` | menu-mobile.html | menu-desk.html | |
| `/shona` | shona-mobile.html | shona-desk.html | |
| `/moon-tide` | moon-tide-mobile.html | moon-tide-desk.html | |
| `/contact` | contact-mobile.html | contact-desk.html | |
| `/delete-data` | delete-data-mobile.html | delete-data-desk.html | |
| `/workshop-list` | workshop-list-mobile.html | workshop-list-desk.html | |
| `/workshops` | workshops-mobile.html | workshops-desk.html | |

**Total**: 17 paired pages (34 HTML files)

---

## Device Detection Algorithm

### Three-Phase Detection Strategy

```
PHASE 0: In-App Browser Detection (HIGHEST PRIORITY)
   ↓
PHASE 1: Desktop Detection
   ↓
PHASE 2: Mobile/Tablet Detection
   ↓
PHASE 3: Default (Desktop)
```

### Phase 0: In-App Browser Detection

**Purpose**: Social media in-app browsers (Facebook, Instagram, TikTok) report desktop OS but run on mobile devices.

**Patterns Detected**:
```javascript
{
  facebook: /FBAN|FBAV|FB_IAB/i,
  instagram: /Instagram/i,
  tiktok: /TikTok/i,
  messenger: /Messenger/i
}
```

**Additional Facebook Patterns**:
- FBLC, FBDV, FBUG, FBCR, FBDM

**Result**: **Always returns MOBILE** (overrides all other detection)

**Example User-Agents**:
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) [FBAN/Messenger;...]
→ Detected as MOBILE ✅

Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) Instagram 200.0
→ Detected as MOBILE ✅
```

### Phase 1: Desktop Detection

**If ANY pattern matches** → Returns DESKTOP immediately

**Patterns**:
```javascript
{
  windows: /Windows NT/i,
  mac: /Mac OS X(?!.*Mobile)/i,    // Excludes iOS
  linux: /Linux(?!.*Android)/i,    // Excludes Android
  chromeos: /CrOS/i,
  x11: /X11/i
}
```

**Example**:
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0
→ Detected as DESKTOP ✅
```

### Phase 2: Mobile/Tablet Detection

**Checked in order** (special cases first):

1. **iPad** → MOBILE (treated as mobile-like device)
2. **Surface/Lenovo Yoga** → DESKTOP (hybrid tablets)
3. **Android** → Check if has "Mobile" keyword
   - Android + Mobile → MOBILE
   - Android only → DESKTOP (tablets)
4. **Other Mobile OS** → MOBILE
   - iPhone, iPod, webOS, BlackBerry, Windows Phone, IEMobile, Opera Mini, Mobile Safari

### Phase 3: Default Fallback

If no patterns match → Returns **DESKTOP**

---

## Special Cases & Edge Cases

### 1. iPad Detection
```javascript
/iPad/i.test(ua) → true (MOBILE)
```
**Reasoning**: iPads use mobile-optimized interfaces

### 2. Surface/Yoga Tablets
```javascript
/Windows NT.*Touch/i || /Yoga|ThinkPad.*Touch/i → false (DESKTOP)
```
**Reasoning**: Hybrid tablets with keyboards = desktop experience

### 3. Android Tablets
```javascript
/Android/i && !/Android.*Mobile/i → false (DESKTOP)
```
**Reasoning**: Android tablets without "Mobile" keyword = larger screens

### 4. Facebook In-App Browser on Desktop
```javascript
User-Agent: Windows NT + [FBAN] → true (MOBILE)
```
**Reasoning**: User is on mobile Facebook viewing link, even if OS says Windows

---

## Request Flow

### User Visits `/chat`

```
1. Firebase Hosting receives request to /chat
   ↓
2. Hosting rewrites to deviceRouter Cloud Function
   ↓
3. Function reads User-Agent header
   ↓
4. Runs 3-phase detection algorithm
   ↓
5. Determines: MOBILE or DESKTOP
   ↓
6. For /chat specifically:
   - MOBILE → Read /functions/templates/mobile.html
   - DESKTOP → Read /functions/templates/desktop.html
   ↓
7. Serve HTML with Content-Type: text/html
   ↓
8. URL remains /chat (no redirect!)
```

### Headers Set on Response

```http
Content-Type: text/html; charset=utf-8
Cache-Control: no-cache, no-store, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

**Why no caching?**
- Device detection happens server-side
- User might switch devices
- Social media crawlers need fresh content
- Prevents Facebook/Instagram from caching wrong version

---

## Logging for Debugging

Every request logs:
```javascript
[Device Router] Host: reconciliation-storefront.web.app
[Device Router] Path: chat
[Device Router] User-Agent: Mozilla/5.0 ...
[Device Router] Detected as: MOBILE or DESKTOP
[Device Router] Serving file: mobile.html or desktop.html
```

**Access logs**: Firebase Console → Functions → deviceRouter → Logs

---

## Health Check Endpoint

```javascript
exports.healthCheck = functions.https.onRequest(...)
```

**Endpoint**: `/healthCheck` (or wherever deployed)

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T...",
  "pairedPages": ["chat", "infinite-story", ...],
  "architecture": "internal-rewrite"
}
```

**Use Case**: Monitoring, debugging, verifying deployment

---

## Connection to index.html Flow

### Complete User Journey

```
1. User visits https://reconciliation-storefront.web.app/
   ↓
2. Firebase Hosting serves public/index.html
   ↓
3. index.html loads intro-loader.js
   ↓
4. User clicks "Begin Journey"
   ↓
5. 3-second animation plays
   ↓
6. index.html redirects to /chat
   ↓
7. Firebase Hosting rewrites /chat → deviceRouter Cloud Function
   ↓
8. deviceRouter detects device
   ↓
9. Serves functions/templates/mobile.html or desktop.html
   ↓
10. User sees main app (chat interface)
```

---

## Templates Directory Structure

**Expected Structure**:
```
functions/
  ├── index.js (this file)
  └── templates/
      ├── mobile.html (chat mobile)
      ├── desktop.html (chat desktop)
      ├── infinite-story-mobile.html
      ├── infinite-story-desk.html
      ├── podcasts-mobile.html
      ├── podcasts-desk.html
      ... (34 HTML files total)
```

**Critical Note from CLAUDE.md**:
> functions/templates/ and public/ MUST be kept in sync!
> Previous sync issues caused deployed functions to serve outdated HTML

---

## Design Strengths

1. **SEO-Friendly**: Clean URLs, no device suffixes in URL
2. **Social Media Compatible**: Crawlers see correct HTML with OG tags
3. **No Cache Issues**: Forces fresh content on every request
4. **Bulletproof In-App Detection**: Handles Facebook/Instagram/TikTok correctly
5. **Explicit Logging**: Every request logged for debugging
6. **Edge Case Handling**: iPad, Surface, Android tablets handled correctly
7. **Graceful 404s**: Custom error page if template missing
8. **Health Check**: Easy monitoring and verification
9. **Scalable**: Easy to add new paired pages to array
10. **No Client-Side Detection**: No JavaScript required for routing

---

## Potential Issues Found

### Issue 1: Duplicate In-App Browser Detection
**Location**: Lines 55-67 and 72-85
- **Problem**: In-app browser detection code appears **twice**
- **Impact**: Low - just redundant code
- **Recommendation**: Remove one of the duplicate blocks

### Issue 2: Templates Must Be Manually Synced
**Location**: Comment in CLAUDE.md
- **Problem**: No automated sync between public/ and functions/templates/
- **Impact**: HIGH - Can deploy outdated HTML to Cloud Functions
- **Recommendation**: Add build step to sync directories
- **Current Workaround**: Manual `cp public/*.html functions/templates/`

### Issue 3: No Client Hints API Usage
- **Problem**: Relies only on User-Agent (can be spoofed)
- **Impact**: Low - User-Agent still reliable for 99.9% of cases
- **Recommendation**: Add Client Hints API as Phase -1 (before UA)

### Issue 4: No Validation of PAIRED_PAGES
- **Problem**: If file doesn't exist in templates/, returns 404
- **Impact**: Medium - no validation at deploy time
- **Recommendation**: Add test to verify all paired page files exist

### Issue 5: No Rate Limiting
- **Problem**: Cloud Function can be called unlimited times
- **Impact**: Medium - Could rack up costs if abused
- **Recommendation**: Add Firebase App Check or rate limiting

### Issue 6: Hard-Coded Template Path
**Location**: Line 197
```javascript
path.join(__dirname, 'templates', targetFile)
```
- **Problem**: No configuration for template directory
- **Impact**: Low - works fine, just not flexible
- **Recommendation**: Use environment variable

---

## File Sync Investigation Needed

**Next Steps**:
1. Check if functions/templates/ directory exists
2. Verify all 34 HTML files are present
3. Compare file dates between public/ and functions/templates/
4. Identify any files that are out of sync
5. Document any missing files

---

## Questions for Further Investigation

1. How is deviceRouter function deployed in firebase.json?
2. What URL patterns trigger this function?
3. Are there any files in public/ not in functions/templates/?
4. What happens if user manually visits /mobile.html?
5. Is there a Firebase Hosting rewrite rule configuration?
