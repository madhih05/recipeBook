// Import Express framework and type definitions
import express from 'express';
// Import environment variable loader
import dotenv from 'dotenv';
// Import MongoDB object document mapper
import mongoose from 'mongoose';
// Import recipe routes
import recipeRoutes from './routes/data';
import registrationRoutes from './routes/auth';
// Import logger
import logger from './utils/logger';

// Initialize Express application
const app = express();
// Load environment variables from .env file
dotenv.config();
// MongoDB connection URI with fallback to local database
const databaseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';
// Server port with fallback to 3000
const port = process.env.PORT || 3000;

// Establish connection to MongoDB
mongoose.connect(databaseUri).then(() => {
    logger.info('Connected to MongoDB', { uri: databaseUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') });
}).catch((err) => {
    logger.error('Failed to connect to MongoDB', { error: err.message, stack: err.stack });
});

// Parse JSON request bodies
app.use(express.json());

// Mount recipe routes
app.use('/', recipeRoutes);
app.use('/', registrationRoutes);

// Start the Express server and listen on the specified port
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`, { port, environment: process.env.NODE_ENV || 'development' });
});