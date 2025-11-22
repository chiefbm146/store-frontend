# Portal Frontend - Moon Tide Reconciliation Franchisee Portal

**Status:** Production Ready ✅
**Last Updated:** November 9, 2025
**GCP Project:** `stripe-connect-1029120000`
**Firebase Hosting URL:** https://stripe-connect-1029120000.web.app/

---

## Overview

The Portal Frontend is a real-time franchisee dashboard for the Moon Tide Reconciliation platform. It displays transaction data from Stripe Connect payments, showing detailed financial breakdowns and customer information.

**Key Features:**
- Real-time transaction list with Firestore listeners
- Complete financial breakdown per transaction
- Customer information display (name, email, phone)
- Workshop details review
- Responsive design (desktop + mobile)
- Live data synchronization

---

## System Architecture

This is **Layer 2 (Franchisee Portal)** of the 4-layer MOON TIDE RECONCILIATION system:

```
Layer 1: MOON Storefront (Customer-Facing)
    ↓ (payment submission)
Portal Backend (MOON Backend Orchestrator)
    ↓ (Golden Record)
Layer 2: Franchisee Portal (This Project)
    ↑ (Firestore real-time listener)
```

### Key Integration Points

1. **Firestore Real-Time Listener**
   - Listens to: `franchisees/{franchisee_id}/transactions/`
   - Updates UI automatically when new transactions arrive
   - No polling needed

2. **Transaction Data Structure**
   ```javascript
   {
     stripePaymentId: "pi_3SReGF2ONyiEh5kx0kUS46u7",
     amount_total: 544500,              // cents
     amount_stripe_fee: 20177,          // cents
     amount_platform_fee: 15790,        // cents
     amount_franchisee_net: 508533,     // cents
     name: "kory peters",
     email: "korypetersbm146@gmail.com",
     phone: "6047984674",
     workshopId: "cedar-rope-bracelet",
     workshopName: "Cedar Rope Bracelet with Beads",
     workshopDate: "November 14, 2025",
     workshopTime: "afternoon",
     participantCount: 280,
     organizationType: "Corporate Team Building",
     status: "succeeded",
     createdAt: {_seconds: 1731091200}
   }
   ```

---

## Project Structure

```
stripe-front/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml        # Auto-deployment pipeline
├── public/
│   ├── index.html                     # Main portal page
│   ├── css/
│   │   └── styles.css                 # Portal styling
│   └── js/
│       └── app.js                     # Portal application logic
├── .gitignore
├── README.md                          # This file
└── CLAUDE.md                          # Development guidelines
```

---

## Local Development

### Prerequisites
- Node.js 18+ (for Firebase CLI)
- Firebase CLI: `npm install -g firebase-tools`
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/chiefbm146/stripe-front.git
cd stripe-front
```

2. Log in to Firebase:
```bash
firebase login
```

3. Select the project:
```bash
firebase use stripe-connect-1029120000
```

4. Test locally (optional):
```bash
firebase serve
# Open http://localhost:5000
```

### Development Workflow

1. Make changes to files in `public/`
2. Test locally with `firebase serve`
3. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. Push to main:
   ```bash
   git push origin main
   ```
5. GitHub Actions automatically deploys to Firebase Hosting (~1-2 minutes)

---

## CI/CD Pipeline

### Automatic Deployment

**Trigger:** Every push to `main` branch

**Process:**
```
1. GitHub detects push to main
2. GitHub Actions workflow triggered
3. Firebase CLI deploys to Firebase Hosting
4. Portal updates live at https://stripe-connect-1029120000.web.app/
5. Deployment complete (~1-2 minutes)
```

### Monitoring Deployments

- **GitHub Actions:** https://github.com/chiefbm146/stripe-front/actions
- **Firebase Console:** https://console.firebase.google.com/project/stripe-connect-1029120000/hosting/sites

### Manual Deployment (if needed)

```bash
cd stripe-front
firebase deploy --only hosting:stripe-connect-portal --project stripe-connect-1029120000
```

---

## Firebase Configuration

### Project Details
- **Project ID:** `stripe-connect-1029120000`
- **Hosting Site:** `stripe-connect-portal`
- **Firestore Database:** `stripe-connect-1029120000`
- **Region:** us-central1

### Service Account for CI/CD
- **Account:** `github-stripe-deploy@stripe-connect-1029120000.iam.gserviceaccount.com`
- **Permissions:** Firebase Admin
- **Key Storage:** GitHub Secrets `FIREBASE_SERVICE_ACCOUNT`

---

## Key Files & Functions

### `public/index.html`
Main portal page with:
- Header with branding
- Welcome message
- Transaction list container
- Real-time data binding

### `public/js/app.js`

#### `initializeFirebase()`
Initializes Firebase SDK with Firestore configuration

#### `setupFirebaseListener()`
Sets up real-time listener on `franchisees/{franchisee_id}/transactions/`

#### `loadRecentTransactionsFromFirestore()`
- Queries Firestore for recent transactions
- Processes each transaction
- Displays in portal UI
- Handles both new field names (`amount_total`) and legacy field names (`amount`)

#### `displayTransaction(txn)`
Formats transaction for display:
- Amount conversion (cents to dollars)
- Date formatting
- Workshop details
- Customer information
- Financial breakdown with 4 sections

#### Transaction Display Format
```
┌─────────────────────────────────────────┐
│ HEADER: +$5,445.00 CAD | Status: succeeded
├─────────────────────────────────────────┤
│ WORKSHOP DETAILS
│ Cedar Rope Bracelet with Beads
│ November 14, 2025 • Afternoon
│ 280 participants • Corporate Team Building
├─────────────────────────────────────────┤
│ CUSTOMER INFORMATION
│ kory peters
│ korypetersbm146@gmail.com (clickable)
│ 604-798-4674 (clickable)
├─────────────────────────────────────────┤
│ FINANCIAL BREAKDOWN
│ Total:            $5,445.00
│ Stripe Fee:       -$201.77
│ Platform Fee:     -$157.90
│ Franchisee Net:   +$5,085.33
└─────────────────────────────────────────┘
```

---

## Real-Time Updates

The portal uses Firestore listeners for instant updates:

```javascript
db.collection('franchisees').doc(franchisee_id)
  .collection('transactions')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .onSnapshot(snapshot => {
    // Display transactions in real-time as they arrive
  });
```

When MOON Backend writes a transaction to Portal Firestore, the UI automatically updates within 1-2 seconds.

---

## Backward Compatibility

The portal UI handles both old and new field names:

```javascript
// Checks new field name first, falls back to old field name
const amountValue = txn.amount_total || txn.amount;
const amount = amountValue ? (amountValue / 100).toFixed(2) : 'N/A';
```

This ensures transactions created by different systems work seamlessly.

---

## Testing

### Manual Testing

1. Complete a payment on the MOON Storefront
2. Check Portal Firestore: `franchisees/{id}/transactions/{pi_id}`
3. Portal UI should show the transaction within 1-2 seconds
4. Verify all fields display correctly:
   - Amount shows as currency (not N/A)
   - Customer info is complete
   - Financial breakdown is accurate
   - Date/time formatted correctly

### Data Verification Checklist

- ✅ Payment success in Stripe
- ✅ Transaction written to MOON Firestore
- ✅ Transaction written to Portal Firestore
- ✅ Both Firestores have identical data
- ✅ Portal UI displays correctly
- ✅ Data persists on page refresh

---

## Troubleshooting

### Issue: Portal shows "N/A" for amount

**Cause:** UI looking for wrong field name

**Solution:** Ensure `app.js` checks `amount_total` first, then `amount`
```javascript
const amountValue = txn.amount_total || txn.amount;
```

### Issue: Transactions not appearing in real-time

**Cause:** Firestore listener not set up correctly

**Solution:** Check console for errors, verify Firestore rules allow reads

### Issue: Deployment failed

**Cause:** Missing or invalid GitHub Secrets

**Solution:** Verify `FIREBASE_SERVICE_ACCOUNT` is set in GitHub repo settings

---

## GitHub Setup

### Initial Setup (Already Done)

1. ✅ Service account created: `github-stripe-deploy@stripe-connect-1029120000.iam.gserviceaccount.com`
2. ✅ JSON key generated
3. ✅ GitHub Secrets configured: `FIREBASE_SERVICE_ACCOUNT`
4. ✅ Workflow file created: `.github/workflows/firebase-deploy.yml`

### To Add This Repo to GitHub

```bash
git remote add origin https://github.com/chiefbm146/stripe-front.git
git branch -M main
git push -u origin main
```

### To Update GitHub Secrets

In GitHub repository settings → Secrets and variables → Actions:
1. Create secret: `FIREBASE_SERVICE_ACCOUNT`
2. Value: Contents of the JSON key file (user will provide)

---

## Performance Metrics

- **Page Load:** < 2 seconds
- **Real-Time Updates:** < 2 seconds (Firestore latency)
- **Firebase Deployment:** ~ 1-2 minutes
- **Data Display:** Instant (once loaded)

---

## Security Considerations

### Firestore Rules
- Only authenticated franchisee can view their transactions
- Service account has Firebase Admin role for CI/CD

### Secrets Management
- JSON key stored in GitHub Secrets (NOT in repository)
- Never commit service account keys
- Rotate keys periodically

### Data Access
- Portal only shows transactions for logged-in franchisee
- No cross-franchisee data leakage
- All communication via HTTPS

---

## Future Enhancements

1. **Advanced Filtering**
   - Filter by date range
   - Filter by amount/status
   - Search by customer name

2. **Export Functionality**
   - CSV export of transactions
   - PDF reports
   - Email summaries

3. **Analytics Dashboard**
   - Revenue charts
   - Customer statistics
   - Top workshops

4. **Multi-Language Support**
   - Internationalization (i18n)
   - Locale-specific formatting

---

## Development Guidelines

See `CLAUDE.md` for detailed development guidelines and best practices.

---

## Contact & Support

- **Repository:** https://github.com/chiefbm146/stripe-front
- **Live Portal:** https://stripe-connect-1029120000.web.app/
- **Firebase Console:** https://console.firebase.google.com/project/stripe-connect-1029120000/hosting
- **GitHub Actions:** https://github.com/chiefbm146/stripe-front/actions

---

**Last Updated:** November 9, 2025
**Maintained By:** Kory Peters
**Status:** Production Ready ✅
# CI/CD test
# Deployment test $(date)
# Retry $(date)
# Deploy $(date)
# Final test $(date)
