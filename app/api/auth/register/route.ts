import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { username, password, name } = await request.json();

        // Check if user exists
        const [rows]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            return NextResponse.json({ error: 'Username sudah ada' }, { status: 409 });
        }

        // Generate random 6-digit ID
        let userId = Math.floor(100000 + Math.random() * 900000);
        let idExists = true;

        // Ensure ID is unique (basic retry logic)
        while (idExists) {
            const [idRows]: any = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (idRows.length === 0) {
                idExists = false;
            } else {
                userId = Math.floor(100000 + Math.random() * 900000);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with random ID
        await pool.execute(
            'INSERT INTO users (id, username, password_hash, name) VALUES (?, ?, ?, ?)',
            [userId, username, hashedPassword, name]
        );

        return NextResponse.json({ message: 'Daftar berhasil' }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: `Gagal registrasi: ${error.message}` }, { status: 500 });
    }
}
