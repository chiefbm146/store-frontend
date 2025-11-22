"""
Client Manager - Firestore & Client Data Management
Handles client accounts, Stripe Connect setup, and data isolation
"""

from firebase_admin import firestore, credentials
import firebase_admin
import os
from datetime import datetime

# Initialize Firebase (if not already initialized)
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': os.getenv('FIREBASE_PROJECT_ID', 'stores-12345')
    })

db = firestore.client()

class ClientManager:
    """Manage client accounts and data"""

    @staticmethod
    def get_client(client_uid):
        """Get client document from Firestore"""
        try:
            doc = db.collection('clients').document(client_uid).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"❌ Error getting client: {e}")
            return None

    @staticmethod
    def create_or_update_client(client_uid, client_data):
        """Create or update client in Firestore"""
        try:
            # Ensure required fields
            client_data['uid'] = client_uid
            client_data['updatedAt'] = datetime.utcnow()

            # If creating, add createdAt
            if not ClientManager.get_client(client_uid):
                client_data['createdAt'] = datetime.utcnow()

            db.collection('clients').document(client_uid).set(client_data, merge=True)
            print(f"✅ Client created/updated: {client_uid}")
            return True
        except Exception as e:
            print(f"❌ Error creating/updating client: {e}")
            return False

    @staticmethod
    def get_stripe_account(client_uid):
        """Get client's Stripe account"""
        try:
            doc = db.collection('clients').document(client_uid).collection('stripe_account').document('account').get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"❌ Error getting Stripe account: {e}")
            return None

    @staticmethod
    def create_stripe_account(client_uid, stripe_account_id, status='pending'):
        """Create Stripe account record in Firestore"""
        try:
            account_data = {
                'accountId': stripe_account_id,
                'chargesEnabled': False,
                'payoutsEnabled': False,
                'verificationStatus': status,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }

            db.collection('clients').document(client_uid).collection('stripe_account').document('account').set(account_data)
            print(f"✅ Stripe account created: {stripe_account_id}")
            return True
        except Exception as e:
            print(f"❌ Error creating Stripe account: {e}")
            return False

    @staticmethod
    def update_stripe_account(client_uid, update_data):
        """Update Stripe account info"""
        try:
            update_data['updatedAt'] = datetime.utcnow()
            db.collection('clients').document(client_uid).collection('stripe_account').document('account').update(update_data)
            print(f"✅ Stripe account updated: {client_uid}")
            return True
        except Exception as e:
            print(f"❌ Error updating Stripe account: {e}")
            return False

    @staticmethod
    def delete_stripe_account(client_uid):
        """Delete Stripe account record from Firestore"""
        try:
            db.collection('clients').document(client_uid).collection('stripe_account').document('account').delete()
            print(f"✅ Stripe account deleted: {client_uid}")
            return True
        except Exception as e:
            print(f"❌ Error deleting Stripe account: {e}")
            return False

    @staticmethod
    def get_products(client_uid):
        """Get all active products for client"""
        try:
            docs = db.collection('clients').document(client_uid).collection('products').where('status', '==', 'active').stream()
            products = []
            for doc in docs:
                product = doc.to_dict()
                product['id'] = doc.id
                products.append(product)
            return products
        except Exception as e:
            print(f"❌ Error getting products: {e}")
            return []

    @staticmethod
    def record_transaction(client_uid, transaction_data):
        """Record a transaction in Firestore"""
        try:
            # Ensure required fields
            if not transaction_data.get('stripePaymentId'):
                raise ValueError("stripePaymentId is required")

            # Use stripePaymentId as document ID for idempotency
            transaction_id = transaction_data['stripePaymentId']

            # Ensure timestamps
            if 'createdAt' not in transaction_data:
                transaction_data['createdAt'] = datetime.utcnow()

            transaction_data['updatedAt'] = datetime.utcnow()

            # Save to Firestore
            db.collection('clients').document(client_uid).collection('transactions').document(transaction_id).set(transaction_data)

            print(f"✅ Transaction recorded: {transaction_id} for client {client_uid}")
            return True
        except Exception as e:
            print(f"❌ Error recording transaction: {e}")
            return False

    @staticmethod
    def get_transactions(client_uid, limit=20):
        """Get recent transactions for client"""
        try:
            docs = db.collection('clients').document(client_uid).collection('transactions').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit).stream()
            transactions = []
            for doc in docs:
                txn = doc.to_dict()
                txn['id'] = doc.id
                transactions.append(txn)
            return transactions
        except Exception as e:
            print(f"❌ Error getting transactions: {e}")
            return []

    @staticmethod
    def sync_transactions_from_stripe(client_uid, stripe_transfers):
        """Sync transactions from Stripe transfers into Firestore"""
        try:
            synced_count = 0

            for transfer in stripe_transfers:
                # Get original charge from transfer
                charge = transfer.get('source_transaction')
                if not charge or charge.get('object') != 'charge':
                    continue

                charge_id = charge.get('id')
                payment_intent_id = charge.get('payment_intent') or charge_id

                # Check if already exists
                existing = db.collection('clients').document(client_uid).collection('transactions').document(payment_intent_id).get()
                if existing.exists:
                    continue

                # Create transaction record
                transaction_data = {
                    'stripePaymentId': payment_intent_id,
                    'chargeId': charge_id,
                    'amount': charge.get('amount', 0),
                    'currency': charge.get('currency', 'cad'),
                    'status': charge.get('status', 'succeeded'),
                    'description': charge.get('description', 'Payment'),
                    'name': charge.get('billing_details', {}).get('name', 'N/A') if charge.get('billing_details') else 'N/A',
                    'email': charge.get('billing_details', {}).get('email', 'N/A') if charge.get('billing_details') else 'N/A',
                    'phone': charge.get('billing_details', {}).get('phone', 'N/A') if charge.get('billing_details') else 'N/A',
                    'createdAt': datetime.fromtimestamp(charge.get('created', 0)),
                    'updatedAt': datetime.utcnow()
                }

                # Save transaction
                ClientManager.record_transaction(client_uid, transaction_data)
                synced_count += 1

            print(f"✅ Synced {synced_count} transactions for client {client_uid}")
            return synced_count
        except Exception as e:
            print(f"❌ Error syncing transactions: {e}")
            return 0
