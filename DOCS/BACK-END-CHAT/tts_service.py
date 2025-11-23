# moons/tts_service.py

import os
import logging
import base64
import re
import threading
from google.cloud import texttospeech

logger = logging.getLogger(__name__)

# --- NEW: Define a constant for the truncation limit ---
TTS_TRUNCATION_MAX_LENGTH = 3000

# --- TTS Lazy-Loading Client ---
_tts_client = None
_tts_client_lock = threading.Lock()

def get_tts_client():
    """Thread-safe, lazy-loading getter for the Google TTS client."""
    global _tts_client
    if _tts_client is None:
        with _tts_client_lock:
            if _tts_client is None:
                logger.info("Initializing Google Cloud TextToSpeech Client...")
                _tts_client = texttospeech.TextToSpeechClient()
    return _tts_client

def clean_text_for_speech(text: str) -> str:
    """Removes artifacts to make speech sound more natural."""
    text = re.sub(r'\*+', '', text)  # Remove asterisks from markdown bold/italics
    text = re.sub(r'#{1,6}\s*', '', text)  # Remove markdown headers
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)  # Remove markdown links
    text = re.sub(r'<price>(.*?)</price>', r'\1', text)  # Remove <price> tags, keep content
    text = re.sub(r'<special>(.*?)</special>', r'\1', text)  # Remove <special> tags, keep content
    return text.strip()

def text_to_speech(text: str, voice: str = "en-US-Studio-M"):
    """
    Converts text to speech and returns Base64 audio.

    Args:
        text (str): The text to convert to speech
        voice (str): The voice to use for TTS
                    - "en-US-Studio-M" (Male voice - default)
                    - "en-US-Studio-O" (Female voice)

    Returns:
        tuple: (audio_base64, error_message)
    """
    if not text:
        return None, "No text provided."

    # --- NEW: Add forcible truncation to prevent memory overload and control costs ---
    if len(text) > TTS_TRUNCATION_MAX_LENGTH:
        logger.warning(f"TTS text FORCIBLY TRUNCATED from {len(text)} to {TTS_TRUNCATION_MAX_LENGTH} chars.")
        text = text[:TTS_TRUNCATION_MAX_LENGTH]
    # --- END NEW ---

    try:
        cleaned_text = clean_text_for_speech(text)
        if not cleaned_text:
            return None, "Text was empty after cleaning."

        # --- VOICE SELECTION ---
        # Voice options:
        # - "en-US-Studio-M": Male voice (default)
        # - "en-US-Studio-O": Female voice
        voice_name = voice if voice in ["en-US-Studio-M", "en-US-Studio-O"] else "en-US-Studio-M"
        language_code = "en-US"
        logger.info(f"🎙️  TTS using voice: {voice_name}")

        synthesis_input = texttospeech.SynthesisInput(text=cleaned_text)
        voice_params = texttospeech.VoiceSelectionParams(
            language_code=language_code, name=voice_name
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        client = get_tts_client()
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice_params, audio_config=audio_config
        )

        audio_base64 = base64.b64encode(response.audio_content).decode("utf-8")
        logger.info(f"Successfully generated {len(response.audio_content)} bytes of audio.")
        return audio_base64, None

    except Exception as e:
        logger.error(f"Error in TTS service: {e}", exc_info=True)
        return None, "Speech generation failed."
