/**
 * Firebase Service
 * Handles all Firebase Admin SDK operations
 */

import admin from 'firebase-admin';
import fs from 'fs';

let db = null;

/**
 * Initialize Firebase Admin SDK
 */
export async function initializeFirebase() {
    try {
        // Check if service account key exists
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
            console.warn('⚠️ Firebase service account key not found');
            console.warn('📝 Download from Firebase Console > Project Settings > Service Accounts');
            console.warn(`📂 Expected at: ${serviceAccountPath}`);
            throw new Error('Firebase credentials not configured');
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        db = admin.firestore();

        console.log('✅ Firebase Admin initialized');
        return db;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        throw error;
    }
}

/**
 * Get Firestore instance
 */
export function getFirestore() {
    if (!db) {
        throw new Error('Firestore not initialized. Call initializeFirebase() first.');
    }
    return db;
}

/**
 * Verify Firebase ID token (for protected routes)
 */
export async function verifyIdToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get user config from Firestore
 */
export async function getUserConfig(uid) {
    const db = getFirestore();
    const configDoc = await db
        .collection(process.env.CONFIGS_COLLECTION || 'store_configs')
        .doc(uid)
        .get();

    if (!configDoc.exists) {
        return null;
    }

    return configDoc.data();
}

/**
 * Save user config to Firestore
 */
export async function saveUserConfig(uid, config) {
    const db = getFirestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await db
        .collection(process.env.CONFIGS_COLLECTION || 'store_configs')
        .doc(uid)
        .set({
            ...config,
            updated_at: timestamp,
            uid: uid
        }, { merge: true });

    console.log(`✅ Config saved for user ${uid}`);
    return true;
}

/**
 * Delete user config
 */
export async function deleteUserConfig(uid) {
    const db = getFirestore();
    await db
        .collection(process.env.CONFIGS_COLLECTION || 'store_configs')
        .doc(uid)
        .delete();

    console.log(`🗑️ Config deleted for user ${uid}`);
    return true;
}

/**
 * Get all user configs (admin only)
 */
export async function getAllConfigs() {
    const db = getFirestore();
    const snapshot = await db
        .collection(process.env.CONFIGS_COLLECTION || 'store_configs')
        .get();

    const configs = [];
    snapshot.forEach(doc => {
        configs.push({
            uid: doc.id,
            ...doc.data()
        });
    });

    return configs;
}

export default {
    initializeFirebase,
    getFirestore,
    verifyIdToken,
    getUserConfig,
    saveUserConfig,
    deleteUserConfig,
    getAllConfigs
};
