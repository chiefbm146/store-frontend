# Store Printer Portal Backend

AI-powered configuration management system for multi-tenant storefronts.

## 🎯 Purpose

This backend enables clients to:
1. **Generate** store configurations using AI (Gemini Flash 2.0)
2. **Validate** configs with bulletproof validation
3. **Store** configs in Firebase Firestore (per-user)
4. **Deploy** configs to their storefront

**NOT for frontend AI chat** - That's handled by the existing reconciliation backend.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      STORE PRINTER PORTAL                        │
│                    (Client's Admin Panel)                        │
│                                                                   │
│  Client logs in → Uses AI to describe store → Config generated  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│               STORE PRINTER PORTAL BACKEND (THIS)                │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ AI Service   │  │  Validation  │  │   Firebase   │          │
│  │ (Gemini)     │→ │  (6 passes)  │→ │  (Firestore) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  API Endpoints:                                                  │
│  • POST /api/generate - AI generates config                     │
│  • POST /api/config/:uid - Save config                          │
│  • GET /api/deploy/:uid - Frontend fetches config               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STOREFRONT (FRONTEND)                         │
│                                                                   │
│  On page load:                                                   │
│  1. Fetch config from /api/deploy/:uid                          │
│  2. Load config into frontend's config system                   │
│  3. Render store with client's theme/content                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 What's Included

```
backend/
├── server.js                      # Main Express server
├── package.json                   # Dependencies
├── .env.example                   # Environment variables template
│
├── routes/
│   ├── config.js                  # CRUD for configs
│   ├── generate.js                # AI generation
│   └── deploy.js                  # Deployment & frontend fetch
│
├── services/
│   ├── firebase-service.js        # Firestore operations
│   └── ai-service.js              # Gemini AI integration
│
├── validators/
│   └── config-validator.js        # 6-pass validation system
│
├── utils/
│   └── security.js                # Security helpers
│
└── admin-panel/
    ├── index.html                 # Admin UI
    └── admin.js                   # Admin UI logic
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `firebase-service-account.json` in the `backend/` directory

**⚠️ IMPORTANT:** Add this file to `.gitignore`!

```bash
echo "firebase-service-account.json" >> .gitignore
```

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=8080
NODE_ENV=production

# Frontend URLs (update these!)
FRONTEND_URL=https://your-storefront.web.app
PORTAL_URL=https://your-portal.web.app

# Get your Gemini API key from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Path to Firebase service account key
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Firestore collections
CONFIGS_COLLECTION=store_configs
USERS_COLLECTION=store_users
```

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:8080`

## 🔌 API Endpoints

### Generate Config with AI

**POST** `/api/generate`

Generate a store configuration from natural language.

**Request:**
```json
{
  "prompt": "I run a cozy coffee shop called Brew Haven in Vancouver. We specialize in locally roasted beans and offer barista workshops. Brand colors are warm browns and cream.",
  "config_type": "full",
  "uid": "firebase-user-id",
  "auto_save": false
}
```

**Response:**
```json
{
  "success": true,
  "config": { ...generated config... },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "timestamp": "2025-01-15T..."
}
```

**Config Types:**
- `full` - Complete store config (theme, brand, services, products, pages)
- `theme` - Theme only (colors, fonts, spacing)
- `brand` - Brand only (company info, contact, logos)
- `services` - Services only
- `products` - Products only
- `pages` - Pages content only

---

### Get User Config

**GET** `/api/config/:uid`

Fetch stored config for a user.

**Response:**
```json
{
  "success": true,
  "uid": "user-id",
  "config": { ...config object... },
  "timestamp": "2025-01-15T..."
}
```

---

### Save Config

**POST** `/api/config/:uid`

Save or update a user's config.

**Request:**
```json
{
  "config": { ...config object... },
  "validate": true,
  "strict": false
}
```

**Response:**
```json
{
  "success": true,
  "uid": "user-id",
  "message": "Config saved successfully",
  "validation": { ...validation results... }
}
```

---

### Validate Config

**POST** `/api/config/:uid/validate`

Validate a config without saving.

**Request:**
```json
{
  "config": { ...config object... },
  "strict": false
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "summary": {
    "total_errors": 0,
    "total_warnings": 2,
    "passed": true
  }
}
```

---

### Deploy Config (Frontend Fetch)

**GET** `/api/deploy/:uid`

**This is called by the STOREFRONT to fetch its configuration.**

**Response:**
```json
{
  "success": true,
  "config": { ...public config... },
  "deployed_at": "2025-01-15T...",
  "timestamp": "2025-01-15T..."
}
```

---

### Publish Config

**POST** `/api/deploy/:uid/publish`

Publish a config for deployment (marks as "published").

**Request:**
```json
{
  "config": { ...config object... },
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Config published successfully",
  "deployed_at": "2025-01-15T...",
  "frontend_url": "https://your-storefront.web.app?uid=...",
  "config_url": "https://backend.run.app/api/deploy/user-id"
}
```

---

### Get Deployment Status

**GET** `/api/deploy/:uid/status`

Check deployment status for a user.

**Response:**
```json
{
  "uid": "user-id",
  "deployed": true,
  "deployed_at": "2025-01-15T...",
  "status": "published",
  "validation": { ...validation results... },
  "frontend_url": "https://your-storefront.web.app?uid=..."
}
```

## 🔍 Validation System

The validator runs **6 validation passes**:

1. **Structure** - Overall config structure
2. **Required Fields** - All required fields present
3. **Data Types** - Correct types (colors as hex, prices as integers, etc.)
4. **Constraints** - Value constraints (min < max, valid URLs, etc.)
5. **Cross-References** - Unique IDs, no duplicates
6. **Semantics** - Warnings for placeholders, missing descriptions

**Example Validation Result:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "theme.colors.primary",
      "message": "Invalid hex color: blue. Must be #RRGGBB format",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "field": "brand.companyName",
      "message": "Company name appears to be a placeholder",
      "severity": "warning"
    }
  ]
}
```

## 🎨 Admin Panel

Visit `http://localhost:8080/admin` to access the admin panel.

**Features:**
- 🤖 Generate configs with AI
- 📝 Edit and validate configs
- 🚀 Publish configs
- 📊 Check deployment status

## 🌐 Connecting Frontend to Backend

### In Your Frontend

Add this to your frontend's initialization:

```javascript
// public/js/config/index.js

// Fetch config from backend on page load
async function fetchConfigFromBackend(uid) {
    try {
        const response = await fetch(`https://your-backend.run.app/api/deploy/${uid}`);
        const data = await response.json();

        if (data.success) {
            // Merge backend config with local config
            Object.assign(appConfig, data.config);
            console.log('✅ Config loaded from backend');
        }
    } catch (error) {
        console.warn('⚠️ Failed to fetch config from backend, using defaults');
    }
}

// Get UID from URL parameter or localStorage
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid') || localStorage.getItem('storeUID');

if (uid) {
    await fetchConfigFromBackend(uid);
}
```

## 🚢 Deployment to Google Cloud Run

### 1. Build Docker Image

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

### 2. Deploy to Cloud Run

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
gcloud run deploy store-printer-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=your-key,FRONTEND_URL=https://your-frontend.web.app"
```

### 3. Set Secret for Firebase Credentials

```bash
# Create secret
gcloud secrets create firebase-credentials --data-file=firebase-service-account.json

# Grant access
gcloud run services update store-printer-backend \
  --update-secrets=GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-credentials:latest
```

## 🔒 Security Considerations

1. **Firebase Rules** - Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /store_configs/{uid} {
      // Only authenticated users can read their own config
      allow read: if request.auth != null && request.auth.uid == uid;

      // Only authenticated users can write their own config
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

2. **CORS** - Already configured for your frontend/portal URLs
3. **API Keys** - Store in environment variables, never commit
4. **Rate Limiting** - Add if needed (not included)

## 🐛 Troubleshooting

### "Firebase not initialized"
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Verify service account JSON file exists
- Check file permissions

### "Gemini API error"
- Verify `GEMINI_API_KEY` is correct
- Check API quota at [Google AI Studio](https://makersuite.google.com/)
- Ensure billing is enabled

### "Config not found"
- Verify UID is correct
- Check Firestore collection name matches `CONFIGS_COLLECTION`
- Check Firebase console for the document

### "Validation failed"
- Review validation errors in response
- Check config structure matches frontend's expected format
- Use `/api/config/:uid/validate` endpoint for detailed errors

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API response error messages
3. Check server logs for detailed errors
4. Verify environment variables are set correctly

## 📝 License

MIT
