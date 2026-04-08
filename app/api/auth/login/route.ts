import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'terlalurahasia-jangan-disebar';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Find user
        const [rows]: any = await pool.execute('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 401 });
        }

        const user = rows[0];

        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Password salah' }, { status: 401 });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: `Error Login: ${error.message}` }, { status: 500 });
    }
}
