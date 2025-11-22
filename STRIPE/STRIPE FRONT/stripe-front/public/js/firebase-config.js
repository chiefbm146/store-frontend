// Firebase configuration module
// This file initializes Firebase and provides helper functions

let db;
let auth;
let currentUser;
let stripe;

// Backend API configuration
const API_BASE_URL = 'https://stripe-connect-backend-338017041631.us-central1.run.app';

// Stripe publishable key (test mode)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SPQ3W2ONyiEh5kxUpJxBGUhHXaUPpAKJeC9nSJLul8ctzUqPZgMYkeJ8glWndaIgDhMVaVlc142aZCRdXH1NwlK00mzd5iMG8';

// Helper to make API calls with Firebase token
async function apiCall(endpoint, options = {}) {
  try {
    if (currentUser) {
      const token = await currentUser.getIdToken();
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Initialize Firebase when the app loads
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    // Firebase is loaded via the init script
    db = firebase.firestore();
    auth = firebase.auth();

    // Initialize Stripe
    if (typeof Stripe !== 'undefined') {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    } else {
      console.error('Stripe SDK not loaded');
    }

    // Set up auth state listener
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (user) {
        console.log('User logged in:', user.email);
      } else {
        console.log('User logged out');
      }
    });
  } else {
    console.error('Firebase SDK not loaded');
  }
});

// Helper function to create a franchisee document
async function createFranchisee(email, name) {
  try {
    const franchiseeRef = db.collection('franchisees').doc(currentUser.uid);
    await franchiseeRef.set({
      id: currentUser.uid,
      email: email,
      name: name,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return currentUser.uid;
  } catch (error) {
    console.error('Error creating franchisee:', error);
    throw error;
  }
}

// Get franchisee data
async function getFranchisee(uid) {
  try {
    const doc = await db.collection('franchisees').doc(uid).get();
    if (doc.exists) {
      return doc.data();
    } else {
      console.log('No franchisee found for UID:', uid);
      return null;
    }
  } catch (error) {
    console.error('Error fetching franchisee:', error);
    throw error;
  }
}

// Get products for a franchisee
async function getProducts(franchiseeId) {
  try {
    const snapshot = await db
      .collection('franchisees')
      .doc(franchiseeId)
      .collection('products')
      .where('status', '==', 'active')
      .get();

    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Create/update a product
async function saveProduct(franchiseeId, productData) {
  try {
    if (productData.id) {
      // Update existing
      await db
        .collection('franchisees')
        .doc(franchiseeId)
        .collection('products')
        .doc(productData.id)
        .update({
          ...productData,
          updatedAt: new Date()
        });
      return productData.id;
    } else {
      // Create new
      const docRef = await db
        .collection('franchisees')
        .doc(franchiseeId)
        .collection('products')
        .add({
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
}

// Delete a product
async function deleteProduct(franchiseeId, productId) {
  try {
    await db
      .collection('franchisees')
      .doc(franchiseeId)
      .collection('products')
      .doc(productId)
      .update({
        status: 'archived',
        updatedAt: new Date()
      });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Get Stripe account info
async function getStripeAccount(franchiseeId) {
  try {
    const doc = await db
      .collection('franchisees')
      .doc(franchiseeId)
      .collection('stripe_account')
      .doc('account')
      .get();

    if (doc.exists) {
      return doc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching Stripe account:', error);
    throw error;
  }
}

// Create Stripe onboarding link request
async function createStripeOnboardingLink(franchiseeId) {
  try {
    // Call backend API to create onboarding link
    const response = await apiCall(`/api/franchisees/${franchiseeId}/onboarding-link`, {
      method: 'POST'
    });
    return response.url;
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    throw error;
  }
}

// Get transactions from backend API
async function getTransactions(franchiseeId, limit = 10) {
  try {
    const transactions = await apiCall(`/api/franchisees/${franchiseeId}/transactions?limit=${limit}`);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Listen to product changes in real-time
function listenToProducts(franchiseeId, callback) {
  return db
    .collection('franchisees')
    .doc(franchiseeId)
    .collection('products')
    .where('status', '==', 'active')
    .onSnapshot(snapshot => {
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    });
}
