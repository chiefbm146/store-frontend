import appStore from './app-store.js';

class ModuleManager {
    constructor() {
        if (ModuleManager.instance) {
            return ModuleManager.instance;
        }

        this.activeModule = null;
        this.isNavigating = false; // Flag to prevent popstate loops

        window.addEventListener('popstate', (event) => this.handleHistoryChange(event));

        ModuleManager.instance = this;
        console.log('✅ Module Manager Initialized');
    }

    static getInstance() {
        if (!ModuleManager.instance) {
            new ModuleManager();
        }
        return ModuleManager.instance;
    }

    openModule(actionType, moduleContent, payload = {}) {
        console.log(`🚀 Opening module: ${actionType}`);

        // =================================================================
        // === DIRECT VISIBILITY CONTROL (THE FIX)                       ===
        // =================================================================
        console.log('✅ Hiding main UI via ModuleManager...');
        const aiPortalElement = document.querySelector('.ai-portal');
        if (aiPortalElement) {
            aiPortalElement.classList.add('module-active');
        }
        // This function is in portal-controller but globally accessible
        if (window.toggleGlobalUI) {
            window.toggleGlobalUI(false);
        }
        // =================================================================

        // If there's already an active module, just close it without hash change
        if (this.activeModule) {
            this.activeModule = null;
            console.log(`  (Replacing previous module)`);
        }

        this.activeModule = actionType;

        // Build URL with action type and payload as query params
        let hashUrl = `#${actionType}`;
        if (Object.keys(payload).length > 0) {
            const params = new URLSearchParams(payload);
            hashUrl += `?${params.toString()}`;
        }

        // Push a state to the history
        this.isNavigating = true;
        history.pushState({ action: actionType, payload: payload }, ``, hashUrl);
        setTimeout(() => { this.isNavigating = false; }, 100);

        // Render the module content
        const moduleContainer = document.getElementById('moduleContainer');
        if (moduleContainer) {
            moduleContainer.innerHTML = moduleContent;
            moduleContainer.style.display = 'block';
        }

        // STILL DISPATCH: For any other systems that might need to know.
        appStore.dispatch('setActiveModule', { module: actionType });
    }

    closeCurrentModule(fromHistory = false) {
        if (!this.activeModule) {
            return;
        }

        console.log(`❌ Closing module: ${this.activeModule}`);

        // =================================================================
        // === DIRECT VISIBILITY CONTROL (THE FIX)                       ===
        // =================================================================
        console.log('✅ Restoring main UI via ModuleManager...');
        const aiPortalElement = document.querySelector('.ai-portal');
        if (aiPortalElement) {
            aiPortalElement.classList.remove('module-active');
        }
        // This function is in portal-controller but globally accessible
        if (window.toggleGlobalUI) {
            window.toggleGlobalUI(true);
        }
        // =================================================================

        const moduleName = this.activeModule;
        this.activeModule = null;

        // Clear the current module from jarvisManager as well
        if (window.portalController && window.portalController.jarvisManager) {
            window.portalController.jarvisManager.currentModule = null;
        }

        // Hide the module content
        const moduleContainer = document.getElementById('moduleContainer');
        if (moduleContainer) {
            moduleContainer.innerHTML = '';
            moduleContainer.style.display = 'none';
        }

        // If the closure was not triggered by a history change (i.e., user clicked a close button)
        // Check if current hash starts with the module name (handles query params)
        if (!fromHistory && window.location.hash.startsWith(`#${moduleName}`)) {
            this.isNavigating = true;
            // Set hash to empty to go back to main view (triggers popstate)
            window.location.hash = '';
            setTimeout(() => { this.isNavigating = false; }, 100);
        }

        // STILL DISPATCH: For any other systems that might need to know.
        appStore.dispatch('setActiveModule', { module: null });
    }

    handleHistoryChange(event) {
        if (this.isNavigating) {
            return; // Ignore events caused by our own code
        }

        console.log('◀️ Back button pressed.');

        // If any module is open, close it. That's it.
        if (this.activeModule) {
            console.log('◀️ A module is active, closing it to return to main page.');
            // The 'true' flag tells the close function this was triggered by history,
            // preventing it from creating a loop.
            this.closeCurrentModule(true);
        }
    }
}

const moduleManager = new ModuleManager();

if (typeof window !== 'undefined') {
    window.moduleManager = moduleManager;
}

export default moduleManager;
