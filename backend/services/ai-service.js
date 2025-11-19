/**
 * AI Service - Gemini Flash 2.0
 * Generates store configurations from natural language prompts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate store config using AI
 *
 * @param {string} prompt - User's description of their store
 * @param {string} configType - Type of config to generate (theme|brand|services|products|pages|full)
 * @returns {object} Generated configuration
 */
export async function generateConfig(prompt, configType = 'full') {
    try {
        console.log(`🤖 Generating ${configType} config from prompt...`);

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
        });

        const systemPrompt = getSystemPrompt(configType);
        const fullPrompt = `${systemPrompt}\n\nUser Request:\n${prompt}\n\nGenerate ONLY valid JSON, no markdown, no explanations.`;

        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        // Extract JSON from response (remove markdown if present)
        let jsonText = response.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const config = JSON.parse(jsonText);

        console.log(`✅ Generated ${configType} config successfully`);
        return config;

    } catch (error) {
        console.error('❌ AI generation failed:', error.message);
        throw new Error(`Failed to generate config: ${error.message}`);
    }
}

/**
 * Get system prompt based on config type
 */
function getSystemPrompt(configType) {
    const basePrompt = `You are a store configuration generator for the Store Printer platform. Generate valid JSON configurations that match the exact structure used in the frontend.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations
2. Use exact field names as shown in examples
3. All colors must be valid hex codes (#RRGGBB)
4. All prices in cents (integer)
5. All URLs must start with / or http
6. All IDs use kebab-case

`;

    const prompts = {
        theme: basePrompt + `Generate a theme config with these exact fields:
{
  "colors": {
    "primary": "#1E90FF",
    "primaryDark": "#0047AB",
    "accent": "#FFD700",
    "textPrimary": "#1a1a1a",
    "background": "#F5F1E8"
    // ... (40+ color fields)
  },
  "fonts": {
    "body": "font-family-string",
    "sizes": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem" },
    "weights": { "light": 300, "normal": 400, "bold": 700 }
  },
  "spacing": { "0": "0", "1": "0.25rem", "2": "0.5rem" },
  "shadows": { "sm": "shadow-string", "md": "shadow-string" },
  "radius": { "sm": "0.25rem", "md": "0.5rem" },
  "transitions": { "fast": "150ms", "base": "300ms" },
  "zIndex": { "dropdown": 1000, "modal": 9999 },
  "breakpoints": { "mobile": "768px", "tablet": "1024px" }
}`,

        brand: basePrompt + `Generate a brand config:
{
  "companyName": "string",
  "tagline": "string",
  "contact": {
    "name": "string",
    "title": "string",
    "email": "string",
    "phone": "string",
    "address": { "street": "", "city": "", "province": "", "postal": "", "country": "" }
  },
  "logos": {
    "main": "/images/logo.png",
    "favicon": "/images/favicon.png"
  },
  "meta": {
    "title": "string",
    "description": "string",
    "keywords": ["keyword1", "keyword2"]
  },
  "social": {
    "facebook": "url",
    "instagram": "url",
    "twitter": "url"
  }
}`,

        services: basePrompt + `Generate services config as an object with service IDs as keys:
{
  "service-id-1": {
    "id": "service-id-1",
    "type": "workshop",
    "category": "in-person",
    "name": "Service Name",
    "emoji": "🎯",
    "description": "Short description",
    "longDescription": "Long description with multiple paragraphs",
    "pricing": {
      "enabled": true,
      "model": "per_person",
      "currency": "CAD",
      "community": 5000,
      "corporate": 7500
    },
    "duration": "2 hours",
    "participants": { "min": 10, "max": 50 },
    "image": "/images/services/service.jpg",
    "highlights": ["Benefit 1", "Benefit 2"]
  }
}`,

        products: basePrompt + `Generate products config:
{
  "product-id-1": {
    "id": "product-id-1",
    "type": "physical",
    "sku": "PROD-001",
    "name": "Product Name",
    "pricing": {
      "price": 2999,
      "compareAtPrice": 3999,
      "currency": "CAD",
      "onSale": true
    },
    "inventory": {
      "tracked": true,
      "quantity": 100,
      "lowStockThreshold": 10
    },
    "images": {
      "main": "/images/products/product.jpg",
      "gallery": ["/images/products/product-2.jpg"]
    },
    "description": "Product description",
    "features": ["Feature 1", "Feature 2"]
  }
}`,

        pages: basePrompt + `Generate pages config:
{
  "about": {
    "title": "About Us",
    "sections": [
      {
        "id": "mission",
        "heading": "Our Mission",
        "body": "Mission statement"
      }
    ],
    "stats": [
      { "label": "Years", "value": "2+", "icon": "📅" }
    ]
  },
  "founder": {
    "name": "Founder Name",
    "title": "CEO",
    "bio": "Biography"
  },
  "contact": {
    "email": "contact@example.com",
    "phone": "(555) 555-5555",
    "hours": "Mon-Fri 9am-5pm"
  }
}`,

        full: basePrompt + `Generate a COMPLETE store configuration with ALL sections:
{
  "theme": { ...theme config... },
  "brand": { ...brand config... },
  "settings": {
    "backend": { "aiChatUrl": "url", "portalUrl": "url" },
    "features": { "enableAI": true, "enableCart": true },
    "chat": { "welcomeMessage": "string", "aiModel": "gemini-2.0-flash" },
    "threeD": { "mainLogoModel": "/model.glb" }
  },
  "services": { ...services config... },
  "products": { ...products config... },
  "pages": { ...pages config... },
  "metadata": {
    "generated_at": "ISO timestamp",
    "generator": "ai",
    "version": "1.0.0"
  }
}`
    };

    return prompts[configType] || prompts.full;
}

/**
 * Improve existing config using AI
 */
export async function improveConfig(existingConfig, improvementPrompt) {
    try {
        console.log('🤖 Improving config with AI...');

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
        });

        const prompt = `You are improving an existing store configuration.

Current Config:
${JSON.stringify(existingConfig, null, 2)}

Improvement Request:
${improvementPrompt}

Generate the COMPLETE improved configuration as valid JSON. Keep all existing fields unless specifically asked to change them. Output ONLY JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        let jsonText = response.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const improvedConfig = JSON.parse(jsonText);

        console.log('✅ Config improved successfully');
        return improvedConfig;

    } catch (error) {
        console.error('❌ Config improvement failed:', error.message);
        throw new Error(`Failed to improve config: ${error.message}`);
    }
}

export default {
    generateConfig,
    improveConfig
};
