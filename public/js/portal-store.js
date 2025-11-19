// public/js/portal-store.js
import appStore from './app-store.js';
import ttsManager from './tts-manager.js'; // IMPORT: Audio playback manager

const portalStore = {
    state: {
        lastUserMessage: null,
        lastAiMessage: null,
        isTyping: false,
        activeModule: null, // NEW: To track the currently active module
    },

    actions: {
        startSendMessage(state, { userText }) {
            // --- ARCHITECTURAL FIX: Stop audio on new conversation turn ---
            if (ttsManager && ttsManager.isPlaying) {
                console.log("[PortalStore] New message sent. Stopping any active TTS.");
                ttsManager.stop();
            }
            // ---------------------------------------------------------------

            if (userText !== null) {
                state.lastUserMessage = userText;
                state.lastAiMessage = null;
            }
            state.isTyping = true;
        },

        receiveAiResponse(state, { aiText }) {
            state.lastAiMessage = aiText;
            state.isTyping = false;
        },

        // NEW: Action to set the active module
        setActiveModule(state, { module }) {
            state.activeModule = module;
        },

        // NEW: A dedicated action to completely wipe the chat view.
        clearChatState(state) {
            // --- ARCHITECTURAL FIX: Stop audio on chat state clear ---
            if (ttsManager && ttsManager.isPlaying) {
                console.log("[PortalStore] Chat state cleared. Stopping any active TTS.");
                ttsManager.stop();
            }
            // ---------------------------------------------------------------

            state.lastUserMessage = null;
            state.lastAiMessage = null;
            state.isTyping = false;
            state.activeModule = null; // Also reset the active module
            console.log("[PortalStore] Chat state has been completely cleared.");
        },

        // REFACTORED: Now this ONLY sets the success message.
        showSuccessMessage(state, { workshopName, participants }) {
            state.lastUserMessage = null;
            state.lastAiMessage = `A heartfelt thank you for your booking! We are truly honored that you've chosen to invest in the <special>${workshopName}</special> experience for your group of <special>${participants}</special> participants.\n\nTaking this step is significant, and we're so excited to welcome you. A detailed confirmation email is on its way to you now.\n\nIs there anything else I can assist you with today?`;
            state.isTyping = false;
            console.log("[PortalStore] Success message displayed");
        },

        // REFACTORED: Now this ONLY sets the cancellation message.
        showCancellationMessage(state) {
            state.lastUserMessage = null;
            state.lastAiMessage = "Of course. The booking has been cancelled, and no payment information has been saved. We understand that these are important decisions.\n\nAll of our <special>Workshop</special> details are here for you whenever you're ready to explore again. Please let me know if you have any other questions!";
            state.isTyping = false;
            console.log("[PortalStore] Cancellation message displayed");
        },
    },

    dispatch(actionName, payload) {
        if (this.actions[actionName]) {
            this.actions[actionName](this.state, payload);
            // Broadcast a change event for the controller to hear
            window.dispatchEvent(new CustomEvent('portal-state-changed'));
        }
    }
};

export default portalStore;
