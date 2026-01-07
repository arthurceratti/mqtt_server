// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const { query } = await import('../config/dbConfig.js');

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('All fields are required.');

    try {
        const existingUser = await User.getUserByEmail(email);
        if (existingUser) return res.status(409).send('Email is already registered.');

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const result = await query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            [email, hashedPassword]
        );

        const newUser = result.rows[0];

        res.status(201).json({ id: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send('All fields are required.');

    try {
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(401).send('Authentication failed.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).send('Authentication failed.');

        // Create a token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '2h',
        });

        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Something went wrong.');
    }
});

router.post('/logout', (req, res) => {
    // Clear the session or token if needed
    res.clearCookie('token');
    res.send('Logged out successfully');
});

export default router;