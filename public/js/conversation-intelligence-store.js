/**
 * ConversationIntelligenceStore
 *
 * Maintains persistent, intelligent state about the booking conversation.
 * Mirrors backend BookingContextManager on the frontend.
 *
 * This enables smart UI rendering:
 * - Progress indicators showing what's been gathered
 * - Smart suggestions based on context
 * - Visible confirmation of understood requirements
 * - Proactive next-step recommendations
 */

export const conversationIntelligence = {
    state: {
        // Booking context gathered so far
        booking: {
            workshop_id: null,              // canonical ID from backend
            workshop_name: null,            // display name
            organization_type: null,        // 'corporate' | 'community'
            participants: null,             // number of participants
            participants_confidence: 0.0,   // 0.0-1.0, how confident the extraction was
            estimated_cost: null,           // calculated total cost
        },

        // Info mode context (window shopping / learning about workshops)
        info_mode: {
            current_workshop: null,         // Most recently mentioned workshop
            all_workshops: [],              // All workshops user has inquired about
        },

        // Conversation state for tracking flow
        conversation: {
            turn: 0,                        // Which conversation turn are we on?
            last_user_message: '',          // What user said last
            last_ai_response: '',           // What AI said last
            last_action: null,              // What action type was triggered
        },

        // UI state for smart rendering
        ui: {
            is_in_booking_flow: false,      // Are we in the booking flow?
            pending_questions: [],          // ['workshop', 'org_type', 'participants']
            completed_steps: [],            // ['workshop', 'org_type']
            available_options: [],          // Smart CTAs based on state
        },

        // Message history for context
        message_history: [],
    },

    /**
     * Update store from backend response
     * Called every time AI sends back enriched response
     *
     * NOTE: Backend sends a FLAT context structure:
     * { workshop_id: '...', organization_type: '...', participants: ... }
     * NOT a nested one: { booking: { workshop_id: '...' } }
     */
    updateFromBackend(backendResponse) {
        // Extract and merge context from backend
        if (backendResponse.context) {
            // MERGE the flat context object directly into the booking state
            // This handles: workshop_id, organization_type, participants, etc.
            this.state.booking = {
                ...this.state.booking,
                ...backendResponse.context,
            };

            // If the backend also sent an action with booking details, update them.
            // This ensures the display name and date/time are always the most accurate from the action payload.
            if (backendResponse.action && backendResponse.action.payload) {
                const payload = backendResponse.action.payload;

                if (payload.workshop_name) {
                    this.state.booking.workshop_name = payload.workshop_name;
                    console.log(`[ConversationIntelligence] Updated workshop_name from action: ${payload.workshop_name}`);
                }

                if (payload.requested_date) {
                    this.state.booking.requested_date = payload.requested_date;
                    console.log(`[ConversationIntelligence] Updated requested_date from action: ${payload.requested_date}`);
                }

                if (payload.requested_time) {
                    this.state.booking.requested_time = payload.requested_time;
                    console.log(`[ConversationIntelligence] Updated requested_time from action: ${payload.requested_time}`);
                }
            }

            // If your backend ever sends UI-specific context, you can handle it here.
            // For now, we only need to update the booking state.
            if (backendResponse.context.ui) {
                this.state.ui = {
                    ...this.state.ui,
                    ...backendResponse.context.ui,
                };
            }

            this.state.conversation.last_ai_response = backendResponse.response;
            this.state.conversation.last_action = backendResponse.action?.type || null;
        }

        // Update info mode state from backend (window shopping context)
        if (backendResponse.info_mode) {
            this.state.info_mode = {
                ...this.state.info_mode,
                ...backendResponse.info_mode,
            };
        }

        // Add to message history
        this.state.message_history.push({
            timestamp: new Date().toISOString(),
            type: 'ai',
            content: backendResponse.response,
            // Store a clean snapshot of booking context for this message
            context: { ...this.state.booking, ui: { ...this.state.ui } },
        });

        console.log("[ConversationIntelligence] Updated from backend:", this.state);
    },

    /**
     * Record user input
     */
    recordUserMessage(message) {
        this.state.conversation.turn++;
        this.state.conversation.last_user_message = message;

        this.state.message_history.push({
            timestamp: new Date().toISOString(),
            type: 'user',
            content: message,
        });

        console.log("[ConversationIntelligence] User said:", message);
    },

    /**
     * Get what questions still need answering
     */
    getPendingQuestions() {
        return this.state.ui.pending_questions || [];
    },

    /**
     * Get what steps have been completed
     */
    getCompletedSteps() {
        return this.state.ui.completed_steps || [];
    },

    /**
     * Check if we're ready for payment
     */
    isReadyForPayment() {
        const completed = this.getCompletedSteps();
        return completed.includes('workshop') &&
               completed.includes('org_type') &&
               completed.includes('participants') &&
               this.state.booking.estimated_cost;
    },

    /**
     * Get progress as percentage (0-100)
     */
    getProgressPercentage() {
        const totalSteps = 3; // workshop, org_type, participants
        const completed = this.getCompletedSteps().length;
        return Math.round((completed / totalSteps) * 100);
    },

    /**
     * Get formatted progress summary
     */
    getProgressSummary() {
        const summary = [];

        if (this.state.booking.workshop_id) {
            summary.push(`✓ Workshop: ${this.state.booking.workshop_name || this.state.booking.workshop_id}`);
        }

        if (this.state.booking.organization_type) {
            summary.push(`✓ Organization: ${this.capitalize(this.state.booking.organization_type)}`);
        }

        if (this.state.booking.participants) {
            summary.push(`✓ Participants: ${this.state.booking.participants}`);
        }

        if (this.state.booking.estimated_cost) {
            summary.push(`💰 Estimated Cost: $${this.state.booking.estimated_cost.toLocaleString()}`);
        }

        return summary;
    },

    /**
     * Get available actions based on current state
     */
    getAvailableActions() {
        return this.state.ui.available_options || [];
    },

    /**
     * Check if specific step is completed
     */
    isStepCompleted(step) {
        return this.state.ui.completed_steps?.includes(step) || false;
    },

    /**
     * Check if specific step is pending
     */
    isStepPending(step) {
        return this.state.ui.pending_questions?.includes(step) || false;
    },

    /**
     * Get what the user said about the workshop (raw input)
     */
    getOriginalWorkshopInput() {
        return this.state.booking.workshop_name || 'Not specified';
    },

    /**
     * Reset conversation (for starting new booking)
     */
    reset() {
        this.state.booking = {
            workshop_id: null,
            workshop_name: null,
            organization_type: null,
            participants: null,
            participants_confidence: 0.0,
            estimated_cost: null,
        };

        this.state.conversation = {
            turn: 0,
            last_user_message: '',
            last_ai_response: '',
            last_action: null,
        };

        this.state.ui = {
            is_in_booking_flow: false,
            pending_questions: [],
            completed_steps: [],
            available_options: [],
        };

        this.state.message_history = [];

        console.log("[ConversationIntelligence] Reset for new booking");
    },

    /**
     * Helper: Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Export current state as JSON (for debugging)
     */
    exportState() {
        return JSON.stringify(this.state, null, 2);
    },

    /**
     * Get full message history for reference
     */
    getHistory() {
        return this.state.message_history;
    },

    /**
     * Get conversation turn count
     */
    getTurnCount() {
        return this.state.conversation.turn;
    },
};

export default conversationIntelligence;
