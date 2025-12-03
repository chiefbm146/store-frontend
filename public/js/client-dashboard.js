/**
 * Client Dashboard - Products & Transactions
 * Displays client products and transaction history
 */

let db;
let auth;
let currentUser;

// Backend API configuration
const API_BASE_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';

/**
 * Intelligently formats the price for a product, handling both simple
 * and complex (e.g., rental) pricing models.
 * @param {object} product The product object from Firestore.
 * @returns {string} A formatted price string (e.g., "$50.00", "From $50.00").
 */
function formatProductPrice(product) {
  if (product.price) {
    // Simple, fixed-price product
    return `$${(product.price / 100).toFixed(2)}`;
  } else if (product.prices) {
    // Complex product with multiple rates (like rentals)
    // Find the first available rate to display as a starting price.
    const firstRateKey = Object.keys(product.prices)[0];
    if (firstRateKey && product.prices[firstRateKey] && product.prices[firstRateKey].rate) {
      const rate = product.prices[firstRateKey].rate;
      return `From $${(rate / 100).toFixed(2)}`;
    }
  }
  // Fallback if no price is found
  return 'N/A';
}

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
    throw error;
  }
}

/**
 * Initialize Firebase when SDK loads
 */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof firebase !== 'undefined') {
    auth = firebase.auth();
    // NO NEED for Firestore - all data comes from backend API

    // Set up auth state listener
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        loadDashboard();
      } else {
        window.location.href = '/client-portal.html';
      }
    });
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

    // Sync transactions from Stripe (background, non-blocking)
    try {
      const syncResponse = await apiCall('/api/client/sync-transactions', {
        method: 'POST'
      });
    } catch (error) {
      // Silent error handling
    }

    // Enable buttons after loading
    disableAllButtons(false);

    // Fetch all dashboard data from the unified endpoint
    try {
      const dashboardData = await apiCall('/api/client/dashboard-data', {
        method: 'GET'
      });

      // Load products
      if (dashboardData.products && dashboardData.products.length > 0) {
        await loadProducts();
      } else {
        document.getElementById('productsContainer').innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">📭</div><p>No products yet - Setup Stripe first</p></div>';
      }

      // Load transactions
      if (dashboardData.transactions && dashboardData.transactions.length > 0) {
        await loadTransactions();
        await updateDashboardStats();
      } else {
        document.getElementById('transactionsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">💤</div><p>No transactions yet</p></div>';
      }

      // Load consultations - THIS IS THE KEY ADDITION
      loadConsultations(dashboardData.consultations || []);

    } catch (error) {
      // If dashboard data fetch fails, try loading components individually
      try {
        await loadProducts();
      } catch (error) {
        document.getElementById('productsContainer').innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state-icon">📭</div><p>No products yet - Setup Stripe first</p></div>';
      }

      try {
        await loadTransactions();
        await updateDashboardStats();
      } catch (error) {
        document.getElementById('transactionsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">💤</div><p>No transactions yet</p></div>';
      }

      // Show empty consultations on error
      loadConsultations([]);
    }
  } catch (error) {
    // Silent error handling
  }
}

/**
 * Renders the consultation requests into the dashboard UI.
 * @param {Array<object>} consultations An array of consultation objects from the API.
 */
function loadConsultations(consultations) {
  const container = document.getElementById('consultationsContainer');
  const badge = document.getElementById('consultationCountBadge');
  container.innerHTML = ''; // Clear previous entries

  if (!consultations || consultations.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 20px 0;">No new consultation requests.</p>';
    badge.style.display = 'none';
    return;
  }

  // Show and update the notification badge
  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  if (pendingCount > 0) {
    badge.textContent = pendingCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }

  // Sort to show pending requests first
  consultations.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    // If statuses are the same, sort by date (newest first)
    const aTime = a.createdAt?.seconds || a.createdAt?._seconds || 0;
    const bTime = b.createdAt?.seconds || b.createdAt?._seconds || 0;
    return bTime - aTime;
  });

  consultations.forEach(consultation => {
    // NEW - Robust date handling
    let date = 'No date';
    if (consultation.createdAt) {
      if (consultation.createdAt.seconds) {
        // Standard Firestore Timestamp
        date = new Date(consultation.createdAt.seconds * 1000).toLocaleString();
      } else if (typeof consultation.createdAt === 'string') {
        // ISO String format
        date = new Date(consultation.createdAt).toLocaleString();
      } else if (consultation.createdAt._seconds) {
        // Another common Firestore Timestamp format
        date = new Date(consultation.createdAt._seconds * 1000).toLocaleString();
      }
    }

    const isRead = consultation.status !== 'pending';

    const consultationHTML = `
            <div class="consultation-item ${isRead ? 'status-read' : ''}">
                <div class="consultation-header">
                    <span class="consultation-from">${consultation.name}</span>
                    <span class="consultation-date">${date}</span>
                </div>
                <p class="consultation-body">${consultation.message || 'No message provided.'}</p>
                <div class="consultation-contact">
                    <span>📧 <a href="mailto:${consultation.email}" target="_blank">${consultation.email}</a></span>
                    ${consultation.phone ? `<span>📞 <a href="tel:${consultation.phone}">${consultation.phone}</a></span>` : ''}
                </div>
                ${consultation.address ? `
                    <div class="consultation-address">
                        <span>📍</span> 
                        <a href="https://www.google.com/maps?q=${encodeURIComponent(consultation.address)}" target="_blank" title="View on Google Maps">
                            ${consultation.address}
                        </a>
                    </div>
                ` : ''}
                <!-- Action buttons can be added here if needed in the future -->
                <!--
                <div class="consultation-actions">
                    <button class="action-button">Mark as Read</button>
                </div>
                -->
            </div>
        `;
    container.innerHTML += consultationHTML;
  });
}

/**
 * Update dashboard stats after loading data
 */
async function updateDashboardStats() {
  try {
    const response = await apiCall('/api/client/dashboard-data', {
      method: 'GET'
    });

    const transactions = response.transactions || [];
    const products = response.products || [];

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    const totalRevenueFormatted = (totalRevenue / 100).toFixed(2);

    // Update stats
    document.getElementById('totalRevenue').textContent = `$${totalRevenueFormatted}`;
    document.getElementById('totalTransactions').textContent = transactions.length.toString();
    document.getElementById('activeProducts').textContent = products.length.toString();
  } catch (error) {
    // Silent error handling
  }
}

/**
 * Load Stripe account status
 */
async function loadStripeStatus() {
  try {
    const url = `${API_BASE_URL}/api/client/dashboard-data`;
    const response = await apiCall('/api/client/dashboard-data', {
      method: 'GET'
    });

    if (!response.stripe_account) {
      // No Stripe account - show setup button
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

    document.getElementById('stripeAccountId').textContent = accountId;

    if (accountData.chargesEnabled && accountData.payoutsEnabled) {
      document.getElementById('stripeStatusBadge').textContent = '✅ Active';
      document.getElementById('stripeStatusBadge').className = 'status-badge badge-active';
      document.getElementById('stripeSetupBtn').style.display = 'none';
      document.getElementById('onboardingBtn').style.display = 'none';
      document.getElementById('deleteBtn').style.display = 'block';
      document.getElementById('deleteBtn').innerHTML = '🗑️ Delete Account (Reset)';
      document.getElementById('onboardingMessage').innerHTML = '✅ Your Stripe account is fully verified and ready to receive payments! <br><br><button onclick="openStripeDashboard()" style="background: #635bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Open Stripe Dashboard →</button>';
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
    document.getElementById('stripeStatusBadge').textContent = '❌ Not Setup';
    document.getElementById('stripeStatusBadge').className = 'status-badge badge-pending';
    document.getElementById('stripeSetupBtn').style.display = 'block';
    document.getElementById('onboardingBtn').style.display = 'none';
    document.getElementById('deleteBtn').style.display = 'none';
  }
}

/**
 * Load products from backend API - Display only
 */
async function loadProducts() {
  try {
    const token = await currentUser.getIdToken();
    const response = await fetch('https://stores-backend-phhl2xgwwa-uc.a.run.app/api/client/dashboard-data', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`Failed to load products: ${response.status}`);

    const data = await response.json();
    const products = data.products || [];

    if (!products || products.length === 0) {
      document.getElementById('productsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No products yet</p></div>';
      return;
    }

    // Display products
    let html = '';
    products.forEach(product => {
      const displayPrice = formatProductPrice(product);
      html += `
        <div class="product-item" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="margin-bottom: 8px; font-size: 18px; font-weight: 600;">💼 ${product.name}</h3>
          <p style="color: #666; margin-bottom: 12px; font-size: 14px;">${product.description}</p>
          <div style="font-size: 24px; font-weight: 700; color: #27ae60;">${displayPrice}</div>
        </div>
      `;
    });

    document.getElementById('productsContainer').innerHTML = html;
  } catch (error) {
    document.getElementById('productsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No products available</p></div>';
  }
}

/**
 * Load transactions from backend API - Sync from Stripe on-demand
 */
async function loadTransactions() {
  try {
    // Call the sync endpoint to fetch latest transactions from Stripe
    const response = await apiCall('/api/client/sync-transactions', {
      method: 'POST'
    });

    // Now fetch the updated transactions from dashboard-data
    const dashboardResponse = await apiCall('/api/client/dashboard-data', {
      method: 'GET'
    });

    const transactions = dashboardResponse.transactions || [];

    if (!transactions || transactions.length === 0) {
      document.getElementById('transactionsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">💤</div><p>No transactions yet</p></div>';
      return;
    }

    // Display transactions
    let html = '<div class="transactions-list">';

    transactions.forEach(txn => {
      const amountInDollars = (txn.amount / 100).toFixed(2);
      const dateObj = txn.createdAt instanceof Date ? txn.createdAt : new Date(txn.createdAt?.seconds * 1000 || Date.now());
      const dateStr = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate breakdown amounts if available
      const customerCharged = txn.amount_total ? (txn.amount_total / 100).toFixed(2) : amountInDollars;
      const platformFee = txn.amount_platform_fee ? (txn.amount_platform_fee / 100).toFixed(2) : '0.00';
      const hasBreakdown = txn.amount_total && txn.amount_platform_fee;

      // Build detailed transaction info
      html += `
        <div class="transaction-item">
          <div class="transaction-header">
            <div class="transaction-date">${dateStr}</div>
            <div class="transaction-amount">+$${amountInDollars}</div>
          </div>
          <div class="transaction-details">
            <!-- Customer Info Section -->
            <div class="transaction-detail">
              <span class="detail-label">Customer</span>
              <span class="detail-value">${txn.name || 'Guest'}</span>
            </div>
            <div class="transaction-detail">
              <span class="detail-label">Email</span>
              <span class="detail-value">${txn.email || txn.receipt_email || 'N/A'}</span>
            </div>
            <div class="transaction-detail">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${txn.phone || 'N/A'}</span>
            </div>
            <div class="transaction-detail">
              <span class="detail-label">Status</span>
              <span class="detail-value" style="color: ${txn.status === 'succeeded' ? '#27ae60' : '#ff6b6b'};">${txn.status || 'unknown'}</span>
            </div>

            <!-- Payment Breakdown Section -->
            ${hasBreakdown ? `
            <div style="grid-column: 1 / -1; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
              <span class="detail-label" style="display: block; margin-bottom: 8px; font-weight: 600;">Payment Info</span>
              <div class="transaction-detail" style="margin-bottom: 6px;">
                <span class="detail-label">Customer Paid</span>
                <span class="detail-value" style="color: #1a1a1a; font-weight: 600;">$${customerCharged}</span>
              </div>
              <div class="transaction-detail" style="margin-bottom: 6px; color: #667eea;">
                <span class="detail-label">Platform Fee (AARIE)</span>
                <span class="detail-value">-$${platformFee}</span>
              </div>
              <div class="transaction-detail" style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <span class="detail-label" style="font-size: 11px; color: #666;">Stripe processing fees also apply. View exact amounts in your Stripe Dashboard.</span>
              </div>
            </div>
            ` : ''}

            <!-- Additional Details Section -->
            <div style="grid-column: 1 / -1; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
              <span class="detail-label" style="display: block; margin-bottom: 8px; font-weight: 600;">Details</span>
              <div class="transaction-detail">
                <span class="detail-label">Description</span>
                <span class="detail-value">${txn.description || 'Payment'}</span>
              </div>
              <div class="transaction-detail">
                <span class="detail-label">Currency</span>
                <span class="detail-value">${(txn.currency || 'cad').toUpperCase()}</span>
              </div>
              <div class="transaction-detail">
                <span class="detail-label">Payment ID</span>
                <span class="detail-value" style="font-size: 11px; font-family: monospace;">${txn.stripePaymentId || txn.chargeId || 'N/A'}</span>
              </div>
              <div class="transaction-detail">
                <span class="detail-label">Charge ID</span>
                <span class="detail-value" style="font-size: 11px; font-family: monospace;">${txn.chargeId || 'N/A'}</span>
              </div>
              ${txn.transferId ? `
              <div class="transaction-detail">
                <span class="detail-label">Transfer ID</span>
                <span class="detail-value" style="font-size: 11px; font-family: monospace;">${txn.transferId}</span>
              </div>
              ` : ''}
              ${txn.receipt_url ? `
              <div class="transaction-detail">
                <span class="detail-label">Receipt</span>
                <span class="detail-value"><a href="${txn.receipt_url}" target="_blank" style="color: #667eea; text-decoration: none;">View Stripe Receipt ↗</a></span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    document.getElementById('transactionsContainer').innerHTML = html;
  } catch (error) {
    document.getElementById('transactionsContainer').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Could not load transactions - try refreshing the page</p></div>';
  }
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
      alert('✅ Stripe account deleted. You can now set up a new one.');
      // Reload dashboard
      setTimeout(() => loadStripeStatus(), 500);
    } else {
      alert('❌ Error: ' + (response.error || 'Failed to delete account'));
    }
  } catch (error) {
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
    // Silent error handling
  }
}

/**
 * Open Stripe Express Dashboard
 */
async function openStripeDashboard() {
  try {
    const response = await apiCall('/api/client/stripe-dashboard-link');
    if (response.url) {
      window.open(response.url, '_blank');
    } else {
      alert('Unable to open Stripe Dashboard. Please try again.');
    }
  } catch (error) {
    alert('Error opening Stripe Dashboard: ' + error.message);
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

/**
 * Admin: Manually sync transactions from Stripe to Firestore
 */
async function handleAdminSync() {
  try {
    const userUid = document.getElementById('adminUserUid').value.trim();
    const stripeAccount = document.getElementById('adminStripeAccount').value.trim();
    const fingerprint = document.getElementById('adminSecret').value.trim();

    // Validate inputs
    if (!userUid) {
      alert('❌ User UID is required');
      return;
    }
    if (!stripeAccount) {
      alert('❌ Stripe Account ID is required');
      return;
    }
    if (!fingerprint) {
      alert('❌ FINGERPRINT_SECRET is required');
      return;
    }

    // Update button state
    const btn = document.getElementById('adminSyncBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Syncing...';
    btn.disabled = true;

    // Make API call with FINGERPRINT_SECRET in header
    const url = `${API_BASE_URL}/api/client/admin/sync-transactions/${userUid}/${stripeAccount}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Fingerprint-Secret': fingerprint,
        'Content-Type': 'application/json'
      }
    });

    // Handle non-JSON responses
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: `Server error: ${response.status} ${response.statusText}` };
    }

    // Show result
    const statusDiv = document.getElementById('adminSyncStatus');
    const messageDiv = document.getElementById('adminSyncMessage');

    if (response.ok) {
      messageDiv.innerHTML = `✅ <strong>Success!</strong><br>Synced ${data.synced} transactions from ${stripeAccount} to user ${userUid}`;
      statusDiv.style.borderLeftColor = '#4caf50';
      statusDiv.style.display = 'block';
    } else {
      messageDiv.innerHTML = `❌ <strong>Error:</strong><br>${data.error || 'Unknown error occurred'}`;
      statusDiv.style.borderLeftColor = '#ff6b6b';
      statusDiv.style.display = 'block';
    }

    // Reset button
    btn.innerHTML = originalText;
    btn.disabled = false;
  } catch (error) {
    const statusDiv = document.getElementById('adminSyncStatus');
    const messageDiv = document.getElementById('adminSyncMessage');

    let errorMsg = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMsg = 'Failed to reach backend. Check CORS or network connectivity. See console for details.';
    }

    messageDiv.innerHTML = `❌ <strong>Error:</strong><br>${errorMsg}`;
    statusDiv.style.borderLeftColor = '#ff6b6b';
    statusDiv.style.display = 'block';

    const btn = document.getElementById('adminSyncBtn');
    btn.innerHTML = '🚀 Sync Transactions';
    btn.disabled = false;
  }
}

