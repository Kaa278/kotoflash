import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'supersecret',
    database: process.env.DB_NAME || 'kotoflash',
    port: parseInt(process.env.DB_PORT || '3306'),
};

export const pool = mysql.createPool(dbConfig);
