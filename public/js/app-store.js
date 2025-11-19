// public/js/app-store.js

const appStore = {
    state: {
        language: 'en',
        activeModule: null,          // Current active module name
        isMenuOpen: false,           // Whether menu dropdown is open
        isModuleActive: false,       // Whether any module is currently active
    },

    dispatch(actionName, payload) {
        if (this.actions[actionName]) {
            this.actions[actionName](this.state, payload);
            console.log(`[appStore] Action: ${actionName}`, this.state);
            window.dispatchEvent(new CustomEvent('app-state-changed', { detail: { action: actionName, payload } }));
        }
    },

    actions: {
        // Module state management
        setActiveModule(state, { module }) {
            state.activeModule = module;
            state.isModuleActive = module !== null;
        },

        setMenuOpen(state, { isOpen }) {
            state.isMenuOpen = isOpen;
        },

        resetMenuState(state) {
            state.isMenuOpen = false;
            state.activeModule = null;
            state.isModuleActive = false;
        }
    }
};

export default appStore;
