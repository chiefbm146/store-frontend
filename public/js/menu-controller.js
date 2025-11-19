// public/js/menu-controller.js
import appStore from './app-store.js';

class MenuController {
    constructor() {
        this.isMenuOpen = false;
        this.hamburgerBtn = null;
        this.closeModuleBtn = null;
        this.menuDropdown = null;
        this.contentArea = null;
        this.defaultContent = null;
        this.currentContent = 'default';

        // Store bound handlers to remove them later
        this.boundHandlers = {
            hamburgerClick: null,
            closeModuleClick: null,
            menuDropdownClick: null,
            keydownListener: null
        };

        this.init();
    }

    init() {
        console.log("🔄 Menu Controller Initializing...");
        this.cacheDOMElements();
        this.removeEventListeners(); // Clean up old listeners first!
        this.setupEventListeners();
        this.setupStoreListener();
        this.updateButtonState();
        console.log("✓ Menu Controller Ready.");
    }

    removeEventListeners() {
        console.log("🧹 [removeEventListeners] Cleaning up old event listeners...");

        // Remove hamburger click listener
        if (this.hamburgerBtn && this.boundHandlers.hamburgerClick) {
            this.hamburgerBtn.removeEventListener('click', this.boundHandlers.hamburgerClick);
            console.log("✓ Removed old hamburger click listener");
        }

        // Remove close module click listener
        if (this.closeModuleBtn && this.boundHandlers.closeModuleClick) {
            this.closeModuleBtn.removeEventListener('click', this.boundHandlers.closeModuleClick);
            console.log("✓ Removed old close module click listener");
        }

        // Remove menu dropdown click listener
        if (this.menuDropdown && this.boundHandlers.menuDropdownClick) {
            this.menuDropdown.removeEventListener('click', this.boundHandlers.menuDropdownClick);
            console.log("✓ Removed old menu dropdown click listener");
        }

        // Remove keydown listener
        if (this.boundHandlers.keydownListener) {
            document.removeEventListener('keydown', this.boundHandlers.keydownListener);
            console.log("✓ Removed old keydown listener");
        }

        console.log("✓ [removeEventListeners] Cleanup complete");
    }

    cacheDOMElements() {
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.closeModuleBtn = document.getElementById('closeModuleBtn');
        this.menuDropdown = document.getElementById('menuDropdown');
        this.contentArea = document.querySelector('.content-area');
        this.defaultContent = document.getElementById('defaultContent');

        console.log("[cacheDOMElements]", {
            hamburgerBtn: this.hamburgerBtn ? "✓ FOUND" : "✗ NOT FOUND",
            closeModuleBtn: this.closeModuleBtn ? "✓ FOUND" : "✗ NOT FOUND",
            menuDropdown: this.menuDropdown ? "✓ FOUND" : "✗ NOT FOUND",
            contentArea: this.contentArea ? "✓ FOUND" : "✗ NOT FOUND",
            defaultContent: this.defaultContent ? "✓ FOUND" : "✗ NOT FOUND"
        });

        if (!this.hamburgerBtn || !this.menuDropdown) {
            console.error("❌ Menu Controller: Required DOM elements not found!");
            return;
        }

        console.log("✓ Menu Controller: DOM elements cached successfully");
    }

    setupStoreListener() {
        // Listen to app store changes to update button visibility
        window.addEventListener('app-state-changed', (e) => {
            console.log("[MenuController] App state changed:", e.detail);
            this.updateButtonState();
        });
    }

    updateButtonState() {
        const isModuleActive = appStore.state.isModuleActive;
        console.log("[updateButtonState] Called. isModuleActive:", isModuleActive);

        // Re-cache buttons to ensure we have current DOM references
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.closeModuleBtn = document.getElementById('closeModuleBtn');

        console.log("[updateButtonState] After recaching:", {
            hamburgerBtn: this.hamburgerBtn ? "✓ FOUND" : "✗ NOT FOUND",
            closeModuleBtn: this.closeModuleBtn ? "✓ FOUND" : "✗ NOT FOUND"
        });

        if (isModuleActive) {
            // Module is active: hide hamburger, show close button
            if (this.hamburgerBtn) {
                this.hamburgerBtn.style.display = 'none';
                console.log("[updateButtonState] SET hamburgerBtn.style.display = 'none'");
            }
            if (this.closeModuleBtn) {
                this.closeModuleBtn.style.display = 'block';
                console.log("[updateButtonState] SET closeModuleBtn.style.display = 'block'");
            }
            // Ensure menu is closed
            if (this.isMenuOpen) {
                console.log("[updateButtonState] Menu is open, closing it");
                this.closeMenu();
            }
            console.log("✓ [updateButtonState] Module active - close button should be visible");
        } else {
            // Module is not active: show hamburger, hide close button
            if (this.hamburgerBtn) {
                this.hamburgerBtn.style.display = 'block';
                console.log("[updateButtonState] SET hamburgerBtn.style.display = 'block'");
            }
            if (this.closeModuleBtn) {
                this.closeModuleBtn.style.display = 'none';
                console.log("[updateButtonState] SET closeModuleBtn.style.display = 'none'");
            }
            console.log("✓ [updateButtonState] Module inactive - hamburger should be visible");
        }

        // Log final button states
        console.log("[updateButtonState] FINAL BUTTON STATES:", {
            hamburgerBtn_display: this.hamburgerBtn?.style.display || "element not found",
            closeModuleBtn_display: this.closeModuleBtn?.style.display || "element not found"
        });
    }

    setupEventListeners() {
        console.log("[setupEventListeners] Starting...");

        // Hamburger menu toggle - handles both open and close
        if (this.hamburgerBtn) {
            console.log("✓ Attaching click listener to hamburgerBtn");
            this.boundHandlers.hamburgerClick = () => {
                console.log("[hamburgerBtn CLICKED] isMenuOpen:", this.isMenuOpen);
                if (this.isMenuOpen) {
                    this.closeMenu();
                } else {
                    this.openMenu();
                }
            };
            this.hamburgerBtn.addEventListener('click', this.boundHandlers.hamburgerClick);
        } else {
            console.error("❌ hamburgerBtn not found when setting up listeners!");
        }

        // Close module button
        if (this.closeModuleBtn) {
            console.log("✓ Attaching click listener to closeModuleBtn");
            this.boundHandlers.closeModuleClick = () => {
                console.log("[closeModuleBtn CLICKED]");
                this.closeActiveModule();
            };
            this.closeModuleBtn.addEventListener('click', this.boundHandlers.closeModuleClick);
        } else {
            console.warn("⚠ closeModuleBtn not found when setting up listeners (this is OK initially)");
        }

        // Close menu when clicking outside
        if (this.menuDropdown) {
            console.log("✓ Attaching click listener to menuDropdown background");
            this.boundHandlers.menuDropdownClick = (e) => {
                if (e.target === this.menuDropdown) {
                    console.log("[menuDropdown background CLICKED]");
                    this.closeMenu();
                }
            };
            this.menuDropdown.addEventListener('click', this.boundHandlers.menuDropdownClick);
        } else {
            console.error("❌ menuDropdown not found when setting up listeners!");
        }

        // Handle all menu item clicks
        this.setupMenuItemListeners();

        // Keyboard shortcuts
        this.boundHandlers.keydownListener = (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                console.log("[ESC key pressed] Closing menu");
                this.closeMenu();
            }
        };
        document.addEventListener('keydown', this.boundHandlers.keydownListener);

        console.log("✓ Event listeners setup complete");
    }

    closeActiveModule() {
        const activeModule = appStore.state.activeModule;
        console.log(`Closing module: ${activeModule}`);

        if (!activeModule) {
            console.warn("No active module to close");
            return;
        }

        // Get the module instance and call its close method
        if (window[activeModule] && typeof window[activeModule].close === 'function') {
            window[activeModule].close();

            // Ensure button state is updated after module closes
            setTimeout(() => {
                this.updateButtonState();
            }, 200);
        } else {
            console.error(`Module instance not found or has no close method: ${activeModule}`);
        }
    }

    setupMenuItemListeners() {
        const menuItems = document.querySelectorAll('.menu-item[data-action]');

        menuItems.forEach(item => {
            // Remove existing listeners to prevent duplicates
            item.removeEventListener('click', this.boundMenuItemClickHandler);
            // Add new listener
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleMenuItemClick(action);
            });
        });

        console.log(`Menu Controller: Set up listeners for ${menuItems.length} menu items`);
    }

    openMenu() {
        console.log("[openMenu] Called. isMenuOpen current state:", this.isMenuOpen);
        if (this.isMenuOpen) {
            console.log("⚠ Menu already open, returning");
            return;
        }

        this.isMenuOpen = true;
        console.log("[openMenu] Set isMenuOpen to true");

        if (this.menuDropdown) {
            console.log("[openMenu] Adding 'open' class to menuDropdown");
            this.menuDropdown.classList.add('open');
        } else {
            console.error("❌ [openMenu] menuDropdown is null!");
        }

        // Hide default content
        if (this.defaultContent) {
            console.log("[openMenu] Hiding defaultContent");
            this.defaultContent.style.display = 'none';
        }

        // Update hamburger icon to X (if button is visible)
        if (this.hamburgerBtn && this.hamburgerBtn.style.display !== 'none') {
            const icon = this.hamburgerBtn.querySelector('i');
            if (icon) {
                console.log("[openMenu] Changing hamburger icon to X");
                icon.className = 'fas fa-times';
            }
        }

        // Update store
        appStore.dispatch('setMenuOpen', { isOpen: true });

        console.log("✓ Menu opened successfully");
    }

    closeMenu() {
        console.log("[closeMenu] Called. isMenuOpen current state:", this.isMenuOpen);
        if (!this.isMenuOpen) {
            console.log("⚠ Menu already closed, returning");
            return;
        }

        this.isMenuOpen = false;
        console.log("[closeMenu] Set isMenuOpen to false");

        if (this.menuDropdown) {
            console.log("[closeMenu] Removing 'open' class from menuDropdown");
            this.menuDropdown.classList.remove('open');
        } else {
            console.error("❌ [closeMenu] menuDropdown is null!");
        }

        // Show default content
        if (this.defaultContent) {
            console.log("[closeMenu] Showing defaultContent");
            this.defaultContent.style.display = 'flex';
        }

        // Reset hamburger icon (if button is visible)
        if (this.hamburgerBtn && this.hamburgerBtn.style.display !== 'none') {
            const icon = this.hamburgerBtn.querySelector('i');
            if (icon) {
                console.log("[closeMenu] Changing icon back to hamburger bars");
                icon.className = 'fas fa-bars';
            }
        }

        // Update store
        appStore.dispatch('setMenuOpen', { isOpen: false });

        console.log("✓ Menu closed successfully");
    }

    handleMenuItemClick(action) {
        console.log(`Menu item clicked: ${action}`);
        
        // Close the menu first
        this.closeMenu();
        
        // Handle the action
        switch (action) {
            case 'google-signin':
                this.handleGoogleSignIn();
                break;
            case 'kairos-blanket-person':
                this.loadContent('kairos-blanket-person');
                break;
            case 'kairos-blanket-virtual':
                this.loadContent('kairos-blanket-virtual');
                break;
            case 'cedar-bracelet':
                this.loadContent('cedar-bracelet');
                break;
            case 'cedar-rope-bracelet':
                this.loadContent('cedar-rope-bracelet');
                break;
            case 'cedar-basket':
                this.loadContent('cedar-basket');
                break;
            case 'cedar-coasters':
                this.loadContent('cedar-coasters');
                break;
            case 'email':
                this.handleEmail();
                break;
            case 'phone':
                this.handlePhone();
                break;
            case 'shopping-cart':
                this.showComingSoon('shopping-cart');
                break;
            default:
                console.warn(`Unhandled menu action: ${action}`);
                this.showComingSoon(action);
        }
    }

    // Content loading system for individual feature files
    loadContent(contentType) {
        console.log(`Loading content: ${contentType}`);

        // Handle specific feature modules
        switch (contentType) {
            case 'kairos-blanket-person':
                this.loadKairosLive();
                break;
            case 'kairos-blanket-virtual':
                this.loadKairosVirtual();
                break;
            case 'cedar-bracelet':
                this.loadCedarBracelet();
                break;
            case 'cedar-rope-bracelet':
                this.loadCedarRopeBracelet();
                break;
            case 'cedar-basket':
                this.loadCedarBasket();
                break;
            case 'cedar-coasters':
                this.loadCedarCoasters();
                break;
            default:
                // For other features, show placeholder for now
                this.showContentPlaceholder(contentType);
        }
    }

    // Load the Kairos Live overlay
    async loadKairosLive() {
        try {
            // Import and activate the kairos-live module
            const kairosModule = await import('./kairos-live.js');
            kairosModule.default.activate();
        } catch (error) {
            console.error('Failed to load Kairos Live module:', error);
            this.showComingSoon('kairos-blanket-person');
        }
    }

    // Load Kairos Virtual module
    async loadKairosVirtual() {
        try {
            const module = await import('./kairos-virtual.js');
            module.default.activate();
        } catch (error) {
            console.error('Failed to load Kairos Virtual module:', error);
            this.showComingSoon('kairos-blanket-virtual');
        }
    }

    // Load Cedar Bracelet module
    async loadCedarBracelet() {
        try {
            const module = await import('./cedar-bracelet.js');
            module.default.activate();
        } catch (error) {
            console.error('Failed to load Cedar Bracelet module:', error);
            this.showComingSoon('cedar-bracelet');
        }
    }

    // Load Cedar Rope Bracelet module
    async loadCedarRopeBracelet() {
        try {
            const module = await import('./cedar-rope-bracelet.js');
            module.default.activate();
        } catch (error) {
            console.error('Failed to load Cedar Rope Bracelet module:', error);
            this.showComingSoon('cedar-rope-bracelet');
        }
    }

    // Load Cedar Basket module
    async loadCedarBasket() {
        try {
            const module = await import('./cedar-basket.js');
            module.default.activate();
        } catch (error) {
            console.error('Failed to load Cedar Basket module:', error);
            this.showComingSoon('cedar-basket');
        }
    }

    // Load Cedar Coasters module
    async loadCedarCoasters() {
        try {
            const module = await import('./cedar-coasters.js');
            module.default.activate();
        } catch (error) {
            console.error('Failed to load Cedar Coasters module:', error);
            this.showComingSoon('cedar-coasters');
        }
    }

    showContentPlaceholder(contentType) {
        const contentArea = this.contentArea;
        const formattedName = contentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        contentArea.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">
                    ${formattedName}
                </h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 30px;">
                    This feature is ready for implementation. The content area can be fully customized 
                    with dedicated JavaScript files for each feature.
                </p>
                <button onclick="menuController.resetToDefault()" 
                        style="padding: 12px 24px; background: var(--menu-header); color: white; 
                               border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Back to Menu
                </button>
            </div>
        `;
        
        this.currentContent = contentType;
    }

    showComingSoon(action) {
        const contentArea = this.contentArea;
        const formattedName = action.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        contentArea.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2 style="color: var(--text-primary); margin-bottom: 20px;">
                    ${formattedName}
                </h2>
                <p style="color: var(--text-secondary); line-height: 1.6;">
                    This feature is coming soon!
                </p>
            </div>
        `;
    }

    resetToDefault() {
        const contentArea = this.contentArea;
        contentArea.innerHTML = `
            <div class="default-content" id="defaultContent">
                <img src='/images/musqueam/indigenous.png?v=8.0.1' alt="Chrystal Sparrow's Cultural Creations" class="melaney-logo">
            </div>
        `;
        
        // Re-cache the default content element
        this.defaultContent = document.getElementById('defaultContent');
        this.currentContent = 'default';
        console.log("Reset to default content");
    }

    // Placeholder methods for immediate actions
    handleGoogleSignIn() {
        console.log("Google Sign In clicked - ready for auth implementation");
        // Future: Implement actual Google Sign In
        alert("Google Sign In - Ready for implementation!");
    }

    handleEmail() {
        console.log("Email clicked - not yet implemented");
        this.showComingSoon('email');
    }

    handlePhone() {
        console.log("Phone clicked - not yet implemented");
        this.showComingSoon('phone');
    }

    // Public API for external access
    getMenuState() {
        return {
            isOpen: this.isMenuOpen,
            currentContent: this.currentContent
        };
    }

    // Method to programmatically trigger menu items (useful for deep linking)
    triggerMenuItem(action) {
        this.handleMenuItemClick(action);
    }
}

// Initialize the menu controller when DOM is loaded
let menuController;

function initMenuController() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            menuController = new MenuController();
            window.menuController = menuController; // Make globally accessible
        });
    } else {
        menuController = new MenuController();
        window.menuController = menuController; // Make globally accessible
    }
}

// Start initialization
initMenuController();

// Export for module usage
export default MenuController;