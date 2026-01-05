// ============================================================================
// IMPORTS
// ============================================================================

import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/Users';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

dotenv.config();

const router = express.Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a JWT token for the given user ID.
 * Token expires after 1 hour.
 *
 * @param userId - The MongoDB user ID to encode in the token
 * @returns JWT token string
 */
const generateToken = (userId: string): string => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );
};



// ============================================================================
// POST /register - Register a new user
// ============================================================================

/**
 * Register a new user account.
 * Validates that email and username are unique, hashes password, and creates user.
 * Returns JWT token on successful registration.
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        logger.info('Registration attempt', { username, email });

        // Check if email already exists
        const existingEmail = await User.findOne({ email }).select('_id');
        if (existingEmail) {
            logger.warn('Registration failed: Email already in use', { email });
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username }).select(
            '_id'
        );
        if (existingUsername) {
            logger.warn('Registration failed: Username already taken', {
                username,
            });
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password with salt
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user document
        const newUser = new User({
            username,
            email,
            password: passwordHash,
            savedRecipes: [],
        });

        // Save user to database
        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser._id.toString());

        logger.info('User registered successfully', {
            userId: newUser._id.toString(),
            username,
            email,
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
        });
    } catch (error: any) {
        logger.error('Registration error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});



// ============================================================================
// POST /login - Authenticate user and return JWT token
// ============================================================================

/**
 * Authenticate user with email and password.
 * Verifies credentials and returns JWT token on success.
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        logger.info('Login attempt', { email });

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('Login failed: User not found', { email });
            return res
                .status(400)
                .json({ error: 'Invalid email or password' });
        }

        // Compare password with stored hash
        const isPasswordMatch = await bcrypt.compare(
            password,
            user.password
        );
        if (!isPasswordMatch) {
            logger.warn('Login failed: Invalid password', {
                email,
                userId: user._id.toString(),
            });
            return res
                .status(400)
                .json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user._id.toString());

        logger.info('Login successful', {
            userId: user._id.toString(),
            username: user.username,
            email,
        });

        res.json({
            message: 'Login successful',
            username: user.username,
            token,
        });
    } catch (error: any) {
        logger.error('Login error', {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});



// ============================================================================
// GET /me - Retrieve authenticated user profile
// ============================================================================

/**
 * Get the current authenticated user's profile information.
 * Requires valid JWT token in Authorization header.
 */
router.get(
    '/me',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            logger.info('Fetching user profile', { userId: req.user });

            // Fetch user by ID, excluding password
            const user = await User.findById(req.user).select(
                'username email createdAt savedRecipes'
            );

            if (!user) {
                logger.warn('User profile not found', { userId: req.user });
                return res.status(404).json({ error: 'User not found' });
            }

            logger.info('User profile fetched successfully', {
                userId: req.user,
                username: user.username,
            });

            res.json({ user });
        } catch (error: any) {
            logger.error('Error fetching user profile', {
                userId: req.user,
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;