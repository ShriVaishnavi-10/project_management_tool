'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { toast } from 'sonner';
import {
  Kanban as KanbanIcon,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Project, Task, User } from '@/lib/initial-data';

export default function KanbanPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [uRes, pRes, tRes, mRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/users'),
      ]);

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (pRes.ok) {
        const pData = (await pRes.json()).projects || [];
        setProjects(pData);
        if (pData.length > 0 && !newTaskProjectId) setNewTaskProjectId(pData[0].id);
      }
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (mRes.ok) {
        const mData = (await mRes.json()).users || [];
        setTeamMembers(mData);
        if (mData.length > 0 && !newTaskAssigneeId) setNewTaskAssigneeId(mData[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Kanban data');
    }
  }, [newTaskProjectId, newTaskAssigneeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status Shift Task Action
  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to move task');
    }
  };

  // Delete Task Action
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task');
    }
  };

  // Create Task Action
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskProjectId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          priority: newTaskPriority,
          projectId: newTaskProjectId,
          assigneeId: newTaskAssigneeId,
          status: 'todo',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      toast.success(`Task "${data.task.title}" created!`);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskModal(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const renderTaskCard = (task: Task) => {
    const assignee = teamMembers.find((m) => m.id === task.assigneeId);
    const project = projects.find((p) => p.id === task.projectId);

    return (
      <div key={task.id} className="skeuo-card p-5 rounded-2xl space-y-3 transition-all hover:border-slate-400">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h4>
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {task.description && (
          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {project && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {project.name}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                task.priority === 'high'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : task.priority === 'medium'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {task.priority}
            </span>
          </div>

          {assignee && (
            <div
              title={`Assigned to ${assignee.name}`}
              className="w-6 h-6 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-700 shrink-0"
            >
              {assignee.avatar ? (
                // eslint-disable-next-next/no-img-element
                <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
              ) : (
                assignee.name.charAt(0)
              )}
            </div>
          )}
        </div>

        {/* Quick Shift Movement Buttons */}
        <div className="flex items-center justify-between pt-2">
          {task.status !== 'todo' ? (
            <button
              onClick={() => handleMoveTask(task.id, task.status === 'done' ? 'in_progress' : 'todo')}
              className="skeuo-button-secondary px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Move Back</span>
            </button>
          ) : <div />}

          {task.status !== 'done' && (
            <button
              onClick={() => handleMoveTask(task.id, task.status === 'todo' ? 'in_progress' : 'done')}
              className="skeuo-button-primary px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Move Next</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Navbar
        userName={currentUser?.name}
        userAvatar={currentUser?.avatar}
        onOpenTaskModal={() => setShowTaskModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
        {/* Header & Filter Controls */}
        <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <KanbanIcon className="w-6 h-6 text-blue-600" />
              <span>Kanban Sprint Board</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage task stages, priority levels, and team velocity across sprint columns
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="skeuo-input px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="skeuo-input px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <button
              onClick={() => setShowTaskModal(true)}
              className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* 3 Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: To Do */}
          <div className="skeuo-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">To Do</h3>
              </div>
              <span className="skeuo-badge px-2.5 py-0.5 rounded-md text-xs font-bold text-slate-700">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-4">
              {todoTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">No pending tasks</div>
              ) : (
                todoTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="skeuo-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">In Progress</h3>
              </div>
              <span className="skeuo-badge px-2.5 py-0.5 rounded-md text-xs font-bold text-blue-700">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-4">
              {inProgressTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">No tasks in progress</div>
              ) : (
                inProgressTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="skeuo-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Completed</h3>
              </div>
              <span className="skeuo-badge px-2.5 py-0.5 rounded-md text-xs font-bold text-emerald-700">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-4">
              {doneTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">No completed tasks</div>
              ) : (
                doneTasks.map(renderTaskCard)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="skeuo-badge p-3 rounded-2xl">
                <KanbanIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Task for Kanban Board</h3>
                <p className="text-xs text-slate-500 font-medium">Add task directly into your board</p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth Auth Middleware"
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Task scope & instructions..."
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Target Project
                  </label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Assignee
                </label>
                <select
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
