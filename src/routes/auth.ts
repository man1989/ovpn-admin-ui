import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { VPN_ADMIN_USER, VPN_ADMIN_PASS, JWT_SECRET } = process.env;

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === VPN_ADMIN_USER && password === VPN_ADMIN_PASS) {
        const token = jwt.sign({ username }, JWT_SECRET as string, { expiresIn: '4h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

export default router;
