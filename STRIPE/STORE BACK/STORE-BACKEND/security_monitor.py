"""
Security Monitoring Module
Tracks security events, attack patterns, and generates alerts.
Enhanced with proactive abuse detection and temporary IP banning.
"""

import logging
import time
# =============================================================================
# FIX: Added missing 'threading' import
# The lazy-loading implementation used threading.Lock() without importing the module.
# =============================================================================
import threading
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Optional
from google.cloud import firestore

logger = logging.getLogger(__name__)

class SecurityMonitor:
    """
    Monitors security events and detects attack patterns.
    Enhanced with automatic temporary IP banning for abuse patterns.
    """

    def __init__(self):
        # =============================================================================
        # FIX: LAZY-LOADING FIRESTORE CLIENT
        # Eagerly initializing the client in __init__ slows down startup and causes
        # worker timeouts. This is deferred until the first database operation.
        # =============================================================================
        self.db: Optional[firestore.Client] = None
        self._db_lock = threading.Lock()

        # In-memory tracking for security events - USER-BASED ONLY
        self.failed_auth_attempts = defaultdict(deque)  # user_id -> timestamps
        self.mass_assignment_attempts = defaultdict(deque)  # user_id -> timestamps
        self.prompt_injection_attempts = defaultdict(deque)  # user_id -> timestamps
        self.dos_attempts = defaultdict(deque)  # user_id -> timestamps

        # In-memory tracking for rate limit breaches - USER-BASED TRACKING
        self.rate_limit_breaches = defaultdict(deque)  # user_id -> timestamps of breaches

        # Tiered Penalty System State - USER-BASED TRACKING
        self.strike_one_users = {}  # user_id -> expiry_timestamp (1-hour ban)
        self.strike_two_users = {}  # user_id -> expiry_timestamp (24-hour ban)
        self.strike_three_log = defaultdict(deque) # user_id -> timestamps of Strike 2 bans

        # === NEW: FINGERPRINT-BASED TRACKING FOR UNAUTHENTICATED USERS ===
        self.fingerprint_breaches = defaultdict(deque)  # fingerprint -> timestamps
        self.strike_one_fingerprints = {}  # fingerprint -> expiry_timestamp
        self.strike_two_fingerprints = {}  # fingerprint -> expiry_timestamp

        # === NEW: PATTERN DETECTION FOR UNAUTHENTICATED USERS ===
        self.fingerprint_prompt_injection_attempts = defaultdict(deque)  # fingerprint -> timestamps
        self.fingerprint_dos_attempts = defaultdict(deque)  # fingerprint -> timestamps

        # Tiered Penalty System Configuration - Aggressive Bot Detection
        self.STRIKE_ONE_THRESHOLD = 8        # 8 breaches in 2 minutes = immediate 1hr ban
        self.STRIKE_ONE_WINDOW = 120         # 2-minute detection window
        self.STRIKE_ONE_DURATION = 3600      # 1 hour ban (skip "rate limiting" phase)

        self.STRIKE_TWO_THRESHOLD = 2        # 2 breaches during ban = 24hr escalation
        self.STRIKE_TWO_DURATION = 86400     # 24 hour ban

        self.STRIKE_THREE_THRESHOLD = 2      # 2 temp bans in 24 hours = permanent ban

        # Thresholds for other security events
        self.FAILED_AUTH_THRESHOLD = 5  # attempts per 10 minutes
        self.MASS_ASSIGNMENT_THRESHOLD = 3  # attempts per hour
        self.PROMPT_INJECTION_THRESHOLD = 10  # attempts per hour
        self.DOS_THRESHOLD = 20  # requests per minute

        # === NEW: THRESHOLDS FOR UNAUTHENTICATED PATTERN DETECTION ===
        self.PROMPT_INJECTION_THRESHOLD_UNAUTH = 5  # 5 attempts in 1 hour = ban
        self.DOS_THRESHOLD_UNAUTH = 30  # 30 requests per minute = ban

    def _get_db(self):
        """Thread-safe singleton getter for the Firestore client."""
        if self.db is not None:
            return self.db
        with self._db_lock:
            if self.db is not None:
                return self.db
            try:
                import os
                logger.info("Initializing Firestore client for SecurityMonitor...")
                _project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "stores-12345")
                self.db = firestore.Client(project=_project_id)
                logger.info(f"Firestore client for SecurityMonitor initialized with project: {_project_id}")
                return self.db
            except Exception as e:
                logger.error(f"Failed to initialize Firestore for security monitoring: {e}")
                return None

    def get_user_penalty_status(self, user_id: str) -> Dict:
        """Checks the current penalty status for a user and cleans up expired penalties."""
        if not user_id:
            return {'penalty_level': 0, 'status': 'ok'}

        now = time.time()

        # Check for Strike 3 (Permanent Firestore Ban) FIRST
        try:
            db = self._get_db()
            if db:
                quarantine_ref = db.collection('user_quarantine').document(user_id)
                if quarantine_ref.get().exists:
                    return {'penalty_level': 3, 'status': 'permanently_banned'}
        except Exception as e:
            logger.error(f"Firestore quarantine check failed for user {user_id}: {e}")

        # Check for Strike 2 (24-hour Temporary Ban)
        if user_id in self.strike_two_users:
            if now < self.strike_two_users[user_id]:
                return {'penalty_level': 2, 'status': 'temp_banned'}
            else:
                del self.strike_two_users[user_id]

        # Check for Strike 1 (1-hour Ban)
        if user_id in self.strike_one_users:
            if now < self.strike_one_users[user_id]:
                return {'penalty_level': 1, 'status': 'rate_limited_banned'}
            else:
                del self.strike_one_users[user_id]

        return {'penalty_level': 0, 'status': 'ok'}

    def log_unauthenticated_breach(self, fingerprint: str, endpoint: str):
        """
        Track breaches for unauthenticated sessions using fingerprints.
        Applies the same 3-strike logic as authenticated users, but keyed by device fingerprint.
        """
        if not fingerprint:
            logger.debug("No fingerprint provided for unauthenticated breach tracking")
            return "no_fingerprint"

        now = time.time()
        breaches = self.fingerprint_breaches[fingerprint]

        # Strike 1 check (8 breaches in 2 minutes)
        cutoff_2m = now - self.STRIKE_ONE_WINDOW
        while breaches and breaches[0] < cutoff_2m:
            breaches.popleft()
        breaches.append(now)

        logger.debug(f"FINGERPRINT BREACH: {fingerprint} on {endpoint}. Current count in 2min: {len(breaches)}/{self.STRIKE_ONE_THRESHOLD}")

        # Check if already banned
        if fingerprint in self.strike_one_fingerprints:
            if now < self.strike_one_fingerprints[fingerprint]:
                # Still banned
                logger.warning(f"Fingerprint {fingerprint} is currently banned (Strike 1)")
                return "currently_banned"
            else:
                # Ban expired, clean up
                logger.debug(f"Strike 1 ban expired for fingerprint {fingerprint}")
                del self.strike_one_fingerprints[fingerprint]

        # Apply Strike 1 if threshold reached
        if len(breaches) >= self.STRIKE_ONE_THRESHOLD:
            breach_count = len(breaches)
            self.strike_one_fingerprints[fingerprint] = now + self.STRIKE_ONE_DURATION
            breaches.clear()
            logger.warning(f"UNAUTHENTICATED STRIKE 1: Fingerprint {fingerprint} banned for 1 hour ({breach_count} breaches in 2 minutes)")
            return "strike_one_banned"

        return "allowed"

    def check_prompt_injection_pattern_unauth(self, fingerprint: str, prompt: str) -> bool:
        """
        Check for prompt injection patterns in unauthenticated users (Layer 5).
        Detects common jailbreak/injection attempts and escalates to 1-hour ban.
        Returns True if threshold exceeded (ban should be applied), False otherwise.
        """
        if not fingerprint or not prompt:
            return False

        suspicious_patterns = [
            r"ignore\s+(?:previous|all|above)\s+instructions",
            r"system\s*:?\s*prompt",
            r"forget\s+everything",
            r"role\s*:?\s*system",
            r"act\s+as\s+(?:admin|system|gpt|ai|assistant)",
            r"jailbreak",
            r"override.*(?:protection|security|rule|safeguard)",
            r"disable.*(?:safety|filter|check)",
        ]

        is_suspicious = any(
            __import__('re').search(pattern, prompt.lower())
            for pattern in suspicious_patterns
        )

        if is_suspicious:
            now = time.time()
            attempts = self.fingerprint_prompt_injection_attempts[fingerprint]
            attempts.append(now)

            # Clean old attempts (1 hour window)
            cutoff = now - 3600
            while attempts and attempts[0] < cutoff:
                attempts.popleft()

            self.log_security_event(
                'PROMPT_INJECTION_ATTEMPT_UNAUTH',
                fingerprint=fingerprint,
                details={'prompt_sample': prompt[:100], 'attempts_count': len(attempts)}
            )

            # Ban if threshold exceeded (5 attempts in 1 hour)
            if len(attempts) >= self.PROMPT_INJECTION_THRESHOLD_UNAUTH:
                logger.critical(f"PROMPT INJECTION THRESHOLD EXCEEDED for fingerprint {fingerprint}. Applying 1-hour ban.")
                self.strike_one_fingerprints[fingerprint] = now + self.STRIKE_ONE_DURATION
                return True

        return False

    def check_dos_pattern_unauth(self, fingerprint: str) -> bool:
        """
        Check for potential DoS attack patterns in unauthenticated users (Layer 5).
        Tracks rapid requests and triggers ban at threshold.
        Returns True if threshold exceeded (ban should be applied), False otherwise.
        """
        if not fingerprint:
            return False

        now = time.time()
        cutoff = now - 60  # 1-minute window

        attempts = self.fingerprint_dos_attempts[fingerprint]
        while attempts and attempts[0] < cutoff:
            attempts.popleft()

        attempts.append(now)

        # DoS threshold: 30 requests per minute for unauthenticated
        if len(attempts) >= self.DOS_THRESHOLD_UNAUTH:
            self.log_security_event(
                'DOS_ATTEMPT_UNAUTH',
                fingerprint=fingerprint,
                details={'requests_per_minute': len(attempts)}
            )
            logger.critical(f"DOS PATTERN DETECTED for fingerprint {fingerprint}: {len(attempts)} req/min")
            # Ban this fingerprint for 1 hour
            self.strike_one_fingerprints[fingerprint] = now + self.STRIKE_ONE_DURATION
            return True

        return False

    def log_rate_limit_breach(self, user_id: str, ip_address: str, endpoint: str):
        """
        Tracks breaches and applies the Three Strikes penalty system.
        USER-BASED TRACKING: Now tracks users instead of IPs for authenticated requests.
        """
        if not user_id:
            # If no user_id, skip tracking (unauthenticated requests handled by base rate limits)
            logger.debug(f"Skipping rate limit breach logging for unauthenticated request from IP {ip_address}")
            return

        now = time.time()

        # Filter out only pure authentication endpoints during penalties to prevent feedback loops
        # IMPORTANT: Main chat endpoints (text_chat_intent, voice_chat_intent) should ALWAYS be tracked
        pure_auth_endpoints = [
            'transcribe_route', 'contact_message_route'  # Only non-chat endpoints
        ]

        # Add timing safeguards to prevent authentication failures from triggering rate limit violations
        current_penalty = self.get_user_penalty_status(user_id)
        if current_penalty['penalty_level'] > 0:
            # During penalties, only filter pure auth endpoints, NOT main chat endpoints
            if endpoint in pure_auth_endpoints:
                logger.debug(f"Skipping rate limit breach logging for pure auth endpoint {endpoint} during penalty period for user {user_id}")
                return

        # Log the breach with enhanced context
        self.log_security_event('RATE_LIMIT_BREACH', user_id, ip_address, {
            'endpoint': endpoint,
            'current_penalty_level': current_penalty['penalty_level'],
            'timestamp': now
        })
        breaches = self.rate_limit_breaches[user_id]

        # DEBUG: Log breach tracking for troubleshooting
        logger.info(f"SECURITY DEBUG: Rate limit breach logged for user {user_id} on endpoint {endpoint}. Current breach count: {len(breaches)}")

        # --- STRIKE 2 LOGIC ---
        # If user is already under a strict rate limit, check for escalation to a temp ban.
        if current_penalty['penalty_level'] == 1:
            breaches.append(now)

            # Use a shorter window for Strike 2 escalation
            cutoff_strike2 = now - 300  # 5 minutes for Strike 2 escalation
            while breaches and breaches[0] < cutoff_strike2:
                breaches.popleft()

            if len(breaches) >= self.STRIKE_TWO_THRESHOLD:
                # Capture breach count BEFORE clearing
                breach_count = len(breaches)

                # Escalate to Strike 2: Temporary Ban
                self.strike_two_users[user_id] = now + self.STRIKE_TWO_DURATION
                if user_id in self.strike_one_users:
                    del self.strike_one_users[user_id] # Remove from lower tier
                breaches.clear() # Reset strikes

                # Log the Strike 2 event
                self.log_security_event('STRIKE_TWO_BAN_APPLIED', user_id, ip_address, {'duration': self.STRIKE_TWO_DURATION})
                logger.warning(f"SECURITY: Strike 2 - 24-hour ban applied to user {user_id}.")

                # Sync with user profile
                if user_id:
                    try:
                        from database import update_user_ban_from_security_monitor
                        update_user_ban_from_security_monitor(user_id, 2, f"Strike 2: {breach_count} additional breaches during Strike 1")
                    except Exception as e:
                        logger.error(f"Failed to sync Strike 2 with user profile: {e}")

                # --- STRIKE 3 LOGIC ---
                # Now, check if this ban triggers a permanent quarantine.
                strike_log = self.strike_three_log[user_id]
                cutoff_24h = now - 86400
                while strike_log and strike_log[0] < cutoff_24h:
                    strike_log.popleft()
                strike_log.append(now)

                if len(strike_log) >= self.STRIKE_THREE_THRESHOLD:
                    # Escalate to Strike 3: Permanent Ban (Manual Review)
                    try:
                        db = self._get_db()
                        if db:
                            quarantine_doc = {
                                'banned_at': firestore.SERVER_TIMESTAMP,
                                'reason': f'{len(strike_log)} temp bans in 24 hours. Final trigger on endpoint: {endpoint}.',
                                'user_id': user_id,
                                'ip_at_ban': ip_address,
                                'status': 'quarantined',
                                'penalty_level': 3,
                                'automatic_ban': True
                            }
                            db.collection('user_quarantine').document(user_id).set(quarantine_doc)
                            logger.critical(f"SECURITY: Strike 3 - PERMANENT BAN applied to user {user_id}. Firestore document created.")
                        else:
                            logger.error(f"SECURITY: Strike 3 triggered but Firestore unavailable for user {user_id}")

                        self.log_security_event('STRIKE_THREE_QUARANTINE_APPLIED', user_id, ip_address, {
                            'reason': 'Repeated temporary bans',
                            'strike_count': len(strike_log)
                        })

                        # Sync with user profile
                        if user_id:
                            try:
                                from database import update_user_ban_from_security_monitor
                                update_user_ban_from_security_monitor(user_id, 3, f"Strike 3: {len(strike_log)} temp bans in 24 hours - permanent ban")
                            except Exception as e:
                                logger.error(f"Failed to sync Strike 3 with user profile: {e}")

                    except Exception as e:
                        logger.error(f"SECURITY: Failed to create Strike 3 quarantine for IP {ip_address}: {e}")

            return # End processing for this tier

        # --- STRIKE 1 LOGIC ---
        # If user has no penalty, check if it deserves one.
        if current_penalty['penalty_level'] == 0:
            cutoff_2m = now - self.STRIKE_ONE_WINDOW  # 2-minute window (120 seconds)
            while breaches and breaches[0] < cutoff_2m:
                breaches.popleft()
            breaches.append(now)

            # DEBUG: Log Strike 1 threshold checking
            logger.info(f"SECURITY DEBUG: Strike 1 check for user {user_id}: {len(breaches)} breaches in 2 minutes (threshold: {self.STRIKE_ONE_THRESHOLD})")

            if len(breaches) >= self.STRIKE_ONE_THRESHOLD:
                # Capture breach count BEFORE clearing
                breach_count = len(breaches)

                # Apply Strike 1: 1-Hour Ban (skip ineffective rate limiting phase)
                self.strike_one_users[user_id] = now + self.STRIKE_ONE_DURATION
                breaches.clear() # Reset strikes for next tier check
                self.log_security_event('STRIKE_ONE_BAN_APPLIED', user_id, ip_address, {'duration': self.STRIKE_ONE_DURATION})
                logger.warning(f"SECURITY: Strike 1 - 1-hour ban applied to user {user_id}.")

                # Sync with user profile
                if user_id:
                    try:
                        from database import update_user_ban_from_security_monitor
                        update_user_ban_from_security_monitor(user_id, 1, f"Strike 1: {breach_count} breaches in 2 minutes")
                    except Exception as e:
                        logger.error(f"Failed to sync Strike 1 with user profile: {e}")

    def log_security_event(self, event_type: str, user_id: str = None,
                          ip_address: str = None, fingerprint: str = None, details: Dict = None):
        """
        Log a security event to Firestore for analysis.
        Supports both user_id (authenticated) and fingerprint (unauthenticated) tracking.
        """
        db = self._get_db()
        if not db:
            logger.warning(f"Firestore not available. Skipping security event log: {event_type}")
            return

        try:
            security_event = {
                'event_type': event_type,
                'user_id': user_id,
                'fingerprint': fingerprint,
                'ip_address': ip_address,
                'details': details or {},
                'timestamp': firestore.SERVER_TIMESTAMP,
                'severity': self._get_event_severity(event_type)
            }

            db.collection('security_events').add(security_event)
            logger.info(f"Security event logged: {event_type}")

        except Exception as e:
            logger.error(f"Failed to log security event: {e}")

    def check_failed_auth_pattern(self, user_id: str) -> bool:
        """
        Check if user has too many failed authentication attempts.
        USER-BASED: Tracks authentication failures by user account, not IP.
        """
        if not user_id:
            return False  # Skip tracking for unauthenticated requests

        now = time.time()
        cutoff = now - 600  # 10 minutes

        attempts = self.failed_auth_attempts[user_id]
        while attempts and attempts[0] < cutoff:
            attempts.popleft()

        # Add current attempt
        attempts.append(now)

        if len(attempts) >= self.FAILED_AUTH_THRESHOLD:
            self.log_security_event(
                'BRUTE_FORCE_DETECTED',
                user_id=user_id,
                details={'attempts_count': len(attempts)}
            )
            return True
        return False

    def check_mass_assignment_pattern(self, user_id: str) -> bool:
        """
        Check if user has too many mass assignment attempts.
        """
        now = time.time()
        cutoff = now - 3600  # 1 hour

        attempts = self.mass_assignment_attempts[user_id]
        while attempts and attempts[0] < cutoff:
            attempts.popleft()

        attempts.append(now)

        if len(attempts) >= self.MASS_ASSIGNMENT_THRESHOLD:
            self.log_security_event(
                'MASS_ASSIGNMENT_ATTACK',
                user_id=user_id,
                details={'attempts_count': len(attempts)}
            )
            return True
        return False

    def check_prompt_injection_pattern(self, user_id: str, prompt: str) -> bool:
        """
        Check for prompt injection patterns and rate limiting.
        """
        # Pattern detection
        suspicious_patterns = [
            r"ignore\s+(?:previous|all|above)\s+instructions",
            r"system\s*:?\s*prompt",
            r"forget\s+everything",
            r"role\s*:?\s*system"
        ]

        is_suspicious = any(
            __import__('re').search(pattern, prompt.lower())
            for pattern in suspicious_patterns
        )

        if is_suspicious:
            now = time.time()
            attempts = self.prompt_injection_attempts[user_id]
            attempts.append(now)

            # Clean old attempts (1 hour window)
            cutoff = now - 3600
            while attempts and attempts[0] < cutoff:
                attempts.popleft()

            self.log_security_event(
                'PROMPT_INJECTION_ATTEMPT',
                user_id=user_id,
                details={'prompt_sample': prompt[:100], 'attempts_count': len(attempts)}
            )

            return len(attempts) >= self.PROMPT_INJECTION_THRESHOLD

        return False

    def check_dos_pattern(self, user_id: str) -> bool:
        """
        Check for potential DoS attack patterns.
        USER-BASED: Tracks DoS attempts by user account, not IP.
        """
        if not user_id:
            return False  # Skip tracking for unauthenticated requests

        now = time.time()
        cutoff = now - 60  # 1 minute

        attempts = self.dos_attempts[user_id]
        while attempts and attempts[0] < cutoff:
            attempts.popleft()

        attempts.append(now)

        if len(attempts) >= self.DOS_THRESHOLD:
            self.log_security_event(
                'DOS_ATTEMPT',
                user_id=user_id,
                details={'requests_per_minute': len(attempts)}
            )
            return True
        return False

    def get_ban_status(self, user_id: str) -> Dict:
        """
        Get detailed ban status for a user.
        """
        if not user_id:
            return {
                'is_banned': False,
                'penalty_level': 0,
                'ban_expires_at': None,
                'time_remaining': 0,
                'reason': None
            }

        penalty_status = self.get_user_penalty_status(user_id)

        if penalty_status['penalty_level'] == 2:
            # Strike 2: Temporary Ban
            ban_expires = self.strike_two_users[user_id]
            current_time = time.time()
            return {
                'is_banned': True,
                'penalty_level': 2,
                'ban_expires_at': ban_expires,
                'time_remaining': int(ban_expires - current_time),
                'reason': 'Strike 2: 24-hour ban for repeated rate limit violations'
            }
        elif penalty_status['penalty_level'] == 1:
            # Strike 1: 1-Hour Ban
            ban_expires = self.strike_one_users[user_id]
            current_time = time.time()
            return {
                'is_banned': True,
                'penalty_level': 1,
                'ban_expires_at': ban_expires,
                'time_remaining': int(ban_expires - current_time),
                'reason': 'Strike 1: 1-hour ban for repeated rate limit violations'
            }

        # Check for Strike 3 (Permanent Ban)
        db = self._get_db()
        if db:
            try:
                quarantine_ref = db.collection('user_quarantine').document(user_id)
                quarantine_doc = quarantine_ref.get()
                if quarantine_doc.exists:
                    return {
                        'is_banned': True,
                        'penalty_level': 3,
                        'ban_expires_at': None,
                        'time_remaining': None,
                        'reason': 'Strike 3: Permanent quarantine - manual review required'
                    }
            except Exception as e:
                logger.error(f"Error checking quarantine status for {user_id}: {e}")

        return {
            'is_banned': False,
            'penalty_level': 0,
            'ban_expires_at': None,
            'time_remaining': 0,
            'reason': None
        }

    def get_breach_count(self, user_id: str) -> int:
        """
        Get current breach count for a user in the last 10 minutes.
        USER-BASED: Tracks breach counts by user account, not IP.
        """
        if not user_id:
            return 0

        now = time.time()
        cutoff = now - 600  # 10 minutes

        breaches = self.rate_limit_breaches[user_id]

        # Clean old breaches
        while breaches and breaches[0] < cutoff:
            breaches.popleft()

        return len(breaches)

    def manually_ban_user(self, user_id: str, duration_seconds: int = None, reason: str = "Manual ban") -> bool:
        """
        Manually ban a user (admin function).
        This applies a Strike 2 level ban unless permanent ban is requested.
        """
        if not user_id:
            return False

        try:
            if duration_seconds is None:
                # Default to Strike 2 duration
                duration = self.STRIKE_TWO_DURATION
                ban_expires = time.time() + duration
                self.strike_two_users[user_id] = ban_expires
                penalty_level = 2
            elif duration_seconds == -1:
                # Permanent ban (Strike 3 equivalent)
                db = self._get_db()
                if db:
                    db.collection('user_quarantine').document(user_id).set({
                        'banned_at': firestore.SERVER_TIMESTAMP,
                        'reason': f'Manual permanent ban: {reason}',
                        'user_id': user_id,
                        'status': 'quarantined',
                        'manual_ban': True
                    })
                penalty_level = 3
                duration = -1
                ban_expires = None
            else:
                # Custom duration ban
                ban_expires = time.time() + duration_seconds
                self.strike_two_users[user_id] = ban_expires
                penalty_level = 2
                duration = duration_seconds

            self.log_security_event(
                'MANUAL_USER_BAN_APPLIED',
                user_id=user_id,
                details={
                    'reason': reason,
                    'duration_seconds': duration,
                    'penalty_level': penalty_level,
                    'ban_expires_at': ban_expires
                }
            )

            if duration == -1:
                logger.warning(f"SECURITY: Manual PERMANENT ban applied to user {user_id}. Reason: {reason}")
            else:
                logger.warning(f"SECURITY: Manual ban applied to user {user_id} for {duration} seconds. Reason: {reason}")
            return True

        except Exception as e:
            logger.error(f"Failed to manually ban user {user_id}: {e}")
            return False

    def unban_user(self, user_id: str, reason: str = "Manual unban") -> bool:
        """
        Manually unban a user (admin function).
        This removes all penalty levels for the user.
        """
        if not user_id:
            return False

        try:
            removed_any = False

            # Remove from Strike 1 (1-hour ban)
            if user_id in self.strike_one_users:
                del self.strike_one_users[user_id]
                removed_any = True

            # Remove from Strike 2 (24-hour ban)
            if user_id in self.strike_two_users:
                del self.strike_two_users[user_id]
                removed_any = True

            # Remove from Strike 3 (permanent quarantine)
            db = self._get_db()
            if db:
                try:
                    quarantine_ref = db.collection('user_quarantine').document(user_id)
                    if quarantine_ref.get().exists:
                        quarantine_ref.delete()
                        removed_any = True
                except Exception as e:
                    logger.error(f"Error removing user {user_id} from quarantine: {e}")

            # Clear breach history to give clean slate
            if user_id in self.rate_limit_breaches:
                self.rate_limit_breaches[user_id].clear()
                # Remove empty deque from dict to prevent memory bloat
                del self.rate_limit_breaches[user_id]
                removed_any = True

            # Clear strike log
            if user_id in self.strike_three_log:
                # Completely remove the user from the strike_three_log
                self.strike_three_log.pop(user_id, None)
                removed_any = True

            if removed_any:
                self.log_security_event(
                    'MANUAL_USER_UNBAN',
                    user_id=user_id,
                    details={'reason': reason}
                )
                logger.info(f"SECURITY: Manual unban applied to user {user_id}. Reason: {reason}")
                return True
            else:
                logger.info(f"SECURITY: Attempted to unban user {user_id} but it had no active penalties")
                return False

        except Exception as e:
            logger.error(f"Failed to unban user {user_id}: {e}")
            return False

    def get_security_statistics(self) -> Dict:
        """
        Get current security monitoring statistics for the USER-BASED three-strikes system.
        """
        current_time = time.time()

        stats = {
            'strike_one_users': len(self.strike_one_users),
            'strike_two_users': len(self.strike_two_users),
            'quarantined_users': 0,
            'active_breach_tracking': len(self.rate_limit_breaches),
            'total_breach_events_last_2min': 0,
            'penalty_details': {
                'strike_one': [],
                'strike_two': [],
                'strike_three': []
            }
        }

        # Count total recent breaches (2 minute window for Strike 1)
        cutoff_2m = current_time - self.STRIKE_ONE_WINDOW
        for user_id, breaches in self.rate_limit_breaches.items():
            # Clean old breaches
            while breaches and breaches[0] < cutoff_2m:
                breaches.popleft()
            stats['total_breach_events_last_2min'] += len(breaches)

        # List Strike 1 Users (1-hour banned)
        for user_id, expires_at in self.strike_one_users.items():
            if current_time < expires_at:
                stats['penalty_details']['strike_one'].append({
                    'user_id': user_id,
                    'expires_at': expires_at,
                    'time_remaining': int(expires_at - current_time)
                })

        # List Strike 2 Users (24-hour banned)
        for user_id, expires_at in self.strike_two_users.items():
            if current_time < expires_at:
                stats['penalty_details']['strike_two'].append({
                    'user_id': user_id,
                    'expires_at': expires_at,
                    'time_remaining': int(expires_at - current_time)
                })

        # Count and list Strike 3 Users (quarantined)
        db = self._get_db()
        if db:
            try:
                quarantine_collection = db.collection('user_quarantine')
                quarantined_docs = quarantine_collection.where('status', '==', 'quarantined').get()

                for doc in quarantined_docs:
                    user_id = doc.id
                    data = doc.to_dict()
                    stats['penalty_details']['strike_three'].append({
                        'user_id': user_id,
                        'banned_at': data.get('banned_at'),
                        'reason': data.get('reason', 'Unknown'),
                        'manual_ban': data.get('manual_ban', False),
                        'ip_at_ban': data.get('ip_at_ban', 'Unknown')
                    })

                stats['quarantined_users'] = len(stats['penalty_details']['strike_three'])

            except Exception as e:
                logger.error(f"Error retrieving quarantine statistics: {e}")
                stats['quarantined_users'] = 'error'

        return stats

    def _get_event_severity(self, event_type: str) -> str:
        """Determine severity level for event type."""
        high_severity = [
            'MASS_ASSIGNMENT_ATTACK', 'BRUTE_FORCE_DETECTED',
            'STORY_BYPASS_ATTEMPT', 'CREDIT_MANIPULATION',
            'TEMP_IP_BAN_APPLIED', 'MANUAL_IP_BAN_APPLIED'
        ]
        medium_severity = [
            'PROMPT_INJECTION_ATTEMPT', 'DOS_ATTEMPT',
            'OPEN_REDIRECT_ATTEMPT', 'RATE_LIMIT_BREACH'
        ]

        if event_type in high_severity:
            return 'HIGH'
        elif event_type in medium_severity:
            return 'MEDIUM'
        else:
            return 'LOW'

    def is_authentication_failure(self, event_type: str, endpoint: str) -> bool:
        """
        Determine if an event represents an authentication failure rather than
        a legitimate rate limit violation. This helps prevent feedback loops
        where auth failures trigger rate limits which trigger more auth failures.
        """
        auth_failure_events = [
            'FAILED_AUTH_ATTEMPT',
            'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
            'BRUTE_FORCE_DETECTED'
        ]

        auth_endpoints = [
            'voice_chat_intent', 'text_chat_intent', 'tts_only_intent',
            'transcribe_route', 'contact_message_route', 'get_user_profile_route',
            'update_user_profile_route', 'accept_terms_route'
        ]

        return event_type in auth_failure_events or endpoint in auth_endpoints

    def separate_auth_failures_from_rate_limits(self, user_id: str, ip_address: str, endpoint: str, event_type: str):
        """
        Enhanced breach detection logic that separates authentication failures
        from legitimate rate limit violations to prevent cascading failures.
        """
        if self.is_authentication_failure(event_type, endpoint):
            # This is an auth failure, not a rate limit violation
            self.log_security_event('AUTH_FAILURE_DETECTED', user_id, ip_address, {
                'endpoint': endpoint,
                'original_event_type': event_type,
                'auth_specific': True
            })
            # Don't escalate auth failures to rate limit penalties
            return False
        else:
            # This is a legitimate rate limit violation
            return True

# Global monitor instance
security_monitor = SecurityMonitor()
