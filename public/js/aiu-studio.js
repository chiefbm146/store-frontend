/**
 * A.I.U. Studio v3.3 - FINAL, WORKING, CORRECTED FLOW
 * This version restores the two-step finalization process and fixes all previous bugs.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG & STATE ---
    const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';
    const VIEWS = ['conversation-view', 'summary-view', 'preview-view'];
    const VIEW_LABELS = ['Conversation', 'Summary', 'Preview'];
    const MESSAGES_UNTIL_SUMMARY = 5;
    let currentUser = null, currentViewIndex = 0, messagesSinceLastSummary = 0;
    let contextualSummary = '', conversationHistory = [];
    let isWaitingForAI = false;
    let finalSynthesizedDoc = null; // To hold the document for confirmation

    // --- DOM ELEMENTS ---
    const authLoader = document.getElementById('auth-loading');
    const studioContent = document.getElementById('studio-content');
    const prevViewBtn = document.getElementById('prev-view-btn');
    const nextViewBtn = document.getElementById('next-view-btn');
    const currentViewLabel = document.getElementById('current-view-label');
    const meterPips = document.querySelectorAll('.meter-pip');
    const meterLabel = document.getElementById('meter-label');
    const chatHistoryEl = document.getElementById('studio-chat-history');
    const userInput = document.getElementById('studio-user-input');
    const sendBtn = document.getElementById('studio-send-btn');
    const summaryDisplay = document.getElementById('summary-display');
    const condensingOverlay = document.getElementById('condensing-overlay');
    const previewDisplay = document.getElementById('preview-display');
    const usernameInput = document.getElementById('ai-username');
    const synthesizeBtn = document.getElementById('synthesize-btn');
    
    // Modal Elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const finalDocumentReview = document.getElementById('final-document-review');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const cancelSaveBtn = document.getElementById('cancel-save-btn');

    // --- HELPERS ---
    const showLoading = (btn, text) => { isWaitingForAI = true; btn.disabled = true; btn.dataset.originalText = btn.innerHTML; btn.innerHTML = `<span class="spinner"></span> ${text}`; };
    const hideLoading = (btn, defaultText) => { isWaitingForAI = false; btn.disabled = false; btn.innerHTML = btn.dataset.originalText || defaultText; };
    const appendMessage = (text, sender) => { const el = document.createElement('div'); el.className = `chat-bubble ${sender}-bubble`; el.textContent = text; chatHistoryEl.appendChild(el); chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight; };
    
    // --- VIEW LOGIC ---
    function cycleView(direction) {
        document.getElementById(VIEWS[currentViewIndex]).classList.remove('active');
        currentViewIndex = (currentViewIndex + direction + VIEWS.length) % VIEWS.length;
        document.getElementById(VIEWS[currentViewIndex]).classList.add('active');
        currentViewLabel.textContent = VIEW_LABELS[currentViewIndex];
    }

    // --- METER LOGIC ---
    function updateCondensationMeter() {
        meterPips.forEach((pip, i) => pip.classList.toggle('filled', i < messagesSinceLastSummary));
        if (meterLabel) {
            meterLabel.textContent = `${messagesSinceLastSummary}/${MESSAGES_UNTIL_SUMMARY}`;
        }
    }

    function triggerCondensingAnimation() {
        const meter = document.querySelector('.condensation-meter');
        if (meter) {
            meter.classList.add('pulsing');
            setTimeout(() => meter.classList.remove('pulsing'), 2500);
        }
    }
    
    // --- API ---
    async function apiCall(endpoint, options) {
        if (!currentUser) throw new Error("Authentication required.");
        const token = await currentUser.getIdToken();
        const res = await fetch(`${BACKEND_URL}${endpoint}`, { method: 'POST', ...options, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        return res.json();
    }

    // --- MAIN CHAT LOGIC ---
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || isWaitingForAI) return;

        appendMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });
        userInput.value = '';
        messagesSinceLastSummary++;
        updateCondensationMeter();
        showLoading(sendBtn, 'Thinking...');

        const shouldSummarize = messagesSinceLastSummary >= MESSAGES_UNTIL_SUMMARY;

        try {
            const response = await apiCall('/api/aiu/studio-chat', {
                body: JSON.stringify({ conversationHistory, contextualSummary })
            });

            appendMessage(response.chatResponse, 'ai');
            conversationHistory.push({ role: 'ai', content: response.chatResponse });
            previewDisplay.textContent = response.personaPreview;

            if (shouldSummarize) {
                triggerCondensingAnimation();
                const summaryResponse = await apiCall('/api/aiu/summarize-context', {
                    body: JSON.stringify({ contextualSummary, conversationHistory })
                });
                contextualSummary = summaryResponse.updatedSummary;
                summaryDisplay.textContent = contextualSummary;
                conversationHistory = [];
                messagesSinceLastSummary = 0;
                updateCondensationMeter();
            }
        } catch (error) {
            appendMessage(`Error: ${error.message}`, 'ai');
        } finally {
            hideLoading(sendBtn, 'Send Message');
        }
    }
    
    // --- FINALIZATION STEP 1: SYNTHESIZE ---
    async function synthesizePersona() {
        const personaBook = previewDisplay.textContent;
        if (!personaBook || personaBook.includes('will be drafted here')) {
            return alert("Please chat with the Architect first to generate your persona document.");
        }
        
        // Store the plain text persona book for saving
        finalSynthesizedDoc = personaBook;
        
        // Display the plain text for review (no JSON.stringify needed)
        finalDocumentReview.textContent = personaBook;
        confirmationModal.style.display = 'flex';
    }
    
    // --- FINALIZATION STEP 2: CONFIRM AND SAVE ---
    async function confirmAndSave() {
        const username = usernameInput.value.trim().toLowerCase();
        if (!username) return alert("Please choose a unique username.");
        if (!finalSynthesizedDoc) return alert("No persona document to save.");
        
        showLoading(confirmSaveBtn, 'Imprinting...');
        try {
            const response = await apiCall('/api/aiu/save-persona', {
                body: JSON.stringify({ username, personaBook: finalSynthesizedDoc })
            });

            studioContent.innerHTML = `<div style="text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 5rem;">✨</div><h1>Persona Imprinted!</h1>
                <p>Your AI, "${response.personaName}", is now live in the library.</p>
                <div style="background: var(--aiu-surface); padding: 20px; border-radius: 8px; margin: 20px 0; width:100%; max-width: 500px;">
                    <p style="color: var(--aiu-text-secondary); margin-bottom: 10px;">Your Shareable Link:</p>
                    <input type="text" readonly value="${response.shareableLink}" class="form-input" style="text-align: center;">
                </div>
                <a href="${response.shareableLink}" class="btn btn-primary">Talk to Your AI</a>
            </div>`;
            confirmationModal.style.display = 'none';

        } catch(error) {
            alert(`Error: ${error.message}`);
            hideLoading(confirmSaveBtn, '✅ Confirm & Go Live');
        }
    }
    
    // --- INIT & EVENT LISTENERS ---
    function initialize() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                authLoader.style.display = 'none';
                studioContent.style.display = 'flex';
            } else {
                window.location.href = '/aiu-create';
            }
        });

        prevViewBtn.addEventListener('click', () => cycleView(-1));
        nextViewBtn.addEventListener('click', () => cycleView(1));
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Correctly wire the buttons to their respective functions
        synthesizeBtn.addEventListener('click', synthesizePersona);
        confirmSaveBtn.addEventListener('click', confirmAndSave);
        cancelSaveBtn.addEventListener('click', () => { confirmationModal.style.display = 'none'; });
    }

    // Start the application
    initialize();
});