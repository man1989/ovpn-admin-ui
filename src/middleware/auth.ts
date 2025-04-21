import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthRequest extends Request {
    user?: string;
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return
    }

    jwt.verify(token, JWT_SECRET as string, (err, user) => {
        console.log(err);
        if (err) return res.sendStatus(403);
        req.user = user as string;
        return next();
    });
}

export default authenticateToken;
