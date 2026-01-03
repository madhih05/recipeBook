// Import Express framework and type definitions
import express from 'express';
// Import environment variable loader
import dotenv from 'dotenv';
// Import MongoDB object document mapper
import mongoose from 'mongoose';
// Import recipe routes
import recipeRoutes from './routes/recipeRoutes';
import registrationRoutes from './routes/auth';

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
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

// Mount recipe routes
app.use('/', recipeRoutes);
app.use('/', registrationRoutes);

// Start the Express server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});