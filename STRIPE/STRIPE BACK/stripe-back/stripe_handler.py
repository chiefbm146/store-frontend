"""
Stripe Connect integration handler
Manages Stripe Express accounts, charges, and payouts
"""

import stripe
from flask import current_app
import os

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeHandler:
    """Handle all Stripe Connect operations"""

    @staticmethod
    def create_express_account(franchisee_data):
        """
        Create a new Stripe Express Connect account for a franchisee

        Args:
            franchisee_data: dict with franchisee information

        Returns:
            Stripe account ID
        """
        try:
            account = stripe.Account.create(
                type='express',
                country='CA',
                email=franchisee_data.get('email'),
                business_type='company',
                capabilities={
                    'card_payments': {'requested': True},
                    'transfers': {'requested': True},
                }
            )
            return account.id
        except stripe.error.StripeError as e:
            print(f"Error creating Stripe account: {e}")
            raise

    @staticmethod
    def create_account_link(account_id, refresh_url, return_url):
        """
        Create a Stripe onboarding link for account completion

        Args:
            account_id: Stripe account ID
            refresh_url: URL to return to if the user needs to redo onboarding
            return_url: URL to return to after completing onboarding

        Returns:
            Account link URL
        """
        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                type='account_onboarding',
                refresh_url=refresh_url,
                return_url=return_url
            )
            return account_link.url
        except stripe.error.StripeError as e:
            print(f"Error creating account link: {e}")
            raise

    @staticmethod
    def create_product(product_data, stripe_account_id=None):
        """
        Create a Stripe product (in connected account if specified)

        Args:
            product_data: dict with product info
            stripe_account_id: Optional connected account ID

        Returns:
            Stripe product ID
        """
        try:
            kwargs = {
                'name': product_data.get('name'),
                'description': product_data.get('description', ''),
                'metadata': {
                    'franchisee_product_id': product_data.get('id')
                }
            }

            if stripe_account_id:
                kwargs['stripe_account'] = stripe_account_id

            product = stripe.Product.create(**kwargs)
            return product.id
        except stripe.error.StripeError as e:
            print(f"Error creating Stripe product: {e}")
            raise

    @staticmethod
    def create_price(stripe_product_id, amount, stripe_account_id=None):
        """
        Create a Stripe price for a product

        Args:
            stripe_product_id: Stripe product ID
            amount: Price in cents
            stripe_account_id: Optional connected account ID

        Returns:
            Stripe price ID
        """
        try:
            kwargs = {
                'product': stripe_product_id,
                'unit_amount': int(amount),
                'currency': 'usd'
            }

            if stripe_account_id:
                kwargs['stripe_account'] = stripe_account_id

            price = stripe.Price.create(**kwargs)
            return price.id
        except stripe.error.StripeError as e:
            print(f"Error creating Stripe price: {e}")
            raise

    @staticmethod
    def create_destination_charge(amount, stripe_account_id, metadata=None):
        """
        Create a charge with platform fee (destination charge)

        Args:
            amount: Total amount in cents
            stripe_account_id: Franchisee's Stripe account ID
            metadata: Additional metadata for the charge

        Returns:
            Charge object
        """
        try:
            platform_fee = int(amount * (current_app.config['PLATFORM_FEE_PERCENT'] / 100))

            charge_data = {
                'amount': amount,
                'currency': 'usd',
                'source': 'tok_visa',  # Use Stripe.js token in production
                'destination': {
                    'account': stripe_account_id,
                    'amount': amount - platform_fee
                }
            }

            if metadata:
                charge_data['metadata'] = metadata

            charge = stripe.Charge.create(**charge_data)
            return charge
        except stripe.error.StripeError as e:
            print(f"Error creating charge: {e}")
            raise

    @staticmethod
    def get_account_details(stripe_account_id):
        """
        Get details about a connected Stripe account

        Args:
            stripe_account_id: Stripe account ID

        Returns:
            Account details
        """
        try:
            account = stripe.Account.retrieve(stripe_account_id)
            return {
                'id': account.id,
                'email': account.email,
                'country': account.country,
                'charges_enabled': account.charges_enabled,
                'payouts_enabled': account.payouts_enabled,
                'verification': {
                    'status': account.verification.status if account.verification else None,
                    'fields_needed': account.verification.fields_needed if account.verification else []
                }
            }
        except stripe.error.StripeError as e:
            print(f"Error retrieving account: {e}")
            raise

    @staticmethod
    def update_account(stripe_account_id, update_data):
        """
        Update a Stripe account

        Args:
            stripe_account_id: Stripe account ID
            update_data: dict of fields to update

        Returns:
            Updated account object
        """
        try:
            account = stripe.Account.modify(stripe_account_id, **update_data)
            return account
        except stripe.error.StripeError as e:
            print(f"Error updating account: {e}")
            raise

    @staticmethod
    def verify_webhook_signature(payload, signature, secret):
        """
        Verify Stripe webhook signature

        Args:
            payload: Raw request body
            signature: Signature header
            secret: Webhook secret

        Returns:
            Event object if valid
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, secret
            )
            return event
        except ValueError as e:
            print(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            print(f"Invalid signature: {e}")
            raise
