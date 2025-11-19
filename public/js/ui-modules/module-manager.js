// public/js/ui-modules/module-manager.js
// Manages dynamic loading and lifecycle of UI modules

const moduleManager = {
    activeModule: null,
    moduleInstances: {},
    moduleContainer: null,
    inputArea: null,

    async init() {
        console.log("[moduleManager] Initializing...");
        this.moduleContainer = document.getElementById('moduleContainer');
        this.inputArea = document.querySelector('.input-area');

        if (!this.moduleContainer) {
            console.error("[moduleManager] Module container not found in DOM!");
            return false;
        }

        console.log("[moduleManager] ✓ Initialized successfully");
        return true;
    },

    async loadModule(actionType, payload) {
        try {
            console.log(`[moduleManager] Loading module: ${actionType}`, payload);

            // Get the module file path
            const moduleFile = this.getModuleFile(actionType);

            // Dynamically import the module
            const module = await import(`./modules/${moduleFile}`);
            this.activeModule = module.default;
            this.moduleInstances[actionType] = module.default;

            // Hide input area
            if (this.inputArea) {
                this.inputArea.style.display = 'none';
            }

            // Render the module with payload
            this.activeModule.render(this.moduleContainer, payload);

            console.log(`[moduleManager] ✓ Module loaded: ${actionType}`);

        } catch (error) {
            console.error(`[moduleManager] Failed to load module: ${actionType}`, error);
            this.showErrorModule(actionType);
        }
    },

    getModuleFile(actionType) {
        const mapping = {
            'SHOW_CONTACT_FORM': 'contact-form.js',
            'SHOW_WORKSHOP_BOOKING': 'workshop-booking.js',
            'SHOW_WORKSHOP_DETAILS': 'workshop-details.js',
            'SHOW_CONFIRMATION': 'confirmation.js'
        };
        return mapping[actionType] || 'default.js';
    },

    closeActiveModule() {
        console.log("[moduleManager] Closing active module");

        if (this.activeModule && typeof this.activeModule.close === 'function') {
            this.activeModule.close();
        }

        this.moduleContainer.innerHTML = '';
        this.activeModule = null;

        // Show input area
        if (this.inputArea) {
            this.inputArea.style.display = 'flex';
            const userInput = document.getElementById('userInput');
            if (userInput) {
                userInput.focus();
            }
        }

        console.log("[moduleManager] ✓ Module closed");
    },

    showErrorModule(actionType) {
        const errorHTML = `
            <div class="ui-module error-module">
                <div class="module-header">
                    <h3>Module Loading Error</h3>
                </div>
                <div class="module-content">
                    <p>Sorry, we couldn't load the ${actionType} interface. Please try again or ask for help.</p>
                </div>
                <div class="module-actions">
                    <button class="module-button secondary" id="closeErrorModule">Close</button>
                </div>
            </div>
        `;

        this.moduleContainer.innerHTML = errorHTML;
        document.getElementById('closeErrorModule').addEventListener('click', () => {
            this.closeActiveModule();
        });
    }
};

export default moduleManager;
