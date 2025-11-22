#!/usr/bin/env python3
"""
Clear rate limit counters from Firestore for testing purposes.
This allows testing the rate limiting system with a clean slate.
"""

from google.cloud import firestore

def clear_rate_limits():
    """Delete all rate limit shard documents from Firestore."""
    db = firestore.Client(project="reconciliation-475704")

    rate_limit_collection = "rate_limit_shards"

    # Get all documents in the rate_limit_shards collection
    docs = db.collection(rate_limit_collection).stream()

    deleted_count = 0
    for doc in docs:
        doc.reference.delete()
        deleted_count += 1
        print(f"Deleted: {doc.id}")

    print(f"\n✅ Cleared {deleted_count} rate limit shard documents")
    return deleted_count

if __name__ == "__main__":
    count = clear_rate_limits()
    print(f"\nRate limits have been reset. Ready for testing!")
