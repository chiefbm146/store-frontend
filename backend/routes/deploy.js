/**
 * Deploy API Routes
 * Handles deployment of configs to storefronts
 */

import express from 'express';
import { getUserConfig, saveUserConfig } from '../services/firebase-service.js';
import { validateConfig } from '../validators/config-validator.js';

const router = express.Router();

/**
 * GET /api/deploy/:uid
 * Get deployed config for a storefront
 * This is called by the FRONTEND to fetch its configuration
 *
 * This endpoint should be publicly accessible (no auth required)
 * The frontend calls this on page load to get its config
 */
router.get('/:uid', async (req, res) => {
    try {
        const { uid } = req.params;

        console.log(`🚀 Frontend requesting config for UID: ${uid}`);

        // Get config from Firestore
        const config = await getUserConfig(uid);

        if (!config) {
            console.warn(`⚠️ No config found for UID: ${uid}`);
            return res.status(404).json({
                error: 'Config not found',
                message: `No configuration found for this store. Please contact support.`,
                uid,
                timestamp: new Date().toISOString()
            });
        }

        // Remove sensitive metadata before sending to frontend
        const { metadata, ...publicConfig } = config;

        res.json({
            success: true,
            config: publicConfig,
            deployed_at: metadata?.last_updated || new Date().toISOString(),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Deploy fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/deploy/:uid/publish
 * Publish/deploy a config (Portal uses this)
 *
 * This validates the config before marking it as "deployed"
 * Adds a deployment timestamp
 */
router.post('/:uid/publish', async (req, res) => {
    try {
        const { uid } = req.params;
        const { config, force = false } = req.body;

        if (!config) {
            return res.status(400).json({
                error: 'Missing config in request body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📤 Publishing config for UID: ${uid}`);

        // Validate before publishing
        const validationResult = validateConfig(config, { strict: !force });

        if (!validationResult.valid && !force) {
            return res.status(400).json({
                error: 'Cannot publish invalid config',
                message: 'Config must pass validation before publishing. Use force=true to override.',
                validation: validationResult,
                timestamp: new Date().toISOString()
            });
        }

        // Add deployment metadata
        const deployedConfig = {
            ...config,
            metadata: {
                ...config.metadata,
                deployed_at: new Date().toISOString(),
                deployment_status: 'published',
                uid
            }
        };

        // Save to Firestore
        await saveUserConfig(uid, deployedConfig);

        res.json({
            success: true,
            uid,
            message: 'Config published successfully',
            deployed_at: deployedConfig.metadata.deployed_at,
            validation: validationResult,
            frontend_url: `${process.env.FRONTEND_URL}?uid=${uid}`,
            config_url: `${req.protocol}://${req.get('host')}/api/deploy/${uid}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Publish error:', error);
        res.status(500).json({
            error: 'Failed to publish config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/deploy/:uid/status
 * Get deployment status
 */
router.get('/:uid/status', async (req, res) => {
    try {
        const { uid } = req.params;

        const config = await getUserConfig(uid);

        if (!config) {
            return res.status(404).json({
                error: 'Config not found',
                uid,
                timestamp: new Date().toISOString()
            });
        }

        const deploymentStatus = {
            uid,
            deployed: !!config.metadata?.deployed_at,
            deployed_at: config.metadata?.deployed_at || null,
            last_updated: config.metadata?.last_updated || null,
            status: config.metadata?.deployment_status || 'draft',
            validation: validateConfig(config, { strict: false }),
            frontend_url: config.metadata?.deployed_at ?
                `${process.env.FRONTEND_URL}?uid=${uid}` : null
        };

        res.json(deploymentStatus);

    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({
            error: 'Failed to check deployment status',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
