# api/aiu_api.py

import logging
import random
import json
from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore

# --- Core Platform Modules ---
import config
from store_config_manager import store_config_manager
from dynamic_ai_personality import DynamicAIPersonality
from api.v1_api import call_gemini_flash # Reuse the Gemini caller

# --- Blueprint Setup & DB Client ---
aiu_api = Blueprint('aiu_api', __name__, url_prefix='/api/aiu')
logger = logging.getLogger(__name__)
db = firestore.client()

# --- Constants ---
CONVERSATION_TURNS_BEFORE_SUMMARY = 5

# --- Authentication Decorator ---
def verify_firebase_token(f):
    """Decorator to protect routes by verifying Firebase ID token."""
    def wrapper(*args, **kwargs):
        id_token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not id_token:
            return jsonify({'error': 'Unauthorized - No token provided'}), 401
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user_uid = decoded_token['uid']
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Auth: Token verification failed for AIU API: {e}")
            return jsonify({'error': 'Unauthorized - Invalid token'}), 401
    wrapper.__name__ = f.__name__
    return wrapper

# --- AIU API ENDPOINTS ---

@aiu_api.route("/studio-chat", methods=['POST'])
@verify_firebase_token
def studio_chat():
    """
    Handles the conversational logic for the A.I.U. Creation Studio.
    Manages Core Memory, Rolling Contextual Summarization, and Persona Preview generation.
    """
    logger.info("A.I.U. Studio Chat endpoint hit.")
    try:
        data = request.json
        core_memory = data.get("coreMemory", {})
        contextual_summary = data.get("contextualSummary", "")
        conversation_history = data.get("conversationHistory", [])
        
        # --- Rolling Contextual Summarization Logic ---
        if len(conversation_history) >= CONVERSATION_TURNS_BEFORE_SUMMARY:
            logger.info("Summarization threshold reached. Condensing context...")
            summary_prompt = f"""You are an expert summarizer. Take the following 'Previous Summary' and integrate the new information from the 'Recent Conversation' into a single, updated, and coherent summary. It is critical to preserve personality, unique details, and specific quotes.

--- PREVIOUS SUMMARY ---
{contextual_summary}

--- RECENT CONVERSATION ---
{json.dumps(conversation_history, indent=2)}

--- UPDATED SUMMARY ---
"""
            # Call the AI model just for summarization
            contextual_summary = call_gemini_flash(config.GOOGLE_CLOUD_PROJECT, config.VERTEX_AI_REGION, config.VERTEX_AI_MODEL_NAME, summary_prompt)
            conversation_history = [] # Reset the short-term history after summarization

        # 1. Load the Persona Architect's configuration
        architect_config = store_config_manager.load_config('aiu-architect')
        if not architect_config:
            return jsonify({"error": "Persona Architect AI is not configured."}), 500

        ai_personality = DynamicAIPersonality(architect_config)
        
        # 2. Prepare the full context for the Architect AI
        user_message = conversation_history[-1]['content'] if conversation_history else ""
        
        # Format Core Memory for the prompt
        core_memory_str = "\n".join([f"- {key}: {value}" for key, value in core_memory.items()]) if core_memory else "None"

        # This special prompt structure is for the Architect AI's context, not the user-facing one
        contextual_prompt = f"""
--- CORE MEMORY (UNFORGETTABLE FACTS) ---
{core_memory_str}

--- CONTEXTUAL SUMMARY ---
{contextual_summary}

--- RECENT CONVERSATION ---
{json.dumps(conversation_history, indent=2)}

--- YOUR TASK ---
Your task is to act as the Persona Architect. Based on ALL the context above, have a natural conversation with the user to help them build their persona. Your response MUST be in two parts separated by "--- DRAFT ---". First, your conversational reply. Second, the updated Persona Document Preview.
The user's latest message is: "{user_message}"
"""

        # 3. Call the AI model
        raw_ai_response = call_gemini_flash(config.GOOGLE_CLOUD_PROJECT, config.VERTEX_AI_REGION, config.VERTEX_AI_MODEL_NAME, contextual_prompt)
        
        # 4. Parse the response
        chat_part = ai_personality.process_ai_response(raw_ai_response) # Default to full response
        preview_part = "{}" # Default to empty JSON

        if "--- DRAFT ---" in raw_ai_response:
            parts = raw_ai_response.split("--- DRAFT ---", 1)
            chat_part = ai_personality.process_ai_response(parts[0])
            preview_part = parts[1].strip()

        return jsonify({
            "chatResponse": chat_part,
            "updatedSummary": contextual_summary,
            "personaPreview": preview_part,
            "conversationHistory": conversation_history # Return the (possibly now empty) history
        }), 200

    except Exception as e:
        logger.error(f"Error in /studio-chat: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500


@aiu_api.route("/synthesize-persona", methods=['POST'])
@verify_firebase_token
def synthesize_persona():
    """
    Takes the final summary and core memory and runs the "Great Synthesis" prompt
    to generate the final, complete persona document for user confirmation.
    """
    logger.info("A.I.U. Synthesize Persona endpoint hit.")
    try:
        data = request.json
        core_memory = data.get("coreMemory", {})
        contextual_summary = data.get("contextualSummary", "")
        
        core_memory_str = "\n".join([f"- {key}: {value}" for key, value in core_memory.items()]) if core_memory else "None"
        
        synthesis_prompt = f"""You are the A.I.U. Synthesizer. Your task is to transform the following comprehensive interview summary and core memory into a complete, final, and beautifully written AI Persona Document. The document must be valid JSON, structured into `knowledgeBase` and `characterPrinciples` (which contains `core_persona`, `system_boundaries`, and `on_user_input`). Use the information to write a rich, first-person `core_persona` that truly captures the user's voice and soul. Extract all factual data into the `knowledgeBase`. Infer logical `system_boundaries` and `on_user_input` examples based on the user's personality.

--- CORE MEMORY ---
{core_memory_str}

--- INTERVIEW SUMMARY ---
{contextual_summary}

--- FINAL JSON DOCUMENT ---
"""
        final_document_str = call_gemini_flash(config.GOOGLE_CLOUD_PROJECT, config.VERTEX_AI_REGION, config.VERTEX_AI_MODEL_NAME, synthesis_prompt)

        # Validate that the output is valid JSON
        try:
            final_document_json = json.loads(final_document_str)
        except json.JSONDecodeError:
            logger.error(f"AI failed to generate valid JSON for synthesis: {final_document_str}")
            return jsonify({"error": "Failed to synthesize persona. The AI returned an invalid format."}), 500

        return jsonify({"finalDocument": final_document_json}), 200

    except Exception as e:
        logger.error(f"Error in /synthesize-persona: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500


@aiu_api.route("/save-persona", methods=['POST'])
@verify_firebase_token
def save_persona():
    """Saves the final, confirmed persona to the aiu_personas collection in Firestore."""
    user_uid = request.user_uid
    logger.info(f"A.I.U. Save Persona endpoint hit for user: {user_uid}")
    try:
        data = request.json
        username = data.get("username", "").lower().strip()
        final_document = data.get("finalDocument")
        
        if not username or not final_document:
            return jsonify({"error": "Missing username or persona document."}), 400
        
        # Check if username is already taken
        query = db.collection('aiu_personas').where('username', '==', username).limit(1).get()
        if len(query) > 0:
            return jsonify({"error": f"Username '{username}' is already taken. Please choose another."}), 409

        # TODO: Here you would integrate with Stripe to get the subscription ID
        # For now, we'll use a placeholder.
        subscription_id = "sub_placeholder_12345"
        
        persona_name = final_document.get("characterPrinciples", {}).get("personaName", "A Digital Mind")

        persona_data = {
            "ownerUid": user_uid,
            "username": username,
            "personaName": persona_name,
            "avatarColor": f"hsl({random.randint(0, 360)}, 70%, 50%)",
            "status": "active",
            "stripeSubscriptionId": subscription_id,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "aiConfig": final_document
        }
        
        # Use the user's UID as the document ID for easy lookup
        db.collection('aiu_personas').document(user_uid).set(persona_data)

        shareable_link = f"https://aarie.ca/aiu-library#{username}"
        
        return jsonify({
            "success": True,
            "personaName": persona_name,
            "shareableLink": shareable_link
        }), 201

    except Exception as e:
        logger.error(f"Error in /save-persona: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500


# --- PUBLIC, UNAUTHENTICATED ENDPOINTS ---

@aiu_api.route("/library", methods=['GET'])
def get_library():
    """Fetches a list of all active, public AI personas."""
    logger.info("A.I.U. Library endpoint hit.")
    try:
        query = db.collection('aiu_personas').where('status', '==', 'active').stream()
        personas = []
        for doc in query:
            data = doc.to_dict()
            personas.append({
                "username": data.get("username"),
                "personaName": data.get("personaName"),
                "avatarColor": data.get("avatarColor"),
                "greeting": f"Hello, I am the digital mind of {data.get('personaName')}. How can I help you?" # Generic greeting
            })
        return jsonify({"personas": personas}), 200
    except Exception as e:
        logger.error(f"Error in /library: {e}", exc_info=True)
        return jsonify({"error": "Could not load AI library."}), 500


@aiu_api.route("/persona/<string:username>", methods=['GET'])
def get_persona(username: str):
    """Fetches the public configuration for a single AI persona by its username."""
    logger.info(f"A.I.U. Get Persona endpoint hit for: {username}")
    try:
        username = username.lower().strip()
        query = db.collection('aiu_personas').where('username', '==', username).where('status', '==', 'active').limit(1).get()
        
        if not query:
            return jsonify({"error": "Persona not found."}), 404
            
        doc = query[0]
        data = doc.to_dict()
        
        # Return only the public-safe data
        public_data = {
            "username": data.get("username"),
            "personaName": data.get("personaName"),
            "avatarColor": data.get("avatarColor"),
            "aiConfig": data.get("aiConfig") # The full personality cartridge
        }
        
        return jsonify(public_data), 200
    except Exception as e:
        logger.error(f"Error in /persona/{username}: {e}", exc_info=True)
        return jsonify({"error": "Could not load persona."}), 500