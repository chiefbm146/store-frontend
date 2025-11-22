"""
Stripe Connector - Stripe API Integration
Handles Stripe Connect account creation, onboarding, charges, and transfers
Uses API calls (no webhooks) for all operations
"""

import stripe
import os
from datetime import datetime

# Initialize Stripe with API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeConnector:
    """Handle all Stripe Connect operations"""

    @staticmethod
    def create_express_account(client_data):
        """Create a Stripe Express account for a client"""
        try:
            account = stripe.Account.create(
                type='express',
                country='CA',
                email=client_data.get('email'),
                business_profile={
                    'name': client_data.get('name', 'Unknown'),
                    'mcc': '7299',  # Miscellaneous business services
                    'url': os.getenv('FRONTEND_URL', 'https://www.aarie.ca')
                },
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True}
                }
            )

            account_id = account.id
            print(f"✅ Stripe Express account created: {account_id}")
            return account_id
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error creating account: {e}")
            return None

    @staticmethod
    def create_onboarding_link(stripe_account_id, refresh_url=None, return_url=None):
        """Create Stripe onboarding link for account verification"""
        try:
            if not refresh_url:
                refresh_url = os.getenv('FRONTEND_URL', 'https://www.aarie.ca') + '/client-dashboard.html'
            if not return_url:
                return_url = os.getenv('FRONTEND_URL', 'https://www.aarie.ca') + '/client-dashboard.html'

            account_link = stripe.AccountLink.create(
                account=stripe_account_id,
                type='account_onboarding',
                refresh_url=refresh_url,
                return_url=return_url
            )

            print(f"✅ Onboarding link created: {account_link.url}")
            return account_link.url
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error creating onboarding link: {e}")
            return None

    @staticmethod
    def get_account_status(stripe_account_id):
        """Get account verification status"""
        try:
            account = stripe.Account.retrieve(stripe_account_id)

            return {
                'id': account.id,
                'charges_enabled': account.charges_enabled,
                'payouts_enabled': account.payouts_enabled,
                'verification_status': account.verification.status if account.verification else 'unknown',
                'email': account.email,
                'created': account.created
            }
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error getting account status: {e}")
            return None

    @staticmethod
    def list_transfers(stripe_account_id, limit=50):
        """List all transfers to a connected account"""
        try:
            transfers = stripe.Transfer.list(
                limit=limit,
                destination=stripe_account_id,
                expand=['data.source_transaction', 'data.source_transaction.payment_intent']
            )

            print(f"✅ Found {len(transfers.data)} transfers to {stripe_account_id}")
            return transfers.data
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error listing transfers: {e}")
            return []

    @staticmethod
    def get_payment_intent(payment_intent_id):
        """Get payment intent details including application fee"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return intent
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error getting payment intent: {e}")
            return None

    @staticmethod
    def create_payment_intent(amount, stripe_account_id, metadata=None):
        """Create a payment intent for charging the connected account"""
        try:
            platform_fee_percent = float(os.getenv('PLATFORM_FEE_PERCENT', '2.5'))
            platform_fee = int(amount * (platform_fee_percent / 100))

            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='cad',
                payment_method_types=['card'],
                application_fee_amount=platform_fee,
                transfer_data={'destination': stripe_account_id},
                metadata=metadata or {}
            )

            print(f"✅ Payment intent created: {intent.id}")
            return intent
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error creating payment intent: {e}")
            return None

    @staticmethod
    def create_payment_link(amount, stripe_account_id, product_name, metadata=None):
        """Create a Stripe payment link (hosted checkout)"""
        try:
            platform_fee_percent = float(os.getenv('PLATFORM_FEE_PERCENT', '2.5'))
            platform_fee = int(amount * (platform_fee_percent / 100))

            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    'price_data': {
                        'currency': 'cad',
                        'product_data': {'name': product_name},
                        'unit_amount': amount
                    },
                    'quantity': 1
                }],
                transfer_data={'destination': stripe_account_id},
                application_fee_amount=platform_fee,
                metadata=metadata or {},
                after_completion={
                    'type': 'redirect',
                    'redirect': {
                        'url': os.getenv('FRONTEND_URL', 'https://www.aarie.ca') + '/client-dashboard.html?payment=success'
                    }
                }
            )

            print(f"✅ Payment link created: {payment_link.url}")
            return payment_link.url
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error creating payment link: {e}")
            return None

    @staticmethod
    def retrieve_charge(charge_id):
        """Get charge details from Stripe"""
        try:
            charge = stripe.Charge.retrieve(charge_id, expand=['payment_intent'])
            print(f"✅ Charge retrieved: {charge_id}")
            return charge
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error retrieving charge: {e}")
            return None

    @staticmethod
    def retrieve_payment_intent(payment_intent_id):
        """Get payment intent details"""
        try:
            pi = stripe.PaymentIntent.retrieve(payment_intent_id, expand=['latest_charge'])
            print(f"✅ Payment intent retrieved: {payment_intent_id}")
            return pi
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error retrieving payment intent: {e}")
            return None

    @staticmethod
    def list_charges(stripe_account_id, limit=50):
        """List charges for a connected account"""
        try:
            charges = stripe.Charge.list(
                limit=limit,
                stripe_account=stripe_account_id
            )

            print(f"✅ Found {len(charges.data)} charges for {stripe_account_id}")
            return charges.data
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error listing charges: {e}")
            return []

    @staticmethod
    def delete_account(stripe_account_id):
        """Delete a Stripe Express account"""
        try:
            account = stripe.Account.delete(stripe_account_id)
            print(f"✅ Stripe account deleted: {stripe_account_id}")
            return True
        except stripe.error.StripeError as e:
            print(f"❌ Stripe error deleting account: {e}")
            return False

    @staticmethod
    def verify_webhook_signature(payload, signature, secret):
        """Verify Stripe webhook signature"""
        try:
            event = stripe.Webhook.construct_event(payload, signature, secret)
            return event
        except ValueError as e:
            print(f"❌ Invalid payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            print(f"❌ Invalid signature: {e}")
            return None
