// public/js/portal-controller.js
// Main portal controller with Jarvis UI module support

import portalStore from './portal-store.js';
import appStore from './app-store.js';
import ttsManager from './tts-manager.js';
import JarvisUIManager from './jarvis-ui-manager.js';
import conversationIntelligence from './conversation-intelligence-store.js';
import smartMessageRenderer from './smart-message-renderer.js';
import cartStore from './cart-store.js';
import moduleManager from './module-manager.js';
import soundManager from './soundManager.js';
import audioStateManager from './audioStateManager.js';
import hamburgerMenu from './hamburger-menu.js';

// NEW: Import the preloader and config system
import assetPreloader from './asset-preloader.js';
import { settings, brand, getPreloadImages } from './config/index.js';
import WaterBackground from './water.js';
import TextAnimator from './text_animator.js';

const UI = {}; // Cache for DOM elements
let welcomeMessageRendered = false; // Guard to ensure welcome message is only created once
const BACKEND_URL = settings.backend.aiChatUrl; // From config system
const messageAudioCache = {}; // Local cache for message audio
let sessionId = null; // Will hold the current session ID
let ttsFirstUnlocked = false; // Track if this is the first TTS unlock (for big glow animation)

// === SHARED 3D ASSETS (v2 - Unified Render Loop) ===
// Load the model once, clone many times - prevents WebGL context exhaustion on mobile
const shared3D = {
    gltfLoader: new THREE.GLTFLoader(),
    loadedModel: null,
    animations: [],
    instances: [], // Array to hold all logo instances
    clock: new THREE.Clock(), // A single, global clock
    renderLoopPaused: false // <<< ADD THIS FLAG - Pause during critical DOM updates
};

// === DEVICE DETECTOR INTEGRATION ===
let deviceFingerprint = 'unknown'; // Will hold the device fingerprint
let deviceDetectorInstance = null; // Will hold the DeviceDetector instance

// === FINGERPRINT SIGNATURE CACHING (Layer 6: Security) ===
let fingerprintSignatureCache = {
    signature: null,
    timestamp: null,
    expiresAt: null
};

/**
 * Get or create a fingerprint signature with caching.
 * Signatures are cached for 2 minutes to avoid per-request overhead.
 * This reduces latency from 100-200ms to <1ms for cached signatures.
 */
async function getFingerprintSignatureWithCache() {
    const now = Date.now();

    // Return cached signature if still valid (within 2-minute window)
    if (fingerprintSignatureCache.signature &&
        fingerprintSignatureCache.expiresAt &&
        now < fingerprintSignatureCache.expiresAt) {
        console.log('✓ Using cached fingerprint signature (expires in', Math.round((fingerprintSignatureCache.expiresAt - now) / 1000), 's)');
        return {
            signature: fingerprintSignatureCache.signature,
            timestamp: fingerprintSignatureCache.timestamp
        };
    }

    try {
        console.log('🔐 Requesting new fingerprint signature from backend...');
        const response = await fetch(`${BACKEND_URL}/sign-fingerprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_fingerprint: deviceFingerprint
            })
        });

        if (!response.ok) {
            console.warn('⚠ Signature request failed (HTTP', response.status + '), continuing without signature');
            return { signature: null, timestamp: null };
        }

        const data = await response.json();

        // Cache the signature for 2 minutes (120 seconds)
        fingerprintSignatureCache.signature = data.signature;
        fingerprintSignatureCache.timestamp = data.timestamp;
        fingerprintSignatureCache.expiresAt = now + (2 * 60 * 1000); // 2 minutes

        console.log('✓ New fingerprint signature cached (expires in 2 minutes)');
        return {
            signature: data.signature,
            timestamp: data.timestamp
        };

    } catch (error) {
        console.error('❌ Failed to get fingerprint signature:', error);
        // Fail-open: continue without signature (Layer 6 validation is optional)
        return { signature: null, timestamp: null };
    }
}

/**
 * Get or create a session ID for this browser tab.
 * ALWAYS creates a fresh session on page load.
 * Each page load = new conversation.
 */
function getSessionId() {
    if (sessionId) return sessionId;

    // Always create a NEW session ID on first call (page load)
    // Don't try to reuse old sessionStorage values
    sessionId = 'session_' + crypto.randomUUID();
    sessionStorage.setItem('moonTideSessionId', sessionId);
    console.log(`🚀 New chat session started. ID: ${sessionId}`);
    return sessionId;
}

/**
 * Initialize DeviceDetector and capture device fingerprint.
 * This runs asynchronously on page load to build a multi-signal device identifier.
 * Fingerprint includes: form factor, screen dimensions, pixel density, device capabilities.
 */
async function initializeDeviceDetector() {
    try {
        // Check if DeviceDetector is available globally
        if (typeof window.DeviceDetector === 'undefined') {
            console.warn('⚠ DeviceDetector not loaded. Using fallback fingerprint.');
            deviceFingerprint = 'unknown';
            return;
        }

        const detector = new window.DeviceDetector({ debug: false });
        deviceDetectorInstance = detector;

        // Initialize and wait for detection
        await detector.init();

        // Capture device information
        const deviceInfo = detector.getDeviceInfo();
        const formFactor = deviceInfo.formFactor || 'unknown';
        const screenWidth = deviceInfo.metrics?.screen?.width || window.screen.width;
        const screenHeight = deviceInfo.metrics?.screen?.height || window.screen.height;
        const pixelDensity = (deviceInfo.metrics?.pixelDensity || window.devicePixelRatio || 1).toFixed(1);

        // Create device signature: "desktop_1920x1080_1.0" or "mobile_375x812_2.0"
        deviceFingerprint = `${formFactor}_${screenWidth}x${screenHeight}_${pixelDensity}`;

        console.log(`✓ Device fingerprint ready: ${deviceFingerprint}`);
        console.log(`  Form Factor: ${formFactor}, Screen: ${screenWidth}x${screenHeight}, Density: ${pixelDensity}`);

    } catch (error) {
        console.error(`❌ DeviceDetector initialization failed: ${error.message}`);
        deviceFingerprint = 'error';
    }
}

/**
 * Initialize shared 3D assets on app startup
 * Loads the 3D model once and stores it for fast cloning on each message
 * This prevents WebGL context exhaustion on mobile
 */
async function initializeShared3DAssets() {
    console.log("🚀 Initializing Shared 3D Assets (One-Time Load)...");
    try {
        const modelPath = settings.threeD.mainLogoModel + '?v=' + settings.version; // From config
        const gltf = await shared3D.gltfLoader.loadAsync(modelPath);
        shared3D.loadedModel = gltf.scene;
        shared3D.animations = gltf.animations;
        console.log("✅ 3D model pre-loaded successfully from:", modelPath);

        // --- START THE SINGLE, GLOBAL RENDER LOOP ---
        function globalAnimateLoop() {
            requestAnimationFrame(globalAnimateLoop);
            if (shared3D.renderLoopPaused) { // <<< ADD THIS CHECK
                return; // Skip rendering if paused
            }
            const delta = shared3D.clock.getDelta();
            for (const instance of shared3D.instances) {
                if (instance.mixer) {
                    instance.mixer.update(delta);
                }
                instance.renderer.render(instance.scene, instance.camera);
            }
        }
        globalAnimateLoop();
        console.log("✅ Global 3D render loop started.");
        // --- END SINGLE RENDER LOOP ---

    } catch (error) {
        console.error("❌ CRITICAL: Failed to pre-load 3D Moon model.", error);
    }
}

/**
 * === 3D MOON LOGO RENDERING ===
 * Creates a 3D spinning moon logo for each AI message (top-left, outside bubble)
 * Uses cloning of pre-loaded model for performance
 */

/**
 * Create a 3D logo renderer for a single message (High-Performance Cloning Version)
 * Returns a container div with embedded Three.js canvas
 *
 * PERFORMANCE OPTIMIZATION:
 * - Pre-loaded model is cloned (extremely fast)
 * - No model loading on each message
 * - Prevents WebGL context exhaustion on mobile
 * - Uses fixed camera + scaled model for guaranteed visibility
 */
function create3dLogoForMessage() {
    if (!shared3D.loadedModel) return document.createElement('div');

    const container = document.createElement('div');
    container.className = 'ai-message-logo-container';
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(50, 50);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 150;
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const modelInstance = shared3D.loadedModel.clone();
    const box = new THREE.Box3().setFromObject(modelInstance);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 80 / maxDim;
    modelInstance.scale.set(scale, scale, scale);
    scene.add(modelInstance);

    const mixer = new THREE.AnimationMixer(modelInstance);
    if (shared3D.animations && shared3D.animations.length > 0) {
        shared3D.animations.forEach(clip => mixer.clipAction(clip).play());
    }

    // --- THE FIX: Add to global render queue instead of starting independent loop ---
    // This prevents WebGL context exhaustion on mobile by using a single, unified render loop
    shared3D.instances.push({ scene, camera, renderer, mixer });

    return container;
}

class PortalController {
    constructor() {
        this.isInitialized = false;
        this.wakeupPingSent = false;
        this.jarvisManager = null;
    }

    async init(skipRender = false) {
        console.log("🌊 Portal Controller Initializing (v.FINAL)...");
        this.isInitialized = true;

        // Initialize audio state (it might have been initialized by the loader, this is safe)
        audioStateManager.init();

        await initializeShared3DAssets();
        cacheDOMElements();

        soundManager.init();
        hamburgerMenu.init();
        setupEventListeners();
        initializeCart();
        initFloatingCartButton();

        console.log("Initializing DeviceDetector for fingerprinting...");
        await initializeDeviceDetector();

        this.jarvisManager = new JarvisUIManager();
        this.jarvisManager.init();
        window.jarvisManager = this.jarvisManager;
        window.smartMessageRenderer = smartMessageRenderer;
        window.conversationIntelligence = conversationIntelligence;
        window.getSessionId = getSessionId;
        window.cartStore = cartStore;
        window.deviceFingerprint = deviceFingerprint;

        window.addEventListener('portal-state-changed', () => render().catch(e => console.error('Render error:', e)));

        // Check for and handle URL hash fragments (deep linking to modules)
        this.handleUrlHash();

        if (!this.wakeupPingSent) {
            console.log("Sending wake-up ping to backend...");
            fetch(`${BACKEND_URL}/wakeup`)
                .then(res => res.json())
                .then(data => console.log("✓ Backend is awake:", data.status))
                .catch(err => console.error("Wake-up ping failed:", err));
            this.wakeupPingSent = true;
        }

        // Initialize asset preloader with images from config system
        assetPreloader.init(getPreloadImages());

        // The intro loader sequence is now complete (handled by index.html).
        // The app UI is already visible, so we can proceed directly to rendering the first message.
        console.log("[PortalController] UI is visible. Rendering initial welcome message.");
        if (!skipRender) {
            render().catch(e => console.error('Render error:', e));
        }

        // Initialize the water background after intro loader is gone
        const waterContainer = document.getElementById('water-background-container');
        if (waterContainer) {
            WaterBackground.init(waterContainer);
            console.log("[PortalController] Water background initialized.");
        } else {
            console.warn("[PortalController] Water background container not found. Skipping initialization.");
        }
    }

    /**
     * Checks the URL for a hash fragment and triggers the corresponding action.
     * This acts as a simple router for deep-linking into modules.
     * Used by privacy policy and other external links to open specific UI modules.
     */
    handleUrlHash() {
        const hash = window.location.hash.substring(1); // Get hash without the '#'
        if (hash) {
            console.log(`[Router] Found URL hash: #${hash}. Attempting to load action.`);

            // We can create a mapping for different hashes in the future.
            // For now, we support SHOW_DELETE_DATA from the privacy policy.
            if (hash === 'SHOW_DELETE_DATA') {
                if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
                    // Use a small timeout to ensure the rest of the UI has settled
                    // before trying to open a module over it.
                    setTimeout(() => {
                        console.log(`[Router] Triggering action 'SHOW_DELETE_DATA' from URL hash.`);
                        window.jarvisManager.loadAction('SHOW_DELETE_DATA');
                    }, 500); // 500ms delay is usually enough for UI to settle
                } else {
                    console.error("[Router] jarvisManager not ready, cannot handle hash action.");
                }
            }
        }
    }

    /**
     * Send a command to the backend WITHOUT displaying it as a user message in chat
     * Used for system commands like [EXIT_BOOKING_FLOW] that should be silent
     */
    async sendSilentCommand(command, optionalAiMessage = "One moment...") {
        console.log(`🤫 Sending silent command: ${command}`);

        // Dispatch the start action with null userText (prevents user message and old message flicker)
        portalStore.dispatch('startSendMessage', { userText: null });

        try {
            // === LAYER 6: Get fingerprint signature (cached) ===
            const signatureData = await getFingerprintSignatureWithCache();

            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: command,
                    session_id: getSessionId(),
                    device_fingerprint: deviceFingerprint, // Include device fingerprint for rate limiting
                    fingerprint_signature: signatureData.signature, // Layer 6: Signature for replay protection
                    fingerprint_timestamp: signatureData.timestamp // Layer 6: Timestamp for signature validation
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            console.log("📥 Received response from silent command:", data);

            // Update conversation intelligence from backend
            conversationIntelligence.updateFromBackend(data);

            // Update with AI response
            portalStore.dispatch('receiveAiResponse', { aiText: data.response });

            // Handle any action from the backend
            if (data.action && data.action.type) {
                handleJarvisAction(data.action);
            }

        } catch (error) {
            console.error('❌ Portal error during silent command:', error);
            portalStore.dispatch('receiveAiResponse', {
                aiText: 'There was an issue processing your request. Please try again.'
            });
        }
    }

}

function cacheDOMElements() {
    UI.messagesDiv = document.getElementById('messages');
    UI.userInput = document.getElementById('userInput');
    UI.sendButton = document.getElementById('sendButton');
    UI.typingIndicator = document.getElementById('typingIndicator');
    UI.inputWrapper = document.getElementById('inputWrapper');
    UI.ttsPlayer = document.getElementById('ttsPlayer');
    UI.moduleContainer = document.getElementById('moduleContainer');
    UI.messagesContainer = document.getElementById('messagesContainer');
    UI.clickSound = new Audio('./button_click.mp3?v=11.0.12');
    UI.clickSound.volume = 0.05;

    ttsManager.init(UI.ttsPlayer, null, () => updatePlayButtonStates());

    // Add glow animation CSS for unlocked play buttons
    const styleId = 'play-button-glow-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes glow-pulse {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(30, 144, 255, 0.9);
                }
                50% {
                    transform: scale(1.4);
                    box-shadow: 0 0 30px 15px rgba(30, 144, 255, 0.6);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(30, 144, 255, 0);
                }
            }

            @keyframes glow-pulse-small {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(30, 144, 255, 0.9);
                }
                50% {
                    transform: scale(1.13);
                    box-shadow: 0 0 10px 5px rgba(30, 144, 255, 0.6);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(30, 144, 255, 0);
                }
            }

            .message-play-button.glow-pulse {
                animation: glow-pulse 3.5s ease-in-out;
            }

            .message-play-button.glow-pulse-small {
                animation: glow-pulse-small 3.5s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    }

    console.log("✓ DOM elements cached");
}

function setupEventListeners() {
    UI.sendButton.addEventListener('click', handleSendMessage);
    UI.userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    UI.userInput.addEventListener('focus', () => UI.inputWrapper.classList.add('active'));
    UI.userInput.addEventListener('blur', () => {
        if (UI.userInput.value.trim() === '') UI.inputWrapper.classList.remove('active');
    });
    UI.userInput.addEventListener('input', () => {
        if (UI.userInput.value.trim() !== '') {
            UI.inputWrapper.classList.add('active');
        } else {
            UI.inputWrapper.classList.remove('active');
        }
    });

    console.log("✓ Event listeners attached");
}

function initializeCart() {
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', handleCartButtonClick);
        updateCartUI();

        // Subscribe to cart changes
        cartStore.subscribe((event, data) => {
            updateCartUI();
            console.log('[Portal] Cart updated:', event, cartStore.getSummary());
        });

        console.log('✓ Cart initialized');
    } else {
        console.warn('⚠ Cart button not found in DOM');
    }
}

function updateCartUI() {
    const countBadge = document.getElementById('cart-item-count');
    if (countBadge) {
        const count = cartStore.getItemCount();
        countBadge.textContent = count;
        // Hide badge if cart is empty
        countBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function toggleGlobalUI(isVisible) {
    // Select all three floating buttons (cart, speaker, hamburger)
    const floatingCart = document.getElementById('floating-cart-container');
    const speakerButton = document.getElementById('master-speaker-btn');
    const hamburgerButton = document.getElementById('hamburger-button');

    const elements = [floatingCart, speakerButton, hamburgerButton];

    elements.forEach(el => {
        if (el) {
            if (isVisible) {
                el.style.display = 'flex';
                el.style.visibility = 'visible';
            } else {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            }
        }
    });

    if (isVisible) {
        console.log('[Portal] Global UI (cart, speaker, menu) shown');
    } else {
        console.log('[Portal] Global UI (cart, speaker, menu) hidden');
    }

    // --- PAUSE/RESUME 3D LOGO RENDERING ---
    // When modules are open, pause the 3D rendering to prevent crashes on mobile
    shared3D.renderLoopPaused = !isVisible;
    console.log(`[Portal] 3D render loop ${!isVisible ? 'PAUSED' : 'RESUMED'}`);
}

// Expose toggleGlobalUI globally for module-manager.js to access
window.toggleGlobalUI = toggleGlobalUI;

// Initialize floating cart button visibility
function initFloatingCartButton() {
    const cartBtn = document.getElementById('cart-button');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCartButtonClick();
        });
        console.log('✓ Floating cart button initialized');
    }
}

function handleCartButtonClick() {
    console.log('[Portal] Cart button clicked. Current cart:', cartStore.getSummary());

    // --- THE FIX: Use the correct, modern jarvisManager ---
    if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
        // The action name is 'SHOW_CART_CHECKOUT'
        // The payload contains the current cart data for the module to render
        console.log('✓ jarvisManager found, loading SHOW_CART_CHECKOUT');
        window.jarvisManager.loadAction('SHOW_CART_CHECKOUT', {
            items: cartStore.getItems(),
            total: cartStore.getTotal(),
            formattedTotal: cartStore.getFormattedTotal()
        });
    } else {
        console.warn('❌ Jarvis Manager not available for cart module');
    }
}

async function handleSendMessage() {
    console.log('🔴 [CRITICAL] handleSendMessage CALLED');

    const userText = UI.userInput.value.trim();
    console.log('📝 [DEBUG] userText:', userText);
    console.log('📝 [DEBUG] smartMessageRenderer.bookingState:', window.smartMessageRenderer?.bookingState);

    // ✅ CRITICAL FIX: Allow empty userText for transactional API calls (e.g., final booking)
    // In a booking flow with empty userText, this is a transactional request, not a chat message
    const isInBookingFlow = window.smartMessageRenderer?.bookingState?.workshop_id;
    const isTransactionalBookingCall = isInBookingFlow && !userText;

    console.log('🔍 [DEBUG] isInBookingFlow:', isInBookingFlow);
    console.log('🔍 [DEBUG] isTransactionalBookingCall:', isTransactionalBookingCall);

    // Return early only if: no text AND not a transactional booking call AND button is not disabled
    if (!userText && !isTransactionalBookingCall) {
        console.log('[DEBUG] handleSendMessage returning early: no userText and not a transactional call');
        return;
    }

    if (UI.sendButton.disabled) {
        console.log('[DEBUG] handleSendMessage returning early: send button disabled');
        return;
    }

    console.log('✅ [DEBUG] handleSendMessage PROCEEDING with message send');

    // NEW: Play send button sound with new audio system
    soundManager.playSound('sendButton').catch(e => console.error("Send button sound error:", e));

    portalStore.dispatch('startSendMessage', { userText });

    // NEW: Record user input in conversation intelligence
    conversationIntelligence.recordUserMessage(userText);

    UI.userInput.value = '';
    UI.inputWrapper.classList.remove('active');

    try {
        // BOOKING FLOW REMOVED - Now using cart-based checkout
        console.log("📤 Sending message to backend AI...");

        // === LAYER 6: Get fingerprint signature (cached) ===
        const signatureData = await getFingerprintSignatureWithCache();

        const requestPayload = {
            prompt: userText,
            session_id: getSessionId(),
            device_fingerprint: deviceFingerprint,
            fingerprint_signature: signatureData.signature,
            fingerprint_timestamp: signatureData.timestamp
            // BOOKING STATE REMOVED - Now using cart-based checkout
        };

        console.log('📤 [DEBUG] Exact payload being sent to backend:', JSON.stringify(requestPayload, null, 2));

        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            // ✅ CRITICAL: Log the actual error response before throwing
            const errorText = await response.text();
            console.error(`❌ HTTP ${response.status} Error Response:`, errorText);
            console.error('🔍 Request body was:', {
                prompt: userText,
                session_id: getSessionId(),
                workshop_id: window.smartMessageRenderer?.bookingState?.workshop_id,
                organization_type: window.smartMessageRenderer?.bookingState?.organization_type,
                participants: window.smartMessageRenderer?.bookingState?.participants,
                requested_date: window.smartMessageRenderer?.bookingState?.requested_date,
                requested_time: window.smartMessageRenderer?.bookingState?.requested_time
            });
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("📥 Received from backend:", JSON.stringify(data, null, 2));

        // CRITICAL: Extract response and action from Jarvis response
        // Handle both correct format and edge cases
        let aiText = null;
        let action = null;

        if (typeof data === 'object' && data !== null) {
            aiText = data.response || null;
            action = data.action || null;

            // Debug logging
            if (!aiText) {
                console.error("❌ No 'response' field in backend data!");
                console.error("Backend data keys:", Object.keys(data));
                aiText = `[ERROR] Backend didn't return response. Got: ${JSON.stringify(data).substring(0, 100)}`;
            }

            if (aiText && typeof aiText !== 'string') {
                console.error("❌ Response is not a string:", typeof aiText);
                aiText = JSON.stringify(aiText);
            }
        } else {
            console.error("❌ Backend didn't return an object:", typeof data);
            aiText = `[ERROR] Unexpected response format: ${JSON.stringify(data)}`;
        }

        console.log(`✓ Response text: "${(aiText || '').substring(0, 50)}..."`);
        console.log(`✓ Action: ${action?.type || 'None'}`);

        // NEW: Update conversation intelligence store from backend context
        conversationIntelligence.updateFromBackend(data);

        // Log the updated state for debugging
        console.log("[ConversationIntelligence] Current state:", conversationIntelligence.exportState());

        // --- ✅ CORRECTED: Action handling is now exclusive ---
        // When a transactional action is returned, the action handler is 100% responsible for the UI.
        if (action && action.type) {
            // Action present: Transactional request (e.g., SHOW_STRIPE_CHECKOUT)
            // The action handler will manage the UI transition. DO NOT dispatch receiveAiResponse.
            // The spinner will remain until the action fully loads.
            console.log("🎭 Transactional Action Received. Bypassing chat render. Action:", action.type);
            handleJarvisAction(action);
            // ✅ CRITICAL: No receiveAiResponse dispatch here. Action handler owns the UI.
        } else {
            // No action: This is a normal conversational turn.
            // Dispatch the AI's text response to be rendered in a chat bubble.
            portalStore.dispatch('receiveAiResponse', { aiText });
        }

    } catch (error) {
        console.error('❌ Portal error:', error);
        portalStore.dispatch('receiveAiResponse', {
            aiText: 'Portal connection lost. The AI realm is temporarily unreachable.'
        });
    }
}

/**
 * Handle Jarvis UI actions
 * ✅ CRITICAL: This function is responsible for turning off the spinner after the action loads.
 * It uses try...finally to guarantee the spinner is cleared.
 */
async function handleJarvisAction(action) {
    if (!action || !action.type) {
        console.warn("⚠ Invalid action received");
        return;
    }

    try {
        // Use jarvisManager.loadAction to properly handle UI actions
        // This method handles module loading, rendering, and browser history
        console.log(`🎭 Loading action: ${action.type}`, action.payload);
        if (window.portalController && window.portalController.jarvisManager) {
            await window.portalController.jarvisManager.loadAction(action.type, action.payload || {});
        } else {
            console.error("❌ jarvisManager not available");
        }
    } catch (error) {
        console.error("❌ Error handling Jarvis action:", error);
    } finally {
        // ✅ CRITICAL FIX: Always turn off the spinner after action handling completes.
        // This prevents the UI from getting stuck in a loading state.
        // We dispatch aiText: null so it doesn't create an empty chat bubble.
        console.log("✓ Action loading complete. Clearing the spinner.");
        portalStore.dispatch('receiveAiResponse', { aiText: null });
    }
}

/**
 * Render schedule button centered above the chat input
 * Shows a single button to schedule/book a workshop (opens modal on click)
 */
function renderAccumulatedWorkshopButtons() {
    // Hide this completely - we're not using accumulator buttons anymore
    // The schedule button is now centered in the input area
    let container = document.getElementById('workshop-buttons-container');
    if (container) {
        container.style.display = 'none';
    }
}

async function render() {
    const { lastUserMessage, lastAiMessage, isTyping } = portalStore.state;
    // USE appStore as the definitive source of truth for module state
    const hasActiveModule = appStore.state.isModuleActive;
    const currentModule = appStore.state.activeModule;
    const isInBookingFlow = conversationIntelligence.state.booking.workshop_id;
    const isMobileFile = window.location.pathname.includes('mobile.html');

    console.log(`[RENDER] hasActiveModule=${hasActiveModule}, currentModule=${currentModule}`);

    // --- RENDER MESSAGES & MODULES ---
    console.log(`[RENDER] Clearing messagesDiv, hasActiveModule=${hasActiveModule}`);
    UI.messagesDiv.innerHTML = '';
    // *** THE FIX: DO NOT CLEAR the moduleContainer if a module is supposed to be active. ***
    if (!hasActiveModule) {
        UI.moduleContainer.innerHTML = '';
    }

    UI.typingIndicator.classList.toggle('visible', isTyping);

    if (!isTyping && !hasActiveModule) {
        if (!lastUserMessage && !lastAiMessage && !welcomeMessageRendered && !window.skipWelcomeMessage) {
            // --- THIS IS THE FIX ---
            // Only run this block if the welcome message has NEVER been rendered before.
            // Skip if window.skipWelcomeMessage is set (e.g., auto-booking from workshop detail pages)

            // Welcome message from config system
            const welcomeText = settings.chat.welcomeMessage;
            const welcomeElement = await createMessageElement(welcomeText, 'ai');
            UI.messagesDiv.appendChild(welcomeElement);

            welcomeMessageRendered = true; // Set the guard so this NEVER runs again.

        } else if (lastUserMessage || lastAiMessage) {
            // This is the normal render path for subsequent messages.
            // It now only runs if there are actual messages in the state.
            UI.messagesDiv.innerHTML = ''; // Safe to wipe here.

            if (lastUserMessage) {
                const userElement = await createMessageElement(lastUserMessage, 'user');
                UI.messagesDiv.appendChild(userElement);
            }
            if (lastAiMessage) {
                const aiElement = await createMessageElement(lastAiMessage, 'ai');
                UI.messagesDiv.appendChild(aiElement);

                // NEW: Play the AI response sound with proper error handling
                soundManager.playSound('aiResponse').catch(e => console.error('AI response sound error:', e));
            }

            // --- ✅ THE HYBRID FLOW FIX ---
            // After rendering chat messages, check if a booking is in progress.
            // If so, re-render the appropriate booking controls right below the conversation.
            const bookingState = window.smartMessageRenderer?.bookingState;
            if (!hasActiveModule && bookingState && bookingState.workshop_id) {

                // Don't render the booking UI if the final API call has been made
                // and we are just waiting for the SHOW_WORKSHOP_BOOKING action.
                const isFinalStep = bookingState.workshop_id && bookingState.organization_type && bookingState.participants && bookingState.requested_date;

                if (!isFinalStep) {
                    console.log("[HYBRID] Re-rendering booking UI alongside conversation. State:", bookingState);

                    const bookingUiContainer = document.createElement('div');
                    bookingUiContainer.className = 'booking-ui-inline';

                    // Re-use the same logic that builds the UI in the first place.
                    // It will render the correct step (org type, participants, etc.) based on the current state.
                    await window.smartMessageRenderer.renderSmartConciergeUI(bookingUiContainer, null, bookingState);
                    UI.messagesDiv.appendChild(bookingUiContainer);
                }
            }
            // --- END HYBRID FLOW FIX ---
        }
    }

    // --- NEW CENTRALIZED IMAGE RENDERING LOGIC ---
    // Clean up any old image wrappers before rendering new ones
    document.querySelectorAll('.booking-image-boxes-wrapper').forEach(el => el.remove());
    // This block decides which floating images to show, if any.
    if (!hasActiveModule) {
        // A full-screen module is NOT active, so we might show images.
        if (isInBookingFlow) {
            // STATE: Booking flow is active. Show the booking-specific images.
            const bookingImages = await smartMessageRenderer.createImageBoxes(conversationIntelligence.state.booking);
            if (bookingImages) {
                UI.messagesContainer.appendChild(bookingImages);
            }
        } else {
            // STATE: Normal chat. Show the new default images.
            const defaultImages = await smartMessageRenderer.createDefaultChatImages();
            if (defaultImages) {
                UI.messagesContainer.appendChild(defaultImages);
            }
        }
    }
    // STATE: If hasActiveModule is true (e.g., Stripe checkout), no images will be rendered.

    // --- FINAL UI STATE UPDATES ---
    UI.sendButton.disabled = isTyping;
    UI.userInput.disabled = isTyping;

    // Foolproof mobile detection: Check if the send button has an icon.
    // This is more reliable than checking the URL path.
    const sendButtonIcon = UI.sendButton.querySelector('i');
    const isMobileVersion = !!sendButtonIcon; // If the icon exists, it's the mobile version.

    // Only auto-focus the input if we are NOT on the mobile version.
    if (!isTyping && !isMobileVersion) {
        UI.userInput.focus();
    }

    // ONLY render the schedule button if NO module is active
    // Module states (Stripe, confirmation, etc) are self-contained
    if (!hasActiveModule) {
        // ✅ CORRECTED: Check smartMessageRenderer.bookingState (where the data actually is!)
        // NOT conversationIntelligence (which is for backend context)
        const isCurrentlyInBookingFlow = window.smartMessageRenderer?.bookingState?.workshop_id;
        console.log(`[RENDER] 🔘 Button state - isCurrentlyInBookingFlow: ${isCurrentlyInBookingFlow}, bookingState:`,
                    window.smartMessageRenderer?.bookingState);
        smartMessageRenderer.renderScheduleButtonAboveInput(isCurrentlyInBookingFlow);
    } else {
        console.log(`[RENDER] SKIPPING renderScheduleButtonAboveInput because module is active: ${currentModule}`);
    }
}

function createMessagePlayButton(messageText) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'message-play-button-container';
    const button = document.createElement('button');
    button.className = 'message-play-button';

    // FIX: Use encodeURIComponent before btoa for UTF-8 compatibility with Indigenous characters
    // This handles characters like xʷməθkʷəy̓əm and ʔi c̓əsnaʔəm without throwing InvalidCharacterError
    const uniqueId = btoa(encodeURIComponent(messageText.substring(0, 50))).replace(/=/g, '');

    button.id = `play-btn-${uniqueId}`;
    button.setAttribute('data-message-text', messageText);

    // Show locked or play icon based on current unlock state
    if (ttsManager.ttsUnlockedForSession) {
        button.title = 'Play';
        button.innerHTML = `<i class="fas fa-play"></i>`;
    } else {
        button.title = 'Click to unlock TTS';
        button.innerHTML = `<i class="fas fa-volume-mute"></i>`;
    }

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        handleMessagePlayButtonClick(messageText, button);
    });
    buttonContainer.appendChild(button);
    return buttonContainer;
}

async function handleMessagePlayButtonClick(messageText, buttonElement) {
    // Check current button state
    const icon = buttonElement.querySelector('i');
    const isLocked = icon.classList.contains('fa-volume-mute');

    // FIRST CLICK: If locked, unlock only - DON'T play yet
    if (isLocked) {
        console.log('[PortalController] First click - attempting to unlock TTS...');
        const unlocked = await ttsManager.attemptTTSUnlock();
        if (!unlocked) {
            console.log('[PortalController] Unlock failed - button stays locked');
            return;
        }
        console.log('[PortalController] TTS unlocked! Updating button to play icon.');
        ttsFirstUnlocked = true; // Mark first unlock for big glow animation
        // Update ALL buttons to show play icon
        updatePlayButtonStates();
        return; // STOP HERE - user must click again to play
    }

    // SECOND CLICK: If already unlocked (showing play icon), play audio
    if (ttsManager.isPlaying) {
        ttsManager.stop();
        updatePlayButtonStates();
        return;
    }

    icon.className = 'fas fa-spinner fa-spin';
    buttonElement.disabled = true;

    try {
        const audioBase64 = await ttsManager.getAudio(messageText, BACKEND_URL);
        if (audioBase64) {
            ttsManager.play(audioBase64);
            updatePlayButtonStates(messageText);
        } else {
            resetButtonToPlay(buttonElement);
        }
    } catch (error) {
        console.error("Error fetching TTS audio:", error);
        resetButtonToPlay(buttonElement);
    }
}

function resetButtonToPlay(buttonElement) {
    const icon = buttonElement.querySelector('i');
    icon.className = 'fas fa-play';
    buttonElement.disabled = false;
}

function updatePlayButtonStates(currentPlayingMessageText = null) {
    document.querySelectorAll('.message-play-button').forEach(btn => {
        const msgText = btn.getAttribute('data-message-text');
        const icon = btn.querySelector('i');
        btn.disabled = false;

        // Remove both glow animations from all buttons first
        btn.classList.remove('glow-pulse');
        btn.classList.remove('glow-pulse-small');

        if (msgText === currentPlayingMessageText && ttsManager.isPlaying) {
            icon.className = 'fas fa-stop';
            btn.title = 'Stop';
        } else {
            icon.className = 'fas fa-play';
            btn.title = 'Play';

            // Add glow animation to all unlocked play buttons (not currently playing)
            if (ttsManager.ttsUnlockedForSession) {
                // First unlock gets big glow, subsequent updates get small glow
                if (ttsFirstUnlocked) {
                    btn.classList.add('glow-pulse');
                    ttsFirstUnlocked = false; // After first time, switch to small glow
                } else {
                    btn.classList.add('glow-pulse-small');
                }
            }
        }
    });
}

async function createMessageElement(text, sender, isWelcome = false) {
    const el = document.createElement('div');
    el.classList.add('message', `${sender}-message`);
    if (isWelcome) el.classList.add('welcome-message');

    // ALWAYS use SmartMessageRenderer for ALL AI messages
    // It handles both chat mode (with 3 buttons) and booking mode (with selectors)
    if (sender === 'ai') {
        console.log('📝 Creating AI message element');
        el.style.position = 'relative';

        // === RE-ENABLED: 3D logo creation with HIGH-PERFORMANCE CLONING ===
        // Now using shared3D model cloning instead of loading per message
        // No resource exhaustion on mobile, instant creation (microseconds)
        try {
            console.log('🎬 Calling create3dLogoForMessage()...');
            const logoContainer = create3dLogoForMessage();
            el.appendChild(logoContainer);
            console.log('✓ Logo container appended to message');
        } catch (err) {
            console.error('Failed to create 3D logo:', err);
        }

        const lastUserMessage = portalStore.state.lastUserMessage || '';
        const bookingState = conversationIntelligence.state.booking;
        const result = await smartMessageRenderer.renderSmartMessage(text, lastUserMessage, bookingState);

        // Handle new object return format
        const smartContent = result.container || result;

        // === NEW: TYPING ANIMATION FOR AI MESSAGE TEXT ===
        // Extract the message text container
        const messageTextContainer = smartContent.querySelector('.smart-message-text');

        if (messageTextContainer) {
            // Save the HTML content that needs to be animated
            const originalTextHTML = messageTextContainer.innerHTML;
            // Clear it for animation to start fresh
            messageTextContainer.innerHTML = '';

            // Append the smart content structure IMMEDIATELY (bubble appears now)
            el.appendChild(smartContent);

            // START the animation in the background WITHOUT awaiting
            // This lets the bubble appear instantly while text types inside
            const animationSpeed = isWelcome ? 40 : 20; // Slower for welcome, faster for regular
            TextAnimator.animateTyping(messageTextContainer, originalTextHTML, {
                speed: animationSpeed,
                onComplete: () => {
                    // Re-attach event listeners to <special> tags after animation
                    if (smartMessageRenderer.reattachSmartMessageEventListeners) {
                        smartMessageRenderer.reattachSmartMessageEventListeners(messageTextContainer);
                    }
                    console.log('✓ Text animation complete, event listeners reattached');
                }
            }).catch(err => console.error('Animation error:', err));
        } else {
            // Fallback if .smart-message-text is not found (no animation)
            el.appendChild(smartContent);
            console.log('⚠ .smart-message-text container not found, skipping animation');
        }
        // === END TYPING ANIMATION ===

        // Store pending image boxes on the element so render() can add them at the right level
        if (result.imageBoxes) {
            el.__pendingImageBoxes = result.imageBoxes;
        }

    } else {
        // Standard formatting for user messages and welcome message
        const textSpan = document.createElement('span');
        textSpan.className = 'message-text';

        // Format contact information with clickable links
        let formattedText = text;

        // Convert phone numbers to clickable tel: links (e.g., "236-300-3005")
        formattedText = formattedText.replace(
            /(\d{3})-(\d{3})-(\d{4})/g,
            '<a href="tel:$1-$2-$3" class="contact-link phone-link" title="Click to call">$1-$2-$3</a>'
        );

        // Convert emails to clickable mailto: links (e.g., "shona@moontidereconciliation.com")
        formattedText = formattedText.replace(
            /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
            '<a href="mailto:$1" class="contact-link email-link" title="Click to email or copy">$1</a>'
        );

        // Convert line breaks to <br>
        formattedText = formattedText.replace(/\n/g, '<br>');

        // Set innerHTML safely (text comes from AI, so this is controlled)
        textSpan.innerHTML = formattedText;

        // Add copy-to-clipboard functionality for emails
        textSpan.querySelectorAll('.email-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    // If Ctrl/Cmd clicked, let the mailto: handle it
                    return;
                }
                e.preventDefault();
                const email = link.textContent;
                navigator.clipboard.writeText(email).then(() => {
                    // Show brief feedback
                    const originalText = link.textContent;
                    link.textContent = '✓ Copied!';
                    setTimeout(() => {
                        link.textContent = originalText;
                    }, 1500);
                }).catch(err => console.error('Copy failed:', err));
            });
        });

        el.appendChild(textSpan);
    }

    el.style.opacity = '0';
    el.style.transform = isWelcome ? 'translateY(30px) scale(0.9)' : 'translateY(20px)';
    setTimeout(() => {
        el.style.transition = isWelcome ? 'opacity 0.6s ease, transform 0.6s ease' : 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scale(1)';
    }, 50);
    return el;
}

// Expose critical functions to global scope for use in exit/success flows
window.createMessageElement = createMessageElement;
window.handleMessagePlayButtonClick = handleMessagePlayButtonClick;
window.createMessagePlayButton = createMessagePlayButton;
window.BACKEND_URL = BACKEND_URL;
window.getSessionId = getSessionId;
window.ttsManager = ttsManager;

const portalController = new PortalController();
window.portalController = portalController;
window.portalStore = portalStore;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => portalController.init());
} else {
    portalController.init();
}

export default PortalController;