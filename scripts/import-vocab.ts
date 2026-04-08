import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MariaDB...');

    try {
        const dataPath = path.join(process.cwd(), 'data', 'vocab.json');
        if (!fs.existsSync(dataPath)) {
            console.error('File vocab.json tidak ditemukan di folder data/');
            return;
        }

        const vocab = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        console.log(`Mengimport ${vocab.length} kata ke master_vocab...`);

        // Check if table exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS master_vocab (
                id INT AUTO_INCREMENT PRIMARY KEY,
                word VARCHAR(255) NOT NULL,
                meaning TEXT NOT NULL,
                UNIQUE KEY (word)
            )
        `);

        let count = 0;
        for (const item of vocab) {
            try {
                await connection.execute(
                    'INSERT IGNORE INTO master_vocab (word, meaning) VALUES (?, ?)',
                    [item.word, item.meaning]
                );
                count++;
            } catch (err) {
                console.error(`Gagal import: ${item.word}`, err);
            }
        }

        console.log(`Berhasil! ${count} kata telah diproses.`);
    } catch (error) {
        console.error('Terjadi kesalahan saat migrasi:', error);
    } finally {
        await connection.end();
    }
}

migrate();
