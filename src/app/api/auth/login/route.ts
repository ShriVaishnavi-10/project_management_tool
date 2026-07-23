import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, createSession } from '@/lib/auth';
import { INITIAL_USERS } from '@/lib/initial-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let user = await db.getUserByEmail(email);

    // Auto-create demo user in Supabase if logging in with test credentials for the first time
    if (!user) {
      const demoMatch = INITIAL_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (demoMatch && password === 'password123') {
        user = await db.createUser({
          name: demoMatch.name,
          email: demoMatch.email,
          passwordHash: demoMatch.passwordHash,
          avatar: demoMatch.avatar,
          role: demoMatch.role,
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
