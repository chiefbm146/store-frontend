/**
 * A.I.U. Create Info Controller (aiu-create.js)
 * 
 * Responsibilities:
 * 1. Handle the user authentication flow via Google Sign-In.
 * 2. Check if the user has already purchased the A.I.U. service.
 * 3. Initiate the Stripe payment process for the one-time setup fee.
 * 4. Redirect the user to the Creation Studio upon successful payment.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const BACKEND_URL = 'https://stores-backend-phhl2xgwwa-uc.a.run.app';
    const SETUP_PRODUCT_ID = 'aiu-setup'; // This MUST match the product ID in your seeder
    const STORE_ID = 'aarie-platform'; // A.I.U. is a direct platform product

    // --- DOM Elements ---
    const signInBtn = document.getElementById('sign-in-btn');
    const purchaseBtn = document.getElementById('purchase-btn');
    const authGate = document.getElementById('auth-gate');
    const paymentGate = document.getElementById('payment-gate');
    const welcomeMsg = document.getElementById('welcome-msg');

    let currentUser = null;
    let firebaseAuth;

    // --- Helper Functions ---
    function showLoading(button, text = 'Loading...') {
        button.disabled = true;
        button.innerHTML = `<span class="spinner"></span> ${text}`;
    }

    function hideLoading(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    function waitForFirebase(callback) {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            callback(firebase.auth());
        } else {
            setTimeout(() => waitForFirebase(callback), 100);
        }
    }

    // --- Core Logic ---
    function initializeCreatePage() {
        if (!signInBtn || !purchaseBtn) {
            console.error("A.I.U. Create: Critical UI elements are missing.");
            return;
        }

        waitForFirebase((auth) => {
            firebaseAuth = auth;
            auth.onAuthStateChanged(handleAuthStateChanged);
        });

        signInBtn.addEventListener('click', handleSignIn);
        purchaseBtn.addEventListener('click', handlePurchase);
    }

    async function handleAuthStateChanged(user) {
        currentUser = user;
        if (user) {
            // User is signed in, show the payment gate
            authGate.style.display = 'none';
            paymentGate.style.display = 'block';
            welcomeMsg.textContent = `Welcome, ${user.displayName}!`;

            // Check if user has already paid or has an active persona
            showLoading(purchaseBtn, 'Checking Status...');
            try {
                // TODO: Build this backend endpoint
                // const status = await apiCall('/api/aiu/user-status');
                // if (status.hasActivePersona) {
                //     purchaseBtn.textContent = 'Go to Your Studio →';
                //     purchaseBtn.onclick = () => { window.location.href = '/aiu-studio'; };
                //     hideLoading(purchaseBtn, 'Go to Your Studio →');
                // } else {
                hideLoading(purchaseBtn, 'Pay $15 Setup Fee & Begin');
                // }
            } catch (error) {
                console.warn("Could not check user status:", error.message);
                hideLoading(purchaseBtn, 'Pay $15 Setup Fee & Begin');
            }
        } else {
            // User is not signed in, show the auth gate
            authGate.style.display = 'block';
            paymentGate.style.display = 'none';
        }
    }

    async function handleSignIn() {
        showLoading(signInBtn, 'Redirecting...');
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebaseAuth.signInWithPopup(provider);
            // The onAuthStateChanged listener will handle the UI switch.
        } catch (error) {
            alert(`Sign-in failed: ${error.message}`);
            hideLoading(signInBtn, '🔐 Sign In with Google');
        }
    }

    async function handlePurchase() {
        if (!currentUser) {
            alert('You must be signed in to complete this purchase.');
            return;
        }

        showLoading(purchaseBtn, 'Initializing Checkout...');

        try {
            // Initialize Stripe (make sure Stripe.js is loaded in the HTML)
            const stripe = Stripe('pk_test_51Rp7gdRuBpQt4n9NHC1N9DjWmBDfj6Q7N4sR8mTgkIlDFvPOpgE8VLhztsX0WWtfa1nnn1upiboEo8OzsaVzSrAj00g3wM9yCA');

            // Get the user's authentication token
            const idToken = await currentUser.getIdToken();

            // Call our backend endpoint to create the Stripe Checkout Session
            const response = await fetch(`${BACKEND_URL}/api/v1/${STORE_ID}/create-aiu-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ user_uid: currentUser.uid })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Could not create payment session.');
            }

            const session = await response.json();

            // Redirect to Stripe's hosted checkout page
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.sessionId
            });

            if (error) {
                throw new Error(error.message);
            }

        } catch (error) {
            console.error('Purchase initialization failed:', error);
            alert(`Checkout failed: ${error.message}`);
            hideLoading(purchaseBtn, 'Pay $15 Setup Fee & Begin');
        }
    }

    // --- Start the process ---
    initializeCreatePage();
});