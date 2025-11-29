// File: hamburger-menu.js

/**
 * Hamburger Menu Button - Simple Navigation to Menu Page
 *
 * Provides a floating hamburger button that navigates to the dedicated menu page.
 * The menu page uses Firebase rewrites to serve device-specific versions:
 * - Desktop: menu-desk.html (full-screen grid)
 * - Mobile: menu-mobile.html (full-screen list)
 */

const hamburgerMenu = {
    /**
     * Initialize the hamburger menu button
     * Called on page load to set up the floating button.
     */
    init() {
        this.createFloatingButton();
        this.attachButtonListener();
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
    },

    /**
     * Attach click listener to the hamburger button
     */
    attachButtonListener() {
        const button = document.getElementById('hamburger-button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateToMenu();
            });
        }
    },

    /**
     * Navigate to the menu page (direct to desktop version)
     */
    navigateToMenu() {
        window.location.href = '/menu-desk.html';
    }
};

export default hamburgerMenu;
