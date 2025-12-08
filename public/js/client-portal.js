// js/client-portal.js

/**
 * Client Portal - PIN-Only Login
 * Uses Firebase Custom Tokens for shared business access
 */

// Backend API configuration
const API_BASE_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';

document.addEventListener('DOMContentLoaded', () => {
  const pinInput = document.getElementById('storePin');
  const loginBtn = document.getElementById('pinLoginBtn');
  const loadingView = document.getElementById('loading');
  const errorMessage = document.getElementById('errorMessage');
  const pinSection = document.getElementById('pinSection');

  loginBtn.onclick = async () => {
    const pin = pinInput.value.trim();

    if (!pin) {
      showError("Please enter your PIN.");
      return;
    }

    // UI Loading State
    pinSection.style.display = 'none';
    loadingView.classList.add('show');
    hideError();

    try {
      // 1. Send PIN to Backend
      const response = await fetch(`${API_BASE_URL}/api/client/login-with-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // 2. Backend returns a Custom Token. Sign in with it.
      // This logs the user into Firebase as the "Store Owner"
      await firebase.auth().signInWithCustomToken(result.token);

      // 3. Success! Redirect to dashboard
      console.log("PIN Login Successful");
      window.location.replace('/client-dashboard.html');

    } catch (error) {
      console.error('Login Error:', error);
      showError(error.message);
      pinSection.style.display = 'block';
      loadingView.classList.remove('show');
      pinInput.value = ''; // Clear PIN on error
    }
  };

  // Allow Enter key to submit
  pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      loginBtn.click();
    }
  });
});

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

/**
 * Hide error message
 */
function hideError() {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.classList.remove('show');
}
