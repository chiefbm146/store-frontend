"""
Firestore database access layer
"""

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime
import os

# Initialize Firebase Admin SDK
try:
    # Use service account if available, otherwise use default credentials
    if os.path.exists('service-account-key.json'):
        cred = credentials.Certificate('service-account-key.json')
    else:
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred)
except ValueError:
    # Firebase app already initialized
    pass

db = firestore.client()

class FirestoreDB:
    """Firestore database operations"""

    @staticmethod
    def get_franchisee(franchisee_id):
        """Get franchisee by ID"""
        try:
            doc = db.collection('franchisees').document(franchisee_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting franchisee: {e}")
            raise

    @staticmethod
    def update_franchisee(franchisee_id, data):
        """Update franchisee data"""
        try:
            data['updatedAt'] = datetime.now()
            db.collection('franchisees').document(franchisee_id).update(data)
            return True
        except Exception as e:
            print(f"Error updating franchisee: {e}")
            raise

    @staticmethod
    def create_stripe_account_record(franchisee_id, stripe_account_id, status='pending'):
        """Create Stripe account record in Firestore"""
        try:
            data = {
                'accountId': stripe_account_id,
                'chargesEnabled': False,
                'payoutsEnabled': False,
                'verificationStatus': status,
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            }
            db.collection('franchisees').document(franchisee_id).collection('stripe_account').document('account').set(data)
            return True
        except Exception as e:
            print(f"Error creating Stripe account record: {e}")
            raise

    @staticmethod
    def get_stripe_account(franchisee_id):
        """Get Stripe account info for franchisee"""
        try:
            doc = db.collection('franchisees').document(franchisee_id).collection('stripe_account').document('account').get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error getting Stripe account: {e}")
            raise

    @staticmethod
    def update_stripe_account(franchisee_id, data):
        """Update Stripe account info"""
        try:
            data['updatedAt'] = datetime.now()
            db.collection('franchisees').document(franchisee_id).collection('stripe_account').document('account').update(data)
            return True
        except Exception as e:
            print(f"Error updating Stripe account: {e}")
            raise

    @staticmethod
    def get_products(franchisee_id):
        """Get all active products for a franchisee"""
        try:
            docs = db.collection('franchisees').document(franchisee_id).collection('products').where('status', '==', 'active').stream()
            products = []
            for doc in docs:
                product = doc.to_dict()
                product['id'] = doc.id
                products.append(product)
            return products
        except Exception as e:
            print(f"Error getting products: {e}")
            raise

    @staticmethod
    def get_product(franchisee_id, product_id):
        """Get a single product"""
        try:
            doc = db.collection('franchisees').document(franchisee_id).collection('products').document(product_id).get()
            if doc.exists:
                product = doc.to_dict()
                product['id'] = doc.id
                return product
            return None
        except Exception as e:
            print(f"Error getting product: {e}")
            raise

    @staticmethod
    def create_product(franchisee_id, product_data):
        """Create a new product"""
        try:
            product_data['createdAt'] = datetime.now()
            product_data['updatedAt'] = datetime.now()
            product_data['status'] = 'active'

            doc_ref = db.collection('franchisees').document(franchisee_id).collection('products').add(product_data)
            return doc_ref[1].id
        except Exception as e:
            print(f"Error creating product: {e}")
            raise

    @staticmethod
    def update_product(franchisee_id, product_id, product_data):
        """Update a product"""
        try:
            product_data['updatedAt'] = datetime.now()
            db.collection('franchisees').document(franchisee_id).collection('products').document(product_id).update(product_data)
            return True
        except Exception as e:
            print(f"Error updating product: {e}")
            raise

    @staticmethod
    def record_transaction(franchisee_id, transaction_data):
        """Record a complete transaction, including full PII and financial breakdown.

        This function receives data from:
        1. MOON Backend orchestrator (new flow) - has: amount_total, amount_stripe_fee, amount_platform_fee, amount_franchisee_net
        2. Sync function (legacy) - has: amount (only the charge amount)

        Handles both field naming conventions for backward compatibility.
        """
        try:
            # The document ID should be the Stripe Payment Intent ID to prevent duplicates
            transaction_id = transaction_data.get('stripePaymentId')
            if not transaction_id:
                raise ValueError("stripePaymentId is required to record a transaction.")

            doc_ref = db.collection('franchisees').document(franchisee_id).collection('transactions').document(transaction_id)

            # BACKWARD COMPATIBLE: Handle both old 'amount' and new 'amount_*' field names
            # If we have the new fields, use them. Otherwise, fall back to old 'amount' field.
            amount_total = transaction_data.get('amount_total')
            if amount_total is None:
                # Fall back to old 'amount' field if new fields aren't present (from sync)
                amount_total = transaction_data.get('amount', 0)

            # Prepare the data to be saved, ensuring timestamps are correct
            # Now includes complete financial breakdown from the "Golden Record"
            data_to_save = {
                'createdAt': transaction_data.get('createdAt', firestore.SERVER_TIMESTAMP),
                'updatedAt': firestore.SERVER_TIMESTAMP,

                # Customer PII
                'name': transaction_data.get('name'),
                'email': transaction_data.get('email'),
                'phone': transaction_data.get('phone'),

                # Order Details
                'stripePaymentId': transaction_id,
                'items': transaction_data.get('items', []),
                'workshopId': transaction_data.get('workshopId'),
                'workshopDetails': transaction_data.get('workshopDetails', {}),

                # Financial Breakdown (backward compatible)
                # Use new fields if available (from orchestrator), else fall back to single 'amount' (from sync)
                'amount_total': transaction_data.get('amount_total', amount_total),
                'amount_stripe_fee': transaction_data.get('amount_stripe_fee', 0),  # Only available from orchestrator
                'amount_platform_fee': transaction_data.get('amount_platform_fee', 0),  # Only available from orchestrator
                'amount_franchisee_net': transaction_data.get('amount_franchisee_net', 0),  # Only available from orchestrator

                # Standard Fields
                'currency': transaction_data.get('currency', 'cad'),
                'status': transaction_data.get('status', 'succeeded'),
                'description': transaction_data.get('description', 'Workshop Purchase')
            }

            # Use .set() to create or overwrite, ensuring idempotency
            doc_ref.set(data_to_save)
            print(f"✅ Successfully recorded COMPLETE transaction {transaction_id} for franchisee {franchisee_id}")
            print(f"   Financial Breakdown: Total=${data_to_save['amount_total']/100:.2f}, "
                  f"Stripe Fee=${data_to_save['amount_stripe_fee']/100:.2f}, "
                  f"Platform Fee=${data_to_save['amount_platform_fee']/100:.2f}, "
                  f"Franchisee Net=${data_to_save['amount_franchisee_net']/100:.2f}")
            return True
        except Exception as e:
            print(f"Error recording transaction: {e}")
            raise

    @staticmethod
    def get_transactions(franchisee_id, limit=50):
        """Get recent transactions for a franchisee"""
        try:
            docs = db.collection('franchisees').document(franchisee_id).collection('transactions').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit).stream()
            transactions = []
            for doc in docs:
                txn = doc.to_dict()
                txn['id'] = doc.id
                transactions.append(txn)
            return transactions
        except Exception as e:
            print(f"Error getting transactions: {e}")
            raise
