// Authentication module - Google Sign-In

// Wait for Firebase to load
function initAuth() {
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  if (!googleSignInBtn) {
    // Auth not loaded yet, wait
    setTimeout(initAuth, 100);
    return;
  }

  // Handle Google Sign-In
  googleSignInBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      showLoading(true);

      // Create Google provider
      const provider = new firebase.auth.GoogleAuthProvider();

      // Sign in with Google popup
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      console.log('Google Sign-In successful:', user.email);

      // Check if franchisee document exists
      const franchisee = await getFranchisee(user.uid);

      if (!franchisee) {
        // First time user - create franchisee document
        // Use email display name if available
        const displayName = user.displayName || user.email.split('@')[0];
        await createFranchisee(user.email, displayName);
        console.log('New franchisee created:', user.email);
      } else {
        console.log('Existing franchisee logged in:', user.email);
      }

      // App will update UI on auth state change
    } catch (error) {
      console.error('Google Sign-In error:', error);
      showError(error.message);
    } finally {
      showLoading(false);
    }
  });

  // Handle logout
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await auth.signOut();
        console.log('Logout successful');
      } catch (error) {
        showError(error.message);
      }
    });
  }
}

// Utility functions
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
  }
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAuth);
