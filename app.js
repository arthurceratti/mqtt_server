// app.js
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for enabling CORS
app.use(cors());

// Connect to PostgreSQL using our dbConfig
import { query } from './config/dbConfig.js';

query('SELECT 1', []);
console.log(`Connected to ${process.env.DB_NAME} database successfully.`);
// Set up routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});