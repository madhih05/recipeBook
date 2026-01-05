// ============================================================================
// IMPORTS
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended Express Request interface with authenticated user information.
 * User ID is extracted from JWT token and attached to this property.
 */
export interface AuthRequest extends Request {
    user?: string;
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Authentication middleware that validates JWT tokens.
 * Extracts the token from the Authorization header and verifies it.
 * If valid, attaches the user ID to the request and proceeds to next handler.
 * If invalid, returns 401 (Unauthorized) or 403 (Forbidden) status.
 */
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void | Response => {
    // Extract token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Check if token exists
    if (!token) {
        logger.warn('Authentication failed: No token provided', {
            path: req.path,
            method: req.method,
        });
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token and extract user ID
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { id: string };

        // Attach user ID to request object
        req.user = decoded.id;

        logger.info('Token authenticated successfully', {
            userId: decoded.id,
            path: req.path,
            method: req.method,
        });

        next();
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';

        logger.warn('Authentication failed: Invalid token', {
            path: req.path,
            method: req.method,
            error: errorMsg,
        });

        return res.status(403).json({ error: 'Forbidden' });
    }
};