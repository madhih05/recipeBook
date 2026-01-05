// ============================================================================
// IMPORTS
// ============================================================================

import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import recipeRoutes from './routes/data';
import registrationRoutes from './routes/auth';
import logger from './utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Initialize Express application
const app = express();

// Load environment variables from .env file
dotenv.config();

// Configuration values
const databaseUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

mongoose.connect(databaseUri)
    .then(() => {
        const maskUri = databaseUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        logger.info('Connected to MongoDB', { uri: maskUri });
    })
    .catch((err) => {
        logger.error('Failed to connect to MongoDB', {
            error: err.message,
            stack: err.stack,
        });
    });

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Parse incoming JSON request bodies
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

app.use('/', recipeRoutes);
app.use('/', registrationRoutes);

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(port, () => {
    logger.info(`Server is running`, {
        port,
        environment: nodeEnv,
    });
});