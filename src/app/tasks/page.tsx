'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Kanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  Lock,
  X,
  Filter,
  User as UserIcon,
  Briefcase,
  Calendar as CalendarIcon,
  ChevronDown,
  Download
} from 'lucide-react';
import { Project, Task, User } from '@/lib/initial-data';
import { Sidebar } from '@/components/sidebar';
import { TaskComments } from '@/components/task-comments';

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Task Creation Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Delete Task Confirmation Modal State
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const loadData = useCallback(async () => {
    try {
      const [uRes, pRes, tRes, mRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/users'),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setCurrentUser(uData.user);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
        if (pData.projects?.length > 0 && !newTaskProjectId) {
          setNewTaskProjectId(pData.projects[0].id);
        }
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTasks(tData.tasks || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setTeamMembers(mData.users || []);
        if (mData.users?.length > 0 && !newTaskAssigneeId) {
          setNewTaskAssigneeId(mData.users[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks workspace');
    }
  }, [newTaskProjectId, newTaskAssigneeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Task Handler
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
          dueDate: newTaskDueDate,
          projectId: newTaskProjectId,
          assigneeId: newTaskAssigneeId,
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

  // Open Edit Task Modal
  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditProjectId(task.projectId);
    setEditAssigneeId(task.assigneeId || '');
  };

  // Edit Task Handler
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTitle,
          description: editDesc,
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate,
          projectId: editProjectId,
          assigneeId: editAssigneeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      toast.success(`Task "${editTitle}" updated!`);
      setEditingTask(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Status Change Handler
  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task status');

      toast.success('Task status updated');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    }
  };

  // Inline Due Date Change Handler
  const handleDueDateChange = async (taskId: string, newDueDate: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, dueDate: newDueDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update due date');

      toast.success('Task due date updated');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueDate } : t)));
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update due date';
      toast.error(msg);
    }
  };

  // Confirm Delete Task
  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks?id=${deletingTask.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');

      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Export Tasks to CSV
  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error('No tasks to export');
      return;
    }

    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Project', 'Assignee', 'Created At'];
    const rows = filteredTasks.map((t) => {
      const proj = projects.find((p) => p.id === t.projectId)?.name || '';
      const assignee = teamMembers.find((m) => m.id === t.assigneeId)?.name || 'Unassigned';
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.dueDate ? t.dueDate.split('T')[0] : '',
        `"${proj.replace(/"/g, '""')}"`,
        `"${assignee.replace(/"/g, '""')}"`,
        t.createdAt ? t.createdAt.split('T')[0] : '',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TaskPulse_Tasks_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Tasks exported to CSV successfully!');
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;
    const matchesAssignee = assigneeFilter === 'all' || t.assigneeId === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee;
  });

  const canModifyTask = (task: Task) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    if (!task.assigneeId) return true;
    return task.assigneeId === currentUser.id || task.creatorId === currentUser.id;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar
        currentUser={currentUser}
        onOpenTaskModal={() => setShowTaskModal(true)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
          {/* Header Banner */}
          <div className="skeuo-card p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full skeuo-badge text-[11px] font-bold text-blue-700">
                <Kanban className="w-3.5 h-3.5 text-blue-600" />
                <span>Sprint Tasks Subpage</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Task Management Workspace
              </h1>
              <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
                Create, assign, schedule, edit, and track status & priority levels for workspace tasks
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleExportCSV}
                title="Export tasks to CSV file"
                className="skeuo-button-secondary px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Export Tasks (CSV)</span>
              </button>

              <button
                onClick={() => setShowTaskModal(true)}
                className="skeuo-button-primary px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="skeuo-card p-6 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks by title or content..."
                  className="skeuo-input block w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium placeholder-slate-400"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
                {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'skeuo-button-secondary text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'in_progress' ? 'In Progress' : st === 'todo' ? 'To Do' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Priority Level
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="skeuo-input block w-full px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="skeuo-input block w-full px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assignee
                </label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="skeuo-input block w-full px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="all">All Assignees</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="skeuo-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>Sprint Task List ({filteredTasks.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="skeuo-panel p-12 text-center rounded-2xl text-slate-500 text-xs font-medium">
                  No tasks match your criteria. Click "+ Create Task" to add a task.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                  const project = projects.find((p) => p.id === task.projectId);
                  const canModify = canModifyTask(task);

                  return (
                    <div
                      key={task.id}
                      className={`skeuo-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        task.status === 'done' ? 'bg-emerald-50/40 border-emerald-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <button
                          disabled={!canModify}
                          onClick={() =>
                            canModify &&
                            handleStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')
                          }
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            !canModify ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          } ${
                            task.status === 'done'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'skeuo-panel hover:border-blue-400 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => canModify && openEditTaskModal(task)}
                              className={`font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors ${
                                canModify ? 'cursor-pointer' : ''
                              } ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}
                            >
                              {task.title}
                            </span>

                            {project && (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                {project.name}
                              </span>
                            )}

                            {/* Interactive Due Date Selector Badge */}
                            <div className="flex items-center gap-1 bg-slate-200/70 px-2.5 py-0.5 rounded-md border border-slate-300 text-xs shrink-0">
                              <CalendarIcon className="w-3 h-3 text-blue-600 shrink-0" />
                              <span className="text-[10px] text-slate-500 font-extrabold uppercase mr-0.5">Due:</span>
                              <input
                                type="date"
                                disabled={!canModify}
                                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                onChange={(e) => canModify && handleDueDateChange(task.id, e.target.value)}
                                className={`bg-transparent text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded ${
                                  !canModify ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                }`}
                              />
                            </div>

                            {task.status === 'done' && assignee && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Completed by {assignee.name}
                              </span>
                            )}

                            {!canModify && task.status !== 'done' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 shrink-0 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Allocated to {assignee?.name?.split(' ')[0] || 'Team'}
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-500 font-medium line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : task.priority === 'medium'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <select
                          disabled={!canModify}
                          value={task.status}
                          onChange={(e) =>
                            canModify &&
                            handleStatusChange(task.id, e.target.value as any)
                          }
                          className={`skeuo-input px-2.5 py-1 rounded-lg text-xs font-bold ${
                            !canModify ? 'cursor-not-allowed opacity-60 bg-slate-200' : 'cursor-pointer'
                          }`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>

                        {assignee && (
                          <div
                            title={`Assigned to ${assignee.name}`}
                            className="w-7 h-7 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-700 shrink-0"
                          >
                            {assignee.avatar ? (
                              // eslint-disable-next-next/no-img-element
                              <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
                            ) : (
                              assignee.name.charAt(0)
                            )}
                          </div>
                        )}

                        {canModify && (
                          <>
                            <button
                              onClick={() => openEditTaskModal(task)}
                              title="Edit Task"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingTask(task)}
                              title="Delete Task"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal 1: Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="skeuo-badge p-3 rounded-2xl">
                <Kanban className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
                <p className="text-xs text-slate-500 font-medium">Add task to workspace backlog</p>
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
                  placeholder="e.g. Implement OAuth Middleware"
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
                  placeholder="Task details & acceptance criteria..."
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
                    Priority Level
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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

      {/* Modal 2: Edit Task */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="skeuo-badge p-3 rounded-2xl">
                <Edit3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Task</h3>
                <p className="text-xs text-slate-500 font-medium">Update parameters, assignee & status</p>
              </div>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Task Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="skeuo-input block w-full px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Project
                </label>
                <select
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Task Comments Discussion */}
              <TaskComments
                taskId={editingTask.id}
                currentUser={currentUser}
                teamMembers={teamMembers}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Custom Delete Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-md w-full p-6 sm:p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setDeletingTask(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="skeuo-badge p-3.5 rounded-2xl shrink-0 bg-red-50 text-red-600 border-red-200">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Task</h3>
                <p className="text-xs text-slate-500 font-medium font-medium">Permanent backlog removal</p>
              </div>
            </div>

            <div className="skeuo-panel p-4 rounded-2xl bg-red-50/40 border border-red-200 space-y-1.5">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Are you sure you want to delete task <span className="font-bold text-slate-900">"{deletingTask.title}"</span>?
              </p>
              <p className="text-[11px] text-red-600 font-semibold">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={confirmDeleteTask}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md border border-red-600 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submitting ? 'Deleting...' : 'Delete Task'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
