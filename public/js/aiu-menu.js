/**
 * A.I.U. Menu Controller (aiu-menu.js)
 * 
 * Responsibilities:
 * 1. Initialize Firebase Authentication.
 * 2. Listen for changes in the user's sign-in state.
 * 3. Dynamically show the "My Studio" button only for authenticated users.
 * 4. Provide a loading state for the "My Studio" button to handle asynchronous checks.
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Waits for the Firebase SDK to be fully initialized.
     * @param {function} callback The function to execute once Firebase is ready.
     * @param {number} attempts Internal counter to prevent infinite loops.
     */
    function waitForFirebase(callback, attempts = 0) {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            callback(firebase.auth());
        } else if (attempts < 50) { // Try for up to 5 seconds
            setTimeout(() => waitForFirebase(callback, attempts + 1), 100);
        } else {
            console.error("A.I.U. Menu: Firebase Auth failed to initialize in time.");
        }
    }

    /**
     * Main initialization function for the menu page.
     */
    function initializeMenu() {
        const myStudioButton = document.getElementById('my-studio-btn');
        const myStudioLoader = document.getElementById('my-studio-loader');
        const myStudioTitle = document.getElementById('my-studio-title');

        if (!myStudioButton) {
            console.error("A.I.U. Menu: Critical element #my-studio-btn not found.");
            return;
        }

        waitForFirebase((auth) => {
            // Display a loading spinner on the "My Studio" button initially
            // to indicate that we are checking the user's authentication status.
            myStudioButton.style.display = 'flex'; // Use flex to align spinner and text
            myStudioLoader.style.display = 'block';
            myStudioTitle.textContent = 'Checking Status...';

            auth.onAuthStateChanged(user => {
                // Hide the loader once the auth check is complete.
                myStudioLoader.style.display = 'none';
                myStudioTitle.textContent = 'My Studio';

                if (user) {
                    // If a user is signed in, the "My Studio" button is a valid option.
                    // Keep it visible.
                    console.log("A.I.U. Menu: User is signed in. Showing 'My Studio' button.");
                    myStudioButton.style.display = 'flex';
                } else {
                    // If no user is signed in, hide the button completely.
                    console.log("A.I.U. Menu: User is not signed in. Hiding 'My Studio' button.");
                    myStudioButton.style.display = 'none';
                }
            });
        });
    }

    // Run the initialization logic
    initializeMenu();
});