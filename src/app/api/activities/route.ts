import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activities = await db.getActivities();
    return NextResponse.json({ activities });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch activities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
