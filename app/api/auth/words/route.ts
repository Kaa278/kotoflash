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

        // Verify user actually exists in DB (to prevent FK errors if DB was cleared)
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
            'SELECT word, meaning, example FROM words WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await authenticate(request);
    if (!userId) return NextResponse.json({ error: 'Bukan akses berizin' }, { status: 401 });

    try {
        const { words } = await request.json(); // Expecting an array of words for bulk sync or a single word

        if (Array.isArray(words)) {
            // Bulk upsert
            for (const w of words) {
                await pool.execute(
                    'INSERT INTO words (user_id, word, meaning, example) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), example = VALUES(example)',
                    [userId, w.word, w.meaning, w.example || null]
                );
            }
            return NextResponse.json({ message: `${words.length} kata berhasil disinkronkan` });
        } else {
            // Single word insert
            const { word, meaning, example } = words;
            await pool.execute(
                'INSERT INTO words (user_id, word, meaning, example) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), example = VALUES(example)',
                [userId, word, meaning, example || null]
            );
            return NextResponse.json({ message: 'Kata berhasil disimpan' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const userId = await authenticate(request);
    if (!userId) return NextResponse.json({ error: 'Bukan akses berizin' }, { status: 401 });

    try {
        const { word } = await request.json();
        await pool.execute('DELETE FROM words WHERE user_id = ? AND word = ?', [userId, word]);
        return NextResponse.json({ status: 'Berhasil hapus' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
