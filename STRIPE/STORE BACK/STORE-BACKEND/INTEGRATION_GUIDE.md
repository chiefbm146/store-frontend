# Client Portal Integration Guide

## Overview

This guide explains how to integrate the new clean Client Portal system with your existing Flask backend.

## Files Created

1. **Frontend (STORE-FRONTEND/public/)**
   - `client-portal.html` - Google Sign-in page
   - `client-dashboard.html` - Client dashboard with products & transactions
   - `js/client-portal.js` - Firebase auth logic
   - `js/client-dashboard.js` - Dashboard data loading

2. **Backend (STORE-BACKEND/)**
   - `client_manager.py` - Firestore operations for clients
   - `stripe_connector.py` - Stripe API integration
   - `client_api.py` - Flask endpoints for client operations
   - `firestore.rules` - Security rules for data isolation
   - `.env.example` - Environment variables template

## Integration Steps

### Step 1: Update main.py

Add this to your existing `main.py`:

```python
from flask import Flask
from client_api import client_api  # Import the blueprint

app = Flask(__name__)

# Register client API blueprint
app.register_blueprint(client_api)

# ... rest of your Flask setup
```

### Step 2: Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Then set these in Cloud Run secrets:
- `STRIPE_SECRET_KEY` (your test/live secret key)
- `STRIPE_PUBLISHABLE_KEY` (your test/live public key)
- `PLATFORM_FEE_PERCENT` (default: 2.5)
- `FRONTEND_URL` (https://www.aarie.ca)
- `FIREBASE_PROJECT_ID` (stores-12345)

### Step 3: Firebase Setup

**No OAuth setup needed!** Firebase handles Google Sign-in automatically.

1. **Enable Google Sign-In in Firebase:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Google" provider
   - Save

2. **Firestore Security Rules:**
   - Go to Firebase Console → Firestore Database → Rules
   - Copy contents of `firestore.rules` into the rules editor
   - Click "Publish"

### Step 4: Deploy

**Frontend:**
```bash
cd STORE-FRONTEND
firebase deploy --only hosting --project stores-12345
```

**Backend:**
```bash
cd STORE-BACKEND
git add .
git commit -m "Feature: Add clean client portal system"
git push origin main
# GitHub Actions auto-deploys to Cloud Run
```

## API Endpoints

### Stripe Setup
**POST** `/api/client/stripe-setup`
- Requires: Firebase auth token
- Body: `{ name, email }`
- Creates Stripe Express account

### Get Onboarding Link
**POST** `/api/client/stripe-onboarding-link`
- Requires: Firebase auth token
- Returns: Stripe onboarding URL
- Client completes verification

### Get Dashboard Data
**GET** `/api/client/dashboard-data`
- Requires: Firebase auth token
- Returns: Products, transactions, Stripe status

### Sync Transactions
**POST** `/api/client/sync-transactions`
- Requires: Firebase auth token
- Syncs Stripe transfers to Firestore

### Record Transaction (from MOON Frontend)
**POST** `/api/client/{client_uid}/transactions`
- No auth required (from backend services)
- Body: Transaction data with `stripePaymentId`
- Records transaction in Firestore

## User Flow

1. **Client clicks "Client Portal"** button on www.aarie.ca
2. **Redirects to `/client-portal.html`**
3. **Client signs in with Google**
   - Firebase creates user document in `clients/{uid}`
4. **Redirects to `/client-dashboard.html`**
5. **Dashboard shows:**
   - Stripe Connect status
   - Button to setup Stripe (if not done)
   - Button to complete verification (if setup but not verified)
   - List of products
   - List of transactions
   - Revenue stats
6. **Client clicks "Setup Stripe Connect"**
   - Backend creates Stripe Express account
   - Saves to Firestore under `clients/{uid}/stripe_account`
7. **Client clicks "Complete Verification"**
   - Redirects to Stripe onboarding link
   - Client completes KYC
   - Returns to dashboard
8. **Stripe account becomes active**
   - `chargesEnabled: true`
   - `payoutsEnabled: true`

## Data Structure (Firestore)

```
stores-12345/
├── clients/{clientUid}/
│   ├── uid: string
│   ├── email: string
│   ├── name: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── stripe_account/
│   │   └── account/
│   │       ├── accountId: string
│   │       ├── chargesEnabled: boolean
│   │       ├── payoutsEnabled: boolean
│   │       ├── verificationStatus: string
│   │       ├── createdAt: timestamp
│   │       └── updatedAt: timestamp
│   │
│   ├── products/{productId}/
│   │   ├── name: string
│   │   ├── price: number (cents)
│   │   ├── description: string
│   │   ├── status: "active" | "archived"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   └── transactions/{stripePaymentId}/
│       ├── stripePaymentId: string
│       ├── amount_total: number
│       ├── amount_stripe_fee: number
│       ├── amount_platform_fee: number
│       ├── amount_franchisee_net: number
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── status: "succeeded" | "failed"
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
```

## Key Features

✅ **No Webhooks** - Everything uses API calls to Stripe
✅ **Clean Code** - No dead code like `startCheckout()`
✅ **Data Isolation** - Firestore rules ensure clients only see their data
✅ **Stripe Connect** - Full onboarding flow
✅ **Real-time Dashboard** - Displays products and transactions
✅ **Firebase Auth** - Google Sign-in integrated
✅ **API Sync** - Pulls transactions from Stripe via API

## Troubleshooting

### Client sees "No Stripe account found"
- Check if Stripe account was created in Firestore
- Verify `clients/{uid}/stripe_account/account` document exists

### Transactions not showing
- Run `/api/client/sync-transactions` to sync from Stripe
- Check Firestore transaction documents exist
- Verify Firestore rules are published

### Google Sign-in failing
- Verify Google Sign-in is enabled in Firebase Console → Authentication
- Check if domain is authorized in Firebase console (usually auto-configured)
- Clear browser cache and try again

### Backend API returning 401
- Ensure Firebase token is being sent in `Authorization: Bearer {token}` header
- Verify token is not expired
- Check Firebase project ID matches in `.env`

## Security Notes

✅ Firebase Security Rules prevent cross-client data access
✅ Backend verifies Firebase tokens on all protected endpoints
✅ Stripe Express accounts are isolated by client
✅ Transactions are recorded with client UID as document owner
✅ No API keys in frontend code

## Next Steps

1. Enable Google Sign-in in Firebase Console → Authentication → Sign-in method
2. Update `.env` with Stripe keys (sk_test_... or sk_live_...)
3. Add `from client_api import client_api` and `app.register_blueprint(client_api)` to main.py
4. Publish Firestore security rules
5. Deploy frontend: `firebase deploy --only hosting --project stores-12345`
6. Deploy backend: `git push origin main` (GitHub Actions auto-deploys)
7. Test with a real client account
8. Monitor Cloud Run logs for errors: `gcloud run logs read stores-backend`
