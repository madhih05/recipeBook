import express, { Request, Response } from 'express';
import User from '../model/Users';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

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

        // Reject duplicate email or username before hashing
        const existingEmail = await User.findOne({ email }).select('_id');
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const existingUsername = await User.findOne({ username }).select('_id');
        if (existingUsername) {
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

        res.status(201).json({ message: 'User registered successfully', token: token });
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = await generateToken(user._id.toString());
        // Authentication successful
        res.json({ message: 'Login successful', username: user.username, token: token });
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;