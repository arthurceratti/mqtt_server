// app.js
import express from 'express';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to PostgreSQL using our dbConfig
import { query } from './config/dbConfig.js';

query('SELECT 1', []);

// Set up routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});