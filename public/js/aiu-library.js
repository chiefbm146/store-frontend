/**
 * A.I.U. Library Controller (aiu-library.js)
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
    
    // Chat View Elements
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
    function showLoading(button, text = '...') {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span>`;
    }

    function hideLoading(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    async function publicApiCall(endpoint, options = {}) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET', // Default to GET for public data
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'API request failed.');
        }
        return response.json();
    }
    
    // --- Core Logic ---
    async function initializeLibrary() {
        try {
            // TODO: Build this backend endpoint
            // const data = await publicApiCall('/api/aiu/library');
            
            // --- MOCK DATA FOR NOW ---
            const data = {
                personas: [
                    { username: 'concierge', personaName: 'A.I.U. Concierge', avatarColor: '#3b82f6', greeting: 'Welcome to the AI Library! I can help you find a persona. Who are you looking for?' },
                    { username: 'korypeters', personaName: 'Kory Peters', avatarColor: '#a855f7', greeting: 'Hello there, I am the digital mind of Kory. Ask me anything about web development or AI.' },
                    { username: 'davidsmith', personaName: 'David Smith', avatarColor: '#10b981', greeting: 'Greetings. I represent David, a master gardener. What would you like to know about plants?' },
                ]
            };
            // --- END MOCK DATA ---
            
            allPersonas = data.personas;
            renderGallery(allPersonas);
            
            // Handle deep-linking
            const hash = window.location.hash.substring(1);
            if (hash) {
                const persona = allPersonas.find(p => p.username.toLowerCase() === hash.toLowerCase());
                if (persona) {
                    switchToChatView(persona);
                }
            }

        } catch (error) {
            galleryGrid.innerHTML = `<p style="color: var(--aiu-text-secondary);">Could not load the AI Library. Please try again later.</p>`;
        }
        
        searchInput.addEventListener('input', handleSearch);
        closeChatBtn.addEventListener('click', switchToGalleryView);
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
            card.onclick = () => switchToChatView(persona);
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

    function switchToChatView(persona) {
        currentChatPersona = persona;
        
        // Update URL for shareability
        window.location.hash = persona.username;
        
        // Populate chat UI
        chatAvatar.style.backgroundColor = persona.avatarColor;
        chatName.textContent = persona.personaName;
        
        // Clear previous chat and add greeting
        chatHistory.innerHTML = '';
        conversation = [];
        const greeting = persona.greeting || `Hello! You're now talking to the AI of ${persona.personaName}.`;
        appendMessage(greeting, 'ai');
        
        // Switch views
        galleryView.style.display = 'none';
        chatView.style.display = 'block';
    }

    function switchToGalleryView() {
        currentChatPersona = null;
        history.pushState("", document.title, window.location.pathname + window.location.search); // Clear hash
        chatView.style.display = 'none';
        galleryView.style.display = 'block';
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}-bubble`;
        bubble.textContent = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        conversation.push({ role: sender, content: text });
    }
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || !currentChatPersona) return;

        appendMessage(message, 'user');
        userInput.value = '';
        showLoading(sendBtn);

        try {
            // TODO: Build this public backend endpoint
            // This is different from the studio chat, it's public.
            // const response = await publicApiCall(`/api/aiu/public-chat/${currentChatPersona.username}`, {
            //     body: JSON.stringify({ conversationHistory: conversation })
            // });
            
            // --- MOCK RESPONSE FOR NOW ---
            await new Promise(res => setTimeout(res, 1500)); // Simulate network delay
            const response = { chatResponse: `This is a simulated response from ${currentChatPersona.personaName}. In a real app, I'd use my unique persona to answer your message about "${message}".` };
            // --- END MOCK ---
            
            if (response.chatResponse) {
                appendMessage(response.chatResponse, 'ai');
            }
        } catch (error) {
            appendMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
        } finally {
            hideLoading(sendBtn, 'Send');
        }
    }

    // --- Public Interface ---
    return {
        init: initializeLibrary,
        sendMessage,
    };
})();

document.addEventListener('DOMContentLoaded', libraryController.init);

document.getElementById('library-user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        libraryController.sendMessage();
    }
});