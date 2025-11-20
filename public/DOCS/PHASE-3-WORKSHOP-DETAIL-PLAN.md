# Phase 3: Config-Driven Workshop Detail Page

## Current State Analysis

**File**: `workshop-detail-desk.html` (650+ lines)
- **CSS**: 400+ lines inline `<style>` with hardcoded colors
- **Content**: Fully hardcoded workshop data
- **Data Source**: Uses `WorkshopLoader` (JavaScript module) to load workshop data
- **Query Param**: `id` parameter to identify which workshop to display

### Structure:
1. **Navigation** - Fixed top bar with back button & breadcrumb
2. **Hero Section** - Badge, title, description, CTA button (grid layout)
3. **Image Gallery** - Workshop image/placeholder
4. **Main Content Sections**:
   - Overview (description text)
   - Key Features (array of feature items)
   - Who Should Attend (audience/eligibility)
   - What You'll Learn (learning outcomes array)
   - Session Details (date, time, location, price)
   - FAQ Section (Q&A array)

## Challenge: Dynamic Data from Workshop List

Unlike `moon-tide-desk.html` and `contact-desk.html`, this page receives data via **query parameter** (`?id=workshop-name`).

**Current Flow**:
```
workshops-desk.html (click workshop card with id)
    ↓
navigateToWorkshop(id) → /workshop-detail-desk.html?id=xyz
    ↓
WorkshopLoader.js loads from config/content/services.js
    ↓
Page populates with specific workshop data
```

## Solution: Keep WorkshopLoader, Add Config-Driven HTML

Don't replace `WorkshopLoader.js` - extend it. Keep dynamic data loading but make HTML config-driven.

### Implementation Plan:

#### Step 1: Extract CSS → `css/workshop-detail.css`
- Extract 400+ lines inline CSS
- Replace all hardcoded colors with CSS variables
- Keep responsive media queries
- Use `var(--color-primary)`, `var(--color-background)`, etc.

#### Step 2: Create Workshop Detail Config Structure
**File**: `config/content/workshop-detail.js` (NEW)
```javascript
export const workshopDetailTemplate = {
    // Structure that workshop detail page expects
    sections: {
        overview: {
            label: "What is this service?",
            heading: "[Loaded from services.js]",
            content: "[Loaded from services.js]"
        },
        features: {
            label: "Key Features",
            items: "[Loaded from services.js]"
        },
        audience: {
            label: "Who Should Attend?",
            content: "[Loaded from services.js]"
        },
        learnings: {
            label: "What You'll Learn",
            items: "[Loaded from services.js]"
        },
        details: {
            label: "Session Details",
            cta: "Book Now" // Button text from config
        },
        faq: {
            label: "Frequently Asked Questions",
            items: [ // Generic FAQs for all workshops
                { question: "What's included?", answer: "..." },
                { question: "Do I need experience?", answer: "..." },
                // etc
            ]
        }
    }
};
```

#### Step 3: Enhance `WorkshopLoader.js`
Keep existing logic BUT add config-driven rendering:
```javascript
// Existing code loads workshop data from services.js
// NEW: Also load template structure from workshop-detail.js
// Merge workshop data + template structure
// Call renderWorkshopDetail() to populate HTML
```

#### Step 4: Create `renderWorkshopDetail()` Function
Add to `content-loader.js`:
```javascript
export function renderWorkshopDetail(workshopData) {
    // Takes workshop data from WorkshopLoader
    // Populates data-content attributes with dynamic data
    // Renders arrays (features, learnings, FAQ)
}
```

#### Step 5: Rewrite `workshop-detail-desk.html`
- Remove inline CSS (move to `css/workshop-detail.css`)
- Add `data-content` attributes
- Keep structure same, just add placeholders
- Remove hardcoded workshop data
- Call `renderWorkshopDetail()` after WorkshopLoader loads

### Key Differences from Moon Tide / Contact Pages

| Aspect | Moon Tide/Contact | Workshop Detail |
|--------|------------------|-----------------|
| Data Source | Static config | Dynamic from query param |
| Loading | `loadAboutPageContent()` | `WorkshopLoader.js` then `renderWorkshopDetail()` |
| Template | Single page, single config | Single template, multiple workshop instances |
| Arrays | Values cards | Features, learnings, FAQ |

---

## File Changes Checklist

### To Create (NEW):
- [ ] `css/workshop-detail.css` - Extracted CSS (400+ lines)
- [ ] `js/config/content/workshop-detail.js` - Template structure

### To Modify:
- [ ] `js/workshop-loader.js` - Add config integration + rendering call
- [ ] `js/content-loader.js` - Add `renderWorkshopDetail()` function
- [ ] `workshop-detail-desk.html` - Rewrite with data attributes

### To Update:
- [ ] `config/content/services.js` - Ensure workshop objects have all required fields

---

## Data Flow After Implementation

```
User clicks workshop in workshops-desk.html
    ↓
navigateToWorkshop('ceramic-arts')
    ↓
workshop-detail-desk.html?id=ceramic-arts loads
    ↓
theme-injector.js → injects CSS variables
    ↓
WorkshopLoader.js → loads 'ceramic-arts' from services.js
    ↓
renderWorkshopDetail(workshopData) → populates data-content attributes
    ↓
HTML template renders with:
  - Workshop-specific content (title, description, features, etc.)
  - Theme colors from CSS variables
  - Template structure from workshop-detail.js
    ↓
Live workshop detail page
```

---

## Implementation Order

1. **Extract CSS** → `css/workshop-detail.css`
2. **Create template config** → `config/content/workshop-detail.js`
3. **Enhance WorkshopLoader** → Integrate with content-loader
4. **Add renderWorkshopDetail** → `content-loader.js`
5. **Rewrite HTML** → `workshop-detail-desk.html`
6. **Test & Deploy**

---

## Context Savings

- `WorkshopLoader.js` stays as-is (already optimized)
- Reuse same pattern from moon-tide & contact pages
- Less code to write since data loading already exists
- Focus on: CSS extraction + HTML templating + config structure

---

## Ready to Implement?

Once confirmed, proceed with same 5-step approach:
1. CSS extraction
2. Config structure
3. Content loader function
4. HTML template rewrite
5. Deploy & test

**Estimated work**: 30-40% less than previous pages (data loading already done)

---
**Status**: Planning complete. Ready for implementation.
