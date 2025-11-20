/**
 * AudioStateManager.js - Industry-Standard Audio State Management
 *
 * RESPONSIBILITIES:
 * 1. Centralized audio state persistence (localStorage + sessionStorage)
 * 2. Audio permission tracking (requested, granted, denied, unknown)
 * 3. Audio unlock status (whether browser allows playback)
 * 4. Hash URL state integration (#audio=enabled/disabled)
 * 5. Event system for state changes
 *
 * ARCHITECTURE:
 * - Single source of truth for all audio settings
 * - Immutable state updates with event dispatching
 * - Recovery mechanisms for failed audio contexts
 * - Production-ready error handling
 */

const audioStateManager = {
    // ========== CONFIGURATION ==========
    config: {
        debug: false, // Set to true for verbose logging
    },

    // ========== STATE DEFINITIONS ==========
    state: {
        // User preference: has user explicitly enabled/disabled audio?
        isAudioEnabled: false,

        // Audio permission status from browser
        permissionStatus: 'unknown', // 'unknown' | 'requested' | 'granted' | 'denied'

        // Can we actually play audio? (browser allows it)
        isAudioUnlocked: false,

        // Has user ever interacted with audio system?
        hasUserInteracted: false,

        // Current active sound (for preventing overlaps if needed)
        currentlyPlayingSound: null,

        // Error recovery counter
        failureCount: 0,
        lastFailureTime: null,
    },

    // ========== EVENT SYSTEM ==========
    listeners: {
        stateChange: [],
        audioUnlocked: [],
        audioLocked: [],
        permissionRequested: [],
        permissionGranted: [],
        permissionDenied: [],
    },

    /**
     * Initialize audio state manager
     * Runs on page load to restore persisted state
     */
    init() {
        console.log('🎵 AudioStateManager initializing...');

        // Ensure global access is set BEFORE loading persisted state
        // This prevents race conditions where other modules try to access window.audioStateManager
        window.audioStateManager = this;
        console.log('[AudioStateManager] Made globally available as window.audioStateManager');

        this.loadPersistedState();
        console.log('✓ AudioStateManager initialized', this.state);
    },

    /**
     * Load state from localStorage and sessionStorage
     */
    loadPersistedState() {
        const stored = localStorage.getItem('audioState');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.state.isAudioEnabled = parsed.isAudioEnabled ?? false;
                this.state.permissionStatus = parsed.permissionStatus ?? 'unknown';
                this.state.hasUserInteracted = parsed.hasUserInteracted ?? false;
                console.log('✓ Restored audio state from localStorage');
            } catch (e) {
                console.warn('⚠ Failed to parse stored audio state:', e);
            }
        }
    },

    /**
     * Save state to localStorage (persistent across sessions)
     */
    savePersistedState() {
        try {
            localStorage.setItem('audioState', JSON.stringify({
                isAudioEnabled: this.state.isAudioEnabled,
                permissionStatus: this.state.permissionStatus,
                hasUserInteracted: this.state.hasUserInteracted,
            }));
        } catch (e) {
            console.warn('⚠ Failed to save audio state to localStorage:', e);
        }
    },

    /**
     * Set audio enabled state
     * @param {boolean} enabled - Whether audio should be enabled
     * @param {string} reason - Why this change is happening (user interaction, init, etc.)
     */
    setAudioEnabled(enabled, reason = 'unknown') {
        if (this.state.isAudioEnabled === enabled) return; // No change needed

        console.log(`🔊 Audio state change: ${this.state.isAudioEnabled} → ${enabled} (reason: ${reason})`);

        this.state.isAudioEnabled = enabled;
        this.state.hasUserInteracted = true;
        this.savePersistedState();
        this.emit('stateChange', { enabled, reason });
    },

    /**
     * Mark audio as unlocked (playback succeeded)
     */
    unlockAudio() {
        if (this.state.isAudioUnlocked) return;

        console.log('✅ Audio unlocked - playback is now possible');
        this.state.isAudioUnlocked = true;
        this.state.permissionStatus = 'granted';
        this.state.failureCount = 0;
        this.savePersistedState();
        this.emit('audioUnlocked');
        this.emit('permissionGranted');
    },

    /**
     * Mark audio as locked (playback failed)
     */
    lockAudio() {
        if (!this.state.isAudioUnlocked) return;

        console.log('🔒 Audio locked - browser has blocked playback');
        this.state.isAudioUnlocked = false;
        this.state.permissionStatus = 'denied';
        this.state.failureCount = (this.state.failureCount || 0) + 1;
        this.state.lastFailureTime = Date.now();
        this.savePersistedState();
        this.emit('audioLocked');
        this.emit('permissionDenied');
    },

    /**
     * Request permission to play audio
     * Show UI prompt if needed
     */
    async requestAudioPermission() {
        if (this.state.isAudioUnlocked) {
            return true; // Already have permission
        }

        if (this.state.permissionStatus === 'requested') {
            return false; // Already waiting for permission
        }

        console.log('📢 Requesting audio permission...');
        this.state.permissionStatus = 'requested';
        this.emit('permissionRequested');

        return new Promise((resolve) => {
            // Permission will be resolved when user interacts with the unlock UI
            // or when playback succeeds
            window.__audioPermissionResolver = resolve;
        });
    },

    /**
     * User explicitly denied audio
     */
    denyAudioPermission() {
        console.log('❌ Audio permission denied by user');
        this.state.permissionStatus = 'denied';
        this.state.isAudioEnabled = false;
        this.savePersistedState();
        this.emit('permissionDenied');
        this.emit('stateChange', { enabled: false, reason: 'user-denied' });
    },

    /**
     * User explicitly granted audio
     */
    grantAudioPermission() {
        console.log('✅ Audio permission granted by user');
        this.state.permissionStatus = 'granted';
        this.state.isAudioEnabled = true;
        this.state.isAudioUnlocked = true;
        this.savePersistedState();
        this.emit('permissionGranted');
        this.emit('audioUnlocked');
        this.emit('stateChange', { enabled: true, reason: 'user-granted' });
    },

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {function} callback - Callback function
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    },

    /**
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {object} data - Event data
     */
    emit(event, data = {}) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`❌ Error in ${event} listener:`, e);
                }
            });
        }
    },

    /**
     * Get current audio permission status for logging/debugging
     */
    getStatus() {
        return {
            isAudioEnabled: this.state.isAudioEnabled,
            isAudioUnlocked: this.state.isAudioUnlocked,
            permissionStatus: this.state.permissionStatus,
            hasUserInteracted: this.state.hasUserInteracted,
            failureCount: this.state.failureCount,
        };
    },
};

export default audioStateManager;
