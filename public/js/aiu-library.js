/**
 * A.I.U. Library Controller (aiu-library.js) - v2.0 Dynamic
 * 
 * Responsibilities:
 * 1. Fetch and display a list of public AI personas from the backend.
 * 2. Handle deep-linking via URL hash to load a specific AI on page load.
 * 3. Implement search/filtering functionality.
 * 4. Manage the UI transition from the gallery view to the chat view.
 * 5. Power the chat interaction with the selected public AI.
 */

const libraryController = (() => {
    // --- Configuration ---
    const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';

    // --- DOM Elements ---
    const galleryView = document.getElementById('gallery-view');
    const chatView = document.getElementById('chat-view-container');
    const galleryGrid = document.getElementById('ai-gallery');
    const searchInput = document.getElementById('library-search');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatName = document.getElementById('chat-name');
    const chatHistory = document.getElementById('library-chat-history');
    const userInput = document.getElementById('library-user-input');
    const sendBtn = document.getElementById('library-send-btn');
    const closeChatBtn = document.getElementById('close-chat-btn');

    // --- State ---
    let allPersonas = [];
    let currentChatPersona = null;
    let conversation = [];

    // --- Helper Functions ---
    function showLoading(button) { button.disabled = true; button.innerHTML = `<span class="spinner"></span>`; }
    function hideLoading(button, text) { button.disabled = false; button.innerHTML = text; }

    async function publicApiCall(endpoint, options = {}) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET', ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) { const err = await response.json(); throw new Error(err.error); }
        return response.json();
    }

    // --- Core Logic ---
    async function initializeLibrary() {
        try {
            const data = await publicApiCall('/api/aiu/library');
            allPersonas = data.personas || [];
            renderGallery(allPersonas);

            const hash = window.location.hash.substring(1);
            if (hash) {
                const persona = allPersonas.find(p => p.username.toLowerCase() === hash.toLowerCase());
                if (persona) {
                    switchToChatView(persona.username); // Pass username to fetch full data
                }
            }
        } catch (error) {
            galleryGrid.innerHTML = `<p style="color: var(--aiu-text-secondary);">Could not load the AI Library: ${error.message}</p>`;
        }

        searchInput.addEventListener('input', handleSearch);
        closeChatBtn.addEventListener('click', switchToGalleryView);
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
    }

    function renderGallery(personas) {
        galleryGrid.innerHTML = '';
        if (personas.length === 0) {
            galleryGrid.innerHTML = `<p style="color: var(--aiu-text-secondary);">No personas found matching your search.</p>`;
            return;
        }
        personas.forEach(persona => {
            const card = document.createElement('div');
            card.className = 'ai-card';
            card.onclick = () => switchToChatView(persona.username);
            card.innerHTML = `
                <div class="ai-card-avatar" style="background-color: ${persona.avatarColor};"></div>
                <h3>${persona.personaName}</h3>
                <p>@${persona.username}</p>
            `;
            galleryGrid.appendChild(card);
        });
    }

    function handleSearch() {
        const query = searchInput.value.toLowerCase();
        const filteredPersonas = allPersonas.filter(p =>
            p.personaName.toLowerCase().includes(query) ||
            p.username.toLowerCase().includes(query)
        );
        renderGallery(filteredPersonas);
    }

    async function switchToChatView(username) {
        galleryView.style.display = 'none';
        chatView.style.display = 'block';
        chatHistory.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>'; // Show loading in chat

        try {
            const fullPersonaData = await publicApiCall(`/api/aiu/persona/${username}`);
            currentChatPersona = fullPersonaData;

            window.location.hash = username;

            chatAvatar.style.backgroundColor = currentChatPersona.avatarColor;
            chatName.textContent = currentChatPersona.personaName;

            chatHistory.innerHTML = '';
            conversation = [];
            const greeting = `Hello! You are now speaking with the Digital Mind of ${currentChatPersona.personaName}. How can I help you?`;
            appendMessage(greeting, 'ai');
        } catch (error) {
            chatHistory.innerHTML = `<div class="chat-bubble ai-bubble">Sorry, I couldn't load this AI persona. Please try again.</div>`;
        }
    }

    function switchToGalleryView() {
        currentChatPersona = null;
        history.pushState("", document.title, window.location.pathname + window.location.search);
        chatView.style.display = 'none';
        galleryView.style.display = 'block';
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}-bubble`;
        bubble.textContent = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if (sender === 'user') {
            conversation.push({ role: 'user', content: text });
        } else {
            conversation.push({ role: 'ai', content: text });
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || !currentChatPersona) return;

        appendMessage(message, 'user');
        userInput.value = '';
        showLoading(sendBtn);

        try {
            // NOTE: The backend needs to create this /public-chat endpoint
            const response = await publicApiCall('/api/aiu/public-chat', {
                method: 'POST',
                body: JSON.stringify({
                    username: currentChatPersona.username,
                    conversationHistory: conversation
                })
            });

            if (response.chatResponse) {
                appendMessage(response.chatResponse, 'ai');
            }
        } catch (error) {
            appendMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
        } finally {
            hideLoading(sendBtn, 'Send');
        }
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', libraryController.init);