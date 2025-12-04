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

    function handlePurchase() {
        // This is a simple redirect to the universal checkout page,
        // pre-filled with the correct product and store information.
        const checkoutUrl = `/checkout?store_id=${STORE_ID}&product_id=${SETUP_PRODUCT_ID}`;
        
        // When the user completes the checkout, the checkout page's own logic
        // will handle creating the subscription and redirecting to the studio.
        // For now, we will just redirect.
        showLoading(purchaseBtn, 'Redirecting to Checkout...');
        
        // Simulate a small delay for better UX
        setTimeout(() => {
            window.location.href = checkoutUrl;
        }, 1000);
    }

    // --- Start the process ---
    initializeCreatePage();
});