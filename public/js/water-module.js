/**
 * water-module.js
 * ES6 Module wrapper for water.js
 * Re-exports the global WaterBackground object for use in modules
 * This allows index.html to use `import WaterBackground from './water-module.js'`
 * while other pages (demo-desk.html, store-booking.html) continue using script tags
 */

export default window.WaterBackground;
