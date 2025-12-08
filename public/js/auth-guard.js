// js/auth-guard.js

/**
 * ========================================================================
 * AUTHENTICATION GUARD (The "Gatekeeper")
 * ========================================================================
 * This script runs on every page. It uses the authManager to check the
 * user's login state and performs redirects to protect pages.
 * 
 * KEY BEHAVIOR: Users on the portal page are NOT auto-redirected to
 * the dashboard, even if logged in. This allows them to enter a PIN
 * to claim additional stores.
 */
(async function () {
    const protectedRoutes = ['/client-dashboard.html', '/affiliate-portal.html'];
    const loginRoute = '/client-portal.html';

    const currentPath = window.location.pathname;

    try {
        // Wait for the authManager to know the user's status
        const user = await authManager.getAuthState();

        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

        if (user) {
            // --- USER IS LOGGED IN ---
            // If they are on the login page, we do NOT redirect them away.
            // This allows them to enter a PIN to claim a new store.
            if (currentPath.startsWith(loginRoute)) {
                console.log('Auth Guard: User logged in on portal. Allowing stay to claim/verify store.');
            }
        } else {
            // --- USER IS NOT LOGGED IN ---
            // If they are trying to access a protected page, send them to the login page.
            if (isProtectedRoute) {
                console.log('Auth Guard: User not logged in, redirecting to login page from protected route.');
                window.location.replace(loginRoute);
            }
        }

    } catch (error) {
        console.error("Auth Guard Error:", error);
        // Fails safe: if something goes wrong, it won't redirect.
    }
})();
