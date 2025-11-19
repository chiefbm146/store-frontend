/**
 * SmartMessageRenderer - INTELLIGENT CONTEXT-AWARE UI
 *
 * STRATEGY:
 * 1. Analyze conversation context to detect what user is talking about
 * 2. If SPECIFIC workshop mentioned → Show only that + related workshops
 * 3. If VAGUE/UNSURE → Show ALL workshops (let user explore)
 * 4. UI: Multi-step selection (user controls, doesn't auto-send)
 * 5. NO JSON parsing - just hardcoded selections
 */

// === EXPLICIT IMPORTS: Unbreakable dependencies ===
import portalStore from './portal-store.js';
import conversationIntelligence from './conversation-intelligence-store.js';
import soundManager from './soundManager.js';

export class SmartMessageRenderer {
    constructor() {
        this.workshopRegistry = {
            'kairos-blanket-inperson': {
                name: 'Kairos Blanket Exercise - In-Person',
                emoji: '🛏️',
                description: 'Kairos Blanket Exercise - In-Person',
                price: '$225 (Community) / $375 (Corporate)',
                community: 22500, // in cents
                corporate: 37500, // in cents
                per_person: true,
                duration: '3 hours',
                keywords: ['kairos', 'blanket', 'exercise', 'reconciliation', 'inperson', 'in-person']
            },
            'kairos-blanket-virtual': {
                name: 'Kairos Blanket Exercise - Virtual',
                emoji: '🛏️',
                description: 'Kairos Blanket Exercise - Virtual',
                price: '$225 (Community) / $375 (Corporate)',
                community: 22500,
                corporate: 37500,
                per_person: true,
                duration: '3 hours',
                keywords: ['kairos', 'blanket', 'exercise', 'reconciliation', 'virtual', 'online']
            },
            'cedar-bracelet': {
                name: 'Cedar Woven Bracelet',
                emoji: '🪵',
                description: 'Cedar Woven Bracelet',
                price: '$70 (Community) / $95 (Corporate)',
                community: 7000,
                corporate: 9500,
                per_person: true,
                duration: '2 hours',
                keywords: ['cedar', 'bracelet', 'weaving', 'woven']
            },
            'cedar-rope-bracelet': {
                name: 'Cedar Rope Bracelet with Beads',
                emoji: '🪵',
                description: 'Cedar Rope Bracelet with Beads',
                price: '$55 (Community) / $75 (Corporate)',
                community: 5500,
                corporate: 7500,
                per_person: true,
                duration: '2 hours',
                keywords: ['cedar', 'rope', 'bracelet', 'beads', 'beading']
            },
            'cedar-heart': {
                name: 'Weaving a Cedar Heart',
                emoji: '❤️',
                description: 'Weaving a Cedar Heart',
                price: '$70 (Community) / $95 (Corporate)',
                community: 7000,
                corporate: 9500,
                per_person: true,
                duration: '2 hours',
                keywords: ['cedar', 'heart', 'weaving']
            },
            'medicine-pouch': {
                name: 'Healing Through Medicine Pouch Making',
                emoji: '🫶',
                description: 'Healing Through Medicine Pouch Making',
                price: '$70 (Community) / $95 (Corporate)',
                community: 7000,
                corporate: 9500,
                per_person: true,
                duration: '2 hours',
                keywords: ['medicine', 'pouch', 'healing', 'sacred']
            },
            'orange-shirt-day-inperson': {
                name: 'Orange Shirt Day Awareness Beading - In-Person',
                emoji: '🧡',
                description: 'Orange Shirt Day Awareness Beading - In-Person',
                price: '$120 (Community) / $160 (Corporate)',
                community: 12000,
                corporate: 16000,
                per_person: true,
                duration: '4 hours',
                keywords: ['orange', 'shirt', 'day', 'awareness', 'beading', 'inperson', 'in-person']
            },
            'orange-shirt-day-virtual': {
                name: 'Orange Shirt Day Awareness Beading - Virtual',
                emoji: '🧡',
                description: 'Orange Shirt Day Awareness Beading - Virtual',
                price: '$105 (Community) / $145 (Corporate)',
                community: 10500,
                corporate: 14500,
                per_person: true,
                duration: '4 hours',
                keywords: ['orange', 'shirt', 'day', 'awareness', 'beading', 'virtual', 'online']
            },
            'mmiwg2s-inperson': {
                name: 'MMIWG2S Awareness Beading - In-Person',
                emoji: '🤝',
                description: 'MMIWG2S Awareness Beading - In-Person',
                price: '$120 (Community) / $160 (Corporate)',
                community: 12000,
                corporate: 16000,
                per_person: true,
                duration: '4 hours',
                keywords: ['mmiwg2s', 'murdered', 'missing', 'women', 'girls', 'beading', 'inperson', 'in-person']
            },
            'mmiwg2s-virtual': {
                name: 'MMIWG2S Awareness Beading - Virtual',
                emoji: '🤝',
                description: 'MMIWG2S Awareness Beading - Virtual',
                price: '$105 (Community) / $145 (Corporate)',
                community: 10500,
                corporate: 14500,
                per_person: true,
                duration: '4 hours',
                keywords: ['mmiwg2s', 'murdered', 'missing', 'women', 'girls', 'beading', 'virtual', 'online']
            },
            'cedar-coasters': {
                name: 'Cedar Woven Coasters',
                emoji: '☕',
                description: 'Cedar Woven Coasters',
                price: '$70 (Community) / $95 (Corporate)',
                community: 7000,
                corporate: 9500,
                per_person: true,
                duration: '2 hours',
                keywords: ['cedar', 'coasters', 'functional']
            },
            'cedar-basket': {
                name: 'Cedar Basket Weaving',
                emoji: '🧺',
                description: 'Cedar Basket Weaving',
                price: '$120 (Community) / $160 (Corporate)',
                community: 12000,
                corporate: 16000,
                per_person: true,
                duration: '4 hours',
                keywords: ['cedar', 'basket', 'weaving', 'baskets']
            },
            // 'test-product': {
            //     name: 'Test Product',
            //     emoji: '🧪',
            //     description: 'A test product for development and testing purposes.',
            //     price: '$0.50',
            //     duration: 'Instant',
            //     keywords: ['test', 'product', 'development']
            // }
        };

        // === NEW: Hardcoded Booking Flow State ===
        this.bookingState = {
            workshop_id: null,
            organization_type: null,
            participants: null,
            requested_date: null,
            requested_time: null,
            total_cost: null
        };
        // === END NEW ===

        this.selectedWorkshop = null;
        this.selectedOrgType = null;
        this.selectedParticipants = null;
        this.filteredWorkshops = null; // Will be set based on context
        this.conversationContext = null;

        // === Modal state tracking for browser history integration ===
        this.isModalOpen = false;
        this.currentModalBackdrop = null;
        this.isNavigating = false; // Flag to prevent popstate loops

        // Listen for browser back button to close modal
        window.addEventListener('popstate', (event) => {
            if (this.isNavigating) {
                console.log('[SmartRenderer] Ignoring popstate event caused by our own navigation');
                return; // Ignore events caused by our own code
            }

            if (this.isModalOpen && window.location.hash !== '#workshop-modal') {
                console.log('[SmartRenderer] Back button pressed, closing workshop modal');
                this.closeFullscreenModal(this.currentModalBackdrop, { fromHistory: true });
            }
        });
    }

    /**
     * Reset all internal state variables to defaults
     * Called when exiting booking flow to ensure clean state for next interaction
     */
    resetState() {
        console.log("🔄 Resetting SmartMessageRenderer internal state...");
        this.selectedWorkshop = null;
        this.selectedOrgType = null;
        this.selectedParticipants = null;
        this.filteredWorkshops = null;
        this.conversationContext = null;
        // === NEW: Reset booking state ===
        this.bookingState = {
            workshop_id: null,
            organization_type: null,
            participants: null,
            requested_date: null,
            requested_time: null,
            total_cost: null
        };
        // === END NEW ===
        console.log("✓ SmartMessageRenderer state reset complete.");
    }

    /**
     * Re-attach event listeners to <special> tags after DOM updates
     * CRITICAL: This is called after TextAnimator rebuilds the DOM structure,
     * because the animation process creates new DOM nodes and loses previous event listeners.
     * @param {HTMLElement} containerElement The parent element to search within (e.g., .smart-message-text div)
     */
    reattachSmartMessageEventListeners(containerElement) {
        if (!containerElement) {
            console.warn('⚠ reattachSmartMessageEventListeners called with null container');
            return;
        }

        console.log('🔗 Reattaching event listeners to <special> tags...');

        containerElement.querySelectorAll('special').forEach(element => {
            // Make it look clickable with pointer cursor
            element.style.cursor = 'pointer';

            // Remove any existing listeners to prevent duplicates
            // We do this by cloning and replacing to ensure clean state
            const newElement = element.cloneNode(true);
            newElement.style.cursor = 'pointer';

            // Add the click handler
            newElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const clickedText = newElement.textContent;
                console.log(`🔵 Clicked special term: "${clickedText}"`);

                // Send the clicked text as a user message/prompt
                const userInput = document.getElementById('userInput');
                if (userInput) {
                    userInput.value = clickedText;
                    userInput.focus();

                    // Trigger send button click
                    const sendButton = document.getElementById('sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                } else {
                    console.warn('⚠ User input element not found');
                }
            });

            // Replace the old element with the new one that has the listener
            element.parentNode.replaceChild(newElement, element);
        });

        console.log(`✓ Event listeners reattached to all <special> tags`);
    }

    // === NEW: HARDCODED BOOKING FLOW METHODS ===

    /**
     * Get hardcoded AI responses for each booking flow step
     */
    getHardcodedResponse(step, data = {}) {
        const { workshop_name, organization_type, participants } = data;

        const responses = {
            welcome_to_booking: `Excellent choice! The <special>${workshop_name}</special> workshop it is. To help us tailor the experience, please tell us: is this booking for a <special>corporate team</special> or a <special>community group</special>?`,
            ask_org_type: `For the <special>${workshop_name}</special> workshop, is this for a <special>corporate team</special> or a <special>community group</special> (like a non-profit or school)?`,
            ask_participants: `Wonderful! For the <special>${workshop_name}</special> workshop with your <special>${organization_type}</special> group, how many participants will be joining us? (Please note: we have a minimum of <special>10 participants</special>.)`,
            ask_date_time: `Perfect! You've indicated <special>${participants} participants</special> for the <special>${workshop_name}</special> workshop. When would you like to schedule this? Please share your preferred date and time.`,
            confirm_details_ready: `Excellent! You've selected the <special>${workshop_name}</special> workshop for <special>${participants} ${organization_type}</special> participants on <special>${data.requested_date}</special> in the <special>${data.requested_time}</special>. The total estimated cost is <price>$${data.total_cost}</price>. Does everything look correct?`,
            exit_booking: `Got it. The booking has been cancelled. We're here whenever you're ready to explore our transformative experiences again.`
        };

        return responses[step] || '';
    }

    /**
     * Calculate workshop cost based on org type and participants
     * Mirrors backend logic from main.py
     */
    calculateWorkshopCost() {
        const { workshop_id, organization_type, participants } = this.bookingState;

        if (!workshop_id || !organization_type || !participants) {
            return null;
        }

        const workshop = this.workshopRegistry[workshop_id];
        if (!workshop) return null;

        const priceInCents = workshop[organization_type.toLowerCase()];
        const minParticipants = 10;
        const effectiveParticipants = Math.max(participants, minParticipants);
        const totalCostInCents = priceInCents * effectiveParticipants;
        const totalCostInDollars = (totalCostInCents / 100).toFixed(2);

        return totalCostInDollars;
    }

    /**
     * Main method to handle hardcoded booking flow steps
     * Returns { aiText, action } or { aiText: null, action: null } to fall through to AI
     */
    async handleHardcodedBookingFlow(userMessage) {
        let aiText = null;
        let action = null;

        // Step 1: User initiates booking with BOOK_WORKSHOP:: command
        if (userMessage.startsWith("BOOK_WORKSHOP::") && !this.bookingState.workshop_id) {
            const workshopId = userMessage.split("::")[1];
            const workshop = this.workshopRegistry[workshopId];

            if (workshop) {
                this.resetState(); // Hard reset for new booking
                this.bookingState.workshop_id = workshopId;
                aiText = this.getHardcodedResponse('welcome_to_booking', {
                    workshop_name: workshop.description
                });
                console.log(`[SmartRenderer] Booking initiated for: ${workshop.description}`);
            } else {
                aiText = "I'm sorry, I couldn't find that workshop. Please try again.";
                this.resetState();
            }
        }
        // Step 2: User selects organization type with ORG_TYPE:: command
        else if (userMessage.startsWith("ORG_TYPE::") && this.bookingState.workshop_id && !this.bookingState.organization_type) {
            const orgType = userMessage.split("::")[1];
            if (['community', 'corporate'].includes(orgType)) {
                this.bookingState.organization_type = orgType;
                const workshop = this.workshopRegistry[this.bookingState.workshop_id];
                aiText = this.getHardcodedResponse('ask_participants', {
                    workshop_name: workshop.description,
                    organization_type: this._capitalize(orgType)
                });
                console.log(`[SmartRenderer] Organization type set to: ${orgType}`);
            } else {
                aiText = "Please select either <special>corporate</special> or <special>community</special>.";
            }
        }
        // Step 3: User enters participants with PARTICIPANTS:: command
        else if (userMessage.startsWith("PARTICIPANTS::") && this.bookingState.workshop_id && this.bookingState.organization_type && !this.bookingState.participants) {
            const participants = parseInt(userMessage.split("::")[1]);
            if (!isNaN(participants) && participants >= 10) {
                this.bookingState.participants = participants;
                const workshop = this.workshopRegistry[this.bookingState.workshop_id];
                aiText = this.getHardcodedResponse('ask_date_time', {
                    workshop_name: workshop.description,
                    organization_type: this._capitalize(this.bookingState.organization_type),
                    participants: participants
                });
                console.log(`[SmartRenderer] Participants set to: ${participants}`);
            } else {
                aiText = "Please enter a valid number (minimum <special>10 participants</special>).";
            }
        }
        // Step 4: User selects date/time with DATE_TIME:: command
        else if (userMessage.startsWith("DATE_TIME::") && this.bookingState.workshop_id && this.bookingState.organization_type && this.bookingState.participants && !this.bookingState.requested_date) {
            const parts = userMessage.split("::");
            const date = parts[1];
            const time = parts[2];

            if (date && time) {
                this.bookingState.requested_date = date;
                this.bookingState.requested_time = time;
                this.bookingState.total_cost = this.calculateWorkshopCost();

                const workshop = this.workshopRegistry[this.bookingState.workshop_id];
                aiText = this.getHardcodedResponse('confirm_details_ready', {
                    workshop_name: workshop.description,
                    organization_type: this._capitalize(this.bookingState.organization_type),
                    participants: this.bookingState.participants,
                    requested_date: date,
                    requested_time: time,
                    total_cost: this.bookingState.total_cost
                });
                console.log(`[SmartRenderer] Date/Time set to: ${date}, ${time}. Cost: $${this.bookingState.total_cost}`);
            } else {
                aiText = "Please provide both a date and time.";
            }
        }
        // Step 5: User confirms booking with CONFIRM_BOOKING_DETAILS command
        else if (userMessage === "CONFIRM_BOOKING_DETAILS" && this.bookingState.workshop_id && this.bookingState.requested_date) {
            const workshop = this.workshopRegistry[this.bookingState.workshop_id];
            action = {
                type: "SHOW_STRIPE_CHECKOUT",
                payload: {
                    workshop_id: this.bookingState.workshop_id,
                    workshop_name: workshop.description,
                    organization_type: this.bookingState.organization_type,
                    participants: this.bookingState.participants,
                    requested_date: this.bookingState.requested_date,
                    requested_time: this.bookingState.requested_time,
                    total_cost: this.bookingState.total_cost
                }
            };
            console.log('[SmartRenderer] Booking confirmed. Triggering payment module.');
            this.resetState();
        }
        // Step 6: User exits booking flow with EXIT_BOOKING command
        else if (userMessage === "EXIT_BOOKING_FLOW") {
            aiText = this.getHardcodedResponse('exit_booking');
            this.resetState();
            console.log('[SmartRenderer] Exiting booking flow.');
        }
        // If not a hardcoded booking command, return null to signal AI fallback
        else if (!userMessage.startsWith("BOOK_WORKSHOP::") && !userMessage.startsWith("ORG_TYPE::") && !userMessage.startsWith("PARTICIPANTS::") && !userMessage.startsWith("DATE_TIME::") && userMessage !== "CONFIRM_BOOKING_DETAILS" && userMessage !== "EXIT_BOOKING_FLOW") {
            // Regular message - not a booking command
            return { aiText: null, action: null };
        }

        return { aiText, action };
    }

    /**
     * Capitalize first letter of string
     */
    _capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // === END NEW HARDCODED BOOKING FLOW METHODS ===

    /**
     * Detect what workshop(s) user is talking about
     * STRICT keyword matching - only user input matters, AI response ignored
     * Returns: { matchedIds: [], confidence: 0.0-1.0, mode: 'specific' | 'vague' }
     */
    analyzeConversationContext(aiText, userText = '') {
        if (!userText) return { matchedIds: [], confidence: 0.0, mode: 'vague' };

        // ONLY use user text for matching (AI response can confuse things)
        const userLower = userText.toLowerCase();
        const matches = {};

        // Score each workshop based on keyword matches in USER TEXT ONLY
        for (const [id, workshop] of Object.entries(this.workshopRegistry)) {
            let score = 0;
            // Count how many keywords from this workshop appear in user text
            for (const keyword of workshop.keywords) {
                // Use word boundary matching to avoid "basket" matching in "basketball"
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const keywordMatches = userLower.match(regex);
                if (keywordMatches) {
                    score += keywordMatches.length; // Add for each occurrence
                }
            }
            if (score > 0) {
                matches[id] = score;
            }
        }

        // Sort by score (higher = more keywords matched)
        const sortedMatches = Object.entries(matches)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);

        // Determine mode based on whether ANY keywords matched user input
        const mode = sortedMatches.length > 0 ? 'specific' : 'vague';

        const maxScore = Math.max(...Object.values(matches), 0);
        const confidence = Math.min(maxScore / 2, 1.0);

        console.log('🔍 Workshop filtering analysis:', {
            userText,
            matchedIds: sortedMatches,
            mode,
            confidence: confidence.toFixed(2),
            allMatches: Object.fromEntries(Object.entries(matches))
        });

        return {
            matchedIds: sortedMatches, // ALL matches, sorted by relevance
            confidence,
            mode
        };
    }

    /**
     * Get filtered workshops based on context
     * If specific mode: show ONLY matched workshops (no extras)
     * If vague mode: show all workshops
     */
    getFilteredWorkshops(context) {
        if (context.mode === 'vague') {
            return Object.entries(this.workshopRegistry);
        }

        if (context.mode === 'specific' && context.matchedIds.length > 0) {
            // Show ONLY matched workshops - no extras
            const matched = context.matchedIds.map(id => [id, this.workshopRegistry[id]]);
            return matched;
        }

        return Object.entries(this.workshopRegistry);
    }

    /**
     * Render smart message with CONTEXT-AWARE workshop filtering
     * IMPORTANT: Check BOTH booking.workshop_id AND info_mode.current_workshop
     * to decide which UI to show
     * @param {string} aiText - The AI's response text
     * @param {string} userText - The user's last message (for context)
     * @param {object} context - Backend conversation context (optional)
     * @returns {Object} Object with {container, imageBoxes} where imageBoxes may be null
     */
    async renderSmartMessage(aiText, userText = '', context = null) {
        const container = document.createElement('div');
        container.className = 'smart-message-container';

        let imageBoxes = null;

        // ALWAYS render the AI's plain text message first
        this.renderMessageText(container, aiText);

        // ✅ CORRECT: This function's only job is to render the AI text and its action buttons.
        // The main `render()` function in portal-controller now handles the booking UI rendering.
        // This prevents double-rendering and keeps concerns separated.
        console.log("💬 Rendering action buttons in chat bubble.");
        this.renderChatActionButtons(container, aiText);

        return { container, imageBoxes };
    }

    /**
     * Render AI message text (CORRECTLY handles HTML tags and line breaks)
     */
    renderMessageText(container, text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'smart-message-text';

        // --- THE DEFINITIVE FIX ---

        // 1. First, replace newline characters with <br> tags.
        //    This is safe to do because your custom tags don't contain newlines.
        let htmlText = text.replace(/\n/g, '<br>');

        // 2. FRONTEND FALLBACK: Remove empty price/special tags
        //    This catches any stray empty tags the LLM might have produced
        htmlText = htmlText.replace(/<price>\s*<\/price>/gi, '');
        htmlText = htmlText.replace(/<special>\s*<\/special>/gi, '');

        // 3. Now, assign this pre-formatted string directly to innerHTML.
        //    The browser will render the <br> tags, <price> tags, and <special> tags all correctly.
        textDiv.innerHTML = htmlText;

        // --- MAKE <special> TAGS CLICKABLE ---
        // Find all <special> elements and add click handlers
        textDiv.querySelectorAll('special').forEach(element => {
            // Make it look clickable with pointer cursor
            element.style.cursor = 'pointer';

            // Add click handler to send the text as a prompt
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const clickedText = element.textContent;
                console.log(`🔵 Clicked special term: "${clickedText}"`);

                // Send the clicked text as a user message/prompt
                // Set the input value and trigger send
                const userInput = document.getElementById('userInput');
                if (userInput) {
                    userInput.value = clickedText;
                    userInput.focus();

                    // Dispatch the send button click to trigger handleSendMessage
                    const sendButton = document.getElementById('sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                }
            });

        });
        // --- END CLICKABLE SPECIAL TAGS ---

        container.appendChild(textDiv);
    }

    /**
     * Render action buttons IN CHAT BUBBLE ONLY
     * - "📚 Workshops" button to browse all services
     * - "💬 Tell me more" button to continue conversation
     * (Schedule Workshop button is rendered ABOVE input, not here)
     * @param {HTMLElement} container - The parent container for buttons
     * @param {string} aiText - The AI's message text for context in "Tell me more"
     */
    renderChatActionButtons(container, aiText) {
        const buttonDiv = document.createElement('div');
        buttonDiv.style.marginTop = '20px';
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        buttonDiv.style.flexWrap = 'wrap';

        // 1. "Tell me more" button - continue conversation (Liquid glass blue theme)
        const tellMoreBtn = document.createElement('button');
        tellMoreBtn.className = 'tell-me-more-btn';
        tellMoreBtn.style.padding = '12px 20px';
        tellMoreBtn.style.background = 'rgba(30, 144, 255, 0.15)';
        tellMoreBtn.style.backdropFilter = 'blur(10px)';
        tellMoreBtn.style.webkitBackdropFilter = 'blur(10px)';
        tellMoreBtn.style.color = '#1E90FF';
        tellMoreBtn.style.border = '1.5px solid rgba(30, 144, 255, 0.3)';
        tellMoreBtn.style.borderRadius = '12px';
        tellMoreBtn.style.fontWeight = '600';
        tellMoreBtn.style.fontSize = '13px';
        tellMoreBtn.style.cursor = 'pointer';
        tellMoreBtn.style.transition = 'all 0.3s ease';
        tellMoreBtn.style.boxShadow = '0 4px 12px rgba(30, 144, 255, 0.1)';
        tellMoreBtn.innerHTML = '💬 Tell me more';

        tellMoreBtn.addEventListener('mouseenter', () => {
            tellMoreBtn.style.background = 'rgba(30, 144, 255, 0.25)';
            tellMoreBtn.style.borderColor = 'rgba(30, 144, 255, 0.5)';
            tellMoreBtn.style.boxShadow = '0 6px 20px rgba(30, 144, 255, 0.25)';
            tellMoreBtn.style.transform = 'translateY(-2px)';
        });

        tellMoreBtn.addEventListener('mouseleave', () => {
            tellMoreBtn.style.background = 'rgba(30, 144, 255, 0.15)';
            tellMoreBtn.style.borderColor = 'rgba(30, 144, 255, 0.3)';
            tellMoreBtn.style.boxShadow = '0 4px 12px rgba(30, 144, 255, 0.1)';
            tellMoreBtn.style.transform = 'translateY(0)';
        });

        // 2. TTS Play button - with FB audio unlock system
        const ttsButtonContainer = document.createElement('div');
        ttsButtonContainer.className = 'message-play-button-container';
        const ttsButton = document.createElement('button');
        ttsButton.className = 'message-play-button';

        // Use encodeURIComponent before btoa for UTF-8 compatibility
        const uniqueId = btoa(encodeURIComponent(aiText.substring(0, 50))).replace(/=/g, '');
        ttsButton.id = `play-btn-${uniqueId}`;
        ttsButton.setAttribute('data-message-text', aiText);

        // Show locked or play icon based on current unlock state
        if (window.ttsManager && window.ttsManager.ttsUnlockedForSession) {
            ttsButton.title = 'Play';
            ttsButton.innerHTML = `<i class="fas fa-play"></i>`;
            // Add small glow animation for unlocked buttons (not first unlock)
            ttsButton.classList.add('glow-pulse-small');
        } else {
            ttsButton.title = 'Click to unlock TTS';
            ttsButton.innerHTML = `<i class="fas fa-volume-mute"></i>`;
        }

        ttsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.handleMessagePlayButtonClick) {
                window.handleMessagePlayButtonClick(aiText, ttsButton);
            }
        });
        ttsButtonContainer.appendChild(ttsButton);
        buttonDiv.appendChild(ttsButtonContainer);

        tellMoreBtn.addEventListener('click', () => {
            const userInput = document.getElementById('userInput');
            if (userInput) {
                // Remove special tags, newlines, and normalize whitespace
                const cleanAiText = aiText.replace(/<[^>]+>/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

                // --- TRUNCATION LOGIC FOR DISPLAY ---
                // Split the text into words for truncation
                const words = cleanAiText.split(' ');

                // Define a random word count between 3 and 7 for variety and natural feel
                const randomWordCount = Math.floor(Math.random() * 5) + 3;

                let userDisplayText;
                if (words.length > randomWordCount) {
                    // Truncate for display in user's chat bubble
                    const truncatedText = words.slice(0, randomWordCount).join(' ');
                    userDisplayText = `Tell me more about: "${truncatedText}..."`;
                } else {
                    // If text is already short, use it as-is
                    userDisplayText = `Tell me more about: "${cleanAiText}"`;
                }

                // --- FULL CONTEXT FOR BACKEND ---
                // The complete text is what gets sent to the LLM for rich context
                const backendPrompt = `Tell me more about: "${cleanAiText}"`;

                // Set the input field's value to the FULL prompt for backend
                userInput.value = backendPrompt;

                const sendBtn = document.getElementById('sendButton');
                if (sendBtn) {
                    // Use direct API call with truncated display text
                    if (window.portalStore && window.portalController) {
                        // Tell the store to DISPLAY the truncated version
                        window.portalStore.dispatch('startSendMessage', { userText: userDisplayText });

                        // Clear the input field for a clean UI
                        userInput.value = '';

                        // Replicate the send logic from portal-controller with full backend prompt
                        const handleSendLogic = async () => {
                            window.conversationIntelligence.recordUserMessage(backendPrompt);
                            try {
                                const response = await fetch(`${window.BACKEND_URL}/chat`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        prompt: backendPrompt,
                                        session_id: window.getSessionId()
                                    })
                                });
                                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                const data = await response.json();
                                window.conversationIntelligence.updateFromBackend(data);

                                if (data.action && data.action.type) {
                                    window.jarvisManager.loadAction(data.action.type, data.action.payload);
                                } else {
                                    window.portalStore.dispatch('receiveAiResponse', { aiText: data.response });
                                }
                            } catch (error) {
                                console.error('❌ Portal error from "Tell me more":', error);
                                window.portalStore.dispatch('receiveAiResponse', {
                                    aiText: 'Portal connection lost. The AI realm is temporarily unreachable.'
                                });
                            }
                        };

                        handleSendLogic();
                    } else {
                        // Fallback: use the button click method if store isn't available
                        setTimeout(() => sendBtn.click(), 100);
                    }
                }
            }
        });

        buttonDiv.appendChild(tellMoreBtn);
        container.appendChild(buttonDiv);
    }

    /**
     * Show fullscreen booking modal - game-like grid interface for scheduling
     * User picks a workshop from a beautiful fullscreen grid with images
     */
    showBookingModal() {
        this.showFullscreenServiceModal('booking');
    }

    /**
     * Show fullscreen workshops modal - game-like grid interface for browsing services
     * Displays all services in a beautiful fullscreen grid with images and details
     */
    showWorkshopsModal() {
        this.showFullscreenServiceModal('services');
    }

    /**
     * Show fullscreen service modal - beautiful game-like interface
     * @param {string} mode - 'services' for browsing or 'booking' for scheduling
     */
    showFullscreenServiceModal(mode = 'services') {
        // --- THE FIX: PAUSE RENDERING ---
        if (window.portalController && window.portalController.shared3D) {
            window.portalController.shared3D.renderLoopPaused = true;
            console.log("⏸️ 3D Render loop paused for modal creation.");
        }
        // --- END FIX ---

        // Import config for service images
        import('./config/services-config.js').then(({ default: config }) => {
            // Create backdrop with animation
            const backdrop = document.createElement('div');
            backdrop.className = 'fullscreen-modal-backdrop';

            // Create main modal container
            const modal = document.createElement('div');
            modal.className = 'fullscreen-modal';

            // --- HEADER ---
            const header = document.createElement('div');
            header.className = 'modal-header-game';

            const titleContainer = document.createElement('div');
            titleContainer.style.display = 'flex';
            titleContainer.style.alignItems = 'center';
            titleContainer.style.gap = '12px';

            const titleEmoji = document.createElement('span');
            titleEmoji.className = 'modal-title-emoji';
            titleEmoji.textContent = mode === 'booking' ? '📅' : '🎯';

            const title = document.createElement('h1');
            title.className = 'modal-title-game';
            // UPDATED: Title to match branding (consistent for both modes)
            title.textContent = 'Moon Tide Workshops';
            title.style.margin = '0';

            titleContainer.appendChild(titleEmoji);
            titleContainer.appendChild(title);

            // --- PRICING DISCLAIMER (Desktop Version) ---
            const disclaimer = document.createElement('div');
            disclaimer.className = 'modal-header-disclaimer';
            disclaimer.textContent = 'All workshop prices shown are per person and based on a minimum of 10 participants.';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.title = 'Close';

            header.appendChild(titleContainer);
            header.appendChild(disclaimer); // Desktop disclaimer
            header.appendChild(closeBtn);

            modal.appendChild(header);

            // --- NEW: PRICING DISCLAIMER (Mobile Version) ---
            const disclaimerMobile = document.createElement('div');
            disclaimerMobile.className = 'modal-disclaimer-mobile';
            disclaimerMobile.textContent = 'All workshop prices shown are per person and based on a minimum of 10 participants.';
            modal.appendChild(disclaimerMobile); // Appended after header for mobile view

            // --- CONTENT AREA ---
            const content = document.createElement('div');
            content.className = 'modal-content-game';

            // Create service grid
            const grid = document.createElement('div');
            grid.className = 'services-grid';

            // Populate grid with service cards
            for (const [workshopId, workshop] of Object.entries(this.workshopRegistry)) {
                const card = document.createElement('div');
                card.className = 'service-card';

                // Image section
                const imageDiv = document.createElement('div');
                imageDiv.className = 'service-card-image';

                // Try to load image, fall back to emoji placeholder
                const imagePath = config.getImagePath(workshopId);

                if (imagePath === null) {
                    // Explicitly use emoji placeholder (no image config)
                    imageDiv.classList.add('placeholder');
                    imageDiv.textContent = workshop.emoji || '🎯';
                } else {
                    // Try to load image with fallback to emoji
                    const img = document.createElement('img');
                    img.src = imagePath;
                    img.alt = workshop.name;
                    img.onerror = () => {
                        // If image fails to load, use emoji placeholder
                        imageDiv.textContent = workshop.emoji || '🎯';
                        imageDiv.classList.add('placeholder');
                    };
                    imageDiv.appendChild(img);
                }

                card.appendChild(imageDiv);

                // Content section
                const cardContent = document.createElement('div');
                cardContent.className = 'service-card-content';

                // Emoji
                const emoji = document.createElement('div');
                emoji.className = 'service-card-emoji';
                emoji.textContent = workshop.emoji || '🎯';
                cardContent.appendChild(emoji);

                // Name
                const name = document.createElement('h3');
                name.className = 'service-card-name';
                name.textContent = workshop.name;
                cardContent.appendChild(name);

                // Description
                const description = document.createElement('p');
                description.className = 'service-card-description';
                description.textContent = workshop.description;
                cardContent.appendChild(description);

                // Meta information
                const meta = document.createElement('div');
                meta.className = 'service-card-meta';

                const priceItem = document.createElement('div');
                priceItem.className = 'service-meta-item';
                priceItem.innerHTML = `Price: <span class="service-meta-value">${workshop.price}</span>`;

                const durationItem = document.createElement('div');
                durationItem.className = 'service-meta-item';
                durationItem.innerHTML = `Duration: <span class="service-meta-value">${workshop.duration}</span>`;

                meta.appendChild(priceItem);
                meta.appendChild(durationItem);
                cardContent.appendChild(meta);

                // Action button
                const actionBtn = document.createElement('button');
                actionBtn.className = 'service-card-action';
                actionBtn.textContent = mode === 'booking' ? 'Schedule Now' : 'Learn More';

                // --- THE FIX: Inject dependencies directly into the handler ---
                const currentWorkshopName = workshop.name; // Capture workshop.name for promptText

                actionBtn.addEventListener('click', () => {
                    this.closeFullscreenModal(backdrop);

                    // // SPECIAL CASE: Test Product goes DIRECTLY to payment (no booking flow)
                    // if (workshopId === 'test-product') {
                    //     console.log('🧪 Test Product clicked - opening payment directly');
                    //     // Set booking state directly with test product
                    //     if (window.conversationIntelligence) {
                    //         window.conversationIntelligence.state.booking = {
                    //             workshop_id: 'test-product',
                    //             workshop_name: 'Test Product',
                    //             organization_type: null,
                    //             participants: 1
                    //         };
                    //     }
                    //     // Open Stripe checkout immediately
                    //     if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
                    //         window.jarvisManager.loadAction('SHOW_STRIPE_CHECKOUT', {
                    //             total_cost: '$0.50'
                    //         });
                    //     }
                    //     return;
                    // }

                    // --- ARCHITECTURALLY CORRECT: UI-DRIVEN INTENT SYSTEM ---
                    // For regular workshops: Step 1: Determine the user's INTENT based on the modal's mode.
                    // This is the deterministic signal. 'booking' means "start the flow".
                    // 'services' means "I just want to learn".
                    const intent = (mode === 'booking') ? 'BOOK_WORKSHOP' : 'LEARN_MORE';

                    // Step 2: Get the precise data (the workshop ID) from the button's context.
                    const explicitWorkshopId = workshopId; // 'workshopId' is available in this scope

                    // Step 3: Generate the natural language prompt that the user will see in their chat bubble.
                    const promptText = (intent === 'BOOK_WORKSHOP')
                        ? `I'd like to book the ${currentWorkshopName}` // Use captured name
                        : `Tell me about the ${currentWorkshopName}`;   // Use captured name

                    // Step 4: For BOOK mode, just select workshop and show org type buttons (no API call yet)
                    if (intent === 'BOOK_WORKSHOP') {
                        window.smartMessageRenderer.selectWorkshop(explicitWorkshopId, currentWorkshopName);
                    } else {
                        // For LEARN mode, call AI to get details
                        window.smartMessageRenderer.sendMessageWithExplicitIntent(
                            promptText,
                            intent,
                            explicitWorkshopId
                        );
                    }
                });
                // --- END FIX ---

                cardContent.appendChild(actionBtn);
                card.appendChild(cardContent);

                // Add hover effects
                card.addEventListener('mouseenter', () => {
                    card.style.zIndex = '1';
                });

                grid.appendChild(card);
            }

            content.appendChild(grid);
            modal.appendChild(content);

            // --- NEW: FOOTER CLOSE BUTTON ---
            const footerCloseBtn = document.createElement('button');
            footerCloseBtn.className = 'modal-footer-close-btn';
            footerCloseBtn.textContent = 'Close';
            modal.appendChild(footerCloseBtn);

            // --- EVENT HANDLERS ---
            // Re-assign the close function to ALL close buttons
            const closeAll = () => {
                this.closeFullscreenModal(backdrop);
                document.removeEventListener('keydown', handleKeyPress);
            };

            closeBtn.addEventListener('click', closeAll);
            footerCloseBtn.addEventListener('click', closeAll); // New button also closes

            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeAll();
                }
            });

            // Keyboard shortcut to close (ESC key)
            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    closeAll();
                }
            };
            document.addEventListener('keydown', handleKeyPress);

            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);

            // === NEW: Browser history integration ===
            this.isModalOpen = true;
            this.currentModalBackdrop = backdrop;
            this.isNavigating = true;
            history.pushState({ workshopModal: true }, '', '#workshop-modal');
            setTimeout(() => { this.isNavigating = false; }, 100);
            console.log('[SmartRenderer] History state pushed for workshop modal');
            // === END NEW ===

            // --- THE FIX: RESUME RENDERING AFTER MODAL IS APPENDED ---
            // Give the browser a moment to settle, then resume.
            setTimeout(() => {
                if (window.portalController && window.portalController.shared3D) {
                    window.portalController.shared3D.renderLoopPaused = false;
                    console.log("▶️ 3D Render loop resumed after modal appended.");
                }
            }, 100); // A small delay might be helpful
            // --- END FIX ---

            console.log(`✓ Fullscreen ${mode} modal opened`);
        }).catch(error => {
            console.error('Failed to load services config:', error);
            // Fallback: show modal without config
            this.showFallbackModal(mode);
        });
    }

    /**
     * Close fullscreen modal with animation
     * @param {Element} backdrop - The modal backdrop element
     * @param {Object} options - Options like { fromHistory: true } if called by back button
     */
    closeFullscreenModal(backdrop, options = {}) {
        if (!backdrop) return;

        console.log('[SmartRenderer] Closing fullscreen modal', options);

        const modal = backdrop.querySelector('.fullscreen-modal');
        if (modal) {
            modal.classList.add('closing');
        }
        backdrop.classList.add('closing');

        // === NEW: Browser history integration ===
        // Reset modal state
        this.isModalOpen = false;
        this.currentModalBackdrop = null;

        // If the modal was closed by clicking (not by back button),
        // we need to go back in history to remove the #workshop-modal state
        if (!options.fromHistory && window.location.hash === '#workshop-modal') {
            this.isNavigating = true;
            history.back();
            setTimeout(() => { this.isNavigating = false; }, 100);
            console.log('[SmartRenderer] History.back() called to clean up modal hash');
        }
        // === END NEW ===

        setTimeout(() => {
            backdrop.remove();
            // --- THE FIX: ENSURE RENDERING IS RESUMED ---
            if (window.portalController && window.portalController.shared3D) {
                window.portalController.shared3D.renderLoopPaused = false;
                console.log("▶️ 3D Render loop resumed after modal fully removed.");
            }
            // --- END FIX ---
        }, 0);

        console.log('✓ Fullscreen modal closed');
    }

    /**
     * Fallback modal if config fails to load
     */
    showFallbackModal(mode = 'services') {
        // Create backdrop with animation
        const backdrop = document.createElement('div');
        backdrop.className = 'fullscreen-modal-backdrop';

        // Create main modal container
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';

        // --- HEADER ---
        const header = document.createElement('div');
        header.className = 'modal-header-game';

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '12px';

        const titleEmoji = document.createElement('span');
        titleEmoji.className = 'modal-title-emoji';
        titleEmoji.textContent = mode === 'booking' ? '📅' : '🎯';

        const title = document.createElement('h1');
        title.className = 'modal-title-game';
        title.textContent = mode === 'booking' ? 'Schedule a Workshop' : 'Our Services';
        title.style.margin = '0';

        titleContainer.appendChild(titleEmoji);
        titleContainer.appendChild(title);

        // --- PRICING DISCLAIMER IN HEADER ---
        const disclaimer = document.createElement('div');
        disclaimer.className = 'modal-header-disclaimer';
        disclaimer.textContent = 'All workshop prices shown are per person and based on a minimum of 10 participants.';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close';

        // Single row header: Title | Disclaimer | Close Button
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.gap = '20px';
        header.appendChild(titleContainer);
        header.appendChild(disclaimer);
        header.appendChild(closeBtn);

        modal.appendChild(header);

        // --- CONTENT AREA ---
        const content = document.createElement('div');
        content.className = 'modal-content-game';

        // Create service grid (without config)
        const grid = document.createElement('div');
        grid.className = 'services-grid';

        for (const [workshopId, workshop] of Object.entries(this.workshopRegistry)) {
            const card = document.createElement('div');
            card.className = 'service-card';

            // Image section with placeholder emoji
            const imageDiv = document.createElement('div');
            imageDiv.className = 'service-card-image placeholder';
            imageDiv.textContent = workshop.emoji || '🎯';
            card.appendChild(imageDiv);

            // Content section
            const cardContent = document.createElement('div');
            cardContent.className = 'service-card-content';

            // Emoji
            const emoji = document.createElement('div');
            emoji.className = 'service-card-emoji';
            emoji.textContent = workshop.emoji || '🎯';
            cardContent.appendChild(emoji);

            // Name
            const name = document.createElement('h3');
            name.className = 'service-card-name';
            name.textContent = workshop.name;
            cardContent.appendChild(name);

            // Description
            const description = document.createElement('p');
            description.className = 'service-card-description';
            description.textContent = workshop.description;
            cardContent.appendChild(description);

            // Meta information
            const meta = document.createElement('div');
            meta.className = 'service-card-meta';

            const priceItem = document.createElement('div');
            priceItem.className = 'service-meta-item';
            priceItem.innerHTML = `Price: <span class="service-meta-value">${workshop.price}</span>`;

            const durationItem = document.createElement('div');
            durationItem.className = 'service-meta-item';
            durationItem.innerHTML = `Duration: <span class="service-meta-value">${workshop.duration}</span>`;

            meta.appendChild(priceItem);
            meta.appendChild(durationItem);
            cardContent.appendChild(meta);

            // Action button
            const actionBtn = document.createElement('button');
            actionBtn.className = 'service-card-action';
            actionBtn.textContent = mode === 'booking' ? 'Schedule Now' : 'Learn More';

            actionBtn.addEventListener('click', () => {
                this.closeFullscreenModal(backdrop);

                // // SPECIAL CASE: Test Product goes DIRECTLY to payment (no booking flow)
                // if (workshopId === 'test-product') {
                //     console.log('🧪 Test Product clicked (fallback) - opening payment directly');
                //     // Set booking state directly with test product
                //     if (window.conversationIntelligence) {
                //         window.conversationIntelligence.state.booking = {
                //             workshop_id: 'test-product',
                //             workshop_name: 'Test Product',
                //             organization_type: null,
                //             participants: 1
                //         };
                //     }
                //     // Open Stripe checkout immediately
                //     if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
                //         window.jarvisManager.loadAction('SHOW_STRIPE_CHECKOUT', {
                //             total_cost: '$0.50'
                //         });
                //     }
                //     return;
                // }

                const userInput = document.getElementById('userInput');
                if (userInput) {
                    if (mode === 'booking') {
                        userInput.value = `I'd like to book the ${workshop.name}`;
                    } else {
                        userInput.value = `Tell me about the ${workshop.name}`;
                    }
                    const sendBtn = document.getElementById('sendButton');
                    if (sendBtn) {
                        setTimeout(() => sendBtn.click(), 100);
                    }
                }
            });

            cardContent.appendChild(actionBtn);
            card.appendChild(cardContent);

            grid.appendChild(card);
        }

        content.appendChild(grid);
        modal.appendChild(content);

        // --- EVENT HANDLERS ---
        closeBtn.addEventListener('click', () => {
            this.closeFullscreenModal(backdrop);
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.closeFullscreenModal(backdrop);
            }
        });

        // Keyboard shortcut to close (ESC key)
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreenModal(backdrop);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // === NEW: Browser history integration ===
        this.isModalOpen = true;
        this.currentModalBackdrop = backdrop;
        this.isNavigating = true;
        history.pushState({ workshopModal: true }, '', '#workshop-modal');
        setTimeout(() => { this.isNavigating = false; }, 100);
        console.log('[SmartRenderer] History state pushed for fallback workshop modal');
        // === END NEW ===
    }

    /**
     * Create a schedule button for a specific workshop
     * Used for the accumulator buttons above chat input
     */
    createScheduleWorkshopButton(workshopId) {
        const workshop = this.workshopRegistry[workshopId];
        if (!workshop) return null;

        const btn = document.createElement('button');
        btn.className = 'schedule-workshop-btn-small';
        btn.style.padding = '10px 14px';
        btn.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '13px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        btn.style.whiteSpace = 'nowrap';
        btn.style.position = 'relative';
        btn.style.zIndex = '101';
        btn.style.pointerEvents = 'auto';
        btn.innerHTML = `📅 ${workshop.name}`;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🎯 Schedule button clicked for:", workshopId);
            this.showScheduleConfirmation(workshopId, workshop.name);
        });

        return btn;
    }

    /**
     * Show a confirmation dialog before scheduling
     * User can confirm or cancel
     */
    showScheduleConfirmation(workshopId, workshopName) {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.right = '0';
        backdrop.style.bottom = '0';
        backdrop.style.background = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.display = 'flex';
        backdrop.style.alignItems = 'center';
        backdrop.style.justifyContent = 'center';
        backdrop.style.zIndex = '10000';

        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.background = 'white';
        modal.style.borderRadius = '12px';
        modal.style.padding = '32px';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
        modal.style.textAlign = 'center';

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Schedule Workshop?';
        title.style.margin = '0 0 12px 0';
        title.style.fontSize = '20px';
        title.style.fontWeight = '700';
        title.style.color = '#333';
        modal.appendChild(title);

        // Message
        const message = document.createElement('p');
        message.textContent = `Do you want to schedule the ${workshopName} workshop?`;
        message.style.margin = '0 0 24px 0';
        message.style.fontSize = '15px';
        message.style.color = '#666';
        modal.appendChild(message);

        // Button container
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '12px';
        btnContainer.style.justifyContent = 'center';

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✗ Cancel';
        cancelBtn.style.padding = '12px 24px';
        cancelBtn.style.background = '#f0f0f0';
        cancelBtn.style.color = '#666';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.transition = 'all 0.2s ease';
        cancelBtn.addEventListener('click', () => {
            backdrop.remove();
        });
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#e0e0e0';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = '#f0f0f0';
        });

        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✓ Yes, Schedule It';
        confirmBtn.style.padding = '12px 24px';
        confirmBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = 'none';
        confirmBtn.style.borderRadius = '6px';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.style.transition = 'all 0.2s ease';
        confirmBtn.addEventListener('click', () => {
            backdrop.remove();
            this.transitionToBookingMode(workshopId);
        });
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.transform = 'translateY(-2px)';
            confirmBtn.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.transform = 'translateY(0)';
            confirmBtn.style.boxShadow = 'none';
        });

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(btnContainer);

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
    }

    /**
     * Transition from info mode to booking mode
     * Sends a booking intent message with the current workshop
     */
    transitionToBookingMode(workshopId) {
        const workshop = this.workshopRegistry[workshopId];
        if (!workshop) {
            console.error("❌ Workshop not found:", workshopId);
            return;
        }

        console.log("🚀 Transitioning to booking mode for:", workshopId);

        // FIX: Close any open fullscreen modal (workshop grid modal stays open and blocks concierge UI)
        const openModals = document.querySelectorAll('.fullscreen-modal-backdrop');
        openModals.forEach(modal => {
            console.log("🔄 Closing fullscreen modal backdrop");
            modal.classList.add('closing');
            setTimeout(() => {
                modal.remove();
            }, 0);
        });

        // Send booking intent message
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton');

        if (userInput && sendBtn) {
            // Use booking intent keywords to trigger booking flow
            userInput.value = `I'd like to book the ${workshop.name}`;
            setTimeout(() => {
                sendBtn.click();
            }, 100);
        }
    }

    /**
     * Create the default floating images for the normal chat state.
     * Uses moon9.png and the moon logo, positioned on sides.
     * Random layout ensures variety in the visual experience.
     * @returns {Promise<HTMLElement>} Wrapper div with both images positioned on sides.
     */
    async createDefaultChatImages() {
        // Random positioning: true = moon9 left, false = logo left
        const randomLayout = Math.random() > 0.5;

        // Image sources for the default chat state
        const defaultImagePath1 = '/images/webp/moon9.webp';
        const defaultImagePath2 = '/moon-logo.avif';

        // Create the first image element
        const image1 = document.createElement('div');
        image1.className = 'booking-image-box';
        image1.innerHTML = `<img src="${defaultImagePath1}" alt="Moon Art" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;

        // Create the second image element (logo)
        const image2 = document.createElement('div');
        image2.className = 'booking-image-box';
        image2.innerHTML = `<img class="booking-logo-image" src="${defaultImagePath2}" alt="Moon Tide Logo">`;

        // Create the outer wrapper that positions the images
        const wrapper = document.createElement('div');
        wrapper.className = 'booking-image-boxes-wrapper';

        // Add images in the randomized order
        if (randomLayout) {
            wrapper.appendChild(image1);  // Goes to the left
            wrapper.appendChild(image2);  // Goes to the right
        } else {
            wrapper.appendChild(image2);  // Goes to the left
            wrapper.appendChild(image1);  // Goes to the right
        }

        return wrapper;
    }

    /**
     * Create image boxes with moon logo and workshop image
     * Returns a wrapper div positioned OUTSIDE the concierge container (floating in space)
     * @returns {Promise<HTMLElement>} Wrapper div with both images positioned on sides
     */
    async createImageBoxes(context) {
        // Random positioning: 0 = logo left/workshop right, 1 = workshop left/logo right
        const randomLayout = Math.random() > 0.5;

        // Dynamic import of servicesConfig
        let config = null;
        try {
            const module = await import('./config/services-config.js');
            config = module.default;
        } catch (e) {
            console.warn('Could not import servicesConfig:', e);
        }

        // Get workshop image path
        let workshopImagePath = null;
        if (context && context.workshop_id && config) {
            workshopImagePath = config.getImagePath(context.workshop_id);
        }

        // Create workshop image element
        const workshopImg = document.createElement('div');
        workshopImg.className = 'booking-image-box';

        if (workshopImagePath) {
            workshopImg.innerHTML = `<img src="${workshopImagePath}" alt="Workshop" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
        } else {
            workshopImg.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #d4a574, #e8b896); color: white; font-size: 48px;">📅</div>`;
        }

        // Create logo image element
        const logoImg = document.createElement('div');
        logoImg.className = 'booking-image-box';
        logoImg.innerHTML = `<img class="booking-logo-image" src="/moon-logo.avif" alt="Moon Tide Logo">`;

        // Create outer wrapper that positions images on SIDES with absolute positioning
        const wrapper = document.createElement('div');
        wrapper.className = 'booking-image-boxes-wrapper';

        // Add images in random order (left and right sides)
        if (randomLayout) {
            wrapper.appendChild(workshopImg);  // Goes to left
            wrapper.appendChild(logoImg);       // Goes to right
        } else {
            wrapper.appendChild(logoImg);       // Goes to left
            wrapper.appendChild(workshopImg);   // Goes to right
        }

        return wrapper;
    }

    /**
     * Render smart concierge UI with context-aware filtering
     * Shows filtered workshops OR all workshops based on context
     */
    async renderSmartConciergeUI(container, conversationContext, context) {
        // Determine which step we're on based on context
        const hasWorkshop = context && context.workshop_id;
        const hasOrgType = context && context.organization_type;
        const hasParticipants = context && context.participants;
        const hasRequestedDate = context && context.requested_date;

        // If all 4 fields are present, the Jarvis booking module will handle it.
        // Don't render anything here - NOT EVEN the container div
        if (hasWorkshop && hasOrgType && hasParticipants && hasRequestedDate) {
            console.log('📍 All booking fields complete. Jarvis module will render. Skipping concierge UI entirely.');
            return;  // EXIT EARLY - don't append anything to container
        }

        const uiDiv = document.createElement('div');
        uiDiv.className = 'concierge-ui-complete';

        if (!hasWorkshop) {
            // STEP 1: Show workshops only
            console.log('📍 Step 1: Showing workshop selection');
            this.renderSmartWorkshopGrid(uiDiv);

            // Add mode indicator (only if conversationContext exists)
            if (conversationContext) {
                const modeIndicator = document.createElement('div');
                modeIndicator.className = 'context-mode-indicator';
                modeIndicator.textContent = conversationContext.mode === 'specific'
                    ? `Showing relevant workshops (${conversationContext.confidence.toFixed(0)}% match)`
                    : 'Showing all available workshops';
                modeIndicator.style.fontSize = '12px';
                modeIndicator.style.color = '#999';
                modeIndicator.style.margin = '10px 0 0 0';
                uiDiv.appendChild(modeIndicator);
            }

        } else if (!hasOrgType) {
            // STEP 2: Show org type only
            console.log('📍 Step 2: Showing organization type selection');
            await this.renderOrgTypeSelector(uiDiv, context);

        } else if (!hasParticipants) {
            // STEP 3: Show participants only
            console.log('📍 Step 3: Showing participant count selection');
            await this.renderParticipantSelector(uiDiv, context);

        } else if (!hasRequestedDate) {
            // STEP 4: Show calendar selector
            console.log('📍 Step 4: Showing calendar and time selection');
            await this.renderCalendarSelector(uiDiv, context);
        }

        container.appendChild(uiDiv);

        // Store images on the parent container so they can be added at a higher level (outside the message bubble)
        if (uiDiv.__imageBoxes) {
            container.__pendingImageBoxes = uiDiv.__imageBoxes;
        }
    }

    /**
     * Workshop grid - show FILTERED or ALL workshops based on context
     */
    renderSmartWorkshopGrid(container) {
        const section = document.createElement('div');
        section.className = 'workshop-grid-section';

        const header = document.createElement('h3');
        header.className = 'section-header';
        header.textContent = '🎯 Select a Workshop';
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'workshop-grid';

        // Use filtered workshops (based on context analysis)
        const workshopsToShow = this.filteredWorkshops || Object.entries(this.workshopRegistry);

        console.log('📊 Rendering workshops:', {
            count: workshopsToShow.length,
            mode: this.conversationContext?.mode,
            matchedIds: this.conversationContext?.matchedIds,
            workshops: workshopsToShow.map(([id]) => id)
        });

        for (const [id, workshop] of workshopsToShow) {
            const card = document.createElement('div');
            card.className = `workshop-card ${this.selectedWorkshop === id ? 'selected' : ''}`;
            card.setAttribute('data-workshop-id', id);
            card.innerHTML = `
                <div class="workshop-header">
                    <span class="emoji">${workshop.emoji}</span>
                    <span class="name">${workshop.name}</span>
                </div>
                <div class="workshop-body">
                    <p class="description">${workshop.description}</p>
                    <div class="details">
                        <span class="price">${workshop.price}</span>
                        <span class="duration">${workshop.duration}</span>
                    </div>
                </div>
                <div class="workshop-footer">
                    <button class="learn-more-btn" onclick="window.smartMessageRenderer.selectWorkshop('${id}', '${workshop.name}')">
                        ${this.selectedWorkshop === id ? '✓ Selected' : 'Select'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        }

        section.appendChild(grid);
        container.appendChild(section);
    }

    /**
     * Organization type selector - shown only after workshop selected
     * Images float OUTSIDE the concierge container in the whitespace
     */
    async renderOrgTypeSelector(container, context) {
        // ONLY create image boxes during org type selection (not during payment)
        // Check if we're still in early booking steps (not at payment yet)
        const isInOrgTypeStep = context && context.workshop_id && !context.organization_type;

        if (isInOrgTypeStep) {
            // Create image boxes to return (will be added at parent level)
            const imageBoxes = await this.createImageBoxes(context);

            // Store images on the container so renderSmartConciergeUI can add them
            container.__imageBoxes = imageBoxes;
        } else {
            console.warn('⚠ renderOrgTypeSelector called but not in org type step');
        }

        const section = document.createElement('div');
        section.className = 'org-type-section';
        section.id = 'org-type-section';
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '15px';

        const header = document.createElement('h3');
        header.className = 'section-header';
        header.textContent = '👥 Organization Type';
        section.appendChild(header);

        const buttons = document.createElement('div');
        buttons.className = 'org-type-buttons';

        const types = [
            { id: 'community', label: '👥 Community', desc: 'Non-profit, school, community org' },
            { id: 'corporate', label: '💼 Corporate', desc: 'Company, business, public org' },
        ];

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `org-type-btn ${this.selectedOrgType === type.id ? 'selected' : ''}`;
            btn.innerHTML = `
                <div class="type-label">${type.label}</div>
                <div class="type-desc">${type.desc}</div>
            `;
            btn.onclick = () => this.selectOrgType(type.id);
            buttons.appendChild(btn);
        });

        section.appendChild(buttons);
        container.appendChild(section);
    }

    /**
     * Participant selector - shown only after org type selected
     * Images float OUTSIDE the concierge container in the whitespace
     */
    async renderParticipantSelector(container, context) {
        // ONLY create image boxes during participant selection (not during payment)
        // Check if we're still in early booking steps (not at payment yet)
        const isInParticipantStep = context && context.workshop_id && context.organization_type && !context.participants;

        if (isInParticipantStep) {
            // Create image boxes to return (will be added at parent level)
            const imageBoxes = await this.createImageBoxes(context);

            // Store images on the container so renderSmartConciergeUI can add them
            container.__imageBoxes = imageBoxes;
        } else {
            console.warn('⚠ renderParticipantSelector called but not in participant step');
        }

        const section = document.createElement('div');
        section.className = 'participant-section';
        section.id = 'participant-section';
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '15px';

        const header = document.createElement('h3');
        header.className = 'section-header';
        header.textContent = '👥 Number of Participants';
        section.appendChild(header);

        // Ensure minimum of 10 participants
        this.selectedParticipants = Math.max(10, this.selectedParticipants);

        // CENTRAL UPDATE FUNCTION - Updates all UI elements in sync
        const updateParticipantDisplay = (count) => {
            // Enforce constraints
            count = Math.max(10, Math.min(500, count));
            this.selectedParticipants = count;

            // Update slider
            if (slider) slider.value = count;
            // Update number input
            if (valueInput) valueInput.value = count;
            // Update confirm button text
            const confirmBtn = document.getElementById('confirm-participants-btn');
            if (confirmBtn) {
                confirmBtn.innerHTML = `✓ Confirm ${count} Participants`;
            }
        };

        // ===== NEW LAYOUT: Number Control Row (- button, input, + button) =====
        const numberControlRow = document.createElement('div');
        numberControlRow.className = 'number-control-row';
        numberControlRow.style.display = 'flex';
        numberControlRow.style.alignItems = 'center';
        numberControlRow.style.gap = '12px';
        numberControlRow.style.justifyContent = 'center';
        numberControlRow.style.marginBottom = '15px';

        // Decrement button (-)
        const decrementBtn = document.createElement('button');
        decrementBtn.className = 'participant-decrement-btn';
        decrementBtn.textContent = '−';
        decrementBtn.style.width = '50px';
        decrementBtn.style.height = '50px';
        decrementBtn.style.borderRadius = '8px';
        decrementBtn.style.border = '2px solid #16a34a';
        decrementBtn.style.background = 'white';
        decrementBtn.style.color = '#15803d';
        decrementBtn.style.fontSize = '24px';
        decrementBtn.style.fontWeight = '700';
        decrementBtn.style.cursor = 'pointer';
        decrementBtn.style.transition = 'all 0.2s ease';
        decrementBtn.onclick = () => updateParticipantDisplay(this.selectedParticipants - 1);

        // Number input field
        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.className = 'participant-value-input';
        valueInput.id = 'participant-input';
        valueInput.min = '10';
        valueInput.max = '500';
        valueInput.value = this.selectedParticipants;
        valueInput.style.width = '80px';
        valueInput.style.textAlign = 'center';
        valueInput.style.fontSize = '18px';
        valueInput.style.fontWeight = '700';
        valueInput.style.padding = '8px';

        // Increment button (+)
        const incrementBtn = document.createElement('button');
        incrementBtn.className = 'participant-increment-btn';
        incrementBtn.textContent = '+';
        incrementBtn.style.width = '50px';
        incrementBtn.style.height = '50px';
        incrementBtn.style.borderRadius = '8px';
        incrementBtn.style.border = '2px solid #16a34a';
        incrementBtn.style.background = '#16a34a';
        incrementBtn.style.color = 'white';
        incrementBtn.style.fontSize = '24px';
        incrementBtn.style.fontWeight = '700';
        incrementBtn.style.cursor = 'pointer';
        incrementBtn.style.transition = 'all 0.2s ease';
        incrementBtn.onclick = () => updateParticipantDisplay(this.selectedParticipants + 1);

        numberControlRow.appendChild(decrementBtn);
        numberControlRow.appendChild(valueInput);
        numberControlRow.appendChild(incrementBtn);
        section.appendChild(numberControlRow);

        // ===== SLIDER (below number control row) =====
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '10';
        slider.max = '500';
        slider.value = this.selectedParticipants;
        slider.className = 'participant-slider';
        slider.id = 'participant-slider';

        // When slider moves, update everything
        slider.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            updateParticipantDisplay(count);
        });

        // When number is typed, update everything
        valueInput.addEventListener('input', (e) => {
            const textValue = e.target.value;
            if (textValue !== '') {
                let count = parseInt(textValue) || 10;
                updateParticipantDisplay(count);
            }
        });

        // When number is confirmed, update everything
        valueInput.addEventListener('change', (e) => {
            let count = parseInt(e.target.value) || 10;
            updateParticipantDisplay(count);
        });

        sliderDiv.appendChild(slider);
        section.appendChild(sliderDiv);

        // Quick select buttons - now just set the slider, not auto-send
        const quickDiv = document.createElement('div');
        quickDiv.className = 'quick-select';

        const quickLabel = document.createElement('div');
        quickLabel.className = 'quick-label';
        quickLabel.textContent = 'Quick select:';
        quickDiv.appendChild(quickLabel);

        const quickButtons = document.createElement('div');
        quickButtons.className = 'quick-buttons';

        [10, 25, 50, 100, 200].forEach(count => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = count;
            // Make quick buttons update the slider instead of auto-sending
            btn.onclick = () => {
                slider.value = count;
                // Manually trigger the 'input' event to update everything
                slider.dispatchEvent(new Event('input'));
            };
            quickButtons.appendChild(btn);
        });

        quickDiv.appendChild(quickButtons);
        section.appendChild(quickDiv);

        // Add the dedicated confirmation button with prominent styling
        const confirmButtonContainer = document.createElement('div');
        confirmButtonContainer.className = 'confirm-button-container';
        confirmButtonContainer.style.marginTop = '20px';

        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-participants-btn';
        confirmBtn.className = 'confirm-participants-btn';
        confirmBtn.style.width = '100%';
        confirmBtn.style.padding = '16px 20px';
        confirmBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = 'none';
        confirmBtn.style.borderRadius = '8px';
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.fontSize = '16px';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.style.transition = 'all 0.3s ease';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
        confirmBtn.style.textTransform = 'uppercase';
        confirmBtn.style.letterSpacing = '0.5px';
        confirmBtn.style.display = 'flex';
        confirmBtn.style.alignItems = 'center';
        confirmBtn.style.justifyContent = 'center';
        confirmBtn.style.gap = '8px';

        // Add checkmark emoji for visual confirmation
        confirmBtn.innerHTML = `✓ Confirm ${this.selectedParticipants} Participants`;

        // Hover and active states
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.transform = 'translateY(-2px)';
            confirmBtn.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.4)';
        });

        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.transform = 'translateY(0)';
            confirmBtn.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
        });

        confirmBtn.addEventListener('mousedown', () => {
            confirmBtn.style.transform = 'translateY(0)';
        });

        // The action: call setParticipantCount with the current value
        confirmBtn.onclick = () => {
            window.smartMessageRenderer.setParticipantCount(this.selectedParticipants);
        };

        confirmButtonContainer.appendChild(confirmBtn);
        section.appendChild(confirmButtonContainer);

        container.appendChild(section);
    }

    /**
     * Calendar and time selector - shown after participant count confirmed
     * Captures user's preferred date and time (not real-time availability check)
     */
    async renderCalendarSelector(container, context) {
        const section = document.createElement('div');
        section.className = 'calendar-section';
        section.id = 'calendar-section';
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '15px';

        const header = document.createElement('h3');
        header.className = 'section-header';
        header.textContent = '🗓️ Preferred Date & Time';
        section.appendChild(header);

        // Datepicker Input
        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.id = 'booking-datepicker';
        dateInput.placeholder = 'Select a Date...';
        dateInput.style.padding = '12px';
        dateInput.style.fontSize = '15px';
        dateInput.style.borderRadius = '8px';
        dateInput.style.border = '2px solid #ddd';
        section.appendChild(dateInput);

        // Time Buttons
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-buttons';
        timeContainer.style.display = 'grid';
        timeContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
        timeContainer.style.gap = '10px';

        const times = [
            { id: 'morning', label: 'Morning' },
            { id: 'afternoon', label: 'Afternoon' },
            { id: 'evening', label: 'Evening' }
        ];

        times.forEach(time => {
            const btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.textContent = time.label;
            btn.dataset.time = time.id;
            btn.style.padding = '12px';
            btn.style.borderRadius = '6px';
            btn.style.border = '2px solid #ddd';
            btn.style.background = 'white';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s ease';
            btn.onclick = () => {
                // Handle selection state
                timeContainer.querySelectorAll('.time-btn').forEach(b => {
                    b.style.background = 'white';
                    b.style.borderColor = '#ddd';
                    b.style.color = '#333';
                });
                btn.style.background = '#16a34a';
                btn.style.borderColor = '#15803d';
                btn.style.color = 'white';
                btn.classList.add('selected');
                this.updateCalendarConfirmButtonState();
            };
            timeContainer.appendChild(btn);
        });
        section.appendChild(timeContainer);

        // Disclaimer
        const disclaimer = document.createElement('p');
        disclaimer.style.fontSize = '12px';
        disclaimer.style.color = '#666';
        disclaimer.textContent = 'Please note: This is your preferred date. Our team will contact you to confirm final availability.';
        section.appendChild(disclaimer);

        // Confirm Button
        const confirmBtn = document.createElement('button');
        confirmBtn.id = 'confirm-datetime-btn';
        confirmBtn.className = 'confirm-participants-btn';
        confirmBtn.style.width = '100%';
        confirmBtn.style.padding = '16px 20px';
        confirmBtn.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = 'none';
        confirmBtn.style.borderRadius = '8px';
        confirmBtn.style.fontWeight = '700';
        confirmBtn.style.fontSize = '16px';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.style.transition = 'all 0.3s ease';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
        confirmBtn.textContent = 'Confirm Date & Time';
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.onclick = () => {
            const selectedDate = document.getElementById('booking-datepicker').value;
            const selectedTimeBtn = document.querySelector('.time-btn.selected');
            if (selectedTimeBtn) {
                const selectedTime = selectedTimeBtn.dataset.time;
                this.setDateTime(selectedDate, selectedTime);
            }
        };
        section.appendChild(confirmBtn);

        container.appendChild(section);

        // Initialize flatpickr AFTER appending to DOM
        flatpickr(dateInput, {
            minDate: "today",
            dateFormat: "F j, Y", // e.g., "October 26, 2025"
            onChange: () => this.updateCalendarConfirmButtonState()
        });
    }

    updateCalendarConfirmButtonState() {
        const dateSelected = document.getElementById('booking-datepicker').value !== '';
        const timeSelected = document.querySelector('.time-btn.selected') !== null;
        const confirmBtn = document.getElementById('confirm-datetime-btn');
        if (confirmBtn) {
            confirmBtn.disabled = !(dateSelected && timeSelected);
            confirmBtn.style.opacity = (dateSelected && timeSelected) ? '1' : '0.5';
        }
    }

    setDateTime(date, time) {
        console.log(`🗓️ Date/Time selected: ${date} in the ${time}`);
        this.bookingState.requested_date = date;
        this.bookingState.requested_time = time;
        this.bookingState.total_cost = this.calculateWorkshopCost();
        console.log('Step 4 Complete: Date/Time set. All data collected.', this.bookingState);

        // Now that all 4 pieces of data are collected, trigger the final transactional API call.
        // Do NOT dispatch a confirmation message - the backend will immediately return the payment action.
        this.triggerFinalBookingAction();
    }

    /**
     * Trigger the final booking action - a transactional API call.
     * This sends all collected data to the backend, which immediately returns SHOW_STRIPE_CHECKOUT.
     * The backend DOES NOT call the AI for this request - it is purely transactional.
     */
    triggerFinalBookingAction() {
        const { workshop_id, organization_type, participants, requested_date, requested_time } = this.bookingState;

        console.log('🔍 [DEBUG] triggerFinalBookingAction called. Checking state:', {
            workshop_id, organization_type, participants, requested_date, requested_time
        });

        // Safety check: ensure all data is present before sending
        if (workshop_id && organization_type && participants && requested_date && requested_time) {
            console.log('✅ All booking data collected. Triggering transactional API call for payment.');

            // Send empty user input with complete booking state attached by portal-controller.js
            const userInput = document.getElementById('userInput');
            const sendBtn = document.getElementById('sendButton');

            console.log('🔍 [DEBUG] Looking for userInput and sendBtn:', { userInput, sendBtn });

            if (userInput && sendBtn) {
                console.log('✅ [DEBUG] Found both elements. Setting userInput.value = "" and clicking send button');
                userInput.value = ''; // Send with empty prompt

                // ✅ CRITICAL FIX: Do NOT dispatch startSendMessage before clicking.
                // The handleSendMessage function will dispatch it when the button is clicked.
                // If we dispatch it now, the button gets disabled before we can click it!
                console.log('🔵 [DEBUG] Executing sendBtn.click() IMMEDIATELY (no delay, no pre-dispatch)');
                sendBtn.click();
            } else {
                console.error('❌ [DEBUG] Missing elements - userInput:', userInput, 'sendBtn:', sendBtn);
            }
        } else {
            console.warn('❌ triggerFinalBookingAction called, but booking state is incomplete.', this.bookingState);
        }
    }

    /**
     * UNIFIED SENDER: sendMessageWithExplicitIntent
     *
     * This is the designated messenger for all UI-driven actions.
     * It sends a rich payload containing:
     * - The natural language prompt (what the user sees)
     * - The explicit intent ('BOOK_WORKSHOP' or 'LEARN_MORE')
     * - The workshop ID (if applicable)
     *
     * This is the ONLY way transactional flows are initiated.
     * It completely removes fuzzy NLP guesswork from the backend.
     */
    sendMessageWithExplicitIntent(promptText, intent, workshopId) {
        console.log(`🚀 Sending with explicit intent: '${intent}' for workshop_id: '${workshopId}'`);

        // Update UI immediately using directly imported modules (guaranteed to exist)
        portalStore.dispatch('startSendMessage', { userText: promptText });
        conversationIntelligence.recordUserMessage(promptText);

        // Capture window-level globals ONCE at the start of the call
        // This ensures they are always available regardless of execution context shifts.
        const currentBackendUrl = window.BACKEND_URL;
        const currentSessionId = window.getSessionId();
        const currentJarvisManager = window.jarvisManager; // Also ensure Jarvis is captured

        // Execute the send logic
        const handleSendLogic = async () => {
            try {
                const response = await fetch(`${currentBackendUrl}/chat`, { // Use captured URL
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: promptText,
                        session_id: currentSessionId, // Use captured Session ID
                        // THE NEW, RICHER PAYLOAD THAT GIVES THE BACKEND PERFECT CLARITY
                        intent: intent,
                        explicit_workshop_id: workshopId
                    })
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                conversationIntelligence.updateFromBackend(data);

                if (data.action && data.action.type) {
                    if (currentJarvisManager) currentJarvisManager.loadAction(data.action.type, data.action.payload); // Use captured Jarvis
                } else {
                    portalStore.dispatch('receiveAiResponse', { aiText: data.response });
                }
            } catch (error) {
                console.error('❌ Portal error during explicit intent send:', error);
                portalStore.dispatch('receiveAiResponse', {
                    aiText: 'Portal connection lost. The AI realm is temporarily unreachable.'
                });
            }
        };

        handleSendLogic();
    }

    /**
     * Handle workshop selection - START BOOKING FLOW
     * Sets local state and dispatches hardcoded welcome message
     */
    selectWorkshop(workshopId, workshopName) {
        // Hard reset for any new booking attempt
        this.resetState();

        this.bookingState.workshop_id = workshopId;
        this.selectedWorkshop = workshopId;
        console.log('Step 1 Complete: Workshop selected', this.bookingState);

        // Dispatch hardcoded welcome response to guide the user
        const workshop = this.workshopRegistry[workshopId];
        const aiText = this.getHardcodedResponse('welcome_to_booking', {
            workshop_name: workshop.description
        });
        portalStore.dispatch('receiveAiResponse', { aiText });

        // Update UI to show org type selection
        this.updateUI();
    }

    /**
     * Handle org type selection - DISPATCH NEXT STEP
     * Sets local state and dispatches hardcoded response asking for participants
     */
    selectOrgType(orgType) {
        this.bookingState.organization_type = orgType;
        this.selectedOrgType = orgType;
        console.log('Step 2 Complete: Org Type selected', this.bookingState);

        const workshop = this.workshopRegistry[this.bookingState.workshop_id];
        const aiText = this.getHardcodedResponse('ask_participants', {
            workshop_name: workshop.description,
            organization_type: this._capitalize(orgType)
        });
        portalStore.dispatch('receiveAiResponse', { aiText });

        // Update UI to show participant selection
        this.updateUI();
    }

    /**
     * Handle participant count selection - DISPATCH NEXT STEP
     * Sets local state and dispatches hardcoded response asking for date/time
     */
    setParticipantCount(count) {
        this.bookingState.participants = count;
        this.selectedParticipants = count;
        console.log('Step 3 Complete: Participants set', this.bookingState);

        const workshop = this.workshopRegistry[this.bookingState.workshop_id];
        const aiText = this.getHardcodedResponse('ask_date_time', {
            workshop_name: workshop.description,
            organization_type: this._capitalize(this.bookingState.organization_type),
            participants: count
        });
        portalStore.dispatch('receiveAiResponse', { aiText });

        // Update UI to show date/time selection
        this.updateUI();
    }

    /**
     * Update UI based on selections - progressive disclosure
     */
    updateUI() {
        // Update workshop card styling
        document.querySelectorAll('.workshop-card').forEach(card => {
            const cardId = card.getAttribute('data-workshop-id');
            if (cardId === this.selectedWorkshop) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Show/hide org type section (appears after workshop selected)
        const orgTypeSection = document.getElementById('org-type-section');
        if (orgTypeSection) {
            orgTypeSection.style.display = this.selectedWorkshop ? 'flex' : 'none';
        }

        // Update org type button styling
        document.querySelectorAll('.org-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        if (this.selectedOrgType) {
            const orgTypeBtns = document.querySelectorAll('.org-type-btn');
            orgTypeBtns.forEach(btn => {
                const btnText = btn.textContent.toLowerCase();
                if ((this.selectedOrgType === 'community' && btnText.includes('community')) ||
                    (this.selectedOrgType === 'corporate' && btnText.includes('corporate'))) {
                    btn.classList.add('selected');
                }
            });
        }

        // Show/hide participant section (appears after org type selected)
        const participantSection = document.getElementById('participant-section');
        if (participantSection) {
            participantSection.style.display = this.selectedOrgType ? 'flex' : 'none';
        }

        // Show/hide booking summary (appears only when ALL selections made)
        const allSelected = this.selectedWorkshop && this.selectedOrgType && this.selectedParticipants;
        const summarySection = document.getElementById('booking-summary');
        const proceedBtn = document.getElementById('proceed-button');

        if (summarySection) {
            summarySection.style.display = allSelected ? 'block' : 'none';
        }

        // Enable/disable proceed button
        if (proceedBtn) {
            proceedBtn.disabled = !allSelected;
            proceedBtn.textContent = allSelected
                ? '✓ Ready to Proceed - Click to Send'
                : 'Select Workshop, Organization Type, and Participants';
        }

        // Update summary if all selected
        if (allSelected) {
            this.updateBookingSummary();
        }

        // Re-render workshop card buttons
        this.reRenderCards();
    }

    /**
     * Re-render workshop cards to show selected state
     */
    reRenderCards() {
        document.querySelectorAll('.workshop-card').forEach(card => {
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => {
                if (card.classList.contains('selected')) {
                    btn.textContent = '✓ Selected';
                } else {
                    btn.textContent = 'Select';
                }
            });
        });

        document.querySelectorAll('.org-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    /**
     * Update booking summary display
     */
    updateBookingSummary() {
        const workshop = this.workshopRegistry[this.selectedWorkshop];
        const summaryDetails = document.getElementById('summary-details');

        if (summaryDetails && workshop) {
            summaryDetails.innerHTML = `
                <div class="summary-item">
                    <span class="label">Workshop:</span>
                    <span class="value">${workshop.emoji} ${workshop.name}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Organization:</span>
                    <span class="value">${this.selectedOrgType === 'community' ? '👥 Community' : '💼 Corporate'}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Participants:</span>
                    <span class="value">${this.selectedParticipants} people</span>
                </div>
                <div class="summary-item highlight">
                    <span class="label">Price:</span>
                    <span class="value">${workshop.price}</span>
                </div>
            `;
        }
    }

    /**
     * Proceed to payment - populate input field and prompt user to send
     * NOTE: User must explicitly click the send button - no auto-send
     */
    proceedToPayment() {
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton');

        if (!userInput || !sendBtn) return;

        // Populate input field with the booking request
        const workshop = this.workshopRegistry[this.selectedWorkshop];
        const message = `Book ${workshop.name} for ${this.selectedParticipants} people, ${this.selectedOrgType} organization`;
        userInput.value = message;

        // Log for debugging
        console.log('✓ Booking auto-sending:', { workshop: this.selectedWorkshop, participants: this.selectedParticipants, org: this.selectedOrgType });

        // AUTO-SEND: Trigger the send button click after a brief delay
        // This gives the UI a moment to update before sending
        setTimeout(() => {
            console.log('📤 Auto-sending booking message...');
            sendBtn.click();
        }, 100);
    }

    /**
     * Render the "Schedule Workshop" button in the ORANGE BOX AREA
     * Between messagesContainer and input-area (NOT inside input-area)
     */
    renderScheduleButtonAboveInput(isInBookingFlow) {
        // Remove any existing schedule button container
        let existingContainer = document.getElementById('schedule-workshop-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // ✅ CORRECTED: Accept booking state as parameter from render() loop
        // This ensures the button always reflects the current, live state
        // instead of evaluating stale state from internal variables

        // Create container for the button
        const container = document.createElement('div');
        container.id = 'schedule-workshop-container';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.padding = '12px 0';
        container.style.backgroundColor = 'transparent';
        container.style.width = '100%';

        // Create the Schedule Workshop button (or Exit Booking Flow button)
        const scheduleBtn = document.createElement('button');
        scheduleBtn.id = 'schedule-workshop-above-input';
        scheduleBtn.className = 'schedule-workshop-btn-persistent';
        scheduleBtn.style.padding = '14px 28px';
        scheduleBtn.style.color = 'white';
        scheduleBtn.style.border = 'none';
        scheduleBtn.style.borderRadius = '8px';
        scheduleBtn.style.fontWeight = '600';
        scheduleBtn.style.fontSize = '14px';
        scheduleBtn.style.cursor = 'pointer';
        scheduleBtn.style.transition = 'all 0.3s ease';
        scheduleBtn.style.zIndex = '100';
        scheduleBtn.style.pointerEvents = 'auto';

        if (isInBookingFlow) {
            // BOOKING FLOW MODE: Red exit button
            scheduleBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
            scheduleBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            scheduleBtn.innerHTML = '❌ Exit Booking Flow';

            scheduleBtn.addEventListener('mouseenter', () => {
                scheduleBtn.style.transform = 'translateY(-2px)';
                scheduleBtn.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
            });

            scheduleBtn.addEventListener('mouseleave', () => {
                scheduleBtn.style.transform = 'translateY(0)';
                scheduleBtn.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            });

            scheduleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("❌ Exiting booking flow");
                this.exitBookingFlow();
            });

            // FIX: Actually append the red exit button to the container!
            container.appendChild(scheduleBtn);
        } else {
            // SINGLE BUTTON MODE: Only Schedule Workshop button (Products temporarily disabled)
            container.style.gap = '12px';
            container.style.flexWrap = 'wrap';
            container.style.justifyContent = 'center'; // Center the single button

            // BUTTON 1: Schedule Workshop (Blue/Moon Tide theme)
            const workshopBtn = document.createElement('button');
            workshopBtn.id = 'schedule-workshop-button';
            workshopBtn.className = 'schedule-workshop-btn-persistent';
            workshopBtn.style.padding = '14px 28px';
            workshopBtn.style.color = 'white';
            workshopBtn.style.border = 'none';
            workshopBtn.style.borderRadius = '8px';
            workshopBtn.style.fontWeight = '600';
            workshopBtn.style.fontSize = '14px';
            workshopBtn.style.cursor = 'pointer';
            workshopBtn.style.transition = 'all 0.3s ease';
            workshopBtn.style.zIndex = '100';
            workshopBtn.style.pointerEvents = 'auto';
            workshopBtn.style.background = 'linear-gradient(135deg, #1E90FF 0%, #0047AB 100%)';
            workshopBtn.style.boxShadow = '0 4px 12px rgba(30, 144, 255, 0.3)';
            workshopBtn.innerHTML = '📅 Schedule Workshop';

            workshopBtn.addEventListener('mouseenter', () => {
                workshopBtn.style.transform = 'translateY(-2px)';
                workshopBtn.style.boxShadow = '0 6px 16px rgba(30, 144, 255, 0.4)';
            });

            workshopBtn.addEventListener('mouseleave', () => {
                workshopBtn.style.transform = 'translateY(0)';
                workshopBtn.style.boxShadow = '0 4px 12px rgba(30, 144, 255, 0.3)';
            });

            workshopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                soundManager.playSound('uiClick').catch(e => console.error('Workshop button sound error:', e));
                console.log("📅 Opening workshop booking modal");
                this.showBookingModal();
            });

            // Create white backdrop container for the button
            const backdropContainer = document.createElement('div');
            backdropContainer.style.background = 'white';
            backdropContainer.style.padding = '8px 12px';
            backdropContainer.style.borderRadius = '20px';
            backdropContainer.style.border = '1.5px solid rgba(255, 255, 255, 0.8)';
            backdropContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            backdropContainer.style.display = 'flex';
            backdropContainer.style.alignItems = 'center';
            backdropContainer.style.justifyContent = 'center';

            backdropContainer.appendChild(workshopBtn);
            container.appendChild(backdropContainer);

            // TEMPORARILY DISABLED: Products button
            // Commenting out the entire Products button section while we phase out products
            /*
            // BUTTON 2: Browse Products (Red/Sparrow theme)
            const productsBtn = document.createElement('button');
            productsBtn.id = 'browse-products-button';
            productsBtn.className = 'schedule-workshop-btn-persistent';
            productsBtn.style.padding = '14px 28px';
            productsBtn.style.color = 'white';
            productsBtn.style.border = 'none';
            productsBtn.style.borderRadius = '8px';
            productsBtn.style.fontWeight = '600';
            productsBtn.style.fontSize = '14px';
            productsBtn.style.cursor = 'pointer';
            productsBtn.style.transition = 'all 0.3s ease';
            productsBtn.style.zIndex = '100';
            productsBtn.style.pointerEvents = 'auto';
            productsBtn.style.background = 'linear-gradient(135deg, #C41E3A 0%, #8B1528 100%)';
            productsBtn.style.boxShadow = '0 4px 12px rgba(196, 30, 58, 0.3)';
            productsBtn.innerHTML = '🛒 Browse Products';

            productsBtn.addEventListener('mouseenter', () => {
                productsBtn.style.transform = 'translateY(-2px)';
                productsBtn.style.boxShadow = '0 6px 16px rgba(196, 30, 58, 0.4)';
            });

            productsBtn.addEventListener('mouseleave', () => {
                productsBtn.style.transform = 'translateY(0)';
                productsBtn.style.boxShadow = '0 4px 12px rgba(196, 30, 58, 0.3)';
            });

            productsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                soundManager.playSound('uiClick').catch(e => console.error('Browse products sound error:', e));
                console.log("🛒 Opening product sections modal");

                // --- THE FIX: Use the correct, modern jarvisManager ---
                if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
                    // Use loadAction, which is the standard way to open modules
                    console.log("✓ jarvisManager found, loading SHOW_PRODUCT_SECTIONS");
                    window.jarvisManager.loadAction('SHOW_PRODUCT_SECTIONS', {});
                } else {
                    // Add a warning for debugging in case it's not found
                    console.warn('❌ Jarvis Manager not found or is missing the loadAction method.');
                }
            });

            container.appendChild(productsBtn);
            */
        }

        // Insert between messagesContainer and input-area for both booking and normal modes
        // Find input-area and insert the button BEFORE it (as a sibling)
        const inputArea = document.querySelector('.input-area');
        const messagesContainer = document.getElementById('messagesContainer');

        if (inputArea && inputArea.parentNode) {
            // Insert right before the input-area (but after messagesContainer)
            inputArea.parentNode.insertBefore(container, inputArea);
            console.log('✓ Buttons rendered above input area');
        } else {
            console.warn('⚠ Could not find input-area');
        }
    }

    /**
     * Exit booking flow and reset to chat mode
     * Sends a silent command to backend to clear booking context
     * Also closes any open Jarvis module to clean up the UI
     */
    exitBookingFlow() {
        console.log("🚪 EXITING BOOKING FLOW (CORRECT STATE MANAGEMENT)...");

        // 1. Instantly clean the UI of temporary elements.
        document.querySelector('.booking-image-boxes-wrapper')?.remove();
        if (window.jarvisManager) {
            window.jarvisManager.closeCurrentModule();
        }

        // 2. Reset all business-logic data stores to a clean slate.
        this.resetState();
        if (window.conversationIntelligence) {
            window.conversationIntelligence.reset();
        }

        // 3. Dispatch the final, correct message to the UI store.
        // This is the *only* thing that should be visible after this process.
        if (window.portalStore) {
            window.portalStore.dispatch('showCancellationMessage');
        }

        // 4. Silently notify the backend to reset. Its response will be ignored.
        fetch(`${window.BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: '[EXIT_BOOKING_FLOW]', session_id: window.getSessionId() })
        }).then(() => console.log("✓ Silent backend reset command sent."));
    }

}

export default new SmartMessageRenderer();
