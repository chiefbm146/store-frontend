/**
 * Clean URL - Replaces device-specific URL with clean version
 * Runs after page load to fix address bar
 * Allows users to share clean, working URLs
 */
(function() {
  const currentPath = window.location.pathname;

  // Map of device-specific URLs to clean URLs
  const cleanUrls = {
    '/index.html': '/',
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
    '/contact-desk.html': '/contact',
    '/contact-mobile.html': '/contact',
    '/delete-data-desk.html': '/delete-data',
    '/delete-data-mobile.html': '/delete-data',
    '/workshop-list-desk.html': '/workshop-list',
    '/workshop-list-mobile.html': '/workshop-list',
    '/workshops-desk.html': '/workshops',
    '/workshops-mobile.html': '/workshops'
  };

  const cleanUrl = cleanUrls[currentPath];

  if (cleanUrl && window.history && window.history.replaceState) {
    // Replace URL in address bar without reloading page, preserving query parameters
    const queryString = window.location.search;
    const newUrl = cleanUrl + queryString;
    window.history.replaceState(null, '', newUrl);
    console.log(`[Clean URL] Changed ${currentPath}${queryString} → ${newUrl}`);
  }
})();
