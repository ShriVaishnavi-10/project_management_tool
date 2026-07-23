-- ================================================
-- PROJECT MANAGEMENT TOOL - SUPABASE SEED DATA
-- Run this in your Supabase Project SQL Editor
-- ================================================

-- 1. SEED USERS
INSERT INTO public.users (id, name, email, password_hash, avatar, role)
VALUES 
  ('usr-admin-1', 'Alex Rivera (Admin)', 'admin@example.com', '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'admin'),
  ('usr-jane-2', 'Jane Smith', 'jane@example.com', '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'member'),
  ('usr-david-3', 'David Chen', 'david@example.com', '$2a$10$wN8Z1W/z9sY.nJk1d8T5u.7V1u2V3w4X5y6Z7a8b9c0d1e2f3g4h5', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'member')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PROJECTS
INSERT INTO public.projects (id, name, description, status, owner_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'AI Analytics Platform', 'Next-generation intelligence dashboard with real-time predictive chart widgets and data export.', 'active', 'usr-admin-1'),
  ('22222222-2222-2222-2222-222222222222', 'Mobile Banking App Redesign', 'Complete UI/UX overhaul of iOS and Android native apps focused on biometric auth & instant transfers.', 'active', 'usr-jane-2'),
  ('33333333-3333-3333-3333-333333333333', 'E-commerce Microservices Migration', 'Decomposing legacy monolithic backend into scalable cloud microservices and Supabase database architecture.', 'on_hold', 'usr-admin-1')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED TASKS
INSERT INTO public.tasks (id, title, description, status, priority, due_date, project_id, assignee_id, creator_id)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Setup Supabase Database Schema & RLS Policies', 'Configure tables for projects, tasks, comments, and activity logs. Enable security rules.', 'done', 'high', NOW() + INTERVAL '5 days', '11111111-1111-1111-1111-111111111111', 'usr-admin-1', 'usr-admin-1'),
  ('a2222222-2222-2222-2222-222222222222', 'Implement Interactive Drag-and-Drop Kanban Board', 'Build responsive columns for To Do, In Progress, and Done using light skeuomorphic cards.', 'in_progress', 'high', NOW() + INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', 'usr-jane-2', 'usr-admin-1'),
  ('a3333333-3333-3333-3333-333333333333', 'Design Light Skeuomorphic System', 'Configure tailwind colors, tactile cards, and glossy buttons with Next.js.', 'in_progress', 'medium', NOW() + INTERVAL '10 days', '22222222-2222-2222-2222-222222222222', 'usr-david-3', 'usr-jane-2'),
  ('a4444444-4444-4444-4444-444444444444', 'CSV Export Functionality for Tasks', 'Allow users to export filtered tasks into CSV files with custom field headers.', 'todo', 'medium', NOW() + INTERVAL '12 days', '11111111-1111-1111-1111-111111111111', 'usr-admin-1', 'usr-admin-1')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED ACTIVITY LOGS
INSERT INTO public.activity_logs (id, action, details, project_id, task_id, user_id)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'PROJECT_CREATED', 'Created project "AI Analytics Platform"', '11111111-1111-1111-1111-111111111111', NULL, 'usr-admin-1'),
  ('b2222222-2222-2222-2222-222222222222', 'TASK_CREATED', 'Created task "Setup Supabase Database Schema & RLS Policies"', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'usr-admin-1'),
  ('b3333333-3333-3333-3333-333333333333', 'TASK_UPDATED', 'Updated status of "Setup Supabase Database Schema & RLS Policies" to Done', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'usr-admin-1')
ON CONFLICT (id) DO NOTHING;
