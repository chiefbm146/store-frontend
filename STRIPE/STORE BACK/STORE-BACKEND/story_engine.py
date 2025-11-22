"""
Story Engine Module - Reconciliation Story Interactive Narrative System

This module manages the story state and generates AI prompts for creating
an interactive Indigenous story about reconciliation, resilience, and triumph.

It's a simplified version of the Aarie project's story logic, adapted for
the Moon Tide platform and integrated with the Google Gemini Flash AI.
"""

import logging
import re

logger = logging.getLogger(__name__)


class StoryEngine:
    """
    Manages the story state and generates AI prompts for the interactive narrative.

    The story follows a choice-based structure where:
    1. Backend generates initial story state with AI
    2. User makes a choice
    3. Backend generates next chapter based on choice and previous state
    """

    def generate_initial_story(self, call_gemini_flash, project_id, location, model_name):
        """
        Generate the initial story from AI.

        Args:
            call_gemini_flash: Function to call Gemini Flash AI
            project_id: GCP Project ID
            location: GCP Location
            model_name: Model name

        Returns:
            dict: Parsed story data with saga_title, world_concept, narrative, choices
        """
        prompt = self.get_initial_prompt()
        ai_response = call_gemini_flash(project_id, location, model_name, prompt)
        return self.parse_ai_response(ai_response, is_initial=True)

    def get_initial_prompt(self):
        """
        Generate the prompt for the AI to create the beginning of the story.

        Returns:
            str: A structured prompt that tells the AI what to generate
        """
        prompt = """You are a wise Indigenous storyteller, steeped in the traditions of truth-telling, resilience, and reconciliation.

Create the beginning of an interactive story about reconciliation, resilience, or triumph from an Indigenous perspective.

Your story should:
- Celebrate Indigenous wisdom and strength
- Explore themes of healing, connection, and hope
- Feel authentic and grounded in Indigenous values
- Be engaging and suitable for diverse audiences

Your response MUST be in EXACTLY the following format, with each section clearly marked by the header on its own line:

# SAGA_TITLE
(A compelling title for the story, e.g., "The Weaver's Debt" or "When the Salmon Remember")

# WORLD_CONCEPT
(A one-paragraph prologue setting the scene and theme of the story. 2-3 sentences.)

# NARRATIVE
(The first chapter of the story, about 2-3 paragraphs long. Vivid, engaging storytelling.)

# CHOICES
1. (The first choice for the player - an action or decision they can make)
2. (The second choice for the player - an alternative action or decision)

Remember: Your response must follow this format exactly. Start with "# SAGA_TITLE" and end after the two choices."""
        return prompt.strip()

    def generate_continued_story(self, story_state, choice_text, call_gemini_flash, project_id, location, model_name):
        """
        Generate the next chapter of the story from AI.

        Args:
            story_state (dict): The current story state
            choice_text (str): The user's choice text
            call_gemini_flash: Function to call Gemini Flash AI
            project_id: GCP Project ID
            location: GCP Location
            model_name: Model name

        Returns:
            dict: Parsed story data with narrative and choices
        """
        prompt = self.get_continuation_prompt(story_state, choice_text)
        ai_response = call_gemini_flash(project_id, location, model_name, prompt)
        return self.parse_ai_response(ai_response, is_initial=False)

    def get_continuation_prompt(self, story_state, choice_text):
        """
        Generate the prompt for the AI to continue the story based on the user's choice.

        Args:
            story_state (dict): The current story state containing narrative, choices, etc.
            choice_text (str): The text of the choice the user made

        Returns:
            str: A structured prompt that tells the AI what to generate next
        """
        prompt = f"""You are continuing an interactive Indigenous story about reconciliation and resilience.

CURRENT STORY STATE:
Title: {story_state.get('saga_title', 'Untitled Story')}

Previous Chapter:
---
{story_state.get('narrative', 'The story begins...')}
---

THE PLAYER CHOSE: "{choice_text}"

YOUR TASK:
Write the next chapter of the story (2-3 paragraphs) that naturally follows from the player's choice.
The narrative should:
- Respond directly to their choice
- Maintain the tone and theme established
- Move the story forward meaningfully
- Continue exploring themes of reconciliation, resilience, or triumph

Then provide two new choices that branch from this new development.

Your response MUST be in EXACTLY the following format:

# NARRATIVE
(The next chapter of the story - 2-3 paragraphs)

# CHOICES
1. (The first new choice)
2. (The second new choice)

Remember: Your response must follow this format exactly. Start with "# NARRATIVE" and end after the two choices."""
        return prompt.strip()

    def parse_ai_response(self, ai_text, is_initial=True):
        """
        Parse the structured response from the AI into a dictionary.

        Args:
            ai_text (str): The raw response from the Gemini AI
            is_initial (bool): Whether this is the initial story or a continuation

        Returns:
            dict: Parsed story data with keys: saga_title, world_concept, narrative, choices
        """
        try:
            if is_initial:
                # Parse initial response with all four sections
                saga_title_match = re.search(
                    r"#\s*SAGA_TITLE\s*\n(.*?)\n#\s*WORLD_CONCEPT",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )
                world_concept_match = re.search(
                    r"#\s*WORLD_CONCEPT\s*\n(.*?)\n#\s*NARRATIVE",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )
                narrative_match = re.search(
                    r"#\s*NARRATIVE\s*\n(.*?)\n#\s*CHOICES",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )
                choices_match = re.search(
                    r"#\s*CHOICES\s*\n(.*)",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )

                saga_title = saga_title_match.group(1).strip() if saga_title_match else "The Tale"
                world_concept = world_concept_match.group(1).strip() if world_concept_match else ""
                narrative = narrative_match.group(1).strip() if narrative_match else ""
            else:
                # Parse continuation response with narrative and choices only
                narrative_match = re.search(
                    r"#\s*NARRATIVE\s*\n(.*?)\n#\s*CHOICES",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )
                choices_match = re.search(
                    r"#\s*CHOICES\s*\n(.*)",
                    ai_text,
                    re.DOTALL | re.IGNORECASE
                )

                saga_title = ""
                world_concept = ""
                narrative = narrative_match.group(1).strip() if narrative_match else ""

            # Parse choices - extract numbered items
            choices_text = choices_match.group(1).strip() if choices_match else ""
            choices = self._parse_choices(choices_text)

            # Ensure we have exactly 2 choices
            if len(choices) < 2:
                choices = [
                    "Continue the journey forward",
                    "Seek guidance from the elders"
                ]
            else:
                choices = choices[:2]

            result = {
                "narrative": narrative if narrative else "The path forward is unclear. The spirits are silent.",
                "choices": choices
            }

            if is_initial:
                result["saga_title"] = saga_title
                result["world_concept"] = world_concept

            logger.info(f"[Story Engine] Successfully parsed story response")
            return result

        except Exception as e:
            logger.error(f"[Story Engine] Error parsing AI response: {str(e)}")
            logger.error(f"[Story Engine] Response text (first 500 chars): {ai_text[:500]}")

            # Return a fallback story chapter
            return {
                "saga_title": "A Journey Continues" if is_initial else "",
                "world_concept": "An untold story awaits..." if is_initial else "",
                "narrative": "The path forward is unclear, but you know in your heart that the spirits guide your steps. What will you do next?",
                "choices": [
                    "Take the first step with courage",
                    "Wait for a sign from the ancestors"
                ]
            }

    def _parse_choices(self, choices_text):
        """
        Extract individual choices from the choices block.

        Args:
            choices_text (str): Raw text containing numbered choices

        Returns:
            list: List of choice strings
        """
        choices = []

        # Split by newline and process each line
        lines = choices_text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Remove leading numbers and punctuation (e.g., "1. " or "1) ")
            # This regex matches "1.", "1)", "1: ", etc.
            cleaned = re.sub(r'^[\d]+[.\):\s]+', '', line).strip()

            if cleaned:
                choices.append(cleaned)

        return choices

    def update_story_state(self, current_state, new_chapter_data):
        """
        Update the story state with the new chapter data.

        Args:
            current_state (dict): The current story state
            new_chapter_data (dict): The new chapter data from AI

        Returns:
            dict: Updated story state
        """
        current_state.update({
            "narrative": new_chapter_data.get("narrative", ""),
            "choices": new_chapter_data.get("choices", [])
        })
        return current_state
