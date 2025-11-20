// public/js/text_animator.js

/**
 * TextAnimator - Typing Effect Animation
 *
 * This module provides a function to animate text by revealing it character by character,
 * mimicking a typing effect. It preserves HTML structure (tags, attributes) while animating
 * the text content within those tags.
 */

const TextAnimator = {
    /**
     * Animates text into a target DOM element with a typing effect.
     * Preserves HTML structure while animating text content.
     *
     * @param {HTMLElement} targetElement The DOM element to put the animated text into.
     * @param {string} text The full text string to animate. Can contain HTML tags like <special>, <br>, etc.
     * @param {object} [options] Animation options.
     * @param {number} [options.speed=30] Delay between characters in milliseconds.
     * @param {function} [options.onComplete] Callback function when animation finishes.
     * @returns {Promise<void>} A promise that resolves when the animation is complete.
     */
    animateTyping(targetElement, text, options = {}) {
        const { speed = 30, onComplete } = options;

        return new Promise(resolve => {
            // Parse the HTML string to create a DOM structure
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;

            // Clear the target element before animation
            targetElement.innerHTML = '';

            // Track the current position in the text we're typing
            let charIndex = 0;
            let totalChars = this._countTextCharacters(tempDiv);

            // Clone the structure to the target
            const clonedStructure = this._cloneStructureEmpty(tempDiv);
            targetElement.appendChild(clonedStructure);

            // Start typing animation
            this._animateTextNodes(clonedStructure, tempDiv, speed, () => {
                if (onComplete) onComplete();
                resolve();
            });
        });
    },

    /**
     * Count total text characters in a DOM subtree (excluding HTML tags)
     */
    _countTextCharacters(node) {
        let count = 0;
        const walk = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textNode;
        while (textNode = walk.nextNode()) {
            count += textNode.nodeValue.length;
        }
        return count;
    },

    /**
     * Clone the DOM structure without text content (creates empty shells)
     */
    _cloneStructureEmpty(sourceNode) {
        if (sourceNode.nodeType === Node.TEXT_NODE) {
            return document.createTextNode('');
        }

        if (sourceNode.nodeType === Node.ELEMENT_NODE) {
            const clonedElement = document.createElement(sourceNode.nodeName);

            // Copy all attributes
            for (const attr of sourceNode.attributes) {
                clonedElement.setAttribute(attr.name, attr.value);
            }

            // Recursively clone children
            for (const child of sourceNode.childNodes) {
                clonedElement.appendChild(this._cloneStructureEmpty(child));
            }

            return clonedElement;
        }

        // For comment nodes or other types, just return a clone
        return sourceNode.cloneNode(false);
    },

    /**
     * Animate text content from source DOM to target DOM
     * Walks through source text nodes and progressively reveals them in target
     * Speed accelerates towards the end to prevent long render times
     * @param {HTMLElement} targetRoot The target DOM element to animate text into
     * @param {HTMLElement} sourceRoot The source DOM element with full text
     * @param {number} speed The delay in milliseconds between character reveals at start
     * @param {function} onComplete Callback when animation finishes
     */
    _animateTextNodes(targetRoot, sourceRoot, speed, onComplete) {
        const sourceWalker = document.createTreeWalker(
            sourceRoot,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const targetWalker = document.createTreeWalker(
            targetRoot,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const sourceTextNodes = [];
        const targetTextNodes = [];

        // Collect all text nodes
        let sourceNode;
        while (sourceNode = sourceWalker.nextNode()) {
            sourceTextNodes.push(sourceNode);
        }

        let targetNode;
        while (targetNode = targetWalker.nextNode()) {
            targetTextNodes.push(targetNode);
        }

        if (sourceTextNodes.length === 0) {
            onComplete();
            return;
        }

        // Calculate total characters to type for progress tracking
        let totalChars = 0;
        for (const textNode of sourceTextNodes) {
            totalChars += textNode.nodeValue.length;
        }

        // Track which source node we're currently typing from
        let currentSourceIndex = 0;
        let currentSourceCharIndex = 0;
        let currentTargetIndex = 0;
        let currentTargetCharIndex = 0;
        let charsTypedSoFar = 0;

        const typeNextCharacter = () => {
            if (currentSourceIndex >= sourceTextNodes.length) {
                // All text typed
                onComplete();
                return;
            }

            const sourceText = sourceTextNodes[currentSourceIndex].nodeValue;
            const targetTextNode = targetTextNodes[currentTargetIndex];

            if (currentSourceCharIndex < sourceText.length) {
                // Add next character to current target text node
                const nextChar = sourceText[currentSourceCharIndex];
                targetTextNode.nodeValue += nextChar;
                currentSourceCharIndex++;
                currentTargetCharIndex++;
                charsTypedSoFar++;

                // Calculate progress (0.0 to 1.0)
                const progress = charsTypedSoFar / totalChars;

                // Accelerate speed: starts at full speed, ends at 10% speed
                // speedMultiplier ranges from 1.0 (start) to 0.1 (end)
                const speedMultiplier = 1.0 - (progress * 0.9);
                const currentSpeed = speed * speedMultiplier;

                setTimeout(typeNextCharacter, currentSpeed);
            } else {
                // Move to next source text node
                currentSourceIndex++;
                currentSourceCharIndex = 0;

                // Move to corresponding target node if we have one
                if (currentTargetIndex < targetTextNodes.length - 1) {
                    currentTargetIndex++;
                    currentTargetCharIndex = 0;
                }

                typeNextCharacter();
            }
        };

        typeNextCharacter();
    }
};

export default TextAnimator;
