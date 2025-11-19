# ACCOUNT PAGES INVESTIGATION

**Session 7 - Date: November 19, 2025**
**Files Analyzed:**
- `public/account-desk.html` (600 lines)
- `public/account-mobile.html` (580 lines)

---

## EXECUTIVE SUMMARY

The Account pair implements a **client portal dashboard** for organizational partners (schools, corporations, community groups) to manage their workshop bookings, view history, track loyalty rewards, and access partner benefits. The page serves as a centralized hub for repeat clients to monitor their ongoing relationship with Moon Tide Reconciliation.

**Key Features:**
- 4-Tier Loyalty Rewards Program (0-2, 3-5, 6-10, 11+ workshops)
- Workshop history and upcoming bookings tracker
- Quick action buttons (book, download resources, contact, invoices)
- Personalized workshop recommendations
- Progress tracking toward next loyalty tier
- Organization profile header with partner tier badge

**Desktop vs Mobile:** Desktop uses a 2-column grid with sidebar for quick actions; mobile stacks all content vertically in a fixed-header scrollable layout.

**Current Status:** Static demo/mockup with hardcoded data for "Vancouver School District" - no backend integration yet. Placeholders for upcoming features (resource downloads, invoice viewing).

---

## PAGE STRUCTURE COMPARISON

### Desktop Layout (account-desk.html)

```
┌─────────────────────────────────────────────────────┐
│  [✕ Back Button]                      (top-right)   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏫 Vancouver School District  [✨ Valued]  │   │ ← Header
│  │ Partner since Oct 2024 • Sarah Martinez     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐         │
│  │ 📅 2  │ │ 📚 4  │ │ 👥287 │ │ 🎯 5% │         │ ← Stats (4 columns)
│  │Upcoming│ │Complet│ │Partic.│ │Discnt │         │
│  └───────┘ └───────┘ └───────┘ └───────┘         │
│                                                     │
│  ┌─────────────────────┬───────────────┐           │
│  │ Upcoming Workshops  │ Quick Actions │           │ ← 2-column grid
│  │                     │ ⚡            │           │
│  │ - Kairos Blanket    │ [📚 Book]    │           │
│  │   Dec 15, 9am       │ [📥 Download]│           │
│  │ - Orange Shirt Day  │ [💬 Contact] │           │
│  │   Jan 20, 1pm       │ [🧾 Invoice] │           │
│  │                     │              │           │
│  │ Workshop History    │ 🌟 Loyalty   │           │
│  │                     │              │           │
│  │ - Cedar Bracelet    │ Progress Bar │           │
│  │   Nov 8 ✅         │ 4/6 workshops│           │
│  │ - MMIWG2S+ Session  │ 67% complete │           │
│  │   Oct 30 ✅        │              │           │
│  │ - Kairos Virtual    │ Tier Info    │           │
│  │   Oct 15 ✅        │              │           │
│  │ - Medicine Pouch    │ 💡 Recommend │           │
│  │   Oct 3 ✅         │              │           │
│  │                     │ - Smudging   │           │
│  └─────────────────────┴───────────────┘           │
│                                                     │
│  [Animated dot pattern background]                 │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**
1. **Portal Header**: Organization name, contact person, partner tier badge (left), loyalty tier + discount (right)
2. **Stats Grid**: 4-column grid showing upcoming (2), completed (4), participants (287), discount (5%)
3. **2-Column Content Grid**: Main area (upcoming + history) + Sidebar (actions + loyalty + recommendations)
4. **Back Button**: Top-right, circular with rotation hover effect
5. **Animated Background**: Subtle drifting dot pattern

---

### Mobile Layout (account-mobile.html)

```
┌──────────────────────────┐
│ 🏫 Client Portal    [✕] │ ← Fixed header
├──────────────────────────┤
│                          │ ← Scrollable content
│  ┌──────────────────────┐│
│  │Vancouver School Dist │ │ ← Loyalty banner
│  │Partner since Oct 2024│ │
│  │✨ Valued Partner     │ │
│  │Earning 5% Discount   │ │
│  └──────────────────────┘│
│                          │
│  ┌─────────┬─────────┐  │ ← Stats (2 columns)
│  │ 📅 2    │ 📚 4    │  │
│  │ Upcoming│ Compltd │  │
│  ├─────────┼─────────┤  │
│  │ 👥 287  │ 🎯 5%   │  │
│  │ Particp │ Discnt  │  │
│  └─────────┴─────────┘  │
│                          │
│  ⚡ Quick Actions        │
│  [📚 Book Another]      │
│  [📥 Download Resources]│
│  [💬 Contact Shona]     │
│  [🧾 View Invoices]     │
│                          │
│  📅 Upcoming Workshops   │
│  - Kairos Blanket       │
│    Dec 15, 9am-12pm     │
│  - Orange Shirt Day     │
│    Jan 20, 1pm-3pm      │
│                          │
│  🌟 Loyalty Rewards      │
│  Progress: 67% (4/6)    │
│  [Next tier: 10%]       │
│  [Tier info table]      │
│                          │
│  📖 Workshop History     │
│  - Cedar Bracelet ✅    │
│  - MMIWG2S+ Session ✅  │
│  - Kairos Virtual ✅    │
│  - Medicine Pouch ✅    │
│                          │
│  💡 Recommended for You  │
│  - Smudging Ceremony    │
│  - Indigenous Art       │
│  - T&R Seminar          │
│                          │
└──────────────────────────┘
```

**Key Differences from Desktop:**
1. **Fixed Header**: Blue gradient header with title + back button (desktop has floating button)
2. **Loyalty Banner**: Prominent top banner combining org info + tier (desktop separates these)
3. **Stats Grid**: 2×2 grid (desktop 1×4)
4. **Single Column**: All sections stacked vertically (desktop 2-column)
5. **Section Order**: Quick Actions moved before Upcoming Workshops for thumb accessibility
6. **Compact Labels**: "Upcoming" instead of "Upcoming Workshops" in stats
7. **Vertical Workshop Details**: Desktop uses horizontal flex, mobile stacks details

---

## DEPENDENCIES & EXTERNAL RESOURCES

### JavaScript Files
```html
<script src="./js/clean-url.js"></script>
```

**Purpose:** Standard URL cleaning for all pages (removes utm_ tracking params, normalizes paths)

### CSS Dependencies
**None** - All styles are inlined in `<style>` tags (lines 13-394 desktop, 13-382 mobile)

### External Assets
**None** - Page uses:
- Emoji icons (📅📚👥🎯✨🪶🎨📖💡📍⏰ etc.)
- System fonts
- Inline SVG patterns for background
- No images, no external CSS/JS libraries

**Fully self-contained:** This is one of the few pages with zero external dependencies beyond `clean-url.js`.

---

## COLOR SCHEME & VISUAL DESIGN

### Blue & Beige Professional Theme

**Desktop/Mobile Color Palette:**

```css
:root {
    --bg-beige: #F5F1E8;           /* Page background */
    --blue-primary: #1E90FF;       /* Dodger blue - main accent */
    --blue-dark: #0047AB;          /* Cobalt blue - dark accent */
    --red-accent: #E63E54;         /* Crimson red - background pattern */
    --card-white: #FFFFFF;         /* Card backgrounds */
    --text-dark: #1a1a1a;          /* Headlines */
    --text-gray: #666;             /* Body text */
    --border-blue: rgba(30, 144, 255, 0.1); /* Subtle borders */
}

/* Gradient used for buttons, badges, progress bars */
background: linear-gradient(135deg, #1E90FF, #0047AB);
```

**Desktop Specific (account-desk.html:29-50):**
```css
/* Animated background pattern */
body::before {
    background-image:
        radial-gradient(circle at 25% 25%, #1E90FF 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, #E63E54 1px, transparent 1px);
    background-size: 60px 60px;
    animation: drift 20s ease-in-out infinite;
    opacity: 0.08;
}

@keyframes drift {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(10px, -10px); }
}
```

**Visual Effect:** Subtle blue and red dots that slowly drift across the background, creating depth without distraction.

**Mobile Identical Background:** Same animation (lines 30-51), emphasizing consistency across devices.

---

## DESKTOP VS MOBILE DIFFERENCES

### 1. Header/Navigation Structure

**Desktop (account-desk.html:52-78):**
```css
.back-button {
    position: fixed;
    top: 40px;
    right: 40px;
    width: 60px;
    height: 60px;
    background: #1E90FF;
    border: 2px solid #0047AB;
    border-radius: 50%;
    box-shadow: 0 4px 20px rgba(30, 144, 255, 0.3);
}

.back-button:hover {
    transform: scale(1.1) rotate(90deg); /* Rotate on hover */
}
```

```html
<div class="back-button" onclick="navigateBack()">✕</div>
```

**Mobile (account-mobile.html:53-96):**
```css
.header {
    position: fixed;
    top: 0;
    height: 70px;
    background: linear-gradient(135deg, #1E90FF 0%, #0047AB 100%);
    backdrop-filter: blur(20px);
}

.header-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #FFFFFF;
}

.back-button {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

.back-button:active {
    transform: scale(0.95); /* Touch feedback */
}
```

```html
<div class="header">
    <div class="header-title">🏫 Client Portal</div>
    <div class="back-button" onclick="navigateBack()">✕</div>
</div>
```

**Impact:**
- **Desktop:** Floating button with rotation animation (more playful)
- **Mobile:** Fixed header bar with title (more structured, consistent with other mobile pages)
- **Desktop:** `:hover` scale + rotate
- **Mobile:** `:active` scale-down for touch feedback

---

### 2. Organization Info & Loyalty Badge

**Desktop (account-desk.html:91-135):**
```html
<div class="portal-header">
    <div class="org-info">
        <h1>🏫 Vancouver School District</h1>
        <p>Partner since October 2024 • Contact: Sarah Martinez</p>
    </div>
    <div class="loyalty-badge">
        <div class="tier">✨ Valued Partner</div>
        <div class="discount">Earning 5% Discount</div>
    </div>
</div>
```

```css
.portal-header {
    display: flex;
    justify-content: space-between; /* Left + right */
    align-items: center;
    padding: 40px 50px;
}

.org-info h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #1E90FF, #0047AB);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.loyalty-badge {
    background: linear-gradient(135deg, #1E90FF, #0047AB);
    color: white;
    padding: 20px 35px;
    border-radius: 20px;
}
```

**Mobile (account-mobile.html:121-154):**
```html
<div class="loyalty-banner">
    <div class="org-name">Vancouver School District</div>
    <div class="org-details">Partner since October 2024 • Sarah Martinez</div>
    <div class="tier">✨ Valued Partner</div>
    <div class="discount">Earning 5% Discount</div>
</div>
```

```css
.loyalty-banner {
    background: linear-gradient(135deg, #1E90FF, #0047AB);
    border-radius: 20px;
    padding: 25px;
    text-align: center; /* All text centered */
    margin-bottom: 20px;
}

.org-name {
    font-size: 1.3rem; /* Smaller than desktop 2.5rem */
    font-weight: 700;
    color: #FFFFFF; /* White text on gradient */
}
```

**Impact:**
- **Desktop:** Split layout - org info (left, gradient text) + badge (right, solid gradient box)
- **Mobile:** Combined banner - all info in one centered gradient box
- **Desktop:** Org name uses gradient text effect (2.5rem)
- **Mobile:** Org name uses solid white text (1.3rem, 48% smaller)

---

### 3. Stats Grid Layout

**Desktop (account-desk.html:138-143):**
```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 1 row, 4 columns */
    gap: 20px;
}

.stat-card {
    padding: 30px;
}

.stat-value {
    font-size: 2rem;
}
```

```html
<div class="stats-grid">
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
</div>
```

**Mobile (account-mobile.html:157-162):**
```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 rows, 2 columns */
    gap: 15px;
}

.stat-card {
    padding: 20px;
    text-align: center; /* Desktop doesn't explicitly center */
}

.stat-value {
    font-size: 1.8rem; /* 10% smaller */
}
```

**Impact:**
- **Desktop:** Horizontal row of 4 cards
- **Mobile:** 2×2 grid (more vertical space)
- **Desktop:** 30px padding, 20px gap
- **Mobile:** 20px padding, 15px gap (33% tighter)
- **Mobile:** Explicit `text-align: center` (desktop centers via flex)

---

### 4. Main Content vs Sidebar

**Desktop (account-desk.html:177-182):**
```css
.content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr; /* Main area 2/3, sidebar 1/3 */
    gap: 30px;
}
```

```html
<div class="content-grid">
    <!-- Main Content (2fr) -->
    <div>
        <div class="section-card">Upcoming Workshops</div>
        <div class="section-card">Workshop History</div>
    </div>

    <!-- Sidebar (1fr) -->
    <div>
        <div class="section-card">Quick Actions</div>
        <div class="section-card">Loyalty Rewards</div>
        <div class="section-card">Recommended for You</div>
    </div>
</div>
```

**Mobile (account-mobile.html:98-106):**
```css
/* No grid - just vertical stacking */
.content {
    margin-top: 70px;
    height: calc(100vh - 70px);
    overflow-y: auto;
    padding: 20px;
}
```

```html
<div class="content">
    <!-- All sections stack vertically -->
    <div class="section-card">Quick Actions</div>
    <div class="section-card">Upcoming Workshops</div>
    <div class="section-card">Loyalty Rewards</div>
    <div class="section-card">Workshop History</div>
    <div class="section-card">Recommended for You</div>
</div>
```

**Impact:**
- **Desktop:** 2-column layout with dedicated sidebar
- **Mobile:** Single-column vertical stack
- **Section Order:** Mobile prioritizes Quick Actions first (thumb zone optimization)
- **Scrolling:** Desktop entire page scrolls, mobile only content area scrolls (fixed header)

---

### 5. Workshop Details Layout

**Desktop (account-desk.html:229-241):**
```css
.workshop-item .workshop-details {
    font-size: 0.9rem;
    display: flex;
    gap: 20px;
    flex-wrap: wrap; /* Horizontal flow, wrap if needed */
}

.workshop-item .workshop-details span {
    display: flex;
    align-items: center;
    gap: 5px;
}
```

```html
<div class="workshop-item">
    <div class="workshop-title">Kairos Blanket Exercise (In-Person)</div>
    <div class="workshop-details">
        <span>📆 December 15, 2025</span>
        <span>⏰ 9:00 AM - 12:00 PM</span>
        <span>👥 65 participants</span>
        <span>📍 Main Auditorium</span>
    </div>
</div>
```

**Visual:**
```
Kairos Blanket Exercise (In-Person)
📆 December 15, 2025    ⏰ 9:00 AM - 12:00 PM    👥 65 participants    📍 Main Auditorium
```

**Mobile (account-mobile.html:230-242):**
```css
.workshop-item .workshop-details {
    font-size: 0.85rem; /* Slightly smaller */
    display: flex;
    flex-direction: column; /* Stack vertically */
    gap: 5px; /* Tighter spacing */
}

.workshop-item .workshop-details span {
    display: flex;
    align-items: center;
    gap: 5px;
}
```

```html
<!-- Same HTML structure -->
```

**Visual:**
```
Kairos Blanket Exercise (In-Person)
📆 December 15, 2025
⏰ 9:00 AM - 12:00 PM
👥 65 participants
📍 Main Auditorium
```

**Impact:**
- **Desktop:** Horizontal flow with wrapping (more compact)
- **Mobile:** Vertical stack (easier to scan on narrow screens)
- **Desktop:** 20px gap between details
- **Mobile:** 5px gap (75% tighter)

---

### 6. Responsive Breakpoints

**Desktop Media Queries (account-desk.html:369-393):**
```css
@media (max-width: 1200px) {
    .content-grid {
        grid-template-columns: 1fr; /* Stack sidebar below main */
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr); /* 2×2 grid */
    }
}

@media (max-width: 768px) {
    .portal-header {
        flex-direction: column; /* Stack org info + badge */
        gap: 20px;
        text-align: center;
    }

    .stats-grid {
        grid-template-columns: 1fr; /* Single column */
    }

    .container {
        padding: 30px 20px; /* Reduce padding */
    }
}
```

**Mobile iOS Safe Area (account-mobile.html:370-381):**
```css
@supports (padding: env(safe-area-inset-top)) {
    .header {
        padding-top: env(safe-area-inset-top);
        height: calc(70px + env(safe-area-inset-top));
    }

    .content {
        height: calc(100vh - 70px - env(safe-area-inset-top));
        margin-top: calc(70px + env(safe-area-inset-top));
        padding-bottom: calc(20px + env(safe-area-inset-bottom));
    }
}
```

**Impact:**
- **Desktop:** Gracefully degrades to mobile-like layout at 768px
- **Mobile:** Native iOS notch/home indicator support
- **Mobile:** Prevents content from being hidden behind system UI

---

## LOYALTY REWARDS SYSTEM

### Tier Structure

**4-Tier System (hardcoded in HTML):**

```html
<!-- Desktop: lines 542-548 -->
<!-- Mobile: lines 485-491 -->
<div class="tier-info">
    <strong>Reward Tiers:</strong>
    <div>• New Partner (0-2): Standard rates</div>
    <div>• Valued Partner (3-5): 5% discount ✨</div>
    <div>• Trusted Partner (6-10): 10% discount</div>
    <div>• Premier Partner (11+): 15% + priority scheduling</div>
</div>
```

**Current Demo Data:**
- **Organization:** Vancouver School District
- **Current Tier:** Valued Partner (3-5 workshops)
- **Workshops Completed:** 4
- **Progress to Next Tier:** 4/6 (67% complete, needs 2 more for 10% discount)
- **Current Discount:** 5%

### Progress Visualization

**Desktop (account-desk.html:285-322):**
```html
<div class="loyalty-progress">
    <div class="progress-header">
        <span>Valued Partner</span>
        <span>4/6 workshops</span>
    </div>
    <div class="progress-bar">
        <div class="progress-fill" style="width: 60%;"></div>
    </div>
    <div class="next-tier">
        🎯 2 more workshops until <strong>Trusted Partner</strong> (10% discount)
    </div>
</div>
```

```css
.progress-bar {
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #1E90FF, #0047AB);
    transition: width 0.5s ease; /* Animated fill */
    width: 60%; /* Inline style in HTML shows 67% */
}
```

**Note:** Discrepancy - CSS shows `width: 60%`, HTML inline style shows `67%`. HTML inline style wins.

**Mobile (account-mobile.html:284-321):**
```html
<!-- Identical structure, slightly different styling -->
<div class="progress-bar">
    <div class="progress-fill"></div> <!-- Width set via inline style: 67% -->
</div>
```

```css
.progress-bar {
    height: 18px; /* 2px shorter than desktop */
}
```

**Business Logic (theoretical backend):**
```javascript
function calculateLoyaltyTier(workshopsCompleted) {
    if (workshopsCompleted >= 11) return { tier: "Premier Partner", discount: 15, perks: "priority scheduling" };
    if (workshopsCompleted >= 6) return { tier: "Trusted Partner", discount: 10 };
    if (workshopsCompleted >= 3) return { tier: "Valued Partner", discount: 5 };
    return { tier: "New Partner", discount: 0 };
}

function progressToNextTier(workshopsCompleted) {
    const thresholds = [3, 6, 11];
    const nextThreshold = thresholds.find(t => workshopsCompleted < t);
    if (!nextThreshold) return null; // Already at max tier
    return {
        current: workshopsCompleted,
        needed: nextThreshold,
        remaining: nextThreshold - workshopsCompleted,
        percentage: (workshopsCompleted / nextThreshold) * 100
    };
}

// Example for demo data:
// workshopsCompleted = 4
// Current tier: Valued Partner (3-5 range)
// Next tier: Trusted Partner (6+ threshold)
// Progress: 4/6 = 67%
// Remaining: 2 workshops
```

---

## QUICK ACTIONS FUNCTIONALITY

### Desktop/Mobile Actions (identical JavaScript)

**Desktop (account-desk.html:573-597):**
**Mobile (account-mobile.html:553-577):**

```javascript
function navigateBack() {
    window.location.href = '/menu';
}

function bookWorkshop() {
    window.location.href = '/chat?book=true';
}

function downloadResources() {
    alert('Resource downloads coming soon! Contact Shona for materials.');
}

function contactSupport() {
    window.location.href = '/shona';
}

function viewInvoices() {
    alert('Invoice history coming soon! Contact shona@moontidereconciliation.com for billing inquiries.');
}

// ESC key to exit
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navigateBack();
});
```

**Button Implementation:**

```html
<button class="action-button" onclick="bookWorkshop()">
    📚 Book Another Workshop
</button>
<button class="action-button secondary" onclick="downloadResources()">
    📥 Download Resources
</button>
<button class="action-button secondary" onclick="contactSupport()">
    💬 Contact Shona
</button>
<button class="action-button secondary" onclick="viewInvoices()">
    🧾 View Invoices
</button>
```

**Action Results:**

| Button | Action | Current Implementation | Status |
|--------|--------|------------------------|--------|
| **Book Another Workshop** | Navigate to chat with booking intent | `/chat?book=true` | ✅ Works |
| **Download Resources** | Access materials from past workshops | Alert: "Coming soon! Contact Shona" | ⚠️ Placeholder |
| **Contact Shona** | Reach out to founder | `/shona` | ✅ Works |
| **View Invoices** | Access billing history | Alert: "Coming soon! Contact shona@..." | ⚠️ Placeholder |

**Issue:** Two of four quick actions are non-functional placeholders using `alert()` boxes. Not ideal UX - should either:
1. Disable buttons visually + show "Coming Soon" badge
2. Navigate to dedicated "Coming Soon" page
3. Actually implement the features

---

## PERSONALIZED RECOMMENDATIONS

### Recommendation Engine (Static Demo)

**Desktop/Mobile HTML (identical):**

```html
<div class="section-card">
    <h2>💡 Recommended for You</h2>
    <div class="recommended-grid">
        <div class="recommended-item">
            <div class="rec-title">🪶 Smudging Ceremony</div>
            <div class="rec-reason">Complements your cedar workshops</div>
        </div>
        <div class="recommended-item">
            <div class="rec-title">🎨 Indigenous Art Workshop</div>
            <div class="rec-reason">Popular with arts programs</div>
        </div>
        <div class="recommended-item">
            <div class="rec-title">📚 Truth & Reconciliation Seminar</div>
            <div class="rec-reason">Build on your MMIWG2S+ session</div>
        </div>
    </div>
</div>
```

**Styling:**

```css
.recommended-item {
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.1), rgba(42, 157, 143, 0.1));
    padding: 20px; /* Desktop */
    padding: 15px; /* Mobile */
    border-radius: 15px; /* Desktop */
    border-radius: 12px; /* Mobile */
    border-left: 4px solid #1E90FF;
}
```

**Theoretical Recommendation Logic:**

```javascript
// Backend would analyze workshop history to generate recommendations
function generateRecommendations(workshopHistory) {
    const recommendations = [];

    // Pattern 1: Complementary workshops
    const hasHandsOnCraft = workshopHistory.some(w =>
        w.title.includes("Cedar") || w.title.includes("Medicine Pouch")
    );
    if (hasHandsOnCraft) {
        recommendations.push({
            title: "🪶 Smudging Ceremony",
            reason: "Complements your cedar workshops"
        });
    }

    // Pattern 2: School-specific popularity
    if (organization.type === "school" && organization.hasArtsProgram) {
        recommendations.push({
            title: "🎨 Indigenous Art Workshop",
            reason: "Popular with arts programs"
        });
    }

    // Pattern 3: Deepening knowledge
    const hasAwarenessSession = workshopHistory.some(w =>
        w.title.includes("MMIWG2S+") || w.title.includes("Orange Shirt")
    );
    if (hasAwarenessSession) {
        recommendations.push({
            title: "📚 Truth & Reconciliation Seminar",
            reason: "Build on your MMIWG2S+ session"
        });
    }

    return recommendations;
}
```

**Current Status:** Static hardcoded recommendations - no real recommendation engine. All clients would see the same 3 suggestions.

---

## WORKSHOP DATA STRUCTURE

### Hardcoded Demo Data

**Upcoming Workshops (2 total):**

```javascript
const upcomingWorkshops = [
    {
        title: "Kairos Blanket Exercise (In-Person)",
        date: "December 15, 2025",
        time: "9:00 AM - 12:00 PM",
        participants: 65,
        location: "Main Auditorium",
        status: "confirmed"
    },
    {
        title: "Orange Shirt Day Preparation",
        date: "January 20, 2026",
        time: "1:00 PM - 3:00 PM",
        participants: 45,
        location: "Teacher's Lounge",
        status: "confirmed"
    }
];
```

**Completed Workshops (4 total):**

```javascript
const workshopHistory = [
    {
        title: "Cedar Bracelet Making",
        date: "November 8, 2025",
        participants: 52,
        status: "completed"
    },
    {
        title: "MMIWG2S+ Awareness Session",
        date: "October 30, 2025",
        participants: 78,
        status: "completed"
    },
    {
        title: "Kairos Blanket Exercise (Virtual)",
        date: "October 15, 2025",
        participants: 92,
        status: "completed"
    },
    {
        title: "Medicine Pouch Creation",
        date: "October 3, 2025",
        participants: 65,
        status: "completed"
    }
];
```

**Total Participant Count:** 52 + 78 + 92 + 65 = **287 participants** (matches stat card)

**Expected Backend Integration:**

```javascript
// Would fetch real data from API
async function loadPortalData(orgId) {
    const response = await fetch(`/api/organizations/${orgId}/portal`);
    const data = await response.json();

    return {
        organization: {
            name: data.name,
            contact: data.primaryContact,
            partnerSince: data.joinDate,
            tier: calculateLoyaltyTier(data.workshopsCompleted)
        },
        stats: {
            upcomingCount: data.upcomingWorkshops.length,
            completedCount: data.completedWorkshops.length,
            totalParticipants: data.completedWorkshops.reduce((sum, w) => sum + w.participants, 0),
            currentDiscount: data.loyaltyDiscount
        },
        upcomingWorkshops: data.upcomingWorkshops,
        workshopHistory: data.completedWorkshops,
        recommendations: generateRecommendations(data.completedWorkshops)
    };
}
```

---

## ISSUES FOUND

### 1. Alert Boxes for "Coming Soon" Features

**Location:** Desktop line 584, 591; Mobile line 562, 570

```javascript
function downloadResources() {
    alert('Resource downloads coming soon! Contact Shona for materials.');
}

function viewInvoices() {
    alert('Invoice history coming soon! Contact shona@moontidereconciliation.com for billing inquiries.');
}
```

**Issue:** Using `alert()` for placeholder features is poor UX:
- Blocks user interaction (modal dialog)
- Looks unprofessional
- No way to copy email address
- Doesn't match modern design patterns

**Severity:** 🟡 Medium (UX degradation)

**Recommendation:** Replace with one of these patterns:

**Option 1: Inline Message**
```javascript
function downloadResources() {
    const button = event.target;
    const originalText = button.innerHTML;

    button.innerHTML = '⏳ Coming Soon - Contact Shona';
    button.disabled = true;

    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 3000);
}
```

**Option 2: Navigate to Placeholder Page**
```javascript
function downloadResources() {
    window.location.href = '/downloads?source=portal';
}
```

**Option 3: Custom Modal**
```javascript
function downloadResources() {
    showModal({
        title: '📥 Resource Downloads',
        message: 'This feature is coming soon! For immediate access to materials, contact Shona:',
        actions: [
            { label: 'Copy Email', onClick: () => copyToClipboard('shona@moontidereconciliation.com') },
            { label: 'Visit Contact Page', onClick: () => window.location.href = '/shona' },
            { label: 'Close', onClick: () => closeModal() }
        ]
    });
}
```

---

### 2. Hardcoded Demo Data (No Backend Integration)

**Location:** Entire HTML file (lines 400-569 desktop, 392-550 mobile)

**Issue:** All data is static HTML:
- Organization name: "Vancouver School District"
- Contact person: "Sarah Martinez"
- All workshop dates, titles, participant counts
- Loyalty tier and progress
- Stats numbers

**Severity:** 🔴 High (not production-ready)

**Current State:** This is a mockup/demo page, not a functional portal.

**Recommendation:** Implement backend API integration:

**1. Add Loading State:**
```html
<div id="portal-loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading your portal data...</p>
</div>

<div id="portal-content" style="display: none;">
    <!-- All current content -->
</div>
```

**2. Fetch Real Data on Page Load:**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const orgId = getUserOrgId(); // Get from session/cookie
        const data = await fetch(`/api/organizations/${orgId}/portal`)
            .then(res => res.json());

        populatePortal(data);

        document.getElementById('portal-loading').style.display = 'none';
        document.getElementById('portal-content').style.display = 'block';
    } catch (error) {
        showError('Unable to load portal data. Please contact support.');
    }
});
```

**3. Template-Based Rendering:**
```javascript
function populatePortal(data) {
    // Header
    document.querySelector('.org-info h1').textContent = `🏫 ${data.organization.name}`;
    document.querySelector('.org-info p').textContent =
        `Partner since ${data.partnerSince} • Contact: ${data.contact}`;

    // Stats
    document.querySelectorAll('.stat-value')[0].textContent = data.stats.upcomingCount;
    document.querySelectorAll('.stat-value')[1].textContent = data.stats.completedCount;
    document.querySelectorAll('.stat-value')[2].textContent = data.stats.totalParticipants;
    document.querySelectorAll('.stat-value')[3].textContent = `${data.stats.currentDiscount}%`;

    // Workshops
    renderWorkshopList('.upcoming', data.upcomingWorkshops);
    renderWorkshopList('.history', data.workshopHistory);

    // Recommendations
    renderRecommendations(data.recommendations);
}
```

---

### 3. Mobile Zoom Disabled (WCAG Violation)

**Location:** Mobile line 6

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**Issue:** Prevents users from zooming the page, violating **WCAG 2.1 Success Criterion 1.4.4 (Resize Text)** Level AA.

**Severity:** 🔴 High (accessibility violation)

**Users Affected:**
- Vision-impaired users who need to zoom to read
- Older users with declining vision
- Users in bright sunlight needing to zoom

**Fix:**
```html
<!-- Remove maximum-scale and user-scalable restrictions -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Desktop Doesn't Have This Issue:** Desktop version (line 6) correctly allows zooming:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

### 4. No Authentication/Authorization

**Location:** N/A (entire page)

**Issue:** Page has no login requirement or session validation. Anyone can access `/account` and see demo data.

**Severity:** 🔴 Critical (security hole in production)

**Current State:** Static demo page - acceptable for mockup, unacceptable for production.

**Recommendation:** Implement authentication flow:

**1. Add Auth Check on Page Load:**
```javascript
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/session', {
            credentials: 'include' // Send session cookie
        });

        if (!response.ok) {
            // Not logged in - redirect to login
            window.location.href = '/login?redirect=/account';
            return false;
        }

        const session = await response.json();
        return session;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login?redirect=/account';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkAuthentication();
    if (!session) return; // Redirected to login

    // Proceed with loading portal data
    loadPortalData(session.organizationId);
});
```

**2. Server-Side Route Protection:**
```javascript
// Server route for /account page
app.get('/account', requireAuth, (req, res) => {
    if (!req.session.organizationId) {
        return res.redirect('/login?redirect=/account');
    }

    res.sendFile('account-desk.html'); // or account-mobile.html based on user agent
});
```

**3. API Endpoint Protection:**
```javascript
// All portal API endpoints require valid session
app.get('/api/organizations/:orgId/portal', requireAuth, async (req, res) => {
    // Verify orgId matches session
    if (req.params.orgId !== req.session.organizationId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const portalData = await getPortalData(req.params.orgId);
    res.json(portalData);
});
```

---

### 5. No Error Handling

**Location:** JavaScript functions (lines 573-597 desktop, 553-577 mobile)

**Issue:** All functions assume success:
- `window.location.href` assignments don't check if pages exist
- No try/catch blocks
- No user feedback if navigation fails

**Severity:** 🟡 Low (edge case)

**Recommendation:** Add error handling:

```javascript
function navigateBack() {
    try {
        window.location.href = '/menu';
    } catch (error) {
        console.error('Navigation failed:', error);
        alert('Unable to navigate. Please refresh the page.');
    }
}

async function bookWorkshop() {
    try {
        // Check if chat page is accessible
        const response = await fetch('/chat', { method: 'HEAD' });
        if (!response.ok) {
            throw new Error('Chat page unavailable');
        }

        window.location.href = '/chat?book=true';
    } catch (error) {
        console.error('Booking failed:', error);
        alert('Unable to access booking system. Please try again later or contact support.');
    }
}
```

---

### 6. Missing ARIA Labels

**Location:** Interactive elements throughout (buttons, stats, progress bar)

**Issue:** Screen readers can't adequately describe interactive elements.

**Severity:** 🟡 Medium (accessibility)

**Examples:**

**Stats Cards:**
```html
<!-- Current -->
<div class="stat-card">
    <div class="stat-icon">📅</div>
    <div class="stat-value">2</div>
    <div class="stat-label">Upcoming Workshops</div>
</div>

<!-- Better -->
<div class="stat-card" role="group" aria-labelledby="stat-upcoming-label">
    <div class="stat-icon" aria-hidden="true">📅</div>
    <div class="stat-value" aria-label="2 upcoming workshops">2</div>
    <div class="stat-label" id="stat-upcoming-label">Upcoming Workshops</div>
</div>
```

**Action Buttons:**
```html
<!-- Current -->
<button class="action-button" onclick="bookWorkshop()">
    📚 Book Another Workshop
</button>

<!-- Better -->
<button class="action-button"
        onclick="bookWorkshop()"
        aria-label="Book another workshop - navigate to chat interface">
    <span aria-hidden="true">📚</span> Book Another Workshop
</button>
```

**Progress Bar:**
```html
<!-- Current -->
<div class="progress-bar">
    <div class="progress-fill" style="width: 67%;"></div>
</div>

<!-- Better -->
<div class="progress-bar"
     role="progressbar"
     aria-label="Loyalty tier progress"
     aria-valuenow="4"
     aria-valuemin="0"
     aria-valuemax="6"
     aria-valuetext="4 of 6 workshops completed, 67 percent">
    <div class="progress-fill" style="width: 67%;"></div>
</div>
```

---

## DESIGN ANALYSIS

### Strengths ✅

1. **Clean Visual Hierarchy:** Stats → Actions → Content flow is logical
2. **Consistent Branding:** Blue/beige color scheme matches Moon Tide identity
3. **Animated Background:** Subtle drift animation adds polish without distraction
4. **Responsive Grid:** Desktop 2-column layout gracefully degrades to mobile single-column
5. **Loyalty Gamification:** Tier system with progress bar encourages repeat business
6. **Personalized Recommendations:** Shows potential for upselling related workshops
7. **iOS Safe Area Support:** Mobile properly handles notch/home indicator
8. **Touch Optimization:** Mobile uses `:active` instead of `:hover`, appropriate touch feedback

### Weaknesses ⚠️

1. **Static Demo Data:** Not production-ready, needs backend integration
2. **Alert Boxes:** Placeholder features use unprofessional `alert()` dialogs
3. **No Authentication:** Anyone can access `/account` URL (security hole)
4. **No Loading States:** Instant render of hardcoded data - would need spinners in production
5. **Mobile Zoom Disabled:** WCAG violation
6. **No Error Handling:** Assumes all navigation succeeds
7. **Missing ARIA Labels:** Accessibility gaps for screen readers
8. **No Empty States:** Assumes org always has workshops (what if new partner?)

### Code Quality Rating

**Overall: 3.5/5 ⭐⭐⭐⭐☆**

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Structure** | 4/5 | Clean HTML, logical sections |
| **Responsiveness** | 5/5 | Excellent desktop/mobile adaptation |
| **Accessibility** | 2/5 | Zoom disabled, missing ARIA labels |
| **Functionality** | 2/5 | Static demo, 50% placeholder buttons |
| **UX Design** | 4/5 | Good visual flow, poor error handling |
| **Production Ready** | 1/5 | Needs auth, backend, real data |
| **Code Reuse** | 5/5 | Clean separation, no duplication |

---

## COMPARISON TO OTHER PAGES

### Similarities with Delete-Data Pair

1. **Form-Like Interface:** Both collect/display user-specific data
2. **Blue Gradient Buttons:** Same button styling (`linear-gradient(135deg, #1E90FF, #0047AB)`)
3. **Clean White Cards:** Both use `#FFFFFF` cards on beige/light backgrounds
4. **Mobile Fixed Headers:** Both mobile versions use fixed header bars
5. **ESC Key Support:** Both support Escape key to exit

### Unique Features Not Found in Other Pages

1. **Loyalty Rewards System:** Only page with tiered benefits + progress tracking
2. **Workshop History:** Only page showing past bookings chronologically
3. **Personalized Recommendations:** Only page with user-specific suggestions
4. **Multi-Stat Dashboard:** Only page with 4-stat overview grid
5. **Animated Dot Background:** Unique drifting pattern (other pages use gradients/solid colors)
6. **Organization Profile Header:** Only page displaying client organization info

### Comparison Table

| Feature | Account | Delete-Data | Contact | Shona | Moon-Tide |
|---------|---------|-------------|---------|-------|-----------|
| **Backend Integration** | ❌ (demo) | ✅ API | ❌ | ❌ | ❌ |
| **Authentication Required** | ⚠️ Should be | ❌ | ❌ | ❌ | ❌ |
| **User-Specific Data** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Form Submission** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Loyalty/Gamification** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Mobile Zoom** | ❌ (disabled) | ✅ | ✅ | ✅ | ✅ |
| **Animated Background** | ✅ Dots | ❌ | ❌ | ❌ | ❌ |
| **File Size** | 600/580 | 346/336 | 383/371 | 576/542 | 426/389 |
| **Complexity** | Medium | Low | Low | Low | Low |
| **Production Status** | Demo | ✅ Works | ✅ Works | ✅ Works | ✅ Works |

---

## RECOMMENDATIONS

### High Priority 🔴

1. **Implement Backend Integration:**
```javascript
// Add API endpoints
GET /api/organizations/:orgId/portal
GET /api/organizations/:orgId/workshops/upcoming
GET /api/organizations/:orgId/workshops/history
GET /api/organizations/:orgId/recommendations
```

2. **Add Authentication:**
```javascript
// Protect route server-side
app.get('/account', requireAuth, requireOrganization, (req, res) => {
    res.sendFile('account.html');
});
```

3. **Fix Mobile Zoom Restriction:**
```html
<!-- Remove maximum-scale and user-scalable=no -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

4. **Replace Alert Boxes with Proper UI:**
```javascript
// Option 1: Disable buttons visually
<button class="action-button secondary" disabled>
    📥 Download Resources <span class="badge">Coming Soon</span>
</button>

// Option 2: Custom modal component
function downloadResources() {
    showNotification({
        type: 'info',
        title: 'Feature Coming Soon',
        message: 'Resource downloads will be available soon. Contact Shona for immediate access.',
        actions: [
            { label: 'Contact Shona', href: '/shona' },
            { label: 'OK', dismiss: true }
        ]
    });
}
```

### Medium Priority 🟡

5. **Add Loading States:**
```html
<div class="section-card loading">
    <div class="skeleton-loader">
        <div class="skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
    </div>
</div>
```

6. **Add Empty States:**
```html
<!-- When no workshops exist -->
<div class="empty-state">
    <div class="empty-icon">📚</div>
    <h3>No Upcoming Workshops</h3>
    <p>You don't have any workshops scheduled yet.</p>
    <button onclick="bookWorkshop()">Book Your First Workshop</button>
</div>
```

7. **Add ARIA Labels:**
```html
<div class="stat-card" role="group" aria-labelledby="stat-upcoming">
    <div class="stat-value" aria-label="2 upcoming workshops">2</div>
    <div class="stat-label" id="stat-upcoming">Upcoming Workshops</div>
</div>
```

### Low Priority 🟢

8. **Add Error Handling:**
```javascript
function navigateBack() {
    try {
        window.location.href = '/menu';
    } catch (error) {
        showNotification('error', 'Navigation failed', 'Please refresh the page');
    }
}
```

9. **Add Analytics Tracking:**
```javascript
function bookWorkshop() {
    trackEvent('Portal', 'Book Workshop Clicked', { source: 'portal-quick-actions' });
    window.location.href = '/chat?book=true';
}
```

10. **Add CSV Export for Workshop History:**
```javascript
function exportHistory() {
    const csv = generateCSV(workshopHistory);
    downloadFile(csv, `workshop-history-${orgName}-${Date.now()}.csv`);
}
```

---

## CONCLUSION

The Account pair is a **well-designed client portal mockup** with excellent visual design and responsive layout adaptation. However, it's currently a **static demo** that requires significant backend development before production deployment.

**Key Strengths:**
- Clean visual hierarchy and professional design
- Effective loyalty gamification with tiered rewards
- Excellent responsive design (desktop 2-column → mobile single-column)
- Personalized recommendations framework
- Good use of animated background for visual interest

**Key Weaknesses:**
- No backend integration (hardcoded demo data)
- No authentication/authorization
- 50% of quick actions are non-functional placeholders
- Mobile zoom disabled (WCAG violation)
- Missing loading states, error handling, empty states

**Production Readiness:** **2/5** - Needs substantial backend work

**Recommended Next Steps:**
1. Implement authentication (protect `/account` route)
2. Build backend API for real organization data
3. Replace alert boxes with proper modal components
4. Enable mobile zoom (fix WCAG violation)
5. Add loading states and error handling

**Overall Assessment:** This is an **excellent design prototype** that demonstrates the vision for a client portal. With backend integration and feature completion, it would be a **5/5 exemplary implementation**. As a static demo, it's a **3.5/5**.

---

**Word Count:** ~6,200 words
**Session:** 7
**Date:** November 19, 2025
**Files Analyzed:** 2 (1,180 lines total)
**Critical Issues:** 2 (no backend, no auth)
**Medium Issues:** 2 (alerts, accessibility)
**Low Issues:** 2 (error handling, ARIA)
**Rating:** 3.5/5 ⭐⭐⭐⭐☆ (demo/mockup)
