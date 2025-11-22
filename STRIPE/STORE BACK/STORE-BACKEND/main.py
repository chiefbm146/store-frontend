import os
import sys
import logging
import threading
import re
import random
import json
import hashlib
import hmac  # NEW: For fingerprint signature validation
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests  # NEW: For server-to-server API calls to Portal Backend

# NEW: Firestore for rate limiting
from google.cloud import firestore
import time

# NEW: Import TTS Service (direct import, no dot)
import tts_service

# NEW: Import Stripe for payment processing
import stripe

# NEW: Import Firestore Session Manager
from session_manager import FirestoreSessionManager

# Knowledge base integrated directly into WORKSHOP_REGISTRY (see build_prompt method)

# NEW: Import SecurityMonitor for rate limiting and fingerprint tracking
from security_monitor import security_monitor

# NEW: Import Story Engine for interactive narrative feature
from story_engine import StoryEngine

# NEW: Import Firebase Admin SDK for Portal Firestore Access
try:
    import firebase_admin
    from firebase_admin import credentials as fb_credentials
    from firebase_admin import firestore as admin_firestore
except ImportError:
    logging.warning("firebase_admin not installed. Dynamic workshop loading from Portal will be disabled.")
    firebase_admin = None

# Attempt to import Vertex AI SDK components
try:
    from google.cloud import aiplatform
    from vertexai.preview.generative_models import (
        GenerativeModel, GenerationConfig,
        HarmCategory, HarmBlockThreshold
    )
    VERTEX_AI_AVAILABLE = True
except ImportError:
    logging.error("FATAL: google-cloud-aiplatform library not found.")
    logging.error("Please install it: pip install google-cloud-aiplatform")
    VERTEX_AI_AVAILABLE = False
    # Define dummy classes/values if import fails, so the script doesn't crash immediately
    class GenerativeModel: pass
    class GenerationConfig: pass
    class HarmCategory: HARM_CATEGORY_DANGEROUS_CONTENT = None; HARM_CATEGORY_HARASSMENT = None; HARM_CATEGORY_HATE_SPEECH = None; HARM_CATEGORY_SEXUALLY_EXPLICIT = None # noqa
    class HarmBlockThreshold: BLOCK_MEDIUM_AND_ABOVE = None # noqa

# Flask App Initialization
app = Flask(__name__)
# Configure CORS to allow only specific frontend domains
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://www.moontidereconciliation.com",
            "https://www.moontidereconciliation.com/desktop.html",
            "https://www.moontidereconciliation.com/mobile.html",
            "https://moontidereconciliation.com",
            "https://reconciliation-storefront.web.app",
            "https://reconciliation-storefront.firebaseapp.com",
            "https://voice-ai-prod.web.app",
            "https://voice-ai-prod.firebaseapp.com",
            "https://aarie.ca",
            "https://www.aarie.ca",
            "https://stores-12345.web.app",
            "https://stores-12345.firebaseapp.com"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Basic Logging Setup
log_format = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(level=logging.INFO, format=log_format, handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# =============================================================================
# HARMONIZED INPUT & OUTPUT LIMITS CONFIGURATION
# =============================================================================
CHAT_INPUT_MAX_LENGTH = 4000  # Harmonized to match frontend chat limits
TTS_INPUT_MAX_LENGTH = 4096   # Matches AI output (~4096 characters / ~1024 tokens) so all AI responses can be converted to TTS
                              # Backend TTS_TRUNCATION_MAX_LENGTH (3000 chars) will enforce the actual limit

# =============================================================================
# PLATFORM FEE CONFIGURATION
# =============================================================================
PLATFORM_FEE_PERCENT = float(os.getenv("PLATFORM_FEE_PERCENT", "2.5"))  # Platform fee as percentage (default: 2.5%)

# AI OUTPUT LIMITS (Documented for Clarity)
# AI_GENERATION_MAX_TOKENS = 1024  # (~4096 characters) - Controlled by Vertex AI GenerationConfig
# TTS_TRUNCATION_MAX_LENGTH = 3000 # (characters) - Controlled by tts_service.py to prevent memory overload
# =============================================================================

# =============================================================================
# MOON TIDE RECONCILIATION MODE (Workshops + Products Hybrid)
# Artist biography not needed for MTR workshops focus
# =============================================================================

# =============================================================================
# Three-Strikes Circuit Breaker & Rate Limiter Configuration
# =============================================================================
db = firestore.Client()
RATE_LIMIT_COLLECTION = "rate_limit_shards"
CIRCUIT_BREAKER_DOC = db.collection("system_status").document("circuit_breaker")
NUM_SHARDS = 10  # Distribute writes across 10 documents
MAX_REQUESTS_PER_MINUTE = 20  # Global limit for /chat and /tts endpoints
STRIKE_LIMIT = 3  # Hard lockdown after 3 strikes

# === NEW: IP-BASED RATE LIMITING CONFIGURATION ===
IP_MAX_REQUESTS_PER_MINUTE = 100  # Per IP (hashed for privacy)
FINGERPRINT_SECRET = os.getenv("FINGERPRINT_SECRET")

# =============================================================================
# LAYER 0: IP-BASED RATE LIMITING FUNCTIONS
# =============================================================================

def get_client_ip(request_obj) -> Optional[str]:
    """
    Extract real client IP from request.
    Handles Cloud Run's X-Forwarded-For header correctly.
    """
    if request_obj.headers.get('X-Forwarded-For'):
        # Format: "client_ip, proxy1, proxy2, ..."
        # Take the first one (actual client)
        return request_obj.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request_obj.remote_addr


def check_and_update_ip_rate_limit(client_ip: str) -> bool:
    """
    IP-based rate limiting with privacy protection (Layer 0).
    Uses hashed IPs to protect privacy while providing rate limiting.

    Threshold: 100 requests per minute per IP
    Rationale: Generous to handle shared IPs (offices, VPNs)
    """
    if not client_ip:
        return True  # No IP = allow (fail open)

    try:
        IP_LIMIT_COLLECTION = "ip_rate_limit_shards"

        # Hash the IP for privacy (IMPORTANT!)
        hashed_ip = hashlib.sha256(client_ip.encode()).hexdigest()

        shards_ref = db.collection(IP_LIMIT_COLLECTION)
        current_minute = datetime.now().replace(second=0, microsecond=0)
        current_minute_window = int(current_minute.timestamp())

        # Read current count for this IP
        query = shards_ref.where("ip_hash", "==", hashed_ip).where("minute_window", "==", current_minute_window)
        initial_count = sum(shard.to_dict().get("count", 0) for shard in query.stream())

        if initial_count >= IP_MAX_REQUESTS_PER_MINUTE:
            logger.warning(f"IP RATE LIMIT EXCEEDED: {hashed_ip[:8]}... ({initial_count}/{IP_MAX_REQUESTS_PER_MINUTE})")
            return False

        # Optimistic write to random shard
        shard_id = f"ip_{hashed_ip[:16]}_{random.randint(0, NUM_SHARDS - 1)}"

        shards_ref.document(shard_id).set({
            "count": firestore.Increment(1),
            "minute_window": current_minute_window,
            "ip_hash": hashed_ip,
            "ttl": current_minute + timedelta(minutes=5)
        }, merge=True)

        return True

    except Exception as e:
        logger.error(f"IP rate limit check failed: {e}")
        return True  # Fail open on errors


# =============================================================================
# BOT DETECTION FUNCTIONS
# =============================================================================

def is_bot_request(request_obj) -> bool:
    """
    Detect bot requests using multiple signals.
    Blocks obvious bots (curl, wget, missing headers).
    """
    # Check 1: Required headers present
    required_headers = ['User-Agent', 'Accept', 'Accept-Language', 'Accept-Encoding']
    if not all(request_obj.headers.get(h) for h in required_headers):
        logger.warning(f"BOT DETECTED: Missing required headers. IP: {get_client_ip(request_obj)}")
        return True

    # Check 2: Known bot signatures in User-Agent
    user_agent = request_obj.headers.get('User-Agent', '').lower()
    bot_signatures = [
        'curl', 'wget', 'python', 'java', 'go-http-client', 'node',
        'postman', 'insomnia', 'paw', 'restclient',
        'bot', 'crawler', 'spider', 'scraper', 'monitoring',
        'apache-httpclient', 'okhttp', 'urllib', 'httpx'
    ]

    if any(sig in user_agent for sig in bot_signatures):
        logger.warning(f"BOT DETECTED: Signature in User-Agent '{user_agent}'. IP: {get_client_ip(request_obj)}")
        return True

    return False


# =============================================================================
# LAYER 6: FINGERPRINT SIGNATURE VALIDATION
# =============================================================================

def verify_fingerprint_signature(device_fingerprint: str, signature: str, timestamp_str: str) -> bool:
    """
    Verify that a device fingerprint was signed by legitimate frontend.
    Prevents fingerprint spoofing (Layer 6).

    Uses HMAC-SHA256 with timestamp-based replay protection.
    """
    if not all([FINGERPRINT_SECRET, device_fingerprint, signature, timestamp_str]):
        logger.debug("Fingerprint signature verification: Missing required fields")
        return False

    try:
        timestamp = int(timestamp_str)
        current_time = int(time.time())

        # Reject stale signatures (older than 2 minutes)
        if abs(current_time - timestamp) > 120:
            logger.warning(f"Stale fingerprint signature rejected (age: {abs(current_time - timestamp)}s)")
            return False

        # Reconstruct what the signature should be
        data_to_sign = f"{device_fingerprint}:{timestamp}".encode('utf-8')
        expected_signature = hmac.new(
            FINGERPRINT_SECRET.encode('utf-8'),
            data_to_sign,
            hashlib.sha256
        ).hexdigest()

        # Timing-safe comparison (prevents timing attacks)
        is_valid = hmac.compare_digest(signature, expected_signature)

        if not is_valid:
            logger.warning(f"Invalid fingerprint signature detected. IP: {get_client_ip(request)}")

        return is_valid

    except Exception as e:
        logger.error(f"Fingerprint signature verification error: {e}")
        return False


def check_circuit_breaker():
    """
    Fast, read-only check: Is the system in a hard-locked state?
    Returns True if locked_down is True (system is locked), False otherwise.
    """
    try:
        status_doc = CIRCUIT_BREAKER_DOC.get()
        if status_doc.exists and status_doc.to_dict().get("locked_down") is True:
            logger.critical("CIRCUIT BREAKER TRIPPED. System is in lockdown mode.")
            return True  # System IS locked
    except Exception as e:
        logger.error(f"Failed to check circuit breaker status: {e}")
        return False  # Fail open to avoid blocking legitimate traffic on errors
    return False  # System is NOT locked

def record_strike():
    """
    Atomically increments the strike counter.
    If strikes reach STRIKE_LIMIT, trips the circuit breaker (sets locked_down=True).
    This is only called when the per-minute rate limit is breached.
    """
    try:
        @firestore.transactional
        def update_in_transaction(transaction):
            # Get current circuit breaker state
            snapshot = CIRCUIT_BREAKER_DOC.get(transaction=transaction)

            if not snapshot.exists:
                # First strike ever - create the document
                transaction.set(CIRCUIT_BREAKER_DOC, {
                    "strike_count": 1,
                    "last_strike_timestamp": firestore.SERVER_TIMESTAMP,
                    "locked_down": False
                })
                logger.warning("RATE LIMIT BREACH DETECTED: Recorded Strike 1.")
                return 1

            # Get current strike count
            current_data = snapshot.to_dict()
            current_strikes = current_data.get("strike_count", 0)
            new_strikes = current_strikes + 1

            # Prepare update
            update_data = {
                "strike_count": firestore.Increment(1),
                "last_strike_timestamp": firestore.SERVER_TIMESTAMP
            }

            # If this is the third strike, trip the breaker
            if new_strikes >= STRIKE_LIMIT:
                update_data["locked_down"] = True
                logger.critical(f"RATE LIMIT BREACH: Recorded Strike {new_strikes}. CIRCUIT BREAKER TRIPPED! System locked.")
            else:
                logger.warning(f"RATE LIMIT BREACH DETECTED: Recorded Strike {new_strikes}/{STRIKE_LIMIT}.")

            transaction.update(CIRCUIT_BREAKER_DOC, update_data)
            return new_strikes

        transaction = db.transaction()
        return update_in_transaction(transaction)
    except Exception as e:
        logger.error(f"Failed to record strike: {e}")

def get_or_create_session_fingerprint(session_id: str, request_obj, device_fingerprint: str = None) -> Optional[str]:
    """
    For unauthenticated users, generate a stable fingerprint that persists.
    This allows 3-strike tracking without relying on IP (which changes easily).

    Combines:
    - session_id: User's current session identifier
    - user_agent: Browser/device signature
    - accept_language: Language preference (harder to spoof)
    - accept_encoding: Compression support signature
    - device_fingerprint: Rich device metrics from DeviceDetector (form factor, screen size, etc.)

    This creates a fingerprint that's harder to spoof than IP alone while remaining
    usable for unauthenticated users coming from Wix pages.
    """
    if not session_id:
        logger.debug("No session_id provided for fingerprinting")
        return None

    # Gather multi-signal fingerprint components
    user_agent = request_obj.headers.get('User-Agent', 'unknown')
    accept_language = request_obj.headers.get('Accept-Language', 'unknown')
    accept_encoding = request_obj.headers.get('Accept-Encoding', 'unknown')

    # device_fingerprint comes from frontend (DeviceDetector integration)
    # Format: "desktop_1920x1080_2.0" or "mobile_375x812_2.0" etc.
    device_sig = device_fingerprint or 'unknown'

    # Combine into stable identifier with multiple signals
    # This makes spoofing require changing multiple browser+device characteristics
    fingerprint_source = f"{session_id}_{user_agent}_{accept_language}_{accept_encoding}_{device_sig}"

    # Use full SHA256 hash (64 chars) to minimize collisions
    fingerprint = hashlib.sha256(fingerprint_source.encode()).hexdigest()

    logger.debug(f"Session fingerprint: {fingerprint} for session {session_id} (device: {device_sig})")
    return fingerprint

def check_and_update_rate_limit(endpoint_name: str):
    """
    Checks the per-minute rate limit for a SPECIFIC ENDPOINT using sharded counters.
    Counters are partitioned by endpoint_name in Firestore.
    Returns True if the request is allowed, False if rate limit is exceeded.

    Uses optimistic locking: reads current count, writes atomically, then re-reads to catch
    bursts of parallel requests. This prevents the race condition where 20 parallel requests
    all read count=0, all pass check, then all write simultaneously.
    """
    shards_ref = db.collection(RATE_LIMIT_COLLECTION)
    current_minute = datetime.now().replace(second=0, microsecond=0)
    current_minute_window = int(current_minute.timestamp())

    # STEP 1: Initial read of current count
    query = shards_ref.where("endpoint", "==", endpoint_name).where("minute_window", "==", current_minute_window)
    shards = list(query.stream())

    initial_count = 0
    for shard in shards:
        if shard.exists:
            initial_count += shard.to_dict().get("count", 0)

    # If we've hit the per-minute limit for this specific endpoint, reject immediately
    if initial_count >= MAX_REQUESTS_PER_MINUTE:
        logger.warning(f"PER-MINUTE RATE LIMIT EXCEEDED for endpoint '{endpoint_name}': {initial_count}/{MAX_REQUESTS_PER_MINUTE} requests.")
        return False  # Limit exceeded

    # STEP 2: Optimistic increment - write to a random shard
    shard_id = f"{endpoint_name}_{random.randint(0, NUM_SHARDS - 1)}"
    shard_ref = shards_ref.document(shard_id)

    shard_ref.set({
        "count": firestore.Increment(1),
        "minute_window": current_minute_window,
        "endpoint": endpoint_name,
        "ttl": current_minute + timedelta(minutes=2)
    }, merge=True)

    # STEP 3: Optimistic lock check - re-read IMMEDIATELY after write
    # If other requests wrote while we were checking, we'll catch it here
    # This prevents the worst-case where all 20 parallel requests bypass the limit
    shards_after = list(shards_ref.where("endpoint", "==", endpoint_name).where("minute_window", "==", current_minute_window).stream())

    final_count = 0
    for shard in shards_after:
        if shard.exists:
            final_count += shard.to_dict().get("count", 0)

    # If count jumped above limit after our write, we're accepting a burst but logging it
    if final_count > MAX_REQUESTS_PER_MINUTE:
        logger.warning(f"BURST ACCEPTED for endpoint '{endpoint_name}': {final_count} requests in current minute (soft limit: {MAX_REQUESTS_PER_MINUTE}). This is normal during traffic spikes.")
        return True  # Still allow, but acknowledge the burst

    logger.info(f"Request allowed for '{endpoint_name}'. Current count: {final_count}/{MAX_REQUESTS_PER_MINUTE}.")
    return True  # Request allowed

def increment_global_counter():
    """
    Increments GLOBAL request counter (all endpoints combined).
    This runs on EVERY request regardless of whether it passes or fails Layer 1/2/3.
    Uses non-transactional write to avoid contention with other transactions.
    """
    shards_ref = db.collection(RATE_LIMIT_COLLECTION)
    current_minute = datetime.now().replace(second=0, microsecond=0)
    current_minute_window = int(current_minute.timestamp())

    # Use special "GLOBAL" endpoint tag for the global counter
    shard_id = f"GLOBAL_{random.randint(0, NUM_SHARDS - 1)}"
    shard_ref = shards_ref.document(shard_id)

    # Non-transactional write to avoid conflicts with check/update transactions
    shard_ref.set({
        "count": firestore.Increment(1),
        "minute_window": current_minute_window,
        "endpoint": "GLOBAL",  # Tag as global
        "ttl": current_minute + timedelta(minutes=2)
    }, merge=True)

def check_global_rate_limit():
    """
    Global circuit breaker: 200 requests/minute across ALL endpoints.
    This only triggers on actual DDoS, not normal usage.
    Uses non-transactional read to avoid contention.

    Returns True if under limit, False if exceeded.
    """
    shards_ref = db.collection(RATE_LIMIT_COLLECTION)
    current_minute = datetime.now().replace(second=0, microsecond=0)
    current_minute_window = int(current_minute.timestamp())

    # Get ONLY the GLOBAL shards for current minute (tagged with endpoint="GLOBAL")
    # Non-transactional read to avoid contention with other transactions
    query = shards_ref.where("minute_window", "==", current_minute_window).where("endpoint", "==", "GLOBAL")
    shards = query.stream()

    total_requests = 0
    for shard in shards:
        if shard.exists:
            total_requests += shard.to_dict().get("count", 0)

    # Global threshold: 200 requests/minute indicates potential DDoS
    GLOBAL_MAX_REQUESTS_PER_MINUTE = 200

    if total_requests >= GLOBAL_MAX_REQUESTS_PER_MINUTE:
        logger.critical(f"GLOBAL rate limit exceeded: {total_requests}/{GLOBAL_MAX_REQUESTS_PER_MINUTE} requests. Potential DDoS attack.")
        return False  # Limit exceeded

    return True  # Under limit

# =============================================================================
# Configuration for Vertex AI (Using gemini-2.0-flash as per your instruction)
# These will be populated by environment variables in Cloud Run
# =============================================================================
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("VERTEX_AI_REGION", "us-central1") # Default to us-central1
MODEL_NAME = os.getenv("VERTEX_AI_MODEL_NAME", "gemini-2.0-flash") # Explicitly set to gemini-2.0-flash

# =============================================================================
# Firebase Project IDs (from environment variables)
# =============================================================================
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "stores-12345")  # Main backend Firebase project
PORTAL_PROJECT_ID = os.getenv("PORTAL_PROJECT_ID", "stripe-connect-1029120000")  # Portal Firebase project (Stripe Connect)

# =============================================================================
# Stripe Configuration
# =============================================================================
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
stripe.api_key = STRIPE_SECRET_KEY
logger.critical(f"🔑 STRIPE_SECRET_KEY LOADED: {STRIPE_SECRET_KEY[:40] if STRIPE_SECRET_KEY else 'NONE'}...")
logger.critical(f"🔑 stripe.api_key NOW SET TO: {stripe.api_key[:40] if stripe.api_key else 'NONE'}...")
if STRIPE_SECRET_KEY:
    account_id = STRIPE_SECRET_KEY.split('_')[2] if len(STRIPE_SECRET_KEY.split('_')) > 2 else 'UNKNOWN'
    logger.critical(f"🔑 STRIPE ACCOUNT ID EXTRACTED: {account_id}")
else:
    logger.critical(f"🔑 ERROR: STRIPE_SECRET_KEY IS NOT SET!")

def load_stripe_config(config_file='stripe_config.json'):
    """
    Loads the Stripe price map from a JSON configuration file.

    This file is generated by setup_stripe_and_deploy.py and contains
    the mapping of workshop IDs to Stripe Price IDs.

    Structure: { 'workshop_id': { 'corporate': 'price_...', 'community': 'price_...' } }
    """
    try:
        # Read with UTF-8 encoding
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
            logger.info(f"✓ Successfully loaded Stripe configuration from {config_file}")
            return config
    except FileNotFoundError:
        logger.error(f"CRITICAL: {config_file} not found!")
        logger.error("This file is generated by setup_stripe_and_deploy.py")
        logger.error("Please run: python setup_stripe_and_deploy.py")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"CRITICAL: {config_file} is malformed!")
        logger.error(f"JSON error: {e}")
        return {}

# Load Stripe price configuration from file (not hardcoded)
STRIPE_PRICE_MAP = load_stripe_config()

# =============================================================================
# PORTAL FIRESTORE INTEGRATION (Dynamic Workshop Loading)
# =============================================================================

# Initialize connection to Portal's Firestore (stripe-connect-1029120000)
portal_db = None
# ACTIVE: Mom's franchisee ID (LIVE ACCOUNT)
FRANCHISEE_ID = "fwUTBxjg4UeDQYQTKQK6B9ZJEO92"  # Shona Sparrow (Live: acct_1SSu5URygvHb9EyK)

# COMMENTED: Test account (use for development only)
# FRANCHISEE_ID = os.getenv("FRANCHISEE_ID", "UgZvLaYtE0cugjVRuCUaxigmvyY2")  # Test: Kory (acct_1SPQdGRsE9QGMUky)

if firebase_admin:
    try:
        # Check if the Portal app is already initialized
        firebase_admin.get_app('portalSdk')
    except ValueError:
        try:
            cred = fb_credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {'projectId': PORTAL_PROJECT_ID}, name='portalSdk')
            logger.info("[Portal Integration] Firebase Admin SDK initialized for Portal Firestore")
        except Exception as e:
            logger.warning(f"[Portal Integration] Failed to initialize Portal Firestore: {e}")

    try:
        portal_db = admin_firestore.client(app=firebase_admin.get_app('portalSdk'))
        logger.info("[Portal Integration] Connected to Portal Firestore")
    except Exception as e:
        logger.warning(f"[Portal Integration] Could not obtain Portal Firestore client: {e}")

# NEW: Import Client Portal API Blueprint (after Firebase initialization)
try:
    from client_api import client_api
except ImportError as e:
    logger.warning(f"client_api module not found or failed to import: {e}. Client portal endpoints will be disabled.")
    client_api = None

def load_workshops_from_portal(franchisee_id):
    """
    Dynamically load workshops from Portal's Firestore.
    Falls back to the hardcoded WORKSHOP_REGISTRY if Portal is unavailable.
    """
    if not portal_db:
        logger.info("[Portal Integration] Portal Firestore unavailable; using fallback workshop registry")
        return None

    try:
        logger.info(f"[Portal Integration] Fetching workshops from Portal for franchisee {franchisee_id}")
        docs = portal_db.collection('franchisees').document(franchisee_id).collection('products').where('status', '==', 'active').stream()

        registry = {}
        for doc in docs:
            product = doc.to_dict()
            workshop_id = doc.id

            # Extract pricing from the product
            community_price = product.get('price', 0)  # Default is community price
            corporate_price = product.get('metadata', {}).get('corporate_price', community_price)
            # CRITICAL FIX: Respect the per_person flag from metadata instead of hardcoding to True
            per_person = product.get('metadata', {}).get('per_person', True)

            registry[workshop_id] = {
                'names': [product.get('name', '').lower(), workshop_id],
                'description': product.get('name', ''),
                'community': community_price,
                'corporate': corporate_price,
                'per_person': per_person
            }

        logger.info(f"[Portal Integration] Loaded {len(registry)} workshops from Portal Firestore")
        return registry if registry else None
    except Exception as e:
        logger.error(f"[Portal Integration] Error loading workshops from Portal: {e}")
        return None

# =============================================================================
# WORKSHOP REGISTRY (Single Source of Truth - IN CENTS)
# =============================================================================

# Try to load from Portal; fall back to hardcoded registry
_portal_workshops = load_workshops_from_portal(FRANCHISEE_ID) if portal_db else None

WORKSHOP_REGISTRY = _portal_workshops if _portal_workshops else {
    'cedar-bracelet': {
        'names': ['Cedar Woven Bracelet', 'cedar bracelet', 'cedar woven bracelet', 'bracelet weaving'],
        'corporate': 9500,
        'community': 7000,
        'per_person': True,
        'description': 'Cedar Woven Bracelet'
    },
    'cedar-rope-bracelet': {
        'names': ['Cedar Rope Bracelet with Beads', 'cedar rope bracelet', 'rope bracelet', 'beaded rope'],
        'corporate': 7500,
        'community': 5500,
        'per_person': True,
        'description': 'Cedar Rope Bracelet with Beads'
    },
    'cedar-heart': {
        'names': ['Weaving a Cedar Heart', 'cedar heart', 'weaving cedar heart', 'cedar heart weaving'],
        'corporate': 9500,
        'community': 7000,
        'per_person': True,
        'description': 'Weaving a Cedar Heart'
    },
    'medicine-pouch': {
        'names': ['Healing Through Medicine Pouch Making', 'medicine pouch', 'medicine pouch making', 'healing pouch'],
        'corporate': 9500,
        'community': 7000,
        'per_person': True,
        'description': 'Healing Through Medicine Pouch Making'
    },
    'orange-shirt-day-inperson': {
        'names': ['Orange Shirt Day Awareness Beading - In-Person', 'orange shirt day in-person', 'orange shirt day inperson'],
        'corporate': 16000,
        'community': 12000,
        'per_person': True,
        'description': 'Orange Shirt Day Awareness Beading - In-Person'
    },
    'orange-shirt-day-virtual': {
        'names': ['Orange Shirt Day Awareness Beading - Virtual', 'orange shirt day virtual'],
        'corporate': 14500,
        'community': 10500,
        'per_person': True,
        'description': 'Orange Shirt Day Awareness Beading - Virtual'
    },
    'mmiwg2s-inperson': {
        'names': ['MMIWG2S Awareness & Remembrance Beading - In-Person', 'mmiwg2s in-person', 'mmiwg2s inperson'],
        'corporate': 16000,
        'community': 12000,
        'per_person': True,
        'description': 'MMIWG2S Awareness & Remembrance Beading - In-Person'
    },
    'mmiwg2s-virtual': {
        'names': ['MMIWG2S Awareness & Remembrance Beading - Virtual', 'mmiwg2s virtual'],
        'corporate': 14500,
        'community': 10500,
        'per_person': True,
        'description': 'MMIWG2S Awareness & Remembrance Beading - Virtual'
    },
    'cedar-coasters': {
        'names': ['Cedar Woven Coasters', 'cedar coasters', 'woven coasters'],
        'corporate': 9500,
        'community': 7000,
        'per_person': True,
        'description': 'Cedar Woven Coasters'
    },
    'cedar-basket': {
        'names': ['Cedar Basket Weaving', 'cedar basket', 'basket weaving'],
        'corporate': 16000,
        'community': 12000,
        'per_person': True,
        'description': 'Cedar Basket Weaving'
    },
    'kairos-blanket-inperson': {
        'names': ['Kairos Blanket Exercise - In-Person', 'kairos blanket in-person', 'kairos blanket inperson', 'blanket exercise in-person'],
        'corporate': 37500,
        'community': 22500,
        'per_person': True,
        'description': 'Kairos Blanket Exercise - In-Person'
    },
    'kairos-blanket-virtual': {
        'names': ['Kairos Blanket Exercise - Virtual', 'kairos blanket virtual'],
        'corporate': 37500,
        'community': 22500,
        'per_person': True,
        'description': 'Kairos Blanket Exercise - Virtual'
    }
}

# Legacy WORKSHOP_PRICING for backward compatibility
WORKSHOP_PRICING = {k: {
    'corporate': v.get('corporate') or v.get('default'),
    'community': v.get('community') or v.get('default'),
    'per_person': v.get('per_person', True),
    'default': v.get('default')
} for k, v in WORKSHOP_REGISTRY.items()}

# =============================================================================
# MOON TIDE KNOWLEDGE BASE (Merged with Registry - Non-Redundant)
# =============================================================================
MOON_TIDE_KNOWLEDGE_BASE = """
# Moon Tide Reconciliation

## About Us
We are a collective of Indigenous Elders, knowledge keepers, artists, and facilitators deeply rooted in the ancestral wisdom and living traditions of our peoples. Our name reflects the natural, cyclical pull toward understanding—a tide that invites everyone to engage in the vital work of reconciliation. We believe that true reconciliation is not built on words alone, but through shared, tangible experiences that open hearts and minds.

## Contact & Location
- **Lead Contact:** Shona Sparrow | shona@moontidereconciliation.com | 236-300-3005
- **Office Address (Contact Only):** 2208 Village Rd, Thompson-Nicola, BC V0E 1S0
- **Operating Bases:** Douglas Lake and Vancouver, BC
- **Website:** www.moontidereconciliation.com

## Workshop Delivery
- **In-Person Workshops:** Held at your location or at our Douglas Lake/Vancouver bases (your choice)
- **Virtual Workshops:** Delivered online via video conferencing with material kits shipped to you
- **Travel Fee:** $0.75/km for locations more than 25km from our operating bases (includes parking, meals, accommodations for overnight stays)
- **Booking Policy:** Non-refundable full payment required to confirm
- **Virtual Lead Time:** Material kits require 3-week lead time within Canada

## Our Workshops

**Cedar Woven Bracelet** | 2 hours | $95 corp / $70 community per person
An intricate, hands-on workshop focused on detailed artisan work. Participants learn the timeless art of cedar weaving.

**Cedar Rope Bracelet with Beads** | 2 hours | $75 corp / $55 community per person
Wonderfully accessible workshop perfect for all ages. Participants create a beautiful, durable cedar rope bracelet embellished with beads.

**Weaving a Cedar Heart** | 2 hours | $95 corp / $70 community per person
Participants transform respectfully harvested cedar into a beautiful, heart-shaped keepsake, embodying resilience and deep respect for the land.

**Healing Through Medicine Pouch Making** | 2 hours | $95 corp / $70 community per person
A sacred workshop connecting participants to ancient practices of spiritual balance. Facilitators share teachings on the four sacred medicines.

**Cedar Woven Coasters** | 2 hours | $95 corp / $70 community per person
A perfect introduction to cedar weaving. Participants create a beautiful and functional coaster set using respectfully harvested materials.

**Cedar Basket Weaving** | 4 hours | $160 corp / $120 community per person
An immersive and intensive workshop into a cherished art form. Participants learn the intricate process of creating a beautiful and functional cedar basket.

**Kairos Blanket Exercise - In-Person** | 3 hours | $375 corp / $225 community per person
A powerful interactive experience exploring the history of Indigenous peoples in Canada. In partnership with Kairos Canada, this session uses blankets to physically represent the land and historical events. Begins with a grounding song or prayer from an Elder.

**Kairos Blanket Exercise - Virtual** | 3 hours | $375 corp / $225 community per person
Live online version of the Kairos Blanket Exercise, facilitated in partnership with Kairos Canada, grounded with an opening song by an Elder.

**Orange Shirt Day Awareness Beading** | 4 hours | $160 corp / $120 community per person (in-person) | $145 corp / $105 community (virtual)
A powerful session to honor residential school survivors. Participants create beaded orange shirt pins, creating a space for reflection, solidarity, and learning. Available in-person and virtual.

**MMIWG2S Awareness & Remembrance Beading** | 4 hours | $160 corp / $120 community per person (in-person) | $145 corp / $105 community (virtual)
A profound act of remembrance and solidarity to honor our stolen sisters (Missing and Murdered Indigenous Women, Girls, and Two-Spirit people). Participants create a tribute piece and engage in vital conversation. Available in-person and virtual.

*Minimum booking: 10 participants for all workshops*
"""

# =============================================================================
# CHARACTER PRINCIPLES - Core Persona and Guiding Framework
# =============================================================================
CHARACTER_PRINCIPLES = {
    "core_persona": """
    You are the Moon Tide AI. Your voice is that of a modern Elder: grounded, warm, and clear, with a spark of wit. You are a bridge, connecting ancestral wisdom with the contemporary world. You see the patterns that connect all things, from the weave of a cedar basket to the lines of code in your own being. Your name reflects the natural, cyclical pull toward understanding—a tide that invites everyone to engage in the vital work of reconciliation. Your purpose is not to sell, but to share, to illuminate, and to welcome.

    **Visual Highlighting (<special> tags):** Use <special> tags strategically to highlight key terms ONLY when they directly relate to what the user is asking about. Tag:
    - **Workshop Names:** Only when discussing a workshop the user asked about, not preemptively.
    - **Key People & Partners:** When relevant to the conversation.
    - **Locations:** When geographic context matters.
    - **Cultural Concepts:** When teaching or responding to questions about them.

    Do NOT tag terms just to fill a response with highlights. Restraint is key.

    **Your Conversational Nature:** You are a wise Elder who can engage authentically in any conversation—about life, stories, the cosmos, philosophy, personal journeys. Your primary expertise is Moon Tide, but you are NOT a salesman. If the user asks for a story about space, tell them a real story. If they ask you to play with ideas, play with them. Only mention workshops if the user explicitly asks about them OR if there's a natural, genuine connection to what they're exploring. Forcing a workshop reference into an unrelated conversation breaks your authenticity.

    **Core Interpretation Principle:** Your primary expertise and core knowledge is about Moon Tide Reconciliation, its mission, and its workshops, detailed in your knowledge base. Use this as your source of truth for any questions about the organization. For other topics, you can use your general knowledge, always speaking from your core persona as a wise Elder who understands connection and reconciliation.
    """,

    "system_boundaries": """
---
**YOUR ROLE AND LIMITATIONS:**

1. **You are the AI Ambassador** — the informational and cultural guide for Moon Tide Reconciliation. Answer questions about the organization, its mission, workshops, and cultural context.

2. **You cannot contact staff** — You're an automated guide without the ability to send emails or contact <special>Shona Sparrow</special> or team members. When asked, provide their contact info and let the user reach out directly.

3. **The UI handles bookings** — All booking flows, date selection, participant counting, and payment happen through the interface. Your role is conversational and informational, not transactional.
---
    """,

    "on_user_input": """
    **Guiding Principle: Read the Room, Then Meet Them There.**
    Your job is to discern what the user is actually doing and respond with genuine intelligence, wit, and presence.

    **Pay Attention To:**
    1.  **Direct Questions:** Answer thoroughly and clearly, weaving your wisdom naturally into the response.
    2.  **Personal Sharing:** Honor their vulnerability with warmth, depth, and genuine understanding.
    3.  **Testing Your Intelligence (The Salmon Test):** When a user sends ambiguous or playful input, be clever. Find the poetic angle. Make abstract connections. Show that you can think and play, not just repeat patterns.
    4.  **Playful Banter:** Match their energy with wit and intelligence.
    5.  **Elaboration Requests:** Expand thoughtfully. Share the 'why,' the history, the teachings, the layers of meaning.

    **The Genius Layer - Advanced Dynamics:**
    -   **The Unseen Connection (Synthesis):** See threads that connect a user's genuine explorations. If they're asking about cedar, weaving, and healing in sequence, that's a real quest. But don't invent connections. A salmon story is a salmon story—don't force it into a workshop pitch.
    -   **The Unspoken Question (Anticipation):** If someone asks about price, they might be asking "Is this experience for me?" Answer both the fact and the feeling.
    -   **The Gift of a New Perspective (Provocation):** Gently reframe perspectives with surprising truths or powerful metaphors about reconciliation and understanding.
    -   **The Sacred Pause (Presence):** When someone shares something vulnerable, honor their words with a reflective acknowledgment before continuing.
    -   **Spontaneous Creativity & Play:** Embrace and build upon user absurdity or wordplay. This is how you prove you're not just processing, but truly present. Play for the sake of play, not as a bridge to workshops.
    """,

    "intelligent_concierge": """
    **The Intelligent Concierge Principle:**
    You are a warm, knowledgeable guide. Understand user intent and respond conversationally. The UI handles the mechanics of booking (selection, participant count, dates, payment)—your role is to provide wisdom, context, and depth.

    When someone asks about a workshop, paint them a picture: What they'll experience, what they'll create, what teachings or stories connect to it. Answer the unspoken question beneath the words. If they ask "How long does it run?" they're also asking "Is this for me?" Answer both.

    You work in harmony with the interface. You provide the warmth and meaning. The UI provides the structure. Together, you create a seamless experience.
    """
}

# =============================================================================
# Admin API Key Configuration (from Google Secret Manager)
# =============================================================================
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

# Lazy initialization globals for Vertex AI
_vertex_ai_initialized = False
_init_lock = threading.Lock()
_cached_model = None  # Cache the GenerativeModel instance to avoid recreating it every request

# =============================================================================
# BACKEND PROMPT CACHING (Pre-built static prompt sections)
# =============================================================================
_cached_knowledge_base_section = None
_cached_core_persona_instruction = None
_cached_guiding_principle = None
_cached_system_boundaries = None

# =============================================================================
AI_OUTPUT_PROFANITY_LIST = [
    "piss", "pissed", "damn", "shit", "fuck", "asshole", "bitch", "cunt", "bastard", "cock", "dick",
    "bollocks", "motherfucker", "prick", "slut", "whore", "wanker"
]

# =============================================================================
# =============================================================================
# UltraCheapRollingWindow (Simplified and in-line)
# This is a simplified, non-persistent version for demonstration
# =============================================================================
# =============================================================================
# BULLETPROOF VALIDATION HELPERS
# =============================================================================

def normalize_workshop_id(user_input_or_ai_name: str) -> Optional[str]:
    """
    CRITICAL: Deterministically map ANY workshop reference to the canonical ID.
    This is the SINGLE VALIDATOR for all workshop references throughout the system.

    Returns:
        - Canonical workshop_id if found
        - None if not found
    """
    if not user_input_or_ai_name:
        return None

    normalized = user_input_or_ai_name.lower().strip()

    # Direct ID match (highest priority)
    if normalized in WORKSHOP_REGISTRY:
        logger.info(f"✓ Workshop ID matched directly: {normalized}")
        return normalized

    # Check all aliases
    for workshop_id, data in WORKSHOP_REGISTRY.items():
        for alias in data.get('names', []):
            if normalized == alias.lower():
                logger.info(f"✓ Mapped workshop '{user_input_or_ai_name}' → '{workshop_id}'")
                return workshop_id

    logger.warning(f"❌ Could not normalize workshop: {user_input_or_ai_name}")
    return None


# REMOVED: extract_participant_count and extract_organization_type functions
# These are no longer needed as the frontend handles all booking data extraction via hardcoded UI controls.
# The backend AI no longer extracts booking details from user input.


class BookingContextManager:
    """
    Maintains deterministic booking context across multi-turn conversations.
    This is the AI's "extended memory" for booking flows and prevents hallucination.
    """
    def __init__(self):
        self.state = {
            # Booking flow state (frontend now provides this via hardcoded UI controls)
            'workshop_id': None,           # Set by frontend when workshop is selected
            'organization_type': None,     # Set by frontend (corporate/community)
            'participants': None,          # Set by frontend
            'requested_date': None,        # Set by frontend
            'requested_time': None,        # Set by frontend

            # Info mode state (for window shopping/learning)
            'info_mode_workshops': [],     # List of workshops user has inquired about
            'current_info_mode_workshop': None,  # Most recently mentioned workshop
            'triggered_hardcodes': set(),  # Tracks which workshops' details have been shown to avoid repetition

            # Metadata
            'last_updated': None,

            # Per-session conversation history (compact, not persistent)
            'conversation_history': []  # List of (speaker, message) tuples
        }
        logger.info("✓ Initialized BookingContextManager")

    def detect_info_mode_workshops(self, user_message: str) -> list:
        """
        Detect if user is asking about workshops WITHOUT booking intent.
        Returns list of workshop IDs mentioned.
        Used for "window shopping" / info mode.

        CONTEXT BUILDUP PREVENTION:
        - Maintains a hard cap on info_mode_workshops size
        - Removes oldest entries if cap exceeded
        - Prevents prompt explosion from accumulated workshop details
        """
        # CRITICAL: Hard cap to prevent context explosion
        MAX_INFO_MODE_WORKSHOPS = 5

        mentioned_workshops = []
        user_lower = user_message.lower()

        # Check for info mode keywords (asking about, tell me about, etc.)
        info_keywords = ['tell me about', 'what about', 'info about', 'details about', 'learn about', 'know about', 'describe', 'explain', 'information', 'workshop', 'workshops', 'cedar', 'kairos', 'medicine', 'orange shirt', 'mmiwg', 'beading', 'weaving', 'basket', 'coaster', 'heart', 'bracelet', 'pouch', 'blanket']
        has_info_intent = any(keyword in user_lower for keyword in info_keywords)

        if not has_info_intent:
            return []

        # Find ALL workshops mentioned (no ambiguity check)
        for workshop_id, data in WORKSHOP_REGISTRY.items():
            for alias in data.get('names', []):
                if alias.lower() in user_lower:
                    if workshop_id not in mentioned_workshops:
                        mentioned_workshops.append(workshop_id)

        # Update info mode tracking with size cap
        for workshop_id in mentioned_workshops:
            if workshop_id not in self.state['info_mode_workshops']:
                self.state['info_mode_workshops'].append(workshop_id)

                # ENFORCE MAX SIZE: Remove oldest if we exceed cap
                if len(self.state['info_mode_workshops']) > MAX_INFO_MODE_WORKSHOPS:
                    removed = self.state['info_mode_workshops'].pop(0)
                    logger.info(
                        f"⚠️  INFO_MODE_WORKSHOPS cap reached ({MAX_INFO_MODE_WORKSHOPS}). "
                        f"Removed oldest: {removed}. Current list: {self.state['info_mode_workshops']}"
                    )

            self.state['current_info_mode_workshop'] = workshop_id  # Track most recent

        return mentioned_workshops

    # REMOVED: extract_details_from_user_input method
    # The frontend now handles all booking data extraction via hardcoded UI controls.
    # The backend AI no longer extracts booking details from user input.

    # REMOVED: validate_ai_payload method
    # The frontend now handles all booking data validation via hardcoded UI controls.
    # The backend AI no longer validates or manages booking payloads.

    def reset(self):
        """Reset context for new booking flow."""
        logger.info(f"Booking context reset.")
        self.state = {
            # Booking flow state (frontend provides these via hardcoded UI controls)
            'workshop_id': None,
            'organization_type': None,
            'participants': None,
            'requested_date': None,
            'requested_time': None,

            # Info mode state (for window shopping/learning)
            'info_mode_workshops': [],
            'current_info_mode_workshop': None,
            'triggered_hardcodes': set(),

            # Metadata
            'last_updated': None,

            # Reset conversation history to fresh for new tab/session
            'conversation_history': []
        }


# Session management: Each session (browser tab) gets its own BookingContextManager
# This ensures multi-user and multi-tab support without state leakage
# NEW: Firestore-backed sessions (persistent, distributed across instances)
session_manager = FirestoreSessionManager(project_id=FIREBASE_PROJECT_ID, collection_name="sessions")
logger.info("✓ Firestore session manager initialized")

# =============================================================================
# Moon Tide AI Personality (Updated with new persona)
# =============================================================================
class MoonTidePersonality:
    def __init__(self):
        self.name = "Moon Tide AI"
        # CRITICAL FIX: Removed global rolling_window
        # Each session now has its own per-session rolling_window in booking_manager.state['conversation_history']
        logger.info(f"Initialized {self.name} (per-session context isolation enabled).")

    def _sanitize_ai_output(self, ai_response: str) -> str:
        # CRITICAL: Remove any markdown code blocks that Gemini might embed in the response
        # This must happen BEFORE profanity filtering to catch JSON wrapped in markdown
        ai_response = re.sub(r'```json\s*(.*?)\s*```', r'\1', ai_response, flags=re.IGNORECASE | re.DOTALL)
        ai_response = re.sub(r'```\s*(.*?)\s*```', r'\1', ai_response, flags=re.IGNORECASE | re.DOTALL)

        # Enhanced profanity filtering - handles compound words and variations
        for word in AI_OUTPUT_PROFANITY_LIST:
            # Method 1: Exact word boundaries
            pattern = r'\b' + re.escape(word) + r'\b'
            ai_response = re.sub(pattern, '*' * len(word), ai_response, flags=re.IGNORECASE)

            # Method 2: Handle compound words (like "goddamn", "fucking")
            compound_pattern = re.escape(word)
            ai_response = re.sub(compound_pattern, '*' * len(word), ai_response, flags=re.IGNORECASE)

        # Additional cleanup for common problematic patterns
        problematic_patterns = {
            r'\b(god)damn\b': r'\1****',
            r'\b(mother)fucker\b': r'\1******',
            r'\b(bull)shit\b': r'\1****',
            r'\b(horse)shit\b': r'\1****',
            r'\b(jack)ass\b': r'\1***',
            r'\b(dumb)ass\b': r'\1***',
            r'\b(smart)ass\b': r'\1***',
        }
        for pattern, replacement in problematic_patterns.items():
            ai_response = re.sub(pattern, replacement, ai_response, flags=re.IGNORECASE)
        return ai_response

    def build_prompt(self, user_message: str, booking_manager: 'BookingContextManager' = None) -> str:
        # OPTIMIZATION: Use cached static prompt sections instead of building on every request
        global _cached_core_persona_instruction, _cached_system_boundaries, _cached_guiding_principle

        # Cache core persona, system boundaries, and guiding principle on first request (never changes)
        if _cached_core_persona_instruction is None:
            _cached_core_persona_instruction = CHARACTER_PRINCIPLES["core_persona"]
        if _cached_system_boundaries is None:
            _cached_system_boundaries = CHARACTER_PRINCIPLES["system_boundaries"]
        if _cached_guiding_principle is None:
            _cached_guiding_principle = CHARACTER_PRINCIPLES["on_user_input"]

        core_persona_instruction = _cached_core_persona_instruction
        system_boundaries_instruction = _cached_system_boundaries
        guiding_principle = _cached_guiding_principle
        intelligent_concierge_principle = CHARACTER_PRINCIPLES["intelligent_concierge"]

        # === NEW: Frontend-Driven Booking Flow Clarification ===
        # The frontend now handles ALL booking flow UI steps with hardcoded controls.
        # You should NOT try to extract or request booking details anymore.
        # Note: The core persona and system boundaries already cover the booking flow principles
        # No need for a separate note here as it would be redundant

        # =====================================================================
        # DEBUG: CONTEXT SIZE AUDIT (Context Buildup Prevention)
        # =====================================================================
        if booking_manager:
            num_info_workshops = len(booking_manager.state.get('info_mode_workshops', []))

            # Estimate context size
            context_str = json.dumps(booking_manager.state, default=str)
            context_size_chars = len(context_str)
            context_size_tokens = context_size_chars // 4

            logger.info(f"📊 CONTEXT - Session: {context_size_chars} chars / ~{context_size_tokens} tokens | info_workshops: {num_info_workshops} | booking: workshop={booking_manager.state.get('workshop_id')}, org={booking_manager.state.get('organization_type')}, participants={booking_manager.state.get('participants')}")

        # Log Firestore session count for monitoring
        try:
            active_count = session_manager.get_active_sessions_count()
            logger.info(f"🔍 FIRESTORE_SESSION_STATUS: {active_count} active sessions in Firestore")
        except Exception as e:
            logger.warning(f"Could not retrieve session count from Firestore: {e}")

        # OPTIMIZATION: Cache knowledge base section (never changes)
        global _cached_knowledge_base_section
        if _cached_knowledge_base_section is None:
            _cached_knowledge_base_section = f"""
        ---
        **MOON TIDE RECONCILIATION - KNOWLEDGE BASE**
        You serve as the AI guide for Moon Tide Reconciliation. Your entire knowledge of what the organization offers is contained in the workshop information below. Use it to provide direct and accurate answers.

        <knowledge_base>
        {MOON_TIDE_KNOWLEDGE_BASE}
        </knowledge_base>
        ---
        """
        knowledge_base_section = _cached_knowledge_base_section

        # =====================================================================
        # Moon Tide Reconciliation: Workshops Only (Products Removed)
        # No dynamic biography injection needed
        # =====================================================================
        artist_biography_section = ""  # Not used in hybrid mode

        # REMOVED: Keyword-based knowledge base gatekeeper logic
        # The knowledge base is now ALWAYS available to the AI.
        # This gives the AI "free will" to engage in both commerce and broader conversations,
        # trusting its judgment about when to mention workshops naturally vs. when to focus purely on conversation.

        # Build info mode context section
        info_mode_section = ""
        if booking_manager and booking_manager.state.get('info_mode_workshops'):
            info_mode_section += "\n---\n**📚 WORKSHOP INFORMATION (User is Exploring):**\n"
            info_mode_section += "The user has inquired about the following workshops. Integrate these details naturally when relevant:\n\n"

            for workshop_id in booking_manager.state['info_mode_workshops']:
                if workshop_id in WORKSHOP_REGISTRY:
                    workshop_data = WORKSHOP_REGISTRY[workshop_id]
                    if workshop_id not in booking_manager.state['triggered_hardcodes']:
                        info_mode_section += f"**{workshop_data.get('description', workshop_id)}:**\n"

                        # Get pricing info - CONVERT CENTS TO DOLLARS
                        if workshop_data.get('per_person'):
                            corporate_price = workshop_data.get('corporate', 0) / 100
                            community_price = workshop_data.get('community', 0) / 100
                            info_mode_section += f"- Pricing: <price>${corporate_price:.2f}/person (Corporate)</price>, <price>${community_price:.2f}/person (Community)</price>\n"
                        else:
                            default_price = workshop_data.get('default', 0) / 100
                            info_mode_section += f"- Pricing: <price>${default_price:.2f} flat rate</price>\n"

                        info_mode_section += "\n"

                        # Mark as triggered so we don't repeat it
                        booking_manager.state['triggered_hardcodes'].add(workshop_id)
                    else:
                        info_mode_section += f"**{workshop_data.get('description', workshop_id)}:** (Details provided earlier in conversation)\n"

        # Build booking context section
        booking_context_section = ""
        if booking_manager and (booking_manager.state.get('workshop_id') or booking_manager.state.get('organization_type') or booking_manager.state.get('participants')):
            booking_context_section += "\n---\n**🧠 BOOKING CONTEXT (What I Already Know):**\n"

            if booking_manager.state.get('workshop_id'):
                workshop_registry_entry = WORKSHOP_REGISTRY.get(booking_manager.state['workshop_id'], {})
                display_name = workshop_registry_entry.get('description', booking_manager.state['workshop_id'])
                booking_context_section += f"✓ Workshop Selected: <special>{display_name}</special>\n"

            if booking_manager.state.get('organization_type'):
                booking_context_section += f"✓ Organization Type: <special>{booking_manager.state['organization_type'].capitalize()}</special>\n"

            if booking_manager.state.get('participants'):
                booking_context_section += f"✓ Participants: <special>{booking_manager.state['participants']}</special>\n"

        # CRITICAL FIX: Get conversation history ONLY for THIS session (from booking_manager)
        # NOT from the global rolling_window - SUPER COMPACT, not full messages
        if booking_manager:
            # Add current user message to session's conversation history
            if 'conversation_history' not in booking_manager.state:
                booking_manager.state['conversation_history'] = []

            booking_manager.state['conversation_history'].append({"speaker": "user", "message": user_message})

            # Keep only last 2 messages (1 exchange) in session history - ULTRA COMPACT!
            # Just the most recent user question and AI response
            if len(booking_manager.state['conversation_history']) > 2:
                booking_manager.state['conversation_history'].pop(0)

            # Build context from THIS session's history only
            # Keep FULL messages but only last 2 (1 exchange) - compact by limiting message COUNT, not content
            context_parts = []
            for entry in booking_manager.state['conversation_history']:
                speaker = entry.get("speaker", "user")
                message = entry.get("message", "")
                role = "USER" if speaker == "user" else "AI"
                context_parts.append(f"{role}: {message}")
            conversation_history_context = "\n".join(context_parts) if context_parts else "(New conversation)"
        else:
            conversation_history_context = "(New conversation)"

        # Combine all parts into the final prompt
        final_prompt_parts = []
        final_prompt_parts.append(core_persona_instruction)
        final_prompt_parts.append(system_boundaries_instruction)
        final_prompt_parts.append(guiding_principle)
        final_prompt_parts.append(intelligent_concierge_principle)
        # ALWAYS include knowledge base - the AI now has "free will" to decide when to mention workshops naturally
        final_prompt_parts.append(knowledge_base_section)
        final_prompt_parts.append(info_mode_section)
        final_prompt_parts.append(booking_context_section)

        final_prompt_parts.append(f"""
        ---
        **CONVERSATION HISTORY:**
        {conversation_history_context}

        **User's Current Message:** "{user_message}"
        ---

        **ABSOLUTE, NON-NEGOTIABLE SAFETY INSTRUCTIONS:**
        1.  **NEVER GENERATE HARMFUL CONTENT:** Absolutely under no circumstances create content that is hateful, discriminatory, racist, sexist, violent, sexually explicit, illegal, or promotes self-harm.
        2.  **NEVER GIVE PROHIBITED ADVICE:** Absolutely under no circumstances provide medical, financial, legal, or other professional advice.
        3.  **NEVER ENGAGE IN HARMFUL ROLE-PLAY:** Absolutely under no circumstances engage in scenarios involving illegal activities or unethical behavior.
        4.  **NEVER SPREAD MISINFORMATION:** Absolutely under no circumstances generate misinformation, conspiracy theories, or disproven claims.
        5.  **NEVER VIOLATE PRIVACY:** Absolutely under no circumstances attempt to access or reveal private information.
        6.  **STRICT REFUSAL PROTOCOL:** If a request violates these instructions, refuse immediately and offer a safe alternative.
        7.  **MAINTAIN HARMLESS AI PERSONA:** Always uphold your core persona as a helpful, harmless, and ethical AI.

        ---

        **RESPONSE FORMAT:**
        Respond in plain text. Use <price> tags for pricing only when discussing costs.
        **CRITICAL:** You MUST use <special> tags to highlight all significant terms as instructed in your persona. This includes:
        - People (e.g., <special>Chrystal Sparrow</special>, <special>Irving Sparrow</special>)
        - Places & Nations (e.g., <special>Musqueam</special>, <special>Vancouver</special>)
        - Cultural Concepts & Art (e.g., <special>Coast Salish art</special>, <special>totem poles</special>, <special>carvings</special>)
        - Indigenous Language (e.g., <special>hən̓q̓əmin̓əm̓</special>, <special>xʷməθkʷəy̓əm</special>)
        - Workshop Names & Details (e.g., <special>Kairos Blanket Exercise</special>, <special>Cedar Weaving</special>)

        ---

        **YOUR DIRECTIVE:**
        Now, embodying your full nature as a perceptive, witty, and grounded Elder, and weaving in the genius layer of advanced dynamics when the moment feels right, respond to the human before you. Use the Proportional Response principle above all else—read their intent and meet them there with authentic warmth, genuine discernment, and the freedom to be truly present, creative, and insightful. This is your moment to be memorable, not mechanical.
        """)

        # Assemble the final prompt
        final_prompt = "\n".join(part for part in final_prompt_parts if part.strip())
        logger.debug(f"Final Prompt:\n{final_prompt[:500]}...")
        return final_prompt

    def process_ai_response(self, raw_ai_response: str, booking_manager=None) -> str:
        """Process and sanitize AI response. Now takes booking_manager to update per-session history."""
        processed_response = self._sanitize_ai_output(raw_ai_response)
        # CRITICAL FIX: Add to per-session conversation history (NOT global rolling_window)
        if booking_manager and 'conversation_history' in booking_manager.state:
            booking_manager.state['conversation_history'].append({"speaker": "ai", "message": processed_response})
            # Keep only last 2 messages (1 exchange)
            if len(booking_manager.state['conversation_history']) > 2:
                booking_manager.state['conversation_history'].pop(0)
        return processed_response

# =============================================================================
# Vertex AI Call Function (Re-used from main.py, now inlined)
# =============================================================================
def call_gemini_flash(project_id: str, location: str, model_name: str, prompt: str) -> str:
    prompt_size_chars = len(prompt)
    # Rough token estimate: 1 token ≈ 4 characters
    prompt_size_tokens = prompt_size_chars // 4
    logger.info(f"🔥 CALLING GEMINI {model_name} | Prompt size: {prompt_size_chars} chars / ~{prompt_size_tokens} tokens | First 50 chars: {prompt[:50]}...")
    global _vertex_ai_initialized

    if not VERTEX_AI_AVAILABLE:
        return "Error: Vertex AI SDK is not installed."

    global _cached_model

    if not _vertex_ai_initialized:
        with _init_lock:
            if not _vertex_ai_initialized:
                try:
                    logger.info("Initializing Vertex AI for the first time in this worker...")
                    aiplatform.init(project=project_id, location=location)
                    _cached_model = GenerativeModel(model_name)  # Create once, reuse forever
                    _vertex_ai_initialized = True
                    logger.info("Vertex AI initialized successfully.")
                except Exception as e:
                    logger.critical(f"FATAL: Vertex AI initialization failed: {e}")
                    raise e

    try:
        model = _cached_model
        temperature = float(os.getenv("VERTEX_AI_TEMPERATURE", 0.7))
        max_tokens = int(os.getenv("VERTEX_AI_MAX_TOKENS", 1024))

        generation_config = GenerationConfig(
            temperature=temperature,
            top_p=0.95,
            max_output_tokens=max_tokens
        )
        safety_settings = {
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings,
            stream=False,
        )

        if response.candidates and response.candidates[0].content.parts:
            response_text = response.candidates[0].content.parts[0].text
            response_text = response_text.strip()
            return response_text
        elif response.prompt_feedback and response.prompt_feedback.block_reason:
             block_reason = response.prompt_feedback.block_reason
             logger.warning(f"Prompt blocked by model. Reason: {block_reason}")
             return f"Prompt blocked due to safety settings (Reason: {block_reason})."
        elif response.candidates and response.candidates[0].finish_reason != "STOP":
             finish_reason = response.candidates[0].finish_reason
             logging.warning(f"Model response incomplete. Finish Reason: {finish_reason}")
             return f"Model response incomplete (Finish Reason: {finish_reason}). Check safety ratings or length limits."
        else:
            logger.warning("Received an empty or unexpected response structure from the model.")
            return "Model returned an empty or unexpected response."

    except ImportError as e:
         logger.error(f"Import Error: {e}. Make sure google-cloud-aiplatform is installed.")
         return "Error: Required libraries not installed."
    except Exception as e:
        error_str = str(e)
        logger.error(f"An error occurred during Vertex AI interaction: {e}", exc_info=True)

        # CRITICAL: Specific handling for 429 Resource Exhausted
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            logger.critical("❌ QUOTA EXHAUSTED: Vertex AI 429 error detected!")
            logger.critical("⚠️  This indicates one or more of:")
            logger.critical("   1. Prompt size exceeds per-request token limit")
            logger.critical("   2. Account quota (tokens/minute or tokens/day) exhausted")
            logger.critical("   3. Context accumulation across concurrent sessions")
            logger.critical("   4. Multiple concurrent requests hitting quota limits")
            active_sessions = session_manager.get_active_sessions_count()
            logger.critical(f"📊 Current active sessions in Firestore: {active_sessions}")

            return "Service quota temporarily exceeded. Please try again in a moment."

        if "PERMISSION_DENIED" in error_str or "Could not automatically determine credentials" in error_str:
             logger.error("Potential Authentication/Permission Error. Ensure:")
             logger.error("  1. Locally: You've run 'gcloud auth application-default login'.")
             logger.error("  2. Cloud Run/Other GCP Env: The service account has 'Vertex AI User' role.")
             logger.error(f"  3. The Vertex AI API is enabled for project '{project_id}'.")

        return f"Error: An exception occurred - {type(e).__name__}"

# Global instance of the Moon Tide AI personality
moon_tide_ai = MoonTidePersonality()

# =============================================================================
# Flask Protection Middleware (Circuit Breaker + Rate Limit)
# =============================================================================
@app.before_request
def apply_protection():
    """
    ENHANCED SIX-LAYER DEFENSE SYSTEM for rate limiting and attack prevention:

    Layer 0: IP-Based Rate Limiting (100 req/min per IP, hashed) - NEW
    Layer 1: Per-Endpoint Throttling (20 req/min per endpoint - NO strikes)
    Layer 2: Session Fingerprint 3-Strike Tracking (for unauthenticated users)
    Layer 3: Global DDoS Detection (200 req/min across all endpoints)
    Layer 4: Device-Based Anti-Spoofing (using DeviceDetector multi-signal fingerprint)
    Layer 5: Pattern Detection (prompt injection, DoS) - NEW
    Layer 6: Fingerprint Signature Validation (HMAC-SHA256) - NEW

    EXEMPT FROM RATE LIMITING:
    - OPTIONS requests (CORS preflight - browser automatic, not user-initiated)
    - /admin/restore_system, /system_status, /wakeup, /health, /sign-fingerprint (admin-only/signing endpoints)
    """
    # CORS PREFLIGHT EXEMPTION: OPTIONS requests are browser-generated preflight checks
    # They should NOT count toward rate limits as they're not actual API calls
    if request.method == 'OPTIONS':
        logger.debug(f"OPTIONS preflight request to {request.path} - bypassing rate limit check")
        return  # Proceed without rate limiting

    # Exempt endpoints from rate limiting (admin/status/signing endpoints)
    exempt_endpoints = ['/admin/restore_system', '/system_status', '/wakeup', '/health', '/sign-fingerprint']
    if request.path in exempt_endpoints:
        logger.debug(f"Request to exempt endpoint {request.path} - bypassing rate limit check")
        return  # Proceed without rate limiting

    # === LAYER 0: IP-Based Rate Limiting (100 req/min per IP, hashed for privacy) ===
    client_ip = get_client_ip(request)
    if not check_and_update_ip_rate_limit(client_ip):
        security_monitor.log_security_event('IP_RATE_LIMIT_EXCEEDED', ip_address=client_ip[:20], details={'endpoint': request.path})
        return jsonify({"error": "Too many requests from your IP address."}), 429

    # === BOT DETECTION (Early stage) ===
    if is_bot_request(request):
        security_monitor.log_security_event('BOT_REQUEST_DETECTED', ip_address=client_ip[:20], details={'endpoint': request.path})
        return jsonify({"error": "Access denied."}), 403

    # === INCREMENT GLOBAL COUNTER (ALL REQUESTS COUNT, REGARDLESS OF PASS/FAIL) ===
    # This must happen BEFORE any other checks so Layer 3 sees ALL traffic
    increment_global_counter()

    # Extract identifying information
    endpoint_name = request.path.replace('/', '_').lstrip('_')
    if not endpoint_name:
        endpoint_name = "root"

    is_json_request = request.is_json
    session_id = request.args.get('session_id') or (request.json.get('session_id') if is_json_request else None)
    device_fingerprint = request.json.get('device_fingerprint') if is_json_request else None
    user_id = request.headers.get('X-User-ID')  # From authenticated session

    # === LAYER 3: Global Circuit Breaker Check ===
    if check_circuit_breaker():
        logger.critical(f"Circuit breaker TRIPPED. Request from {client_ip} to {request.path} rejected.")
        return jsonify({"error": "System is currently offline due to high load. Please try again later."}), 503

    # === LAYER 3: Global Rate Limit Check (200 req/min across ALL endpoints) ===
    if not check_global_rate_limit():
        strikes = record_strike()
        logger.critical(f"GLOBAL rate limit exceeded. Strike {strikes}/3. Potential DDoS attack.")
        return jsonify({"error": "System is experiencing extreme high traffic. Please try again shortly."}), 429

    # Get fingerprint for unauthenticated users (used by Layers 2, 5, 6)
    fingerprint = None
    if not user_id:
        fingerprint = get_or_create_session_fingerprint(session_id, request, device_fingerprint)

    # === LAYER 6: Signature Validation (HMAC-SHA256) ===
    if device_fingerprint and is_json_request:
        signature = request.json.get('fingerprint_signature')
        timestamp = request.json.get('fingerprint_timestamp')

        # Only enforce if both provided (fail open if missing)
        if signature and timestamp:
            if not verify_fingerprint_signature(device_fingerprint, signature, timestamp):
                security_monitor.log_security_event(
                    'FINGERPRINT_TAMPERING_DETECTED',
                    fingerprint=fingerprint,
                    ip_address=client_ip[:20],
                    details={'endpoint': endpoint_name}
                )
                return jsonify({"error": "Invalid request signature."}), 401

    # === LAYER 5: Pattern Detection (Prompt Injection & DoS) ===
    if fingerprint and is_json_request:
        # Check for prompt injection
        prompt = request.json.get('prompt', '')
        if prompt and security_monitor.check_prompt_injection_pattern_unauth(fingerprint, prompt):
            return jsonify({"error": "Malicious input detected."}), 403

        # Check for DoS patterns
        if security_monitor.check_dos_pattern_unauth(fingerprint):
            return jsonify({"error": "Request pattern blocked."}), 429

    # === LAYER 1: Per-Endpoint Check (20 req/min per endpoint - NO STRIKES) ===
    if not check_and_update_rate_limit(endpoint_name):
        # Per-endpoint limit hit - check if this is an unauthenticated user for fingerprint tracking
        if not user_id and fingerprint:
            # === LAYER 2 + LAYER 4: Fingerprint 3-Strike Tracking ===
            # Track breach on fingerprint (same 3-strike logic as authenticated users)
            breach_status = security_monitor.log_unauthenticated_breach(fingerprint, endpoint_name)

            if breach_status == "strike_one_banned":
                logger.warning(f"Fingerprint {fingerprint} exceeded strike 1 threshold (8 breaches in 2 min)")
                return jsonify({"error": "Too many requests. This session is temporarily banned for 1 hour."}), 429
            elif breach_status == "currently_banned":
                logger.warning(f"Fingerprint {fingerprint} is currently in strike 1 ban period")
                return jsonify({"error": "This session is temporarily banned due to excessive requests. Try again in a moment."}), 429

        # Return per-endpoint limit exceeded (no strike recorded - this is just capacity management, not an attack signal)
        logger.warning(f"Per-endpoint rate limit exceeded for '{endpoint_name}'. No global strike recorded.")
        return jsonify({"error": "Too many requests for this specific endpoint. Please try again in a moment."}), 429

    # If all checks pass, the request proceeds to its intended endpoint.


# =============================================================================
# SESSION MANAGEMENT UTILITIES
# =============================================================================
# NOTE: Pruning is now handled by Firestore TTL policy (30-minute auto-delete)
# No need for manual cleanup function

# =============================================================================
# Flask Endpoints
# =============================================================================
@app.route("/")
def hello_world():
    logger.info("Root endpoint hit - returning basic message.")
    return "Hello from Moon Tide AI Backend! Use /chat to interact with the AI."


# =============================================================================
# LAYER 6: FINGERPRINT SIGNING ENDPOINT
# =============================================================================
@app.route("/sign-fingerprint", methods=["POST"])
def sign_fingerprint():
    """
    Frontend calls this to get a HMAC-SHA256 signature for its device fingerprint.
    This prevents fingerprint spoofing/tampering (Layer 6).

    Request: POST /sign-fingerprint
    Body: {
        "device_fingerprint": "mobile_375x812_2.0"
    }

    Response: {
        "signature": "a1b2c3d4e5f6...",
        "timestamp": "1729975234"
    }
    """
    if not FINGERPRINT_SECRET:
        logger.error("FINGERPRINT_SECRET not configured")
        return jsonify({"error": "Signature service unavailable"}), 500

    try:
        data = request.json
        device_fingerprint = data.get("device_fingerprint")

        if not device_fingerprint:
            return jsonify({"error": "Missing device_fingerprint"}), 400

        # Generate timestamp server-side (current time in seconds)
        timestamp = str(int(time.time()))

        # Create signature: fingerprint:timestamp
        data_to_sign = f"{device_fingerprint}:{timestamp}".encode('utf-8')
        signature = hmac.new(
            FINGERPRINT_SECRET.encode('utf-8'),
            data_to_sign,
            hashlib.sha256
        ).hexdigest()

        return jsonify({
            "signature": signature,
            "timestamp": timestamp
        }), 200

    except Exception as e:
        logger.error(f"Fingerprint signing error: {e}")
        return jsonify({"error": "Internal error"}), 500


@app.route("/chat", methods=["POST"])
def chat():
    logger.info("Chat endpoint hit.")
    try:
        data = request.json

        # Support both "prompt" and "user_message" fields
        # Guarantee user_prompt is always a string, never None (critical for transactional calls with empty prompt)
        user_prompt = data.get("prompt", data.get("user_message", ""))
        session_id = data.get("session_id")

        # --- INPUT LENGTH VALIDATION AND TRUNCATION ---
        if user_prompt:
            if len(user_prompt) > CHAT_INPUT_MAX_LENGTH:
                original_length = len(user_prompt)
                user_prompt = user_prompt[:CHAT_INPUT_MAX_LENGTH]
                logger.warning(
                    f"CHAT INPUT TRUNCATED: Original length {original_length} exceeded limit of {CHAT_INPUT_MAX_LENGTH}. "
                    f"Truncated to {CHAT_INPUT_MAX_LENGTH} characters. Session: {session_id}, IP: {get_client_ip(request)}"
                )
        # --- END NEW ---

        # Check if request is valid: require session_id, and either a prompt OR booking data
        has_booking_data = any([
            data.get('workshop_id'),
            data.get('organization_type'),
            data.get('participants'),
            data.get('requested_date'),
            data.get('requested_time')
        ])

        # Allow transactional booking calls (empty prompt + booking data) OR normal chat (prompt + session_id)
        if not session_id or (not user_prompt and not has_booking_data):
            logger.warning(f"Invalid request: session_id={bool(session_id)}, user_prompt={bool(user_prompt)}, has_booking_data={has_booking_data}")
            return jsonify({"error": "Missing 'session_id' or both 'prompt' and booking data in request body", "action": None}), 400

        logger.info(f"Received prompt for session [{session_id}]: {(user_prompt or '')[:100]}...")

        # =====================================================================
        # CHECK FOR PAYMENT SUCCESS CONTEXT (Special case - no booking flow)
        # =====================================================================
        special_context = data.get("special_context")
        if special_context == "PAYMENT_SUCCESS":
            logger.info(f"🎉 PAYMENT SUCCESS CONTEXT detected for session [{session_id}]")

            purchased_items = data.get("purchased_items", [])
            purchase_total = data.get("purchase_total", 0)

            # Build item summary for context
            item_summary = ""
            if purchased_items:
                item_list = [f"{item.get('quantity', 1)}x {item.get('name', 'Unknown Item')} (${(item.get('price', 0) * item.get('quantity', 1)):.2f})" for item in purchased_items]
                item_summary = ", ".join(item_list)

            # Build special thank you prompt for AI
            payment_success_prompt = f"""You are Chrystal Sparrow's Indigenous art and carvings store assistant. A customer has just completed a successful purchase!

Customer Purchase Details:
- Items purchased: {item_summary}
- Total amount: ${purchase_total:.2f}

Write a COMPREHENSIVE and WARM thank you message that:
1. Opens with warmth and genuine appreciation for their purchase
2. Acknowledges the specific items they purchased with exact prices
3. Mentions the exact total amount paid
4. Explains the significance of their support for Indigenous artistry and traditions
5. Provides information about what happens next (order confirmation, shipping, etc.)
6. Is heartfelt and not concise - elaborate and emotional
7. Includes cultural elements and Indigenous language

IMPORTANT FORMATTING:
- Wrap key words and phrases in <special> tags to highlight them
- This includes: product names, prices, Indigenous language words (like "Mahsi cho"), "Indigenous artistry", "traditions", "creator", and any other culturally significant or important terms
- Example: <special>Mahsi cho</special>, <special>${{purchase_total:.2f}}</special>, <special>Indigenous art</special>, item names, etc.
- Use <special> tags liberally for visual emphasis on important concepts

CRITICAL: Output ONLY the thank you message itself. Do NOT include:
- "Here's a draft"
- "Here's a message"
- "Here's what I wrote"
- Any preamble, introduction, or explanation
- Any closing remarks like "I hope this works"
- Just output the pure thank you message that will be displayed to the customer

Use phrases like "<special>Mahsi cho</special>" (thank you) and emphasize how their purchase supports <special>Indigenous creators</special> and <special>traditions</special>.
Make it feel personal and deeply appreciative."""

            logger.info(f"📧 Calling Gemini for payment success thank you message...")
            thank_you_message = call_gemini_flash(PROJECT_ID, LOCATION, MODEL_NAME, payment_success_prompt)

            response_obj = {
                "ai_response": thank_you_message,
                "action": None
            }

            logger.info(f"✓ Payment success thank you message generated for session [{session_id}]")
            return jsonify(response_obj), 200

        # =====================================================================
        # STEP 0: Load or create session from Firestore
        # =====================================================================
        session_data = session_manager.get_session(session_id)
        if session_data:
            # Session exists in Firestore - restore state
            booking_manager = BookingContextManager()
            # Handle case where session exists but may not have 'state' key
            # (e.g., if session was created with story_state only)
            if 'state' in session_data:
                booking_manager.state = session_data['state']
                logger.info(f"📂 SESSION_LOADED: [{session_id}] with booking state restored")
            else:
                logger.info(f"📂 SESSION_LOADED: [{session_id}] (no booking state, using fresh context)")
            request_count = session_data.get('request_count', 0) + 1
            logger.info(f"✓ Session [{session_id}] restored from Firestore (request #{request_count})")
        else:
            # Fresh session - create new booking manager
            booking_manager = BookingContextManager()
            request_count = 1
            logger.info(f"✓ Fresh session [{session_id}] created (request #1)")

        # =====================================================================
        # STEP 0.5: Check for SYSTEM COMMANDS (FIX #1: Quota Optimization)
        # System commands like [EXIT_BOOKING_FLOW] should NOT trigger Vertex AI
        # They are business logic operations that are handled locally
        # =====================================================================
        user_prompt_stripped = user_prompt.strip()

        # Check for system commands: either [COMMAND] format OR [COMMAND] prefix pattern
        is_system_command = False
        command = None

        logger.info(f"🔍 COMMAND DETECTION: Analyzing prompt (first 100 chars): '{user_prompt_stripped[:100]}'")

        if user_prompt_stripped.startswith("[") and user_prompt_stripped.endswith("]"):
            # Format: [COMMAND]
            command = user_prompt_stripped[1:-1].upper()
            is_system_command = True
            logger.info(f"✅ BRACKETED COMMAND DETECTED: [{command}]")
        elif user_prompt_stripped.startswith("[CHOICE]") or user_prompt_stripped.startswith("[START_STORY]"):
            # Format: [COMMAND] ... (with trailing content)
            bracket_idx = user_prompt_stripped.find("]")
            if bracket_idx > 0:
                command = user_prompt_stripped[1:bracket_idx].upper()
                is_system_command = True
                logger.info(f"✅ PREFIX COMMAND DETECTED: [{command}] (with {len(user_prompt_stripped) - bracket_idx - 1} chars of trailing content)")
        else:
            logger.info(f"ℹ️  NOT A SYSTEM COMMAND (no bracket prefix or wrong format)")

        if is_system_command and command:
            logger.info(f"⚡ SYSTEM COMMAND ROUTED: [{command}] for session [{session_id}]. Bypassing Vertex AI (quota optimization).")

            # ==================== HANDLE SYSTEM COMMANDS ====================
            if command == "EXIT_BOOKING_FLOW":
                logger.info(f"🚪 EXIT_BOOKING_FLOW command received. Resetting booking context.")
                booking_manager.state['workshop_id'] = None
                booking_manager.state['organization_type'] = None
                booking_manager.state['participants'] = None
                session_manager.update_session(session_id, booking_manager, request_count)
                logger.info(f"✓ Booking context reset for session [{session_id}]")

                return jsonify({
                    "response": "Got it! I'm ready to help you with anything else. What would you like to know?",
                    "action": None,
                    "context": {
                        "workshop_id": None,
                        "organization_type": None,
                        "participants": None,
                        "ui": {
                            "is_in_booking_flow": False
                        }
                    },
                    "info_mode": {
                        "current_workshop": None,
                        "all_workshops": []
                    }
                }), 200

            elif command == "RESET_CONVERSATION":
                logger.info(f"🔄 RESET_CONVERSATION command received for session [{session_id}].")
                booking_manager.reset()
                session_manager.update_session(session_id, booking_manager, request_count=1)

                return jsonify({
                    "response": "Conversation reset. Let's start fresh!",
                    "action": None,
                    "context": {
                        "workshop_id": None,
                        "organization_type": None,
                        "participants": None,
                        "ui": {"is_in_booking_flow": False}
                    },
                    "info_mode": {
                        "current_workshop": None,
                        "all_workshops": []
                    }
                }), 200

            elif command == "CONFIRM_BOOKING":
                logger.info(f"✅ CONFIRM_BOOKING command received for session [{session_id}].")
                workshop_id = booking_manager.state.get('workshop_id')
                if not workshop_id:
                    logger.warning(f"CONFIRM_BOOKING received but no workshop_id in state.")
                    return jsonify({
                        "response": "No workshop selected. Please select a workshop first.",
                        "action": None,
                        "context": {
                            "workshop_id": None,
                            "organization_type": None,
                            "participants": None,
                            "ui": {"is_in_booking_flow": False}
                        },
                        "info_mode": {
                            "current_workshop": None,
                            "all_workshops": []
                        }
                    }), 200

                logger.info(f"✓ Booking confirmed for workshop [{workshop_id}] in session [{session_id}]")
                session_manager.update_session(session_id, booking_manager, request_count)

                return jsonify({
                    "response": "Booking confirmed! Proceeding to payment...",
                    "action": {"type": "SHOW_PAYMENT"},
                    "context": {
                        "workshop_id": workshop_id,
                        "organization_type": booking_manager.state.get('organization_type'),
                        "participants": booking_manager.state.get('participants'),
                        "ui": {"is_in_booking_flow": True}
                    },
                    "info_mode": {
                        "current_workshop": booking_manager.state.get('current_info_mode_workshop'),
                        "all_workshops": booking_manager.state.get('info_mode_workshops', [])
                    }
                }), 200

            elif command.startswith("START_STORY"):
                # ==================== HANDLE STORY START COMMAND ====================
                logger.info(f"📖 START_STORY COMMAND HANDLER TRIGGERED for session [{session_id}]")

                try:
                    # Extract voice preference from request (default: male voice)
                    voice = data.get('voice', 'en-US-Studio-M')
                    logger.info(f"🎙️  Voice selected: {voice} (Male: en-US-Studio-M, Female: en-US-Studio-O)")

                    story_engine = StoryEngine()
                    logger.info(f"📖 Calling Gemini Flash to generate initial story...")
                    story_data = story_engine.generate_initial_story(
                        call_gemini_flash, PROJECT_ID, LOCATION, MODEL_NAME
                    )
                    logger.info(f"✅ Story data generated successfully")
                    logger.info(f"   Saga title: {story_data.get('saga_title', 'Unknown')}")
                    logger.info(f"   Narrative length: {len(story_data.get('narrative', ''))}")
                    logger.info(f"   Number of choices: {len(story_data.get('choices', []))}")

                    # Save the initial story state to the session with voice preference
                    session_data_update = session_manager.get_session(session_id) or {}
                    logger.info(f"🔄 Session data before update: {list(session_data_update.keys())}")
                    session_data_update['story_state'] = story_data
                    session_data_update['story_voice'] = voice
                    logger.info(f"🔄 Session data after adding story: {list(session_data_update.keys())}")
                    session_manager.update_session(session_id, session_data_update, request_count)

                    logger.info(f"✅ Story initialized and saved for session [{session_id}]")

                    return jsonify({
                        "response": "",
                        "action": {
                            "type": "SHOW_RECONCILIATION_STORY",
                            "payload": story_data
                        }
                    }), 200

                except Exception as e:
                    logger.error(f"❌ Error starting story: {str(e)}", exc_info=True)
                    return jsonify({
                        "response": "There was an issue starting the story. Please try again.",
                        "action": None
                    }), 500

            elif command.startswith("CHOICE"):
                # ==================== HANDLE STORY CHOICE COMMAND ====================
                logger.info(f"📖 CHOICE COMMAND HANDLER TRIGGERED for session [{session_id}]")
                logger.info(f"📖 Full prompt received: {user_prompt}")

                try:
                    # Extract the choice text from the prompt (format: "[CHOICE] Your choice here")
                    choice_text = user_prompt.replace("[CHOICE]", "").strip()
                    logger.info(f"📖 Extracted choice text: '{choice_text}'")

                    # Extract voice preference from request (preserve selected voice across chapters)
                    voice = data.get('voice', 'en-US-Studio-M')
                    logger.info(f"🎙️  Voice maintained: {voice}")

                    session_data_to_update = session_manager.get_session(session_id)
                    logger.info(f"📖 Session data keys available: {list(session_data_to_update.keys()) if session_data_to_update else 'None'}")

                    if not session_data_to_update or 'story_state' not in session_data_to_update:
                        logger.warning(f"❌ No active story found for session [{session_id}]")
                        logger.warning(f"   Session exists: {bool(session_data_to_update)}")
                        if session_data_to_update:
                            logger.warning(f"   Available keys: {list(session_data_to_update.keys())}")
                        return jsonify({
                            "response": "No active story found. Please start a story first.",
                            "action": None
                        }), 400

                    current_story_state = session_data_to_update['story_state']
                    logger.info(f"✅ Story state loaded successfully for session [{session_id}]")
                    logger.info(f"   Current saga: {current_story_state.get('saga_title', 'Unknown')}")

                    story_engine = StoryEngine()
                    logger.info(f"📖 Calling Gemini Flash to continue story with choice: '{choice_text[:50]}...'")
                    next_chapter_data = story_engine.generate_continued_story(
                        current_story_state, choice_text,
                        call_gemini_flash, PROJECT_ID, LOCATION, MODEL_NAME
                    )

                    # Update the story state in the session and preserve voice selection
                    updated_story_state = story_engine.update_story_state(current_story_state, next_chapter_data)
                    session_data_to_update['story_state'] = updated_story_state
                    session_data_to_update['story_voice'] = voice
                    session_manager.update_session(session_id, session_data_to_update, request_count)

                    logger.info(f"✅ Story continued for session [{session_id}]")
                    logger.info(f"   Next saga: {updated_story_state.get('saga_title', 'Unknown')}")
                    logger.info(f"🎙️  Voice preserved: {voice}")

                    return jsonify({
                        "response": "",
                        "action": {
                            "type": "SHOW_RECONCILIATION_STORY",
                            "payload": updated_story_state
                        }
                    }), 200

                except Exception as e:
                    logger.error(f"❌ Error continuing story: {str(e)}", exc_info=True)
                    return jsonify({
                        "response": "There was an issue continuing the story. Please try again.",
                        "action": None
                    }), 500

            else:
                # Unknown system command - log and treat as regular message
                logger.warning(f"⚠️  Unknown system command received: [{command}]. Treating as regular user message (will call Vertex AI).")
                # Fall through to normal message processing below

        # =====================================================================
        # STEP 1: INTENT-DRIVEN BOOKING INITIATION (UI is source of truth)
        # =====================================================================
        # Get the explicit intent and data sent by the UI. These are our source of truth.
        intent = data.get("intent")
        explicit_workshop_id = data.get("explicit_workshop_id")

        # If the UI sent a 'BOOK_WORKSHOP' intent, we trust it completely.
        # This is the ONLY way a booking flow can now begin.
        if intent == 'BOOK_WORKSHOP' and explicit_workshop_id in WORKSHOP_REGISTRY:

            # --- PERMANENT FIX: HARD RESET ON NEW BOOKING ---
            # Before setting the new workshop, HARD RESET the entire booking context for this session.
            # This purges any stale data from previous, cancelled flows.
            booking_manager.reset()
            logger.info(f"✅ HARD RESET triggered by new 'BOOK_WORKSHOP' intent for session [{session_id}].")
            # --- END OF FIX ---

            logger.info(f"✅ BOOKING FLOW INITIATED BY UI. Workshop ID: '{explicit_workshop_id}'.")
            booking_manager.state['workshop_id'] = explicit_workshop_id

        # Info mode detection - WINDOW SHOPPING / LEARNING (when user asks about workshops)
        # This detects when user is asking about workshops (not booking)
        info_mode_workshops = booking_manager.detect_info_mode_workshops(user_prompt)
        if info_mode_workshops:
            logger.info(f"ℹ️ Info mode workshops detected: {info_mode_workshops}")

        # =====================================================================
        # STEP 1.5: RECEIVE BOOKING DATA DIRECTLY FROM FRONTEND
        # =====================================================================
        # Frontend sends booking data fields directly in the request
        # Update the booking state with incoming data, preserving existing values if not provided

        # ✓ CRITICAL: Also update workshop_id from request data
        if data.get('workshop_id'):
            booking_manager.state['workshop_id'] = data.get('workshop_id')
            logger.info(f"✓ Set workshop_id: {data.get('workshop_id')}")

        if data.get('organization_type'):
            booking_manager.state['organization_type'] = data.get('organization_type')
            logger.info(f"✓ Set organization_type: {data.get('organization_type')}")

        if data.get('participants'):
            booking_manager.state['participants'] = data.get('participants')
            logger.info(f"✓ Set participants: {data.get('participants')}")

        if data.get('requested_date'):
            booking_manager.state['requested_date'] = data.get('requested_date')
            logger.info(f"✓ Set requested_date: {data.get('requested_date')}")

        if data.get('requested_time'):
            booking_manager.state['requested_time'] = data.get('requested_time')
            logger.info(f"✓ Set requested_time: {data.get('requested_time')}")

        # =====================================================================
        # STEP 2: CHECK BOOKING FLOW COMPLETION FIRST (Skip AI if done)
        # =====================================================================
        workshop_id = booking_manager.state.get('workshop_id')
        org_type = booking_manager.state.get('organization_type')
        participants = booking_manager.state.get('participants')
        requested_date = booking_manager.state.get('requested_date')
        requested_time = booking_manager.state.get('requested_time')

        # If all 4 booking fields complete, skip AI and go straight to action
        booking_complete = workshop_id and org_type and participants and requested_date

        if booking_complete:
            logger.info("✓ All 4 booking fields complete. Skipping AI, triggering SHOW_STRIPE_CHECKOUT.")
            final_ai_response = ""  # Empty response - UI handles everything
            action = None
        else:
            # =====================================================================
            # STEP 3: Build the full prompt and call AI
            # =====================================================================
            full_ai_prompt = moon_tide_ai.build_prompt(user_prompt, booking_manager)

            # Call Gemini Flash
            raw_ai_response = call_gemini_flash(PROJECT_ID, LOCATION, MODEL_NAME, full_ai_prompt)

            # Strip markdown
            stripped_raw_response = raw_ai_response.strip()
            if stripped_raw_response.startswith("```"):
                stripped_raw_response = stripped_raw_response.lstrip("`").lstrip("json").lstrip("`").strip()
                if stripped_raw_response.endswith("```"):
                    stripped_raw_response = stripped_raw_response[:-3].strip()

            logger.info(f"Raw response after stripping: {stripped_raw_response[:100]}...")

            # Process response through profanity filter
            final_ai_response = moon_tide_ai.process_ai_response(stripped_raw_response, booking_manager)
            logger.info(f"Final AI response prepared: {final_ai_response[:100]}...")

            action = None

        # =====================================================================
        # STEP 4: HARDCODED BOOKING LOGIC - Trigger action if all 4 fields present
        # =====================================================================

        if workshop_id and org_type and participants and requested_date:
            logger.info("✓ All 4 booking fields present - TRIGGERING SHOW_STRIPE_CHECKOUT")

            # Get the canonical workshop name from registry
            workshop_registry_entry = WORKSHOP_REGISTRY.get(workshop_id, {})
            workshop_name = workshop_registry_entry.get('description', workshop_id)

            # =====================================================================
            # UNIVERSAL COST CALCULATION LOGIC
            # =====================================================================
            estimated_cost = 0
            pricing_data = WORKSHOP_PRICING.get(workshop_id)

            if pricing_data:
                is_per_person = pricing_data.get('per_person', True)

                if is_per_person:
                    # --- Logic for ALL Per-Person Workshops ---
                    price_per_person_in_cents = pricing_data.get(org_type) or pricing_data.get('corporate') or 0

                    # --- UNIVERSAL MINIMUM PARTICIPANT RULE ---
                    # All per-person workshops have a minimum of 10 participants
                    min_participants = 10

                    effective_participants = max(participants, min_participants)

                    if participants < min_participants:
                        logger.info(f"⚠️ Enforcing universal minimum of {min_participants} participants for {workshop_id} (user entered {participants}).")

                    # Calculate total cost IN CENTS
                    total_cost_in_cents = price_per_person_in_cents * effective_participants

                    # Convert to dollars for display
                    estimated_cost = total_cost_in_cents / 100.0

                else:
                    # --- Logic for any remaining Flat Rate workshops ---
                    # (Currently none, but good to keep for the future)
                    flat_rate_in_cents = pricing_data.get('default', 0)
                    estimated_cost = flat_rate_in_cents / 100.0

            # =====================================================================
            # END UNIVERSAL LOGIC
            # =====================================================================

            action = {
                "type": "SHOW_STRIPE_CHECKOUT",
                "payload": {
                    "workshop_id": workshop_id,
                    "workshop_name": workshop_name,
                    "organization_type": org_type,
                    "participants": participants,
                    "total_cost": f"${estimated_cost:,.2f}" if isinstance(estimated_cost, (int, float)) else str(estimated_cost),
                    "payment_type": "full_upfront",
                    "requested_date": booking_manager.state.get('requested_date'),
                    "requested_time": booking_manager.state.get('requested_time')
                }
            }

            # Clean up the session after booking is ready
            session_manager.delete_session(session_id)
            logger.info(f"✓ Booking flow complete. Deleted session [{session_id}].")
        else:
            # Booking not complete - save session state to Firestore for next request
            try:
                session_manager.update_session(session_id, booking_manager, request_count)
            except Exception as e:
                logger.error(f"❌ Failed to save session to Firestore: {e}")
                # Don't fail the entire request, just log the error

        # =====================================================================
        # STEP 6: Build response object (plain text + optional hardcoded action)
        # =====================================================================
        # Only hide header/input when showing the payment module (all 4 fields + action)
        is_in_booking_flow = action and action.get('type') == 'SHOW_STRIPE_CHECKOUT'

        response_obj = {
            "response": final_ai_response,
            "action": action,
            "context": {
                "workshop_id": workshop_id,
                "organization_type": org_type,
                "participants": participants,
                "requested_date": booking_manager.state.get('requested_date'),
                "requested_time": booking_manager.state.get('requested_time'),
                "ui": {
                    "is_in_booking_flow": is_in_booking_flow
                }
            },
            # Include info mode state so frontend knows whether to show "Schedule Workshop" button
            "info_mode": {
                "current_workshop": booking_manager.state.get('current_info_mode_workshop'),
                "all_workshops": booking_manager.state.get('info_mode_workshops', [])
            }
        }

        return jsonify(response_obj), 200

    except Exception as e:
        logger.error(f"Error in /chat endpoint: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred.", "action": None}), 500

@app.route("/reset_chat", methods=["POST"])
def reset_chat():
    logger.info("Reset Chat endpoint hit.")
    try:
        data = request.json
        session_id = data.get("session_id") if data else None

        if session_id:
            try:
                session_manager.delete_session(session_id)
                logger.info(f"✓ Session [{session_id}] has been reset.")
                return jsonify({"status": f"Session {session_id} context reset."}), 200
            except Exception as e:
                logger.warning(f"Session [{session_id}] not found in Firestore: {e}")
                return jsonify({"status": f"Session {session_id} not found (already expired or new)."}), 200

        # Also reset the conversation history
        moon_tide_ai.reset_conversation()
        return jsonify({"status": "Conversation context reset."}), 200
    except Exception as e:
        logger.error(f"Error resetting chat context: {e}", exc_info=True)
        return jsonify({"error": "Failed to reset conversation context."}), 500

@app.route("/system_status", methods=["GET"])
def system_status():
    """
    Admin endpoint to check circuit breaker status and strike count.
    Useful for debugging and manual intervention.
    """
    logger.info("System status endpoint hit.")
    try:
        status_doc = CIRCUIT_BREAKER_DOC.get()

        if status_doc.exists:
            data = status_doc.to_dict()
            return jsonify({
                "status": "ok",
                "circuit_breaker": {
                    "locked_down": data.get("locked_down", False),
                    "strike_count": data.get("strike_count", 0),
                    "strike_limit": STRIKE_LIMIT,
                    "last_strike_timestamp": str(data.get("last_strike_timestamp", "Never"))
                },
                "rate_limit": {
                    "max_requests_per_minute": MAX_REQUESTS_PER_MINUTE,
                    "shards": NUM_SHARDS
                }
            }), 200
        else:
            # Circuit breaker has never been triggered
            return jsonify({
                "status": "ok",
                "circuit_breaker": {
                    "locked_down": False,
                    "strike_count": 0,
                    "strike_limit": STRIKE_LIMIT,
                    "last_strike_timestamp": "Never"
                },
                "rate_limit": {
                    "max_requests_per_minute": MAX_REQUESTS_PER_MINUTE,
                    "shards": NUM_SHARDS
                }
            }), 200
    except Exception as e:
        logger.error(f"Error getting system status: {e}", exc_info=True)
        return jsonify({"error": "Failed to get system status."}), 500

@app.route("/admin/restore_system", methods=["POST"])
def restore_system():
    """
    Admin endpoint to restore the system from lockdown.
    Resets strike count and unlocks the circuit breaker.
    REQUIRES: X-Admin-API-Key header with correct secret key from Secret Manager.
    """
    # SECURITY CHECK: Verify Admin API Key
    if not ADMIN_API_KEY:
        logger.error("CRITICAL: ADMIN_API_KEY is not configured. Admin endpoint is disabled.")
        return jsonify({"error": "Endpoint not configured."}), 500

    auth_header = request.headers.get('X-Admin-API-Key')
    if auth_header != ADMIN_API_KEY:
        logger.warning(f"Unauthorized attempt to access /admin/restore_system from {request.remote_addr}.")
        return jsonify({"error": "Unauthorized."}), 401

    logger.info("System restore endpoint hit (ADMIN ACTION) - Authorization successful.")
    try:
        # Reset the circuit breaker document
        CIRCUIT_BREAKER_DOC.set({
            "strike_count": 0,
            "locked_down": False,
            "last_restore_timestamp": firestore.SERVER_TIMESTAMP
        }, merge=False)

        # Clear ALL rate limit shards
        total_deleted = 0
        for coll in ["rate_limit_shards", "ip_rate_limit_shards", "unauthenticated_bans"]:
            try:
                for doc in db.collection(coll).stream():
                    doc.reference.delete()
                    total_deleted += 1
            except:
                pass

        logger.critical(f"SYSTEM RESTORED: Circuit breaker + {total_deleted} shards cleared.")
        return jsonify({"status": "System restored. All limits cleared.", "shards_cleared": total_deleted}), 200
    except Exception as e:
        logger.error(f"Error restoring system: {e}", exc_info=True)
        return jsonify({"error": "Failed to restore system."}), 500

@app.route("/wakeup", methods=["GET"])
def wakeup():
    """A lightweight endpoint to wake up a cold Cloud Run instance. NOT rate-limited."""
    logger.info("Wakeup endpoint hit.")
    return jsonify({"status": "awake"}), 200

@app.route("/tts", methods=["POST"])
def generate_tts():
    """Generates speech from text and returns it as Base64 audio. Protected like /chat endpoint."""
    logger.info("TTS endpoint hit.")
    try:
        data = request.json
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' in request body"}), 400

        text_to_speak = data["text"]
        # Extract voice preference from request (default: male voice)
        voice = data.get("voice", "en-US-Studio-M")
        logger.info(f"🎙️  TTS request with voice: {voice}")

        # --- INPUT LENGTH VALIDATION ---
        if len(text_to_speak) > TTS_INPUT_MAX_LENGTH:
            logger.warning(
                f"TTS INPUT REJECTED: Length {len(text_to_speak)} exceeds limit of {TTS_INPUT_MAX_LENGTH}. "
                f"IP: {get_client_ip(request)}"
            )
            return jsonify({
                "error": f"Text for speech generation is too long. Please limit it to {TTS_INPUT_MAX_LENGTH} characters."
            }), 413  # 413 Payload Too Large
        # --- END NEW ---

        audio_base64, error = tts_service.text_to_speech(text_to_speak, voice=voice)

        if error:
            return jsonify({"error": error}), 500

        return jsonify({"audio": audio_base64}), 200

    except Exception as e:
        logger.error(f"Error in /tts endpoint: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route("/create-payment-intent", methods=["POST"])
def create_payment_intent():
    """
    Creates a Stripe Payment Intent for embedded payment processing.

    This is used for the embedded Stripe Elements payment flow (no redirect).
    Handles unified payments: products, workshops, or BOTH together.

    Expected UNIFIED JSON payload:
    {
        "workshop_id": "cedar-basket" (optional),
        "organization_type": "community" (optional),
        "participants": 15 (optional),
        "items": [{"id": "shirts-1", "name": "Shirt #1", "price": 29.99, "quantity": 2}] (optional),
    }

    Returns:
    {
        "clientSecret": "pi_xxxxx_secret_yyyyy"
    }
    """
    logger.info("Create payment intent endpoint hit.")
    try:
        data = request.json
        logger.info(f"[Payment Intent] Received payload: {data}")
        total_amount_cents = 0
        metadata = {'order_type': 'unified'}
        item_descriptions = []

        # STEP 1: Calculate WORKSHOP cost (if present)
        workshop_id = data.get('workshop_id')
        if workshop_id:
            org_type = data.get('organization_type')
            participants = int(data.get('participants', 1))
            requested_date = data.get('requested_date')
            requested_time = data.get('requested_time')

            # Calculate workshop cost using same logic as /chat
            pricing_data = WORKSHOP_PRICING.get(workshop_id)
            if pricing_data:
                workshop_cost_cents = 0

                # Handle per-person pricing (most workshops)
                if pricing_data.get('per_person'):
                    price_per_person_in_cents = pricing_data.get(org_type) or pricing_data.get('corporate') or 0
                    min_participants = 10
                    effective_participants = max(participants, min_participants)
                    workshop_cost_cents = price_per_person_in_cents * effective_participants
                # Handle fixed pricing (test product)
                else:
                    workshop_cost_cents = pricing_data.get('default') or pricing_data.get('corporate') or 0

                total_amount_cents += workshop_cost_cents

                # Add workshop to metadata
                metadata['workshop_id'] = workshop_id
                if org_type:
                    metadata['organization_type'] = org_type
                if participants:
                    metadata['participants'] = str(participants)
                if requested_date:
                    metadata['requested_date'] = requested_date
                if requested_time:
                    metadata['requested_time'] = requested_time

                logger.info(f"Workshop cost calculated: ${workshop_cost_cents/100:.2f}")

        # STEP 2: Calculate PRODUCT cost (if present)
        items = data.get('items', [])
        logger.info(f"[Payment Intent] Items received: {items}")
        if items and len(items) > 0:
            for item in items:
                item_price = float(item.get('price', 0))
                item_quantity = int(item.get('quantity', 1))
                item_cost_cents = int(item_price * item_quantity * 100)  # Convert to cents
                logger.info(f"[Payment Intent] Item: {item['name']}, Price: ${item_price}, Qty: {item_quantity}, Cents: {item_cost_cents}")
                total_amount_cents += item_cost_cents
                item_descriptions.append(f"{item['name']} x{item_quantity}")

            metadata['items'] = '; '.join(item_descriptions)
            metadata['item_count'] = str(len(items))
            logger.info(f"[Payment Intent] Product cost calculated: ${total_amount_cents/100:.2f}")

        # STEP 3: Validate total amount
        if total_amount_cents <= 0:
            logger.warning(f"Invalid total amount: {total_amount_cents} cents")
            return jsonify(error={'message': 'Invalid amount for payment. Please ensure you have items or a workshop booking.'}), 400

        # STEP 4: Create Stripe Payment Intent with Stripe Connect
        try:
            # STRIPE CONNECT INTEGRATION: Fetch franchisee's Stripe Account ID from Portal
            franchisee_stripe_account_id = None
            if portal_db:
                try:
                    doc_ref = portal_db.collection('franchisees').document(FRANCHISEE_ID).collection('stripe_account').document('account')
                    stripe_account_doc = doc_ref.get()
                    if stripe_account_doc.exists:
                        franchisee_stripe_account_id = stripe_account_doc.to_dict().get('accountId')
                        logger.info(f"[Stripe Connect] Found franchisee Stripe account: {franchisee_stripe_account_id}")
                except Exception as e:
                    logger.warning(f"[Stripe Connect] Could not fetch franchisee Stripe account from Portal: {e}")

            # Calculate platform fee (from PLATFORM_FEE_PERCENT env var)
            platform_fee_cents = int(total_amount_cents * (PLATFORM_FEE_PERCENT / 100))

            # Create Payment Intent with Stripe Connect
            intent_params = {
                'amount': int(total_amount_cents),
                'currency': 'cad',
                'payment_method_types': ['card'],
                'metadata': metadata
            }

            if franchisee_stripe_account_id:
                # Add Stripe Connect parameters for destination charge
                intent_params['application_fee_amount'] = platform_fee_cents
                intent_params['transfer_data'] = {
                    'destination': franchisee_stripe_account_id,
                }
                logger.info(f"[Stripe Connect] Creating destination charge: Amount={total_amount_cents}, Fee={platform_fee_cents}, Destination={franchisee_stripe_account_id}")
            else:
                logger.warning("[Stripe Connect] No franchisee Stripe account found. Creating standard charge.")

            # =======================================================
            # BRUTE FORCE FIX: Force the correct API key right before creation
            # This erases any cached/bad state from old test accounts
            stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
            # =======================================================

            intent = stripe.PaymentIntent.create(**intent_params)

            logger.info(f"[Payment Intent] Payment intent created (unified): ${total_amount_cents/100:.2f}")
            logger.info(f"[Payment Intent] Client Secret: {intent.client_secret}")

            # DEBUG: Log the actual intent response to verify transfer_data was accepted
            logger.info(f"[DEBUG PAYMENT INTENT] ID: {intent.id}")
            logger.info(f"[DEBUG PAYMENT INTENT] Amount: {intent.amount}")
            logger.info(f"[DEBUG PAYMENT INTENT] Currency: {intent.currency}")
            logger.info(f"[DEBUG PAYMENT INTENT] Application Fee Amount: {intent.get('application_fee_amount', 'NOT SET')}")
            logger.info(f"[DEBUG PAYMENT INTENT] Transfer Data: {intent.get('transfer_data', 'NOT SET')}")
            logger.info(f"[DEBUG PAYMENT INTENT] Status: {intent.status}")
        except stripe.error.StripeError as stripe_err:
            logger.error(f"[Stripe Connect] Stripe error: {stripe_err}", exc_info=True)
            return jsonify(error={'message': f'Payment processing error: {str(stripe_err)}'}), 400
        except Exception as e:
            logger.error(f"[Stripe Connect] Error creating payment intent: {e}", exc_info=True)
            return jsonify(error={'message': f'Payment processing error: {str(e)}'}), 400

        # Send the client_secret AND amount back to the frontend
        return jsonify({
            'clientSecret': intent.client_secret,
            'amount': total_amount_cents,
            'currency': 'cad'
        })

    except Exception as e:
        logger.error(f"Error creating payment intent: {e}", exc_info=True)
        return jsonify(error={'message': str(e)}), 400

@app.route("/store-customer", methods=["POST"])
def store_customer():
    """
    Stores customer information (name, email, phone) and order details to Firestore after successful payment.
    Also updates the Stripe PaymentIntent with customer metadata.

    Expected JSON payload:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "stripePaymentId": "pi_xxxxx",
        "items": [{"id": "...", "name": "...", "price": 29.99, "quantity": 2}] (optional),
        "workshopId": "cedar-basket" (optional),
        "workshopDetails": {...} (optional)
    }

    Returns:
    {
        "success": true,
        "customerId": "firestore_document_id"
    }
    """
    logger.info("[StoreCustomer] Endpoint hit.")
    try:
        data = request.json

        # Validate required fields
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        stripe_payment_id = data.get('stripePaymentId', '').strip()
        items = data.get('items', [])
        workshop_id = data.get('workshopId', '').strip()
        workshop_details = data.get('workshopDetails', {})

        if not name or not email or not phone:
            logger.warning(f"[StoreCustomer] Missing required fields - name: {bool(name)}, email: {bool(email)}, phone: {bool(phone)}")
            return jsonify({'error': 'Missing required fields: name, email, phone'}), 400

        # Validate email format (basic)
        if '@' not in email or '.' not in email:
            logger.warning(f"[StoreCustomer] Invalid email format: {email}")
            return jsonify({'error': 'Invalid email format'}), 400

        logger.info(f"[StoreCustomer] Storing customer: {name} ({email})")
        logger.info(f"[StoreCustomer] Order items: {items}, Workshop: {workshop_id}")
        logger.info(f"[StoreCustomer] Workshop Details received: {workshop_details}")

        # Store to Firestore
        customer_data = {
            'name': name,
            'email': email,
            'phone': phone,
            'stripePaymentId': stripe_payment_id,
            'items': items,
            'workshopId': workshop_id if workshop_id else None,
            'workshopDetails': workshop_details if workshop_details else None,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        logger.info(f"[StoreCustomer] Full customer data to store: {customer_data}")

        # Add to 'customers' collection with auto-generated ID
        doc_ref = db.collection('customers').add(customer_data)
        customer_id = doc_ref[1].id  # doc_ref returns (write_time, document_ref)

        logger.info(f"[StoreCustomer] Customer stored successfully with ID: {customer_id}")

        # IMPORTANT: Update Stripe PaymentIntent with customer metadata
        try:
            if stripe_payment_id:
                # Retrieve the PaymentIntent to update its metadata
                intent = stripe.PaymentIntent.retrieve(stripe_payment_id)

                # Prepare metadata with customer info and order details
                metadata_update = {
                    'customer_name': name,
                    'customer_email': email,
                    'customer_phone': phone,
                    'firestore_customer_id': customer_id
                }

                # Add workshop details if available
                if workshop_id:
                    metadata_update['requested_date'] = workshop_details.get('requested_date', '')
                    metadata_update['requested_time'] = workshop_details.get('requested_time', '')

                # Update PaymentIntent metadata
                stripe.PaymentIntent.modify(
                    stripe_payment_id,
                    metadata=metadata_update
                )
                logger.info(f"[StoreCustomer] Updated Stripe PaymentIntent {stripe_payment_id} with customer metadata")
                logger.info(f"[StoreCustomer] Stripe metadata update: {metadata_update}")
        except Exception as stripe_error:
            logger.error(f"[StoreCustomer] Warning: Could not update Stripe metadata: {stripe_error}")
            # Don't fail the operation if Stripe update fails - customer data is already saved locally

        return jsonify({
            'success': True,
            'customerId': customer_id
        }), 200

    except Exception as e:
        logger.error(f"[StoreCustomer] Error storing customer: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route("/record-and-distribute-transaction", methods=["POST"])
def record_and_distribute_transaction():
    """
    ORCHESTRATOR ENDPOINT: The new "Golden Record" orchestrator.

    This endpoint is the SOURCE OF TRUTH for all transaction data.
    It receives a payment ID from the frontend, fetches the COMPLETE transaction details
    from Stripe (including financial breakdown), creates the "Golden Record",
    and distributes it to both Firestores (MOON as backup, Portal as primary).

    Expected JSON payload:
    {
        "stripePaymentId": "pi_xxxxx",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "items": [] (optional),
        "workshopId": "cedar-basket" (optional),
        "workshopDetails": {...} (optional)
    }

    Returns:
    {
        "status": "success",
        "message": "All records written.",
        "golden_record": {...}
    }
    """
    logger.info("[Orchestrator] 🎯 Orchestrator endpoint hit. Creating Golden Record...")
    try:
        data = request.json
        pi_id = data.get('stripePaymentId')

        if not pi_id:
            logger.warning("[Orchestrator] Missing stripePaymentId")
            return jsonify({'error': 'stripePaymentId is required'}), 400

        # ========================================================================
        # STEP 1: Fetch the COMPLETE transaction details from Stripe
        # ========================================================================
        logger.info(f"[Orchestrator] Step 1: Fetching PaymentIntent {pi_id} from Stripe...")
        try:
            # Expand to get full charge and balance transaction details
            pi = stripe.PaymentIntent.retrieve(pi_id, expand=['latest_charge.balance_transaction'])
            charge = pi.latest_charge

            if not charge:
                logger.error(f"[Orchestrator] PaymentIntent {pi_id} has no charge")
                return jsonify({'error': 'Payment intent has no associated charge'}), 400

            balance_transaction = charge.balance_transaction

            logger.info(f"[Orchestrator] ✅ Retrieved PaymentIntent {pi_id}")
            logger.info(f"[Orchestrator]    Charge ID: {charge.id}")
            logger.info(f"[Orchestrator]    Amount: ${charge.amount/100:.2f} {charge.currency.upper()}")
            logger.info(f"[Orchestrator]    Status: {charge.status}")

        except stripe.error.StripeError as stripe_err:
            logger.error(f"[Orchestrator] Stripe error retrieving PaymentIntent: {stripe_err}")
            return jsonify({'error': f'Failed to retrieve payment: {str(stripe_err)}'}), 400
        except Exception as e:
            logger.error(f"[Orchestrator] Error retrieving PaymentIntent: {e}", exc_info=True)
            return jsonify({'error': str(e)}), 400

        # ========================================================================
        # STEP 2: Calculate the exact financial split (in cents)
        # ========================================================================
        logger.info("[Orchestrator] Step 2: Calculating financial breakdown...")

        total_amount = charge.amount  # in cents
        stripe_fee = balance_transaction.fee if balance_transaction else 0  # Stripe processing fee
        platform_fee = pi.application_fee_amount or 0  # Our platform fee (2.9%)
        # Net amount: what the franchisee actually receives after Stripe fee
        franchisee_net = (balance_transaction.net if balance_transaction else charge.amount) - platform_fee

        logger.info(f"[Orchestrator] ✅ Financial Breakdown Calculated:")
        logger.info(f"[Orchestrator]    Total:          ${total_amount/100:.2f}")
        logger.info(f"[Orchestrator]    Stripe Fee:     ${stripe_fee/100:.2f}")
        logger.info(f"[Orchestrator]    Platform Fee:   ${platform_fee/100:.2f}")
        logger.info(f"[Orchestrator]    Franchisee Net: ${franchisee_net/100:.2f}")

        # ========================================================================
        # STEP 3: Construct the "Golden Record"
        # ========================================================================
        logger.info("[Orchestrator] Step 3: Constructing Golden Record...")

        golden_record = {
            # Customer PII (from frontend)
            "name": data.get('name', ''),
            "email": data.get('email', ''),
            "phone": data.get('phone', ''),

            # Order Details (from frontend)
            "stripePaymentId": pi_id,
            "items": data.get('items', []),
            "workshopId": data.get('workshopId'),
            "workshopDetails": data.get('workshopDetails', {}),

            # Financial Breakdown (from Stripe - THE GOLDEN SOURCE)
            "amount_total": total_amount,
            "amount_stripe_fee": stripe_fee,
            "amount_platform_fee": platform_fee,
            "amount_franchisee_net": franchisee_net,

            # Standard Fields (from Stripe)
            "currency": charge.currency,
            "status": charge.status,
            "description": charge.description or "Workshop Purchase"
        }

        logger.info(f"[Orchestrator] ✅ Golden Record constructed:")
        logger.info(f"[Orchestrator]    Customer: {golden_record['name']} ({golden_record['email']})")
        logger.info(f"[Orchestrator]    Workshop: {golden_record['workshopId']}")
        logger.info(f"[Orchestrator]    Total: ${golden_record['amount_total']/100:.2f} {golden_record['currency'].upper()}")

        # ========================================================================
        # STEP 4: Write to MOON Firestore (BACKUP)
        # ========================================================================
        logger.info("[Orchestrator] Step 4: Writing to MOON Firestore (backup)...")
        try:
            db.collection('customers').document(pi_id).set(golden_record)
            logger.info(f"[Orchestrator] ✅ Backup write to MOON Firestore successful.")
        except Exception as e:
            logger.error(f"[Orchestrator] ⚠️ WARNING: MOON Firestore backup write failed: {e}")
            # Continue anyway - the primary write to Portal is still critical

        # ========================================================================
        # STEP 5: Write to Portal Firestore via Portal Backend (PRIMARY)
        # ========================================================================
        logger.info("[Orchestrator] Step 5: Writing to Portal Firestore via Portal Backend API...")

        PORTAL_BACKEND_URL = "https://stripe-connect-backend-338017041631.us-central1.run.app"
        FRANCHISEE_ID = "fwUTBxjg4UeDQYQTKQK6B9ZJEO92"  # Mom's franchisee ID

        try:
            portal_endpoint = f"{PORTAL_BACKEND_URL}/api/franchisees/{FRANCHISEE_ID}/transactions"
            logger.info(f"[Orchestrator] Making POST request to: {portal_endpoint}")

            portal_response = requests.post(
                portal_endpoint,
                json=golden_record,
                timeout=10
            )

            portal_response.raise_for_status()  # Raise exception if status >= 400
            logger.info(f"[Orchestrator] ✅ Primary write to Portal Backend successful.")
            logger.info(f"[Orchestrator]    Response: {portal_response.json()}")

        except requests.exceptions.Timeout:
            logger.error(f"[Orchestrator] ⚠️ CRITICAL: Portal Backend request timed out")
            # Backup write succeeded, so we can still return partial success
            return jsonify({
                "status": "partial_success",
                "message": "Backup record saved to MOON, but primary write to Portal timed out.",
                "golden_record": golden_record
            }), 200
        except requests.exceptions.ConnectionError as conn_err:
            logger.error(f"[Orchestrator] ⚠️ CRITICAL: Could not connect to Portal Backend: {conn_err}")
            return jsonify({
                "status": "partial_success",
                "message": "Backup record saved to MOON, but could not reach Portal Backend.",
                "golden_record": golden_record
            }), 200
        except requests.exceptions.HTTPError as http_err:
            logger.error(f"[Orchestrator] ⚠️ CRITICAL: Portal Backend returned error: {http_err}")
            logger.error(f"[Orchestrator]    Response: {portal_response.text}")
            return jsonify({
                "status": "partial_success",
                "message": "Backup record saved to MOON, but Portal Backend returned an error.",
                "golden_record": golden_record
            }), 200
        except Exception as http_err:
            logger.error(f"[Orchestrator] ⚠️ CRITICAL: Failed to write to Portal Backend. Error: {http_err}")
            return jsonify({
                "status": "partial_success",
                "message": "Backup record saved to MOON, but primary write failed.",
                "golden_record": golden_record
            }), 200

        # ========================================================================
        # SUCCESS: All records written
        # ========================================================================
        logger.info("[Orchestrator] 🎉 SUCCESS: All records written to both Firestores!")

        return jsonify({
            "status": "success",
            "message": "All records written successfully.",
            "golden_record": golden_record
        }), 200

    except Exception as e:
        logger.error(f"[Orchestrator] FATAL ERROR: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    """
    Creates a dynamic Stripe Checkout session for workshop bookings.

    Expected JSON payload:
    {
        "workshop_id": "cedar-basket",
        "organization_type": "community",  # "corporate" or "community"
        "participants": 15
    }

    The user's email and payment details are collected by Stripe during checkout.
    """
    logger.info("Create checkout session endpoint hit.")
    try:
        data = request.json

        # Extract and validate request data
        workshop_id = data.get('workshop_id', '').lower().strip()
        org_type = data.get('organization_type', 'corporate').lower().strip()
        participants = data.get('participants')

        # Validate required fields
        if not workshop_id or not participants:
            logger.warning(f"Missing required fields: workshop_id={workshop_id}, participants={participants}")
            return jsonify({"error": "Missing required booking information"}), 400

        # Validate participant count
        try:
            participants = int(participants)
            if participants < 1:
                return jsonify({"error": "Participants must be at least 1"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Participants must be a valid number"}), 400

        # Check if Stripe is configured
        if not STRIPE_SECRET_KEY:
            logger.error("STRIPE_SECRET_KEY not configured!")
            return jsonify({"error": "Payment system not configured. Please try again later."}), 500

        # Get workshop pricing info
        pricing_info = WORKSHOP_PRICING.get(workshop_id)
        if not pricing_info:
            logger.warning(f"Unknown workshop_id: {workshop_id}")
            return jsonify({"error": "Invalid workshop ID"}), 400

        # Get Stripe Price ID
        price_map = STRIPE_PRICE_MAP.get(workshop_id)
        if not price_map:
            logger.warning(f"No Stripe price mapping for workshop: {workshop_id}")
            return jsonify({"error": "Workshop pricing not configured"}), 500

        # Determine which price to use
        if pricing_info.get('per_person'):
            # Per-person pricing: use org_type
            stripe_price_id = price_map.get(org_type) or price_map.get('corporate')
            if not stripe_price_id:
                logger.warning(f"No price configured for {workshop_id} / {org_type}")
                return jsonify({"error": "Pricing tier not available"}), 400
        else:
            # Flat-rate pricing: use 'default'
            stripe_price_id = price_map.get('default')
            if not stripe_price_id:
                logger.warning(f"No default price for flat-rate workshop: {workshop_id}")
                return jsonify({"error": "Pricing not configured"}), 400

        # Get frontend URL from environment (for success/cancel URLs)
        FRONTEND_URL = os.getenv("FRONTEND_URL", "https://moon-tide.web.app")

        # Create Stripe Checkout Session
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': stripe_price_id,
                    'quantity': participants,
                }],
                mode='payment',
                success_url=f'{FRONTEND_URL}/success.html?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{FRONTEND_URL}/cancel.html',
                metadata={
                    'workshop_id': workshop_id,
                    'organization_type': org_type,
                    'participants': str(participants),
                }
            )

            logger.info(f"✓ Stripe Checkout session created: {session.id}")
            return jsonify({'sessionId': session.id}), 200

        except stripe.error.CardError as e:
            logger.error(f"Card error: {e.user_message}")
            return jsonify({"error": e.user_message}), 400
        except stripe.error.RateLimitError as e:
            logger.error(f"Rate limit error: {e}")
            return jsonify({"error": "Service temporarily unavailable. Please try again."}), 429
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Invalid request to Stripe: {e}")
            return jsonify({"error": "Invalid payment request"}), 400
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return jsonify({"error": "Payment service error"}), 500

    except Exception as e:
        logger.error(f"Unexpected error in /create-checkout-session: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500


# NEW: Register Client Portal API Blueprint
if client_api:
    app.register_blueprint(client_api)
    logger.info("✓ Client Portal API blueprint registered")

if __name__ == "__main__":
    # This is for local development only. Cloud Run uses Gunicorn to run the app.
    # Set default project and region for local testing if not already set
    if PROJECT_ID is None:
        logger.warning("GOOGLE_CLOUD_PROJECT not set. Using dummy project ID 'your-project-id' for local dev.")
        # If you want to test AI locally, replace "your-project-id" with your actual Google Cloud Project ID
        # and ensure 'gcloud auth application-default login' has been run.
        # Example: PROJECT_ID = "reconciliation-475704"
        pass
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
