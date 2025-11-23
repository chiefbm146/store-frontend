# Switching from Connect to Direct Payments

## Status: ✅ COMPLETE & FULLY TESTED

Direct payments are live with full email notifications working!

- **Test Payment:** $0.50 CAD confirmed
- **Owner Email:** ✅ Working (Gmail SMTP webhook)
- **Customer Email:** ✅ Working (Stripe automatic receipt)

---

## System Overview

```
Customer pays $299.00
        ↓
Stripe processes payment
        ↓
Webhook fires → YOU get email notification (Gmail)
        ↓
Stripe sends receipt → CUSTOMER gets email (automatic)
        ↓
Order saved to Firestore (orders collection)
        ↓
YOU receive ~$287.64 (minus Stripe fees)
```

---

## What Was Built

### 1. Direct Payments (No Connect)

**Removed:**
- `store_stripe_account_id` hardcoded Express account
- `application_fee_amount` platform fee calculation
- `transfer_data` destination charges

**Added:**
- Server-side `PRODUCT_PRICING` dictionary (secure - can't be manipulated)
- Direct payment to your Stripe account

### 2. Webhook System (`/webhook/stripe`)

Handles these Stripe events:
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Saves to Firestore `orders`, sends you email |
| `payment_intent.payment_failed` | Logs to `failed_payments` collection |
| `charge.refunded` | Updates order status to "refunded" |
| `charge.dispute.created` | Saves to `disputes` collection (alerts you) |

### 3. Email Notifications

**Owner (You):**
- Gmail SMTP sends "💰 New Sale!" email on every successful payment
- Includes: Amount, Product, Customer email, Payment ID, Stripe Dashboard link

**Customer:**
- Stripe sends automatic receipt (enabled in Stripe Dashboard)
- `receipt_email` passed when creating PaymentIntent

### 4. Secure Product Pricing

```python
PRODUCT_PRICING = {
    'custom-store': {
        'name': 'Custom Store - One-Time Payment',
        'price': 29900,  # $299.00 in cents
        'description': 'Complete custom store built in 24-48 hours'
    },
    'test-buy': {
        'name': 'Test Buy',
        'price': 50,  # $0.50 in cents
        'description': 'Test product for payment verification'
    }
}
```

Frontend only sends `product_id` - backend looks up price server-side. Users cannot manipulate prices.

---

## Environment Variables (Cloud Run)

| Name | Secret (in Secret Manager) | Purpose |
|------|---------------------------|---------|
| `STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Live Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | `WEBHOOK_SECRET` | Webhook signature verification |
| `GMAIL_USER` | `GMAIL_USER` | Gmail address for sending |
| `GMAIL_APP_PASSWORD` | `GMAIL_APP_PASSWORD` | Gmail App Password (no spaces) |

**Note:** The "Name" is what code looks for. The "Secret" is what you stored in Secret Manager.

---

## Stripe Dashboard Settings

### Webhook
- **URL:** `https://stores-backend-phhl2xgwwa-uc.a.run.app/webhook/stripe`
- **Events:** `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `payment_intent.created`, `charge.refunded`, `charge.refund.updated`, `charge.dispute.created`

### Customer Emails
- **Location:** Settings → Business → Customer emails
- **Enabled:** "Successful payments" ✅

---

## Files Changed

### Backend (`STORE-BACKEND/main.py`)
- Added `STRIPE_WEBHOOK_SECRET` env var loading
- Added `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFICATION_EMAIL` config
- Added `send_sale_notification()` function (Gmail SMTP)
- Added `PRODUCT_PRICING` dictionary
- Added `/webhook/stripe` endpoint
- Updated `is_bot_request()` to allow Stripe webhooks
- Updated `/create-payment-intent` to use server-side pricing + `receipt_email`

### Frontend (`STORE-FRONTEND/public/checkout.html`)
- Updated to live Stripe publishable key
- Sends only `product_id` + `customer_email` to backend
- PaymentIntent created on submit (not page load) to capture email

### Frontend (`STORE-FRONTEND/public/store-booking.html`)
- Top button → $299 custom-store
- Bottom button → $0.50 test-buy (temporary)

---

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `orders` | All successful payments (from webhook) |
| `failed_payments` | Failed payment attempts |
| `disputes` | Chargebacks requiring attention |
| `customers` | Customer info (from /store-customer endpoint) |

---

## Adding New Products

1. Add to `PRODUCT_PRICING` in `main.py`:
```python
'new-product': {
    'name': 'Product Name',
    'price': 9900,  # $99.00 in cents
    'description': 'Description here'
}
```

2. Deploy backend:
```bash
gcloud run deploy stores-backend --source . --region us-central1
```

3. Link to checkout with: `/checkout.html?product=new-product&name=Product%20Name&price=9900`

---

## Testing Checklist

- [x] Direct payment works (no Connect)
- [x] Server-side pricing (secure)
- [x] Webhook receives events (bot detection bypassed for Stripe)
- [x] Owner gets email notification (Gmail SMTP)
- [x] Customer gets Stripe receipt
- [x] Orders saved to Firestore
- [x] Test product ($0.50) works

---

## Quick Reference

| What | Value |
|------|-------|
| Backend URL | `https://stores-backend-phhl2xgwwa-uc.a.run.app` |
| Webhook endpoint | `/webhook/stripe` |
| Notification email | `korypetersbm146@gmail.com` |
| Stripe mode | **LIVE** |
| Currency | CAD |

---

*Last Updated: November 22, 2025*
*Fully tested with $0.50 payment - Owner AND Customer emails confirmed working!*
