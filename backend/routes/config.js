/**
 * Config API Routes
 * CRUD operations for store configurations
 */

import express from 'express';
import { getUserConfig, saveUserConfig, deleteUserConfig } from '../services/firebase-service.js';
import { validateConfig } from '../validators/config-validator.js';

const router = express.Router();

/**
 * GET /api/config/:uid
 * Get config for a specific user
 */
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        console.log(`📥 Fetching config for user ${uid}`);

        const config = await getUserConfig(uid);

        if (!config) {
            return res.status(404).json({
                error: 'Config not found',
                uid,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            uid,
            config,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Get config error:', error);
        res.status(500).json({
            error: 'Failed to fetch config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/config/:uid
 * Save/update config for a user
 *
 * Request body:
 * {
 *   config: object,          // The configuration object
 *   validate: boolean,       // Whether to validate (default: true)
 *   strict: boolean          // Strict validation (default: false)
 * }
 */
router.post('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const { config, validate = true, strict = false } = req.body;

        if (!config) {
            return res.status(400).json({
                error: 'Missing config in request body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`💾 Saving config for user ${uid}`);

        // Validate config if requested
        let validationResult = null;
        if (validate) {
            validationResult = validateConfig(config, { strict });

            if (!validationResult.valid) {
                return res.status(400).json({
                    error: 'Config validation failed',
                    validation: validationResult,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Add metadata
        const configWithMetadata = {
            ...config,
            metadata: {
                ...config.metadata,
                last_updated: new Date().toISOString(),
                uid,
                validated: validate
            }
        };

        // Save to Firestore
        await saveUserConfig(uid, configWithMetadata);

        res.json({
            success: true,
            uid,
            message: 'Config saved successfully',
            validation: validationResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Save config error:', error);
        res.status(500).json({
            error: 'Failed to save config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * PUT /api/config/:uid/section/:sectionName
 * Update a specific section of the config
 */
router.put('/:uid/section/:sectionName', async (req, res) => {
    try {
        const { uid, sectionName } = req.params;
        const { section } = req.body;

        if (!section) {
            return res.status(400).json({
                error: 'Missing section in request body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📝 Updating ${sectionName} section for user ${uid}`);

        // Get existing config
        const existingConfig = await getUserConfig(uid) || {};

        // Update section
        const updatedConfig = {
            ...existingConfig,
            [sectionName]: section,
            metadata: {
                ...existingConfig.metadata,
                last_updated: new Date().toISOString(),
                last_section_updated: sectionName
            }
        };

        // Save
        await saveUserConfig(uid, updatedConfig);

        res.json({
            success: true,
            uid,
            section: sectionName,
            message: `${sectionName} section updated successfully`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Update section error:', error);
        res.status(500).json({
            error: 'Failed to update section',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * DELETE /api/config/:uid
 * Delete user's config
 */
router.delete('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        console.log(`🗑️ Deleting config for user ${uid}`);

        await deleteUserConfig(uid);

        res.json({
            success: true,
            uid,
            message: 'Config deleted successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Delete config error:', error);
        res.status(500).json({
            error: 'Failed to delete config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/config/:uid/validate
 * Validate a config without saving
 */
router.post('/:uid/validate', async (req, res) => {
    try {
        const { config, strict = false } = req.body;

        if (!config) {
            return res.status(400).json({
                error: 'Missing config in request body',
                timestamp: new Date().toISOString()
            });
        }

        console.log('🔍 Validating config...');

        const validationResult = validateConfig(config, { strict });

        res.json({
            ...validationResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Validation error:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
