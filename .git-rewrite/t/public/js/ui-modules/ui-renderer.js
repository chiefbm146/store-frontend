// public/js/ui-modules/ui-renderer.js
// Provides reusable UI components for modules

const UIRenderer = {
    /**
     * Create a module wrapper with header, content, and action buttons
     */
    createModule(title, content, actions = []) {
        const module = document.createElement('div');
        module.className = 'ui-module';

        let actionsHTML = '';
        if (actions.length > 0) {
            actionsHTML = `
                <div class="module-actions">
                    ${actions.map(a => `
                        <button class="module-button ${a.style || 'secondary'}"
                                data-action="${a.id}"
                                id="action-${a.id}">
                            ${a.label}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        module.innerHTML = `
            <div class="module-header">
                <h3>${title}</h3>
            </div>
            <div class="module-content">
                ${content}
            </div>
            ${actionsHTML}
        `;

        return module;
    },

    /**
     * Create a form group with label and input
     */
    createFormGroup(label, inputType, placeholder, name, value = '') {
        if (inputType === 'textarea') {
            return `
                <div class="form-group">
                    <label for="${name}">${label}</label>
                    <textarea id="${name}" name="${name}" placeholder="${placeholder}">${value}</textarea>
                </div>
            `;
        } else if (inputType === 'select') {
            return `
                <div class="form-group">
                    <label for="${name}">${label}</label>
                    <select id="${name}" name="${name}">
                        <option value="">-- Select an option --</option>
                    </select>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label for="${name}">${label}</label>
                    <input type="${inputType}" id="${name}" name="${name}" placeholder="${placeholder}" value="${value}">
                </div>
            `;
        }
    },

    /**
     * Create a success message
     */
    createSuccess(message, icon = '✓') {
        return `
            <div class="success-message">
                <span class="success-icon">${icon}</span>
                <span>${message}</span>
            </div>
        `;
    },

    /**
     * Create an error message
     */
    createError(message) {
        return `
            <div class="error-message">
                <span class="error-icon">⚠</span>
                <span>${message}</span>
            </div>
        `;
    },

    /**
     * Create a card for displaying information
     */
    createCard(title, content, icon = null) {
        return `
            <div class="info-card">
                ${icon ? `<div class="card-icon">${icon}</div>` : ''}
                <div class="card-content">
                    <h4>${title}</h4>
                    <p>${content}</p>
                </div>
            </div>
        `;
    },

    /**
     * Create a list of items
     */
    createList(items, ordered = false) {
        const tag = ordered ? 'ol' : 'ul';
        return `
            <${tag} class="module-list">
                ${items.map(item => `<li>${item}</li>`).join('')}
            </${tag}>
        `;
    },

    /**
     * Create a key-value display
     */
    createKeyValue(pairs) {
        return `
            <div class="key-value-display">
                ${pairs.map(pair => `
                    <div class="kv-pair">
                        <span class="kv-key">${pair.key}</span>
                        <span class="kv-value">${pair.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Create a divider
     */
    createDivider() {
        return '<div class="module-divider"></div>';
    }
};

export default UIRenderer;
