# STORES Project - Complete Technical Overview

**Project Name:** STORES (Premium Goods Co. / Aarie)
**Repository Owner:** chiefbm146
**Last Updated:** November 22, 2025
**Status:** Production - Frontend & Backend Deployed

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Google Cloud & Firebase Setup](#google-cloud--firebase-setup)
3. [Frontend (Store Frontend)](#frontend-store-frontend)
4. [Backend (Stores Backend)](#backend-stores-backend)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Environment Variables & Secrets](#environment-variables--secrets)
7. [Domain Configuration](#domain-configuration)
8. [AI Chat Integration](#ai-chat-integration)
9. [Critical Configuration Files](#critical-configuration-files)
10. [Known Issues & Solutions](#known-issues--solutions)

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Firebase Hosting)                  │
│  https://stores-12345.web.app | https://www.aarie.ca            │
│  - Landing page (index.html)                                      │
│  - Demo store (demo-desk.html)                                    │
│  - AI Chat Interface (ai-chat-desk.html)                          │
│  - Theme injection system                                         │
│  - Service Worker (DISABLED)                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS / CORS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Google Cloud Run)                           │
│  https://stores-backend-phhl2xgwwa-uc.a.run.app                  │
│  - Flask API (/chat endpoint)                                     │
│  - AI responses (Vertex AI / Gemini 2.0 Flash)                    │
│  - Session management (Firestore)                                 │
│  - Rate limiting & security                                       │
│  - Stripe integration                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────┐   ┌──────────┐   ┌─────────────┐
    │Firestore   │Vertex AI  │ │Stripe API   │
    │(stores-    │(Gemini)   │ │(Test Mode)  │
    │12345)      │           │ │             │
    └────────┘   └──────────┘   └─────────────┘
```

---

## Google Cloud & Firebase Setup

### Active Projects

#### 1. **STORES Project** (Primary - Production)
- **Project ID:** `stores-12345`
- **Project Number:** `52450564461`
- **Region:** `us-central1`
- **Status:** ✅ Active & Deployed

**Services:**
- Firebase Hosting
- Firestore Database
- Cloud Run (Backend)
- Cloud Tasks (optional)
- Vertex AI API

#### 2. **Voice AI Production** (Secondary)
- **Project ID:** `voice-ai-prod`
- **Project Number:** `635002772564`
- **Status:** ⏳ Configured but not primary

#### 3. **Reconciliation** (Legacy - Do Not Use)
- **Project ID:** `reconciliation-475704`
- **Status:** ❌ Deprecated - All references updated to stores-12345

#### 4. **Stripe Connect Portal** (Payment Processing)
- **Project ID:** `stripe-connect-1029120000`
- **Purpose:** Stripe Connect integration for payment processing
- **Status:** ✅ Active

### Firebase Configuration

**Primary Firebase Project:** `stores-12345`

**Firestore Database:**
- Location: `us-central1`
- Collections:
  - `sessions` - User session management
  - `ip_rate_limit_shards` - Rate limiting
  - `rate_limit_shards` - Security monitoring

**Hosting Domains:**
- `stores-12345.web.app` ✅ (Default Firebase domain)
- `stores-12345.firebaseapp.com` ✅
- `www.aarie.ca` ✅ (Custom domain - active)
- `aarie.ca` ⏳ (Apex domain - DNS pending)

### Google Cloud Service Accounts

**Primary Service Account:**
- **Email:** `stores-backend-sa@stores-12345.iam.gserviceaccount.com`
- **Permissions:**
  - Firestore Editor
  - Vertex AI User
  - Cloud Run Admin
  - Cloud Tasks User
- **Credentials:** Stored in GitHub Secrets (DO NOT COMMIT)

---

## Frontend (Store Frontend)

### Repository
- **GitHub:** https://github.com/chiefbm146/store-frontend
- **Branch:** `main` (always production)
- **Last Commit:** `0285819` (Nov 22, 2025)

### Project Structure

```
STORE-FRONTEND/
├── public/                          # Firebase Hosting content
│   ├── index.html                   # Landing page
│   ├── demo-desk.html              # Demo store
│   ├── ai-chat-desk.html           # AI chat interface
│   ├── css/
│   │   ├── desktop.css
│   │   ├── ai-chat.css
│   │   └── stripe-checkout.css
│   ├── js/
│   │   ├── theme-injector.js       # Injects CSS variables
│   │   ├── clean-url.js            # URL sanitization
│   │   ├── device-detector.js      # Browser detection
│   │   ├── config/
│   │   │   ├── index.js
│   │   │   ├── core/
│   │   │   │   ├── theme.js
│   │   │   │   ├── brand.js
│   │   │   │   └── settings.js
│   │   │   └── content/
│   │   │       ├── desktop.js
│   │   │       └── demo-store.js
│   │   └── [other modules]
│   └── images/                      # Assets
├── functions/                        # Cloud Functions (DISABLED)
│   └── index.js                     # deviceRouter function
├── firebase.json                    # Firebase config
├── .firebaserc                      # Project reference
├── Deploy.bat                       # Deployment script
└── DOCS/                            # Documentation
    └── PROJECT-OVERVIEW.md          # This file
```

### Key Files & Their Purpose

**index.html** - Landing page
- Loads theme injector
- No caching - fresh load every time
- Service Worker registration DISABLED
- No sessionStorage usage

**ai-chat-desk.html** - Standalone AI Chat Page
- Full-page chat interface
- Connected to backend: `https://stores-backend-phhl2xgwwa-uc.a.run.app/chat`
- Session management with `session_id`
- CORS compatible with stores-12345 origins

**demo-desk.html** - Demo Store Page
- Modal chatbot in bottom-right corner
- Same backend integration as ai-chat-desk.html
- Demo session management

**firebase.json** - Firebase Configuration
```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [cache headers for CSS/JS/Images]
  },
  "firestore": {
    "database": "(default)",
    "location": "us-central1"
  }
}
```

**.firebaserc** - Project Reference
```json
{
  "projects": {
    "default": "stores-12345"
  }
}
```

### Important Notes

⚠️ **Service Worker Disabled:**
- Was registered in index.html
- Interfered with Firebase domain validation
- Registration code is disabled

⚠️ **Caching Disabled:**
- No sessionStorage caching
- No localStorage usage
- Fresh page load every time

---

## Backend (Stores Backend)

### Repository
- **GitHub:** https://github.com/chiefbm146/MOON-BACKEND (needs rename to store-backend)
- **Branch:** `main` (always production)
- **Status:** ✅ Deployed to Cloud Run

### Deployment

**Cloud Run Service:**
- **Name:** `stores-backend`
- **URL:** `https://stores-backend-phhl2xgwwa-uc.a.run.app`
- **Region:** `us-central1`
- **Memory:** 2GB
- **CPU:** 2 cores
- **Timeout:** 3600 seconds
- **Max Instances:** 10
- **Status:** ✅ Running

### Project Structure

```
STORE-BACKEND/
├── main.py                          # Flask app & /chat endpoint
├── session_manager.py               # Firestore session management
├── security_monitor.py              # Rate limiting & DDoS protection
├── story_engine.py                  # Story/narrative generation
├── tts_service.py                   # Text-to-speech service
├── knowledge_base.py                # Workshop/product data
├── stripe_config.json               # Stripe API configuration (DO NOT COMMIT)
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Container configuration
├── deploy-stores-backend.bat        # Windows deployment script
├── rate_limit_reset_cf/             # Cloud Function for rate limit reset
│   └── main.py
└── .github/workflows/
    └── cloud-run-deploy.yml         # CI/CD pipeline
```

### API Endpoints

#### POST `/chat`
- **Purpose:** AI chat responses
- **Request:**
  ```json
  {
    "session_id": "session_1234567890_abc",
    "prompt": "Tell me about your products",
    "device_fingerprint": "browser fingerprint"
  }
  ```
- **Response:**
  ```json
  {
    "response": "AI-generated response text",
    "context": {...},
    "action": null,
    "error": null
  }
  ```

---

## Deployment Pipeline

### Frontend Deployment

**Script:** `C:\Users\koryp\OneDrive\Desktop\Deploy.bat`

```bash
cd C:\Users\koryp\OneDrive\Desktop\STORE-FRONTEND
firebase deploy --only hosting --project stores-12345
```

**Time:** ~30 seconds

### Backend Deployment

**Script:** `C:\Users\koryp\OneDrive\Desktop\deploy-stores-backend.bat`

- Builds Docker image
- Pushes to Google Container Registry
- Deploys to Cloud Run

**Time:** 2-3 minutes

---

## Environment Variables & Secrets

### ⚠️ SECURITY CRITICAL

**Never commit secrets to GitHub!**

Store these ONLY in:
1. Google Cloud Secret Manager
2. Cloud Run environment variables
3. GitHub Secrets (for CI/CD)

### Cloud Run Environment Variables

```
GOOGLE_CLOUD_PROJECT = stores-12345
VERTEX_AI_REGION = us-central1
VERTEX_AI_MODEL_NAME = gemini-2.0-flash
FRONTEND_URL = https://stores-12345.web.app
PLATFORM_FEE_PERCENT = 2.5
FIREBASE_PROJECT_ID = stores-12345
PORTAL_PROJECT_ID = stripe-connect-1029120000
VERTEX_AI_TEMPERATURE = 0.7
VERTEX_AI_MAX_TOKENS = 1024
```

### Secrets (DO NOT COMMIT)

- `STRIPE_SECRET_KEY` - Stripe test API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe test public key
- `ADMIN_API_KEY` - Admin authentication
- `FINGERPRINT_SECRET` - Device fingerprinting
- Google service account JSON

---

## Domain Configuration

### Domains

| Domain | Type | Status | Purpose |
|--------|------|--------|---------|
| `stores-12345.web.app` | Firebase | ✅ Active | Default Firebase domain |
| `stores-12345.firebaseapp.com` | Firebase | ✅ Active | Firebase alt domain |
| `www.aarie.ca` | Custom | ✅ Active | Primary custom domain |
| `aarie.ca` | Custom | ⏳ Pending | Apex domain (DNS setup needed) |

### CORS Configuration

**Allowed Origins (in main.py):**
```
https://www.moontidereconciliation.com
https://moontidereconciliation.com
https://reconciliation-storefront.web.app
https://reconciliation-storefront.firebaseapp.com
https://voice-ai-prod.web.app
https://voice-ai-prod.firebaseapp.com
https://aarie.ca
https://www.aarie.ca
https://stores-12345.web.app
https://stores-12345.firebaseapp.com
```

**Update procedure:**
1. Add new domain to `main.py`
2. Commit & push
3. GitHub Actions auto-deploys backend
4. Test with curl or browser

---

## AI Chat Integration

### How It Works

1. User sends message in frontend
2. Frontend creates payload with `session_id` and `prompt`
3. POST request to backend `/chat` endpoint
4. Backend processes via Vertex AI (Gemini 2.0 Flash)
5. Response returned to frontend
6. Chat displays AI response

### Vertex AI Settings

- **Model:** `gemini-2.0-flash`
- **Temperature:** 0.7
- **Max Tokens:** 1024
- **Project:** `stores-12345`
- **Region:** `us-central1`

---

## Critical Configuration Files

### firebase.json

Rewrites are commented out (Cloud Functions disabled for stability)

### .firebaserc

```json
{
  "projects": {
    "default": "stores-12345"
  }
}
```

### Dockerfile

- Python 3.10 (⚠️ Deprecated - upgrade to 3.11+)
- Gunicorn server
- Port 8080

---

## Known Issues & Solutions

### Issue 1: Domain Validation Timeout
**Solution:** Service Worker disabled in index.html ✅

### Issue 2: Firebase JSON Syntax Error
**Solution:** Rewrote firebase.json with proper syntax ✅

### Issue 3: Backend Returns 403 Firestore Errors
**Solution:** Updated Firebase project IDs to stores-12345 ✅

### Issue 4: CORS Errors on Custom Domain
**Solution:** Added stores-12345 domains to CORS list ✅

---

## Quick Reference Commands

### Deploy Frontend
```bash
cd C:\Users\koryp\OneDrive\Desktop\STORE-FRONTEND
firebase deploy --only hosting --project stores-12345
```

### Deploy Backend
```bash
cd C:\Users\koryp\OneDrive\Desktop\STORE-BACKEND
docker build -t stores-backend:latest -f Dockerfile .
docker tag stores-backend:latest us-central1-docker.pkg.dev/stores-12345/stores-repo/stores-backend:latest
docker push us-central1-docker.pkg.dev/stores-12345/stores-repo/stores-backend:latest
gcloud run deploy stores-backend --region us-central1 --image us-central1-docker.pkg.dev/stores-12345/stores-repo/stores-backend:latest --memory 2Gi --cpu 2 --timeout 3600
```

### Check Backend Logs
```bash
gcloud run logs read stores-backend --region us-central1 --limit 50
```

### Push to GitHub (with PAT token)
```bash
cd C:\Users\koryp\OneDrive\Desktop\STORE-FRONTEND
git add .
git commit -m "Fix: [description]"
git push origin main
```

---

## Contact & Support

**Project Lead:** chiefbm146
**Cloud Dev Contact:** [Your Cloud Developer]
**Documentation:** This file + CLAUDE.md in project root
**Issues:** GitHub issues in respective repositories

---

**Generated by Claude Code - November 22, 2025**
**Last Updated: November 22, 2025**
