/**
 * Universal AI Chat Widget v3.0 - God Module
 * Self-configuring, dynamically-branded AI chat module.
 *
 * HOW TO USE:
 * Include this file on any webpage with data-store-id attribute:
 * <script src="path/to/ai-chat.js" data-store-id="moon-tide"></script>
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
let SIGN_FINGERPRINT_ENDPOINT = null;

function configureFromScriptTag() {
    const scriptTag = document.querySelector('script[src*="ai-chat.js"]');
    if (!scriptTag) {
        return false;
    }

    STORE_ID = scriptTag.dataset.storeId;
    if (!STORE_ID) {
        return false;
    }

    // ========================================
    // THE ONE TRUE BACKEND - ALL STORES CONVERGE HERE
    // ========================================
    BACKEND_URL = 'https://stores-backend-52450564461.us-central1.run.app';

    // Dynamically construct endpoints using store_id
    CHAT_ENDPOINT = `/api/v1/${STORE_ID}/chat`;
    TTS_ENDPOINT = `/api/v1/${STORE_ID}/tts`;
    SIGN_FINGERPRINT_ENDPOINT = `/api/v1/${STORE_ID}/sign-fingerprint`;

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
// INJECT CSS STYLES
// ========================================
function injectChatCSS() {
    if (document.getElementById('aiChatStyles')) return; // Already injected

    const style = document.createElement('style');
    style.id = 'aiChatStyles';
    style.textContent = `
        /* === AI CHAT ICON (BOTTOM RIGHT) === */
        .ai-chat-icon {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 70px;
            height: 70px;
            background: #FFFFFF;
            border: 3px solid #1d4ed8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 0 20px rgba(29, 78, 216, 0.6), 0 4px 20px rgba(29, 78, 216, 0.4);
            transition: all 0.3s ease;
        }
        .ai-chat-icon:hover {
            transform: scale(1.15);
            box-shadow: 0 0 30px rgba(29, 78, 216, 0.8), 0 8px 30px rgba(29, 78, 216, 0.6);
        }

        /* === AI CHAT MODAL (DESKTOP) === */
        .ai-chat-modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 900px;
            height: 85vh;
            background: #FFFFFF;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            overflow: hidden;
            flex-direction: column;
        }
        .ai-chat-modal.active {
            display: flex;
        }
        .ai-chat-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 9999;
        }
        .ai-chat-overlay.active {
            display: block;
        }
        .chat-modal-header {
            background: linear-gradient(135deg, #00b4a6 0%, #00d4d4 50%, #0088cc 100%);
            padding: 25px 30px;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 20px rgba(0, 180, 166, 0.3);
        }
        .chat-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .chat-modal-close {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.4);
            color: #FFFFFF;
            font-size: 1.5rem;
            cursor: pointer;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        .chat-modal-close:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
            transform: rotate(90deg);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }
        .chat-modal-body {
            flex: 1;
            position: relative;
            background: #0a0f14;
            overflow: hidden;
        }
        .water-background-container {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 0; pointer-events: none; overflow: hidden;
        }
        .water-background-container canvas {
            display: block; width: 100% !important; height: 100% !important;
        }
        .chat-messages-container {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px 15px;
        }
        .messages {
            display: flex;
            flex-direction: column;
            gap: 15px;
            background: transparent;
            width: 100%;
            padding: 0;
        }
        .messages > * {
            max-width: 80%;
        }
        .message {
            padding: 16px 24px;
            border-radius: 20px;
            line-height: 1.6;
            word-wrap: break-word;
            overflow-wrap: break-word;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        .ai-message {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 250, 255, 0.95) 100%);
            align-self: flex-start;
            color: #1a1a1a;
            position: relative;
            padding-left: 50px;
        }
        .ai-message::before {
            content: '🤖';
            position: absolute;
            left: 12px;
            top: 12px;
            font-size: 1.5rem;
        }
        .user-message {
            background: linear-gradient(135deg, #00b4a6 0%, #0088cc 100%);
            color: #FFFFFF;
            align-self: flex-end;
            max-width: 70%;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: pre-wrap;
        }
        .chat-modal-input {
            display: flex;
            gap: 12px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(0, 180, 166, 0.1) 0%, rgba(0, 136, 204, 0.1) 100%);
            border-top: 2px solid rgba(0, 180, 166, 0.2);
        }
        .chat-modal-input input {
            flex: 1;
            padding: 15px 20px;
            border: 2px solid #E0E0E0;
            border-radius: 25px;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s ease;
        }
        .chat-modal-input input:focus {
            border-color: #00b4a6;
            box-shadow: 0 0 0 3px rgba(0, 180, 166, 0.1);
        }
        .chat-modal-input button {
            padding: 15px 35px;
            background: linear-gradient(135deg, #00b4a6 0%, #0088cc 100%);
            color: #FFFFFF;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 180, 166, 0.3);
        }
        .chat-modal-input button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 180, 166, 0.4);
        }
        .chat-modal-input button:active {
            transform: translateY(0);
        }
        .chat-modal-input button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* === MESSAGE WRAPPERS === */
        .message-wrapper {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            width: 100%;
        }
        .message-wrapper.ai {
            justify-content: flex-start;
        }
        .message-wrapper.user {
            justify-content: flex-end;
        }

        /* === PLAY BUTTON STYLING === */
        .message-play-btn {
            flex-shrink: 0;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 2px solid rgba(0, 180, 166, 0.3);
            background: rgba(255, 255, 255, 0.9);
            color: #00b4a6;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            align-self: flex-end;
        }
        .message-play-btn:hover {
            background: rgba(0, 180, 166, 0.1);
            border-color: #00b4a6;
            transform: scale(1.1);
        }
        .message-play-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* === MASTER SPEAKER BUTTON === */
        .chat-header-controls {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .master-speaker-btn {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.4);
            color: #FFFFFF;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            transition: all 0.3s ease;
        }
        .master-speaker-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
            transform: scale(1.1);
        }
        .master-speaker-btn.unlocked {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.6);
        }

        /* === TYPING INDICATOR === */
        .typing-indicator {
            display: flex;
            gap: 6px;
            align-items: flex-end;
        }

        .typing-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #1a1a1a;
            opacity: 0.7;
            animation: desktopBounce 1.4s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes desktopBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
            30% { transform: translateY(-8px); opacity: 1; }
        }

        /* === AUDIO PERMISSION MODAL === */
        .audio-permission-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            z-index: 10001;
            align-items: center;
            justify-content: center;
        }
        .audio-permission-overlay.active {
            display: flex;
        }
        .audio-permission-modal {
            background: #FFFFFF;
            border-radius: 24px;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .audio-permission-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .audio-permission-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 15px;
        }
        .audio-permission-text {
            font-size: 1rem;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .audio-permission-buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .audio-permission-enable,
        .audio-permission-skip {
            padding: 15px 30px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .audio-permission-enable {
            background: linear-gradient(135deg, #00b4a6 0%, #0088cc 100%);
            color: #FFFFFF;
            border: none;
        }
        .audio-permission-enable:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 180, 166, 0.4);
        }
        .audio-permission-skip {
            background: transparent;
            border: 2px solid #E0E0E0;
            color: #666;
        }
        .audio-permission-skip:hover {
            background: #F5F5F5;
            border-color: #D0D0D0;
        }

        /* === MOBILE STYLES === */
        .mobile-chat-fab {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #FFFFFF;
            border: 3px solid #1d4ed8;
            color: #1d4ed8;
            border-radius: 50%;
            font-size: 2rem;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 0 20px rgba(29, 78, 216, 0.6), 0 4px 20px rgba(29, 78, 216, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mobile-chat-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
        }

        .mobile-chat-overlay.active {
            display: block;
        }

        .mobile-chat-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #FFFFFF;
            z-index: 10000;
            flex-direction: column;
        }

        .mobile-chat-modal.active {
            display: flex;
        }

        .mobile-chat-header {
            background: linear-gradient(135deg, #00b4a6 0%, #00d4d4 50%, #0088cc 100%);
            padding: 20px;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .mobile-chat-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0;
        }

        .mobile-header-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .mobile-speaker-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: #FFFFFF;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }

        .mobile-speaker-btn.unlocked {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
        }

        .mobile-chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: #FFFFFF;
            font-size: 1.25rem;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .mobile-chat-body {
            flex: 1;
            position: relative;
            background: #0a0f14;
            overflow: hidden;
        }

        .mobile-chat-container {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 20px;
        }

        .mobile-chat-messages {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .mobile-chat-message {
            padding: 14px 18px;
            border-radius: 16px;
            max-width: 85%;
            line-height: 1.5;
            font-size: 0.95rem;
        }

        .mobile-chat-message.ai {
            background: #FFFFFF;
            align-self: flex-start;
            border: 1px solid #E0E0E0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .mobile-chat-message.user {
            background: linear-gradient(135deg, #00b4a6 0%, #0088cc 100%);
            color: #FFFFFF;
            align-self: flex-end;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: pre-wrap;
        }

        .mobile-chat-input-area {
            display: flex;
            gap: 10px;
            padding: 15px 20px;
            background: #FFFFFF;
            border-top: 1px solid #E0E0E0;
            flex-shrink: 0;
        }

        .mobile-chat-input {
            flex: 1;
            padding: 14px 18px;
            border: 2px solid #E0E0E0;
            border-radius: 25px;
            font-size: 1rem;
            outline: none;
        }

        .mobile-chat-input:focus {
            border-color: #00b4a6;
        }

        .mobile-chat-send {
            padding: 14px 22px;
            background: linear-gradient(135deg, #00b4a6 0%, #0088cc 100%);
            color: #FFFFFF;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
        }

        .mobile-typing-indicator {
            display: none;
            align-items: center;
            gap: 6px;
            padding: 14px 18px;
            background: #FFFFFF;
            border-radius: 16px;
            border: 1px solid #E0E0E0;
            position: absolute;
            bottom: 20px;
            left: 20px;
            z-index: 2;
        }

        .mobile-typing-indicator.visible {
            display: flex;
        }

        .mobile-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00b4a6;
            animation: mobileBounce 1.4s ease-in-out infinite;
        }

        .mobile-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .mobile-typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes mobileBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-8px); }
        }

        /* === RESPONSIVE === */
        @media (max-width: 768px) {
            .ai-chat-icon { display: none !important; }
            .ai-chat-modal { display: none !important; }
            .ai-chat-overlay { display: none !important; }
            .mobile-chat-fab { display: flex !important; }
        }
        @media (min-width: 769px) {
            .mobile-chat-fab { display: none !important; }
            .mobile-chat-modal { display: none !important; }
            .mobile-chat-overlay { display: none !important; }
            .ai-chat-icon { display: flex !important; }
        }

        .message-wrapper .message,
        .message-wrapper .ai-message,
        .message-wrapper .user-message {
            width: -moz-fit-content;
            width: fit-content;
        }

        .message-wrapper .mobile-chat-message {
            width: -moz-fit-content;
            width: fit-content;
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// INJECT HTML ELEMENTS
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
let waterInstance = null;
let ttsUnlocked = false;
let isPlaying = false;
let currentAudio = null;
let audioCache = new Map();
let ttsAudio = null;
let FINGERPRINT_SIGNATURE = null;
let FINGERPRINT_TIMESTAMP = null;
let desktopChatOpen = false;
let mobileChatOpen = false;
let BOOKING_CONTEXT = {
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
        closeAIChat(false);
    }

    // Check if mobile chat is open and hash is no longer #ai-chat-mobile
    if (mobileChatOpen && window.location.hash !== '#ai-chat-mobile') {
        closeMobileChat(false);
    }
}

// ========================================
// INITIALIZATION
// ========================================
function initializeChatSystem() {
    const configured = configureFromScriptTag();
    if (!configured) {
        return;
    }

    // Backend Wakeup Ping
    (async () => {
        try {
            const wakeupUrl = `${BACKEND_URL}/api/v1/${STORE_ID}/wakeup`;
            fetch(wakeupUrl).catch(() => { });
        } catch (e) { }
    })();

    // Inject Font Awesome for icons (BEFORE CSS to ensure availability)
    injectFontAwesome();

    // Inject CSS and HTML
    injectChatCSS();
    injectChatHTML();

    // Get audio element (now exists from HTML injection)
    ttsAudio = document.getElementById('ttsAudio');

    // Initialize sessions
    initializeChatSession();
    initMobileChatSession();
    initializeDeviceFingerprint();

    // Set up event listeners
    setupEventListeners();

    // Show chat icons immediately
    document.getElementById('desktopChatIcon').style.display = 'flex';
    document.getElementById('mobileChatFab').style.display = 'flex';
}

function initializeChatSession() {
    CHAT_SESSION_ID = 'session_' + crypto.randomUUID();
}

function initMobileChatSession() {
    MOBILE_CHAT_SESSION_ID = 'mobile_' + crypto.randomUUID();
}

function initializeDeviceFingerprint() {
    const formFactor = window.innerWidth < 768 ? 'mobile' : 'desktop';
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelDensity = (window.devicePixelRatio || 1).toFixed(1);
    deviceFingerprint = `${formFactor}_${screenWidth}x${screenHeight}_${pixelDensity}`;
}

// ========================================
// TTS SYSTEM - AUDIO MODAL
// ========================================
function showAudioModal() {
    const modal = document.getElementById('audioPermissionOverlay');
    if (modal) modal.classList.add('active');
}

function hideAudioModal() {
    const modal = document.getElementById('audioPermissionOverlay');
    if (modal) modal.classList.remove('active');
}

async function attemptTTSUnlock() {
    if (ttsUnlocked) return true;

    return new Promise((resolve) => {
        showAudioModal();

        const enableBtn = document.getElementById('audioEnableBtn');
        const skipBtn = document.getElementById('audioSkipBtn');

        if (enableBtn) {
            enableBtn.onclick = async () => {
                try {
                    // Play unlock sound to satisfy browser autoplay policy
                    const testAudio = new Audio('/sounds/unlock.mp3?v=1.0');
                    testAudio.volume = 0.5;
                    await testAudio.play();

                    ttsUnlocked = true;

                    // Update speaker buttons
                    updateSpeakerButtons();
                    hideAudioModal();
                    resolve(true);
                } catch (error) {
                    hideAudioModal();
                    resolve(false);
                }
            };
        }

        if (skipBtn) {
            skipBtn.onclick = () => {
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
            if (icon) icon.className = 'fa-solid fa-volume-high';
        }
        if (mobileBtn) {
            mobileBtn.classList.add('unlocked');
            const icon = mobileBtn.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-volume-high';
        }
    }

    // Update all play buttons including greeting buttons
    document.querySelectorAll('.message-play-btn').forEach(btn => {
        const icon = btn.querySelector('i');
        if (ttsUnlocked) {
            icon.className = 'fa-solid fa-play';
        } else {
            icon.className = 'fa-solid fa-volume-xmark';
        }
    });
}

// ========================================
// TTS SYSTEM - AUDIO GENERATION & PLAYBACK
// ========================================
async function getTTSAudio(text) {
    const cacheKey = text.substring(0, 100);
    if (audioCache.has(cacheKey)) {
        return audioCache.get(cacheKey);
    }

    try {
        const response = await fetch(`${BACKEND_URL}${TTS_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (response.ok) {
            const data = await response.json();
            const audioData = data.audio || data.audio_base64;
            if (audioData) {
                audioCache.set(cacheKey, audioData);
                return audioData;
            }
        }
    } catch (error) { }
    return null;
}

async function playTTSAudio(base64Audio) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Detect MIME type from base64 header
    let mimeType = 'audio/mpeg';
    if (base64Audio.startsWith('T2d')) {
        mimeType = 'audio/ogg';
    } else if (base64Audio.startsWith('Ukl')) {
        mimeType = 'audio/wav';
    } else if (base64Audio.startsWith('//u') || base64Audio.startsWith('SUQ')) {
        mimeType = 'audio/mpeg';
    }

    ttsAudio.src = `data:${mimeType};base64,${base64Audio}`;
    ttsAudio.volume = 1.0;
    isPlaying = true;
    currentAudio = ttsAudio;

    ttsAudio.onended = () => {
        isPlaying = false;
        updatePlayButtonStates();
    };

    try {
        await ttsAudio.play();
    } catch (err) {
        isPlaying = false;
    }
}

function stopTTSAudio() {
    if (ttsAudio) {
        ttsAudio.pause();
        ttsAudio.currentTime = 0;
    }
    isPlaying = false;
    updatePlayButtonStates();
}

function updatePlayButtonStates(playingText = null) {
    document.querySelectorAll('.message-play-btn').forEach(btn => {
        const msgText = btn.dataset.text;
        const icon = btn.querySelector('i');

        if (!ttsUnlocked) {
            icon.className = 'fa-solid fa-volume-xmark';
        } else if (msgText === playingText && isPlaying) {
            icon.className = 'fa-solid fa-stop';
        } else {
            icon.className = 'fa-solid fa-play';
        }
    });
}

async function handlePlayClick(text, button) {
    const icon = button.querySelector('i');

    // If not unlocked, unlock first
    if (!ttsUnlocked) {
        const unlocked = await attemptTTSUnlock();
        if (!unlocked) return;
        updatePlayButtonStates();
        return;
    }

    // If playing this message, stop it
    if (icon.classList.contains('fa-stop')) {
        stopTTSAudio();
        return;
    }

    // Play the audio
    icon.className = 'fa-solid fa-spinner fa-spin';
    button.disabled = true;

    try {
        const audioData = await getTTSAudio(text);
        if (audioData) {
            await playTTSAudio(audioData);
            updatePlayButtonStates(text);
        }
    } catch (error) {
    } finally {
        button.disabled = false;
    }
}

// ========================================
// SPECIAL TAG HANDLING
// ========================================
function attachSpecialTagListeners(container, inputElement, sendFunction) {
    container.querySelectorAll('special').forEach(el => {
        el.style.cursor = 'pointer';
        el.onclick = (e) => {
            e.stopPropagation();
            const text = el.textContent;
            inputElement.value = text;
            sendFunction();
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
    playBtn.dataset.text = text.replace(/<[^>]*>/g, ''); // Strip HTML for TTS
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

    // Push state to history for back button support
    history.pushState({ aiChat: 'desktop' }, 'AI Chat', '#ai-chat');
    window.addEventListener('popstate', handleHistoryChange);

    // Initialize water background
    const container = document.querySelector('.ai-chat-modal .water-background-container');
    if (container && window.Water4Chat && !waterInstance) {
        waterInstance = Object.assign({}, window.Water4Chat);
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

    // Remove popstate listener
    window.removeEventListener('popstate', handleHistoryChange);

    // If closing via UI (close button, escape, etc), go back in history
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
    const userText = input.value.trim();

    if (!userText) return;

    // The backend only needs the current prompt. It manages the full history.
    const promptToSend = userText;

    stopTTSAudio();
    input.disabled = true;
    const sendButton = input.nextElementSibling;
    if (sendButton) sendButton.disabled = true;

    // -----------------------------------------------------------------
    // THE AMNESIAC VIEWPORT ENGINE
    // -----------------------------------------------------------------

    // STEP 1: EXECUTE YOUR COMMAND. WIPE THE SLATE CLEAN.
    messagesDiv.innerHTML = '';

    // STEP 2: RE-ESTABLISH THE IMMEDIATE CONTEXT.
    // Render ONLY the user's current message. The screen is clean and focused.
    messagesDiv.appendChild(createUserMessage(userText, isMobile));
    input.value = '';

    // STEP 3: SHOW THE AI IS THINKING.
    // The typing indicator now appears in the clean viewport.
    let typingWrapper;
    const typingIndicator = document.getElementById('mobileTypingIndicator');
    if (isMobile) {
        if (typingIndicator) typingIndicator.classList.add('visible');
    } else {
        typingWrapper = document.createElement('div');
        typingWrapper.className = 'message-wrapper ai typing-wrapper';
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.style.padding = '16px 24px';
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'typing-indicator';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            indicatorDiv.appendChild(dot);
        }
        typingDiv.appendChild(indicatorDiv);
        typingWrapper.appendChild(typingDiv);
        messagesDiv.appendChild(typingWrapper);
    }
    // No scroll logic needed. The viewport is already at the top of the new content.

    try {
        // STEP 4: SEND THE PROMPT. THE BACKEND HANDLES THE MEMORY.
        const payload = {
            session_id: sessionId,
            prompt: promptToSend,
            device_fingerprint: deviceFingerprint
            // ... (Add signature/timestamp if available)
        };

        const response = await fetch(BACKEND_URL + CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const aiResponse = data.response || 'An error occurred.';

        // STEP 5: DELIVER THE PUNCHLINE.
        // Remove the typing indicator.
        if (typingWrapper) typingWrapper.remove();
        if (isMobile && typingIndicator) {
            typingIndicator.classList.remove('visible');
        }

        // Render the AI's response. The screen now contains ONLY the perfect, two-message exchange.
        const aiMsgWrapper = createAIMessage(aiResponse, isMobile);
        messagesDiv.appendChild(aiMsgWrapper);
        attachSpecialTagListeners(aiMsgWrapper, input, () => sendMessage(isMobile));

    } catch (error) {
        if (typingWrapper) typingWrapper.remove();
        if (isMobile && typingIndicator) {
            typingIndicator.classList.remove('visible');
        }
        const errorWrapper = createAIMessage('Sorry, an error occurred. Please try again.', isMobile);
        messagesDiv.appendChild(errorWrapper);
    } finally {
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        if (!isMobile) input.focus();
        if (isMobile) input.blur();
    }
}

// ========================================
// WRAPPER: sendAIMessage (calls universal sendMessage)
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

    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Track that mobile chat is open
    mobileChatOpen = true;

    // Push state to history for back button support
    history.pushState({ aiChat: 'mobile' }, 'AI Chat', '#ai-chat-mobile');
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
    document.body.style.overflow = '';

    // Track that mobile chat is closed
    mobileChatOpen = false;

    // Remove popstate listener
    window.removeEventListener('popstate', handleHistoryChange);

    // If closing via UI (close button, escape, etc), go back in history
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
// WRAPPER: sendMobileMessage (calls universal sendMessage)
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
                sendMobileMessage();
            }
        });
    }

    // Speaker buttons
    const desktopSpeakerBtn = document.getElementById('desktopSpeakerBtn');
    if (desktopSpeakerBtn) {
        desktopSpeakerBtn.addEventListener('click', async () => {
            if (!ttsUnlocked) {
                await attemptTTSUnlock();
            }
        });
    }

    const mobileSpeakerBtn = document.getElementById('mobileSpeakerBtn');
    if (mobileSpeakerBtn) {
        mobileSpeakerBtn.addEventListener('click', async () => {
            if (!ttsUnlocked) {
                await attemptTTSUnlock();
            }
        });
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
            closeAIChat();
            closeMobileChat();
            hideAudioModal();
        }
    });
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
    setStoreId: (id) => {
    },
    getStoreId: () => STORE_ID,
    getBackendUrl: () => BACKEND_URL
};
