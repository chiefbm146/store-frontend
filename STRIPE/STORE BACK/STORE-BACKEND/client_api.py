"""
Client API Endpoints - Flask routes for client portal
Handles Stripe setup, onboarding, and dashboard data
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth
import os
import logging
import threading
from client_manager import ClientManager
from stripe_connector import StripeConnector

logger = logging.getLogger(__name__)
client_api = Blueprint('client_api', __name__, url_prefix='/api/client')

# Middleware: Verify Firebase token
def verify_firebase_token(f):
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            logger.error("❌ No Authorization token provided")
            return jsonify({'error': 'Unauthorized - No token'}), 401

        try:
            decoded_token = auth.verify_id_token(token)
            request.user_uid = decoded_token['uid']
            request.user_email = decoded_token['email']
            logger.info(f"✅ Token verified for user: {request.user_email}")
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"❌ Token verification failed: {str(e)}")
            return jsonify({'error': f'Unauthorized - {str(e)}'}), 401

    wrapper.__name__ = f.__name__
    return wrapper

# ============== STRIPE SETUP ==============

def save_stripe_account_async(client_uid, stripe_account_id):
    """Save Stripe account to Firestore in background (non-blocking)"""
    try:
        ClientManager.create_stripe_account(client_uid, stripe_account_id, 'pending')
        logger.info(f"✅ Stripe account saved to Firestore: {stripe_account_id}")
    except Exception as e:
        logger.error(f"❌ Failed to save Stripe account to Firestore: {e}")

@client_api.route('/stripe-setup', methods=['POST'])
@verify_firebase_token
def setup_stripe():
    """Create Stripe Express account for client"""
    try:
        logger.info(f"🔄 Starting Stripe setup for user: {request.user_email}")
        data = request.get_json()
        client_uid = request.user_uid
        email = request.user_email

        # Check if client already has Stripe account
        logger.info(f"📋 Checking for existing Stripe account...")
        existing_account = ClientManager.get_stripe_account(client_uid)
        if existing_account:
            logger.warning(f"⚠️ Client already has Stripe account: {existing_account.get('accountId')}")
            return jsonify({
                'error': 'Client already has a Stripe account',
                'accountId': existing_account.get('accountId')
            }), 400

        # Create client in Firestore if doesn't exist (blocking)
        logger.info(f"📝 Creating/updating client in Firestore...")
        ClientManager.create_or_update_client(client_uid, {
            'uid': client_uid,
            'email': email,
            'name': data.get('name', 'Unknown')
        })

        # Create Stripe account (blocking - fast ~500ms)
        logger.info(f"⚡ Creating Stripe Express account for {email}...")
        stripe_account_id = StripeConnector.create_express_account({
            'email': email,
            'name': data.get('name', 'Unknown')
        })

        if not stripe_account_id:
            logger.error(f"❌ Stripe account creation failed")
            return jsonify({'error': 'Failed to create Stripe account'}), 500

        logger.info(f"✅ Stripe account created: {stripe_account_id}")

        # Save to Firestore in background (non-blocking)
        logger.info(f"🔄 Saving Stripe account to Firestore (async)...")
        thread = threading.Thread(target=save_stripe_account_async, args=(client_uid, stripe_account_id))
        thread.daemon = True
        thread.start()

        # Return immediately with account ID
        return jsonify({
            'success': True,
            'accountId': stripe_account_id,
            'message': 'Stripe account created successfully'
        }), 201

    except Exception as e:
        logger.error(f"❌ Stripe setup error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ============== ONBOARDING ==============

@client_api.route('/stripe-onboarding-link', methods=['POST'])
@verify_firebase_token
def get_onboarding_link():
    """Get Stripe onboarding link for verification"""
    try:
        logger.info(f"🔄 Getting onboarding link for user: {request.user_email}")
        client_uid = request.user_uid

        # Get Stripe account
        logger.info(f"📋 Retrieving Stripe account...")
        stripe_account = ClientManager.get_stripe_account(client_uid)
        if not stripe_account:
            logger.error(f"❌ No Stripe account found for user: {client_uid}")
            return jsonify({'error': 'No Stripe account found'}), 404

        stripe_account_id = stripe_account.get('accountId')
        logger.info(f"✅ Found Stripe account: {stripe_account_id}")

        # Create onboarding link
        logger.info(f"🔗 Creating Stripe onboarding link...")
        link = StripeConnector.create_onboarding_link(
            stripe_account_id,
            refresh_url=os.getenv('FRONTEND_URL', 'https://www.aarie.ca') + '/client-dashboard.html',
            return_url=os.getenv('FRONTEND_URL', 'https://www.aarie.ca') + '/client-dashboard.html'
        )

        if not link:
            logger.error(f"❌ Failed to create onboarding link for {stripe_account_id}")
            return jsonify({'error': 'Failed to create onboarding link'}), 500

        logger.info(f"✅ Onboarding link created successfully")
        return jsonify({
            'success': True,
            'url': link
        }), 200

    except Exception as e:
        logger.error(f"❌ Onboarding link error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ============== DELETE STRIPE ACCOUNT ==============

@client_api.route('/stripe-account/delete', methods=['POST'])
@verify_firebase_token
def delete_stripe_account():
    """Delete Stripe account from Stripe AND Firestore"""
    try:
        logger.info(f"🗑️ Deleting Stripe account for user: {request.user_email}")
        client_uid = request.user_uid

        # Get Stripe account ID from Firestore
        stripe_account = ClientManager.get_stripe_account(client_uid)
        if not stripe_account:
            return jsonify({'error': 'No Stripe account found'}), 404

        stripe_account_id = stripe_account.get('accountId')
        logger.info(f"🔗 Found Stripe account: {stripe_account_id}")

        # Delete from Stripe
        logger.info(f"🗑️ Deleting from Stripe...")
        stripe_deleted = StripeConnector.delete_account(stripe_account_id)

        if not stripe_deleted:
            return jsonify({'error': 'Failed to delete Stripe account'}), 500

        # Delete from Firestore
        logger.info(f"🗑️ Deleting from Firestore...")
        ClientManager.delete_stripe_account(client_uid)

        logger.info(f"✅ Stripe account fully deleted from Stripe and Firestore")
        return jsonify({
            'success': True,
            'message': 'Stripe account deleted successfully'
        }), 200

    except Exception as e:
        logger.error(f"❌ Delete Stripe account error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# ============== DASHBOARD DATA ==============

@client_api.route('/dashboard-data', methods=['GET'])
@verify_firebase_token
def get_dashboard_data():
    """Get client dashboard data (products, transactions, Stripe status)"""
    try:
        client_uid = request.user_uid

        # Get client data - auto-create if not exists (new user)
        client = ClientManager.get_client(client_uid)
        if not client:
            # Create client automatically from Firebase token
            logger.info(f"📝 Auto-creating client for new user: {request.user_email}")
            ClientManager.create_or_update_client(client_uid, {
                'uid': client_uid,
                'email': request.user_email,
                'name': request.user_email.split('@')[0]  # Default name from email
            })
            client = ClientManager.get_client(client_uid)

        # Get Stripe account
        stripe_account = ClientManager.get_stripe_account(client_uid)

        # Get products
        products = ClientManager.get_products(client_uid)

        # Get transactions
        transactions = ClientManager.get_transactions(client_uid, limit=20)

        # Get Stripe account status from Stripe API and UPDATE Firestore
        stripe_status = None
        if stripe_account:
            stripe_status = StripeConnector.get_account_status(stripe_account.get('accountId'))

            # Update Firestore with latest status from Stripe
            if stripe_status:
                ClientManager.update_stripe_account(client_uid, {
                    'chargesEnabled': stripe_status.get('charges_enabled', False),
                    'payoutsEnabled': stripe_status.get('payouts_enabled', False),
                    'verificationStatus': stripe_status.get('verification_status', 'pending')
                })
                # Update local copy with new values
                stripe_account['chargesEnabled'] = stripe_status.get('charges_enabled', False)
                stripe_account['payoutsEnabled'] = stripe_status.get('payouts_enabled', False)

        return jsonify({
            'success': True,
            'client': client,
            'stripe_account': stripe_account,
            'stripe_status': stripe_status,
            'products': products,
            'transactions': transactions,
            'stats': {
                'total_transactions': len(transactions),
                'total_revenue': sum(t.get('amount_franchisee_net', t.get('amount', 0)) for t in transactions),
                'active_products': len(products)
            }
        }), 200

    except Exception as e:
        print(f"❌ Dashboard data error: {e}")
        return jsonify({'error': str(e)}), 500

# ============== SYNC STRIPE TRANSACTIONS ==============

@client_api.route('/sync-transactions', methods=['POST'])
@verify_firebase_token
def sync_stripe_transactions():
    """Sync transactions from Stripe API to Firestore"""
    try:
        client_uid = request.user_uid

        # Get Stripe account
        stripe_account = ClientManager.get_stripe_account(client_uid)
        if not stripe_account:
            return jsonify({'message': 'No Stripe account found', 'synced': 0}), 200

        stripe_account_id = stripe_account.get('accountId')

        # List transfers from Stripe
        transfers = StripeConnector.list_transfers(stripe_account_id)

        # Sync transactions to Firestore
        synced_count = ClientManager.sync_transactions_from_stripe(client_uid, transfers)

        return jsonify({
            'success': True,
            'synced': synced_count,
            'message': f'Synced {synced_count} transactions from Stripe'
        }), 200

    except Exception as e:
        print(f"❌ Sync transactions error: {e}")
        return jsonify({'error': str(e)}), 500

# ============== RECORD TRANSACTION (from MOON Frontend) ==============

@client_api.route('/<client_uid>/transactions', methods=['POST'])
def record_transaction(client_uid):
    """Record a transaction from MOON Frontend storefront"""
    try:
        transaction_data = request.get_json()

        if not transaction_data.get('stripePaymentId'):
            return jsonify({'error': 'stripePaymentId is required'}), 400

        # Record in Firestore
        ClientManager.record_transaction(client_uid, transaction_data)

        return jsonify({
            'success': True,
            'message': 'Transaction recorded',
            'stripePaymentId': transaction_data.get('stripePaymentId')
        }), 201

    except Exception as e:
        print(f"❌ Record transaction error: {e}")
        return jsonify({'error': str(e)}), 500
