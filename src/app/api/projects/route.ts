import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const projects = await db.getProjects();
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, status = 'active' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await db.createProject({
      name,
      description: description || '',
      status,
      ownerId: user.id,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const existing = await db.getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC Check: Admins or Project Owner can edit
    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators or project owner can edit this project' },
        { status: 403 }
      );
    }

    const updated = await db.updateProject(id, { name, description, status });
    return NextResponse.json({ success: true, project: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const existing = await db.getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // RBAC Check: Admins or Project Owner can delete
    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators or project owner can delete this project' },
        { status: 403 }
      );
    }

    const success = await db.deleteProject(id, user.id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
