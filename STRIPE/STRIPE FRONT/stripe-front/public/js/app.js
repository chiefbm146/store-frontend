// Main application module

// Check for payment success redirect
function checkPaymentSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    showPaymentSuccessMessage();
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Show payment success message
function showPaymentSuccessMessage() {
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  message.textContent = '✓ Payment successful! Check your earnings.';
  document.body.appendChild(message);

  // Auto remove after 5 seconds
  setTimeout(() => {
    message.remove();
  }, 5000);
}

// Page navigation
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.add('hidden'));

  const navbar = document.querySelector('.navbar');
  if (pageId === 'authPage') {
    navbar.style.display = 'none';
  } else {
    navbar.style.display = 'block';
  }

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.remove('hidden');
  }
}

// Update UI based on auth state
function updateUI(user) {
  if (user) {
    // User is logged in
    showPage('dashboardPage');
    loadDashboard(user.uid);
  } else {
    // User is logged out
    showPage('authPage');
    clearForms();
  }
}

// Clear forms (no longer needed with Google Sign-In)
function clearForms() {
  // Google Sign-In doesn't use forms, so nothing to clear
  // This function is kept for compatibility
}

// Load dashboard
async function loadDashboard(franchiseeId) {
  try {
    // Sync transactions from Stripe to Firestore (source of truth)
    try {
      const token = await currentUser.getIdToken();
      const syncResponse = await fetch(
        `https://stripe-connect-backend-338017041631.us-central1.run.app/api/sync-transactions?franchisee_id=${franchiseeId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log(`Synced ${syncData.synced} transactions from Stripe on dashboard load`);
      }
    } catch (error) {
      console.error('Error syncing transactions on dashboard load:', error);
    }

    // Get franchisee info
    const franchisee = await getFranchisee(franchiseeId);
    if (franchisee) {
      document.getElementById('franchiseeName').textContent = franchisee.name;

      // Load Stripe account status
      loadStripeStatus(franchiseeId);
    }

    // Set up navigation
    setupNavigation();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showError('Error loading dashboard');
  }
}

// Load Stripe account status
async function loadStripeStatus(franchiseeId) {
  try {
    const stripeAccount = await getStripeAccount(franchiseeId);
    const statusDiv = document.getElementById('stripeStatus');

    if (!stripeAccount) {
      statusDiv.innerHTML = `
        <p style="color: #e74c3c;">Stripe Connect account not set up</p>
        <p style="font-size: 0.9rem; color: #666;">You need to complete your Stripe Connect verification to start receiving payments.</p>
      `;
    } else {
      const status = stripeAccount.verificationStatus || 'unknown';
      const chargesEnabled = stripeAccount.chargesEnabled ? '✓' : '✗';
      const payoutsEnabled = stripeAccount.payoutsEnabled ? '✓' : '✗';

      statusDiv.innerHTML = `
        <p><strong>Account ID:</strong> ${stripeAccount.accountId}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Can Accept Charges:</strong> ${chargesEnabled}</p>
        <p><strong>Can Receive Payouts:</strong> ${payoutsEnabled}</p>
      `;
    }
  } catch (error) {
    console.error('Error loading Stripe status:', error);
  }
}

// Set up navigation
function setupNavigation() {
  const dashboardLink = document.getElementById('dashboardLink');
  const productsLink = document.getElementById('productsLink');
  const testStoreLink = document.getElementById('testStoreLink');
  const logoutLink = document.getElementById('logoutLink');

  dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('dashboardPage');
  });

  productsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('productsPage');
    loadProductsList();
  });

  testStoreLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('testStorePage');
    loadTestStore(currentUser.uid);
  });

  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut();
  });

  // Dashboard quick actions
  document.getElementById('viewProductsBtn').addEventListener('click', (e) => {
    e.preventDefault();
    showPage('productsPage');
    loadProductsList();
  });

  document.getElementById('setupStripeBtn').addEventListener('click', (e) => {
    e.preventDefault();
    handleStripeSetup();
  });
}

// Load products list
async function loadProductsList() {
  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '<p>Loading products...</p>';

  try {
    const products = await getProducts(currentUser.uid);

    if (products.length === 0) {
      productsList.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">No products yet. Create your first product!</p>';
    } else {
      productsList.innerHTML = '';
      products.forEach(product => {
        const card = createProductCard(product);
        productsList.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
    productsList.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #e74c3c;">Error loading products</p>';
  }
}

// Create product card element
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const price = (product.price / 100).toFixed(2);
  const description = product.description || 'No description';

  card.innerHTML = `
    <div class="product-header">
      <h4>${product.name}</h4>
      <div class="product-price">$${price}</div>
    </div>
    <div class="product-body">
      <p>${description}</p>
    </div>
    <div class="product-footer">
      <button class="btn btn-secondary" data-edit-id="${product.id}">Edit</button>
      <button class="btn btn-secondary" data-delete-id="${product.id}" style="background-color: #e74c3c;">Delete</button>
    </div>
  `;

  // Add event listeners
  card.querySelector(`[data-edit-id="${product.id}"]`).addEventListener('click', () => {
    editProduct(product);
  });

  card.querySelector(`[data-delete-id="${product.id}"]`).addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(currentUser.uid, product.id);
        loadProductsList();
        showError('Product deleted successfully');
      } catch (error) {
        showError('Error deleting product');
      }
    }
  });

  return card;
}

// Handle product modal
function initProductModal() {
  const modal = document.getElementById('productModal');
  const addProductBtn = document.getElementById('addProductBtn');
  const closeBtn = document.querySelector('.close');
  const productForm = document.getElementById('productForm');

  addProductBtn.addEventListener('click', () => {
    // Clear form for new product
    productForm.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    modal.classList.add('show');
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.classList.add('hidden');
    }
  });

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value) * 100;

    try {
      const productObj = {
        name,
        description,
        price: Math.round(price)
      };

      if (productId) {
        productObj.id = productId;
      }

      await saveProduct(currentUser.uid, productObj);

      modal.classList.remove('show');
      modal.classList.add('hidden');
      loadProductsList();
      showError('Product saved successfully');
    } catch (error) {
      showError('Error saving product');
      console.error(error);
    }
  });
}

// Edit product
function editProduct(product) {
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productPrice').value = (product.price / 100).toFixed(2);
  document.getElementById('modalTitle').textContent = 'Edit Product';

  const modal = document.getElementById('productModal');
  modal.classList.add('show');
  modal.classList.remove('hidden');
}

// Handle Stripe setup
async function handleStripeSetup() {
  try {
    const link = await createStripeOnboardingLink(currentUser.uid);
    if (link) {
      window.location.href = link;
    }
  } catch (error) {
    showError('Error creating Stripe onboarding link: ' + error.message);
    console.error(error);
  }
}

// Load Test Store products and transactions
async function loadTestStore(franchiseeId) {
  const testStoreProducts = document.getElementById('testStoreProducts');
  const testStoreTransactions = document.getElementById('testStoreTransactions');

  testStoreProducts.innerHTML = '<p>Loading products...</p>';
  testStoreTransactions.innerHTML = '<p>Syncing transactions from Stripe...</p>';

  // Sync transactions from Stripe to Firestore (source of truth)
  try {
    const token = await currentUser.getIdToken();
    const syncResponse = await fetch(
      `https://stripe-connect-backend-338017041631.us-central1.run.app/api/sync-transactions?franchisee_id=${franchiseeId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log(`Synced ${syncData.synced} transactions from Stripe`);
    }
  } catch (error) {
    console.error('Error syncing transactions:', error);
  }

  // Load products
  try {
    const products = await getProducts(franchiseeId);

    if (products.length === 0) {
      testStoreProducts.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">No products available. Create a product first!</p>';
    } else {
      testStoreProducts.innerHTML = '';
      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div style="padding: 20px;">
            <h4>${product.name}</h4>
            <p>${product.description || 'No description'}</p>
            <p style="font-size: 1.2rem; font-weight: bold; color: #27ae60; margin: 15px 0;">$${(product.price / 100).toFixed(2)} CAD</p>
            <button class="btn btn-primary buy-now-btn" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">Buy Now</button>
          </div>
        `;
        testStoreProducts.appendChild(card);
      });

      // Attach event listeners to all Buy Now buttons
      document.querySelectorAll('.buy-now-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const productId = this.getAttribute('data-product-id');
          const productName = this.getAttribute('data-product-name');
          const productPrice = parseInt(this.getAttribute('data-product-price'));
          createPaymentLink(currentUser.uid, productId, productName, productPrice);
        });
      });
    }
  } catch (error) {
    console.error('Error loading test store:', error);
    testStoreProducts.innerHTML = '<p style="color: #e74c3c;">Error loading products</p>';
  }

  // Load and listen to recent transactions from Firestore
  loadRecentTransactionsFromFirestore(franchiseeId);
}

// Load transactions from Firestore (real-time updates)
function loadRecentTransactionsFromFirestore(franchiseeId) {
  const testStoreTransactions = document.getElementById('testStoreTransactions');

  try {
    // Listen to transactions collection in real-time
    const unsubscribe = db
      .collection('franchisees')
      .doc(franchiseeId)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.empty) {
            testStoreTransactions.innerHTML = `
              <div style="text-align: center; padding: 20px; color: #666;">
                <p>No test transactions recorded yet. Make a purchase above to see it appear here!</p>
              </div>
            `;
            return;
          }

          let transactionsHtml = '<ul style="list-style: none; padding: 0; margin: 0;">';

          snapshot.forEach((doc) => {
            const txn = doc.data();

            // Handle amount field: check new 'amount_total' first, then fall back to old 'amount' field (backward compatible)
            const amountValue = txn.amount_total || txn.amount;
            const amount = amountValue ? (amountValue / 100).toFixed(2) : 'N/A';
            const stripeFee = txn.amount_stripe_fee ? (txn.amount_stripe_fee / 100).toFixed(2) : 'N/A';
            const platformFee = txn.amount_platform_fee ? (txn.amount_platform_fee / 100).toFixed(2) : 'N/A';
            const franchiseeNet = txn.amount_franchisee_net ? (txn.amount_franchisee_net / 100).toFixed(2) : 'N/A';

            console.log(`[PortalUI] Transaction ${txn.stripePaymentId}: amount_total=${txn.amount_total}, amount=${txn.amount}, using=${amountValue}, display=$${amount}`);

            // Handle Firestore Timestamp or ISO string
            let date;
            if (txn.createdAt && typeof txn.createdAt.toDate === 'function') {
              // Firestore Timestamp object
              date = txn.createdAt.toDate().toLocaleString();
            } else if (typeof txn.createdAt === 'string') {
              // ISO string
              date = new Date(txn.createdAt).toLocaleString();
            } else {
              date = 'Unknown date';
            }

            const statusClass = txn.status === 'succeeded' ? 'status-success' : 'status-failed';
            const description = txn.description || 'Product Purchase';

            // Extract workshop details
            const workshopName = txn.workshopDetails?.workshop_name || txn.workshopId || 'N/A';
            const workshopDate = txn.workshopDetails?.requested_date || 'N/A';
            const workshopTime = txn.workshopDetails?.requested_time || 'N/A';
            const participants = txn.workshopDetails?.participants || 'N/A';
            const orgType = txn.workshopDetails?.organization_type || 'N/A';

            // Customer info
            const customerName = txn.name || 'N/A';
            const customerEmail = txn.email || 'N/A';
            const customerPhone = txn.phone || 'N/A';

            transactionsHtml += `
              <li style="padding: 16px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">

                <!-- HEADER: Amount and Status -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0;">
                  <div>
                    <strong style="font-size: 1.3em; color: #27ae60;">+$${amount} ${txn.currency.toUpperCase()}</strong>
                    <span class="${statusClass}" style="display: inline-block; margin-left: 10px; padding: 4px 8px; font-size: 0.85rem; border-radius: 4px; text-transform: capitalize;
                      ${txn.status === 'succeeded' ? 'background-color: #d4edda; color: #155724;' : 'background-color: #f8d7da; color: #721c24;'}">
                      ${txn.status}
                    </span>
                  </div>
                  <small style="color: #666; text-align: right;">
                    <div>${date}</div>
                    <div style="color: #999;">ID: ${txn.stripePaymentId}</div>
                  </small>
                </div>

                <!-- WORKSHOP DETAILS SECTION -->
                <div style="margin-bottom: 12px; padding: 10px; background-color: #fff; border-left: 4px solid #3498db; border-radius: 4px;">
                  <strong style="color: #2c3e50; display: block; margin-bottom: 6px;">📚 Workshop Details</strong>
                  <table style="width: 100%; font-size: 0.9rem; line-height: 1.6;">
                    <tr>
                      <td style="color: #666; width: 30%;"><strong>Workshop:</strong></td>
                      <td style="color: #2c3e50;">${workshopName}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Date:</strong></td>
                      <td style="color: #2c3e50;">${workshopDate}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Time:</strong></td>
                      <td style="color: #2c3e50;">${workshopTime}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Participants:</strong></td>
                      <td style="color: #2c3e50;">${participants}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Organization:</strong></td>
                      <td style="color: #2c3e50;">${orgType}</td>
                    </tr>
                  </table>
                </div>

                <!-- CUSTOMER DETAILS SECTION -->
                <div style="margin-bottom: 12px; padding: 10px; background-color: #fff; border-left: 4px solid #e74c3c; border-radius: 4px;">
                  <strong style="color: #2c3e50; display: block; margin-bottom: 6px;">👤 Customer Information</strong>
                  <table style="width: 100%; font-size: 0.9rem; line-height: 1.6;">
                    <tr>
                      <td style="color: #666; width: 30%;"><strong>Name:</strong></td>
                      <td style="color: #2c3e50;">${customerName}</td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Email:</strong></td>
                      <td style="color: #2c3e50;"><a href="mailto:${customerEmail}" style="color: #3498db; text-decoration: none;">${customerEmail}</a></td>
                    </tr>
                    <tr>
                      <td style="color: #666;"><strong>Phone:</strong></td>
                      <td style="color: #2c3e50;"><a href="tel:${customerPhone}" style="color: #3498db; text-decoration: none;">${customerPhone}</a></td>
                    </tr>
                  </table>
                </div>

                <!-- FINANCIAL BREAKDOWN SECTION -->
                <div style="padding: 10px; background-color: #fff; border-left: 4px solid #f39c12; border-radius: 4px;">
                  <strong style="color: #2c3e50; display: block; margin-bottom: 6px;">💰 Financial Breakdown</strong>
                  <table style="width: 100%; font-size: 0.9rem; line-height: 1.8;">
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                      <td style="color: #666;"><strong>Total Amount:</strong></td>
                      <td style="color: #27ae60; text-align: right; font-weight: bold;">$${amount} ${txn.currency.toUpperCase()}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                      <td style="color: #666;"><strong>Stripe Processing Fee:</strong></td>
                      <td style="color: #e74c3c; text-align: right;">-$${stripeFee}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ecf0f1;">
                      <td style="color: #666;"><strong>Platform Fee (2.9%):</strong></td>
                      <td style="color: #e74c3c; text-align: right;">-$${platformFee}</td>
                    </tr>
                    <tr style="background-color: #ecf0f1; font-weight: bold;">
                      <td style="color: #2c3e50;"><strong>Franchisee Net Receive:</strong></td>
                      <td style="color: #27ae60; text-align: right;">$${franchiseeNet}</td>
                    </tr>
                  </table>
                </div>

              </li>
            `;
          });

          transactionsHtml += '</ul>';
          testStoreTransactions.innerHTML = transactionsHtml;
        },
        (error) => {
          console.error('Error loading transactions:', error);
          testStoreTransactions.innerHTML = '<p style="color: #e74c3c;">Error loading transaction history</p>';
        }
      );

    // Store unsubscribe function to clean up when navigating away
    window.transactionUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('Error setting up Firestore listener:', error);
    testStoreTransactions.innerHTML = '<p style="color: #e74c3c;">Error loading transactions</p>';
  }
}

// Create Payment Link and redirect
async function createPaymentLink(franchiseeId, productId, productName, amount) {
  console.log('createPaymentLink called with:', { franchiseeId, productId, productName, amount });

  try {
    console.log('Getting ID token...');
    const token = await currentUser.getIdToken();
    console.log('Token obtained, calling backend...');

    const requestBody = {
      franchiseeId,
      productId,
      productName,
      amount
    };
    console.log('Request body:', requestBody);

    const response = await fetch('https://stripe-connect-backend-338017041631.us-central1.run.app/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Backend response:', responseData);

    const { paymentLink } = responseData;
    console.log('Payment link:', paymentLink);

    window.location.href = paymentLink;
  } catch (error) {
    console.error('Error creating payment link:', error);
    alert('Error creating payment link: ' + error.message);
  }
}

// Start checkout
async function startCheckout(productId, productName, amount) {
  const modal = document.getElementById('checkoutModal');

  document.getElementById('checkoutProductName').textContent = productName;
  document.getElementById('checkoutAmount').textContent = (amount / 100).toFixed(2);

  modal.classList.add('show');

  // Store for payment
  window.checkoutData = {
    productId,
    productName,
    amount
  };
}

// Handle payment
async function handlePayment() {
  const payBtn = document.getElementById('payBtn');
  const paymentStatus = document.getElementById('paymentStatus');

  payBtn.disabled = true;
  paymentStatus.innerHTML = '<p style="color: #3498db;">Processing payment...</p>';

  try {
    // Create payment intent via backend API
    const token = await currentUser.getIdToken();
    const response = await fetch('https://stripe-connect-backend-338017041631.us-central1.run.app/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        franchiseeId: currentUser.uid,
        productId: window.checkoutData.productId,
        amount: window.checkoutData.amount
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { clientSecret } = await response.json();

    // Confirm payment with Stripe
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: window.cardElement,
        billing_details: { name: 'Test Franchisee' }
      }
    });

    if (error) {
      paymentStatus.innerHTML = `<p style="color: #e74c3c;">Payment failed: ${error.message}</p>`;
    } else if (paymentIntent.status === 'succeeded') {
      paymentStatus.innerHTML = `<p style="color: #27ae60;"><strong>Payment successful!</strong><br>Charge ID: ${paymentIntent.id}</p>`;
      setTimeout(() => {
        document.getElementById('checkoutModal').classList.remove('show');
        loadTestStore(currentUser.uid);
      }, 2000);
    }
  } catch (error) {
    console.error('Payment error:', error);
    paymentStatus.innerHTML = `<p style="color: #e74c3c;">Error: ${error.message}</p>`;
  }

  payBtn.disabled = false;
}

// Initialize Test Store modal
function initCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  const closeBtn = modal.querySelector('.close');
  const payBtn = document.getElementById('payBtn');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  payBtn.addEventListener('click', handlePayment);

  // Initialize Stripe card element (stripe is global from firebase-config.js)
  if (typeof stripe !== 'undefined' && stripe) {
    const elements = stripe.elements();
    window.cardElement = elements.create('card');
    window.cardElement.mount('#card-element');
  } else {
    console.error('Stripe not initialized');
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Check for payment success redirect
  checkPaymentSuccess();

  // Wait for Firebase to initialize
  setTimeout(() => {
    if (auth) {
      auth.onAuthStateChanged(user => {
        updateUI(user);
        if (user) {
          initProductModal();
          initCheckoutModal();
        }
      });
    }
  }, 500);
});
