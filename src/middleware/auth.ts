import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthRequest extends Request {
    user?: string; // or any other user info you want to attach
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" }); // Unauthorized
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decode as string; // Attach user info to request
        next();
    }
    catch (error) {
        return res.status(403).json({ error: "Forbidden" }); // Forbidden
    }

}