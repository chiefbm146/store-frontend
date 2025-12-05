/**
 * A.I.U. Studio v3.0 - Focus View Controller
 * 
 * Responsibilities:
 * 1. Verify user authentication and redirect if needed
 * 2. Manage view cycling between Conversation, Summary, and Preview
 * 3. Track and display condensation meter (messages until summarization)
 * 4. Handle chat interaction with Persona Architect AI
 * 5. Trigger condensing animation and auto-switch to Summary view
 * 6. Handle Core Memory prompts (Yes/No)
 * 7. Implement two-step finalization (synthesize → confirm → save)
 */

const studioController = (() => {
    // --- Configuration ---
    const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';
    const VIEWS = ['conversation-view', 'summary-view', 'preview-view'];
    const VIEW_LABELS = ['Conversation', 'Summary', 'Preview'];
    const MESSAGES_UNTIL_SUMMARY = 5;

    // --- DOM Elements ---
    const authLoader = document.getElementById('auth-loading');
    const studioContent = document.getElementById('studio-content');

    // Header elements
    const prevViewBtn = document.getElementById('prev-view-btn');
    const nextViewBtn = document.getElementById('next-view-btn');
    const currentViewLabel = document.getElementById('current-view-label');

    // Condensation meter (now in conversation view)
    const meterPips = document.querySelectorAll('.meter-pip');
    const meterLabel = document.querySelector('.meter-label');

    // Conversation view
    const chatHistory = document.getElementById('studio-chat-history');
    const userInput = document.getElementById('studio-user-input');
    const sendBtn = document.getElementById('studio-send-btn');

    // Summary view
    const summaryDisplay = document.getElementById('summary-display');
    const condensingOverlay = document.getElementById('condensing-overlay');

    // Preview view
    const previewDisplay = document.getElementById('preview-display');

    // Core Memory
    const coreMemoryPrompt = document.getElementById('core-memory-prompt');
    const coreMemoryQuestion = document.getElementById('core-memory-question');
    const coreMemoryYesBtn = document.getElementById('core-memory-yes');
    const coreMemoryNoBtn = document.getElementById('core-memory-no');

    // Finalization
    const usernameInput = document.getElementById('ai-username');
    const synthesizeBtn = document.getElementById('synthesize-btn');

    // Modal
    const confirmationModal = document.getElementById('confirmation-modal');
    const finalDocumentReview = document.getElementById('final-document-review');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const cancelSaveBtn = document.getElementById('cancel-save-btn');

    // --- State ---
    let currentUser = null;
    let firebaseAuth;
    let currentViewIndex = 0;
    let messagesSinceLastSummary = 0; // Start at 0
    let coreMemory = {};
    let contextualSummary = '';
    let conversationHistory = [];
    let finalDocument = null;
    let pendingCoreMemoryKey = null;
    let isWaitingForAI = false;

    // --- Helper Functions ---
    function showLoading(button, text = 'Loading...') {
        isWaitingForAI = true;
        button.disabled = true;
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.innerHTML = `<span class="spinner"></span> ${text}`;
    }

    function hideLoading(button) {
        isWaitingForAI = false;
        button.disabled = false;
        const originalText = button.dataset.originalText || 'Send';
        button.innerHTML = originalText;
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}-bubble`;
        bubble.textContent = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        conversationHistory.push({ role: sender, content: text });
    }

    // --- View Cycling Logic ---
    function cycleView(direction) {
        // Remove active class from current view
        const currentView = document.getElementById(VIEWS[currentViewIndex]);
        currentView.classList.remove('active');

        // Calculate new index with wrapping
        currentViewIndex = (currentViewIndex + direction + VIEWS.length) % VIEWS.length;

        // Add active class to new view
        const newView = document.getElementById(VIEWS[currentViewIndex]);
        newView.classList.add('active');

        // Update label
        currentViewLabel.textContent = VIEW_LABELS[currentViewIndex];
    }

    function switchToView(viewName) {
        const targetIndex = VIEWS.indexOf(viewName);
        if (targetIndex === -1) return;

        // Remove active from current
        document.getElementById(VIEWS[currentViewIndex]).classList.remove('active');

        // Set new index and activate
        currentViewIndex = targetIndex;
        document.getElementById(VIEWS[currentViewIndex]).classList.add('active');
        currentViewLabel.textContent = VIEW_LABELS[currentViewIndex];
    }

    // --- Condensation Meter Logic (CORRECTED) ---
    function updateCondensationMeter() {
        // Update pips to show filled state
        meterPips.forEach((pip, index) => {
            if (index < messagesSinceLastSummary) {
                pip.classList.add('filled');
            } else {
                pip.classList.remove('filled');
            }
        });

        // Update label text
        if (meterLabel) {
            meterLabel.textContent = `${messagesSinceLastSummary}/${MESSAGES_UNTIL_SUMMARY} Messages`;
        }
    }

    function resetCondensationMeter() {
        messagesSinceLastSummary = 0;
        meterPips.forEach(pip => {
            pip.classList.remove('filled', 'pulsing');
        });
        updateCondensationMeter();
    }

    async function triggerSummarizationAnimation() {
        // Add pulsing effect to all pips
        meterPips.forEach(pip => pip.classList.add('pulsing'));

        // Switch to Summary view
        switchToView('summary-view');

        // Show condensing overlay
        condensingOverlay.style.display = 'flex';

        // Wait 2.5 seconds for effect
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Hide overlay
        condensingOverlay.style.display = 'none';

        // Remove pulsing and reset meter
        meterPips.forEach(pip => pip.classList.remove('pulsing'));
        resetCondensationMeter();
    }

    // --- Summary & Preview Updates ---
    function updateSummary(newSummary) {
        if (!newSummary || newSummary.trim() === '') {
            summaryDisplay.innerHTML = '<p class="placeholder-text">As you chat, the AI will condense your conversation into an evolving summary. This is the AI\'s "long-term memory" of your personality and knowledge.</p>';
            return;
        }

        contextualSummary = newSummary;
        summaryDisplay.innerHTML = `<p style="margin: 0; white-space: pre-wrap;">${newSummary}</p>`;
    }

    function updatePreview(previewData) {
        if (!previewData || previewData.trim() === '') {
            previewDisplay.innerHTML = '<code class="placeholder-text">Your persona\'s structured data will be built here as you chat with the Architect. This is the "code" of your digital mind.</code>';
            return;
        }

        // Try to format as JSON
        try {
            const parsed = JSON.parse(previewData);
            previewDisplay.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            previewDisplay.textContent = previewData;
        }
    }

    // --- API Communication ---
    async function apiCall(endpoint, options = {}) {
        if (!currentUser) throw new Error("Authentication required.");
        const token = await currentUser.getIdToken();

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'API request failed.');
        }
        return response.json();
    }

    // --- Core Logic ---
    function initializeStudio() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebaseAuth = firebase.auth();
            firebaseAuth.onAuthStateChanged(handleAuthStateChanged);
        } else {
            setTimeout(initializeStudio, 100);
        }
    }

    function handleAuthStateChanged(user) {
        if (user) {
            currentUser = user;
            authLoader.style.display = 'none';
            studioContent.style.display = 'flex';

            // Add initial greeting to conversation history
            const initialGreeting = chatHistory.querySelector('.ai-bubble').textContent;
            conversationHistory.push({ role: 'ai', content: initialGreeting });

            // Initialize meter display
            updateCondensationMeter();
        } else {
            console.warn("A.I.U. Studio: No user signed in. Redirecting...");
            window.location.href = '/aiu-create';
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || isWaitingForAI) return;

        appendMessage(message, 'user');
        userInput.value = '';

        // Increment message count AFTER sending
        messagesSinceLastSummary++;
        updateCondensationMeter();

        showLoading(sendBtn, 'Architect is thinking...');

        // Check if we should trigger summarization animation
        const shouldSummarize = messagesSinceLastSummary >= MESSAGES_UNTIL_SUMMARY;

        try {
            // Trigger animation BEFORE API call if at threshold
            if (shouldSummarize) {
                await triggerSummarizationAnimation();
            }

            const response = await apiCall('/api/aiu/studio-chat', {
                body: JSON.stringify({
                    coreMemory: coreMemory,
                    contextualSummary: contextualSummary,
                    conversationHistory: conversationHistory
                })
            });

            // Update conversation history from backend
            if (response.conversationHistory !== undefined) {
                conversationHistory = response.conversationHistory;
            }

            // Update chat with AI response
            if (response.chatResponse) {
                appendMessage(response.chatResponse, 'ai');
            }

            // Update summary and preview
            if (response.updatedSummary) {
                updateSummary(response.updatedSummary);
            }

            if (response.personaPreview) {
                updatePreview(response.personaPreview);
            }

            // Check for Core Memory prompt
            if (response.coreMemoryPrompt) {
                showCoreMemoryPrompt(response.coreMemoryPrompt);
            }

        } catch (error) {
            appendMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
            console.error('Studio chat error:', error);
        } finally {
            hideLoading(sendBtn);
        }
    }

    function showCoreMemoryPrompt(prompt) {
        pendingCoreMemoryKey = prompt.key;
        coreMemoryQuestion.textContent = prompt.question;
        coreMemoryPrompt.style.display = 'block';
    }

    function handleCoreMemoryResponse(answer) {
        if (pendingCoreMemoryKey && answer !== null) {
            coreMemory[pendingCoreMemoryKey] = answer;
        }

        coreMemoryPrompt.style.display = 'none';
        pendingCoreMemoryKey = null;
    }

    async function synthesizePersona() {
        const username = usernameInput.value.trim().toLowerCase();

        if (!username) {
            alert("Please choose a unique username for your AI.");
            usernameInput.focus();
            return;
        }

        if (!contextualSummary && conversationHistory.length === 0) {
            alert("Please have a conversation with the Architect first before generating your persona.");
            return;
        }

        showLoading(synthesizeBtn, 'Synthesizing your digital mind...');

        try {
            const response = await apiCall('/api/aiu/synthesize-persona', {
                body: JSON.stringify({
                    coreMemory: coreMemory,
                    contextualSummary: contextualSummary
                })
            });

            if (response.finalDocument) {
                finalDocument = response.finalDocument;

                // Show in modal
                finalDocumentReview.textContent = JSON.stringify(finalDocument, null, 2);
                confirmationModal.style.display = 'flex';
            }

        } catch (error) {
            alert(`Error synthesizing persona: ${error.message}`);
            console.error('Synthesis error:', error);
        } finally {
            hideLoading(synthesizeBtn);
        }
    }

    async function confirmAndSave() {
        const username = usernameInput.value.trim().toLowerCase();

        if (!finalDocument) {
            alert("No persona document to save. Please generate it first.");
            return;
        }

        showLoading(confirmSaveBtn, 'Saving your AI...');

        try {
            const response = await apiCall('/api/aiu/save-persona', {
                body: JSON.stringify({
                    username: username,
                    finalDocument: finalDocument
                })
            });

            if (response.success) {
                // Show success page
                studioContent.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 60px 20px;">
                        <div style="font-size: 5rem; margin-bottom: 20px;">✨</div>
                        <h1 style="font-size: 2.5rem; margin-bottom: 15px;">Congratulations!</h1>
                        <p style="font-size: 1.3rem; color: var(--aiu-text-secondary); margin-bottom: 40px;">
                            Your Digital Mind, "${response.personaName}", is now live.
                        </p>
                        <div style="background: var(--aiu-surface); padding: 30px; border-radius: 16px; margin: 0 auto 40px; max-width: 600px; border: 1px solid var(--aiu-border);">
                            <p style="color: var(--aiu-text-secondary); margin-bottom: 15px; font-size: 0.95rem;">Your Shareable Link:</p>
                            <input type="text" readonly value="${response.shareableLink}" class="form-input" style="text-align: center; font-size: 1.1rem; margin-bottom: 15px;">
                            <button onclick="navigator.clipboard.writeText('${response.shareableLink}')" class="btn btn-secondary" style="width: 100%;">
                                📋 Copy Link
                            </button>
                        </div>
                        <a href="${response.shareableLink}" class="btn btn-primary btn-large" style="display: inline-flex; margin-bottom: 20px;">
                            <span class="btn-icon">💬</span>
                            Talk to Your AI
                        </a>
                        <br>
                        <a href="/aiu-menu" style="color: var(--aiu-text-secondary); font-size: 1rem;">← Back to A.I.U. Menu</a>
                    </div>
                `;

                confirmationModal.style.display = 'none';
            }

        } catch (error) {
            alert(`Error saving persona: ${error.message}`);
            console.error('Save error:', error);
            hideLoading(confirmSaveBtn);
        }
    }

    function cancelSave() {
        confirmationModal.style.display = 'none';
        finalDocument = null;
    }

    // --- Event Listeners ---
    function attachEventListeners() {
        // View cycling
        prevViewBtn.addEventListener('click', () => cycleView(-1));
        nextViewBtn.addEventListener('click', () => cycleView(1));

        // Chat
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Core Memory
        coreMemoryYesBtn.addEventListener('click', () => handleCoreMemoryResponse(true));
        coreMemoryNoBtn.addEventListener('click', () => handleCoreMemoryResponse(false));

        // Finalization
        synthesizeBtn.addEventListener('click', synthesizePersona);
        confirmSaveBtn.addEventListener('click', confirmAndSave);
        cancelSaveBtn.addEventListener('click', cancelSave);
    }

    // --- Public Interface ---
    return {
        init: () => {
            initializeStudio();
            attachEventListeners();
        }
    };
})();

// Start the studio controller
document.addEventListener('DOMContentLoaded', studioController.init);