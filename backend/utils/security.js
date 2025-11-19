/**
 * Security Utilities
 * Simple validation helpers
 */

import crypto from 'crypto';

/**
 * Validate device fingerprint signature
 * (Placeholder - implement your own validation logic)
 */
export function validateFingerprint(fingerprint, signature, timestamp) {
    // This is a placeholder - implement actual validation
    // based on your frontend's fingerprint generation

    // Basic checks
    if (!fingerprint || !signature || !timestamp) {
        return false;
    }

    // Check timestamp is recent (within 5 minutes)
    const now = Date.now();
    const age = now - timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (age > maxAge || age < 0) {
        console.warn('⚠️ Fingerprint timestamp expired or invalid');
        return false;
    }

    // In production, verify the signature matches
    // const expectedSignature = generateSignature(fingerprint, timestamp, SECRET_KEY);
    // return signature === expectedSignature;

    return true; // For now, accept all valid-looking requests
}

/**
 * Generate a secure token
 */
export function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string (for passwords, etc.)
 */
export function hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

export default {
    validateFingerprint,
    generateToken,
    hashString
};
