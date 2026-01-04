import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

export interface AuthRequest extends Request {
    user?: string; // or any other user info you want to attach
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Authentication failed: No token provided', { path: req.path, method: req.method });
        return res.status(401).json({ error: "Unauthorized" }); // Unauthorized
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        req.user = decode.id; // Attach user id to request
        logger.info('Token authenticated successfully', { userId: decode.id, path: req.path, method: req.method });
        next();
    }
    catch (error) {
        logger.warn('Authentication failed: Invalid token', { path: req.path, method: req.method, error: error instanceof Error ? error.message : 'Unknown error' });
        return res.status(403).json({ error: "Forbidden" }); // Forbidden
    }

}