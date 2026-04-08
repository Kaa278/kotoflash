import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'terlalurahasia-jangan-disebar';

async function authenticate(request: Request) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return null;

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Verify user actually exists in DB
        const [rows]: any = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return null;

        return userId;
    } catch (err) {
        return null;
    }
}

export async function GET(request: Request) {
    const userId = await authenticate(request);
    if (!userId) return NextResponse.json({ error: 'Bukan akses berizin' }, { status: 401 });

    try {
        const [rows]: any = await pool.execute(
            'SELECT id, username, name, bio, avatar FROM users WHERE id = ?',
            [userId]
        );
        if (rows.length === 0) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const userId = await authenticate(request);
    if (!userId) return NextResponse.json({ error: 'Bukan akses berizin' }, { status: 401 });

    try {
        const { name, bio, avatar } = await request.json();
        await pool.execute(
            'UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?',
            [name, bio, avatar, userId]
        );
        return NextResponse.json({ status: 'Berhasil update' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
