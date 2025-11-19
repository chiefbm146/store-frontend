/**
 * Store Printer Portal Backend
 *
 * This backend serves the Store Printer Portal where clients:
 * 1. Use AI to generate store configurations
 * 2. Edit and validate configs
 * 3. Save configs to Firestore
 * 4. Deploy configs to their storefront
 *
 * Clients authenticate via Firebase Auth (Google Sign-In)
 * Each client has a UID used to store/retrieve their configs
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import configRoutes from './routes/config.js';
import generateRoutes from './routes/generate.js';
import deployRoutes from './routes/deploy.js';
import { initializeFirebase } from './services/firebase-service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin
await initializeFirebase();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS - Allow both portal and storefront
const allowedOrigins = [
    process.env.PORTAL_URL,
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'store-printer-portal-backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/config', configRoutes);      // CRUD for configs
app.use('/api/generate', generateRoutes);  // AI generation
app.use('/api/deploy', deployRoutes);      // Deploy to storefront

// Serve admin panel
app.use('/admin', express.static('admin-panel'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🏪 Store Printer Portal Backend`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Portal URL: ${process.env.PORTAL_URL || 'Not set'}`);
    console.log(`🏬 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
    console.log(`\n✅ Server ready at http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    process.exit(0);
});

export default app;
