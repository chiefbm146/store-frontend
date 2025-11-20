// public/js/tts-manager.js

import audioStateManager from './audioStateManager.js';

const ttsManager = {
    ttsPlayer: null,
    ttsButton: null,
    audioCache: {}, // Session-level cache for audio
    lastAiText: null,
    isPlaying: false,
    onPlaybackEnded: null, // Callback for when audio ends
    ttsUnlockedForSession: false, // Track if TTS audio context is unlocked for this session

    init(playerElement, buttonElement, onPlaybackEnded = null) {
        this.ttsPlayer = playerElement;
        this.ttsButton = buttonElement;
        this.onPlaybackEnded = onPlaybackEnded;

        // ALWAYS start as locked on page load - NO sessionStorage persistence
        // User must unlock fresh every time they enter the site
        this.ttsUnlockedForSession = false;

        // Listen to audio events to update button state
        if (this.ttsPlayer) {
            this.ttsPlayer.addEventListener('play', () => this.updateButtonState('playing'));
            this.ttsPlayer.addEventListener('pause', () => this.updateButtonState('paused'));
            this.ttsPlayer.addEventListener('ended', () => {
                this.updateButtonState('paused');
                this.isPlaying = false;
                if (this.onPlaybackEnded) {
                    this.onPlaybackEnded();
                }
            });
        }

        console.log("[TTS Manager] Initialized. TTS locked until user unlocks it.");
    },

    /**
     * Attempts to unlock the TTS audio context with a user gesture.
     * This plays a silent sound to satisfy browser autoplay policies.
     * @returns {Promise<boolean>} Resolves true if unlock was successful, false otherwise.
     */
    async attemptTTSUnlock() {
        if (this.ttsUnlockedForSession) {
            console.log('[TTS Manager] TTS already unlocked for session.');
            return true;
        }

        console.log('[TTS Manager] Attempting to unlock TTS audio context...');

        // Show the modal directly (bypass audioStateManager's isAudioUnlocked check)
        // TTS should have its own unlock modal regardless of global audio state
        if (window.audioPermissionUI) {
            console.log('[TTS Manager] Showing audio permission modal...');
            window.audioPermissionUI.show();
        }

        // Wait for user to interact with the modal
        return new Promise((resolve) => {
            console.log('[TTS Manager] Waiting for user interaction with modal...');
            window.__audioPermissionResolver = (result) => {
                this.ttsUnlockedForSession = true;
                console.log('[TTS Manager] ✅ TTS unlocked for session!');
                resolve(true);
            };
        });
    },

    async getAudio(text, backendUrl) {
        this.lastAiText = text;

        // Check cache first
        if (this.audioCache[text]) {
            console.log("TTS: Playing from cache.");
            return this.audioCache[text]; // Return cached audio
        }

        // Generate new audio from backend
        console.log("TTS: Generating new audio from backend.");
        try {
            const response = await fetch(`${backendUrl}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("TTS generation failed:", errorData.error);
                return null;
            }

            const data = await response.json();
            if (data.audio) {
                this.audioCache[text] = data.audio; // Store in cache
                console.log("TTS: Audio cached for future playback.");
                return data.audio;
            }
            return null;
        } catch (error) {
            console.error("TTS generation request failed:", error);
            return null;
        }
    },

    play(audioBase64) {
        if (!this.ttsPlayer || !audioBase64) return;

        // If not unlocked, explicitly prevent play here as a safeguard
        if (!this.ttsUnlockedForSession) {
            console.warn('[TTS Manager] Cannot play TTS: context not unlocked. Call attemptTTSUnlock first.');
            return;
        }

        this.ttsPlayer.src = `data:audio/mp3;base64,${audioBase64}`;
        this.ttsPlayer.currentTime = 0;
        this.ttsPlayer.play().catch(e => console.error("Playback error", e));
        this.isPlaying = true;
        this.updateButtonState('playing');
    },

    stop() {
        if (!this.ttsPlayer) return;

        this.ttsPlayer.pause();
        this.ttsPlayer.currentTime = 0;
        this.isPlaying = false;
        this.updateButtonState('paused');
    },

    updateButtonState(state) {
        if (!this.ttsButton) return;

        const icon = this.ttsButton.querySelector('i');
        if (!icon) return;

        this.ttsButton.classList.remove('loading', 'playing');
        icon.className = 'fas'; // Reset classes

        if (state === 'loading') {
            this.ttsButton.classList.add('loading');
            icon.classList.add('fa-spinner');
        } else if (state === 'playing') {
            this.ttsButton.classList.add('playing');
            icon.classList.add('fa-pause');
        } else { // paused or idle
            icon.classList.add('fa-volume-up');
        }
    },

    /**
     * Shows a temporary toast notification.
     * @param {string} message The message to display.
     * @param {number} duration The duration in milliseconds.
     */
    showToast(message, duration = 5000) {
        console.log('[TTS Manager] Showing toast:', message);
        const toastId = 'tts-toast-notification';
        let toast = document.getElementById(toastId);

        if (!toast) {
            toast = document.createElement('div');
            toast.id = toastId;
            toast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(30, 144, 255, 0.95);
                color: white;
                padding: 20px 40px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                z-index: 1000000;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                pointer-events: none;
                white-space: nowrap;
                text-align: center;
            `;
            document.body.appendChild(toast);
            console.log('[TTS Manager] Toast element created and added to DOM');
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        console.log('[TTS Manager] Toast made visible');

        setTimeout(() => {
            toast.style.opacity = '0';
            console.log('[TTS Manager] Toast fading out');
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                    console.log('[TTS Manager] Toast removed from DOM');
                }
            }, 300);
        }, duration);
    }
};

export default ttsManager;
