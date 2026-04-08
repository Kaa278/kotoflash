import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
    const host = process.env.DB_HOST;
    console.log(`🔍 Mengetes koneksi ke: ${host}...`);

    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        connectTimeout: 10000 // 10 seconds
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ BERHASIL! Database terhubung dengan sukses.');

        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('📊 Test Query (1+1):', (rows as any)[0].result);

        await connection.end();
        console.log('🚀 Siap untuk dideploy ke Vercel!');
    } catch (error: any) {
        console.error('❌ GAGAL TERHUBUNG!');
        console.error('Pesan Error:', error.message);
        console.error('Kode Error:', error.code);
        console.error('Detail Error:', error);
        console.log('\nTips perbaikan:');
        console.log('1. Pastikan Cloudflare Tunnel di STB sudah ACTIVE.');
        console.log('2. Pastikan port 3306 di STB tidak diblokir firewall (ufw).');
        console.log('3. Cek apakah DB_HOST di .env.local sudah benar.');
    }
}

testConnection();
