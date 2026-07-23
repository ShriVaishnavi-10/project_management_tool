export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'archived';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'PROJECT_CREATED' | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'COMMENT_ADDED';
  details: string;
  projectId: string | null;
  taskId: string | null;
  userId: string;
  createdAt: string;
}

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Alex Rivera (Admin)',
    email: 'admin@example.com',
    passwordHash: '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', // password123
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    createdAt: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'usr-jane-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    passwordHash: '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', // password123
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    createdAt: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'usr-david-3',
    name: 'David Chen',
    email: 'david@example.com',
    passwordHash: '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', // password123
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    createdAt: new Date('2026-01-15').toISOString(),
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'AI Analytics Platform',
    description: 'Next-generation intelligence dashboard with real-time predictive chart widgets and data export.',
    status: 'active',
    ownerId: 'usr-admin-1',
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App Redesign',
    description: 'Complete UI/UX overhaul of iOS and Android native apps focused on biometric auth & instant transfers.',
    status: 'active',
    ownerId: 'usr-jane-2',
    createdAt: new Date('2026-02-05').toISOString(),
    updatedAt: new Date('2026-02-18').toISOString(),
  },
  {
    id: 'proj-3',
    name: 'E-commerce Microservices Migration',
    description: 'Decomposing legacy monolithic backend into scalable cloud microservices and Supabase database architecture.',
    status: 'on_hold',
    ownerId: 'usr-admin-1',
    createdAt: new Date('2026-01-20').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Setup Supabase Database Schema & RLS Policies',
    description: 'Configure tables for projects, tasks, comments, and activity logs. Enable security rules.',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2026-02-25').toISOString(),
    projectId: 'proj-1',
    assigneeId: 'usr-admin-1',
    creatorId: 'usr-admin-1',
    createdAt: new Date('2026-02-02').toISOString(),
    updatedAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'task-102',
    title: 'Implement Interactive Drag-and-Drop Kanban Board',
    description: 'Build responsive columns for To Do, In Progress, and Done using hello-pangea/dnd with smooth animations.',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2026-02-28').toISOString(),
    projectId: 'proj-1',
    assigneeId: 'usr-jane-2',
    creatorId: 'usr-admin-1',
    createdAt: new Date('2026-02-03').toISOString(),
    updatedAt: new Date('2026-02-20').toISOString(),
  },
  {
    id: 'task-103',
    title: 'Design Dark Mode Design System',
    description: 'Configure tailwind colors, glassmorphism card styles, and theme switcher with next-themes.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date('2026-03-02').toISOString(),
    projectId: 'proj-2',
    assigneeId: 'usr-david-3',
    creatorId: 'usr-jane-2',
    createdAt: new Date('2026-02-06').toISOString(),
    updatedAt: new Date('2026-02-21').toISOString(),
  },
  {
    id: 'task-104',
    title: 'CSV Export Functionality for Tasks',
    description: 'Allow users to export filtered tasks into CSV files with custom field headers.',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2026-03-05').toISOString(),
    projectId: 'proj-1',
    assigneeId: 'usr-admin-1',
    creatorId: 'usr-admin-1',
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date('2026-02-10').toISOString(),
  },
  {
    id: 'task-105',
    title: 'API Authentication & Protected Middleware',
    description: 'Secure all app router endpoints and redirect unauthenticated requests to login.',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2026-02-20').toISOString(),
    projectId: 'proj-2',
    assigneeId: 'usr-jane-2',
    creatorId: 'usr-jane-2',
    createdAt: new Date('2026-02-07').toISOString(),
    updatedAt: new Date('2026-02-19').toISOString(),
  },
  {
    id: 'task-106',
    title: 'Calendar Schedule View Component',
    description: 'Plot tasks on an interactive calendar grid based on their scheduled due dates.',
    status: 'todo',
    priority: 'low',
    dueDate: new Date('2026-03-10').toISOString(),
    projectId: 'proj-3',
    assigneeId: 'usr-david-3',
    creatorId: 'usr-admin-1',
    createdAt: new Date('2026-02-12').toISOString(),
    updatedAt: new Date('2026-02-12').toISOString(),
  },
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    content: 'Great progress on the Supabase schema script! Everything looks super structured.',
    taskId: 'task-101',
    authorId: 'usr-jane-2',
    createdAt: new Date('2026-02-16T10:30:00Z').toISOString(),
  },
  {
    id: 'comm-2',
    content: 'Working on the drag-and-drop animation now. Will update task status when finished.',
    taskId: 'task-102',
    authorId: 'usr-jane-2',
    createdAt: new Date('2026-02-20T14:15:00Z').toISOString(),
  },
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    action: 'PROJECT_CREATED',
    details: 'Created project "AI Analytics Platform"',
    projectId: 'proj-1',
    taskId: null,
    userId: 'usr-admin-1',
    createdAt: new Date('2026-02-01T09:00:00Z').toISOString(),
  },
  {
    id: 'act-2',
    action: 'TASK_CREATED',
    details: 'Created task "Setup Supabase Database Schema & RLS Policies"',
    projectId: 'proj-1',
    taskId: 'task-101',
    userId: 'usr-admin-1',
    createdAt: new Date('2026-02-02T11:00:00Z').toISOString(),
  },
  {
    id: 'act-3',
    action: 'TASK_UPDATED',
    details: 'Updated status of "Setup Supabase Database Schema & RLS Policies" to Done',
    projectId: 'proj-1',
    taskId: 'task-101',
    userId: 'usr-admin-1',
    createdAt: new Date('2026-02-15T16:45:00Z').toISOString(),
  },
  {
    id: 'act-4',
    action: 'COMMENT_ADDED',
    details: 'Added comment on task "Setup Supabase Database Schema & RLS Policies"',
    projectId: 'proj-1',
    taskId: 'task-101',
    userId: 'usr-jane-2',
    createdAt: new Date('2026-02-16T10:30:00Z').toISOString(),
  },
];
