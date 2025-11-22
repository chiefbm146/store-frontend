"""
Cloud Function: Reset Rate Limit Counters
Triggered by Cloud Scheduler every minute.
Resets all shard counters in Firestore.
"""
from google.cloud import firestore
from flask import jsonify

def reset_rate_limit_shards(request):
    """
    HTTP Cloud Function to reset per-minute rate limit counters.
    Triggered by Cloud Scheduler every minute.

    IMPORTANT: This function resets TWO collections:
    1. rate_limit_shards - Per-endpoint throttling and global DDoS tracking
    2. ip_rate_limit_shards - IP-based rate limiting (NEW)

    It does NOT touch the system_status/circuit_breaker document, which persists
    across resets. The circuit breaker's strike count and lockdown status are
    preserved to enforce the three-strikes policy.

    Args:
        request: Cloud Functions HTTP request context

    Returns:
        JSON response with status code
    """
    try:
        # Initialize Firestore client inside function
        db = firestore.Client()

        collections_to_reset = [
            "rate_limit_shards",      # Layer 1: Per-endpoint throttling and Layer 3: Global DDoS
            "ip_rate_limit_shards"    # Layer 0: IP-based rate limiting
        ]

        total_deleted = 0

        for collection_name in collections_to_reset:
            # Delete ALL documents in the collection
            # (documents have prefixes like "endpoint_shard_0", "IP_192_168_1_100_5", etc.)
            docs = db.collection(collection_name).stream()
            deleted_count = 0

            for doc in docs:
                doc.reference.delete()
                deleted_count += 1

            total_deleted += deleted_count
            print(f"Reset {deleted_count} documents from {collection_name}")

        message = f"Successfully reset {total_deleted} rate limit shard documents across {len(collections_to_reset)} collections."
        print(message)
        return jsonify({"status": "success", "message": message}), 200

    except Exception as e:
        error_message = f"Error resetting rate limit shards: {str(e)}"
        print(f"ERROR: {error_message}")
        return jsonify({"status": "error", "message": error_message}), 500
