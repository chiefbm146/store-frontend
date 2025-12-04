/**
 * A.I.U. Studio v2.0 - Evolution Monitor Controller
 * 
 * Responsibilities:
 * 1. Verify user authentication and redirect if needed
 * 2. Manage state: coreMemory, contextualSummary, conversationHistory
 * 3. Handle chat interaction with Persona Architect AI
 * 4. Update Evolution Monitor panels with visual feedback
 * 5. Handle Core Memory prompts (Yes/No)
 * 6. Implement two-step finalization (synthesize → confirm → save)
 */

const studioController = (() => {
    // --- Configuration ---
    const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';

    // --- DOM Elements ---
    const authLoader = document.getElementById('auth-loading');
    const studioContent = document.getElementById('studio-content');
    const chatHistory = document.getElementById('studio-chat-history');
    const userInput = document.getElementById('studio-user-input');
    const sendBtn = document.getElementById('studio-send-btn');

    // Evolution Monitor Panels
    const rawFeedDisplay = document.getElementById('raw-feed-display');
    const summaryDisplay = document.getElementById('summary-display');
    const previewDisplay = document.getElementById('preview-display');

    // Core Memory Prompt
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
    let coreMemory = {};
    let contextualSummary = '';
    let conversationHistory = [];
    let finalDocument = null;
    let pendingCoreMemoryKey = null;

    // --- Helper Functions ---
    function showLoading(button, text = 'Loading...') {
        button.disabled = true;
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.innerHTML = `<span class="spinner"></span> ${text}`;
    }

    function hideLoading(button) {
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

        // Add to conversation history
        conversationHistory.push({ role: sender, content: text });
    }

    function updateRawFeed() {
        // Show last 5 conversation turns
        const recentConversation = conversationHistory.slice(-5);

        if (recentConversation.length === 0) {
            rawFeedDisplay.innerHTML = '<p class="placeholder-text">Your recent conversation will appear here...</p>';
            return;
        }

        rawFeedDisplay.innerHTML = recentConversation.map(msg => {
            const role = msg.role === 'user' ? 'You' : 'Architect';
            return `<div style="margin-bottom: 12px;">
                <strong style="color: ${msg.role === 'user' ? 'var(--aiu-primary)' : 'var(--aiu-accent)'};">${role}:</strong>
                <p style="margin: 5px 0 0 0; color: var(--aiu-text-primary);">${msg.content}</p>
            </div>`;
        }).join('');

        // Add update animation
        rawFeedDisplay.parentElement.classList.add('panel-updating');
        setTimeout(() => {
            rawFeedDisplay.parentElement.classList.remove('panel-updating');
        }, 1500);
    }

    function updateSummary(newSummary) {
        if (!newSummary || newSummary.trim() === '') {
            summaryDisplay.innerHTML = '<p class="placeholder-text">As you chat, the AI will condense your conversation into an evolving summary...</p>';
            return;
        }

        contextualSummary = newSummary;
        summaryDisplay.innerHTML = `<p style="margin: 0; white-space: pre-wrap;">${newSummary}</p>`;

        // Add update animation
        summaryDisplay.parentElement.classList.add('panel-updating');
        setTimeout(() => {
            summaryDisplay.parentElement.classList.remove('panel-updating');
        }, 1500);
    }

    function updatePreview(previewData) {
        if (!previewData || previewData.trim() === '') {
            previewDisplay.innerHTML = '<code class="placeholder-text">Your persona\'s structured data will be built here...</code>';
            return;
        }

        // Try to format as JSON if it's valid JSON
        try {
            const parsed = JSON.parse(previewData);
            previewDisplay.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If not valid JSON, just display as-is
            previewDisplay.textContent = previewData;
        }

        // Add update animation
        previewDisplay.parentElement.classList.add('panel-updating');
        setTimeout(() => {
            previewDisplay.parentElement.classList.remove('panel-updating');
        }, 1500);
    }

    function showCondensingEffect() {
        // Show visual feedback that summarization is happening
        summaryDisplay.parentElement.classList.add('condensing');
        rawFeedDisplay.innerHTML = '<p class="placeholder-text" style="text-align: center;">🧠 Condensing memories...</p>';

        setTimeout(() => {
            summaryDisplay.parentElement.classList.remove('condensing');
        }, 2000);
    }

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
            studioContent.style.display = 'grid';

            // Add initial greeting to conversation history
            const initialGreeting = chatHistory.querySelector('.ai-bubble').textContent;
            conversationHistory.push({ role: 'ai', content: initialGreeting });
            updateRawFeed();
        } else {
            console.warn("A.I.U. Studio: No user signed in. Redirecting...");
            window.location.href = '/aiu-create';
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        userInput.value = '';
        updateRawFeed();

        showLoading(sendBtn, 'Architect is thinking...');

        try {
            const response = await apiCall('/api/aiu/studio-chat', {
                body: JSON.stringify({
                    coreMemory: coreMemory,
                    contextualSummary: contextualSummary,
                    conversationHistory: conversationHistory
                })
            });

            // Update conversation history from backend (may be empty after summarization)
            if (response.conversationHistory !== undefined) {
                conversationHistory = response.conversationHistory;

                // If history was cleared, show condensing effect
                if (conversationHistory.length === 0) {
                    showCondensingEffect();
                }
            }

            // Update chat with AI response
            if (response.chatResponse) {
                appendMessage(response.chatResponse, 'ai');
            }

            // Update Evolution Monitor panels
            updateRawFeed();

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
        // prompt should be an object like: { key: "name", question: "Is your name John?" }
        pendingCoreMemoryKey = prompt.key;
        coreMemoryQuestion.textContent = prompt.question;
        coreMemoryPrompt.style.display = 'block';
    }

    function handleCoreMemoryResponse(answer) {
        if (pendingCoreMemoryKey && answer) {
            // Store the confirmed fact
            coreMemory[pendingCoreMemoryKey] = answer;
        }

        // Hide the prompt
        coreMemoryPrompt.style.display = 'none';
        pendingCoreMemoryKey = null;

        // Optionally send a follow-up message to the AI
        // For now, we'll just hide it and let the conversation continue
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

                // Show the final document in the modal for review
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
                    <div style="text-align: center; padding: 60px 20px; grid-column: 1 / -1;">
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

                // Hide modal
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
        sendBtn.addEventListener('click', sendMessage);

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        coreMemoryYesBtn.addEventListener('click', () => handleCoreMemoryResponse(true));
        coreMemoryNoBtn.addEventListener('click', () => handleCoreMemoryResponse(false));

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