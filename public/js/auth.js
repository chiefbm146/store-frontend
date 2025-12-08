// js/auth.js

/**
 * ========================================================================
 * GLOBAL AUTHENTICATION MANAGER (The "Engine")
 * ========================================================================
 * This object is the single source of truth for Firebase authentication.
 * It handles sign-in, sign-out, and provides the current user state
 * to other parts of the application.
 */
const authManager = (() => {
    let currentUser = null;
    let authStatePromise = null;
    let resolveAuthStatePromise = null;

    // Create a promise that resolves once the initial auth state is known
    authStatePromise = new Promise(resolve => {
        resolveAuthStatePromise = resolve;
    });

    // Wait for the Firebase SDK to be ready before setting up the listener
    const onFirebaseReady = (callback) => {
        const interval = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                clearInterval(interval);
                callback();
            }
        }, 50);
    };

    onFirebaseReady(() => {
        firebase.auth().onAuthStateChanged(user => {
            console.log("Global Auth State Changed. User:", user ? user.email : "none");
            currentUser = user;
            // If the promise hasn't been resolved yet, resolve it now.
            if (resolveAuthStatePromise) {
                resolveAuthStatePromise(user);
                resolveAuthStatePromise = null; // Ensure it only resolves once
            }
        });
    });

    return {
        /**
         * Returns a promise that resolves with the current user object (or null)
         * once the initial authentication check is complete.
         */
        getAuthState: () => authStatePromise,

        /**
         * Triggers the Google Sign-In popup flow.
         * Returns a promise that resolves on success or rejects on error.
         */
        signIn: () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            return firebase.auth().signInWithPopup(provider);
        },

        /**
         * Signs the current user out.
         */
        signOut: () => {
            return firebase.auth().signOut();
        },

        /**
         * Gets the current user's ID token for making authenticated API calls.
         * Throws an error if the user is not signed in.
         * @returns {Promise<string>} The Firebase ID token.
         */
        getToken: async () => {
            // Wait for the initial auth state to be confirmed
            const user = await authStatePromise;
            if (!user) {
                throw new Error('User is not authenticated.');
            }
            // 'true' forces a token refresh if the current one is expired.
            return user.getIdToken(true);
        }
    };
})();
