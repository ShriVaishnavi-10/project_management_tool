import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.getUsers();
    // Return users without sensitive password hash
    const safeUsers = users.map(({ passwordHash, ...u }) => u);
    return NextResponse.json({ users: safeUsers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
