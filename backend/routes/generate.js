/**
 * Generate API Routes
 * AI-powered config generation
 */

import express from 'express';
import { generateConfig, improveConfig } from '../services/ai-service.js';
import { validateConfig } from '../validators/config-validator.js';
import { getUserConfig, saveUserConfig } from '../services/firebase-service.js';

const router = express.Router();

/**
 * POST /api/generate
 * Generate a new config from a prompt
 *
 * Request body:
 * {
 *   prompt: string,              // User's description
 *   config_type: string,         // Type of config (theme|brand|services|products|pages|full)
 *   uid: string (optional),      // User ID to save to
 *   auto_save: boolean          // Auto-save if valid (default: false)
 * }
 */
router.post('/', async (req, res) => {
    try {
        const {
            prompt,
            config_type = 'full',
            uid,
            auto_save = false
        } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: 'Missing prompt in request body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🤖 Generating ${config_type} config from prompt...`);
        console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

        // Generate config with AI
        const generatedConfig = await generateConfig(prompt, config_type);

        // Validate generated config
        const validationResult = validateConfig(generatedConfig, { strict: false });

        let saveResult = null;

        // Auto-save if requested and valid
        if (auto_save && uid && validationResult.valid) {
            console.log(`💾 Auto-saving config for user ${uid}`);

            const configWithMetadata = {
                ...generatedConfig,
                metadata: {
                    generated_at: new Date().toISOString(),
                    generator: 'ai',
                    prompt: prompt.substring(0, 500), // Save truncated prompt
                    config_type,
                    uid
                }
            };

            await saveUserConfig(uid, configWithMetadata);
            saveResult = { saved: true, uid };
        }

        res.json({
            success: true,
            config: generatedConfig,
            validation: validationResult,
            save_result: saveResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Generation error:', error);
        res.status(500).json({
            error: 'Failed to generate config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/generate/improve
 * Improve an existing config
 *
 * Request body:
 * {
 *   uid: string,                 // User ID
 *   improvement_prompt: string,  // What to improve
 *   auto_save: boolean          // Auto-save if valid
 * }
 */
router.post('/improve', async (req, res) => {
    try {
        const {
            uid,
            improvement_prompt,
            auto_save = false
        } = req.body;

        if (!uid || !improvement_prompt) {
            return res.status(400).json({
                error: 'Missing uid or improvement_prompt',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🔧 Improving config for user ${uid}`);
        console.log(`📝 Improvement: ${improvement_prompt.substring(0, 100)}...`);

        // Get existing config
        const existingConfig = await getUserConfig(uid);

        if (!existingConfig) {
            return res.status(404).json({
                error: 'No existing config found for this user',
                uid,
                timestamp: new Date().toISOString()
            });
        }

        // Improve config with AI
        const improvedConfig = await improveConfig(existingConfig, improvement_prompt);

        // Validate
        const validationResult = validateConfig(improvedConfig, { strict: false });

        let saveResult = null;

        // Auto-save if valid
        if (auto_save && validationResult.valid) {
            console.log(`💾 Auto-saving improved config for user ${uid}`);

            const configWithMetadata = {
                ...improvedConfig,
                metadata: {
                    ...improvedConfig.metadata,
                    last_improved: new Date().toISOString(),
                    improvement_prompt: improvement_prompt.substring(0, 500)
                }
            };

            await saveUserConfig(uid, configWithMetadata);
            saveResult = { saved: true, uid };
        }

        res.json({
            success: true,
            config: improvedConfig,
            validation: validationResult,
            save_result: saveResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Improvement error:', error);
        res.status(500).json({
            error: 'Failed to improve config',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/generate/section
 * Generate a specific section
 *
 * Request body:
 * {
 *   prompt: string,
 *   section: string,             // theme|brand|services|products|pages
 *   uid: string (optional),
 *   merge_with_existing: boolean // Merge with existing config
 * }
 */
router.post('/section', async (req, res) => {
    try {
        const {
            prompt,
            section,
            uid,
            merge_with_existing = false
        } = req.body;

        if (!prompt || !section) {
            return res.status(400).json({
                error: 'Missing prompt or section',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🤖 Generating ${section} section`);

        // Generate section
        const generatedSection = await generateConfig(prompt, section);

        let finalConfig = { [section]: generatedSection };

        // Merge with existing if requested
        if (merge_with_existing && uid) {
            const existingConfig = await getUserConfig(uid) || {};
            finalConfig = {
                ...existingConfig,
                [section]: generatedSection
            };
        }

        // Validate
        const validationResult = validateConfig(finalConfig, { strict: false });

        res.json({
            success: true,
            section,
            generated: generatedSection,
            merged_config: merge_with_existing ? finalConfig : null,
            validation: validationResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Section generation error:', error);
        res.status(500).json({
            error: 'Failed to generate section',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
