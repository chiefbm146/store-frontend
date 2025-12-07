/**
 * Universal AI Chat Widget v3.0 - God Module
 * Self-configuring, dynamically-branded AI chat module.
 *
 * HOW TO USE:
 * Include this file on any webpage with data-store-id attribute:
 * <script src="path/to/ai-chat.js" data-store-id="moon-tide"></script>
 *
 * Ensure `ai-chat.css` is also linked in your HTML:
 * <link rel="stylesheet" href="path/to/ai-chat.css">
 *
 * Supported stores: moon-tide, aarie-platform, bert-peters
 * The script will auto-configure itself and load its personality from Firestore.
 */

// ========================================
// DYNAMIC CONFIGURATION FROM SCRIPT TAG
// ========================================
let STORE_ID = null;
let BACKEND_URL = null;
let CHAT_ENDPOINT = null;
let TTS_ENDPOINT = null;
let SIGN_FINGERPRINT_ENDPOINT = null; // Still here, even if not used in this simplified version

function configureFromScriptTag() {
    const scriptTag = document.querySelector('script[src*="ai-chat-cuzzins"]');
    if (!scriptTag) {
        console.error("AI Chat: Script tag with src*='ai-chat-cuzzins' not found.");
        return false;
    }

    STORE_ID = scriptTag.dataset.storeId;
    if (!STORE_ID) {
        console.error("AI Chat: data-store-id attribute is missing on the script tag.");
        return false;
    }

    // ========================================
    // THE ONE TRUE BACKEND - ALL STORES CONVERGE HERE
    // ========================================
    BACKEND_URL = 'https://stores-backend-52450564461.us-central1.run.app';

    // Dynamically construct endpoints using store_id
    CHAT_ENDPOINT = `/api/v1/${STORE_ID}/chat`;
    TTS_ENDPOINT = `/api/v1/${STORE_ID}/tts`;
    SIGN_FINGERPRINT_ENDPOINT = `/api/v1/${STORE_ID}/sign-fingerprint`; // Retained for future use

    return true;
}

// ========================================
// INJECT FONT AWESOME CDN (FOR ICONS)
// ========================================
function injectFontAwesome() {
    if (document.getElementById('aiChatFontAwesome')) return;

    const link = document.createElement('link');
    link.id = 'aiChatFontAwesome';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
}

// ========================================
// INJECT HTML ELEMENTS
// (CSS injection removed, assumes CSS is linked separately)
// ========================================
function injectChatHTML() {
    // Check if already injected
    if (document.getElementById('aiChatModal')) return;

    const html = `
        <!-- AI Chat Icon (Bottom Right) - Desktop -->
        <button class="ai-chat-icon" id="desktopChatIcon" onclick="window.AIChat.openDesktop()" title="Chat with AI Assistant">🤖</button>

        <!-- AI Chat Modal Overlay - Desktop -->
        <div class="ai-chat-overlay" id="aiChatOverlay" onclick="window.AIChat.closeDesktop()"></div>

        <!-- AI Chat Modal - Desktop -->
        <div class="ai-chat-modal" id="aiChatModal">
            <div class="chat-modal-header">
                <h3 class="chat-modal-title" id="desktop-chat-title">🤖 AI Assistant</h3>
                <div class="chat-header-controls">
                    <button class="master-speaker-btn" id="desktopSpeakerBtn" title="Enable Voice">
                        <i class="fa-solid fa-volume-xmark"></i>
                    </button>
                    <button class="chat-modal-close" onclick="window.AIChat.closeDesktop()">✕</button>
                </div>
            </div>
            <div class="chat-modal-body">
                <div class="water-background-container"></div>
                <div class="chat-messages-container">
                    <div class="messages" id="aiMessages">
                        <div class="message-wrapper ai" id="desktop-greeting-wrapper">
                            <div class="message ai-message" id="desktop-initial-greeting">
                                👋 Hello! I'm your AI assistant. How can I help you today?
                            </div>
                            <button class="message-play-btn" id="desktop-greeting-tts" data-text="Hello! I'm your AI assistant. How can I help you today?">
                                <i class="fa-solid fa-volume-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="chat-modal-input">
                <input type="text" placeholder="Ask me anything..." id="aiChatInput" />
                <button onclick="window.AIChat.sendDesktopMessage()">Send</button>
            </div>
        </div>

        <!-- Mobile Floating Chat Button -->
        <button class="mobile-chat-fab" id="mobileChatFab" onclick="window.AIChat.openMobile()" title="Chat with AI">🤖</button>

        <!-- Mobile Chat Overlay -->
        <div class="mobile-chat-overlay" id="mobileChatOverlay" onclick="window.AIChat.closeMobile()"></div>

        <!-- Mobile Fullscreen Chat Modal -->
        <div class="mobile-chat-modal" id="mobileChatModal">
            <div class="mobile-chat-header">
                <h3 class="mobile-chat-title" id="mobile-chat-title">🤖 AI Assistant</h3>
                <div class="mobile-header-controls">
                    <button class="mobile-speaker-btn" id="mobileSpeakerBtn" title="Enable Voice">
                        <i class="fa-solid fa-volume-xmark"></i>
                    </button>
                    <button class="mobile-chat-close" onclick="window.AIChat.closeMobile()">✕</button>
                </div>
            </div>
            <div class="mobile-chat-body">
                <div class="water-background-container"></div>
                <div class="mobile-chat-container">
                    <div class="mobile-chat-messages" id="mobileChatMessages">
                        <div class="message-wrapper ai" id="mobile-greeting-wrapper">
                            <div class="mobile-chat-message ai" id="mobile-initial-greeting">
                                👋 Hello! I'm your AI assistant. How can I help you today?
                            </div>
                            <button class="message-play-btn" id="mobile-greeting-tts" data-text="Hello! I'm your AI assistant. How can I help you today?">
                                <i class="fa-solid fa-volume-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mobile-typing-indicator" id="mobileTypingIndicator">
                    <span class="mobile-typing-dot"></span>
                    <span class="mobile-typing-dot"></span>
                    <span class="mobile-typing-dot"></span>
                </div>
            </div>
            <div class="mobile-chat-input-area">
                <input type="text" class="mobile-chat-input" id="mobileChatInput" placeholder="Ask me anything..." maxlength="4000">
                <button class="mobile-chat-send" onclick="window.AIChat.sendMobileMessage()">Send</button>
            </div>
        </div>

        <!-- Audio Permission Modal -->
        <div class="audio-permission-overlay" id="audioPermissionOverlay">
            <div class="audio-permission-modal">
                <div class="audio-permission-icon">🔊</div>
                <h2 class="audio-permission-title">Enable Voice</h2>
                <p class="audio-permission-text">Enable audio to hear AI responses read aloud. This creates a more engaging experience!</p>
                <div class="audio-permission-buttons">
                    <button class="audio-permission-enable" id="audioEnableBtn">Enable Voice</button>
                    <button class="audio-permission-skip" id="audioSkipBtn">Maybe Later</button>
                </div>
            </div>
        </div>

        <!-- Hidden Audio Element for TTS -->
        <audio id="ttsAudio"></audio>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
}

// ========================================
// STATE VARIABLES
// ========================================
let CHAT_SESSION_ID = null;
let MOBILE_CHAT_SESSION_ID = null;
let deviceFingerprint = null;
let waterInstance = null; // Assuming Water4Chat is available globally
let ttsUnlocked = false;
let isPlaying = false;
let currentAudio = null;
let audioCache = new Map();
let ttsAudio = null;
// FINGERPRINT_SIGNATURE and FINGERPRINT_TIMESTAMP are commented out as they are not used in this specific file version,
// but kept for context if they were intended for server-side fingerprinting or other security features.
// let FINGERPRINT_SIGNATURE = null;
// let FINGERPRINT_TIMESTAMP = null;
let desktopChatOpen = false;
let mobileChatOpen = false;
let BOOKING_CONTEXT = { // Retained as it might be used by the backend
    workshop_id: null,
    organization_type: null,
    participants: null,
    requested_date: null,
    requested_time: null
};

// ========================================
// HISTORY MANAGEMENT FOR BACK BUTTON
// ========================================
function handleHistoryChange(event) {
    // Check if desktop chat is open and hash is no longer #ai-chat
    if (desktopChatOpen && window.location.hash !== '#ai-chat') {
        closeAIChat(false); // Don't push history back again
    }

    // Check if mobile chat is open and hash is no longer #ai-chat-mobile
    if (mobileChatOpen && window.location.hash !== '#ai-chat-mobile') {
        closeMobileChat(false); // Don't push history back again
    }
}

// ========================================
// INITIALIZATION
// ========================================
function initializeChatSystem() {
    const configured = configureFromScriptTag();
    if (!configured) {
        console.warn("AI Chat: Configuration failed. Chat widget will not load.");
        return;
    }

    // Backend Wakeup Ping (non-blocking)
    (async () => {
        try {
            const wakeupUrl = `${BACKEND_URL}/api/v1/${STORE_ID}/wakeup`;
            // Use .then().catch() to avoid unhandled promise rejections for background pings
            fetch(wakeupUrl).then(response => {
                if (!response.ok) console.warn(`AI Chat: Backend wakeup ping failed with status ${response.status}`);
            }).catch(e => console.warn("AI Chat: Backend wakeup ping network error:", e));
        } catch (e) {
            console.error("AI Chat: Error during backend wakeup ping:", e);
        }
    })();

    // Inject Font Awesome for icons (BEFORE HTML injection to ensure icons are available)
    injectFontAwesome();

    // Inject HTML (CSS is assumed to be linked in the HTML document)
    injectChatHTML();

    // Get audio element (now exists from HTML injection)
    ttsAudio = document.getElementById('ttsAudio');

    // Initialize sessions
    initializeChatSession();
    initMobileChatSession();
    initializeDeviceFingerprint();

    // Set up event listeners
    setupEventListeners();

    // The display property for .ai-chat-icon and .mobile-chat-fab is now handled by CSS media queries.
    // So, no need to explicitly set `display = 'flex'` here.
    // They will become visible based on screen width due to the CSS.
}

function initializeChatSession() {
    CHAT_SESSION_ID = 'session_' + crypto.randomUUID();
    console.log("AI Chat: Desktop session ID:", CHAT_SESSION_ID);
}

function initMobileChatSession() {
    MOBILE_CHAT_SESSION_ID = 'mobile_' + crypto.randomUUID();
    console.log("AI Chat: Mobile session ID:", MOBILE_CHAT_SESSION_ID);
}

function initializeDeviceFingerprint() {
    const formFactor = window.innerWidth < 768 ? 'mobile' : 'desktop';
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelDensity = (window.devicePixelRatio || 1).toFixed(1);
    deviceFingerprint = `${formFactor}_${screenWidth}x${screenHeight}_${pixelDensity}`;
    console.log("AI Chat: Device fingerprint:", deviceFingerprint);
}

// ========================================
// TTS SYSTEM - AUDIO MODAL
// ========================================
function showAudioModal() {
    const modal = document.getElementById('audioPermissionOverlay');
    if (modal) modal.classList.add('active');
    // Prevent scrolling behind the modal
    document.body.style.overflow = 'hidden';
}

function hideAudioModal() {
    const modal = document.getElementById('audioPermissionOverlay');
    if (modal) modal.classList.remove('active');
    // Re-enable scrolling
    document.body.style.overflow = '';
}

async function attemptTTSUnlock() {
    if (ttsUnlocked) return true; // Already unlocked

    return new Promise((resolve) => {
        showAudioModal();

        const enableBtn = document.getElementById('audioEnableBtn');
        const skipBtn = document.getElementById('audioSkipBtn');

        // Clear previous event listeners to prevent multiple bindings
        if (enableBtn) enableBtn.onclick = null;
        if (skipBtn) skipBtn.onclick = null;

        if (enableBtn) {
            enableBtn.onclick = async () => {
                try {
                    // Play unlock sound to satisfy browser autoplay policy
                    // Assuming '/sounds/unlock.mp3' exists relative to your HTML page
                    const testAudio = new Audio('/sounds/unlock.mp3?v=1.0');
                    testAudio.volume = 0.5;
                    await testAudio.play();

                    ttsUnlocked = true;
                    console.log("AI Chat: TTS Unlocked.");
                    updateSpeakerButtons();
                    hideAudioModal();
                    resolve(true);
                } catch (error) {
                    console.error("AI Chat: Failed to unlock TTS audio:", error);
                    hideAudioModal();
                    resolve(false);
                }
            };
        }

        if (skipBtn) {
            skipBtn.onclick = () => {
                console.log("AI Chat: TTS unlock skipped.");
                hideAudioModal();
                resolve(false);
            };
        }
    });
}

function updateSpeakerButtons() {
    const desktopBtn = document.getElementById('desktopSpeakerBtn');
    const mobileBtn = document.getElementById('mobileSpeakerBtn');

    if (ttsUnlocked) {
        if (desktopBtn) {
            desktopBtn.classList.add('unlocked');
            const icon = desktopBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-volume-high'; // Speaker ON icon
            desktopBtn.title = "Disable Voice"; // Update tooltip
        }
        if (mobileBtn) {
            mobileBtn.classList.add('unlocked');
            const icon = mobileBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-volume-high';
            mobileBtn.title = "Disable Voice";
        }
    } else {
        if (desktopBtn) {
            desktopBtn.classList.remove('unlocked');
            const icon = desktopBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-volume-xmark'; // Speaker OFF icon
            desktopBtn.title = "Enable Voice";
        }
        if (mobileBtn) {
            mobileBtn.classList.remove('unlocked');
            const icon = mobileBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-volume-xmark';
            mobileBtn.title = "Enable Voice";
        }
    }

    // Update all individual message play buttons
    document.querySelectorAll('.message-play-btn').forEach(btn => {
        const icon = btn.querySelector('i');
        if (ttsUnlocked) {
            // If already playing, keep the stop icon, otherwise show play
            if (btn.dataset.text === (currentAudio && !currentAudio.paused ? btn.dataset.text : null) && isPlaying) {
                icon.className = 'fa-solid fa-stop';
            } else {
                icon.className = 'fa-solid fa-play';
            }
        } else {
            icon.className = 'fa-solid fa-volume-xmark'; // Show disabled icon
        }
    });
}

// ========================================
// TTS SYSTEM - AUDIO GENERATION & PLAYBACK
// ========================================
async function getTTSAudio(text) {
    const cacheKey = text.substring(0, Math.min(text.length, 100)); // Use a substring as cache key
    if (audioCache.has(cacheKey)) {
        return audioCache.get(cacheKey);
    }

    try {
        const response = await fetch(`${BACKEND_URL}${TTS_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, store_id: STORE_ID }) // Include store_id
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const audioData = data.audio || data.audio_base64;
        if (audioData) {
            audioCache.set(cacheKey, audioData);
            return audioData;
        } else {
            console.warn("AI Chat: TTS response did not contain audio data.");
            return null;
        }
    } catch (error) {
        console.error("AI Chat: Error fetching TTS audio:", error);
        return null;
    }
}

async function playTTSAudio(base64Audio, messageText) {
    // Stop any currently playing audio
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Detect MIME type from base64 header (common prefixes)
    let mimeType = 'audio/mpeg'; // Default to MP3
    if (base64Audio.startsWith('T2d')) { // Ogg Vorbis
        mimeType = 'audio/ogg';
    } else if (base64Audio.startsWith('Ukl')) { // WAV
        mimeType = 'audio/wav';
    } else if (base64Audio.startsWith('SUQ')) { // MP3, specifically ID3 tag start
        mimeType = 'audio/mpeg';
    }
    // Add more MIME type detections if needed

    ttsAudio.src = `data:${mimeType};base64,${base64Audio}`;
    ttsAudio.volume = 1.0;
    isPlaying = true;
    currentAudio = ttsAudio;

    ttsAudio.onended = () => {
        isPlaying = false;
        currentAudio = null;
        updatePlayButtonStates(); // Update all buttons after playback
    };
    ttsAudio.onerror = (e) => {
        console.error("AI Chat: Audio playback error:", e);
        isPlaying = false;
        currentAudio = null;
        updatePlayButtonStates();
    };

    try {
        await ttsAudio.play();
        updatePlayButtonStates(messageText); // Update button for this message to 'stop'
    } catch (err) {
        console.error("AI Chat: Failed to play audio:", err);
        isPlaying = false;
        currentAudio = null;
        updatePlayButtonStates();
    }
}

function stopTTSAudio() {
    if (ttsAudio) {
        ttsAudio.pause();
        ttsAudio.currentTime = 0;
    }
    isPlaying = false;
    currentAudio = null;
    updatePlayButtonStates(); // Reset all buttons to 'play' or 'disabled' state
}

function updatePlayButtonStates(playingText = null) {
    document.querySelectorAll('.message-play-btn').forEach(btn => {
        const msgText = btn.dataset.text;
        const icon = btn.querySelector('i');

        if (!ttsUnlocked) {
            icon.className = 'fa-solid fa-volume-xmark'; // Show disabled/mute icon
            btn.disabled = false; // Buttons are not strictly disabled, but visually indicate mute
        } else if (msgText === playingText && isPlaying) {
            icon.className = 'fa-solid fa-stop'; // Show stop icon if this message is playing
            btn.disabled = false;
        } else {
            icon.className = 'fa-solid fa-play'; // Show play icon
            btn.disabled = false;
        }
    });
}

async function handlePlayClick(text, button) {
    const icon = button.querySelector('i');

    // If TTS is not unlocked, show the modal
    if (!ttsUnlocked) {
        const unlocked = await attemptTTSUnlock();
        if (!unlocked) {
            // If user skips or permission fails, keep the volume-xmark icon
            updatePlayButtonStates();
            return;
        }
        // If unlocked, proceed to play (this function will be called again implicitly by the button click due to modal)
        // or explicitly call play here if desired. For now, we'll let the user re-click.
        updatePlayButtonStates(); // Ensure icons update after unlock
        return;
    }

    // If currently playing the audio for THIS button, stop it
    if (isPlaying && currentAudio && currentAudio.src.includes(btoa(text.substring(0, Math.min(text.length, 100))))) { // Simple check based on cached text
        stopTTSAudio();
        return;
    }
    // If another audio is playing, stop it first
    if (isPlaying && currentAudio) {
        stopTTSAudio();
    }


    // Indicate loading
    icon.className = 'fa-solid fa-spinner fa-spin';
    button.disabled = true;

    try {
        const audioData = await getTTSAudio(text);
        if (audioData) {
            await playTTSAudio(audioData, text);
        } else {
            console.warn("AI Chat: Could not get audio data for TTS.");
        }
    } catch (error) {
        console.error("AI Chat: Error during TTS playback attempt:", error);
    } finally {
        button.disabled = false;
        updatePlayButtonStates(isPlaying ? text : null); // Update state, if still playing, keep stop icon
    }
}

// ========================================
// SPECIAL TAG HANDLING
// ========================================
function attachSpecialTagListeners(container, inputElement, sendFunction) {
    container.querySelectorAll('special, price').forEach(el => { // Handle both <special> and <price>
        el.style.cursor = 'pointer';
        el.style.color = '#00b4a6'; // Make them look clickable
        el.style.fontWeight = 'bold';
        el.style.textDecoration = 'underline';
        el.onclick = (e) => {
            e.stopPropagation();
            const text = el.textContent;
            inputElement.value = text;
            sendFunction(); // Call the appropriate send function (desktop or mobile)
        };
    });
}

// ========================================
// MESSAGE CREATION
// ========================================
function createAIMessage(text, isMobile = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ai`;

    const msgDiv = document.createElement('div');
    msgDiv.className = isMobile ? 'mobile-chat-message ai' : 'message ai-message';
    msgDiv.innerHTML = text; // Use innerHTML to render special/price tags
    wrapper.appendChild(msgDiv);

    // Add play button
    const playBtn = document.createElement('button');
    playBtn.className = 'message-play-btn';
    // Strip HTML tags for TTS text, otherwise TTS might read tags aloud
    playBtn.dataset.text = text.replace(/<[^>]*>/g, '');
    playBtn.innerHTML = ttsUnlocked
        ? '<i class="fa-solid fa-play"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>';
    playBtn.onclick = () => handlePlayClick(playBtn.dataset.text, playBtn);
    wrapper.appendChild(playBtn);

    return wrapper;
}

function createUserMessage(text, isMobile = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper user`;

    const msgDiv = document.createElement('div');
    msgDiv.className = isMobile ? 'mobile-chat-message user' : 'message user-message';
    msgDiv.textContent = text;
    wrapper.appendChild(msgDiv);

    return wrapper;
}

// ========================================
// DESKTOP CHAT FUNCTIONS
// ========================================
function openAIChat() {
    const modal = document.getElementById('aiChatModal');
    const overlay = document.getElementById('aiChatOverlay');
    const input = document.getElementById('aiChatInput');

    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    if (input) input.focus();

    // Track that desktop chat is open
    desktopChatOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent body scrolling

    // Push state to history for back button support
    // Check if the hash is already present to avoid duplicate history entries
    if (window.location.hash !== '#ai-chat') {
        history.pushState({ aiChat: 'desktop' }, 'AI Chat', '#ai-chat');
    }
    window.addEventListener('popstate', handleHistoryChange);

    // Initialize water background (if Water4Chat library is available)
    const container = document.querySelector('.ai-chat-modal .water-background-container');
    if (container && window.Water4Chat && !waterInstance) {
        waterInstance = Object.assign({}, window.Water4Chat); // Create a new instance
        waterInstance.init(container);
    }
}

function closeAIChat(shouldGoBack = true) {
    stopTTSAudio();
    const modal = document.getElementById('aiChatModal');
    const overlay = document.getElementById('aiChatOverlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    // Track that desktop chat is closed
    desktopChatOpen = false;
    document.body.style.overflow = ''; // Re-enable body scrolling

    // Remove popstate listener
    window.removeEventListener('popstate', handleHistoryChange);

    // If closing via UI (close button, escape, etc) AND the hash is present, go back in history
    if (shouldGoBack && window.location.hash === '#ai-chat') {
        history.back();
    }

    // Destroy water instance
    if (waterInstance) {
        waterInstance.destroy();
        waterInstance = null;
    }
}

// ========================================
// UNIVERSAL MESSAGE SENDING LOGIC
// ========================================
async function sendMessage(isMobile = false) {
    const sessionId = isMobile ? MOBILE_CHAT_SESSION_ID : CHAT_SESSION_ID;
    const input = document.getElementById(isMobile ? 'mobileChatInput' : 'aiChatInput');
    const messagesDiv = document.getElementById(isMobile ? 'mobileChatMessages' : 'aiMessages');
    const typingIndicator = document.getElementById('mobileTypingIndicator'); // Only for mobile
    const sendButton = document.getElementById(isMobile ? 'mobileChatSend' : 'aiChatInput').nextElementSibling; // Get the send button

    const userText = input.value.trim();

    if (!userText) {
        input.value = ''; // Clear empty input
        return;
    }

    const promptToSend = userText;

    stopTTSAudio();
    input.disabled = true;
    if (sendButton) sendButton.disabled = true;

    // Remove any previous typing indicators first
    const existingTypingMsg = messagesDiv.querySelector('.typing-msg');
    if (existingTypingMsg) existingTypingMsg.remove();
    if (isMobile && typingIndicator) typingIndicator.classList.remove('visible');

    // Add user message
    messagesDiv.appendChild(createUserMessage(userText, isMobile));
    input.value = '';

    // Scroll to bottom
    const scrollContainer = isMobile
        ? document.querySelector('.mobile-chat-container')
        : document.querySelector('.chat-messages-container');
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    // Add typing indicator
    if (isMobile && typingIndicator) {
        typingIndicator.classList.add('visible');
    } else if (!isMobile) {
        const typingWrapper = document.createElement('div');
        typingWrapper.className = 'message-wrapper ai';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-msg';
        typingDiv.style.padding = '16px 24px'; // Match normal AI message padding

        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'typing-indicator';

        // Create 3 animated dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            indicatorDiv.appendChild(dot);
        }

        typingDiv.appendChild(indicatorDiv);
        typingWrapper.appendChild(typingDiv);
        messagesDiv.appendChild(typingWrapper);
    }

    // Scroll to bottom after adding typing indicator
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }

    try {
        const payload = {
            session_id: sessionId,
            prompt: promptToSend,
            device_fingerprint: deviceFingerprint,
            store_id: STORE_ID, // Ensure store_id is sent
            // fingerprint_signature: FINGERPRINT_SIGNATURE, // Include if needed later
            // fingerprint_timestamp: FINGERPRINT_TIMESTAMP, // Include if needed later
        };

        const response = await fetch(BACKEND_URL + CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorBody}`);
        }

        const data = await response.json();
        const aiResponse = data.response || 'Sorry, I could not generate a response.';
        console.log("AI Chat: Received AI response:", aiResponse);

        // Remove typing indicator
        if (isMobile && typingIndicator) {
            typingIndicator.classList.remove('visible');
        } else if (!isMobile) {
            const typingMsg = messagesDiv.querySelector('.typing-msg');
            if (typingMsg) typingMsg.remove();
        }

        // Add AI message with special tags and TTS button
        const aiMsgWrapper = createAIMessage(aiResponse, isMobile);
        messagesDiv.appendChild(aiMsgWrapper);

        // Attach special tag click handlers
        attachSpecialTagListeners(aiMsgWrapper, input, () => sendMessage(isMobile));

        // Scroll to bottom
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }

    } catch (error) {
        console.error("AI Chat: Error sending message:", error);
        // Remove typing indicator on error
        if (isMobile && typingIndicator) {
            typingIndicator.classList.remove('visible');
        } else if (!isMobile) {
            const typingMsg = messagesDiv.querySelector('.typing-msg');
            if (typingMsg) typingMsg.remove();
        }

        const errorWrapper = createAIMessage('Sorry, I encountered an error. Please try again.', isMobile);
        messagesDiv.appendChild(errorWrapper);

        // Scroll to bottom
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    } finally {
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        if (!isMobile) input.focus();
        else input.blur(); // Keep mobile keyboard hidden after sending
    }
}

// ========================================
// WRAPPER: sendAIMessage (calls universal sendMessage for desktop)
// ========================================
function sendAIMessage() {
    return sendMessage(false);
}

// ========================================
// MOBILE CHAT FUNCTIONS
// ========================================
function openMobileChat() {
    const modal = document.getElementById('mobileChatModal');
    const overlay = document.getElementById('mobileChatOverlay');
    const input = document.getElementById('mobileChatInput');

    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    // For mobile, we generally don't auto-focus the input on open to avoid immediate keyboard popup.
    // If auto-focus is desired, uncomment: if (input) input.focus();

    // Track that mobile chat is open
    mobileChatOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent body scrolling

    // Push state to history for back button support
    if (window.location.hash !== '#ai-chat-mobile') {
        history.pushState({ aiChat: 'mobile' }, 'AI Chat', '#ai-chat-mobile');
    }
    window.addEventListener('popstate', handleHistoryChange);

    // Initialize water background
    const container = document.querySelector('.mobile-chat-modal .water-background-container');
    if (container && window.Water4Chat && !waterInstance) {
        waterInstance = Object.assign({}, window.Water4Chat);
        waterInstance.init(container);
    }
}

function closeMobileChat(shouldGoBack = true) {
    stopTTSAudio();
    const modal = document.getElementById('mobileChatModal');
    const overlay = document.getElementById('mobileChatOverlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable body scrolling

    // Track that mobile chat is closed
    mobileChatOpen = false;

    // Remove popstate listener
    window.removeEventListener('popstate', handleHistoryChange);

    // If closing via UI (close button, escape, etc) AND the hash is present, go back in history
    if (shouldGoBack && window.location.hash === '#ai-chat-mobile') {
        history.back();
    }

    // Destroy water instance
    if (waterInstance) {
        waterInstance.destroy();
        waterInstance = null;
    }
}

// ========================================
// WRAPPER: sendMobileMessage (calls universal sendMessage for mobile)
// ========================================
function sendMobileMessage() {
    return sendMessage(true);
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================
function setupEventListeners() {

    // Desktop chat input
    const aiChatInput = document.getElementById('aiChatInput');
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !aiChatInput.disabled) {
                sendAIMessage();
            }
        });
    }

    // Mobile chat input
    const mobileChatInput = document.getElementById('mobileChatInput');
    if (mobileChatInput) {
        mobileChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !mobileChatInput.disabled) {
                e.preventDefault(); // Prevent new line on mobile enter
                sendMobileMessage();
            }
        });
    }

    // Master speaker buttons (desktop and mobile share logic)
    const masterSpeakerHandler = async () => {
        if (!ttsUnlocked) {
            await attemptTTSUnlock();
        } else {
            // If already unlocked, this button should toggle the main TTS output
            // For now, it only unlocks. If full toggle is desired, more logic is needed.
            // Example: ttsUnlocked = false; updateSpeakerButtons(); stopTTSAudio();
            console.log("AI Chat: TTS is already unlocked.");
        }
    };

    const desktopSpeakerBtn = document.getElementById('desktopSpeakerBtn');
    if (desktopSpeakerBtn) {
        desktopSpeakerBtn.addEventListener('click', masterSpeakerHandler);
    }

    const mobileSpeakerBtn = document.getElementById('mobileSpeakerBtn');
    if (mobileSpeakerBtn) {
        mobileSpeakerBtn.addEventListener('click', masterSpeakerHandler);
    }

    // Greeting TTS buttons
    const desktopGreetingTTS = document.getElementById('desktop-greeting-tts');
    if (desktopGreetingTTS) {
        desktopGreetingTTS.addEventListener('click', () => {
            const text = desktopGreetingTTS.dataset.text;
            handlePlayClick(text, desktopGreetingTTS);
        });
    }

    const mobileGreetingTTS = document.getElementById('mobile-greeting-tts');
    if (mobileGreetingTTS) {
        mobileGreetingTTS.addEventListener('click', () => {
            const text = mobileGreetingTTS.dataset.text;
            handlePlayClick(text, mobileGreetingTTS);
        });
    }

    // Close modals with Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (desktopChatOpen) {
                closeAIChat();
            }
            if (mobileChatOpen) {
                closeMobileChat();
            }
            // If audio permission modal is open, close it
            const audioModal = document.getElementById('audioPermissionOverlay');
            if (audioModal && audioModal.classList.contains('active')) {
                hideAudioModal();
            }
        }
    });

    // Handle initial state if page is loaded with a chat hash
    if (window.location.hash === '#ai-chat') {
        openAIChat();
    } else if (window.location.hash === '#ai-chat-mobile') {
        openMobileChat();
    }
}

// ========================================
// AUTO-INITIALIZATION
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatSystem);
} else {
    initializeChatSystem();
}

// ========================================
// EXPORT FUNCTIONS FOR EXTERNAL USE
// ========================================
window.AIChat = {
    openDesktop: openAIChat,
    closeDesktop: closeAIChat,
    openMobile: openMobileChat,
    closeMobile: closeMobileChat,
    sendDesktopMessage: sendAIMessage,
    sendMobileMessage: sendMobileMessage,

    // Utility methods
    // setStoreId is now a no-op as it's configured from script tag
    setStoreId: (id) => {
        console.warn("AI Chat: setStoreId is deprecated. Please use data-store-id attribute on the script tag.");
    },
    getStoreId: () => STORE_ID,
    getBackendUrl: () => BACKEND_URL
};