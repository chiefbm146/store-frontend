# Client Portal Setup - SUPER SIMPLE

## Files Created
- `public/client-portal.html` - Login page
- `public/client-dashboard.html` - Dashboard
- `public/js/client-portal.js` - Auth logic
- `public/js/client-dashboard.js` - Dashboard logic

## What You Need To Do - NOTHING FOR FRONTEND

That's it. Seriously.

Firebase Hosting automatically:
- Loads Firebase SDK from `/__/firebase/init.js`
- Initializes auth
- Handles Google Sign-in

## Backend Integration

1. **Update your `STORE-BACKEND/main.py`:**

```python
from client_api import client_api

app = Flask(__name__)
app.register_blueprint(client_api)

# ... rest of your code
```

2. **Set environment variables in Cloud Run:**
```
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
PLATFORM_FEE_PERCENT=2.5
FRONTEND_URL=https://www.aarie.ca
FIREBASE_PROJECT_ID=stores-12345
```

3. **Deploy frontend:**
```bash
cd STORE-FRONTEND
firebase deploy --only hosting --project stores-12345
```

4. **Deploy backend:**
```bash
cd STORE-BACKEND
git add .
git commit -m "Feature: Add client portal API"
git push origin main
```

## Data Structure (Auto-Created)

When a client signs in, Firestore automatically creates:

```
clients/{clientUid}/
  uid: string
  email: string
  name: string
  photoURL: string
  createdAt: timestamp
  updatedAt: timestamp

  stripe_account/
    account/
      accountId: string
      chargesEnabled: boolean
      payoutsEnabled: boolean

  products/
    {productId}/
      name, price, description, status

  transactions/
    {stripePaymentId}/
      amount_total, amount_stripe_fee, etc.
```

## How It Works

1. User clicks "Client Portal" button
2. Redirects to `/client-portal.html`
3. Clicks "Sign in with Google"
4. Firebase pops up Google login
5. User signs in
6. Firestore doc auto-created in `clients/{uid}`
7. Redirects to `/client-dashboard.html`
8. Dashboard loads products & transactions
9. User can setup Stripe Connect

## What You Have

✅ Clean code (matches stripe-front pattern)
✅ No OAuth setup needed
✅ No hardcoded config
✅ Firebase Hosting handles everything
✅ Full Stripe Connect onboarding
✅ Products & transactions display
✅ Data isolation by client UID

## Done!

Deploy and test with a real Google account.
