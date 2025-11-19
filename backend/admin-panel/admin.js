/**
 * Store Printer Admin Panel JavaScript
 */

const API_BASE = window.location.origin;

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Show result message
function showResult(elementId, message, isSuccess) {
    const resultEl = document.getElementById(elementId);
    resultEl.textContent = message;
    resultEl.className = `result ${isSuccess ? 'success' : 'error'}`;
    resultEl.style.display = 'block';

    setTimeout(() => {
        resultEl.style.display = 'none';
    }, 10000);
}

// Generate config with AI
async function generateConfig() {
    const uid = document.getElementById('uid').value.trim();
    const configType = document.getElementById('configType').value;
    const prompt = document.getElementById('prompt').value.trim();
    const autoSave = document.getElementById('autoSave').checked;

    if (!prompt) {
        showResult('generateResult', 'Please enter a prompt describing your store', false);
        return;
    }

    try {
        const button = event.target;
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> Generating...';

        const response = await fetch(`${API_BASE}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                config_type: configType,
                uid: uid || undefined,
                auto_save: autoSave && uid
            })
        });

        const data = await response.json();

        if (response.ok) {
            const config = JSON.stringify(data.config, null, 2);
            document.getElementById('configEditor').value = config;
            document.getElementById('manageUid').value = uid;

            let message = '✅ Config generated successfully!\n\n';

            if (data.save_result?.saved) {
                message += '💾 Auto-saved to Firestore\n';
            }

            if (data.validation.valid) {
                message += '✓ Validation passed';
            } else {
                message += `⚠️ Validation issues: ${data.validation.errors.length} errors, ${data.validation.warnings.length} warnings`;
            }

            showResult('generateResult', message, true);

            // Show validation results
            displayValidation(data.validation);

            // Switch to manage tab
            showTab('manage');

        } else {
            showResult('generateResult', `❌ Error: ${data.error || data.message}`, false);
        }
    } catch (error) {
        showResult('generateResult', `❌ Error: ${error.message}`, false);
    } finally {
        event.target.disabled = false;
        event.target.innerHTML = '🤖 Generate with AI';
    }
}

// Load config
async function loadConfig() {
    const uid = document.getElementById('manageUid').value.trim();

    if (!uid) {
        showResult('manageResult', 'Please enter a User ID', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/config/${uid}`);
        const data = await response.json();

        if (response.ok) {
            const config = JSON.stringify(data.config, null, 2);
            document.getElementById('configEditor').value = config;
            showResult('manageResult', '✅ Config loaded successfully', true);
        } else {
            showResult('manageResult', `❌ ${data.error || 'Failed to load config'}`, false);
        }
    } catch (error) {
        showResult('manageResult', `❌ Error: ${error.message}`, false);
    }
}

// Validate current config
async function validateCurrentConfig() {
    const configText = document.getElementById('configEditor').value.trim();

    if (!configText) {
        showResult('manageResult', 'No config to validate', false);
        return;
    }

    try {
        const config = JSON.parse(configText);
        const uid = document.getElementById('manageUid').value.trim() || 'temp';

        const response = await fetch(`${API_BASE}/api/config/${uid}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config, strict: false })
        });

        const data = await response.json();

        if (data.valid) {
            showResult('manageResult', '✅ Config is valid!', true);
        } else {
            showResult('manageResult', `⚠️ Validation failed: ${data.errors.length} errors, ${data.warnings.length} warnings`, false);
        }

        displayValidation(data);

    } catch (error) {
        if (error instanceof SyntaxError) {
            showResult('manageResult', '❌ Invalid JSON format', false);
        } else {
            showResult('manageResult', `❌ Error: ${error.message}`, false);
        }
    }
}

// Save config
async function saveConfig() {
    const uid = document.getElementById('manageUid').value.trim();
    const configText = document.getElementById('configEditor').value.trim();

    if (!uid) {
        showResult('manageResult', 'Please enter a User ID', false);
        return;
    }

    if (!configText) {
        showResult('manageResult', 'No config to save', false);
        return;
    }

    try {
        const config = JSON.parse(configText);

        const button = event.target;
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> Saving...';

        const response = await fetch(`${API_BASE}/api/config/${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                config,
                validate: true,
                strict: false
            })
        });

        const data = await response.json();

        if (response.ok) {
            showResult('manageResult', '✅ Config saved successfully!', true);

            if (data.validation) {
                displayValidation(data.validation);
            }
        } else {
            showResult('manageResult', `❌ ${data.error || 'Failed to save config'}`, false);

            if (data.validation) {
                displayValidation(data.validation);
            }
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            showResult('manageResult', '❌ Invalid JSON format', false);
        } else {
            showResult('manageResult', `❌ Error: ${error.message}`, false);
        }
    } finally {
        event.target.disabled = false;
        event.target.innerHTML = '💾 Save Config';
    }
}

// Check deploy status
async function checkDeployStatus() {
    const uid = document.getElementById('deployUid').value.trim();

    if (!uid) {
        showResult('deployResult', 'Please enter a User ID', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/deploy/${uid}/status`);
        const data = await response.json();

        if (response.ok) {
            let message = `📊 Deployment Status for ${uid}\n\n`;
            message += `Status: ${data.status}\n`;
            message += `Deployed: ${data.deployed ? 'Yes' : 'No'}\n`;

            if (data.deployed_at) {
                message += `Last Deployed: ${new Date(data.deployed_at).toLocaleString()}\n`;
            }

            if (data.frontend_url) {
                message += `\n🌐 Storefront URL:\n${data.frontend_url}`;
            }

            showResult('deployResult', message, true);

            if (data.validation) {
                displayValidation(data.validation);
            }
        } else {
            showResult('deployResult', `❌ ${data.error || 'Failed to check status'}`, false);
        }
    } catch (error) {
        showResult('deployResult', `❌ Error: ${error.message}`, false);
    }
}

// Publish config
async function publishConfig() {
    const uid = document.getElementById('deployUid').value.trim();

    if (!uid) {
        showResult('deployResult', 'Please enter a User ID', false);
        return;
    }

    // Get config from manage tab or fetch it
    let config;
    const configText = document.getElementById('configEditor').value.trim();

    if (configText) {
        try {
            config = JSON.parse(configText);
        } catch (error) {
            showResult('deployResult', '❌ Invalid config JSON', false);
            return;
        }
    } else {
        // Fetch config from API
        try {
            const response = await fetch(`${API_BASE}/api/config/${uid}`);
            const data = await response.json();

            if (!response.ok) {
                showResult('deployResult', '❌ No config found to publish', false);
                return;
            }

            config = data.config;
        } catch (error) {
            showResult('deployResult', `❌ Error fetching config: ${error.message}`, false);
            return;
        }
    }

    try {
        const button = event.target;
        button.disabled = true;
        button.innerHTML = '<span class="loading"></span> Publishing...';

        const response = await fetch(`${API_BASE}/api/deploy/${uid}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config, force: false })
        });

        const data = await response.json();

        if (response.ok) {
            let message = '✅ Config published successfully!\n\n';
            message += `🌐 Storefront URL:\n${data.frontend_url}\n\n`;
            message += `📡 Config API:\n${data.config_url}`;

            showResult('deployResult', message, true);

            if (data.validation) {
                displayValidation(data.validation);
            }
        } else {
            showResult('deployResult', `❌ ${data.error || 'Failed to publish'}`, false);

            if (data.validation) {
                displayValidation(data.validation);
            }
        }
    } catch (error) {
        showResult('deployResult', `❌ Error: ${error.message}`, false);
    } finally {
        event.target.disabled = false;
        event.target.innerHTML = '🚀 Publish to Storefront';
    }
}

// Display validation results
function displayValidation(validation) {
    const container = document.getElementById('validationResults');

    if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
        container.innerHTML = '';
        return;
    }

    let html = '<h3>Validation Results</h3>';

    validation.errors.forEach(error => {
        html += `
            <div class="validation-item error">
                <strong>❌ Error:</strong> ${error.field || 'General'}<br>
                ${error.message}
            </div>
        `;
    });

    validation.warnings.forEach(warning => {
        html += `
            <div class="validation-item warning">
                <strong>⚠️ Warning:</strong> ${warning.field || 'General'}<br>
                ${warning.message}
            </div>
        `;
    });

    container.innerHTML = html;
}
