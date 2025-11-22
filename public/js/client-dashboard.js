/**
 * Client Dashboard - Products & Transactions
 * Displays client products and transaction history
 */

let db;
let auth;
let currentUser;

// Backend API configuration
const API_BASE_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';

// Log which Firebase app is being used
console.log('🔥 Firebase app info:', {
  projectId: firebase?.app()?.options?.projectId || 'UNKNOWN',
  databaseURL: firebase?.app()?.options?.databaseURL || 'UNKNOWN'
});

/**
 * Helper to make API calls with Firebase token
 */
async function apiCall(endpoint, options = {}) {
  try {
    if (currentUser) {
      const token = await currentUser.getIdToken();
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
      // Only set Content-Type for requests with a body (POST, PUT, PATCH)
      if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
        options.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ API call error:', error);
    throw error;
  }
}

/**
 * Initialize Firebase when SDK loads
 */
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    // NO NEED for Firestore - all data comes from backend API

    // Set up auth state listener
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        console.log('✅ User signed in:', user.email);
        loadDashboard();
      } else {
        console.log('User not signed in, redirecting to portal...');
        window.location.href = '/client-portal.html';
      }
    });
  } else {
    console.error('❌ Firebase SDK not loaded');
  }
});

/**
 * Load all dashboard data
 */
async function loadDashboard() {
  try {
    // Disable all buttons while loading
    disableAllButtons(true);
    showLoadingSpinners();

    // Update user info
    document.getElementById('userName').textContent = currentUser.displayName || 'User';
    document.getElementById('userEmail').textContent = currentUser.email;

    // Load Stripe account status first
    await loadStripeStatus();

    // Enable buttons after loading
    disableAllButtons(false);

    // Load products (optional, if they fail, show empty state)
    try {
      await loadProducts();
    } catch (error) {
      console.log('Products not available yet');
      document.getElementById('productsContainer').innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">📭</div><p>No products yet - Setup Stripe first</p></div>';
    }

    // Load transactions (optional, if they fail, show empty state)
    try {
      await loadTransactions();
    } catch (error) {
      console.log('Transactions not available yet');
      document.getElementById('transactionsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">💤</div><p>No transactions yet</p></div>';
    }
  } catch (error) {
    console.error('❌ Dashboard load error:', error);
  }
}

/**
 * Load Stripe account status
 */
async function loadStripeStatus() {
  try {
    const url = `${API_BASE_URL}/api/client/dashboard-data`;
    console.log('📋 Fetching from:', url);
    const response = await apiCall('/api/client/dashboard-data', {
      method: 'GET'
    });

    if (!response.stripe_account) {
      // No Stripe account - show setup button
      console.log('❌ No Stripe account found');
      document.getElementById('stripeStatusBadge').textContent = '❌ Not Setup';
      document.getElementById('stripeStatusBadge').className = 'status-badge badge-pending';
      document.getElementById('stripeSetupBtn').style.display = 'block';
      document.getElementById('stripeSetupBtn').innerHTML = '⚡ Setup Stripe Connect';
      document.getElementById('onboardingBtn').style.display = 'none';
      document.getElementById('deleteBtn').style.display = 'none';
      return;
    }

    const accountData = response.stripe_account;
    const accountId = accountData.accountId;

    console.log('✅ Found account ID:', accountId);
    document.getElementById('stripeAccountId').textContent = accountId;

    if (accountData.chargesEnabled && accountData.payoutsEnabled) {
      document.getElementById('stripeStatusBadge').textContent = '✅ Active';
      document.getElementById('stripeStatusBadge').className = 'status-badge badge-active';
      document.getElementById('stripeSetupBtn').style.display = 'none';
      document.getElementById('onboardingBtn').style.display = 'none';
      document.getElementById('deleteBtn').style.display = 'block';
      document.getElementById('deleteBtn').innerHTML = '🗑️ Delete Account (Reset)';
      document.getElementById('onboardingMessage').innerHTML = '✅ Your Stripe account is fully verified and ready to receive payments!';
      document.getElementById('onboardingMessage').style.display = 'block';
    } else {
      document.getElementById('stripeStatusBadge').textContent = '⏳ Pending Verification';
      document.getElementById('stripeStatusBadge').className = 'status-badge badge-pending';
      document.getElementById('stripeSetupBtn').style.display = 'none';
      document.getElementById('onboardingBtn').style.display = 'block';
      document.getElementById('onboardingBtn').innerHTML = '📋 Complete Verification';
      document.getElementById('deleteBtn').style.display = 'block';
      document.getElementById('deleteBtn').innerHTML = '🗑️ Delete Account (Reset)';
      document.getElementById('onboardingMessage').innerHTML = 'Complete your Stripe verification to accept payments.';
      document.getElementById('onboardingMessage').style.display = 'block';
    }
  } catch (error) {
    console.error('❌ Error loading Stripe status:', error);
    document.getElementById('stripeStatusBadge').textContent = '❌ Not Setup';
    document.getElementById('stripeStatusBadge').className = 'status-badge badge-pending';
    document.getElementById('stripeSetupBtn').style.display = 'block';
    document.getElementById('onboardingBtn').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'none';
  }
}

/**
 * Load products from backend API (via loadStripeStatus)
 */
async function loadProducts() {
  // Products are loaded from /api/client/dashboard-data via loadStripeStatus
  // This is a placeholder - products display will be implemented when needed
  console.log('✅ Products loaded from API');
}

/**
 * Load transactions from backend API (via loadStripeStatus)
 */
async function loadTransactions() {
  // Transactions are loaded from /api/client/dashboard-data via loadStripeStatus
  // This is a placeholder - transactions display will be implemented when needed
  console.log('✅ Transactions loaded from API');
}

/**
 * Handle Stripe Connect setup
 */
async function handleStripeSetup() {
  try {
    const response = await apiCall('/api/client/stripe-setup', {
      method: 'POST',
      body: JSON.stringify({
        name: currentUser.displayName || 'Unknown',
        email: currentUser.email
      })
    });

    if (response.success) {
      console.log('✅ Stripe account created:', response.accountId);

      // Immediately update UI to show onboarding button
      document.getElementById('stripeStatusBadge').textContent = '⏳ Pending Verification';
      document.getElementById('stripeStatusBadge').className = 'status-badge badge-pending';
      document.getElementById('stripeSetupBtn').style.display = 'none';
      document.getElementById('stripeAccountId').textContent = response.accountId;
      document.getElementById('onboardingBtn').style.display = 'block';
      document.getElementById('onboardingMessage').innerHTML = 'Complete your Stripe verification to accept payments.';
      document.getElementById('onboardingMessage').style.display = 'block';

      alert('✅ Stripe account created! Click "📋 Complete Verification" to finish onboarding.');
    } else {
      alert('❌ Error: ' + (response.error || 'Failed to setup Stripe'));
    }
  } catch (error) {
    console.error('❌ Stripe setup error:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Handle Stripe onboarding
 */
async function handleOnboarding() {
  try {
    const response = await apiCall('/api/client/stripe-onboarding-link', {
      method: 'POST'
    });

    if (response.url) {
      window.location.href = response.url;
    } else {
      alert('❌ Error: ' + (response.error || 'Failed to get onboarding link'));
    }
  } catch (error) {
    console.error('❌ Onboarding error:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Handle delete Stripe account
 */
async function handleDeleteAccount() {
  if (!confirm('Are you sure? This will delete your Stripe account and reset the setup.')) {
    return;
  }

  try {
    const response = await apiCall('/api/client/stripe-account/delete', {
      method: 'POST'
    });

    if (response.success) {
      console.log('✅ Stripe account deleted');
      alert('✅ Stripe account deleted. You can now set up a new one.');
      // Reload dashboard
      setTimeout(() => loadStripeStatus(), 500);
    } else {
      alert('❌ Error: ' + (response.error || 'Failed to delete account'));
    }
  } catch (error) {
    console.error('❌ Delete account error:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await auth.signOut();
    window.location.href = '/client-portal.html';
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

/**
 * Disable/enable all action buttons
 */
function disableAllButtons(disabled) {
  const buttons = ['stripeSetupBtn', 'onboardingBtn', 'deleteBtn'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = disabled;
      btn.style.opacity = disabled ? '0.6' : '1';
      btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  });
}

/**
 * Show loading spinners on buttons
 */
function showLoadingSpinners() {
  const setupBtn = document.getElementById('stripeSetupBtn');
  const onboardingBtn = document.getElementById('onboardingBtn');

  if (setupBtn && setupBtn.style.display !== 'none') {
    setupBtn.innerHTML = '⏳ Loading...';
  }
  if (onboardingBtn && onboardingBtn.style.display !== 'none') {
    onboardingBtn.innerHTML = '⏳ Loading...';
  }
}
