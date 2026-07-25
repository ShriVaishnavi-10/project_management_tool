import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security Check: Only an existing Admin can modify user roles
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only existing administrators can promote or modify user roles' },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();
    if (!userId || !role || !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'User ID and valid role (admin or member) are required' },
        { status: 400 }
      );
    }

    const updatedUser = await db.updateUserRole(userId, role);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { passwordHash: _, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user role';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
