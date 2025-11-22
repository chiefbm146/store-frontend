# setup_stripe_and_deploy.py
# Moon Tide Reconciliation - HYBRID Stripe & Deployment Orchestrator
# Handles BOTH workshops and products in a single unified process

"""
Moon Tide Reconciliation - Stripe & Deployment Master Orchestrator Script

This script automates the entire Stripe setup and deployment process for the
HYBRID system (Workshops + Products):

1. Creates/verifies all 12 Moon Tide workshop products in Stripe
2. Creates/verifies all 70 Chrystal Sparrow product items in Stripe
3. Generates stripe_config.json with all workshop and product price IDs
4. Updates Cloud Run environment variables for the backend
5. Injects Stripe Publishable Key into frontend
6. Triggers deployment scripts

USAGE:
    python setup_stripe_and_deploy.py

You will be prompted to enter:
- Stripe Secret Key (sk_test_... or sk_live_...)
- Stripe Publishable Key (pk_test_... or pk_live_...)
- Frontend URL (e.g., https://reconciliation-475704.web.app)
"""

import os
import stripe
import json
import subprocess
import sys
import re
import math

# ============================================================================
# CONFIGURATION: SINGLE SOURCE OF TRUTH - WORKSHOPS
# ============================================================================

WORKSHOP_DATA = {
    'cedar-bracelet': {
        'name': 'Cedar Woven Bracelet',
        'description': 'An intricate, hands-on workshop focused on detailed artisan work. Duration: 2 hours | Minimum 10 participants',
        'prices': {
            'corporate': 9500,      # $95.00
            'community': 7000       # $70.00
        }
    },
    'cedar-rope-bracelet': {
        'name': 'Cedar Rope Bracelet with Beads',
        'description': 'A wonderfully accessible workshop perfect for all ages. Duration: 2 hours | Minimum 10 participants',
        'prices': {
            'corporate': 7500,      # $75.00
            'community': 5500       # $55.00
        }
    },
    'cedar-heart': {
        'name': 'Weaving a Cedar Heart',
        'description': 'Transform cedar into a beautiful heart-shaped keepsake. Duration: 2 hours | Minimum 10 participants',
        'prices': {
            'corporate': 9500,      # $95.00
            'community': 7000       # $70.00
        }
    },
    'medicine-pouch': {
        'name': 'Healing Through Medicine Pouch Making',
        'description': 'Connect to ancient practices of spiritual balance. Duration: 2 hours | Minimum 10 participants',
        'prices': {
            'corporate': 9500,      # $95.00
            'community': 7000       # $70.00
        }
    },
    'orange-shirt-day-inperson': {
        'name': 'Orange Shirt Day Awareness Beading - In-Person',
        'description': 'Honor residential school survivors through beading. Duration: 4 hours | Minimum 10 participants',
        'prices': {
            'corporate': 16000,     # $160.00
            'community': 12000      # $120.00
        }
    },
    'orange-shirt-day-virtual': {
        'name': 'Orange Shirt Day Awareness Beading - Virtual',
        'description': 'Online beading workshop with material kit included. Duration: 4 hours | Minimum 3 weeks lead time',
        'prices': {
            'corporate': 14500,     # $145.00
            'community': 10500      # $105.00
        }
    },
    'mmiwg2s-inperson': {
        'name': 'MMIWG2S Awareness & Remembrance Beading - In-Person',
        'description': 'Remembrance and solidarity for Missing & Murdered Indigenous Women. Duration: 4 hours | Minimum 10 participants',
        'prices': {
            'corporate': 16000,     # $160.00
            'community': 12000      # $120.00
        }
    },
    'mmiwg2s-virtual': {
        'name': 'MMIWG2S Awareness & Remembrance Beading - Virtual',
        'description': 'Online remembrance workshop with material kit included. Duration: 4 hours | Minimum 3 weeks lead time',
        'prices': {
            'corporate': 14500,     # $145.00
            'community': 10500      # $105.00
        }
    },
    'cedar-coasters': {
        'name': 'Cedar Woven Coasters',
        'description': 'Introduction to cedar weaving with functional coaster set. Duration: 2 hours | Minimum 10 participants',
        'prices': {
            'corporate': 9500,      # $95.00
            'community': 7000       # $70.00
        }
    },
    'cedar-basket': {
        'name': 'Cedar Basket Weaving',
        'description': 'Intensive workshop in creating beautiful, functional cedar baskets. Duration: 4 hours | Minimum 10 participants',
        'prices': {
            'corporate': 16000,     # $160.00
            'community': 12000      # $120.00
        }
    },
    'kairos-blanket-inperson': {
        'name': 'Kairos Blanket Exercise - In-Person',
        'description': 'Powerful interactive experience exploring Indigenous history. Minimum booking of 10 participants required.',
        'prices': {
            'corporate': 37500,     # $375.00 per person
            'community': 22500      # $225.00 per person
        }
    },
    'kairos-blanket-virtual': {
        'name': 'Kairos Blanket Exercise - Virtual',
        'description': 'Live online version of the Kairos Blanket Exercise. Minimum booking of 10 participants required.',
        'prices': {
            'corporate': 37500,     # $375.00 per person
            'community': 22500      # $225.00 per person
        }
    }
}

# ============================================================================
# CONFIGURATION: SINGLE SOURCE OF TRUTH - PRODUCTS
# ============================================================================

PRODUCT_CATEGORIES_BASE_PRICES = {
    'shirts': {'name': 'Sparrow Shirts', 'base_price_cents': 2999},      # $29.99
    'mugs': {'name': 'Sparrow Mugs', 'base_price_cents': 1599},          # $15.99
    'pendants': {'name': 'Sparrow Pendants', 'base_price_cents': 2499},  # $24.99
    'pins': {'name': 'Sparrow Pins', 'base_price_cents': 1299},          # $12.99
    'stickers': {'name': 'Sparrow Stickers', 'base_price_cents': 499},   # $4.99
    'prints': {'name': 'Sparrow Prints', 'base_price_cents': 1999},      # $19.99
    'touques': {'name': 'Sparrow Touques', 'base_price_cents': 3499}     # $34.99
}

# Generate product data from categories (10 products per category = 70 total)
GENERATED_PRODUCT_DATA = {}
for section_id, category_data in PRODUCT_CATEGORIES_BASE_PRICES.items():
    base_price = category_data['base_price_cents']
    section_name = category_data['name']
    for i in range(1, 11):  # 10 products per category
        product_id = f"{section_id}-{i}"
        product_name = f"{section_name.replace('Sparrow ', '')} #{i}"
        product_description = f"Unique, handcrafted {product_name} from the Chrystal Sparrow Collection."

        # Price calculation: (basePrice / 100) + (i * 0.5)
        calculated_price_dollars = (base_price / 100) + (i * 0.5)
        calculated_price_cents = round(calculated_price_dollars * 100)

        GENERATED_PRODUCT_DATA[product_id] = {
            'name': product_name,
            'description': product_description,
            'price': calculated_price_cents
        }

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def print_header(text):
    """Print a formatted header."""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}")

def print_step(text):
    """Print a formatted step."""
    print(f"\n>>> {text}")

def print_success(text):
    """Print a success message."""
    print(f"✓ {text}")

def print_error(text):
    """Print an error message."""
    print(f"✗ {text}")

def setup_stripe_workshops(api_key, currency='cad'):
    """
    Idempotently creates Workshop Products and Prices in Stripe.
    Returns dictionary mapping workshop_id to {corporate: price_id, community: price_id}.
    """
    stripe.api_key = api_key
    price_map = {}

    print_step("Syncing workshops with Stripe...")
    print(f"Processing {len(WORKSHOP_DATA)} workshops...")

    try:
        # Retrieve existing products
        existing_products = {}
        for product in stripe.Product.list(limit=100, active=True):
            if 'workshop_id' in product.metadata:
                existing_products[product.metadata['workshop_id']] = product.id

        print_success(f"Found {len(existing_products)} existing workshop products in Stripe")

        for workshop_id, data in WORKSHOP_DATA.items():
            product_name = data['name']
            print(f"\n  Processing: {product_name}")
            price_map[workshop_id] = {}

            # Check if workshop product exists
            if workshop_id in existing_products:
                product_id = existing_products[workshop_id]
                print(f"    → Product already exists (ID: {product_id})")
            else:
                # Create new workshop product
                product = stripe.Product.create(
                    name=product_name,
                    description=data['description'],
                    metadata={'workshop_id': workshop_id}
                )
                product_id = product.id
                print(f"    → Created new product (ID: {product_id})")

            # Retrieve existing prices for this product
            existing_prices = {}
            for price in stripe.Price.list(product=product_id, limit=20):
                if price.nickname:
                    existing_prices[price.nickname] = price.id

            # Create/retrieve prices for each tier (corporate, community)
            for tier, amount in data['prices'].items():
                price_nickname = f"{workshop_id}_{tier}"

                if price_nickname in existing_prices:
                    price_id = existing_prices[price_nickname]
                    amount_display = f"${amount/100:.2f}"
                    print(f"      • {tier}: {amount_display} (ID: {price_id})")
                else:
                    # Create new price
                    price = stripe.Price.create(
                        unit_amount=amount,
                        currency=currency,
                        product=product_id,
                        nickname=price_nickname
                    )
                    price_id = price.id
                    amount_display = f"${amount/100:.2f}"
                    print(f"      • {tier}: {amount_display} → Created (ID: {price_id})")

                price_map[workshop_id][tier] = price_id

        print_success(f"All {len(WORKSHOP_DATA)} workshops synchronized with Stripe")
        return price_map

    except stripe.error.AuthenticationError:
        print_error("Authentication failed. Check your Stripe Secret Key.")
        sys.exit(1)
    except stripe.error.StripeError as e:
        print_error(f"Stripe API error: {e}")
        sys.exit(1)

def setup_stripe_products(api_key, currency='cad'):
    """
    Idempotently creates Product items and Prices in Stripe.
    Returns dictionary mapping product_id (e.g., 'shirts-1') to {price_id: price_id}.
    """
    stripe.api_key = api_key
    price_map = {}
    total_products = len(GENERATED_PRODUCT_DATA)

    print_step("Syncing products with Stripe...")
    print(f"Processing {total_products} individual product items...")

    try:
        # Retrieve existing products by metadata
        existing_stripe_products_by_metadata = {}
        products_iterator = stripe.Product.list(limit=100, active=True)
        all_products = []
        while True:
            for p in products_iterator.data:
                all_products.append(p)
            if not products_iterator.has_more:
                break
            products_iterator = stripe.Product.list(limit=100, starting_after=products_iterator.data[-1].id, active=True)

        for product in all_products:
            if 'local_product_id' in product.metadata:
                existing_stripe_products_by_metadata[product.metadata['local_product_id']] = product.id

        print_success(f"Found {len(existing_stripe_products_by_metadata)} matching existing product items in Stripe")

        processed_count = 0
        for product_id, data in GENERATED_PRODUCT_DATA.items():
            product_name = data['name']
            product_description = data['description']
            amount_cents = data['price']
            processed_count += 1

            # Only print every 5th product to reduce spam
            if processed_count % 5 == 1 or processed_count == 1:
                print(f"\n  ({processed_count}/{total_products}) Processing batch: {product_id}...")

            stripe_product_id = None

            # Try to find by local_product_id metadata
            if product_id in existing_stripe_products_by_metadata:
                stripe_product_id = existing_stripe_products_by_metadata[product_id]
            else:
                # Create new product
                product = stripe.Product.create(
                    name=product_name,
                    description=product_description,
                    metadata={'local_product_id': product_id},
                    active=True
                )
                stripe_product_id = product.id

            if not stripe_product_id:
                print_error(f"  Failed to get or create product for {product_name}.")
                continue

            # Retrieve existing prices for this product
            existing_prices = {}
            prices_iterator = stripe.Price.list(product=stripe_product_id, limit=10)
            for price in prices_iterator.data:
                if price.nickname:
                    existing_prices[price.nickname] = price.id

            # Create/retrieve price for this product
            price_nickname = f"{product_id}_price"

            price_id = None
            if price_nickname in existing_prices:
                price_id = existing_prices[price_nickname]
            else:
                # Create new price
                price = stripe.Price.create(
                    unit_amount=amount_cents,
                    currency=currency,
                    product=stripe_product_id,
                    nickname=price_nickname,
                    active=True
                )
                price_id = price.id

            if price_id:
                price_map[product_id] = {'price_id': price_id}
            else:
                print_error(f"  Failed to get or create price for {product_name}.")

        print_success(f"All {total_products} products and prices synchronized with Stripe.")
        return price_map

    except stripe.error.AuthenticationError:
        print_error("Stripe Authentication failed. Check your Stripe Secret Key.")
        sys.exit(1)
    except stripe.error.StripeError as e:
        print_error(f"A Stripe API error occurred: {e}")
        sys.exit(1)

def generate_config_file(workshop_price_map, product_price_map, config_path='stripe_config.json'):
    """Generate the unified stripe_config.json file with both workshops and products."""
    print_step("Generating unified configuration file...")

    try:
        unified_config = {
            'workshops': workshop_price_map,
            'products': product_price_map
        }

        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(unified_config, f, indent=2)

        print_success(f"Configuration written to {config_path}")
        print(f"  • Workshops: {len(workshop_price_map)}")
        print(f"  • Products: {len(product_price_map)}")
        return config_path
    except IOError as e:
        print_error(f"Failed to write config file: {e}")
        sys.exit(1)

def update_cloud_run_env(stripe_secret_key, stripe_publishable_key, frontend_url):
    """Update Cloud Run environment variables."""
    print_step("Updating Cloud Run environment variables...")

    try:
        env_vars = (
            f"STRIPE_SECRET_KEY={stripe_secret_key},"
            f"STRIPE_PUBLISHABLE_KEY={stripe_publishable_key},"
            f"FRONTEND_URL={frontend_url}"
        )

        command = [
            "gcloud", "run", "services", "update", "moon-tide-ai",
            "--region=us-central1",
            f"--update-env-vars={env_vars}"
        ]

        print(f"  Running: {' '.join(command[:6])} ...")
        result = subprocess.run(
            ' '.join(command),
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print_error("Failed to update Cloud Run")
            print(result.stderr)
            print("  (This may be normal if gcloud is not configured. Continuing...)")
        else:
            print_success("Cloud Run environment variables updated")

    except Exception as e:
        print_error(f"Error updating Cloud Run: {e}")
        print("  (This is optional. You can update manually via Google Cloud Console)")

def inject_publishable_key(stripe_publishable_key):
    """Temporarily inject Stripe Publishable Key into frontend JS."""
    print_step("Preparing frontend for deployment...")

    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        desktop_path = os.path.dirname(script_dir)

        # Path to frontend
        full_path = os.path.join(desktop_path, 'MOON-FRONTEND', 'public', 'js', 'jarvis-ui-manager.js')

        if not os.path.exists(full_path):
            print_error(f"Frontend file not found: {full_path}")
            print("  Skipping key injection (will need manual update)")
            return None

        with open(full_path, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # Create a backup
        backup_path = full_path + '.bak'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        print(f"  ✓ Created backup: {os.path.basename(backup_path)}")

        # Replace the placeholder
        placeholder_pattern = r"const STRIPE_PUBLISHABLE_KEY = 'pk_[a-zA-Z0-9_]*';"
        new_line = f"const STRIPE_PUBLISHABLE_KEY = '{stripe_publishable_key}';"

        if not re.search(placeholder_pattern, original_content):
            print_error("Could not find Stripe key placeholder in frontend file")
            print("  Skipping injection (will need manual update)")
            return None

        updated_content = re.sub(placeholder_pattern, new_line, original_content)

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"  ✓ Injected Stripe Publishable Key into frontend")
        return (full_path, backup_path, original_content)

    except IOError as e:
        print_error(f"Failed to inject key: {e}")
        return None

def restore_frontend_file(restore_info):
    """Restore the frontend file from backup."""
    if not restore_info:
        return

    full_path, backup_path, original_content = restore_info

    try:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        os.remove(backup_path)
        print(f"  ✓ Restored {os.path.basename(full_path)}")
    except IOError as e:
        print_error(f"Failed to restore frontend file: {e}")

def run_deployment_scripts():
    """Run the backend and frontend deployment scripts."""
    print_step("Triggering deployment scripts...")

    desktop_path = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop')

    backend_script = os.path.join(desktop_path, 'DEPLOY_BACKEND.bat')
    frontend_script = os.path.join(desktop_path, 'DEPLOY_FRONTEND.bat')

    if not os.path.exists(backend_script):
        print_error(f"Backend deployment script not found: {backend_script}")
        print("  (Skipping backend deployment)")
    else:
        print("  Running backend deployment...")
        try:
            result = subprocess.run(backend_script, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                print_success("Backend deployed successfully")
            else:
                print_error("Backend deployment failed")
                print(result.stdout)
        except subprocess.TimeoutExpired:
            print_error("Backend deployment timed out")
        except Exception as e:
            print_error(f"Error running backend deployment: {e}")

    if not os.path.exists(frontend_script):
        print_error(f"Frontend deployment script not found: {frontend_script}")
        print("  (Skipping frontend deployment)")
    else:
        print("  Running frontend deployment...")
        try:
            result = subprocess.run(frontend_script, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                print_success("Frontend deployed successfully")
            else:
                print_error("Frontend deployment failed")
                print(result.stdout)
        except subprocess.TimeoutExpired:
            print_error("Frontend deployment timed out")
        except Exception as e:
            print_error(f"Error running frontend deployment: {e}")

# ============================================================================
# MAIN SCRIPT
# ============================================================================

def main():
    print_header("🌊 Moon Tide Reconciliation - HYBRID Stripe & Deployment Orchestrator")

    print("\n📋 This script will:")
    print("  1. Create/verify 12 Moon Tide workshops in Stripe")
    print("  2. Create/verify 70 Chrystal Sparrow products in Stripe")
    print("  3. Generate unified stripe_config.json with all prices")
    print("  4. Update Cloud Run environment variables")
    print("  5. Inject Stripe Publishable Key into frontend")
    print("  6. Trigger deployment scripts")

    # --- PHASE 1: Collect user input ---
    print_header("Phase 1: Collect Configuration")

    print("\nYou will now enter your Stripe API keys and frontend URL.")
    print("⚠️  Keys will NOT be stored in code (except environment variables).")
    print("⚠️  Make sure you're using TEST keys (sk_test_... and pk_test_...)")

    stripe_secret_key = input("\n→ Enter your Stripe SECRET key (sk_test_...): ").strip()
    stripe_publishable_key = input("→ Enter your Stripe PUBLISHABLE key (pk_test_...): ").strip()
    frontend_url = input("→ Enter your Frontend URL (e.g., https://reconciliation-475704.web.app): ").strip()

    # Validate input
    if not all([stripe_secret_key, stripe_publishable_key, frontend_url]):
        print_error("All fields are required!")
        sys.exit(1)

    if not stripe_secret_key.startswith('sk_'):
        print_error("Secret key must start with 'sk_'")
        sys.exit(1)

    if not stripe_publishable_key.startswith('pk_'):
        print_error("Publishable key must start with 'pk_'")
        sys.exit(1)

    print_success("Configuration collected")

    # --- PHASE 2: Setup Stripe (Workshops + Products) ---
    print_header("Phase 2: Sync with Stripe")

    workshop_price_map = setup_stripe_workshops(stripe_secret_key)
    product_price_map = setup_stripe_products(stripe_secret_key)

    # --- PHASE 3: Generate config file ---
    print_header("Phase 3: Generate Unified Configuration File")

    config_file = generate_config_file(workshop_price_map, product_price_map)

    # --- PHASE 4: Update Cloud Run ---
    print_header("Phase 4: Update Cloud Run Environment")

    update_cloud_run_env(stripe_secret_key, stripe_publishable_key, frontend_url)

    # --- PHASE 5: Inject publishable key ---
    print_header("Phase 5: Prepare Frontend for Deployment")

    restore_info = inject_publishable_key(stripe_publishable_key)

    # --- PHASE 6: Run deployment scripts ---
    print_header("Phase 6: Deploy Application")

    try:
        run_deployment_scripts()
    finally:
        # Always restore the frontend file, even if deployment fails
        if restore_info:
            print_step("Cleaning up...")
            restore_frontend_file(restore_info)

    # --- COMPLETION ---
    print_header("✅ HYBRID DEPLOYMENT COMPLETE!")

    print("\n📊 Summary:")
    print(f"  ✓ Stripe workshops: {len(WORKSHOP_DATA)} created/verified")
    print(f"  ✓ Stripe products: {total_products} created/verified")
    print(f"  ✓ Workshop prices: {len(workshop_price_map) * 2} total (corporate + community)")
    print(f"  ✓ Product prices: {len(product_price_map)} total")
    print(f"  ✓ Config file: {config_file}")
    print(f"  ✓ Cloud Run env vars: Updated")
    print(f"  ✓ Frontend: Prepared for deployment")
    print(f"  ✓ Deployments: Triggered")

    print("\n🚀 Next Steps:")
    print("  1. Wait for deployments to complete")
    print("  2. Test the booking flow (workshops) in your Moon Tide portal")
    print("  3. Test the product purchase flow in your store")
    print("  4. Verify Stripe is receiving both types of transactions")
    print("\n📖 For testing, use test card: 4242 4242 4242 4242")
    print("   Any future expiration date, any 3-digit CVC")

    print("\n" + "="*70)

if __name__ == "__main__":
    main()
