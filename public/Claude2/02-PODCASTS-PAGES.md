# Podcasts Pages - Audio Content Hub

**Desktop**: `/podcasts-desk.html` (353 lines)
**Mobile**: `/podcasts-mobile.html` (344 lines)
**Purpose**: Showcase Indigenous podcasts with embedded audio player

---

## Overview

A **static content page** featuring Moon Tide's 3 podcast episodes with custom audio player, plus curated external Indigenous podcast recommendations.

---

## Page Structure

### Common Elements (Both Versions)
1. **Close Button** (✕) → Returns to `/menu`
2. **Page Header** - Title + subtitle
3. **Featured Section** - PodcastPlayer component
4. **Recommended Section** - 4 external podcast cards
5. **CTA Section** - "Contact Us" call-to-action
6. **Footer** - "Douglas Lake & Vancouver, BC"

---

## Dependencies

### JavaScript
- **clean-url.js** - URL rewriting
- **podcasts.js** (module) - PodcastPlayer class
- **Inline scripts** - Player initialization, navigation

### CSS
- **podcast-player.css** - Custom player styling
- **Inline <style>** - Page-specific styles (~230 lines)

### External
- **Font Awesome 5.15.4** - Icons

### Audio Files
- `./sounds/podcasts/Reconciliation_Must_Be_Structural_Justice_Not_Apology.m4a`
- `./sounds/podcasts/Genocide_Is_the_Present_Continuous_Trauma.m4a`
- `./sounds/podcasts/The_True_Cost_of_Indigenous_Survival.m4a`

---

## Podcast Episodes (Season 1)

### Episode 1: "Reconciliation Must Be Structural Justice, Not Apology"
- **Host**: Moon Tide Reconciliation
- **Description**: Why true reconciliation requires fundamental structural changes, not symbolic gestures
- **Audio**: M4A format

### Episode 2: "Genocide Is the Present Continuous Trauma"
- **Description**: Ongoing impacts of genocide on Indigenous communities
- **Audio**: M4A format

### Episode 3: "The True Cost of Indigenous Survival"
- **Description**: Resilience and sacrifices in maintaining cultures and traditions
- **Audio**: M4A format

---

## External Recommendations

### 1. Unreserved (CBC Radio)
- **Host**: Rosanna Deerchild
- **Link**: https://www.cbc.ca/radio/unreserved
- **Icon**: 📻
- **Border**: Red (#E63E54)

### 2. The Current (CBC Radio)
- **Link**: https://www.cbc.ca/radio/thecurrent
- **Icon**: 🎧
- **Border**: Orange (#F4A261)

### 3. APTN News
- **Network**: Aboriginal Peoples Television Network
- **Link**: https://www.aptnnews.ca/
- **Icon**: 📰
- **Border**: Teal (#2A9D8F)

### 4. All My Relations (CBC Podcasts)
- **Link**: https://www.cbc.ca/listen/live-radio/1-63-all-my-relations
- **Icon**: 👥
- **Border**: Purple (#9B59B6)

---

## Desktop vs Mobile Differences

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Close Button** | Top-right: 60x60px, top: 40px, right: 40px | Top-right: 50x50px, top: 15px, right: 15px |
| **Page Title** | 4rem (64px) | 2.5rem (40px) |
| **Header Padding** | 120px 60px 60px | 80px 20px 40px |
| **Podcast Grid** | 2 columns (repeat(2, 1fr)) | 1 column (flex-direction: column) |
| **Card Hover** | :hover effect | :active effect (mobile tap) |
| **Card Padding** | 40px | 25px |
| **CTA Button Hover** | :hover effect | :active effect |
| **Tap Highlight** | None | -webkit-tap-highlight-color: transparent |
| **CTA Link** | href="/desktop" ⚠️ | href="/menu" ✅ |
| **Browser Back** | No special handling | pushState + popstate (lines 336-342) |

---

## Issues Found

### 🔴 Issue 1: Desktop CTA Link Wrong

**Location**: Desktop line 299

**Current**:
```html
<a href="/desktop" class="cta-button">Contact Us</a>
```

**Problem**: Links to `/desktop` which doesn't exist (should be `/chat` or `/menu`)

**Mobile**: Correctly links to `/menu`

**Impact**: Broken navigation on desktop version

**Fix**: Change to `/menu` or `/contact`

---

### 🟡 Issue 2: Inline JavaScript Duplication

**Both Files**: Lines 307-315 (desktop) / 289-300 (mobile)

**Problem**: Navigation code duplicated in inline script when could be in external module

**Better Approach**: Move to podcasts.js

---

### 🟢 Issue 3: Mobile Browser Back Handling

**Mobile Only**: Lines 336-342

```javascript
window.history.pushState({ page: 'podcasts-mobile' }, '', window.location.href);
window.addEventListener('popstate', function(event) {
    window.location.href = '/menu';
});
```

**Purpose**: Intercept browser back button

**Issue**: Desktop doesn't have this - inconsistent behavior

**Recommendation**: Add to desktop for consistency

---

### 🔵 Issue 4: Hard-Coded Audio Paths

**Problem**: No validation that audio files exist

**Enhancement**: Add error handling if audio fails to load

---

## PodcastPlayer Implementation

**File**: `./js/podcasts.js` (imported as module)

**Initialization**:
```javascript
const podcastsData = [ /* 3 episodes */ ];
new PodcastPlayer('podcastPlayerContainer', podcastsData);
```

**Data Structure**:
```javascript
{
  id: 'reconciliation_structural_justice',
  title: 'Episode Title',
  host: 'Moon Tide Reconciliation',
  date: 'Season 1, Episode 1',
  description: 'Description text',
  audioUrl: './sounds/podcasts/filename.m4a'
}
```

**Player Features** (implemented in podcasts.js):
- Play/pause controls
- Progress bar
- Time display
- Volume control
- Episode selection
- Playlist navigation

---

## Visual Design

### Color Scheme
- **Background**: Dark gradient (#0a0a15 → #1a0a2e → #0a0a15)
- **Primary**: Blue (#1E90FF)
- **Secondary**: Teal (#2A9D8F)
- **Accent Colors**: Red, Orange, Teal, Purple (card borders)

### Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, etc.)
- **Title**: Gradient text (blue → teal)
- **Body**: White with various opacity levels

### Effects
- **Backdrop Filter**: blur(20px) on cards
- **Hover/Active**: translateY + box-shadow
- **Border Left**: 4px colored accent per card
- **Close Button**: Rotate 90deg on hover/active

---

## Keyboard Shortcuts

**Both Versions**:
- `ESC` key → Navigate to /menu

**Implementation**: Lines 316-318 (desktop) / 298-300 (mobile)

---

## External Link Behavior

All podcast cards open in new tab:
```javascript
onclick="window.open('https://...', '_blank')"
```

**Security Note**: Should add `rel="noopener noreferrer"` for security

---

## Responsive Breakpoint

**Desktop**: `@media (max-width: 768px)` adjusts grid to single column

**Note**: This breakpoint in desktop.html is redundant since mobile.html handles mobile

---

## Testing Scenarios

- [ ] Desktop: All 3 episodes play correctly
- [ ] Mobile: All 3 episodes play correctly
- [ ] Both: External links open in new tabs
- [ ] Both: Close button returns to /menu
- [ ] Desktop: CTA button navigation (currently broken)
- [ ] Mobile: CTA button goes to /menu
- [ ] Both: ESC key exits
- [ ] Mobile: Browser back button returns to /menu
- [ ] Both: Grid layouts correctly (2 col vs 1 col)
- [ ] Both: Podcast player controls functional
- [ ] Both: Audio files load without errors

---

## Content Strategy

### Educational Focus
All 3 episodes address **serious reconciliation topics**:
1. Structural justice vs performative apologies
2. Ongoing trauma from genocide
3. Cost of cultural survival

**Tone**: Professional, educational, serious

**Contrast**: Versus lighter content like stories or interviews

---

## Future Enhancements

1. **Add more episodes** - Currently only 3
2. **Transcripts** - Accessibility for deaf/hard-of-hearing
3. **Download buttons** - Allow offline listening
4. **Share buttons** - Social media sharing
5. **Playlists** - Multiple seasons or categories
6. **Search/Filter** - When more episodes added
7. **Comments** - Community discussion (if desired)
8. **RSS Feed** - For podcast apps

---

## Performance

**Audio Format**: M4A (AAC codec)
- **Pros**: Good compression, widely supported
- **Cons**: Larger than MP3 for same quality

**Estimated File Sizes**: Unknown (not visible in code)

**Recommendation**: Provide multiple formats (M4A + MP3) for compatibility

---

## Accessibility

**Good**:
- ✅ Semantic HTML (header, section, footer)
- ✅ Alt text on icons (emojis, but could be better)
- ✅ Keyboard navigation (ESC key)

**Missing**:
- ❌ ARIA labels on player controls
- ❌ Transcripts for audio content
- ❌ Skip to content link
- ❌ Focus indicators

---

## Summary

**Purpose**: Showcase Moon Tide's podcast content + recommend external Indigenous podcasts

**Strengths**:
- Clean, focused design
- Custom audio player
- External recommendations (builds trust)
- Responsive layout

**Weaknesses**:
- Desktop CTA link broken
- No audio error handling
- Missing accessibility features
- Browser back inconsistency

**Overall Rating**: ⭐⭐⭐⭐☆ (4/5) - Good content delivery, minor bugs
