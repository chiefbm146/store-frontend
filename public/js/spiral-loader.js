/**
 * Spiral Loader - Matrix Rain Loading Screen
 * Simple matrix rain background effect
 *
 * UPDATED: Fixed pointer-events blocking issue - now set to 'none' when hiding
 * This allows story control buttons to be clickable after loader fades
 * Status: UP TO DATE ✓
 */

let loaderContainer = null;

export default class SpiralLoader {
    constructor(options = {}) {
        this.isVisible = false;
    }

    init() {
        // Create matrix rain container
        loaderContainer = document.createElement('div');
        loaderContainer.id = 'spiralLoaderContainer';
        loaderContainer.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(5, 8, 16, 1);
            opacity: 1;
            transition: opacity 0.5s ease;
            pointer-events: none;
            overflow: hidden;
        `;
        document.body.appendChild(loaderContainer);

        // Create matrix rain
        this.initMatrixRain();
    }

    initMatrixRain() {
        // Create matrix rain characters
        const chars = '01アウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        let rainHTML = '';

        for (let i = 0; i < 300; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = 4 + Math.random() * 5;

            rainHTML += `<span style="
                position: absolute;
                left: ${x}%;
                top: -5%;
                color: rgba(0, 212, 255, 0.4);
                font-family: 'Courier New', monospace;
                font-size: 16px;
                animation: matrixFall ${duration}s linear ${delay}s infinite;
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
                font-weight: bold;
            ">${chars[Math.floor(Math.random() * chars.length)]}</span>`;
        }

        loaderContainer.innerHTML = rainHTML;

        // Add keyframes for matrix rain
        if (!document.getElementById('matrixKeyframes')) {
            const style = document.createElement('style');
            style.id = 'matrixKeyframes';
            style.textContent = `
                @keyframes matrixFall {
                    0% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    show() {
        if (!loaderContainer) this.init();

        loaderContainer.style.pointerEvents = 'auto';
        loaderContainer.style.opacity = '1';
        this.isVisible = true;
        console.log('[SpiralLoader] Shown');
    }

    hide() {
        return new Promise((resolve) => {
            if (!this.isVisible || !loaderContainer) {
                resolve();
                return;
            }

            console.log('[SpiralLoader] Hiding...');
            this.isVisible = false;

            // Instantly fade background to transparent (but keep container visible for matrix rain)
            loaderContainer.style.background = 'rgba(5, 8, 16, 0)';
            loaderContainer.style.pointerEvents = 'none';
            resolve();

            // Wait 2 seconds for matrix rain to continue falling
            setTimeout(() => {
                // After 2 seconds, fade out matrix rain characters
                const chars = loaderContainer.querySelectorAll('span');
                chars.forEach((char) => {
                    char.style.transition = 'opacity 0.5s ease-out';
                    char.style.opacity = '0';
                });

                // Fade out the container after rain fades
                loaderContainer.style.transition = 'opacity 0.5s ease-out';
                loaderContainer.style.opacity = '0';

                // Destroy after everything fades
                setTimeout(() => {
                    this.destroy();
                    console.log('[SpiralLoader] Hide complete and destroyed.');
                }, 500);
            }, 2000);
        });
    }

    complete() {
        return this.hide();
    }

    destroy() {
        if (loaderContainer && loaderContainer.parentNode) {
            loaderContainer.parentNode.removeChild(loaderContainer);
            loaderContainer = null;
        }
    }
}
