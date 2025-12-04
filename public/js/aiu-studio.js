/**
 * A.I.U. Studio Controller (aiu-studio.js)
 * 
 * Responsibilities:
 * 1. Verify user authentication. Redirect if not logged in.
 * 2. Manage the interactive chat with the "Persona Architect AI".
 * 3. Update the live persona document draft based on AI responses.
 * 4. Handle the finalization and saving of the persona to Firestore.
 * 5. Display success state and shareable link.
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
    const docDraft = document.getElementById('persona-document-draft');
    const usernameInput = document.getElementById('ai-username');
    const finalizeBtn = document.getElementById('finalize-btn');
    
    // --- State ---
    let currentUser = null;
    let firebaseAuth;
    let conversation = [];

    // --- Helper Functions ---
    function showLoading(button, text = 'Loading...') {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span> ${text}`;
    }

    function hideLoading(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }
    
    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}-bubble`;
        bubble.textContent = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
        conversation.push({ role: sender, content: text });
    }

    async function apiCall(endpoint, options = {}) {
        if (!currentUser) throw new Error("Authentication required.");
        const token = await currentUser.getIdToken();
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST', // Default to POST for studio actions
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
            // User is authenticated, show the studio.
            authLoader.style.display = 'none';
            studioContent.style.display = 'block';
            
            // Add initial greeting to conversation history
            const initialGreeting = chatHistory.querySelector('.ai-bubble').textContent;
            conversation.push({ role: 'ai', content: initialGreeting });

        } else {
            // No user, redirect to the info/login page.
            console.warn("A.I.U. Studio: No user signed in. Redirecting...");
            window.location.href = '/aiu-create';
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        userInput.value = '';
        showLoading(sendBtn, 'Architect is thinking...');

        try {
            const response = await apiCall('/api/aiu/studio-chat', {
                body: JSON.stringify({
                    conversationHistory: conversation,
                    currentDraft: docDraft.value
                })
            });

            // The backend should return the AI's chat response and the updated document
            if (response.chatResponse) {
                appendMessage(response.chatResponse, 'ai');
            }
            if (response.updatedDraft) {
                docDraft.value = response.updatedDraft;
            }

        } catch (error) {
            appendMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
        } finally {
            hideLoading(sendBtn, 'Send');
        }
    }

    async function finalizePersona() {
        const username = usernameInput.value.trim().toLowerCase();
        const personaDocument = docDraft.value;

        if (!username) {
            alert("Please choose a unique username for your AI.");
            usernameInput.focus();
            return;
        }

        if (!personaDocument) {
            alert("Your persona document seems empty. Please chat with the Architect first.");
            return;
        }
        
        if (!confirm(`Are you sure you want to finalize this persona with the username "${username}"? This will save your AI.`)) {
            return;
        }

        showLoading(finalizeBtn, 'Creating your AI...');

        try {
            const response = await apiCall('/api/aiu/save-persona', {
                body: JSON.stringify({
                    username: username,
                    personaDocument: personaDocument,
                })
            });

            if (response.success) {
                // Show success message and shareable link
                studioContent.innerHTML = `
                    <div style="text-align: center;">
                        <h1>✨ Congratulations! ✨</h1>
                        <p>Your Digital Mind, "${response.personaName}", is now live.</p>
                        <div style="background: var(--aiu-surface); padding: 20px; border-radius: 8px; margin: 30px 0;">
                            <p style="color: var(--aiu-text-secondary); margin-bottom: 10px;">Your Shareable Link:</p>
                            <input type="text" readonly value="${response.shareableLink}" class="form-input" style="text-align: center;">
                        </div>
                        <a href="${response.shareableLink}" class="btn btn-primary">Talk to Your AI</a>
                        <a href="/aiu-menu" style="display: block; margin-top: 20px;">← Back to Menu</a>
                    </div>
                `;
            }

        } catch (error) {
            alert(`Error finalizing persona: ${error.message}`);
            hideLoading(finalizeBtn, '✅ Looks Good, A.I. Yourself!');
        }
    }

    // --- Public Interface & Event Listeners ---
    return {
        init: initializeStudio,
        sendMessage,
        finalizePersona,
    };
})();

// Start the studio controller
document.addEventListener('DOMContentLoaded', studioController.init);

// Add event listener for Enter key on textarea
document.getElementById('studio-user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        studioController.sendMessage();
    }
});