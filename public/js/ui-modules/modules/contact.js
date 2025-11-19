/**
 * Contact Module
 *
 * Modal for displaying contact information with copy-to-clipboard functionality.
 * Smaller, centered modal similar to the hamburger menu size.
 */

const contactModule = {
    async getHtml(payload = {}) {
        const html = `
            <div class="hamburger-menu-backdrop" id="contact-backdrop">
                <div class="contact-info-modal">
                    <div class="contact-info-header">
                        <h2 class="contact-info-title">📬 Contact Moon Tide</h2>
                        <button class="contact-info-close" id="contact-close-btn" aria-label="Close contact">✕</button>
                    </div>

                    <div class="contact-info-content">
                        <div class="contact-info-item">
                            <p class="contact-info-label">Email</p>
                            <p class="contact-info-value">shona@moontidereconciliation.com</p>
                            <button class="contact-info-copy-btn" data-value="shona@moontidereconciliation.com">📋 Copy Email</button>
                        </div>

                        <div class="contact-info-item">
                            <p class="contact-info-label">Phone</p>
                            <p class="contact-info-value">236-300-3005</p>
                            <button class="contact-info-copy-btn" data-value="236-300-3005">📋 Copy Phone</button>
                        </div>

                        <div class="contact-info-item">
                            <p class="contact-info-label">Website</p>
                            <p class="contact-info-value">www.moontidereconciliation.com</p>
                            <button class="contact-info-copy-btn" data-value="www.moontidereconciliation.com">📋 Copy Website</button>
                        </div>

                        <!-- Location and Business Hours (Info only, no buttons) -->
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(30, 144, 255, 0.1); font-size: 13px; color: #666;">
                            <p style="margin: 0 0 10px 0;"><strong style="color: #1E90FF;">📍 Locations:</strong> Douglas Lake and Vancouver, BC</p>
                            <p style="margin: 0;"><strong style="color: #1E90FF;">🏛️ Lead Contact:</strong> Shona Sparrow</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    },

    async attachEventListeners(payload = {}) {
        console.log('[ContactModule] Attaching event listeners');

        // Close button
        const closeBtn = document.getElementById('contact-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeContact();
            });
        }

        // Backdrop click to close
        const backdrop = document.getElementById('contact-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeContact();
                }
            });
        }

        // Copy buttons
        document.querySelectorAll('.contact-info-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                this.copyToClipboard(value, e.target);
            });
        });

        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeContact();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    },

    /**
     * Copy text to clipboard with visual feedback
     */
    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('[ContactModule] Copied to clipboard:', text);

            // Visual feedback
            const originalText = buttonElement.textContent;
            const originalClass = buttonElement.className;

            buttonElement.textContent = '✓ Copied!';
            buttonElement.classList.add('copied');

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('[ContactModule] Failed to copy:', err);
            buttonElement.textContent = '✗ Failed';
            setTimeout(() => {
                buttonElement.textContent = originalText;
            }, 2000);
        });
    },

    /**
     * Close the contact modal
     */
    closeContact() {
        console.log('[ContactModule] Closing contact modal');

        const backdrop = document.getElementById('contact-backdrop');
        const modal = document.querySelector('.contact-info-modal');

        if (modal) {
            modal.classList.add('closing');
        }
        if (backdrop) {
            backdrop.classList.add('closing');
        }

        setTimeout(() => {
            if (window.moduleManager) {
                window.moduleManager.closeCurrentModule();
            }
        }, 300);
    }
};

export default contactModule;
