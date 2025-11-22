# 🌊 MOON TIDE Stripe Checkout Architecture Report
## Complete Technical Analysis for Development Team

---

## Executive Summary

Your Stripe payment system is a sophisticated, **card-only** payment architecture that handles both **workshop bookings** and **product purchases** through a unified payment flow. The system uses a "Golden Record" pattern where customer data (name, email, phone) flows from frontend → Stripe → Firestore, maintaining a single source of truth for transaction data.

**Key Fact**: Your system **only accepts credit/debit cards** — NO Google Pay, Apple Pay, Klarna, or other payment methods.

---

## Part 1: Frontend Payment Flow (MOON-FRONTEND)

### 1.1 Stripe Checkout Module Location
**File**: `public/js/ui-modules/modules/stripe-checkout.js` (622 lines)

### 1.2 User Data Collection (Name, Email, Phone)

The checkout form collects three pieces of customer information:

```javascript
// Lines 158-160: Customer Information Section
<input type="text" id="customer-name" placeholder="Full Name" required>
<input type="email" id="customer-email" placeholder="Email Address" required>
<input type="tel" id="customer-phone" placeholder="Phone Number" required>
```

**Where Data is Used**:
1. **In Browser Memory** (Lines 414-416): Captured when user submits form
2. **Passed to Stripe** (Lines 426-433): Sent as `billing_details` to `confirmCardPayment()`
3. **Sent to Backend** (Lines 509-523): Forwarded in orchestrator payload

### 1.3 Stripe Card Element (Card-Only Configuration)

**Critical Code - Lines 315-335**:

```javascript
// --- CARD ELEMENT (Card Only - No Klarna/BNPL/Wallets) ---
const cardElement = this.elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a1a1a',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '::placeholder': { color: '#98a2b3' }
        },
        invalid: {
            color: '#dc3545',
            iconColor: '#dc3545'
        }
    },
    hidePostalCode: false
});
this.cardElement = cardElement;
cardElement.mount('#stripe-card-element');
console.log('[StripeCheckout] ✅ Card Element mounted (card only - no Klarna)');
```

**Why This is Card-Only**:
- Uses **Stripe's `card` Element type** (basic card input)
- Does NOT use `payment` Element (which would enable Apple Pay, Google Pay, Klarna, etc.)
- No Stripe Express or Payment Request API integration
- Only `payment_method_types: ['card']` is passed to backend

### 1.4 Payment Submission Flow

**Lines 397-455**: Form submission process

```javascript
// Confirm payment with Stripe Card Element ONLY
const { error, paymentIntent } = await this.stripeInstance.confirmCardPayment(
    this.clientSecret,
    {
        payment_method: {
            card: this.cardElement,  // ← ONLY card, no wallets
            billing_details: {
                name: customerName,      // User-filled name
                email: customerEmail,    // User-filled email
                phone: customerPhone     // User-filled phone
            }
        }
    }
);
```

### 1.5 Order Summary Display

The checkout displays:
- **Workshop details** (image, name, participants)
- **Product items** (image, name, quantity, price)
- **Total cost** (calculated from both sources)

**Key Point**: All images and data come from `servicesConfig` and `window.cartStore` — NOT from user input.

---

## Part 2: Backend Payment Processing (MOON-BACKEND)

### 2.1 Payment Intent Creation (`/create-payment-intent`)

**File**: `main.py`, Lines 2215-2372

#### Request Payload:
```json
{
    "workshop_id": "cedar-basket",           // Optional
    "organization_type": "community",        // Optional
    "participants": 15,                      // Optional
    "requested_date": "2025-12-15",         // Optional
    "requested_time": "10:00 AM",           // Optional
    "items": [                               // Optional
        {
            "id": "shirts-1",
            "name": "Shirt #1",
            "price": 29.99,
            "quantity": 2
        }
    ]
}
```

#### What Backend Does:
1. **Calculates Workshop Cost** (if present):
   - Looks up pricing from `WORKSHOP_PRICING` dict
   - Applies per-person pricing × number of participants (min 10)
   - Stores in metadata

2. **Calculates Product Cost** (if present):
   - Multiplies item price × quantity
   - Sums all items

3. **Creates Stripe Payment Intent**:
   ```python
   intent_params = {
       'amount': int(total_amount_cents),
       'currency': 'cad',
       'payment_method_types': ['card'],  # ← CARD ONLY
       'metadata': metadata
   }
   ```

4. **Stripe Connect Integration** (Lines 2306-2336):
   - Fetches franchisee's Stripe account from Portal Firestore
   - Adds `application_fee_amount` (platform fee)
   - Adds `transfer_data` with `destination` account

#### Response:
```json
{
    "clientSecret": "pi_xxxxx_secret_yyyyy",
    "amount": 5000,
    "currency": "cad"
}
```

### 2.2 Customer Data Storage (`/store-customer`)

**File**: `main.py`, Lines 2374-2472

#### Request Payload:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "stripePaymentId": "pi_xxxxx",
    "items": [...],
    "workshopId": "cedar-basket",
    "workshopDetails": {...}
}
```

#### What Happens:
1. **Validates all fields** (name, email, phone required)
2. **Validates email format** (basic regex)
3. **Stores to Firestore**:
   ```python
   db.collection('customers').document(customer_id).set({
       'name': name,
       'email': email,
       'phone': phone,
       'stripePaymentId': stripe_payment_id,
       'items': items,
       'workshopId': workshop_id,
       'workshopDetails': workshop_details,
       'timestamp': firestore.SERVER_TIMESTAMP
   })
   ```

4. **Updates Stripe Metadata** (Lines 2446-2468):
   - Calls `stripe.PaymentIntent.modify()` to add customer details to Stripe record
   - This allows Stripe dashboard to show customer info

### 2.3 Golden Record Orchestrator (`/record-and-distribute-transaction`)

**File**: `main.py`, Lines 2483-2675

This is the **SOURCE OF TRUTH** endpoint for all transaction data.

#### Request Payload:
```json
{
    "stripePaymentId": "pi_xxxxx",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "items": [{"id": "...", "name": "...", "price": 29.99, "qty": 2}],
    "workshopId": "cedar-basket",
    "workshopDetails": {...}
}
```

#### 5-Step Process:

**STEP 1: Fetch from Stripe** (Lines 2522-2545)
```python
pi = stripe.PaymentIntent.retrieve(pi_id, expand=['latest_charge.balance_transaction'])
charge = pi.latest_charge
balance_transaction = charge.balance_transaction
```

**STEP 2: Calculate Financial Breakdown** (Lines 2550-2562)
```python
total_amount = charge.amount              # Total customer paid
stripe_fee = balance_transaction.fee      # Stripe processing fee (2.9% + $0.30)
platform_fee = pi.application_fee_amount  # Our platform fee (configured %)
franchisee_net = balance_transaction.net - platform_fee  # What franchisee gets
```

**Example Breakdown**:
- Customer pays: **$100.00**
- Stripe fee: **$3.20** (2.9% + $0.30)
- Platform fee: **$2.90** (2.9%)
- Franchisee receives: **$93.90**

**STEP 3: Construct Golden Record** (Lines 2567-2591)
```python
golden_record = {
    # Customer PII (from frontend)
    "name": data.get('name'),
    "email": data.get('email'),
    "phone": data.get('phone'),

    # Order Details (from frontend)
    "stripePaymentId": pi_id,
    "items": data.get('items'),
    "workshopId": data.get('workshopId'),
    "workshopDetails": data.get('workshopDetails'),

    # Financial Breakdown (from Stripe - THE GOLDEN SOURCE)
    "amount_total": total_amount,
    "amount_stripe_fee": stripe_fee,
    "amount_platform_fee": platform_fee,
    "amount_franchisee_net": franchisee_net,

    # Standard Fields
    "currency": charge.currency,
    "status": charge.status,
    "description": charge.description
}
```

**STEP 4: Write to MOON Firestore (BACKUP)** (Lines 2599-2606)
```python
db.collection('customers').document(pi_id).set(golden_record)
```

**STEP 5: Write to Portal Firestore (PRIMARY)** (Lines 2610-2660)
```python
PORTAL_BACKEND_URL = "https://stripe-connect-backend-338017041631.us-central1.run.app"
FRANCHISEE_ID = "fwUTBxjg4UeDQYQTKQK6B9ZJEO92"  # Mom's franchisee

portal_response = requests.post(
    f"{PORTAL_BACKEND_URL}/api/franchisees/{FRANCHISEE_ID}/transactions",
    json=golden_record,
    timeout=10
)
```

#### Return Response:
```json
{
    "status": "success",
    "message": "All records written successfully.",
    "golden_record": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1-555-1234",
        "amount_total": 10000,
        "amount_stripe_fee": 320,
        "amount_platform_fee": 290,
        "amount_franchisee_net": 9390
    }
}
```

---

## Part 3: Firestore Data Architecture

### 3.1 MOON Firestore (reconciliation-475704)

**Collections**:

#### `customers` Collection
```
/customers/{stripePaymentId}
├── name: "John Doe"
├── email: "john@example.com"
├── phone: "+1-555-1234"
├── stripePaymentId: "pi_xxxxx"
├── items: [...]
├── workshopId: "cedar-basket"
├── workshopDetails: {...}
├── amount_total: 10000 (cents)
├── amount_stripe_fee: 320
├── amount_platform_fee: 290
├── amount_franchisee_net: 9390
├── currency: "cad"
├── status: "succeeded"
└── timestamp: 2025-11-22T15:30:00Z
```

#### `sessions` Collection (Firestore)
```
/sessions/{sessionId}
├── user_id: "fingerprint_hash"
├── conversation_state: {...}
├── booking_state: {...}
├── created_at: 2025-11-22T15:00:00Z
├── last_accessed: 2025-11-22T15:30:00Z
├── ttl: 30 minutes (auto-deletes)
└── request_count: 42
```

### 3.2 Portal Firestore (stripe-connect-1029120000)

**Collections**:

#### `franchisees/{FRANCHISEE_ID}/transactions` Collection
```
/{transactionId}
├── name: "John Doe"
├── email: "john@example.com"
├── phone: "+1-555-1234"
├── stripePaymentId: "pi_xxxxx"
├── items: [...]
├── workshopId: "cedar-basket"
├── amount_total: 10000
├── amount_stripe_fee: 320
├── amount_platform_fee: 290
├── amount_franchisee_net: 9390
├── currency: "cad"
├── status: "succeeded"
└── timestamp: 2025-11-22T15:30:00Z
```

**Why Two Firestores?**
- **MOON** = Backup/archive of all transactions
- **Portal** = Primary franchisee ledger (your 2% platform fee goes here)
- If Portal write fails, backup ensures no data loss
- If Portal succeeds but MOON fails, that's acceptable

---

## Part 4: Card Processing & Stripe Configuration

### 4.1 Stripe Publishable & Secret Keys

**Frontend** (`stripe-checkout.js`, Line 24):
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51Rp7gdRuBpQt4n9NyNv9RHiHf3QOmJdETL8Boyu7uC2YUKJUz2OIXXzgAN4h91WC2F21qhXHs7T2QUbDEGCEwMeg00bJbhDvn6';
```

**Backend** (`main.py`, Lines 484-486):
```python
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
stripe.api_key = STRIPE_SECRET_KEY
```

### 4.2 Card Brands Supported

**Automatically Handled by Stripe**:
- Visa
- Mastercard
- American Express
- Discover
- Diners Club
- JCB

Your code does NOT enumerate specific brands — Stripe's card element auto-detects and displays icons.

### 4.3 Why ONLY Card, Not Google/Klarna?

**Current Implementation**:
```javascript
// Uses ONLY 'card' element type
const cardElement = this.elements.create('card', { /* ... */ });
```

**To Enable Google Pay / Apple Pay / Klarna**:
```javascript
// Would need to use 'payment' element instead
const paymentElement = this.elements.create('payment', { /* ... */ });
```

**Your Decision**:
- Card-only provides **maximum control** ✓
- Simpler checkout flow ✓
- No dependency on wallet integrations ✓
- No extra payment gateway fees ✓

---

## Part 5: Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                             │
│                                                                           │
│  User fills: [Name] [Email] [Phone] [Card Details]                     │
│  ↓                                                                        │
│  stripe.confirmCardPayment() sends CARD ONLY to Stripe                  │
│  (name, email, phone sent as billing_details)                           │
│                                                                           │
│  Stripe returns: paymentIntent with status                              │
│  ↓                                                                        │
│  Frontend sends /record-and-distribute-transaction                      │
│  Payload: {stripePaymentId, name, email, phone, items, workshopId}    │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   STRIPE SERVERS             │
        │                              │
        │  Card processed by Stripe    │
        │  Returns charge ID           │
        │  Calculates processing fee   │
        └──────────────┬───────────────┘
                       │
                       ↓
        ┌──────────────────────────────────────────────────────────┐
        │        MOON BACKEND (create-payment-intent)              │
        │                                                           │
        │  1. Retrieve PaymentIntent from Stripe                   │
        │     ↓                                                     │
        │  2. Calculate financial breakdown                        │
        │     - Stripe fee (from balance_transaction)              │
        │     - Platform fee (application_fee_amount)              │
        │     - Franchisee net (what they receive)                │
        │     ↓                                                     │
        │  3. Construct Golden Record with all data               │
        │     ↓                                                     │
        │  4. Write to MOON Firestore (BACKUP)                    │
        │     ↓                                                     │
        │  5. Write to Portal Firestore (PRIMARY)                 │
        │     via Portal Backend API                              │
        └──────────────┬─────────────────────────────────────────┘
                       │
        ┌──────────────┴────────────────────┐
        │                                   │
        ↓                                   ↓
  ┌──────────────────┐          ┌─────────────────────┐
  │  MOON Firestore  │          │  Portal Firestore   │
  │  (Backup)        │          │  (Primary Ledger)   │
  │                  │          │                     │
  │  /customers/     │          │  /franchisees/{ID}/ │
  │  {pi_xxxxx}      │          │  transactions/      │
  │                  │          │                     │
  │  - name          │          │  Same data as MOON  │
  │  - email         │          │  +                  │
  │  - phone         │          │  franchisee metrics │
  │  - all amounts   │          │                     │
  │  - timestamp     │          │  Uses for 2% fee    │
  │                  │          │  ledger             │
  └──────────────────┘          └─────────────────────┘
```

---

## Part 6: Key Technical Details for Your Team

### 6.1 Data Flow Summary

| Data | Source | Collection Method | Storage Location |
|------|--------|-------------------|------------------|
| **Name** | User input in checkout form | Custom text input (not from Stripe) | Sent to Stripe + Firestore |
| **Email** | User input in checkout form | Custom text input (not from Stripe) | Sent to Stripe + Firestore |
| **Phone** | User input in checkout form | Custom text input (not from Stripe) | Sent to Stripe + Firestore |
| **Card Number** | User input to Stripe Card Element | Stripe.js (PCI compliant) | **NEVER touches your backend** |
| **Card Expiry** | User input to Stripe Card Element | Stripe.js | **NEVER touches your backend** |
| **Card CVC** | User input to Stripe Card Element | Stripe.js | **NEVER touches your backend** |
| **Workshop Details** | Backend lookup | From WORKSHOP_PRICING | Stripe + Firestore |
| **Product Details** | Frontend cart store | window.cartStore | Stripe + Firestore |

### 6.2 Payment Method Types

**Current Configuration**:
```python
'payment_method_types': ['card']  # ← ONLY credit/debit cards
```

**What This Blocks**:
- ❌ Google Pay (would need `payment_method_types` to include `card_present` or `payment` element)
- ❌ Apple Pay (same as above)
- ❌ Klarna (would need `payment_method_types` to include `klarna`)
- ❌ Bank transfers (would need `payment_method_types` to include `sepa_debit`)

**What This Allows**:
- ✅ Visa, Mastercard, Amex, Discover, JCB, Diners Club
- ✅ Any credit/debit card globally

### 6.3 Financial Calculations

**Stripe Fee Structure**:
- 2.9% + $0.30 CAD per transaction (standard Stripe pricing)
- Calculated automatically by Stripe in `balance_transaction.fee`

**Your Platform Fee**:
- Set via environment variable: `PLATFORM_FEE_PERCENT`
- Deducted before franchisee receives payment
- Tracked in `amount_platform_fee`

**Example Calculation**:
```
Customer pays: $100.00
Stripe fee: $3.20 (2.9% + $0.30)
Your platform fee: $2.90 (2.9%)
Franchisee receives: $93.90

Breakdown in Firestore:
{
    "amount_total": 10000,           // cents
    "amount_stripe_fee": 320,        // Stripe's cut
    "amount_platform_fee": 290,      // Your platform's cut
    "amount_franchisee_net": 9390    // Their final amount
}
```

### 6.4 Stripe Connect Details

Your system uses **Stripe Connect with Destination Charges**:

```python
intent_params = {
    'amount': total_amount_cents,
    'currency': 'cad',
    'payment_method_types': ['card'],
    'application_fee_amount': platform_fee_cents,  # Your 2.9%
    'transfer_data': {
        'destination': franchisee_stripe_account_id  # Their connected account
    }
}
```

This ensures:
- Money flows to franchisee account automatically
- Platform fee is deducted before transfer
- Everything stays within Stripe (no intermediate transfers)

---

## Part 7: Security Considerations

### 7.1 What Your Backend Never Sees

**✅ Secure** (You handle this correctly):
- Card numbers
- Card expiry dates
- CVV/CVC codes
- Any card magnetic stripe data

These never touch your backend because Stripe's card element handles them directly via tokenization.

### 7.2 What Your Backend DOES See

**⚠️ Sensitive Data** (Handle with care):
- Customer name
- Customer email
- Customer phone number
- Workshop/product selection details
- Financial amounts

**Your Current Protection**:
- Firestore has access control (needs credentials)
- Data is at-rest encrypted (Google Cloud manages)
- Data is in-transit encrypted (HTTPS + TLS)

**Recommendation**:
- Enable Firestore backup/restore
- Set data retention policies
- Log all access to customer data
- Regularly audit who has Firestore access

### 7.3 Session Management

Your backend uses **Firestore-backed sessions** with:
- 30-minute TTL (auto-delete)
- Per-tab session isolation
- Fingerprint validation (HMAC-SHA256)

```python
session_manager = FirestoreSessionManager(
    project_id="reconciliation-475704",
    collection_name="sessions"
)
```

---

## Part 8: Testing & Validation

### 8.1 Test Card Numbers (from Stripe)

These work in your test environment (if using `pk_test_...`):

| Card | Number | Expiry | CVC | Result |
|------|--------|--------|-----|--------|
| Visa | 4242 4242 4242 4242 | Any future | Any 3 digits | ✅ Succeeds |
| Visa (decline) | 4000 0000 0000 0002 | Any future | Any 3 digits | ❌ Declines |
| Mastercard | 5555 5555 5555 4444 | Any future | Any 3 digits | ✅ Succeeds |
| Amex | 3782 822463 10005 | Any future | Any 4 digits | ✅ Succeeds |

### 8.2 Testing Checklist

```
□ Form fills: Name, Email, Phone fields required
□ Card validation: Invalid cards show error
□ Workshop + Products: Both together work
□ Workshops only: Calculates correctly
□ Products only: Calculates correctly
□ Financial breakdown: Correct fee calculations
□ Firestore write: Customer record appears in DB
□ Portal write: Transaction appears in Portal
□ Email confirmation: Sent to customer
```

---

## Part 9: Common Questions Answered

### Q1: Why no Google Pay / Apple Pay / Klarna?

**Your Answer**:
"We've implemented a card-only payment processor for maximum security and control. All credit and debit cards globally are supported. This keeps the checkout experience simple and secure, with no wallet dependencies or additional payment gateway fees."

### Q2: Is customer data stored securely?

**Your Answer**:
"Yes. Card data (numbers, expiry, CVC) never touches our servers — Stripe handles that. Customer PII (name, email, phone) is stored in Google Cloud Firestore with encryption at rest and in transit. Access is restricted to authorized team members only."

### Q3: How are payment fees calculated?

**Your Answer**:
"Stripe charges 2.9% + $0.30 CAD per transaction (standard processing fee). Additionally, we deduct our platform fee (currently configured % in Cloud Run). The franchisee receives the remaining amount. All fees are calculated by our backend, fetched from Stripe's official records, and stored in our ledger."

### Q4: Why are there two Firestores (MOON and Portal)?

**Your Answer**:
"MOON Firestore serves as a backup archive of all transactions. Portal Firestore is the primary ledger where franchisee payment records are maintained for accounting and 2% platform fee tracking. Dual storage ensures data redundancy and prevents payment loss in any failure scenario."

### Q5: How is the Stripe Payment ID linked to customer data?

**Your Answer**:
"The Stripe Payment ID (`pi_xxxxx`) serves as the unique document ID in Firestore. This creates a 1:1 relationship: one payment = one customer record. When we query for a payment, we automatically retrieve all associated customer details and financial breakdown."

---

## Part 10: Architecture Diagram (High-Level)

```
┌────────────────────────────────────────────────────────────────────┐
│                      MOON TIDE PAYMENT SYSTEM                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FRONTEND LAYER                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Checkout Form (stripe-checkout.js)                         │   │
│  │ - Name input field                                         │   │
│  │ - Email input field                                        │   │
│  │ - Phone input field                                        │   │
│  │ - Stripe Card Element (handles card securely)             │   │
│  │ - Submit button (enabled when all fields complete)        │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                             │
│  STRIPE LAYER (Browser)                                            │
│  ┌────────────────────┴─────────────────────────────────────┐    │
│  │ Stripe.js Library                                         │    │
│  │ - Tokenizes card securely                                │    │
│  │ - Returns Payment Intent client secret                   │    │
│  │ - Only card payment method supported                     │    │
│  │ - NO wallet integrations                                 │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                             │
│  BACKEND LAYER                                                     │
│  ┌────────────────────┴─────────────────────────────────────┐    │
│  │ Flask API (main.py)                                       │    │
│  │                                                            │    │
│  │ /create-payment-intent                                   │    │
│  │   ├─ Calculates workshop cost                            │    │
│  │   ├─ Calculates product cost                             │    │
│  │   └─ Creates Stripe PaymentIntent (card only)            │    │
│  │                                                            │    │
│  │ /record-and-distribute-transaction (ORCHESTRATOR)       │    │
│  │   ├─ STEP 1: Fetch PaymentIntent from Stripe            │    │
│  │   ├─ STEP 2: Calculate fee breakdown                    │    │
│  │   ├─ STEP 3: Construct Golden Record                    │    │
│  │   ├─ STEP 4: Write to MOON Firestore (backup)           │    │
│  │   └─ STEP 5: Write to Portal Firestore (primary)        │    │
│  │                                                            │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                             │
│  PERSISTENCE LAYER                                                 │
│  ┌────────────┬─────────────────────────┬─────────────────┐       │
│  │            │                         │                 │       │
│  ▼            ▼                         ▼                 ▼       │
│  ┌──────────────────┐    ┌──────────────────┐   ┌──────────────┐ │
│  │ MOON Firestore   │    │ Portal Firestore │   │ Stripe API   │ │
│  │ (reconciliation  │    │ (stripe-connect) │   │ (Payment     │ │
│  │ -475704)         │    │                  │   │  Record)     │ │
│  │                  │    │                  │   │              │ │
│  │ /customers/      │    │ /franchisees/    │   │ PaymentIntent│ │
│  │ {pi_xxxxx}       │    │ {ID}/            │   │ stored for   │ │
│  │                  │    │ transactions/    │   │ 90 days      │ │
│  │ - name           │    │                  │   │              │ │
│  │ - email          │    │ - name           │   │ Fees stored: │ │
│  │ - phone          │    │ - email          │   │ - Stripe fee │ │
│  │ - all amounts    │    │ - phone          │   │ - Platform   │ │
│  │ - timestamp      │    │ - all amounts    │   │   fee        │ │
│  └──────────────────┘    │ - timestamp      │   └──────────────┘ │
│                          └──────────────────┘                      │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 11: Configuration Reference

### 11.1 Environment Variables (Cloud Run)

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx              # Stripe API secret
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx         # Frontend publishable key
PLATFORM_FEE_PERCENT=2.9                     # Your platform fee %
FIRESTORE_PROJECT_ID=reconciliation-475704   # MOON Firestore
FRANCHISEE_ID=fwUTBxjg4UeDQYQTKQK6B9ZJEO92 # Mom's franchisee ID
```

### 11.2 Stripe Configuration File

**File**: `stripe_config.json` (auto-generated by `setup_stripe_and_deploy.py`)

**Structure**:
```json
{
    "workshops": {
        "cedar-basket": {
            "corporate": "price_1SKnx...",
            "community": "price_1SKnx..."
        }
    },
    "products": {
        "shirts-1": {
            "price_id": "price_1SNZly..."
        }
    }
}
```

Contains all 12 workshops + 70 products with their Stripe price IDs.

---

## Part 12: Deployment & Sync

### 12.1 File Synchronization

**Critical Sync Issue Fixed**: `functions/templates/` must stay in sync with `public/` HTML files.

```bash
# Quick sync command
for file in public/*-mobile.html public/*-desk.html; do
  filename=$(basename "$file")
  cp "$file" "functions/templates/$filename"
done
```

### 12.2 Deployment Pipeline

```
Git commit → Push to main → GitHub Actions → Firebase Deploy
                              ↓
                        .github/workflows/
                        firebase-deploy.yml
                              ↓
                   ┌─────────────────────────┐
                   │   Firebase Hosting      │
                   │   public/               │
                   │   → Live at .web.app    │
                   └─────────────────────────┘
                              +
                   ┌─────────────────────────┐
                   │   Cloud Functions      │
                   │   functions/           │
                   │   → Live endpoints     │
                   └─────────────────────────┘
```

---

## Part 13: Summary for Your Development Team

### Key Takeaways:

1. **Payment Methods**: Your system accepts **CARD ONLY**
   - Credit/debit cards globally supported
   - NO Google Pay, Apple Pay, Klarna, or other wallets
   - Stripe's card element handles tokenization securely

2. **Customer Data Collection**:
   - Name, Email, Phone filled by user in checkout form
   - Card details handled entirely by Stripe (never touch backend)
   - All customer data stored in Firestore with 1:1 mapping to Stripe Payment ID

3. **Backend Architecture**:
   - `/create-payment-intent`: Calculates costs, creates Stripe intent
   - `/record-and-distribute-transaction`: Orchestrator that fetches complete transaction from Stripe and writes "Golden Record" to both Firestores

4. **Data Flow**:
   - Frontend → Stripe (card secure)
   - Frontend → Backend (name, email, phone, payment ID)
   - Backend → Stripe API (fetch complete transaction details)
   - Backend → MOON Firestore (backup)
   - Backend → Portal Firestore (primary ledger)

5. **Financial Tracking**:
   - Stripe fee: 2.9% + $0.30 (from Stripe's official records)
   - Platform fee: Configured % (deducted for Moon Tide)
   - Franchisee receives: Remainder after both fees

6. **Security**:
   - PCI-DSS compliant (Stripe handles card tokenization)
   - Firestore encryption at rest and in transit
   - All sensitive data tracked in secure databases
   - No raw card data in your system

---

## Questions? Contact Info

For clarification on this architecture:
- **Frontend questions**: See `stripe-checkout.js` comments
- **Backend questions**: See `main.py` /create-payment-intent and /record-and-distribute-transaction functions
- **Firestore questions**: Check MOON Firestore console or Portal Firestore console

---

**Report Generated**: November 22, 2025
**Status**: COMPLETE
**Stripe Version**: 8.10.0
**Firebase SDK**: 6.5.0
**Firestore**: Google Cloud Firestore v1
