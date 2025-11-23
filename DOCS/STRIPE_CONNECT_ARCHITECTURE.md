# Stripe Connect Platform Architecture

## Overview

This is a **Stripe Connect** platform using **Destination Charges** with **Express Accounts**.

- **Platform Owner (You - AARIE)**: Owns the main Stripe account, collects platform fees
- **Clients (Franchisees)**: Have Express accounts linked to your platform, receive payments minus fees

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER                                        │
│                         (Pays $299.00 CAD)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE FRONTEND                                       │
│              https://stores-12345.web.app                                   │
│                                                                              │
│  Files:                                                                      │
│  - public/js/client-dashboard.js (Client portal)                            │
│  - public/client-dashboard.html                                             │
│  - public/client-portal.html (Login page)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE BACKEND (Cloud Run)                            │
│         https://stores-backend-phhl2xgwwa-uc.a.run.app                      │
│                                                                              │
│  Files:                                                                      │
│  - main.py (Main Flask app, payment intents)                                │
│  - client_api.py (Client portal endpoints)                                  │
│  - client_manager.py (Firestore operations, transaction sync)               │
│  - stripe_connector.py (Stripe API wrapper)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│         STRIPE                │    │        FIRESTORE              │
│   Platform Account            │    │   Project: stores-12345       │
│                               │    │                               │
│ Platform Stripe Account:      │    │ Collections:                  │
│ acct_1SPQ3W2ONyiEh5kx        │    │ - clients/{uid}               │
│ (Your main account)           │    │ - clients/{uid}/stripe_account│
│                               │    │ - clients/{uid}/transactions  │
│ Connected Express Account:    │    │ - clients/{uid}/products      │
│ acct_1SWJwYRtbHaiLnso        │    │                               │
│ (Client's account)            │    │                               │
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## Payment Flow (Destination Charges)

```
Customer pays $299.00
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Frontend calls POST /create-payment-intent                   │
│    - amount: 29900 (cents)                                      │
│    - Includes client's Stripe account ID in transfer_data       │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend creates PaymentIntent with:                          │
│    - amount: 29900                                              │
│    - application_fee_amount: 747 (2.5% platform fee)            │
│    - transfer_data: { destination: "acct_1SWJwYRtbHaiLnso" }   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Stripe processes payment:                                    │
│    - Charges customer: $299.00                                  │
│    - Stripe takes processing fee: ~$11.36 (from platform)       │
│    - Platform collects: $7.47 (application_fee)                 │
│    - Transfer to connected account: $299.00 - $7.47 = $291.53   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Transaction Sync (on client login):                          │
│    - Backend fetches Transfers from Stripe API                  │
│    - Extracts charge details, platform fee                      │
│    - Saves to Firestore: clients/{uid}/transactions/{pi_xxx}    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key IDs and Their Meanings

### Firebase UIDs (Authentication)
```
PPcjUmfXGpMnqvsyvoyXgm6IRbh2  = Client's Firebase Auth UID
                                (korypeters73@gmail.com - test client)
```

### Stripe Account IDs
```
acct_1SPQ3W2ONyiEh5kx  = YOUR Platform Stripe Account (AARIE)
                         This is extracted from your STRIPE_SECRET_KEY

acct_1SWJwYRtbHaiLnso  = Client's Express Account
                         Created when client onboards via Stripe Connect
```

### Stripe Object IDs
```
pi_xxx  = PaymentIntent ID (e.g., pi_3SWPSk2ONyiEh5kx01eMVIxV)
          Used as Firestore document ID for idempotency

ch_xxx  = Charge ID (e.g., ch_3SWPSk2ONyiEh5kx0Z6I8Fwe)
          The actual charge on the customer's card

tr_xxx  = Transfer ID (e.g., tr_3SWPSk2ONyiEh5kx0CkUSfMj)
          Money movement from platform to connected account
```

---

## Firestore Database Structure

```
stores-12345 (Firebase Project)
│
└── clients (collection)
    │
    └── {firebase_uid} (document, e.g., PPcjUmfXGpMnqvsyvoyXgm6IRbh2)
        │
        ├── Fields:
        │   ├── uid: "PPcjUmfXGpMnqvsyvoyXgm6IRbh2"
        │   ├── email: "korypeters73@gmail.com"
        │   ├── name: "Kory Peters"
        │   ├── createdAt: timestamp
        │   └── updatedAt: timestamp
        │
        ├── stripe_account (subcollection)
        │   └── account (document)
        │       ├── accountId: "acct_1SWJwYRtbHaiLnso"
        │       ├── chargesEnabled: true
        │       ├── payoutsEnabled: true
        │       ├── verificationStatus: "verified"
        │       ├── createdAt: timestamp
        │       └── updatedAt: timestamp
        │
        ├── transactions (subcollection)
        │   └── {payment_intent_id} (document, e.g., pi_3SWPSk2ONyiEh5kx01eMVIxV)
        │       ├── stripePaymentId: "pi_3SWPSk2ONyiEh5kx01eMVIxV"
        │       ├── chargeId: "ch_3SWPSk2ONyiEh5kx0Z6I8Fwe"
        │       ├── transferId: "tr_3SWPSk2ONyiEh5kx0CkUSfMj"
        │       ├── amount: 29900 (cents)
        │       ├── amount_total: 29900
        │       ├── amount_platform_fee: 747
        │       ├── currency: "cad"
        │       ├── status: "succeeded"
        │       ├── name: "kory peters"
        │       ├── email: "korypetersbm146@gmail.com"
        │       ├── phone: "6047984674"
        │       ├── description: "Custom Store - Complete build in 24-48 hours"
        │       ├── receipt_url: "https://pay.stripe.com/receipts/..."
        │       ├── createdAt: timestamp
        │       └── updatedAt: timestamp
        │
        └── products (subcollection)
            └── {product_id} (document)
                ├── name: "Custom Store"
                ├── description: "Complete build in 24-48 hours"
                ├── price: 29900 (cents)
                ├── status: "active"
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

---

## Environment Variables (Cloud Run)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SPQ3W2ONyiEh5kx...  # Your platform's secret key
STRIPE_PUBLISHABLE_KEY=pk_test_51SPQ3W2ONyiEh5kx...  # Your platform's publishable key
PLATFORM_FEE_PERCENT=2.5  # Platform fee percentage (AARIE takes 2.5%)

# Firebase Configuration
FIREBASE_PROJECT_ID=stores-12345
GOOGLE_CLOUD_PROJECT=stores-12345

# Frontend URL (for Stripe redirects)
FRONTEND_URL=https://www.aarie.ca
```

---

## Backend API Endpoints

### Client Portal Endpoints (`client_api.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/client/dashboard-data` | GET | Get all dashboard data (account, products, transactions) |
| `/api/client/stripe-setup` | POST | Create new Stripe Express account for client |
| `/api/client/stripe-onboarding` | GET | Get Stripe onboarding link |
| `/api/client/stripe-account/delete` | POST | Delete client's Stripe account |
| `/api/client/sync-transactions` | POST | Sync transactions from Stripe to Firestore |
| `/api/client/stripe-dashboard-link` | GET | Get login link for client's Stripe Express dashboard |
| `/api/client/{uid}/transactions` | POST | Record a transaction (called by storefront) |

### Payment Endpoints (`main.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create-payment-intent` | POST | Create payment intent for checkout |

---

## Frontend Files

### Client Dashboard (`public/js/client-dashboard.js`)

**Key Variables:**
```javascript
const API_BASE_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';
```

**Key Functions:**
- `loadDashboard()` - Main function, loads all data on page load
- `loadStripeStatus()` - Fetches Stripe account status
- `loadTransactions()` - Syncs and displays transactions
- `handleStripeSetup()` - Creates new Express account
- `handleOnboarding()` - Opens Stripe onboarding
- `handleDeleteAccount()` - Deletes Express account (with confirmation)
- `openStripeDashboard()` - Opens client's Stripe Express dashboard

---

## Transaction Sync Logic (`client_manager.py`)

The `sync_transactions_from_stripe()` function:

1. **Fetches Transfers** from Stripe API (transfers TO the connected account)
2. **For each Transfer:**
   - Gets the source charge (expanded with `source_transaction`)
   - Extracts `payment_intent_id` as document ID
   - Fetches PaymentIntent to get `application_fee_amount`
   - Checks if transaction exists in Firestore
   - If missing or invalid breakdown → saves/updates
3. **Saves to Firestore** with fields:
   - `amount_total` - What customer paid
   - `amount_platform_fee` - What AARIE collected (from PaymentIntent)
   - Customer details (name, email, phone from billing_details)

**Validation Check:**
```python
# Skip if already has valid breakdown
has_breakdown = 'amount_platform_fee' in existing_data
```

---

## Setting Up a New Client

### 1. Client Signs Up (Firebase Auth)
- Client creates account via `/client-portal.html`
- Firebase Auth creates UID (e.g., `PPcjUmfXGpMnqvsyvoyXgm6IRbh2`)

### 2. Client Sets Up Stripe (Express Account)
- Client clicks "Set Up Stripe Account"
- Backend calls `stripe.Account.create(type='express')`
- Stripe returns `acct_xxx` ID
- Saved to Firestore: `clients/{uid}/stripe_account/account`

### 3. Client Completes Onboarding
- Client clicks "Complete Onboarding"
- Redirects to Stripe's hosted onboarding
- After completion, `chargesEnabled` and `payoutsEnabled` become `true`

### 4. Client Receives Payments
- When customer pays, money flows:
  - Customer → Platform → Connected Account (minus fees)
- Transactions sync automatically on dashboard load

---

## Setting Up YOUR OWN Store (Not as a Client)

If you want to sell directly (not through a client's Express account):

### Option 1: Direct Charges (No Connect)
Remove `transfer_data` and `application_fee_amount` from payment intent:
```python
intent = stripe.PaymentIntent.create(
    amount=amount,
    currency='cad',
    payment_method_types=['card'],
    # NO transfer_data, NO application_fee_amount
)
```

### Option 2: Use Your Own Express Account
Create an Express account for yourself and use it like any other client.

### Option 3: Platform Account Direct
Payments go directly to your platform account (acct_1SPQ3W2ONyiEh5kx).

---

## Testing

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### Test Stripe Account
```
Platform: sk_test_51SPQ3W2ONyiEh5kx... (Your test key)
Connected: acct_1SWJwYRtbHaiLnso (Test Express account)
```

---

## Common Issues & Solutions

### "Synced 0 transactions"
- Transactions already exist with breakdown data
- Delete transactions in Firestore to force re-sync

### "No Stripe account found"
- Client hasn't completed Stripe setup
- Check `clients/{uid}/stripe_account/account` exists

### "Failed to fetch" on API calls
- Check CORS configuration in `main.py`
- Verify endpoint path matches blueprint prefix (`/api/client/...`)

### Wrong breakdown amounts
- The `amount_platform_fee` comes from Stripe's `application_fee_amount`
- Stripe processing fees are NOT stored (they vary and are taken from platform)

---

## File Locations

### Backend (STORE-BACKEND)
```
C:\Users\koryp\OneDrive\Desktop\STORE-BACKEND\
├── main.py                 # Main Flask app
├── client_api.py           # Client portal endpoints
├── client_manager.py       # Firestore operations
├── stripe_connector.py     # Stripe API wrapper
├── Dockerfile              # Cloud Run deployment
└── requirements.txt        # Python dependencies
```

### Frontend (STORE-FRONTEND)
```
C:\Users\koryp\OneDrive\Desktop\STORE-FRONTEND\
├── public/
│   ├── client-portal.html      # Login page
│   ├── client-dashboard.html   # Dashboard UI
│   └── js/
│       └── client-dashboard.js # Dashboard logic
└── DOCS/
    └── STRIPE_CONNECT_ARCHITECTURE.md  # This file
```

---

## Quick Reference

| What | Value |
|------|-------|
| Firebase Project | stores-12345 |
| Cloud Run URL | https://stores-backend-phhl2xgwwa-uc.a.run.app |
| Frontend URL | https://stores-12345.web.app |
| Platform Fee | 2.5% |
| Stripe Mode | Test (sk_test_...) |
| Charge Type | Destination Charges |
| Account Type | Express |

---

*Last Updated: November 22, 2025*
