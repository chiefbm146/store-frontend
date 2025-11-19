/**
 * AudioPermissionUI.js - Production-Ready Audio Permission Modal
 *
 * RESPONSIBILITIES:
 * 1. Display elegant centered modal when audio is blocked
 * 2. Allow user to enable audio with visual feedback
 * 3. Allow user to dismiss/deny with X button (no forced opt-in)
 * 4. Prevent multiple modals from appearing
 * 5. Integrate with audioStateManager for state updates
 * 6. Handle various browser audio policies
 *
 * DESIGN:
 * - Centered, modern modal design
 * - Dark semi-transparent backdrop
 * - X button for dismissal (respects user choice)
 * - Play test sound on enable click
 * - Smooth animations
 */

import audioStateManager from './audioStateManager.js';

const audioPermissionUI = {
    isVisible: false,
    currentModal: null,
    currentBackdrop: null,

    /**
     * Initialize the permission UI system
     */
    init() {
        console.log('🎨 AudioPermissionUI initializing...');

        // Listen for permission request events
        audioStateManager.on('permissionRequested', () => {
            this.show();
        });

        // Listen for audio unlock events
        audioStateManager.on('audioUnlocked', () => {
            this.hide();
        });
    },

    /**
     * Show the audio permission modal
     */
    show() {
        if (this.isVisible) return; // Prevent duplicate modals

        console.log('📺 Showing audio permission modal');
        this.isVisible = true;

        // Create backdrop
        this.currentBackdrop = document.createElement('div');
        this.currentBackdrop.id = 'audio-permission-backdrop';
        this.currentBackdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease-out;
        `;

        // Create modal container
        this.currentModal = document.createElement('div');
        this.currentModal.id = 'audio-permission-modal';
        this.currentModal.style.cssText = `
            background: linear-gradient(135deg, #FFFFFF 0%, #FFFBF8 100%);
            border-radius: 16px;
            padding: 32px;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            position: relative;
            animation: slideUp 0.3s ease-out;
            border: 2px solid #D4C4B8;
        `;

        // Create close button (X)
        const closeBtn = document.createElement('button');
        closeBtn.id = 'audio-permission-close';
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            font-size: 28px;
            color: #666;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            padding: 0;
            border-radius: 50%;
        `;

        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.05)';
            closeBtn.style.color = '#333';
        };

        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'transparent';
            closeBtn.style.color = '#666';
        };

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDeny();
        });

        // Create title
        const title = document.createElement('h2');
        title.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: -0.3px;
        `;
        title.textContent = '🔊 Unlock the Voice';

        // Create description
        const description = document.createElement('p');
        description.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 15px;
            color: #666;
            line-height: 1.6;
            letter-spacing: 0.3px;
        `;
        description.textContent = 'Enable audio to hear our guide speak. Listen to the wisdom shared on this journey of reconciliation.';

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            margin-top: 28px;
            flex-direction: row;
        `;

        // Create enable button
        const enableBtn = document.createElement('button');
        enableBtn.id = 'audio-permission-enable';
        enableBtn.innerHTML = '🔊 Enable Voice';
        enableBtn.style.cssText = `
            flex: 1;
            padding: 12px 24px;
            background: linear-gradient(135deg, #1E90FF 0%, #0047AB 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
        `;

        enableBtn.onmouseover = () => {
            enableBtn.style.transform = 'translateY(-2px)';
            enableBtn.style.boxShadow = '0 6px 20px rgba(30, 144, 255, 0.4)';
        };

        enableBtn.onmouseout = () => {
            enableBtn.style.transform = 'translateY(0)';
            enableBtn.style.boxShadow = '0 4px 12px rgba(30, 144, 255, 0.3)';
        };

        enableBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleEnable();
        });

        // Assemble modal
        buttonContainer.appendChild(enableBtn);
        this.currentModal.appendChild(closeBtn);
        this.currentModal.appendChild(title);
        this.currentModal.appendChild(description);
        this.currentModal.appendChild(buttonContainer);

        // Add backdrop and modal to page
        this.currentBackdrop.appendChild(this.currentModal);
        document.body.appendChild(this.currentBackdrop);

        // Add animations
        this.addAnimations();

        // Close on backdrop click
        this.currentBackdrop.addEventListener('click', (e) => {
            if (e.target === this.currentBackdrop) {
                this.handleDeny();
            }
        });
    },

    /**
     * Add CSS animations
     */
    addAnimations() {
        const styleId = 'audio-permission-animations';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },

    /**
     * Hide the audio permission modal
     */
    hide() {
        if (!this.isVisible) return;

        console.log('🙈 Hiding audio permission modal');
        this.isVisible = false;

        if (this.currentBackdrop) {
            this.currentBackdrop.style.animation = 'fadeIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (this.currentBackdrop && this.currentBackdrop.parentNode) {
                    this.currentBackdrop.remove();
                }
                this.currentBackdrop = null;
                this.currentModal = null;
            }, 300);
        }
    },

    /**
     * Handle enable button click
     * Attempts to play test sound and unlock audio
     */
    async handleEnable() {
        console.log('🎵 User clicked enable audio');

        const enableBtn = document.getElementById('audio-permission-enable');
        if (enableBtn) {
            enableBtn.disabled = true;
            enableBtn.style.opacity = '0.7';
            enableBtn.innerHTML = '⏳ Unlocking...';
        }

        try {
            // Play test sound
            const testAudio = new Audio('/sounds/unlock.mp3?v=8.0.1');
            testAudio.volume = 0.5;

            await testAudio.play();

            console.log('✅ Test sound played successfully');

            // Update state manager
            audioStateManager.grantAudioPermission();

            // Hide modal
            this.hide();

            if (window.__audioPermissionResolver) {
                window.__audioPermissionResolver(true);
                delete window.__audioPermissionResolver;
            }
        } catch (error) {
            console.error('❌ Failed to play test sound:', error);

            if (enableBtn) {
                enableBtn.disabled = false;
                enableBtn.style.opacity = '1';
                enableBtn.innerHTML = '🔊 Enable Voice';
            }

            // Show error message
            const modal = document.getElementById('audio-permission-modal');
            if (modal) {
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    margin-top: 16px;
                    padding: 12px;
                    background: #ffebee;
                    border-left: 4px solid #f44336;
                    color: #c62828;
                    border-radius: 4px;
                    font-size: 13px;
                    text-align: left;
                `;
                errorMsg.textContent = 'Audio is still blocked. Please check your browser settings.';
                modal.appendChild(errorMsg);
            }
        }
    },

    /**
     * Handle close/deny button click
     * User explicitly denies audio
     */
    handleDeny() {
        console.log('❌ User denied audio permission');

        audioStateManager.denyAudioPermission();
        this.hide();

        if (window.__audioPermissionResolver) {
            window.__audioPermissionResolver(false);
            delete window.__audioPermissionResolver;
        }
    },
};

export default audioPermissionUI;
