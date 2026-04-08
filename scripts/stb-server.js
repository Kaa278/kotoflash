const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.STB_API_PORT || 3307;
const JWT_SECRET = process.env.JWT_SECRET || 'terlalurahasia-jangan-disebar';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'supersecret',
    database: process.env.DB_NAME || 'kotoflash',
    port: parseInt(process.env.DB_PORT || '3306'),
});

// Middleware: Authentication
async function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Bukan akses berizin' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

        req.userId = userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// --- AUTH ROUTES ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) return res.status(409).json({ error: 'Username sudah ada' });

        let userId = Math.floor(100000 + Math.random() * 900000);
        let idExists = true;
        while (idExists) {
            const [idRows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (idRows.length === 0) idExists = false;
            else userId = Math.floor(100000 + Math.random() * 900000);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (id, username, password_hash, name) VALUES (?, ?, ?, ?)',
            [userId, username, hashedPassword, name]
        );
        res.status(201).json({ message: 'Daftar berhasil' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'User tidak ditemukan' });

        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Password salah' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PROFILE ROUTES ---

// GET /api/auth/profile
app.get('/api/auth/profile', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, name, bio, avatar FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/profile
app.put('/api/auth/profile', authenticate, async (req, res) => {
    try {
        const { name, bio, avatar } = req.body;
        await pool.execute('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?', [name, bio, avatar, req.userId]);
        res.json({ status: 'Berhasil update' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- WORDS ROUTES ---

// GET /api/auth/words
app.get('/api/auth/words', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT word, meaning, example FROM words WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/words (Bulk or single)
app.post('/api/auth/words', authenticate, async (req, res) => {
    try {
        const { words } = req.body;
        if (Array.isArray(words)) {
            for (const w of words) {
                await pool.execute(
                    'INSERT INTO words (user_id, word, meaning, example) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), example = VALUES(example)',
                    [req.userId, w.word, w.meaning, w.example || null]
                );
            }
            res.json({ message: `${words.length} kata berhasil disinkronkan` });
        } else {
            const { word, meaning, example } = words;
            await pool.execute(
                'INSERT INTO words (user_id, word, meaning, example) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), example = VALUES(example)',
                [req.userId, word, meaning, example || null]
            );
            res.json({ message: 'Kata berhasil disimpan' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/auth/words
app.delete('/api/auth/words', authenticate, async (req, res) => {
    try {
        const { word } = req.body;
        await pool.execute('DELETE FROM words WHERE user_id = ? AND word = ?', [req.userId, word]);
        res.json({ status: 'Berhasil hapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 STB API Bridge running on http://localhost:${PORT}`);
    console.log(`👉 Direction: Cloudflare Tunnel -> localhost:${PORT}`);
});
