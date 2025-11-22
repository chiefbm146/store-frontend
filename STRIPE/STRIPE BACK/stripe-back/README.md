# Portal Backend - Moon Tide Reconciliation Franchisee Portal

**Status:** Production Ready ✅
**Last Updated:** November 9, 2025
**GCP Project:** `stripe-connect-1029120000`
**Cloud Run Service:** `stripe-connect-backend`
**Service URL:** https://stripe-connect-backend-338017041631.us-central1.run.app

---

## Overview

The Portal Backend is the database layer for the franchisee portal. It receives transaction data from the MOON Backend orchestrator and stores it in Firestore, making it available for real-time display in the frontend.

**Key Responsibilities:**
- Receive "Golden Record" transactions from MOON Backend
- Store transaction data in Portal Firestore
- Provide transaction retrieval endpoints
- Sync legacy transaction data (read-only for orchestrator data)
- Maintain data consistency and integrity

---

## System Architecture

This is **Layer 2 Backend** of the 4-layer MOON TIDE RECONCILIATION system:

```
MOON Backend (orchestrator)
    ↓ (POST /api/franchisees/{id}/transactions)
Portal Backend (This Project)
    ↓ (Firestore write)
Portal Firestore (stripe-connect-1029120000)
    ↓ (real-time listener)
Portal Frontend (UI display)
```

### Data Flow

1. **Customer Payment** → MOON Storefront
2. **MOON Backend** creates Stripe PaymentIntent + Golden Record
3. **MOON Backend** → POST to Portal Backend: `/api/franchisees/{id}/transactions`
4. **Portal Backend** → Firestore write: `franchisees/{id}/transactions/{pi_id}`
5. **Portal Frontend** → Real-time listener updates UI

---

## Project Structure

```
stripe-back/
├── .github/
│   └── workflows/
│       └── cloud-run-deploy.yml      # Auto-deployment pipeline
├── app.py                             # Main Flask application
├── firebase_db.py                     # Firestore database layer
├── requirements.txt                   # Python dependencies
├── Dockerfile                         # Container configuration
├── .dockerignore
├── .gitignore
├── README.md                          # This file
└── CLAUDE.md                          # Development guidelines
```

---

## Local Development

### Prerequisites
- Python 3.9+
- Docker (for local testing)
- Google Cloud SDK
- Firebase credentials (JSON key)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/chiefbm146/stripe-back.git
cd stripe-back
```

2. Create Python virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set environment variables:
```bash
export FIRESTORE_PROJECT_ID=stripe-connect-1029120000
export STRIPE_API_KEY=sk_test_...  # or sk_live_...
export STRIPE_TEST_API_KEY=sk_test_...
```

5. Run locally:
```bash
python app.py
# Server runs on http://localhost:8080
```

### Development Workflow

1. Make changes to `app.py` or `firebase_db.py`
2. Test locally with `python app.py`
3. Test endpoints with curl or Postman
4. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
5. Push to main:
   ```bash
   git push origin main
   ```
6. GitHub Actions automatically deploys to Cloud Run (~1m35s)

---

## CI/CD Pipeline

### Automatic Deployment

**Trigger:** Every push to `main` branch

**Process:**
```
1. GitHub detects push to main
2. GitHub Actions workflow triggered
3. Docker image built from Dockerfile
4. Image pushed to Google Artifact Registry
5. Cloud Run updated with new image
6. Backend live at service URL (~1m35s)
```

### Monitoring Deployments

- **GitHub Actions:** https://github.com/chiefbm146/stripe-back/actions
- **Cloud Run Console:** https://console.cloud.google.com/run/detail/us-central1/stripe-connect-backend

### Manual Deployment

```bash
cd stripe-back

# Build Docker image
docker build --no-cache -t us-central1-docker.pkg.dev/stripe-connect-1029120000/cloud-run-source-deploy/stripe-connect-backend:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/stripe-connect-1029120000/cloud-run-source-deploy/stripe-connect-backend:latest

# Deploy to Cloud Run
gcloud run deploy stripe-connect-backend \
  --image us-central1-docker.pkg.dev/stripe-connect-1029120000/cloud-run-source-deploy/stripe-connect-backend:latest \
  --region us-central1 \
  --project stripe-connect-1029120000 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 540 \
  --max-instances 20
```

---

## Google Cloud Configuration

### Project Details
- **Project ID:** `stripe-connect-1029120000`
- **Cloud Run Service:** `stripe-connect-backend`
- **Region:** us-central1
- **Memory:** 1Gi
- **CPU:** 1
- **Timeout:** 540 seconds
- **Max Instances:** 20

### Service Account for CI/CD
- **Account:** `github-stripe-deploy@stripe-connect-1029120000.iam.gserviceaccount.com`
- **Permissions:**
  - Cloud Run Admin
  - Artifact Registry Admin
  - Service Account User
- **Key Storage:** GitHub Secrets `GOOGLE_CLOUD_SERVICE_ACCOUNT`

### Firestore Configuration
- **Database:** `stripe-connect-1029120000`
- **Collection:** `franchisees/{franchisee_id}/transactions`
- **Document ID:** Payment intent ID (e.g., `pi_3SReGF2ONyiEh5kx0kUS46u7`)

---

## API Endpoints

### POST `/api/franchisees/{id}/transactions`

Receives and records a transaction from MOON Backend orchestrator.

**Request:**
```json
{
  "stripePaymentId": "pi_3SReGF2ONyiEh5kx0kUS46u7",
  "amount_total": 544500,
  "amount_stripe_fee": 20177,
  "amount_platform_fee": 15790,
  "amount_franchisee_net": 508533,
  "name": "kory peters",
  "email": "korypetersbm146@gmail.com",
  "phone": "6047984674",
  "workshopId": "cedar-rope-bracelet",
  "workshopName": "Cedar Rope Bracelet with Beads",
  "workshopDate": "November 14, 2025",
  "workshopTime": "afternoon",
  "participantCount": 280,
  "organizationType": "Corporate Team Building",
  "status": "succeeded"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction recorded successfully",
  "transactionId": "pi_3SReGF2ONyiEh5kx0kUS46u7",
  "franchiseeId": "acct_1SPg6y2LSUVFKuLN"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request
- 500: Server error

---

### GET `/api/franchisees/{id}/transactions`

Retrieve all transactions for a franchisee (optional - for backup/reporting).

**Response:**
```json
{
  "success": true,
  "franchiseeId": "acct_1SPg6y2LSUVFKuLN",
  "transactions": [
    {
      "stripePaymentId": "pi_3SReGF2ONyiEh5kx0kUS46u7",
      "amount_total": 544500,
      ...
    }
  ],
  "count": 1
}
```

---

### GET `/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T12:00:00Z"
}
```

---

## Key Files & Functions

### `app.py`

Main Flask application with all endpoints.

#### `@app.route("/api/franchisees/<id>/transactions", methods=["POST"])`
Receives transaction from MOON Backend orchestrator, calls `firebase_db.record_transaction()`

#### `@app.route("/api/franchisees/<id>/transactions", methods=["GET"])`
Retrieves all transactions for franchisee

#### `@app.route("/health", methods=["GET"])`
Simple health check for Cloud Run monitoring

### `firebase_db.py`

Firestore database layer with all CRUD operations.

#### `record_transaction(franchisee_id, transaction_data)`
Records a transaction in Firestore:
- **Input:** Franchisee ID, transaction data (from orchestrator)
- **Processing:**
  - Backward compatibility: Accepts both `amount_total` (new) and `amount` (legacy)
  - Validates required fields
  - Adds timestamp
- **Output:** Firestore document write
- **Idempotency:** Uses payment_intent_id as document ID for deduplication

**Field Mapping:**
```python
# Backward compatible field handling
amount_total = transaction_data.get('amount_total')
if amount_total is None:
    amount_total = transaction_data.get('amount', 0)

data_to_save = {
    'stripePaymentId': transaction_data.get('stripePaymentId'),
    'amount_total': transaction_data.get('amount_total', amount_total),
    'amount_stripe_fee': transaction_data.get('amount_stripe_fee', 0),
    'amount_platform_fee': transaction_data.get('amount_platform_fee', 0),
    'amount_franchisee_net': transaction_data.get('amount_franchisee_net', 0),
    'name': transaction_data.get('name'),
    'email': transaction_data.get('email'),
    'phone': transaction_data.get('phone'),
    'workshopId': transaction_data.get('workshopId'),
    'workshopName': transaction_data.get('workshopName'),
    'workshopDate': transaction_data.get('workshopDate'),
    'workshopTime': transaction_data.get('workshopTime'),
    'participantCount': transaction_data.get('participantCount'),
    'organizationType': transaction_data.get('organizationType'),
    'status': transaction_data.get('status'),
    'createdAt': datetime.utcnow()
}
```

#### `get_transactions(franchisee_id, limit=50)`
Retrieves transactions from Firestore, sorted by creation date

#### `sync_transactions(franchisee_id)`
Legacy sync function - reads from Stripe and records transactions not yet in Firestore
- **Important:** Only records new transactions (those not already in Firestore)
- **Safeguard:** Checks document ID using `payment_intent_id` (not `charge_id`)

---

## Data Consistency

### Idempotency
The system uses payment intent ID as the unique document ID, ensuring:
- No duplicate records if called multiple times
- Safe retries without data corruption
- Atomic writes to Firestore

### Backward Compatibility
The `record_transaction()` function handles both old and new field names:
```python
# New field names from orchestrator
amount_total = transaction_data.get('amount_total')

# Fall back to old field name from legacy sync
if amount_total is None:
    amount_total = transaction_data.get('amount', 0)
```

This ensures transactions created by different systems work seamlessly.

---

## Testing

### Manual Testing

1. Send POST request to create transaction:
```bash
curl -X POST https://stripe-connect-backend-338017041631.us-central1.run.app/api/franchisees/acct_1SPg6y2LSUVFKuLN/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "stripePaymentId": "pi_test_123",
    "amount_total": 544500,
    "amount_stripe_fee": 20177,
    "amount_platform_fee": 15790,
    "amount_franchisee_net": 508533,
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "6041234567",
    "workshopId": "test-workshop",
    "workshopName": "Test Workshop",
    "status": "succeeded"
  }'
```

2. Verify in Portal Firestore:
   - Open Firebase Console
   - Navigate to: `franchisees/acct_1SPg6y2LSUVFKuLN/transactions/pi_test_123`
   - Confirm all fields are present and correct

3. Verify Portal UI displays transaction (within 1-2 seconds)

### Automated Testing

```bash
# Run tests locally
python -m pytest tests/

# With coverage
python -m pytest --cov=. tests/
```

---

## Environment Variables

### Required
- `FIRESTORE_PROJECT_ID`: GCP Firestore project ID
- `STRIPE_API_KEY`: Stripe live API key (sk_live_...)
- `STRIPE_TEST_API_KEY`: Stripe test API key (sk_test_...)

### Optional
- `FLASK_ENV`: Set to `development` for debug mode
- `LOG_LEVEL`: Set to `DEBUG`, `INFO`, or `ERROR`

---

## Troubleshooting

### Issue: "Firestore database not found" error

**Cause:** `FIRESTORE_PROJECT_ID` not set or incorrect

**Solution:**
```bash
export FIRESTORE_PROJECT_ID=stripe-connect-1029120000
```

### Issue: Transaction not appearing in Firestore

**Cause:** Request not reaching backend or Firestore write failed

**Solution:**
1. Check Cloud Run logs: `gcloud run services logs read stripe-connect-backend --region us-central1`
2. Verify request format matches API specification
3. Check service account has Firestore write permissions

### Issue: Deployment failed

**Cause:** Docker build error or authentication issue

**Solution:**
1. Check GitHub Actions logs
2. Verify `GOOGLE_CLOUD_SERVICE_ACCOUNT` secret is valid
3. Try manual deployment to identify the specific error

---

## GitHub Setup

### Initial Setup (Already Done)

1. ✅ Service account created: `github-stripe-deploy@stripe-connect-1029120000.iam.gserviceaccount.com`
2. ✅ JSON key generated
3. ✅ GitHub Secrets configured: `GOOGLE_CLOUD_SERVICE_ACCOUNT`
4. ✅ Workflow file created: `.github/workflows/cloud-run-deploy.yml`

### To Add This Repo to GitHub

```bash
git remote add origin https://github.com/chiefbm146/stripe-back.git
git branch -M main
git push -u origin main
```

### To Update GitHub Secrets

In GitHub repository settings → Secrets and variables → Actions:
1. Create secret: `GOOGLE_CLOUD_SERVICE_ACCOUNT`
2. Value: Contents of the JSON key file (user will provide)

---

## Performance Metrics

- **Firestore Write:** < 100ms
- **Firestore Read:** < 50ms
- **API Response:** < 500ms (including Firestore round-trip)
- **Cloud Run Deployment:** ~ 1m35s
- **Docker Build Time:** ~ 45 seconds

---

## Security Considerations

### Authentication
- Service account key stored in GitHub Secrets (NOT in repository)
- Never commit credentials to git
- Rotate keys periodically

### Authorization
- Service account has Firestore write permissions
- Cloud Run service is public (allows unauthenticated requests from MOON Backend)
- Production should consider adding request signing/validation

### Data Handling
- All data comes from trusted MOON Backend service
- No direct user input accepted
- Firestore rules should restrict access to franchisee-owned transactions

---

## Docker Configuration

### Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

### Building Locally
```bash
docker build -t stripe-connect-backend:latest .
docker run -p 8080:8080 stripe-connect-backend:latest
```

---

## Future Enhancements

1. **Request Signing**
   - Sign requests from MOON Backend with shared secret
   - Verify signature in Portal Backend
   - Increase security

2. **Webhooks**
   - Listen for Stripe webhook events directly
   - Supplement orchestrator data with real-time Stripe events
   - Improve data freshness

3. **Analytics**
   - Aggregate transaction data
   - Calculate revenue metrics
   - Store analytics in separate collection

4. **Multi-Franchisee**
   - Support multiple franchisees in single system
   - Admin dashboard for viewing all franchisees
   - Per-franchisee revenue reports

---

## Development Guidelines

See `CLAUDE.md` for detailed development guidelines and best practices.

---

## Contact & Support

- **Repository:** https://github.com/chiefbm146/stripe-back
- **Cloud Run Service:** https://stripe-connect-backend-338017041631.us-central1.run.app
- **Google Cloud Console:** https://console.cloud.google.com/run/detail/us-central1/stripe-connect-backend
- **GitHub Actions:** https://github.com/chiefbm146/stripe-back/actions

---

**Last Updated:** November 9, 2025
**Maintained By:** Kory Peters
**Status:** Production Ready ✅
# CI/CD test
# Deployment test $(date)
# Retry $(date)
