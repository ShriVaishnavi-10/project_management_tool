import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let tasks = await db.getTasks();
    if (projectId) {
      tasks = tasks.filter((t) => t.projectId === projectId);
    }

    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
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
    const { title, description = '', status = 'todo', priority = 'medium', dueDate, projectId, assigneeId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and Project ID are required' }, { status: 400 });
    }

    const task = await db.createTask({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      projectId,
      assigneeId: assigneeId || user.id,
      creatorId: user.id,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create task';
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existingTask = await db.getTaskById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Role-Based Task Scoping Rule:
    // Members can update tasks allocated to them, created by them, or unassigned tasks. Admins can update all.
    const isOwner = user.role === 'admin';
    const isAssignee = existingTask.assigneeId === user.id;
    const isCreator = existingTask.creatorId === user.id;
    const isUnassigned = !existingTask.assigneeId;

    if (!isOwner && !isAssignee && !isCreator && !isUnassigned) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update tasks allocated to you or unassigned tasks.' },
        { status: 403 }
      );
    }

    const updatedTask = await db.updateTask(id, updates, user.id);
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update task';
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
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existingTask = await db.getTaskById(id);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Members cannot delete other members' tasks
    const isOwner = user.role === 'admin';
    const isAssignee = existingTask.assigneeId === user.id;
    const isCreator = existingTask.creatorId === user.id;

    if (!isOwner && !isAssignee && !isCreator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete tasks allocated to you.' },
        { status: 403 }
      );
    }

    const success = await db.deleteTask(id, user.id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
