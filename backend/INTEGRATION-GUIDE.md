# Integration Guide: Connecting Frontend & Backend

This guide walks you through connecting your Store Printer frontend with the backend config system.

## 📋 Prerequisites

- ✅ Backend deployed to Cloud Run (or running locally)
- ✅ Firebase project set up with Firestore
- ✅ Gemini API key obtained
- ✅ Frontend deployed or running locally

## 🔄 Data Flow Overview

```
1. CLIENT (Portal User)
   └→ Describes their store in natural language
      └→ "I run a coffee shop called Brew Haven..."

2. PORTAL FRONTEND
   └→ Sends prompt to Backend API
      POST /api/generate

3. BACKEND
   ├→ Gemini AI generates config from prompt
   ├→ Validates config (6 passes)
   ├→ Saves to Firestore (keyed by Firebase UID)
   └→ Returns config to portal

4. CLIENT
   └→ Reviews/edits config in portal
      └→ Clicks "Publish"

5. BACKEND
   ├→ Marks config as "published"
   └→ Returns storefront URL

6. STOREFRONT FRONTEND
   ├→ User visits storefront URL with ?uid=firebase-uid
   ├→ Fetches config: GET /api/deploy/:uid
   ├→ Loads config into config system
   └→ Renders with client's theme/content
```

## 🛠️ Step-by-Step Integration

### Step 1: Update Backend URLs in Frontend

**File:** `public/js/config/core/settings.js`

```javascript
export const settings = {
    backend: {
        // Your existing AI chat backend
        aiChatUrl: "https://reconciliation-backend-934410532991.us-central1.run.app",

        // ADD THIS: Your new config backend
        configApiUrl: "https://store-printer-backend-YOUR-PROJECT.run.app"
    },
    // ... rest of settings
};
```

### Step 2: Create Config Fetcher in Frontend

**File:** `public/js/config-fetcher.js` (NEW FILE)

```javascript
/**
 * Config Fetcher
 * Fetches store configuration from backend on page load
 */

import { settings } from './config/index.js';

/**
 * Fetch config from backend and merge with local config
 */
export async function fetchStoreConfig() {
    // Get UID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get('uid');

    if (!uid) {
        console.log('ℹ️ No UID provided, using default config');
        return null;
    }

    try {
        console.log(`📥 Fetching config for UID: ${uid}`);

        const response = await fetch(
            `${settings.backend.configApiUrl}/api/deploy/${uid}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.config) {
            console.log('✅ Config loaded from backend');
            return data.config;
        }

        return null;

    } catch (error) {
        console.error('❌ Failed to fetch config:', error.message);
        console.log('⚠️ Using default configuration');
        return null;
    }
}

/**
 * Merge backend config into app config
 */
export function mergeBackendConfig(backendConfig, appConfig) {
    if (!backendConfig) return appConfig;

    // Deep merge backend config into app config
    const merged = {
        ...appConfig,
        theme: { ...appConfig.theme, ...backendConfig.theme },
        brand: { ...appConfig.brand, ...backendConfig.brand },
        settings: { ...appConfig.settings, ...backendConfig.settings },
        services: { ...appConfig.services, ...backendConfig.services },
        products: { ...appConfig.products, ...backendConfig.products },
        pages: { ...appConfig.pages, ...backendConfig.pages }
    };

    console.log('🔀 Backend config merged');
    return merged;
}

export default {
    fetchStoreConfig,
    mergeBackendConfig
};
```

### Step 3: Update Config Index to Support Backend Fetch

**File:** `public/js/config/index.js`

**ADD** this at the top of the file:

```javascript
import { fetchStoreConfig, mergeBackendConfig } from '../config-fetcher.js';

// Fetch backend config on module load (if UID provided)
const backendConfig = await fetchStoreConfig();

// Original local config
const localConfig = {
    theme,
    brand,
    settings,
    services,
    products,
    pages: pageContent,
    images,
    version: settings.version,
    environment: settings.environment
};

// Merge backend config (if available)
export const appConfig = mergeBackendConfig(backendConfig, localConfig);
```

**IMPORTANT:** The rest of the file stays the same, but now exports are from `appConfig` instead of direct imports.

### Step 4: Update HTML Files to Support UID Parameter

Your HTML files already have the loaders set up from Phase 3! No changes needed.

The config fetcher will automatically run when the config system loads.

### Step 5: Test the Integration

#### A. Test Backend Locally

```bash
cd backend
npm start

# Should see:
# ✅ Firebase Admin initialized
# 🚀 Store Printer Portal Backend
# Server ready at http://localhost:8080
```

Visit: `http://localhost:8080/admin`

#### B. Generate a Test Config

1. Open admin panel: `http://localhost:8080/admin`
2. Enter a test UID: `test-user-123`
3. Enter prompt: `A modern tech startup called 'TechCo' with blue and white branding`
4. Click "Generate with AI"
5. Click "Save Config"
6. Click "Publish to Storefront"

#### C. Test Frontend Fetch

Open your frontend with the UID parameter:

```
http://localhost:5000?uid=test-user-123
```

**Check browser console:**
```
📥 Fetching config for UID: test-user-123
✅ Config loaded from backend
🔀 Backend config merged
✅ Theme injected
```

**Inspect the page:**
- Company name should be "TechCo"
- Colors should be blue and white
- Content should match what AI generated

## 🎯 Portal Integration

### Option 1: Embed Admin Panel in Your Portal

Add this to your portal's dashboard:

```html
<iframe
    src="https://your-backend.run.app/admin"
    width="100%"
    height="800px"
    style="border: none; border-radius: 8px;"
></iframe>
```

### Option 2: Build Custom Portal UI

Use the API directly from your portal:

```javascript
// In your portal's store configuration page

async function generateStoreConfig(userUID, userPrompt) {
    const response = await fetch('https://your-backend.run.app/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: userPrompt,
            config_type: 'full',
            uid: userUID,
            auto_save: true
        })
    });

    const data = await response.json();

    if (data.success) {
        console.log('✅ Config generated and saved!');
        return data.config;
    } else {
        throw new Error(data.error);
    }
}

async function publishStore(userUID) {
    const response = await fetch(
        `https://your-backend.run.app/api/deploy/${userUID}/publish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config: currentConfig, // From your state
                force: false
            })
        }
    );

    const data = await response.json();

    if (data.success) {
        // Show user their storefront URL
        const storefrontUrl = `https://your-storefront.web.app?uid=${userUID}`;
        console.log('🚀 Store published:', storefrontUrl);
        return storefrontUrl;
    }
}
```

## 🔐 Securing the Integration

### 1. Add Authentication Middleware (Optional)

**File:** `backend/middleware/auth.js` (CREATE THIS)

```javascript
import { verifyIdToken } from '../services/firebase-service.js';

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
```

**Apply to protected routes:**

```javascript
// In routes/config.js
import { requireAuth } from '../middleware/auth.js';

router.post('/:uid', requireAuth, async (req, res) => {
    // Verify user can only modify their own config
    if (req.user.uid !== req.params.uid) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // ... rest of save logic
});
```

### 2. Send Auth Token from Portal

```javascript
// In your portal
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

fetch('https://your-backend.run.app/api/config/user-123', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ config })
});
```

## 🚀 Deployment Checklist

### Backend Deployment

- [ ] Firebase service account JSON uploaded to Cloud Run secrets
- [ ] Environment variables set (GEMINI_API_KEY, FRONTEND_URL, etc.)
- [ ] CORS configured for your frontend/portal domains
- [ ] Firestore security rules set up
- [ ] Health endpoint responding: `/health`

### Frontend Updates

- [ ] `config-fetcher.js` added
- [ ] `config/index.js` updated to fetch from backend
- [ ] `settings.js` has correct backend URL
- [ ] Frontend deployed with new changes

### Testing

- [ ] Generate config via admin panel
- [ ] Save config to Firestore
- [ ] Publish config
- [ ] Frontend loads config correctly with `?uid=` parameter
- [ ] Theme applied correctly
- [ ] Content populated correctly

## 🎉 Complete Flow Example

### 1. Client Creates Store in Portal

```javascript
// Portal: User fills out form and clicks "Generate My Store"

const userInput = {
    businessName: "Brew Haven",
    businessType: "Coffee Shop",
    description: "Cozy cafe specializing in locally roasted beans",
    colors: "Warm browns and cream",
    services: "Coffee sales, barista workshops, subscriptions"
};

const prompt = `Create a store for ${userInput.businessName}, a ${userInput.businessType}.
${userInput.description}. Brand colors: ${userInput.colors}.
We offer: ${userInput.services}.`;

const result = await fetch('https://backend.run.app/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt,
        config_type: 'full',
        uid: currentUser.uid,
        auto_save: true
    })
});

const data = await result.json();
console.log('✅ Store config generated!');
```

### 2. Client Reviews and Publishes

```javascript
// Portal: Show preview, let client edit, then publish

await fetch(`https://backend.run.app/api/deploy/${currentUser.uid}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: finalConfig })
});

const storefrontUrl = `https://your-storefront.web.app?uid=${currentUser.uid}`;

// Show client their live storefront URL
showSuccessMessage(`Your store is live at: ${storefrontUrl}`);
```

### 3. Customer Visits Storefront

```
https://your-storefront.web.app?uid=client-firebase-uid
                                    ↓
        Frontend fetches config from backend
                                    ↓
        Loads client's theme, brand, services, products
                                    ↓
        Renders personalized storefront
```

## 🐛 Common Issues

### "Config not loading"
- Check browser console for fetch errors
- Verify UID parameter is in URL
- Verify backend is reachable
- Check CORS settings

### "Using default config"
- No UID provided → expected behavior
- Backend returns 404 → config not published yet
- Network error → check backend URL

### "Theme not applying"
- Config fetch happens after theme injection
- Need to re-inject theme after config loads
- Call `injectTheme()` again after fetch

## 📞 Need Help?

1. Check backend logs: `gcloud run logs read --service=store-printer-backend`
2. Check frontend console for errors
3. Test API endpoints with Postman/Thunder Client
4. Verify Firestore has the document: Firebase Console → Firestore → `store_configs/{uid}`

---

**You're all set! 🎉**

Your Store Printer system is now fully integrated and ready to generate custom storefronts for your clients.
