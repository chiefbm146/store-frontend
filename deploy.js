#!/usr/bin/env node

/**
 * Chrystal Sparrow's Cultural Creations - Deploy Script
 *
 * Usage: node deploy.js
 *
 * This script:
 * 1. Asks you to pick a version type (patch, minor, major)
 * 2. Updates all version numbers automatically
 * 3. Deploys to Firebase
 * 4. Shows you the URLs to test
 * 5. STAYS OPEN so you can copy the URLs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const PROJECT_ROOT = __dirname;
const VERSION_FILE = path.join(PROJECT_ROOT, 'version.json');

console.clear();
console.log('\n');
console.log('========================================================================');
console.log('           CHRYSTAL SPARROW\'S CULTURAL CREATIONS - DEPLOY');
console.log('========================================================================');
console.log('\n');

// Step 1: Check requirements
console.log('Checking requirements...\n');

try {
    execSync('node --version', { stdio: 'pipe' });
    console.log('[OK] Node.js installed');
} catch (e) {
    console.error('[ERROR] Node.js not found. Install from https://nodejs.org/');
    process.exit(1);
}

try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('[OK] Firebase CLI installed');
} catch (e) {
    console.error('[ERROR] Firebase not found. Run: npm install -g firebase-tools');
    process.exit(1);
}

console.log('\n');

// Step 2: Ask for version type
rl.question(
    '========================================================================\n' +
    'SELECT VERSION TYPE:\n' +
    '========================================================================\n' +
    '\n' +
    '1 = Patch version (1.0.0 -> 1.0.1) - Bug fixes, small changes\n' +
    '2 = Minor version (1.0.0 -> 1.1.0) - New features\n' +
    '3 = Major version (1.0.0 -> 2.0.0) - Major changes\n' +
    '\n' +
    'Enter 1, 2, or 3 (press ENTER for 1): ',
    async (answer) => {
        let versionType = 'patch';

        if (answer === '2') versionType = 'minor';
        else if (answer === '3') versionType = 'major';

        console.log('\n');
        console.log('Selected:', versionType.toUpperCase(), 'version');
        console.log('\n');

        try {
            // Step 3: Update version
            console.log('========================================================================');
            console.log('STEP 1: UPDATING VERSION');
            console.log('========================================================================\n');

            const versionScript = path.join(PROJECT_ROOT, 'version-update.js');
            execSync(`node "${versionScript}" --${versionType}`, { stdio: 'inherit' });

            console.log('\n');
            console.log('[OK] Version updated successfully!');
            console.log('\n');

            // Step 3.5: Copy version.json to public directory
            console.log('========================================================================');
            console.log('STEP 1.5: COPYING VERSION.JSON TO PUBLIC');
            console.log('========================================================================\n');

            try {
                const versionSourceFile = path.join(PROJECT_ROOT, 'version.json');
                const versionPublicFile = path.join(PROJECT_ROOT, 'public', 'version.json');
                fs.copyFileSync(versionSourceFile, versionPublicFile);
                console.log('[OK] version.json copied to public directory');
                console.log('\n');
            } catch (copyError) {
                console.error('[ERROR] Failed to copy version.json:', copyError.message);
                throw copyError;
            }

            // Step 4: Deploy to Firebase
            console.log('========================================================================');
            console.log('STEP 2: DEPLOYING TO FIREBASE');
            console.log('========================================================================\n');
            console.log('This may take 2-3 minutes. Please wait...\n');

            execSync('firebase deploy', { stdio: 'inherit' });

            console.log('\n');
            console.log('[OK] Firebase deployment successful!');
            console.log('\n');

            // Step 5: Read version and show URLs
            const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
            const newVersion = versionData.version;

            console.log('========================================================================');
            console.log('SUCCESS! DEPLOYMENT COMPLETE!');
            console.log('========================================================================\n');

            console.log('NEW VERSION:', newVersion);
            console.log('\n');

            console.log('========================================================================');
            console.log('TEST YOUR DEPLOYMENT - COPY THESE URLS');
            console.log('========================================================================\n');

            console.log('Desktop:');
            console.log('  https://stores-12345.web.app/index.html?v=' + newVersion);
            console.log('\n');

            console.log('Mobile (for Facebook Messenger):');
            console.log('  https://stores-12345.web.app/mobile.html?v=' + newVersion + '-mobile');
            console.log('\n');

            console.log('========================================================================');
            console.log('FORCE SOCIAL MEDIA TO RECRAWL YOUR LINKS');
            console.log('========================================================================\n');

            console.log('FACEBOOK DEBUGGER:');
            console.log('  1. Go to: https://developers.facebook.com/tools/debug/');
            console.log('  2. Paste this URL: https://stores-12345.web.app/index.html?v=' + newVersion);
            console.log('  3. Click "Scrape Again"\n');

            console.log('TWITTER CARD VALIDATOR:');
            console.log('  1. Go to: https://cards-dev.twitter.com/validator');
            console.log('  2. Paste this URL: https://stores-12345.web.app/index.html?v=' + newVersion);
            console.log('  3. Click "Preview Card"\n');

            console.log('========================================================================\n');

            rl.question('Press ENTER to close this window and test your deployment: ', () => {
                rl.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('\n');
            console.error('[ERROR] Deployment failed:', error.message);
            console.error('\n');
            rl.question('Press ENTER to close...', () => {
                rl.close();
                process.exit(1);
            });
        }
    }
);
