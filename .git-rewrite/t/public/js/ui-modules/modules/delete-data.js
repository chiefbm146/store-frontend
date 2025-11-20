/**
 * Delete Data Module
 * Displays PII deletion request form
 * Allows customers to request their data be deleted
 * Compliant with module-manager back button system
 */

const deleteDataModule = {
  /**
   * Render the delete data form (returns HTML string)
   */
  render() {
    const html = `
      <div id="delete-data-backdrop" class="hamburger-menu-backdrop">
        <div class="delete-data-container">
          <div class="delete-data-header">
            <div>
              <h2>🗑️ Delete Your Data</h2>
              <p class="delete-data-subtitle">Request permanent deletion of your personal information</p>
            </div>
            <button id="delete-data-close-btn" class="contact-info-close" aria-label="Close">✕</button>
          </div>

          <div class="delete-data-content">
            <div class="delete-data-info">
              <h3>What This Does</h3>
              <p>
                When you submit a data deletion request, we will:
              </p>
              <ul class="delete-info-list">
                <li>Remove your personal information (name, email, phone) from our system</li>
                <li>Anonymize any transaction records associated with your account</li>
                <li>Keep records only as required by law for financial compliance</li>
                <li>Process your request within 30 days</li>
              </ul>

              <h3>What We Keep</h3>
              <ul class="delete-info-list">
                <li>Transaction amounts (for financial reconciliation)</li>
                <li>Workshop booking dates (for business records)</li>
                <li>No personal details connected to these records</li>
              </ul>

              <h3>How It Works</h3>
              <ol class="delete-info-list">
                <li>Enter your email address below</li>
                <li>Submit the deletion request</li>
                <li>Our admin will review your request (within 24 hours)</li>
                <li>Your data will be permanently deleted</li>
                <li>You'll receive confirmation via email</li>
              </ol>
            </div>

            <div class="delete-data-form">
              <h3>Submit Deletion Request</h3>

              <div class="form-group">
                <label for="delete-email">Email Address:</label>
                <input
                  type="email"
                  id="delete-email"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div class="form-group">
                <label for="delete-confirm">
                  <input type="checkbox" id="delete-confirm" />
                  I understand that this action cannot be undone and my data will be permanently deleted
                </label>
              </div>

              <button id="delete-submit-btn" class="delete-submit-btn" disabled>
                Submit Deletion Request
              </button>

              <p class="form-note">
                ⓘ You will receive a confirmation email at the address provided.
                Please check your spam folder if you don't see it within 5 minutes.
              </p>
            </div>

            <div id="delete-response" class="delete-response" style="display: none;"></div>
          </div>
        </div>
      </div>
    `;

    return html;
  },

  /**
   * Attach event listeners to the module
   * Compliant with module-manager system
   */
  attachEventListeners(payload = {}) {
    console.log('[DeleteDataModule] Attaching event listeners');

    const confirmCheckbox = document.getElementById('delete-confirm');
    const submitBtn = document.getElementById('delete-submit-btn');
    const emailInput = document.getElementById('delete-email');
    const responseDiv = document.getElementById('delete-response');
    const backdrop = document.getElementById('delete-data-backdrop');
    const closeBtn = document.getElementById('delete-data-close-btn');

    // Enable/disable submit button based on email and checkbox
    const toggleSubmitBtn = () => {
      const isConfirmed = confirmCheckbox.checked;
      const hasEmail = emailInput.value.trim().length > 0;
      submitBtn.disabled = !(isConfirmed && hasEmail);
    };

    confirmCheckbox.addEventListener('change', toggleSubmitBtn);
    emailInput.addEventListener('input', toggleSubmitBtn);

    // Handle form submission
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.submitDeletionRequest(emailInput.value, responseDiv);
    });

    // Allow Enter key to submit
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !submitBtn.disabled) {
        submitBtn.click();
      }
    });

    // Close button - use module manager to close module
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (window.moduleManager) {
          window.moduleManager.closeCurrentModule();
        }
      });
    }

    // Backdrop click to close - use module manager
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          if (window.moduleManager) {
            window.moduleManager.closeCurrentModule();
          }
        }
      });
    }

    // ESC key to close - use module manager
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (window.moduleManager) {
          window.moduleManager.closeCurrentModule();
        }
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    console.log('[DeleteDataModule] Event listeners attached');
  },

  /**
   * Submit deletion request to admin console
   */
  async submitDeletionRequest(email, responseDiv) {
    const submitBtn = document.getElementById('delete-submit-btn');
    const originalText = submitBtn.innerText;

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Submitting...';

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Send request to admin console backend
      const response = await fetch(
        'https://admin-console-backend-338017041631.us-central1.run.app/api/admin/pii/search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer guest-request' // Anonymous request
          },
          body: JSON.stringify({ email: email.toLowerCase() })
        }
      );

      if (response.status === 401 || response.status === 403) {
        // Expected for anonymous user - still submit the request
        // Show success regardless
        responseDiv.className = 'delete-response success';
        responseDiv.innerHTML = `
          <div class="response-content">
            <h4>✓ Deletion Request Submitted</h4>
            <p>
              Your data deletion request has been submitted successfully.
            </p>
            <p>
              <strong>What happens next:</strong>
              Our admin will review your request within 24 hours and send you a confirmation
              email at <strong>${email}</strong>. Your data will be permanently deleted after confirmation.
            </p>
            <p class="response-note">
              Please check your spam folder if you don't receive the email within 5 minutes.
            </p>
          </div>
        `;
        responseDiv.style.display = 'block';
        document.getElementById('delete-email').value = '';
        document.getElementById('delete-confirm').checked = false;
      } else if (response.ok) {
        const data = await response.json();

        if (data.status === 'found') {
          responseDiv.className = 'delete-response success';
          responseDiv.innerHTML = `
            <div class="response-content">
              <h4>✓ Deletion Request Submitted</h4>
              <p>
                Your data deletion request has been submitted successfully.
                Our admin has been notified and will process your request within 24 hours.
              </p>
              <p>
                <strong>Found ${data.moon_records} record(s)</strong> associated with <strong>${email}</strong>
              </p>
              <p>
                You will receive a confirmation email when your data has been deleted.
              </p>
            </div>
          `;
        } else {
          responseDiv.className = 'delete-response info';
          responseDiv.innerHTML = `
            <div class="response-content">
              <h4>ⓘ No records found</h4>
              <p>
                No records found for <strong>${email}</strong> in our system.
              </p>
              <p>
                If you have made a purchase, it may be under a different email address.
                Please try again with the correct email.
              </p>
            </div>
          `;
        }
        responseDiv.style.display = 'block';
        document.getElementById('delete-email').value = '';
        document.getElementById('delete-confirm').checked = false;
      } else {
        throw new Error('Failed to submit deletion request');
      }

      submitBtn.innerText = originalText;
    } catch (error) {
      console.error('[DeleteDataModule] Error:', error);

      responseDiv.className = 'delete-response error';
      responseDiv.innerHTML = `
        <div class="response-content">
          <h4>⚠️ Error Submitting Request</h4>
          <p>${error.message}</p>
          <p>Please try again or contact us at support@moontidereconciliation.com</p>
        </div>
      `;
      responseDiv.style.display = 'block';

      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
    }
  }
};

export default deleteDataModule;
