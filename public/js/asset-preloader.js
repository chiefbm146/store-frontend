// File: public/js/asset-preloader.js

/**
 * AssetPreloader - Non-blocking Image Preloader & Cacher
 *
 * This module waits for the main app to be interactive, then fetches
 * critical images in the background. The browser automatically caches them,
 * resulting in instant loads when the user navigates to a section
 * that uses these images.
 */
const assetPreloader = {
    /**
     * Initializes the preloading process after a specified delay.
     * @param {string[]} imageUrls - An array of image URLs to preload.
     * @param {number} [delay=1500] - The delay in milliseconds before starting.
     */
    init(imageUrls, delay = 1500) {
        console.log('✅ Asset Preloader: Initialized. Waiting for app to settle...');

        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            console.warn('[AssetPreloader] No image URLs provided to preload.');
            return;
        }

        // Wait for the specified delay before starting the process
        setTimeout(() => {
            console.log(`[AssetPreloader] Starting preload of ${imageUrls.length} images...`);
            let loadedCount = 0;
            let failedCount = 0;

            imageUrls.forEach((url, index) => {
                // Create a new Image object in memory. This is the key.
                // The browser will fetch the image and store it in its cache,
                // but it won't be displayed on the page.
                const img = new Image();

                // Set crossOrigin to allow proper caching behavior
                img.crossOrigin = 'anonymous';

                img.src = url;

                // Listen for the 'load' event to confirm it's cached
                img.onload = () => {
                    loadedCount++;
                    console.log(`[AssetPreloader] ✅ (${loadedCount}/${imageUrls.length}) Cached: ${url}`);
                    if (loadedCount + failedCount === imageUrls.length) {
                        console.log(`[AssetPreloader] ✨ Preloading complete! (${loadedCount} success, ${failedCount} failed) - Images will now load instantly from cache.`);
                    }
                };

                // Listen for errors (e.g., image not found)
                img.onerror = () => {
                    failedCount++;
                    console.warn(`[AssetPreloader] ❌ Failed to preload image: ${url}`);
                    if (loadedCount + failedCount === imageUrls.length) {
                        console.log(`[AssetPreloader] ✨ Preloading complete! (${loadedCount} success, ${failedCount} failed)`);
                    }
                };
            });
        }, delay);
    }
};

export default assetPreloader;
