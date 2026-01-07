// models/User.js
import { query } from '../config/dbConfig.js';

async function getUserByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

export default { getUserByEmail };