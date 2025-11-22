/**
 * Client Portal - Firebase Auth & Login
 * Handles Google Sign-in and Firestore client creation
 */

let db;
let auth;
let currentUser;

/**
 * Initialize Firebase when SDK loads
 */
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    db = firebase.firestore();

    // Set up auth state listener
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        console.log('✅ User signed in:', user.email);
      } else {
        console.log('User logged out');
      }
    });

    // Initialize auth UI
    initAuth();
  } else {
    console.error('❌ Firebase SDK not loaded');
  }
});

/**
 * Initialize auth UI and event listeners
 */
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

      console.log('✅ Google Sign-In successful:', user.email);

      // Check if client document exists
      const clientDoc = await db.collection('clients').doc(user.uid).get();

      if (!clientDoc.exists) {
        // First time user - create client document
        const displayName = user.displayName || user.email.split('@')[0];
        await db.collection('clients').doc(user.uid).set({
          uid: user.uid,
          email: user.email,
          name: displayName,
          photoURL: user.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ New client created:', user.email);
      } else {
        console.log('✅ Existing client logged in:', user.email);
      }

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/client-dashboard.html';
      }, 500);
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      showError(error.message);
    } finally {
      showLoading(false);
    }
  });

  // Check if already signed in
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log('✅ User already signed in, redirecting...');
      setTimeout(() => {
        window.location.href = '/client-dashboard.html';
      }, 500);
    }
  });
}

/**
 * Show/hide loading state
 */
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
  }
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');

  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
}
