/**
 * Clean URL System - AARIE.CA
 * Maps device-specific URLs to clean, user-friendly URLs
 * Runs on page load to update address bar
 * On mobile, redirects certain pages to appropriate view with modules
 */
(function() {
  const currentPath = window.location.pathname;
  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);

  // Map of device-specific URLs to clean URLs
  const cleanUrls = {
    // AARIE.CA Main Pages
    '/index.html': '/',
    '/demo-desk.html': '/web-sites-4-u',
    '/store-booking.html': '/booking',
    '/about-desk.html': '/about',
    '/contact-desk.html': '/contact',
    '/ai-chat-desk.html': '/ai-chat',

    // Legacy/Old URLs (keep for backwards compatibility)
    '/desktop.html': '/chat',
    '/mobile.html': '/chat',
    '/infinite-story-desk.html': '/infinite-story',
    '/infinite-story-mobile.html': '/infinite-story',
    '/podcasts-desk.html': '/podcasts',
    '/podcasts-mobile.html': '/podcasts',
    '/world-desk.html': '/world',
    '/world-mobile.html': '/world',
    '/downloads-desk.html': '/downloads',
    '/downloads-mobile.html': '/downloads',
    '/custom-creations-desk.html': '/custom-creations',
    '/custom-creations-mobile.html': '/custom-creations',
    '/workshop-detail-desk.html': '/workshop-detail',
    '/workshop-detail-mobile.html': '/workshop-detail',
    '/reconciliation-desk.html': '/reconciliation',
    '/reconciliation-mobile.html': '/reconciliation',
    '/developer-desk.html': '/developer',
    '/developer-mobile.html': '/developer',
    '/account-desk.html': '/Account',
    '/account-mobile.html': '/Account',
    '/menu-desk.html': '/menu',
    '/menu-mobile.html': '/menu',
    '/shona-desk.html': '/shona',
    '/shona-mobile.html': '/shona',
    '/moon-tide-desk.html': '/moon-tide',
    '/moon-tide-mobile.html': '/moon-tide',
    '/delete-data-desk.html': '/delete-data',
    '/delete-data-mobile.html': '/delete-data',
    '/workshop-list-desk.html': '/workshop-list',
    '/workshop-list-mobile.html': '/workshop-list',
    '/workshops-desk.html': '/workshops',
    '/workshops-mobile.html': '/workshops'
  };

  const cleanUrl = cleanUrls[currentPath];
  const queryString = window.location.search;

  // Special handling for mobile AI chat redirect
  if (currentPath === '/ai-chat-desk.html' && isMobile) {
    console.log('[Clean URL] Mobile detected on AI chat page - redirecting to web-sites-4-u with chat open');
    window.location.href = '/web-sites-4-u?chat=open';
    return;
  }

  // Apply clean URL to address bar
  if (cleanUrl && window.history && window.history.replaceState) {
    const newUrl = cleanUrl + queryString;
    window.history.replaceState(null, '', newUrl);
    console.log(`[Clean URL] Changed ${currentPath}${queryString} → ${newUrl}`);
  }
})();
