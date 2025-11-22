# Cloud Run Deployment Guide

## Prerequisites

- Google Cloud CLI installed
- Docker installed
- Service account credentials set up

## Environment Setup

1. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

2. Update with your Stripe keys and configuration

## Build Docker Image

```bash
# Set project and image details
export PROJECT_ID=stripe-connect-1029120000
export IMAGE_NAME=stripe-connect-backend
export REGION=us-central1

# Build image
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest .
```

## Push to Google Artifact Registry

```bash
# Configure Docker authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Push image
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest
```

## Deploy to Cloud Run

```bash
# Deploy service
gcloud run deploy stripe-connect-backend \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest \
  --platform managed \
  --region ${REGION} \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars FLASK_ENV=production,STRIPE_SECRET_KEY=sk_xxx,STRIPE_WEBHOOK_SECRET=whsec_xxx \
  --project ${PROJECT_ID}
```

## Set Service Account Permissions

The Cloud Run service needs permissions to access Firestore:

```bash
# Get the Cloud Run service account
export SERVICE_ACCOUNT=stripe-connect-backend@${PROJECT_ID}.iam.gserviceaccount.com

# Grant Firestore permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/datastore.user
```

## Monitoring

```bash
# View logs
gcloud run logs read stripe-connect-backend --region ${REGION} --limit 50

# Stream logs
gcloud run logs read stripe-connect-backend --region ${REGION} --follow
```

## Update Deployment

After making code changes:

```bash
# Rebuild
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest .

# Push
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest

# Redeploy (will automatically use new image)
gcloud run deploy stripe-connect-backend \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}/backend:latest \
  --region ${REGION} \
  --project ${PROJECT_ID}
```

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_ENV=development
export STRIPE_SECRET_KEY=sk_test_xxxxx

# Run locally
python app.py

# Test health endpoint
curl http://localhost:8080/health
```
