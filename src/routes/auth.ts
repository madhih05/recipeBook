import express, { Request, Response } from 'express';
import User from '../model/Users';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

dotenv.config();

const router = express.Router();

const generateToken = async (userId: string) => {
    const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    return token;
};

// Register a new user with unique email and username
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;
        logger.info('Registration attempt', { username, email });

        // Reject duplicate email or username before hashing
        const existingEmail = await User.findOne({ email }).select('_id');
        if (existingEmail) {
            logger.warn('Registration failed: Email already in use', { email });
            return res.status(400).json({ error: 'Email already in use' });
        }

        const existingUsername = await User.findOne({ username }).select('_id');
        if (existingUsername) {
            logger.warn('Registration failed: Username already taken', { username });
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password and persist the new user document
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: username,
            email: email,
            password: hash,
            savedRecipes: [],
        });


        await newUser.save();

        const userId = await User.findOne({ email }).select('_id');

        const token = await generateToken(userId!._id.toString());

        logger.info('User registered successfully', { userId: userId!._id.toString(), username, email });
        res.status(201).json({ message: 'User registered successfully', token: token });
    }
    catch (error: any) {
        logger.error('Registration error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        logger.info('Login attempt', { email });

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('Login failed: User not found', { email });
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn('Login failed: Invalid password', { email, userId: user._id.toString() });
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = await generateToken(user._id.toString());
        // Authentication successful
        logger.info('Login successful', { userId: user._id.toString(), username: user.username, email });
        res.json({ message: 'Login successful', username: user.username, token: token });
    }
    catch (error: any) {
        logger.error('Login error', { error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        logger.info('Fetching user profile', { userId: req.user });
        const user = await User.findById(req.user).select('username email createdAt savedRecipes');
        if (!user) {
            logger.warn('User profile not found', { userId: req.user });
            return res.status(404).json({ error: 'User not found' });
        }
        logger.info('User profile fetched successfully', { userId: req.user, username: user.username });
        res.json({ user });
    }
    catch (error: any) {
        logger.error('Error fetching user profile', { userId: req.user, error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});


export default router;