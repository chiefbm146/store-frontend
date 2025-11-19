/**
 * SoundManager.js - Production-Ready Audio System
 *
 * RESPONSIBILITIES:
 * 1. Load and cache all sound files
 * 2. Play sounds with proper error handling and playback detection
 * 3. Manage volume, fade-in effects
 * 4. Detect playback failures and trigger permission UI
 * 5. Support fade-in/out effects
 * 6. Prevent overlapping/concurrent sound issues
 *
 * FEATURES:
 * - Playback detection (knows if sound actually played)
 * - Automatic unlock detection on first successful play
 * - Graceful degradation if audio fails
 * - Fade-in/out support with configurable durations
 * - Sound queue management
 * - Browser compatibility (handles various audio policies)
 *
 * SOUND FILES:
 * - unlock.mp3: Test/unlock sound (plays silently first)
 * - echo-flute-105-107553.mp3: AI response sound
 * - group-drum-hits-149-91681.mp3: UI click sound
 * - button_click.mp3: Legacy send button sound
 */

import audioStateManager from './audioStateManager.js';
import audioPermissionUI from './audioPermissionUI.js';

const soundManager = {
    // ========== STATE ==========
    sounds: {},
    soundQueue: [],
    isProcessingQueue: false,
    masterSpeakerBtn: null,
    fadeIntervals: {}, // Track fade intervals to prevent memory leaks

    // ========== CONFIGURATION ==========
    config: {
        // Sound file definitions
        sounds: {
            unlock: {
                path: '/sounds/unlock.mp3?v=8.0.1',
                volume: 0.001, // Near-silent for unlock detection
                fadeIn: false,
                maxDuration: 1000, // 1 second max
            },
            aiResponse: {
                path: '/sounds/echo-flute-105-107553.mp3?v=8.0.1',
                volume: 0.7,
                fadeIn: true,
                fadeInDuration: 1000, // 1 second fade
            },
            uiClick: {
                path: '/sounds/group-drum-hits-149-91681.mp3?v=8.0.1',
                volume: 0.7,
                fadeIn: true,
                fadeInDuration: 1000,
            },
            sendButton: {
                path: '/button_click.mp3?v=8.0.1',
                volume: 0.5,
                fadeIn: false,
            },
        },

        // Retry configuration
        maxRetries: 2,
        retryDelay: 500, // ms

        // Debugging
        debug: false,
    },

    /**
     * Initialize the sound manager
     * Preload all sounds and set up UI
     */
    init() {
        console.log('🎵 SoundManager initializing...');

        // Initialize UI first
        this.createMasterSpeakerButton();
        this.preloadAllSounds();

        // Listen to audio state changes
        audioStateManager.on('stateChange', (data) => {
            this.updateSpeakerIcon();
        });

        audioStateManager.on('audioUnlocked', () => {
            console.log('✅ Audio unlocked detected by state manager');
            this.updateSpeakerIcon();
        });

        // Initialize permission UI
        audioPermissionUI.init();

        console.log('✓ SoundManager initialized');
    },

    /**
     * Preload all sound files into memory
     * Prevents delays on first play
     */
    preloadAllSounds() {
        Object.entries(this.config.sounds).forEach(([key, config]) => {
            try {
                const audio = new Audio(config.path);
                audio.preload = 'auto';
                audio.volume = config.volume;

                // Add canplay listener for reliability
                audio.addEventListener('canplay', () => {
                    if (this.config.debug) console.log(`✓ Preloaded: ${key}`);
                }, { once: true });

                this.sounds[key] = audio;
            } catch (error) {
                console.error(`❌ Failed to preload sound ${key}:`, error);
            }
        });
    },

    /**
     * Create master speaker button
     * Toggle sound on/off
     */
    createMasterSpeakerButton() {
        const button = document.createElement('button');
        button.id = 'master-speaker-btn';
        button.title = 'Toggle Sound';
        // Note: Inline styles removed - now defined in mobile.css

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSound();
        });

        // Append to the new left container in the header
        const headerLeft = document.getElementById('header-left-container');
        if (headerLeft) {
            headerLeft.appendChild(button);
        } else {
            document.body.appendChild(button); // Keep fallback
        }

        this.masterSpeakerBtn = button;
        this.updateSpeakerIcon();
    },

    /**
     * Toggle sound on/off
     */
    async toggleSound() {
        const newState = !audioStateManager.state.isAudioEnabled;

        if (newState) {
            // Turning sound ON - attempt to unlock
            audioStateManager.setAudioEnabled(true, 'speaker-button-click');
            await this.attemptAudioUnlock();
        } else {
            // Turning sound OFF - just disable
            audioStateManager.setAudioEnabled(false, 'speaker-button-click');
            this.stopAllSounds();
        }

        this.updateSpeakerIcon();
    },

    /**
     * Update speaker button icon based on state
     */
    updateSpeakerIcon() {
        if (!this.masterSpeakerBtn) return;

        const isEnabled = audioStateManager.state.isAudioEnabled;
        this.masterSpeakerBtn.innerHTML = isEnabled ? '🔊' : '🔇';

        if (isEnabled) {
            // When sound is ON: white background, blue icon
            this.masterSpeakerBtn.style.background = 'white';
            this.masterSpeakerBtn.style.color = '#1E90FF';
        } else {
            // When sound is OFF: white background, blue icon
            this.masterSpeakerBtn.style.background = 'white';
            this.masterSpeakerBtn.style.color = '#1E90FF';
        }
    },

    /**
     * Attempt to unlock audio context
     * This is the critical function that detects if browser allows audio
     */
    async attemptAudioUnlock() {
        if (audioStateManager.state.isAudioUnlocked) {
            if (this.config.debug) console.log('✓ Audio already unlocked');
            return true;
        }

        console.log('🔓 Attempting to unlock audio...');

        try {
            const testAudio = this.sounds.unlock;
            if (!testAudio) {
                throw new Error('Unlock sound not loaded');
            }

            // Reset and play
            testAudio.currentTime = 0;
            const playPromise = testAudio.play();

            // Use the playback promise to detect success
            await playPromise;

            // If we get here, playback succeeded
            console.log('✅ Audio unlock successful - playback allowed');
            audioStateManager.unlockAudio();
            return true;
        } catch (error) {
            console.warn('⚠️ Audio unlock failed:', error.message);

            // Playback was blocked - show permission UI
            await audioStateManager.requestAudioPermission();
            return false;
        }
    },

    /**
     * Play a sound with automatic retry and unlock detection
     *
     * @param {string} type - Sound type (unlock, aiResponse, uiClick, sendButton)
     * @param {object} options - { fadeIn: boolean, retries: number }
     */
    async playSound(type, options = {}) {
        // Check if audio is enabled
        if (!audioStateManager.state.isAudioEnabled) {
            if (this.config.debug) console.log(`⏸️  Skipping ${type} - audio disabled`);
            return false;
        }

        // Queue the sound if currently processing
        if (this.isProcessingQueue) {
            this.soundQueue.push({ type, options });
            return; // Will be processed when queue finishes
        }

        this.isProcessingQueue = true;

        try {
            // Check if audio is unlocked; if not, attempt unlock first
            if (!audioStateManager.state.isAudioUnlocked) {
                console.log(`🔓 Audio not unlocked yet, attempting unlock for ${type}...`);
                const unlocked = await this.attemptAudioUnlock();
                if (!unlocked) {
                    console.log(`❌ Audio unlock failed, cannot play ${type}`);
                    this.isProcessingQueue = false;
                    this.processQueue();
                    return false;
                }
            }

            // Get sound config
            const soundConfig = this.config.sounds[type];
            if (!soundConfig) {
                console.warn(`⚠️ Unknown sound type: ${type}`);
                this.isProcessingQueue = false;
                this.processQueue();
                return false;
            }

            // Get audio element
            const audio = this.sounds[type];
            if (!audio) {
                console.warn(`⚠️ Sound not preloaded: ${type}`);
                this.isProcessingQueue = false;
                this.processQueue();
                return false;
            }

            // Reset audio element
            audio.currentTime = 0;

            // Determine if should fade in
            const shouldFadeIn = options.fadeIn !== undefined ? options.fadeIn : soundConfig.fadeIn;

            // Set up audio
            if (shouldFadeIn) {
                audio.volume = 0;
            } else {
                audio.volume = soundConfig.volume;
            }

            // Play with retry logic
            const playResult = await this.playWithRetry(audio, type, soundConfig, shouldFadeIn);

            if (playResult && shouldFadeIn) {
                this.fadeIn(audio, soundConfig);
            }

            this.isProcessingQueue = false;
            this.processQueue();
            return playResult;
        } catch (error) {
            console.error(`❌ Error playing sound ${type}:`, error);
            this.isProcessingQueue = false;
            this.processQueue();
            return false;
        }
    },

    /**
     * Play audio with retry logic
     * Handles browser playback restrictions
     */
    async playWithRetry(audio, type, config, shouldFadeIn, attempt = 0) {
        try {
            const playPromise = audio.play();
            await playPromise;

            console.log(`✅ ${type} played successfully (attempt ${attempt + 1})`);
            return true;
        } catch (error) {
            console.warn(`⚠️ Playback failed for ${type} (attempt ${attempt + 1}):`, error.message);

            // Check if it's a NotAllowedError (browser blocked it)
            if (error.name === 'NotAllowedError') {
                if (attempt < this.config.maxRetries) {
                    // Retry after delay
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                    return this.playWithRetry(audio, type, config, shouldFadeIn, attempt + 1);
                } else {
                    // Mark audio as locked
                    console.error(`❌ Audio permanently blocked after ${this.config.maxRetries} retries`);
                    audioStateManager.lockAudio();
                    return false;
                }
            }

            return false;
        }
    },

    /**
     * Fade in a sound from 0 to its configured volume
     */
    fadeIn(audio, config) {
        const fadeInDuration = config.fadeInDuration || 1000;
        const targetVolume = config.volume;
        const steps = 20; // Number of steps in fade
        const stepDuration = fadeInDuration / steps;
        const volumeIncrement = targetVolume / steps;

        let currentStep = 0;

        // Clear any existing fade interval for this audio
        const audioKey = Object.keys(this.sounds).find(k => this.sounds[k] === audio);
        if (this.fadeIntervals[audioKey]) {
            clearInterval(this.fadeIntervals[audioKey]);
        }

        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.min(volumeIncrement * currentStep, targetVolume);

            if (currentStep >= steps) {
                audio.volume = targetVolume;
                clearInterval(fadeInterval);
                if (audioKey) delete this.fadeIntervals[audioKey];
            }
        }, stepDuration);

        if (audioKey) {
            this.fadeIntervals[audioKey] = fadeInterval;
        }
    },

    /**
     * Stop all currently playing sounds
     */
    stopAllSounds() {
        Object.values(this.sounds).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // Clear all fade intervals
        Object.values(this.fadeIntervals).forEach(interval => {
            clearInterval(interval);
        });
        this.fadeIntervals = {};
    },

    /**
     * Process queued sounds
     */
    processQueue() {
        if (this.soundQueue.length === 0) return;

        const { type, options } = this.soundQueue.shift();
        this.playSound(type, options);
    },
};

// Expose audioPermissionUI globally for TTS unlock flow
window.audioPermissionUI = audioPermissionUI;

export default soundManager;
