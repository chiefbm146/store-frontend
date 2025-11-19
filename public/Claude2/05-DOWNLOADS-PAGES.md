# 05. Downloads Pages - Resource Library Investigation

**Files Analyzed**:
- `downloads-desk.html` (390 lines)
- `downloads-mobile.html` (379 lines)

**Status**: ✅ Complete
**Investigated**: November 19, 2025
**Rating**: ⭐⭐⭐⭐☆ (4/5) - **Resource Hub with "Coming Soon" Placeholder**

---

## Executive Summary

The Downloads pages serve as a **resource hub** linking to 6 external educational resources about Indigenous reconciliation. The pages prominently feature a "Coming Soon" section indicating Moon Tide's own downloadable materials are in development. This is a **content curation page** rather than a true download center. Same broken desktop CTA bug found on podcasts and reconciliation pages.

**Critical Finding**: Desktop version has **broken CTA link** (`href="/desktop"` instead of `/menu`) - **third occurrence of this bug**.

---

## Page Structure Overview

### Content Sections

1. **Hero**: Downloads title with subtitle
2. **External Resources**: 6 resource cards (2×3 grid desktop, vertical mobile)
3. **Coming Soon**: Dashed box indicating Moon Tide materials in development
4. **CTA**: Contact prompt for custom resources
5. **Footer**: Location info

### Desktop Layout (390 lines)

```
┌─────────────────────────────────────────┐
│                            ✕ (Close)    │
│         📥 Downloads                    │
│      [Subtitle]                         │
├─────────────────────────────────────────┤
│    EXTERNAL RESOURCES                   │
│    Recommended Materials                │
│    ┌─────────┐ ┌─────────┐            │
│    │📜 TRC   │ │👨‍🏫 Teacher│            │
│    └─────────┘ └─────────┘            │
│    ┌─────────┐ ┌─────────┐            │
│    │📖 Ped.  │ │🗺️ Map   │            │
│    └─────────┘ └─────────┘            │
│    ┌─────────┐ ┌─────────┐            │
│    │🎓 NCTR  │ │🤝 Comp. │            │
│    └─────────┘ └─────────┘            │
├─────────────────────────────────────────┤
│    MOON TIDE RESOURCES                  │
│    Our Educational Materials            │
│    ┌───────────────────────┐           │
│    │   📚 Coming Soon      │           │
│    │   (dashed border)     │           │
│    └───────────────────────┘           │
├─────────────────────────────────────────┤
│    Need Custom Resources?               │
│    [Contact Us Button] ❌ BROKEN        │
└─────────────────────────────────────────┘
```

### Mobile Layout (379 lines)

Same sections, vertical stacking. CTA correctly links to `/menu` ✅

---

## External Resources Breakdown

### The 6 Resources

| # | Title | Type | URL | Icon |
|---|-------|------|-----|------|
| 1 | TRC Reports | PDF Documents | rcaanc-cirnac.gc.ca | 📜 |
| 2 | Teacher Resources | Lesson Plans | ictinc.ca/resources | 👨‍🏫 |
| 3 | First Nations Pedagogy | Educational Materials | firstnationspedagogy.ca | 📖 |
| 4 | Native Land Map | Interactive Tool | native-land.ca | 🗺️ |
| 5 | NCTR Education Resources | Archives & Materials | nctr.ca/education | 🎓 |
| 6 | Cultural Competency Guides | Professional Development | lss.bc.ca | 🤝 |

**All links**: `window.open(url, '_blank')` via onclick handlers

---

## Desktop vs Mobile Differences

### Grid vs Flexbox

**Desktop** (Lines 116-122):
```css
.resource-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
}
```

**Mobile** (Lines 116-120):
```css
.resource-grid {
    display: flex;
    flex-direction: column;
    gap: 30px;
}
```

### Interaction Patterns

**Desktop** (Lines 134-137):
```css
.resource-card:hover {
    transform: translateX(10px);
    box-shadow: 0 8px 30px rgba(30, 144, 255, 0.15);
}
```

**Mobile** (Lines 132-135):
```css
.resource-card:active {
    transform: translateX(5px);
    box-shadow: 0 4px 20px rgba(30, 144, 255, 0.15);
}
```

### Browser Back Button

**Mobile Only** (Lines 371-376):
```javascript
window.history.pushState({ page: 'downloads-mobile' }, '', window.location.href);

window.addEventListener('popstate', function(event) {
    window.location.href = '/menu';
});
```

**Desktop**: No back button handling

---

## Issues & Concerns

### 🔴 Critical Issues

**1. Broken CTA Link on Desktop** (Line 372)
```html
<a href="/desktop" class="cta-button">Contact Us</a>
```
- **Expected**: `href="/menu"` or `href="/contact"`
- **Actual**: `href="/desktop"` (non-existent route)
- **Severity**: **CRITICAL**
- **Pattern**: **Third page with this exact bug** (podcasts, reconciliation, downloads)
- **Mobile** (Line 354): ✅ Correct (`href="/menu"`)

### ⚠️ High Priority Issues

**2. window.open() Without Security Attributes**
```javascript
onclick="window.open('https://...', '_blank')"
```
- **Missing**: `rel="noopener noreferrer"`
- **Locations**: All 6 resource cards (desktop: 303, 311, 319, 327, 335, 343; mobile: 285, 293, 301, 309, 317, 325)
- **Risk**: Opened window can access `window.opener`

**3. Misleading Page Title**
- **Title**: "Downloads"
- **Reality**: No actual downloads, only external links + "coming soon"
- **User Expectation**: Downloadable PDFs, worksheets, guides
- **Actual Content**: Links to external sites
- **Better**: "Resources" or "Educational Links"

**4. No Open Graph Tags (Desktop)**
- Desktop missing OG tags
- Mobile also missing OG tags (unlike reconciliation-mobile)
- Poor social sharing on both versions

**5. Zoom Disabled (Mobile)** (Line 6)
```html
maximum-scale=1.0, user-scalable=no
```
- **WCAG Violation**: SC 1.4.4
- **Fix**: Remove zoom restriction

### 🟡 Medium Priority Issues

**6. "Coming Soon" Takes Prominent Position**
- External resources buried above "coming soon" section
- Desktop: Coming Soon at bottom (Lines 354-366)
- Mobile: Coming Soon at bottom (Lines 336-348)
- **UX**: Users might miss actual resources thinking everything is "coming soon"

**7. No Accessibility on Resource Cards**
```html
<div class="resource-card" onclick="...">
```
- **Missing**: `role="link"`, `tabindex="0"`, keyboard handlers
- **Impact**: Not keyboard accessible, screen readers won't identify as links

**8. Inline onclick Handlers**
- CSP violation risk
- Better: Use anchor tags with proper attributes

**9. No Error Handling**
```javascript
function navigateBack() {
    window.location.href = '/menu'; // No validation
}
```

**10. Resource Type Tags Inconsistent**
```html
<span class="resource-type">PDF Documents</span>
<span class="resource-type">Lesson Plans</span>
<span class="resource-type">Interactive Tool</span>
```
- **Issue**: Only 1 is actually downloadable (TRC Reports PDFs)
- **Others**: Websites, not downloads
- **Misleading**: "Lesson Plans" tag suggests downloadable files

---

## Design Patterns

### ✅ Excellent Decisions

1. **Resource Type Badges**
   ```css
   .resource-type {
       padding: 4px 12px;
       background: rgba(30, 144, 255, 0.12);
       color: #1E90FF;
       border-radius: 12px;
       font-size: 0.8rem;
   }
   ```
   - Clear categorization
   - Helps users understand content type

2. **Color-Coded Borders**
   - Same pattern as reconciliation page
   - 6 cards cycle through 4 colors (red, orange, teal, purple, red, orange)

3. **Coming Soon Visual Treatment**
   ```css
   .coming-box {
       border: 2px dashed #1E90FF;
       border-radius: 12px;
       opacity: 0.6;
   }
   ```
   - Dashed border clearly signals "not ready yet"
   - Appropriate opacity conveys placeholder status

4. **Emoji Icons**
   - Each resource has relevant emoji
   - No image downloads needed
   - Instant visual recognition

5. **Lightweight Implementation**
   - Desktop: ~8KB
   - Mobile: ~7.5KB
   - Fast load times

---

## Content Analysis

### Resource Quality

| Resource | Authority | Relevance | Accessibility |
|----------|-----------|-----------|---------------|
| TRC Reports (.gc.ca) | ⭐⭐⭐⭐⭐ Government | ⭐⭐⭐⭐⭐ Core | ⭐⭐⭐⭐☆ Good |
| Teacher Resources (ictinc.ca) | ⭐⭐⭐⭐☆ Non-profit | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐⭐☆ Good |
| First Nations Pedagogy | ⭐⭐⭐⭐☆ Educational | ⭐⭐⭐⭐☆ High | ⭐⭐⭐☆☆ Medium |
| Native Land Map | ⭐⭐⭐⭐⭐ Trusted | ⭐⭐⭐⭐⭐ Essential | ⭐⭐⭐⭐⭐ Excellent |
| NCTR Education | ⭐⭐⭐⭐⭐ National Center | ⭐⭐⭐⭐⭐ Core | ⭐⭐⭐⭐☆ Good |
| Cultural Competency (lss.bc.ca) | ⭐⭐⭐⭐☆ Legal Society | ⭐⭐⭐⭐☆ Professional | ⭐⭐⭐⭐☆ Good |

**Overall**: High-quality, authoritative resources. Good mix of government, non-profit, and educational sources.

### Missing Resources (Potential Additions)

1. **4 Season of Reconciliation** (educational framework)
2. **Indigenous Foundations UBC** (comprehensive resource)
3. **Whose Land App** (mobile territory acknowledgment)
4. **Chelsea's Voice** (residential school survivor story)
5. **Walking Together TRC Education Guide** (K-12 curriculum)

---

## Comparison to Previous Pages

### CTA Bug Pattern

| Page | Desktop CTA | Mobile CTA | Status |
|------|-------------|------------|--------|
| Infinite Story | `/menu` ✅ | `/menu` ✅ | Good |
| Podcasts | `/desktop` ❌ | `/menu` ✅ | **BUG** |
| Menu | N/A (navigation hub) | N/A | N/A |
| Reconciliation | `/desktop` ❌ | `/menu` ✅ | **BUG** |
| Downloads | `/desktop` ❌ | `/menu` ✅ | **BUG** |

**Pattern**: Systematic bug on desktop versions only. Mobile versions are consistently correct.

**Root Cause Hypothesis**: Copy-paste error when creating desktop versions. Developer likely:
1. Created mobile version first (correct)
2. Copied to desktop version
3. Changed some things but forgot to update CTA link

---

## Browser Compatibility

All features used are standard:
- CSS Grid: ✅ Chrome 57+, Safari 10.1+, Firefox 52+
- Flexbox: ✅ Universal support
- Gradient text: ✅ Chrome 120+, Safari 14+
- `pushState`/`popstate`: ✅ Universal support

---

## Performance

**Desktop**:
- HTML: ~8KB
- clean-url.js: ~2KB
- **Total**: ~10KB
- **First Paint**: ~100ms

**Mobile**:
- HTML: ~7.5KB
- clean-url.js: ~2KB
- **Total**: ~9.5KB
- **First Paint**: ~100ms

**Lighthouse Estimate**:
- Performance: 95-100
- Accessibility: 75-80 (missing ARIA, zoom disabled)
- Best Practices: 85-90 (inline onclick, missing rel attributes)
- SEO: 85-90 (no meta description)

---

## Security Analysis

Same issues as reconciliation page:

1. **window.opener Vulnerability**: 6 instances
2. **No CSP Compliance**: Inline onclick handlers
3. **No Route Validation**: navigateBack() trusts '/menu' exists
4. **XSS**: None (static content)

**Recommendations**:
1. Convert to anchor tags with `rel="noopener noreferrer"`
2. Add CSP headers
3. Validate navigation targets

---

## Accessibility Analysis

**Issues**:
1. Resource cards not keyboard accessible (no tabindex, no keypress handlers)
2. Missing ARIA labels
3. Zoom disabled on mobile
4. No skip navigation link
5. Color-only differentiation (border colors)

**Fixes**:
```html
<a href="https://www.rcaanc-cirnac.gc.ca/..."
   target="_blank"
   rel="noopener noreferrer"
   class="resource-card"
   aria-label="Visit TRC Reports - opens in new tab">
    <!-- Content -->
</a>
```

---

## Code Quality Rating

### Desktop: ⭐⭐⭐☆☆ (3/5)

**Strengths**:
- Clean design
- Good resource curation
- Fast load time

**Critical Weakness**:
- **Broken CTA link**
- Misleading title ("Downloads" but no downloads)
- Missing accessibility

### Mobile: ⭐⭐⭐⭐☆ (4/5)

**Strengths**:
- Correct CTA link
- Browser back handling
- Touch-optimized

**Weaknesses**:
- Zoom disabled
- Missing ARIA attributes
- Misleading title

### Overall: ⭐⭐⭐⭐☆ (4/5)

**Justification**: Good resource curation with clean design. The "Downloads" title is misleading since there are no actual downloads (yet). The desktop CTA bug is critical but easily fixed. Mobile version is better implemented than desktop.

---

## Summary Statistics

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Lines of Code | 390 | 379 |
| CSS Lines | ~270 | ~250 |
| JavaScript Lines | ~8 | ~15 |
| External Resources | 6 | 6 |
| Sections | 5 | 5 |
| Critical Bugs | 1 (broken CTA) | 0 |
| Issues Found | 10 | 10 |

---

## Final Verdict

The Downloads pages are **well-designed resource hubs** that effectively curate external educational materials. However:

**Major Issues**:
1. **Broken desktop CTA** (third occurrence - systemic problem)
2. **Misleading title** - no actual downloads available
3. **"Coming Soon" prominence** - might confuse users

**Recommendations**:
1. **Immediate**: Fix desktop CTA link (line 372)
2. **Short-term**: Rename to "Resources" or add disclaimer
3. **Medium-term**: Actually create downloadable Moon Tide materials
4. **Long-term**: Add accessibility features

This page effectively **bridges the gap** until Moon Tide creates their own materials, but the title creates false expectations.

---

**Investigation Complete**: downloads-desk.html + downloads-mobile.html
**Next Pair**: contact-desk.html + contact-mobile.html (Contact form)
**Progress**: 5/17 pairs documented (29.4%)

**Last Updated**: November 19, 2025
**Words**: ~3,000
