# C:\Users\koryp\OneDrive\Desktop\stripe-back\seed_workshops.py
#
# This script is designed to be run from your Portal Backend ('stripe-back') directory.
# Its purpose is to populate the Firestore database with the complete workshop list
# for a specific franchisee, making them available as "products" in the portal.

import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

# --- !!! IMPORTANT: SET THE FRANCHISEE ID HERE !!! ---
# This is the Firebase Auth UID of the franchisee account you want to add these workshops to.
# Using your provided test account ID.
FRANCHISEE_ID_TO_SEED = "fwUTBxjg4UeDQYQTKQK6B9ZJEO92"

# ============================================================================
# DATA: SINGLE SOURCE OF TRUTH FOR MOON TIDE WORKSHOPS
# (Copied directly from your setup_stripe_and_deploy.py)
# ============================================================================

WORKSHOP_DATA = {
    'cedar-bracelet': {
        'name': 'Cedar Woven Bracelet',
        'description': 'An intricate, hands-on workshop focused on detailed artisan work. Duration: 2 hours | Minimum 10 participants',
        'prices': {'corporate': 9500, 'community': 7000}
    },
    'cedar-rope-bracelet': {
        'name': 'Cedar Rope Bracelet with Beads',
        'description': 'A wonderfully accessible workshop perfect for all ages. Duration: 2 hours | Minimum 10 participants',
        'prices': {'corporate': 7500, 'community': 5500}
    },
    'cedar-heart': {
        'name': 'Weaving a Cedar Heart',
        'description': 'Transform cedar into a beautiful heart-shaped keepsake. Duration: 2 hours | Minimum 10 participants',
        'prices': {'corporate': 9500, 'community': 7000}
    },
    'medicine-pouch': {
        'name': 'Healing Through Medicine Pouch Making',
        'description': 'Connect to ancient practices of spiritual balance. Duration: 2 hours | Minimum 10 participants',
        'prices': {'corporate': 9500, 'community': 7000}
    },
    'orange-shirt-day-inperson': {
        'name': 'Orange Shirt Day Awareness Beading - In-Person',
        'description': 'Honor residential school survivors through beading. Duration: 4 hours | Minimum 10 participants',
        'prices': {'corporate': 16000, 'community': 12000}
    },
    'orange-shirt-day-virtual': {
        'name': 'Orange Shirt Day Awareness Beading - Virtual',
        'description': 'Online beading workshop with material kit included. Duration: 4 hours | Minimum 3 weeks lead time',
        'prices': {'corporate': 14500, 'community': 10500}
    },
    'mmiwg2s-inperson': {
        'name': 'MMIWG2S Awareness & Remembrance Beading - In-Person',
        'description': 'Remembrance and solidarity for Missing & Murdered Indigenous Women. Duration: 4 hours | Minimum 10 participants',
        'prices': {'corporate': 16000, 'community': 12000}
    },
    'mmiwg2s-virtual': {
        'name': 'MMIWG2S Awareness & Remembrance Beading - Virtual',
        'description': 'Online remembrance workshop with material kit included. Duration: 4 hours | Minimum 3 weeks lead time',
        'prices': {'corporate': 14500, 'community': 10500}
    },
    'cedar-coasters': {
        'name': 'Cedar Woven Coasters',
        'description': 'Introduction to cedar weaving with functional coaster set. Duration: 2 hours | Minimum 10 participants',
        'prices': {'corporate': 9500, 'community': 7000}
    },
    'cedar-basket': {
        'name': 'Cedar Basket Weaving',
        'description': 'Intensive workshop in creating beautiful, functional cedar baskets. Duration: 4 hours | Minimum 10 participants',
        'prices': {'corporate': 16000, 'community': 12000}
    },
    'kairos-blanket-inperson': {
        'name': 'Kairos Blanket Exercise - In-Person',
        'description': 'Powerful interactive experience exploring Indigenous history. Minimum booking of 10 participants required.',
        'prices': {'corporate': 37500, 'community': 22500}
    },
    'kairos-blanket-virtual': {
        'name': 'Kairos Blanket Exercise - Virtual',
        'description': 'Live online version of the Kairos Blanket Exercise. Minimum booking of 10 participants required.',
        'prices': {'corporate': 37500, 'community': 22500}
    },
    'test-product': {
        'name': 'Test Product',
        'description': 'A test product for development and testing purposes.',
        'default': 50,
        'per_person': False
    }
}

# ============================================================================
# SCRIPT LOGIC
# ============================================================================

def initialize_firebase():
    """Initializes the Firebase Admin SDK for the Portal project."""
    try:
        # Check if the app is already initialized to prevent errors
        firebase_admin.get_app()
    except ValueError:
        # Not initialized yet, so initialize it.
        # This uses the default credentials from your environment (gcloud auth).
        print("Initializing Firebase Admin SDK for Portal Project...")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'stripe-connect-1029120000',
        })
        print("[OK] Firebase Admin SDK initialized.")
    return firestore.client()

def seed_workshops(db_client, franchisee_id):
    """
    Seeds the workshops from WORKSHOP_DATA into the specified franchisee's
    'products' subcollection in Firestore. This process is idempotent.
    """
    print("\n" + "="*70)
    print(f"  Seeding Workshops for Franchisee: {franchisee_id}")
    print("="*70 + "\n")

    if not franchisee_id:
        print("✗ ERROR: FRANCHISEE_ID_TO_SEED is not set. Exiting.")
        return

    # Get a reference to the franchisee's products subcollection
    products_collection = db_client.collection('franchisees').document(franchisee_id).collection('products')

    seeded_count = 0
    updated_count = 0

    for workshop_key, data in WORKSHOP_DATA.items():
        doc_ref = products_collection.document(workshop_key)

        # Handle both per-person workshops (with 'prices' dict) and fixed-price products (with 'default')
        if 'prices' in data:
            # Per-person workshop: use 'community' price as default
            price_in_cents = data['prices']['community']
            metadata = {
                'is_workshop': True,
                'corporate_price': data['prices']['corporate'],
                'per_person': True
            }
        else:
            # Fixed-price product: use 'default' field
            price_in_cents = data.get('default', 0)
            metadata = {
                'is_workshop': False,
                'per_person': data.get('per_person', False)
            }

        product_payload = {
            'name': data['name'],
            'description': data['description'],
            'price': price_in_cents, # Price must be an integer in cents
            'status': 'active',
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'metadata': metadata
        }

        # Check if the document already exists to provide better logging
        if doc_ref.get().exists:
            print(f"  [UPDATE] Existing product: '{data['name']}'")
            # Remove createdAt to avoid overwriting it on update
            product_payload.pop('createdAt')
            doc_ref.update(product_payload)
            updated_count += 1
        else:
            print(f"  [NEW] Creating product: '{data['name']}'")
            doc_ref.set(product_payload)
            seeded_count += 1

    print("\n" + "="*70)
    print("  SEEDING COMPLETE")
    print(f"  [OK] {seeded_count} new workshops created.")
    print(f"  [OK] {updated_count} existing workshops updated.")
    print(f"  [OK] Total workshops in Firestore for franchisee {franchisee_id}: {len(WORKSHOP_DATA)}")
    print("="*70 + "\n")

if __name__ == "__main__":
    portal_db = initialize_firebase()
    seed_workshops(portal_db, FRANCHISEE_ID_TO_SEED)