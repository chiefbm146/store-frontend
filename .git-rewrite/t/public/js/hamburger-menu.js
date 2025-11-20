// File: hamburger-menu.js

/**
 * Hamburger Menu - Floating Navigation System (v2 with Back Button Support)
 *
 * Provides a floating hamburger button that opens a centered, phone-shaped modal menu
 * with 5 navigation options integrated with the URL hash state management system.
 *
 * Features:
 * - Floating hamburger button (positioned above cart)
 * - Centered, phone-like modal design
 * - 5 menu items: Chrystal Biography, Musqueam Culture, Products, Cart, Contact
 * - Smooth animations
 * - Production-ready responsive design
 * - URL hash integration for state management
 * - NATIVE MOBILE BACK BUTTON SUPPORT: Pressing back closes the menu.
 */

import soundManager from './soundManager.js';

const hamburgerMenu = {
    isOpen: false,
    currentBackdrop: null,
    currentModal: null,

    /**
     * Initialize the hamburger menu system
     * Called on page load to set up the floating button and history listener.
     */
    init() {
        console.log('[HamburgerMenu] Initializing...');
        this.createFloatingButton();
        this.attachButtonListener();

        // NEW: Add a listener for browser history changes (the back button).
        window.addEventListener('popstate', this.handleBackButton.bind(this));
    },

    /**
     * NEW: Handles the browser's back button press.
     */
    handleBackButton(event) {
        // If the menu is open and the URL hash is no longer '#menu-open',
        // it means the user pressed the back button to close it.
        if (this.isOpen && window.location.hash !== '#menu-open') {
            console.log('[HamburgerMenu] Back button pressed, closing menu.');
            // We call closeMenu with a flag to prevent it from manipulating history again.
            this.closeMenu({ fromHistory: true });
        }
    },

    /**
     * Create the hamburger button (appended to header)
     */
    createFloatingButton() {
        const button = document.createElement('button');
        button.id = 'hamburger-button';
        button.innerHTML = '☰';
        button.title = 'Menu';

        // Append to the new right container in the header
        const headerRight = document.getElementById('header-right-container');
        if (headerRight) {
            headerRight.appendChild(button);
        } else {
            document.body.appendChild(button); // Keep fallback
        }

        console.log('[HamburgerMenu] Hamburger button created');
    },

    /**
     * Attach click listener to the hamburger button
     */
    attachButtonListener() {
        const button = document.getElementById('hamburger-button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMenu();
            });
            console.log('[HamburgerMenu] Button listener attached');
        }
    },

    /**
     * Open the main menu modal
     */
    openMenu() {
        if (this.isOpen) return;

        console.log('[HamburgerMenu] Opening menu');
        this.isOpen = true;

        // Create backdrop and modal... (rest of this function is unchanged)
        const backdrop = document.createElement('div');
        backdrop.className = 'hamburger-menu-backdrop';
        const modal = document.createElement('div');
        modal.className = 'hamburger-menu-modal';
        const header = document.createElement('div');
        header.className = 'hamburger-menu-header';
        header.innerHTML = `
            <h2 class="hamburger-menu-title">Menu</h2>
            <button class="hamburger-menu-close" aria-label="Close menu">✕</button>
        `;
        const content = document.createElement('div');
        content.className = 'hamburger-menu-content';
        const menuItems = [
            { icon: '👤', label: 'About Shona Sparrow', desc: 'Learn about our founder and mission', action: 'SHOW_ABOUT_FOUNDER' },
            { icon: '🌊', label: 'Moon Tide Reconciliation', desc: 'Our workshops and vision', action: 'SHOW_MOON_TIDE_VISION' },
            // { icon: '🛍️', label: 'Products', desc: 'Browse our collections', action: 'SHOW_PRODUCT_SECTIONS' }, // Temporarily disabled
            { icon: '📅', label: 'Schedule Workshop', desc: 'Book a transformative workshop', action: 'SHOW_WORKSHOP_BOOKING' },
            { icon: '🌍', label: 'Moon Tide World', desc: 'Explore the expanded Moon Tide experience', action: 'SHOW_MOON_TIDE_WORLD' },
            { icon: '📬', label: 'Contact', desc: 'Get in touch with us', action: 'SHOW_CONTACT_INFO' },
            { icon: '🗑️', label: 'Delete Data', desc: 'Request your data to be deleted', action: 'SHOW_DELETE_DATA' }
        ];
        menuItems.forEach(item => {
            const button = document.createElement('button');
            button.className = 'hamburger-menu-button';
            button.innerHTML = `
                <span class="hamburger-menu-button-icon">${item.icon}</span>
                <div>
                    <p class="hamburger-menu-button-text">${item.label}</p>
                    <p class="hamburger-menu-button-description">${item.desc}</p>
                </div>
            `;
            button.addEventListener('click', () => {
                soundManager.playSound('uiClick').catch(e => console.error('Menu sound error:', e));
                this.handleMenuItemClick(item.action);
            });
            content.appendChild(button);
        });
        modal.appendChild(header);
        modal.appendChild(content);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // MODIFIED: Attach close listeners that call the updated closeMenu function.
        const closeBtn = header.querySelector('.hamburger-menu-close');
        closeBtn.addEventListener('click', () => this.closeMenu()); // No arguments needed
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeMenu(); // No arguments needed
        });

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeMenu(); // No arguments needed
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        this.currentBackdrop = backdrop;
        this.currentModal = modal;

        // NEW: Add a dummy entry to the browser history.
        history.pushState({ menuOpen: true }, '', '#menu-open');
    },

    /**
     * Handle menu item clicks - integrate with module system
     */
    handleMenuItemClick(action) {
        console.log('[HamburgerMenu] Menu item clicked:', action);
        this.closeMenu();

        // Handle the special case for workshop booking modal
        if (action === 'SHOW_WORKSHOP_BOOKING') {
            if (window.smartMessageRenderer && typeof window.smartMessageRenderer.showBookingModal === 'function') {
                window.smartMessageRenderer.showBookingModal();
            } else {
                console.warn('[HamburgerMenu] smartMessageRenderer not available for workshop booking');
            }
        }
        // Handle Moon Tide World - navigate to world HTML
        else if (action === 'SHOW_MOON_TIDE_WORLD') {
            console.log('[Moon Tide World] Button clicked! Navigating to Moon Tide World...');
            if (window.smartMessageRenderer && typeof window.smartMessageRenderer.handleExpandWorldClick === 'function') {
                window.smartMessageRenderer.handleExpandWorldClick();
            } else {
                console.warn('[HamburgerMenu] smartMessageRenderer not available for Moon Tide World');
            }
        }
        // --- THE FIX: Let all other actions be handled by the module manager ---
        else if (window.jarvisManager && typeof window.jarvisManager.loadAction === 'function') {
            // This will now correctly handle:
            // - SHOW_ABOUT_SHONA (loads chrystal.js module)
            // - SHOW_MOON_TIDE_INFO (loads musqueam.js module)
            // - SHOW_PRODUCT_SECTIONS
            // - SHOW_CONTACT_INFO
            window.jarvisManager.loadAction(action, {});
        } else {
            console.warn('[HamburgerMenu] jarvisManager not available');
        }
    },

    /**
     * MODIFIED: Close the menu modal with animation and handle history.
     */
    closeMenu(options = {}) {
        if (!this.isOpen) return;

        console.log('[HamburgerMenu] Closing menu');
        this.isOpen = false;

        if (this.currentModal) this.currentModal.classList.add('closing');
        if (this.currentBackdrop) this.currentBackdrop.classList.add('closing');

        // NEW: If the menu was closed by a click (not the back button),
        // we need to go back in history ourselves to remove the #menu-open state.
        if (!options.fromHistory && window.location.hash === '#menu-open') {
            history.back();
        }

        setTimeout(() => {
            if (this.currentBackdrop && this.currentBackdrop.parentNode) {
                this.currentBackdrop.remove();
            }
            this.currentBackdrop = null;
            this.currentModal = null;
        }, 300); // Wait for animation to finish
    },

    // ... (The rest of the file: openContactModal, closeContactModal, copyToClipboard can remain unchanged)
    // For completeness, I'll include them here.

    /**
     * Open contact info modal (smaller variant, not fullscreen)
     */
    openContactModal() {
        console.log('[HamburgerMenu] Opening contact modal');

        const backdrop = document.createElement('div');
        backdrop.className = 'hamburger-menu-backdrop';

        const modal = document.createElement('div');
        modal.className = 'contact-info-modal';

        const header = document.createElement('div');
        header.className = 'contact-info-header';
        header.innerHTML = `
            <h2 class="contact-info-title">📬 Contact Chrystal</h2>
            <button class="contact-info-close" aria-label="Close contact">✕</button>
        `;

        const content = document.createElement('div');
        content.className = 'contact-info-content';
        content.innerHTML = `
            <div class="contact-info-item">
                <p class="contact-info-label">Email</p>
                <p class="contact-info-value">chrystal@example.com</p>
                <button class="contact-info-copy-btn" data-value="chrystal@example.com">📋 Copy Email</button>
            </div>

            <div class="contact-info-item">
                <p class="contact-info-label">Phone</p>
                <p class="contact-info-value">+1 (604) 555-0147</p>
                <button class="contact-info-copy-btn" data-value="+1 (604) 555-0147">📋 Copy Phone</button>
            </div>

            <div class="contact-info-item">
                <p class="contact-info-label">Location</p>
                <p class="contact-info-value">Vancouver, BC, Canada</p>
                <button class="contact-info-copy-btn" data-value="Vancouver, BC, Canada">📋 Copy Location</button>
            </div>

            <div class="contact-info-item">
                <p class="contact-info-label">Instagram</p>
                <p class="contact-info-value">@chrystal_sparrow</p>
                <button class="contact-info-copy-btn" data-value="@chrystal_sparrow">📋 Copy Handle</button>
            </div>
        `;

        content.querySelectorAll('.contact-info-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                this.copyToClipboard(value, e.target);
            });
        });

        modal.appendChild(header);
        modal.appendChild(content);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const closeBtn = header.querySelector('.contact-info-close');
        closeBtn.addEventListener('click', () => this.closeContactModal(backdrop));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeContactModal(backdrop);
        });

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeContactModal(backdrop);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    },

    /**
     * Close contact modal
     */
    closeContactModal(backdrop) {
        if (!backdrop) return;

        const modal = backdrop.querySelector('.contact-info-modal');
        if (modal) modal.classList.add('closing');
        backdrop.classList.add('closing');

        setTimeout(() => {
            if (backdrop.parentNode) backdrop.remove();
        }, 300);
    },

    /**
     * Copy to clipboard with visual feedback
     */
    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('[HamburgerMenu] Copied to clipboard:', text);

            const originalText = buttonElement.textContent;
            buttonElement.textContent = '✓ Copied!';
            buttonElement.classList.add('copied');

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('[HamburgerMenu] Failed to copy:', err);
        });
    }
};

export default hamburgerMenu;