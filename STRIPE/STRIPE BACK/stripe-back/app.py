"""
Stripe Connect Platform Backend
Flask API for franchisee management and Stripe integration
Test deployment with fixed Cloud Run secrets - November 16, 2025
"""

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from config import get_config
from firebase_db import FirestoreDB
from stripe_handler import StripeHandler
import stripe
import os
import json
import time
from datetime import datetime
from firebase_admin import firestore

# Initialize Flask app
app = Flask(__name__)
config = get_config()
app.config.from_object(config)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Enable CORS - allow all origins for now (can be restricted later)
CORS(app,
     resources={r"/api/*": {"origins": "*"}},
     supports_credentials=False,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Error handler
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

# ============== FRANCHISEE ROUTES ==============

@app.route('/api/franchisees/<franchisee_id>', methods=['GET'])
def get_franchisee(franchisee_id):
    """Get franchisee details"""
    try:
        franchisee = FirestoreDB.get_franchisee(franchisee_id)
        if franchisee:
            return jsonify(franchisee), 200
        return jsonify({'error': 'Franchisee not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/stripe-account', methods=['GET'])
def get_stripe_account(franchisee_id):
    """Get Stripe account status"""
    try:
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if stripe_account:
            return jsonify(stripe_account), 200
        return jsonify({'error': 'Stripe account not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/stripe-account/setup', methods=['POST'])
def setup_stripe_account(franchisee_id):
    """Create Stripe Express account for franchisee"""
    try:
        # Get franchisee data
        franchisee = FirestoreDB.get_franchisee(franchisee_id)
        if not franchisee:
            return jsonify({'error': 'Franchisee not found'}), 404

        # Create Stripe account
        stripe_account_id = StripeHandler.create_express_account({
            'email': franchisee.get('email'),
            'name': franchisee.get('name')
        })

        # Record in Firestore
        FirestoreDB.create_stripe_account_record(franchisee_id, stripe_account_id, 'pending')

        return jsonify({
            'accountId': stripe_account_id,
            'status': 'created'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/onboarding-link', methods=['POST'])
def create_onboarding_link(franchisee_id):
    """Create Stripe onboarding link"""
    try:
        # Get franchisee info
        franchisee = FirestoreDB.get_franchisee(franchisee_id)
        if not franchisee:
            return jsonify({'error': 'Franchisee not found'}), 404

        # Get or create Stripe account
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if not stripe_account:
            # Create new Stripe Express account
            stripe_account_id = StripeHandler.create_express_account(franchisee)

            # Save to Firestore
            FirestoreDB.create_stripe_account_record(franchisee_id, stripe_account_id, status='pending')
        else:
            stripe_account_id = stripe_account.get('accountId')

        # Create onboarding link
        link = StripeHandler.create_account_link(
            stripe_account_id,
            refresh_url=os.getenv('FRONTEND_URL', 'http://localhost:5000') + '/dashboard',
            return_url=os.getenv('FRONTEND_URL', 'http://localhost:5000') + '/dashboard'
        )

        return jsonify({'url': link}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== PRODUCT ROUTES ==============

@app.route('/api/franchisees/<franchisee_id>/products', methods=['GET'])
def get_products(franchisee_id):
    """Get all products for a franchisee"""
    try:
        products = FirestoreDB.get_products(franchisee_id)
        return jsonify(products), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/products/<product_id>', methods=['GET'])
def get_product(franchisee_id, product_id):
    """Get a single product"""
    try:
        product = FirestoreDB.get_product(franchisee_id, product_id)
        if product:
            return jsonify(product), 200
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/products', methods=['POST'])
def create_product(franchisee_id):
    """Create a new product"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('name') or not data.get('price'):
            return jsonify({'error': 'Missing required fields: name, price'}), 400

        # Create product in Firestore
        product_id = FirestoreDB.create_product(franchisee_id, {
            'name': data.get('name'),
            'description': data.get('description', ''),
            'price': int(data.get('price'))  # Store in cents
        })

        # Try to create in Stripe if account is set up
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if stripe_account and stripe_account.get('chargesEnabled'):
            try:
                stripe_product_id = StripeHandler.create_product(
                    {
                        'id': product_id,
                        'name': data.get('name'),
                        'description': data.get('description', '')
                    },
                    stripe_account.get('accountId')
                )

                # Create price
                stripe_price_id = StripeHandler.create_price(
                    stripe_product_id,
                    int(data.get('price')),
                    stripe_account.get('accountId')
                )

                # Update product with Stripe IDs
                FirestoreDB.update_product(franchisee_id, product_id, {
                    'stripeProductId': stripe_product_id,
                    'stripePriceId': stripe_price_id
                })
            except Exception as stripe_error:
                print(f"Warning: Could not create Stripe product: {stripe_error}")

        return jsonify({
            'id': product_id,
            'name': data.get('name'),
            'price': data.get('price'),
            'status': 'created'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/products/<product_id>', methods=['PUT'])
def update_product(franchisee_id, product_id):
    """Update a product"""
    try:
        data = request.get_json()

        # Update in Firestore
        FirestoreDB.update_product(franchisee_id, product_id, {
            'name': data.get('name'),
            'description': data.get('description', ''),
            'price': int(data.get('price', 0))
        })

        return jsonify({'status': 'updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/franchisees/<franchisee_id>/products/<product_id>', methods=['DELETE'])
def delete_product(franchisee_id, product_id):
    """Delete a product (soft delete - archive)"""
    try:
        FirestoreDB.update_product(franchisee_id, product_id, {
            'status': 'archived'
        })
        return jsonify({'status': 'deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== PAYMENT ROUTES ==============

@app.route('/api/create-payment-link', methods=['POST'])
def create_payment_link():
    """Create a Stripe Payment Link for a product"""
    try:
        data = request.get_json()
        franchisee_id = data.get('franchiseeId')
        product_id = data.get('productId')
        product_name = data.get('productName')
        amount = data.get('amount')

        # Get franchisee's Stripe account
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if not stripe_account:
            return jsonify({'error': 'Stripe account not found'}), 404

        stripe_account_id = stripe_account.get('accountId')

        # Calculate platform fee (2.9%)
        platform_fee = int(amount * (app.config['PLATFORM_FEE_PERCENT'] / 100))

        # Get frontend URL for redirect
        frontend_url = os.getenv('FRONTEND_URL', 'https://stripe-connect-1029120000.firebaseapp.com')

        # Create Payment Link with Stripe Connect
        # Redirect to /api/confirm-payment to save to Firestore IMMEDIATELY after payment
        payment_link = stripe.PaymentLink.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'cad',
                        'product_data': {
                            'name': product_name,
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }
            ],
            transfer_data={'destination': stripe_account_id},
            application_fee_amount=platform_fee,
            metadata={
                'franchisee_id': franchisee_id,
                'product_id': product_id
            },
            after_completion={
                'type': 'redirect',
                'redirect': {
                    'url': 'https://stripe-connect-backend-338017041631.us-central1.run.app/api/confirm-payment?session_id={CHECKOUT_SESSION_ID}'
                }
            }
        )

        return jsonify({'paymentLink': payment_link.url}), 200
    except Exception as e:
        print(f"Error creating payment link: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/confirm-payment', methods=['GET'])
def confirm_payment():
    """Confirm payment and save transaction to Firestore immediately after Stripe redirect"""
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            print("No session_id provided")
            return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

        print(f"=== CONFIRM PAYMENT ===")
        print(f"Session ID: {session_id}")

        # Retrieve checkout session
        session = stripe.checkout.Session.retrieve(session_id)
        print(f"Session retrieved: {session.id}")
        print(f"Session status: {session.payment_status}")
        print(f"Session metadata: {session.metadata}")

        pi_id = session.payment_intent
        franchisee_id = session.metadata.get('franchisee_id') if session.metadata else None
        product_id = session.metadata.get('product_id') if session.metadata else None

        print(f"PaymentIntent: {pi_id}")
        print(f"FranchiseeID: {franchisee_id}")
        print(f"ProductID: {product_id}")

        if not pi_id or not franchisee_id:
            print(f"ERROR: Missing pi_id or franchisee_id")
            return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

        # Retrieve payment intent with charge details
        pi = stripe.PaymentIntent.retrieve(pi_id, expand=['latest_charge'])
        print(f"PaymentIntent status: {pi.status}")

        if pi.status != 'succeeded':
            print(f"PaymentIntent not succeeded: {pi.status}")
            return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

        charge = pi.latest_charge
        if not charge:
            print("No charge found in PaymentIntent")
            return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

        print(f"Charge ID: {charge.id}")
        print(f"Charge amount: {charge.amount}")
        print(f"Charge status: {charge.status}")

        # Build transaction data
        transaction_data = {
            'id': charge.id,
            'chargeId': charge.id,
            'amount': charge.amount,
            'currency': charge.currency,
            'status': 'succeeded',
            'description': charge.description or 'Product purchase',
            'metadata': {
                'franchisee_id': franchisee_id,
                'product_id': product_id,
                'payment_intent': pi_id
            },
            'created': charge.created,
            'createdAt': datetime.fromtimestamp(charge.created).isoformat()
        }

        print(f"Saving transaction: {transaction_data}")

        # SAVE TO FIRESTORE IMMEDIATELY
        FirestoreDB.record_transaction(franchisee_id, transaction_data)

        print(f"✓ TRANSACTION SAVED TO FIRESTORE: {franchisee_id} - {charge.id}")

        # Redirect to dashboard
        return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

    except Exception as e:
        print(f"Confirm payment error: {e}")
        import traceback
        traceback.print_exc()
        return redirect('https://stripe-connect-1029120000.firebaseapp.com/dashboard')

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a Stripe payment intent for test store purchase"""
    try:
        data = request.get_json()
        franchisee_id = data.get('franchiseeId')
        amount = data.get('amount')
        product_id = data.get('productId')

        # Get franchisee's Stripe account
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if not stripe_account:
            return jsonify({'error': 'Stripe account not found'}), 404

        stripe_account_id = stripe_account.get('accountId')

        # Calculate platform fee (2.9%)
        platform_fee = int(amount * (app.config['PLATFORM_FEE_PERCENT'] / 100))

        # Create payment intent with Stripe Connect
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='cad',
            payment_method_types=['card'],
            application_fee_amount=platform_fee,
            transfer_data={'destination': stripe_account_id},
            metadata={
                'franchisee_id': franchisee_id,
                'product_id': product_id
            }
        )

        return jsonify({'clientSecret': intent.client_secret}), 200
    except Exception as e:
        print(f"Error creating payment intent: {e}")
        return jsonify({'error': str(e)}), 500

# ============== TRANSACTION ROUTES ==============

@app.route('/api/franchisees/<franchisee_id>/transactions', methods=['GET'])
def get_transactions(franchisee_id):
    """Get transactions for a franchisee"""
    try:
        limit = request.args.get('limit', 50, type=int)
        transactions = FirestoreDB.get_transactions(franchisee_id, limit)
        return jsonify(transactions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sync-transactions', methods=['POST'])
def sync_transactions():
    """
    CORRECTED: Syncs transactions for a Connect account by querying Transfers,
    then finding the source charge. This is the correct method for destination charges.
    """
    try:
        franchisee_id = request.args.get('franchisee_id') or request.get_json().get('franchisee_id')
        if not franchisee_id:
            return jsonify(error="franchisee_id is required"), 400

        print(f"=== CORRECTED SYNC FOR FRANCHISEE: {franchisee_id} ===")

        # Get the franchisee's Stripe Connect Account ID from Firestore
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if not stripe_account or not stripe_account.get('accountId'):
            print(f"No Stripe account found for franchisee {franchisee_id}")
            return jsonify(synced=0, message="Franchisee has not set up a Stripe account."), 200

        franchisee_stripe_account_id = stripe_account.get('accountId')
        print(f"Syncing for Stripe Account ID: {franchisee_stripe_account_id}")

        # 1. LIST TRANSFERS TO THE CONNECTED ACCOUNT
        # This is the source of truth for money they have received.
        transfers = stripe.Transfer.list(
            limit=100,
            destination=franchisee_stripe_account_id,
            expand=['data.source_transaction']  # IMPORTANT: This includes the original charge object
        )

        print(f"Found {len(transfers.data)} transfers to this account.")

        synced_count = 0
        for transfer in transfers.data:
            # 2. GET THE ORIGINAL CHARGE FROM THE TRANSFER
            charge = transfer.source_transaction
            if not charge or charge.object != 'charge':
                continue  # Skip if it wasn't from a charge (e.g., a manual transfer)

            # The payment intent ID is what we use as the document ID in Firestore (for idempotency)
            charge_id = charge.id
            payment_intent_id = charge.payment_intent or charge_id

            # 3. CHECK IF THIS TRANSACTION ALREADY EXISTS IN FIRESTORE
            # NOTE: We check using payment_intent_id because that's the unique document ID
            db = firestore.client()
            existing_transaction = db.collection('franchisees').document(franchisee_id).collection('transactions').document(payment_intent_id).get()

            if existing_transaction.exists:
                print(f"Transaction {payment_intent_id} already exists, skipping sync.")
                continue

            # 4. IF IT'S NEW, CONSTRUCT AND SAVE THE RECORD
            print(f"Found new transaction to sync: {charge_id}")

            # The `handlePaymentSuccess` function in the MOON frontend will be the primary source
            # of PII. This sync function is a backup. We will record what we can from Stripe.
            transaction_data = {
                'stripePaymentId': charge.payment_intent or charge_id,
                'createdAt': datetime.fromtimestamp(charge.created),
                'updatedAt': datetime.now(),
                'name': charge.billing_details.name if charge.billing_details else 'N/A',
                'email': charge.billing_details.email if charge.billing_details else 'N/A',
                'phone': charge.billing_details.phone if charge.billing_details else 'N/A',
                'items': [],  # Sync doesn't know about items, only the direct save does
                'workshopId': charge.metadata.get('workshopId') if charge.metadata else None,
                'workshopDetails': {
                    'workshop_name': charge.metadata.get('workshop_name') if charge.metadata else '',
                    'organization_type': charge.metadata.get('organization_type') if charge.metadata else '',
                    'participants': charge.metadata.get('participants') if charge.metadata else 0,
                    'requested_date': charge.metadata.get('requested_date') if charge.metadata else '',
                    'requested_time': charge.metadata.get('requested_time') if charge.metadata else ''
                },
                # CRITICAL: Include amount, currency, status for Portal UI display
                'amount': charge.amount,
                'currency': charge.currency,
                'status': charge.status,
                'description': charge.description or 'Workshop Purchase'
            }

            FirestoreDB.record_transaction(franchisee_id, transaction_data)
            synced_count += 1

        print(f"✓ SYNC COMPLETE: {synced_count} new transactions saved to Firestore.")
        return jsonify(synced=synced_count, message=f"Synced {synced_count} new transactions."), 200

    except Exception as e:
        print(f"CRITICAL SYNC ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(error=str(e)), 500

@app.route('/api/franchisee-transactions', methods=['GET'])
def get_franchisee_transactions_polling():
    """Poll Stripe API for franchisee's recent charges (no webhooks needed)"""
    try:
        franchisee_id = request.args.get('franchisee_id')
        if not franchisee_id:
            return jsonify(error="No franchisee_id"), 400

        # Get Stripe account ID from Firestore
        stripe_account = FirestoreDB.get_stripe_account(franchisee_id)
        if not stripe_account:
            return jsonify([]), 200  # Empty if account not found

        stripe_account_id = stripe_account.get('accountId')
        if not stripe_account_id:
            return jsonify([]), 200  # Empty if not onboarded

        # Query recent charges on connected account (last 24 hours)
        charges = stripe.Charge.list(
            limit=10,
            stripe_account=stripe_account_id
        )

        transactions = []
        current_time = time.time()
        for charge in charges.data:
            # Only include succeeded charges from last 24 hours
            if charge.status == 'succeeded' and charge.created > (current_time - 86400):
                transactions.append({
                    'id': charge.id,
                    'amount': charge.amount,
                    'date': charge.created,
                    'description': charge.description or 'Purchase',
                    'status': charge.status,
                    'currency': charge.currency
                })

        # Sort by date descending (most recent first)
        transactions.sort(key=lambda x: x['date'], reverse=True)
        return jsonify(transactions), 200

    except Exception as e:
        print(f"Polling query error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(error=str(e)), 500

# ============== WEBHOOK ROUTES ==============

@app.route('/api/webhooks/stripe', methods=['POST'])
def handle_stripe_webhook():
    """Handle Stripe webhooks"""
    print(f"=== WEBHOOK RECEIVED ===")
    print(f"Time: {datetime.now()}")
    print(f"Headers: {dict(request.headers)}")

    try:
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')

        print(f"Payload size: {len(payload)} bytes")
        print(f"Signature header: {sig_header}")

        # Verify webhook signature
        event = StripeHandler.verify_webhook_signature(
            payload,
            sig_header,
            os.getenv('STRIPE_WEBHOOK_SECRET', '')
        )

        print(f"DEBUG: Webhook received - event type: {event.get('type')}")
        print(f"DEBUG: Event data: {json.dumps(event, indent=2, default=str)}")

        # Handle different event types
        if event['type'] == 'account.updated':
            print(f"DEBUG: Handling account.updated")
            handle_account_updated(event['data']['object'])
        elif event['type'] == 'checkout.session.completed':
            print(f"DEBUG: Handling checkout.session.completed")
            handle_checkout_session_completed(event['data']['object'])
        elif event['type'] == 'payment_intent.succeeded':
            print(f"DEBUG: Handling payment_intent.succeeded")
            handle_payment_intent_succeeded(event['data']['object'])
        elif event['type'] == 'charge.succeeded':
            print(f"DEBUG: Handling charge.succeeded")
            handle_charge_succeeded(event['data']['object'])
        elif event['type'] == 'charge.failed':
            print(f"DEBUG: Handling charge.failed")
            handle_charge_failed(event['data']['object'])
        else:
            print(f"DEBUG: Unhandled event type: {event['type']}")

        return jsonify({'status': 'received'}), 200
    except Exception as e:
        print(f"Webhook error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

def handle_account_updated(account):
    """Handle Stripe account update"""
    # TODO: Update Firestore with account status
    print(f"Account updated: {account.get('id')}")

def handle_checkout_session_completed(session):
    """Handle Stripe checkout session completion (from Payment Links)"""
    try:
        print(f"DEBUG: handle_checkout_session_completed called with session: {session.get('id')}")

        pi_id = session.get('payment_intent')
        if not pi_id:
            print("No payment_intent in session")
            return

        # Retrieve full PaymentIntent with expanded charge data
        print(f"DEBUG: Retrieving payment intent: {pi_id}")
        pi = stripe.PaymentIntent.retrieve(pi_id, expand=['latest_charge'])

        # Get metadata from PaymentIntent first
        metadata = pi.get('metadata', {})
        franchisee_id = metadata.get('franchisee_id')
        product_id = metadata.get('product_id')

        # If metadata is empty, try to get from charge
        if not franchisee_id and pi.get('latest_charge'):
            print(f"DEBUG: PI metadata empty, fetching charge")
            charge = pi.get('latest_charge')
            if isinstance(charge, dict):
                metadata = {**metadata, **charge.get('metadata', {})}
            else:
                # It's a charge object ID, retrieve it
                charge = stripe.Charge.retrieve(charge)
                metadata = {**metadata, **charge.get('metadata', {})}

            franchisee_id = metadata.get('franchisee_id')
            product_id = metadata.get('product_id')
            print(f"DEBUG: Got metadata from charge: {metadata}")

        print(f"DEBUG: extracted franchisee_id: {franchisee_id}, product_id: {product_id}")

        if not franchisee_id:
            print("NO FRANCHISEE_ID in checkout session or charge")
            return

        print(f"DEBUG: Recording checkout session transaction for franchisee: {franchisee_id}")

        # Record transaction in Firestore
        transaction_data = {
            'paymentIntentId': pi_id,
            'sessionId': session.get('id'),
            'amount': pi.get('amount'),
            'currency': pi.get('currency'),
            'status': 'succeeded',
            'description': f'Product purchase (ID: {product_id})',
            'metadata': metadata
        }
        print(f"DEBUG: transaction_data: {transaction_data}")
        FirestoreDB.record_transaction(franchisee_id, transaction_data)
        print(f"DEBUG: Checkout session transaction recorded successfully")

    except Exception as e:
        print(f"Error handling checkout session completed: {e}")
        import traceback
        traceback.print_exc()

def handle_payment_intent_succeeded(payment_intent):
    """Handle successful payment intent (from Payment Links)"""
    try:
        print(f"DEBUG: handle_payment_intent_succeeded called with PI: {payment_intent.get('id')}")
        print(f"DEBUG: PI metadata: {payment_intent.get('metadata', {})}")

        # Try to get metadata from PI first
        metadata = payment_intent.get('metadata', {})
        franchisee_id = metadata.get('franchisee_id')
        product_id = metadata.get('product_id')

        # If metadata is empty, try to fetch from latest charge
        if not franchisee_id and payment_intent.get('latest_charge'):
            print(f"DEBUG: PI metadata empty, fetching charge {payment_intent.get('latest_charge')}")
            try:
                charge = stripe.Charge.retrieve(payment_intent.get('latest_charge'))
                metadata = charge.get('metadata', {})
                franchisee_id = metadata.get('franchisee_id')
                product_id = metadata.get('product_id')
                print(f"DEBUG: Got metadata from charge: {metadata}")
            except Exception as charge_error:
                print(f"DEBUG: Could not fetch charge: {charge_error}")

        print(f"DEBUG: extracted franchisee_id: {franchisee_id}, product_id: {product_id}")

        if franchisee_id:
            print(f"DEBUG: Recording transaction for franchisee: {franchisee_id}")
            # Record transaction in Firestore
            transaction_data = {
                'paymentIntentId': payment_intent.get('id'),
                'amount': payment_intent.get('amount'),
                'currency': payment_intent.get('currency'),
                'status': 'succeeded',
                'description': f'Product purchase (ID: {product_id})',
                'metadata': metadata
            }
            print(f"DEBUG: transaction_data: {transaction_data}")
            FirestoreDB.record_transaction(franchisee_id, transaction_data)
            print(f"DEBUG: Transaction recorded successfully")
        else:
            print(f"DEBUG: No franchisee_id in metadata, skipping transaction record")

        print(f"Payment intent succeeded: {payment_intent.get('id')}")
    except Exception as e:
        print(f"Error handling payment intent succeeded: {e}")
        import traceback
        traceback.print_exc()

def handle_charge_succeeded(charge):
    """Handle successful charge"""
    try:
        print(f"DEBUG: handle_charge_succeeded called with charge: {charge.get('id')}")
        print(f"DEBUG: charge metadata: {charge.get('metadata', {})}")

        franchisee_id = charge.get('metadata', {}).get('franchisee_id')
        print(f"DEBUG: extracted franchisee_id: {franchisee_id}")

        if franchisee_id:
            print(f"DEBUG: Recording transaction for franchisee: {franchisee_id}")
            # Record transaction in Firestore
            transaction_data = {
                'chargeId': charge.get('id'),
                'amount': charge.get('amount'),
                'currency': charge.get('currency'),
                'status': 'succeeded',
                'description': charge.get('description', 'Product purchase'),
                'metadata': charge.get('metadata', {})
            }
            print(f"DEBUG: transaction_data: {transaction_data}")
            FirestoreDB.record_transaction(franchisee_id, transaction_data)
            print(f"DEBUG: Transaction recorded successfully")
        else:
            print(f"DEBUG: No franchisee_id in metadata, skipping transaction record")

        print(f"Charge succeeded: {charge.get('id')}")
    except Exception as e:
        print(f"Error handling charge succeeded: {e}")
        import traceback
        traceback.print_exc()

def handle_charge_failed(charge):
    """Handle failed charge"""
    try:
        franchisee_id = charge.get('metadata', {}).get('franchisee_id')
        if franchisee_id:
            # Record failed transaction in Firestore
            FirestoreDB.record_transaction(franchisee_id, {
                'chargeId': charge.get('id'),
                'amount': charge.get('amount'),
                'currency': charge.get('currency'),
                'status': 'failed',
                'failureMessage': charge.get('failure_message', 'Unknown error'),
                'description': charge.get('description', 'Product purchase'),
                'metadata': charge.get('metadata', {})
            })
        print(f"Charge failed: {charge.get('id')}")
    except Exception as e:
        print(f"Error handling charge failed: {e}")

# ============== TRANSACTION ROUTES (For MOON Store Integration) ==============

@app.route('/api/franchisees/<franchisee_id>/transactions', methods=['POST'])
def add_transaction(franchisee_id):
    """Endpoint for a trusted storefront (MOON Store) to record a new transaction."""
    try:
        transaction_data = request.get_json()
        if not transaction_data:
            return jsonify({'error': 'Invalid JSON payload'}), 400

        # Verify that stripePaymentId is present (required for idempotency)
        if not transaction_data.get('stripePaymentId'):
            return jsonify({'error': 'stripePaymentId is required'}), 400

        # Use the enhanced record_transaction function from firebase_db.py
        FirestoreDB.record_transaction(franchisee_id, transaction_data)

        return jsonify({
            'status': 'success',
            'message': 'Transaction recorded successfully.',
            'stripePaymentId': transaction_data.get('stripePaymentId')
        }), 201

    except ValueError as ve:
        print(f"Validation error in add_transaction: {ve}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"Error in add_transaction: {e}")
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

# ============== STARTUP ==============

if __name__ == '__main__':
    # Get config
    debug = app.config['DEBUG']
    port = int(os.getenv('PORT', 8080))

    # Run app
    app.run(host='0.0.0.0', port=port, debug=debug)
