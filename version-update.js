#!/usr/bin/env node

/**
 * Chrystal Sparrow's Cultural Creations - Version Update Script
 *
 * This script increments the version number and updates all frontend files with:
 * - New version string
 * - Updated timestamp
 * - Cache-busting parameters in meta tags
 *
 * Usage: node version-update.js [--patch|--minor|--major]
 * Default: increments patch version
 */

const fs = require('fs');
const path = require('path');

// Configuration
const VERSION_FILE = path.join(__dirname, 'version.json');
const FILES_TO_UPDATE = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'public', 'desktop.html'),
    path.join(__dirname, 'public', 'mobile.html'),
    path.join(__dirname, 'public', 'js', 'config', 'services-config.js')
];

/**
 * Parse semantic version and increment
 */
function incrementVersion(version, type = 'patch') {
    const parts = version.split('.').map(Number);

    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2]++;
    }

    return parts.join('.');
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp() {
    return new Date().toISOString();
}

/**
 * Update version.json file
 */
function updateVersionFile(newVersion, timestamp) {
    const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));

    versionData.version = newVersion;
    versionData.lastUpdated = timestamp;
    versionData.buildNumber++;

    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');
    console.log(`✓ Updated version.json: ${newVersion} (Build #${versionData.buildNumber})`);
}

/**
 * Update services-config.js
 */
function updateServicesConfig(newVersion, timestamp, buildNumber) {
    let content = fs.readFileSync(FILES_TO_UPDATE[3], 'utf8');

    // Replace VERSION line
    content = content.replace(
        /\/\/ VERSION: .+/,
        `// VERSION: ${newVersion}`
    );

    // Replace const APP_VERSION
    content = content.replace(
        /const APP_VERSION = '[^']+'/,
        `const APP_VERSION = '${newVersion}'`
    );

    // Replace const APP_BUILD
    content = content.replace(
        /const APP_BUILD = \d+/,
        `const APP_BUILD = ${buildNumber}`
    );

    // Replace const APP_UPDATED
    content = content.replace(
        /const APP_UPDATED = '[^']+'/,
        `const APP_UPDATED = '${timestamp}'`
    );

    fs.writeFileSync(FILES_TO_UPDATE[3], content);
    console.log(`✓ Updated services-config.js`);
}

/**
 * Update index.html (router) with cache-busting version parameter and Open Graph tags
 */
function updateIndexHtmlRouter(newVersion, timestamp) {
    let content = fs.readFileSync(FILES_TO_UPDATE[0], 'utf8');

    // Update og:url version parameter (router uses root URL)
    content = content.replace(
        /og:url" content="https:\/\/stores-12345\.web\.app\/\?v=[^"]+"/,
        `og:url" content="https://stores-12345.web.app/?v=${newVersion}"`
    );

    // Update twitter:url version parameter (router uses root URL)
    content = content.replace(
        /twitter:url" content="https:\/\/stores-12345\.web\.app\/\?v=[^"]+"/,
        `twitter:url" content="https://stores-12345.web.app/?v=${newVersion}"`
    );

    // Update og:updated_time
    content = content.replace(
        /og:updated_time" content="[^"]+"/,
        `og:updated_time" content="${timestamp}"`
    );

    // Update version comment
    content = content.replace(
        /<!-- VERSION: [^-]+ - DO NOT MANUALLY EDIT/,
        `<!-- VERSION: ${newVersion} - DO NOT MANUALLY EDIT`
    );

    // === ROBUST CACHE BUSTING FOR ROUTER ===
    // This regex finds ALL local files (CSS, JS, JSON, etc.) in the router
    // and updates them with the new version.
    content = content.replace(
        /(href|src)=["']([^"']+?)(\.css|\.js|\.json)(\?[^"']*)?["']/g,
        (match, attr, path, ext, oldQuery) => {
            // Remove everything after the filename and extension, add new version
            return `${attr}="${path}${ext}?v=${newVersion}"`;
        }
    );

    fs.writeFileSync(FILES_TO_UPDATE[0], content);
    console.log(`✓ Updated index.html (router with Open Graph tags and cache busting)`);
}

/**
 * Update desktop.html with new Open Graph meta tags and CSS/JS file versions
 */
function updateDesktopHtml(newVersion, timestamp) {
    let content = fs.readFileSync(FILES_TO_UPDATE[1], 'utf8');

    // Update og:url version parameter (supports both index.html and desktop.html)
    content = content.replace(
        /og:url" content="https:\/\/stores-12345\.web\.app\/(index|desktop)\.html\?v=[^"]+"/,
        `og:url" content="https://stores-12345.web.app/desktop.html?v=${newVersion}"`
    );

    // Update twitter:url version parameter (supports both index.html and desktop.html)
    content = content.replace(
        /twitter:url" content="https:\/\/stores-12345\.web\.app\/(index|desktop)\.html\?v=[^"]+"/,
        `twitter:url" content="https://stores-12345.web.app/desktop.html?v=${newVersion}"`
    );

    // Update og:updated_time
    content = content.replace(
        /og:updated_time" content="[^"]+"/,
        `og:updated_time" content="${timestamp}"`
    );

    // Update version comment
    content = content.replace(
        /<!-- VERSION: [^-]+ - DO NOT MANUALLY EDIT/,
        `<!-- VERSION: ${newVersion} - DO NOT MANUALLY EDIT`
    );

    // === ROBUST CACHE BUSTING (v3) ===
    // This regex finds ALL local files (CSS, JS, GLB, PNG, MP3, JSON, etc.)
    // whether they have an existing version parameter or not, and updates them.
    content = content.replace(
        /(href|src)=["']([^"']+?)(\.css|\.js|\.glb|\.png|\.mp3|\.json)(\?[^"']*)?["']/g,
        (match, attr, path, ext, oldQuery) => {
            // Remove everything after the filename and extension, add new version
            return `${attr}="${path}${ext}?v=${newVersion}"`;
        }
    );

    fs.writeFileSync(FILES_TO_UPDATE[1], content);
    console.log(`✓ Updated desktop.html (ALL local files versioned: CSS, JS, GLB, PNG, MP3, JSON, etc.)`);
}

/**
 * Update mobile.html with new Open Graph meta tags and CSS/JS file versions
 */
function updateMobileHtml(newVersion, timestamp) {
    let content = fs.readFileSync(FILES_TO_UPDATE[2], 'utf8');

    // Update og:url version parameter
    content = content.replace(
        /og:url" content="https:\/\/stores-12345\.web\.app\/mobile\.html\?v=[^"]+"/,
        `og:url" content="https://stores-12345.web.app/mobile.html?v=${newVersion}-mobile"`
    );

    // Update twitter:url version parameter
    content = content.replace(
        /twitter:url" content="https:\/\/stores-12345\.web\.app\/mobile\.html\?v=[^"]+"/,
        `twitter:url" content="https://stores-12345.web.app/mobile.html?v=${newVersion}-mobile"`
    );

    // Update og:updated_time
    content = content.replace(
        /og:updated_time" content="[^"]+"/,
        `og:updated_time" content="${timestamp}"`
    );

    // Update version comment
    content = content.replace(
        /<!-- VERSION: [^-]+ - DO NOT MANUALLY EDIT/,
        `<!-- VERSION: ${newVersion} - DO NOT MANUALLY EDIT`
    );

    // === ROBUST CACHE BUSTING (v3) ===
    // This regex finds ALL local files (CSS, JS, GLB, PNG, MP3, JSON, etc.)
    // whether they have an existing version parameter or not, and updates them.
    content = content.replace(
        /(href|src)=["']([^"']+?)(\.css|\.js|\.glb|\.png|\.mp3|\.json)(\?[^"']*)?["']/g,
        (match, attr, path, ext, oldQuery) => {
            // Remove everything after the filename and extension, add new version
            return `${attr}="${path}${ext}?v=${newVersion}"`;
        }
    );

    fs.writeFileSync(FILES_TO_UPDATE[2], content);
    console.log(`✓ Updated mobile.html (ALL local files versioned: CSS, JS, GLB, PNG, MP3, JSON, etc.)`);
}

/**
 * Version all hardcoded asset paths in JavaScript files
 * IMPORTANT: Images in IMAGE_PATHS_TO_PRELOAD are NOT versioned because:
 * - Query parameters bypass browser caching
 * - These images are preloaded once and cached by the browser
 * - Server HTTP headers handle cache invalidation, not URL parameters
 */
function updateAssetPathsInJs(newVersion) {
    const jsFilesToUpdate = [
        path.join(__dirname, 'public', 'js', 'portal-controller.js'),
        path.join(__dirname, 'public', 'js', 'services-config.js'),
        path.join(__dirname, 'public', 'js', 'menu-controller.js'),
        path.join(__dirname, 'public', 'js', 'smart-message-renderer.js'),
        path.join(__dirname, 'public', 'js', 'config', 'services-config.js'),
    ];

    jsFilesToUpdate.forEach(filePath => {
        try {
            if (!fs.existsSync(filePath)) return;

            let content = fs.readFileSync(filePath, 'utf8');

            // Version all hardcoded asset paths
            // Pattern: quotes (with or without ./) followed by asset filename, optionally with ?v=... already there
            // CRITICAL: Use 'i' flag for case-INSENSITIVE matching (Windows vs Linux filesystem differences)
            content = content.replace(/['"](\.?\/)*moon_logo_3d\.glb(\?[^'"]*)?['"]/gi, `'/moon_logo_3d.glb?v=${newVersion}'`);
            content = content.replace(/['"](\.?\/)*moon_logo\.png(\?[^'"]*)?['"]/gi, `'/moon_logo.png?v=${newVersion}'`);
            content = content.replace(/['"](\.?\/)*button_click\.mp3(\?[^'"]*)?['"]/gi, `'./button_click.mp3?v=${newVersion}'`);

            // NOTE: We do NOT version moon9.png here if it appears in IMAGE_PATHS_TO_PRELOAD
            // Those images should NOT have ?v= parameters to enable proper browser caching
            // We still version it in IMAGE_PATHS object used elsewhere, but protect the preload array

            // Special handling for services-config.js to version moon9.png ONLY in IMAGE_PATHS, not IMAGE_PATHS_TO_PRELOAD
            if (filePath.includes('services-config.js')) {
                // Version moon9.png ONLY in the IMAGE_PATHS object (the one with ?v=)
                // This protects the IMAGE_PATHS_TO_PRELOAD array from being versioned
                content = content.replace(
                    /moonLogo:\s*['"]([^'"]*?)moon9\.png(\?[^'"]*)?['"]/gi,
                    `moonLogo: '/moon9.png?v=${newVersion}'`
                );
            }

            fs.writeFileSync(filePath, content);
        } catch (err) {
            // File doesn't exist or can't be updated, skip silently
        }
    });

    console.log(`✓ Updated hardcoded asset paths in JS files (GLB, PNG, MP3)`);
    console.log(`  Note: Images in IMAGE_PATHS_TO_PRELOAD are NOT versioned (browser caching)`);
}

/**
 * Main execution
 */
function main() {
    try {
        // Read current version
        const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
        const currentVersion = versionData.version;
        const buildNumber = versionData.buildNumber + 1;

        // Determine increment type from command line
        const args = process.argv.slice(2);
        const incrementType = args[0] ? args[0].replace('--', '') : 'patch';

        // Calculate new version
        const newVersion = incrementVersion(currentVersion, incrementType);
        const timestamp = getCurrentTimestamp();

        console.log('\n🚀 Chrystal Sparrow\'s Cultural Creations - Version Update Script');
        console.log('═══════════════════════════════════════════');
        console.log(`Current Version: ${currentVersion}`);
        console.log(`New Version:     ${newVersion}`);
        console.log(`Build Number:    ${buildNumber}`);
        console.log(`Timestamp:       ${timestamp}`);
        console.log('═══════════════════════════════════════════\n');

        // Update all files
        updateVersionFile(newVersion, timestamp);
        updateServicesConfig(newVersion, timestamp, buildNumber);
        updateIndexHtmlRouter(newVersion, timestamp);
        updateDesktopHtml(newVersion, timestamp);
        updateMobileHtml(newVersion, timestamp);
        updateAssetPathsInJs(newVersion);

        console.log('\n✅ Version update complete!');
        console.log(`\n📝 Next steps:`);
        console.log(`   1. Run: npm run deploy`);
        console.log(`   2. Test router at: https://stores-12345.web.app/ (auto-redirects)`);
        console.log(`   3. Test desktop at: https://stores-12345.web.app/desktop.html?v=${newVersion}`);
        console.log(`   4. Test mobile at: https://stores-12345.web.app/mobile.html?v=${newVersion}-mobile`);
        console.log(`   5. Debug in Facebook: https://developers.facebook.com/tools/debug/`);
        console.log(`   6. Debug in Twitter: https://cards-dev.twitter.com/validator`);
        console.log('');

    } catch (error) {
        console.error('❌ Error during version update:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
