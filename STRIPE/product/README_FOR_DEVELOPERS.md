# 📋 MOON TIDE Stripe Payment System - Developer Documentation

**Report Date**: November 22, 2025
**Status**: Complete Technical Analysis
**Audience**: Development Team

---

## 📚 Generated Documentation Files

We've created **4 comprehensive documents** for you:

1. **STRIPE_PAYMENT_ARCHITECTURE_REPORT.md** (13 parts, ~500 lines)
   - Complete technical deep-dive
   - Code examples and file references
   - Firestore schema explanations
   - Step-by-step payment flow

2. **STRIPE_QUICK_SUMMARY.txt** (5 sections)
   - Executive summary format
   - Key takeaways for quick reference
   - FAQ section
   - Perfect for onboarding new developers

3. **DATA_FLOW_DIAGRAM.txt** (10 sections)
   - Visual representation of data movement
   - Timeline of each step
   - Where data is stored
   - Security considerations

4. **PAYMENT_METHODS_CONFIGURATION.txt** (13 sections)
   - Detailed payment method breakdown
   - What's supported vs blocked
   - Why card-only was chosen
   - How to add wallets/Klarna if needed

**This README** - Quick navigation guide

---

## 🎯 Quick Answers to Common Questions

### Q: "How does the user's name, email, and phone get stored?"

**A**: User fills three form fields in the checkout:
- Name field → Sent to Stripe → Stored in Firestore
- Email field → Sent to Stripe → Stored in Firestore
- Phone field → Sent to Stripe → Stored in Firestore

**See**: `DATA_FLOW_DIAGRAM.txt` (Section 1-6)

---

### Q: "Does the Stripe checkout use card, Google Pay, Klarna, or what?"

**A**: **Card only** — Credit and debit cards globally.
- ✅ Visa, Mastercard, Amex, Discover, JCB
- ❌ No Google Pay, Apple Pay, Klarna, bank transfers

**Why?** Maximum control, security, and simplicity.

**See**: `PAYMENT_METHODS_CONFIGURATION.txt` (Sections 1-5)

---

### Q: "How does the backend link customer data to Stripe payments?"

**A**: The Stripe Payment ID (`pi_xxxxx`) is the document key in Firestore.

```
Stripe Payment Intent: pi_abc123
         ↓
Firestore document: /customers/pi_abc123
         ↓
Contains: {name, email, phone, items, amounts, ...}
```

1:1 mapping ensures one payment = one customer record.

**See**: `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md` (Part 3.1-3.2)

---

### Q: "Where is the card number stored?"

**A**: **Nowhere in your system.**
- Card number typed in Stripe Card Element
- Tokenized by Stripe (PCI-DSS compliant)
- Only Stripe sees the actual card number
- Your backend receives only a token/status

This is why your system is PCI-compliant.

**See**: `DATA_FLOW_DIAGRAM.txt` (Section 2 and 10)

---

### Q: "What fees are charged?"

**A**: Two layers:
1. **Stripe fee**: 2.9% + $0.30 CAD (fixed by Stripe)
2. **Platform fee**: Configured % (from PLATFORM_FEE_PERCENT env var)

**Example**: Customer pays $100
- Stripe takes: $3.20 (2.9% + $0.30)
- Your platform takes: $2.90 (2.9%)
- Franchisee gets: $93.90

**See**: `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md` (Part 6.3)

---

### Q: "Why are there two Firestores (MOON and Portal)?"

**A**: Dual storage for data redundancy:
- **MOON Firestore** = Backup/archive (your database)
- **Portal Firestore** = Primary ledger (franchisee's database)

If Portal fails, MOON has the data. If MOON fails, Portal succeeded anyway.

**See**: `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md` (Part 3)

---

### Q: "How do we know the backend is fetching the correct data from Stripe?"

**A**: The orchestrator endpoint does 5 steps:

1. Fetches PaymentIntent from Stripe
2. Gets actual charge and balance_transaction from Stripe
3. Calculates fees using Stripe's official numbers
4. Writes to MOON Firestore
5. Writes to Portal Firestore

Stripe is the **source of truth** for financial data.

**See**: `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md` (Part 2.3)

---

## 🔍 File-by-File Breakdown

### Frontend Files

**`public/js/ui-modules/modules/stripe-checkout.js`** (622 lines)
- Renders checkout UI
- Collects name, email, phone
- Handles Stripe card element (card-only)
- Submits payment to backend
- **Key sections**:
  - Lines 158-160: Customer info fields
  - Lines 173-181: Card payment section
  - Lines 315-335: Card element (card-only config)
  - Lines 414-431: Form submission
  - Lines 509-523: Orchestrator payload

**`public/css/stripe-checkout.css`**
- Styles for checkout overlay
- Responsive design for mobile/desktop
- Card element styling

---

### Backend Files

**`main.py`**
- `/create-payment-intent` (lines 2215-2372)
  - Calculates workshop + product costs
  - Creates Stripe PaymentIntent
  - Returns clientSecret

- `/record-and-distribute-transaction` (lines 2483-2675)
  - THE GOLDEN RECORD ORCHESTRATOR
  - Fetches transaction from Stripe
  - Calculates fee breakdown
  - Writes to both Firestores

**`setup_stripe_and_deploy.py`** (25,000+ bytes)
- Creates 12 workshops in Stripe
- Creates 70 products in Stripe
- Generates stripe_config.json
- Auto-runs on deployment

**`stripe_config.json`**
- Price IDs for all workshops
- Price IDs for all products
- Used by backend to determine costs

---

### Database Structure

**MOON Firestore** (`reconciliation-475704`)
```
/customers/{stripePaymentId}
  ├── name: string
  ├── email: string
  ├── phone: string
  ├── stripePaymentId: string
  ├── items: array
  ├── workshopId: string
  ├── workshopDetails: object
  ├── amount_total: number
  ├── amount_stripe_fee: number
  ├── amount_platform_fee: number
  ├── amount_franchisee_net: number
  ├── currency: string
  ├── status: string
  └── timestamp: timestamp
```

**Portal Firestore** (`stripe-connect-1029120000`)
```
/franchisees/{FRANCHISEE_ID}/transactions/{pi_id}
  └── [Same structure as MOON]
```

---

## 🔐 Security Checklist

- [ ] Card data never touches backend ✓ (Stripe handles)
- [ ] HTTPS only for all API calls
- [ ] Firestore has access control rules
- [ ] Secrets in environment variables (not hardcoded)
- [ ] HMAC-SHA256 session validation
- [ ] Rate limiting enabled on payment endpoints
- [ ] Regular backups of Firestore
- [ ] Audit logging enabled
- [ ] PCI-DSS compliance verified

---

## 📊 Integration Points

### Frontend → Stripe
```javascript
stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name, email, phone
    }
  }
})
```

### Frontend → Backend
```javascript
POST /record-and-distribute-transaction
{
  stripePaymentId, name, email, phone, items, workshopId
}
```

### Backend → Stripe
```python
pi = stripe.PaymentIntent.retrieve(pi_id)
charge = pi.latest_charge
balance_transaction = charge.balance_transaction
```

### Backend → Portal
```python
requests.post(
  "https://stripe-connect-backend-.../transactions",
  json=golden_record
)
```

---

## 🚀 Testing Checklist

```
Core Functionality:
□ Fill name, email, phone fields
□ Enter card details (test card)
□ Click "Pay" button
□ Payment succeeds in Stripe
□ Customer record appears in MOON Firestore
□ Transaction appears in Portal Firestore
□ Frontend shows success message
□ User receives email confirmation

Workshop Booking:
□ Select workshop
□ Choose organization type
□ Enter participants
□ Request date/time
□ Enter name, email, phone
□ Complete payment
□ All details stored in Firestore

Products:
□ Add products to cart
□ Enter name, email, phone
□ Complete payment
□ Items stored in Firestore

Error Handling:
□ Invalid card shows error
□ Missing fields shows error
□ Network error handled gracefully
□ Timeout handled gracefully

Financial Verification:
□ Stripe fee calculated correctly
□ Platform fee calculated correctly
□ Franchisee net amount correct
□ All amounts in cents/currency correct
```

---

## 📞 Key People & Resources

### Firestore Consoles
- **MOON Firestore**: `https://console.firebase.google.com/project/reconciliation-475704`
- **Portal Firestore**: `https://console.firebase.google.com/project/stripe-connect-1029120000`

### Stripe Dashboard
- **Stripe Account**: `https://dashboard.stripe.com`
- **Live Key**: `pk_live_51Rp7gdRuBpQt4n9N...`
- **Test Card**: `4242 4242 4242 4242` (any future expiry, any CVC)

### Deployment
- **Frontend**: Firebase Hosting at `https://reconciliation-storefront.web.app`
- **Backend**: Cloud Run at `https://reconciliation-backend-934410532991.us-central1.run.app`

---

## 🎓 Learning Path for New Developers

1. **Start here**: `STRIPE_QUICK_SUMMARY.txt` (10 min read)
2. **Visual understanding**: `DATA_FLOW_DIAGRAM.txt` (15 min read)
3. **Payment methods**: `PAYMENT_METHODS_CONFIGURATION.txt` (10 min read)
4. **Deep dive**: `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md` (30 min read)
5. **Code review**: Walk through the actual files listed above
6. **Testing**: Test the checkout flow end-to-end in staging

---

## ⚠️ Common Mistakes to Avoid

❌ **Don't** hardcode Stripe keys in frontend code
✅ **Do** use environment variables for secrets

❌ **Don't** try to store card numbers
✅ **Do** let Stripe handle card tokenization

❌ **Don't** skip the orchestrator endpoint
✅ **Do** fetch transaction details from Stripe

❌ **Don't** store customer data without Firestore
✅ **Do** use Firestore for all customer records

❌ **Don't** forget to sync Firestore writes between MOON and Portal
✅ **Do** verify both writes succeed (or handle gracefully)

---

## 🔄 Maintenance Tasks

### Weekly
- [ ] Monitor failed payments in Stripe dashboard
- [ ] Check Firestore for any write errors
- [ ] Verify Portal backend is responding

### Monthly
- [ ] Review Firestore costs
- [ ] Check for any orphaned transactions
- [ ] Audit customer data access logs
- [ ] Update documentation if code changes

### Quarterly
- [ ] Rotate Stripe API keys
- [ ] Test disaster recovery (restore from backup)
- [ ] Security audit
- [ ] Performance review

---

## 📝 Version History

| Date | Changes | Status |
|------|---------|--------|
| Nov 22, 2025 | Initial complete analysis | ✅ Complete |
| TBD | Card → Payment element migration (if approved) | ⏳ Future |
| TBD | Klarna integration (if approved) | ⏳ Future |

---

## ❓ Questions?

Refer to the appropriate document:

**"How does X work?"** → `STRIPE_PAYMENT_ARCHITECTURE_REPORT.md`

**"What payment methods do we support?"** → `PAYMENT_METHODS_CONFIGURATION.txt`

**"Where does my data go?"** → `DATA_FLOW_DIAGRAM.txt`

**"Quick overview?"** → `STRIPE_QUICK_SUMMARY.txt` or this README

---

## 🎯 Key Takeaways

1. **Payment Methods**: Card-only (intentional choice)
2. **Data Flow**: Frontend → Stripe → Backend → Two Firestores
3. **Security**: PCI-compliant (Stripe handles cards)
4. **Golden Record**: Backend fetches full transaction from Stripe
5. **Dual Storage**: MOON (backup) + Portal (primary)
6. **Fees**: Stripe (2.9% + $0.30) + Platform (configured %)

---

**Document Generated**: November 22, 2025
**For**: MOON Tide Development Team
**Status**: ✅ COMPLETE AND READY FOR USE

All supporting documents are available in this folder.
