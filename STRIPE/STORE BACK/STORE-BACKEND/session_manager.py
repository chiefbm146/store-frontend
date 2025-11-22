"""
Simple Firestore-based session manager for Moon Tide AI.
One session = one tab = one user's current browsing session.
Fresh tab = fresh session_id = completely fresh state.
No persistence across tabs, no user accounts, no caching.
"""

import logging
from datetime import datetime, timedelta
from google.cloud import firestore
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class FirestoreSessionManager:
    """Manages session state in Firestore. Every read/write goes to Firestore."""

    def __init__(self, project_id: str = "stores-12345", collection_name: str = "sessions"):
        self.db = firestore.Client(project=project_id)
        self.collection = self.db.collection(collection_name)
        logger.info(f"✓ Initialized FirestoreSessionManager (project={project_id}, collection={collection_name})")

    def create_session(self, session_id: str, booking_manager) -> None:
        """
        Create a new session in Firestore.
        Called when: new tab opens, session_id doesn't exist in Firestore yet.
        """
        now = datetime.now()
        ttl_time = now + timedelta(minutes=30)  # 30 min from now

        session_data = {
            'created_at': firestore.SERVER_TIMESTAMP,
            'last_access_time': firestore.SERVER_TIMESTAMP,
            'ttl': ttl_time,  # Firestore TTL policy will auto-delete this
            'state': booking_manager.state,  # Store entire BookingContextManager.state
            'request_count': 1
        }

        try:
            self.collection.document(session_id).set(session_data)
            logger.info(f"📝 SESSION_CREATED: [{session_id}]")
        except Exception as e:
            logger.error(f"❌ FIRESTORE_ERROR creating session [{session_id}]: {e}")
            raise

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session state from Firestore.
        Called at start of every /chat request.
        Returns: session document data, or None if doesn't exist.
        Converts lists back to sets where needed (Firestore converts sets to lists).
        """
        try:
            doc = self.collection.document(session_id).get()
            if doc.exists:
                data = doc.to_dict()
                # Firestore converts sets to lists, convert back
                if 'state' in data and 'triggered_hardcodes' in data['state']:
                    if isinstance(data['state']['triggered_hardcodes'], list):
                        data['state']['triggered_hardcodes'] = set(data['state']['triggered_hardcodes'])
                logger.info(f"📂 SESSION_LOADED: [{session_id}] from Firestore")
                return data
            else:
                logger.info(f"ℹ️  SESSION_NOT_FOUND: [{session_id}] (will create new)")
                return None
        except Exception as e:
            logger.error(f"❌ FIRESTORE_ERROR reading session [{session_id}]: {e}")
            raise

    def update_session(self, session_id: str, booking_manager, request_count: int = 1) -> None:
        """
        Save session state back to Firestore.
        Called after every /chat request to persist state changes.
        Also updates last_access_time (resets TTL timer).
        Uses set() with merge=True to create if doesn't exist (idempotent).

        Can accept either:
        - A BookingContextManager object (extracts .state property)
        - A dictionary (used directly as session_data)
        """
        now = datetime.now()
        ttl_time = now + timedelta(minutes=30)  # Reset 30-min timer from now

        # Handle both booking_manager objects and raw dictionaries
        if isinstance(booking_manager, dict):
            # If it's a dictionary, use it directly as the session data to preserve
            session_data = {
                'last_access_time': firestore.SERVER_TIMESTAMP,
                'ttl': ttl_time,  # Reset TTL expiration time
                'request_count': request_count
            }
            # Merge in the dictionary while preserving all existing keys
            session_data.update(booking_manager)
        else:
            # If it's a booking_manager object, extract the state
            session_data = {
                'last_access_time': firestore.SERVER_TIMESTAMP,
                'ttl': ttl_time,  # Reset TTL expiration time
                'state': booking_manager.state,  # Store entire updated state
                'request_count': request_count
            }

        try:
            # Use set() with merge=True instead of update() - creates if doesn't exist
            self.collection.document(session_id).set(session_data, merge=True)
            logger.info(f"💾 SESSION_SAVED: [{session_id}] to Firestore (request #{request_count})")
        except Exception as e:
            logger.error(f"❌ FIRESTORE_ERROR updating session [{session_id}]: {e}")
            raise

    def delete_session(self, session_id: str) -> None:
        """
        Delete a session from Firestore.
        Called when: booking completes, user finishes.
        """
        try:
            self.collection.document(session_id).delete()
            logger.info(f"🗑️  SESSION_DELETED: [{session_id}]")
        except Exception as e:
            logger.error(f"❌ FIRESTORE_ERROR deleting session [{session_id}]: {e}")
            raise

    def get_active_sessions_count(self) -> int:
        """
        Get total count of active sessions in Firestore.
        Used for monitoring/logging.
        """
        try:
            docs = self.collection.stream()
            count = len(list(docs))
            logger.info(f"📊 ACTIVE_SESSIONS: {count} in Firestore")
            return count
        except Exception as e:
            logger.error(f"❌ FIRESTORE_ERROR counting sessions: {e}")
            return 0
