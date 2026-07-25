'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
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
  X,
  Calendar as CalendarIcon,
  User as UserIcon,
  Briefcase,
  Eye,
  GripVertical
} from 'lucide-react';
import { Project, Task, User } from '@/lib/initial-data';
import { TaskComments } from '@/components/task-comments';

export default function KanbanPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Drag and Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'todo' | 'in_progress' | 'done' | null>(null);

  // View Task Details Modal State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Delete Task Modal State
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Create Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
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

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData.projects || []);
        if (pData.projects?.length > 0 && !newTaskProjectId) {
          setNewTaskProjectId(pData.projects[0].id);
        }
      }
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (mRes.ok) {
        const mData = await mRes.json();
        setTeamMembers(mData.users || []);
        if (mData.users?.length > 0 && !newTaskAssigneeId) {
          setNewTaskAssigneeId(mData.users[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Kanban board');
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

      toast.success(`Task "${data.task.title}" added to Kanban board!`);
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

  // Move Task Handler (Used by Drag & Drop and Quick Shift buttons)
  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      // Optimistic Update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      if (viewingTask && viewingTask.id === taskId) {
        setViewingTask((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to move task');

      const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
      toast.success(`Task moved to ${statusLabels[newStatus]}`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error moving task';
      toast.error(msg);
      loadData(); // Revert on failure
    }
  };

  // Delete Task Handler
  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks?id=${deletingTask.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task');

      toast.success('Task removed from board');
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      if (viewingTask?.id === deletingTask.id) setViewingTask(null);
      setDeletingTask(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting task';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleMoveTask(taskId, targetStatus);
    }
    setDraggingTaskId(null);
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

  const columns = [
    {
      id: 'todo' as const,
      title: 'To Do',
      color: 'border-slate-300 text-slate-700 bg-slate-100',
      badge: 'bg-slate-200 text-slate-800',
      tasks: filteredTasks.filter((t) => t.status === 'todo'),
    },
    {
      id: 'in_progress' as const,
      title: 'In Progress',
      color: 'border-blue-300 text-blue-800 bg-blue-50/50',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      tasks: filteredTasks.filter((t) => t.status === 'in_progress'),
    },
    {
      id: 'done' as const,
      title: 'Done',
      color: 'border-emerald-300 text-emerald-800 bg-emerald-50/50',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      tasks: filteredTasks.filter((t) => t.status === 'done'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar
        currentUser={currentUser}
        onOpenTaskModal={() => setShowTaskModal(true)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
          
          {/* Header Banner */}
          <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <KanbanIcon className="w-6 h-6 text-blue-600" />
                <span>Kanban Drag-and-Drop Board</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Drag and drop task cards across sprint columns to update statuses instantly
              </p>
            </div>

            <button
              onClick={() => setShowTaskModal(true)}
              className="skeuo-button-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>

          {/* Filter Toolbar */}
          <div className="skeuo-card p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Kanban tasks..."
                className="skeuo-input block w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium placeholder-slate-400"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
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
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`skeuo-card p-5 rounded-3xl space-y-4 min-h-[600px] flex flex-col transition-all duration-200 ${
                  dragOverColumn === col.id
                    ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/40 border-blue-400 scale-[1.01]'
                    : ''
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${
                      col.id === 'todo' ? 'bg-slate-400' : col.id === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{col.title}</h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${col.badge}`}>
                    {col.tasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {col.tasks.length === 0 ? (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                      Drag tasks here to update stage to {col.title}
                    </div>
                  ) : (
                    col.tasks.map((task) => {
                      const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                      const project = projects.find((p) => p.id === task.projectId);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`skeuo-card p-5 rounded-2xl space-y-3 cursor-grab active:cursor-grabbing transition-all hover:border-blue-400 hover:shadow-md ${
                            draggingTaskId === task.id ? 'opacity-40 ring-2 ring-blue-400' : ''
                          }`}
                        >
                          {/* Card Header & Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <GripVertical className="w-4 h-4 text-slate-300 shrink-0 cursor-grab" />
                              <h4
                                onClick={() => setViewingTask(task)}
                                className="font-bold text-slate-900 text-sm leading-snug hover:text-blue-600 cursor-pointer transition-colors line-clamp-2"
                              >
                                {task.title}
                              </h4>
                            </div>

                            <button
                              onClick={() => setDeletingTask(task)}
                              title="Delete Task"
                              className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed pl-5">
                              {task.description}
                            </p>
                          )}

                          {/* Project, Priority & Assignee Info */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {project && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[120px]">
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

                          {/* Card Actions: View Details & Drag Indicator */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setViewingTask(task)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>

                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Drag card to move
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: View Task Details Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-xl w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingTask(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Title & Status */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="skeuo-badge p-3.5 rounded-2xl shrink-0">
                <KanbanIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {viewingTask.title}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-blue-100 text-blue-800 border-blue-200">
                    Stage: {viewingTask.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      viewingTask.priority === 'high'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : viewingTask.priority === 'medium'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Priority: {viewingTask.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="skeuo-panel p-4 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Description</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {viewingTask.description || 'No detailed description set for this task.'}
              </p>
            </div>

            {/* Project, Assignee & Due Date Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="skeuo-panel p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {projects.find((p) => p.id === viewingTask.projectId)?.name || 'Workspace Project'}
                </div>
              </div>

              <div className="skeuo-panel p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignee</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {teamMembers.find((m) => m.id === viewingTask.assigneeId)?.name || 'Unassigned'}
                </div>
              </div>

              <div className="skeuo-panel p-3 rounded-xl space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{viewingTask.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString() : 'No date set'}</span>
                </div>
              </div>
            </div>

            {/* Task Comments Section */}
            <TaskComments
              taskId={viewingTask.id}
              currentUser={currentUser}
              teamMembers={teamMembers}
            />

            {/* Move Task Stage Selection */}
            <div className="skeuo-panel p-4 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-slate-900">Change Task Stage:</div>
              <div className="grid grid-cols-3 gap-2">
                {(['todo', 'in_progress', 'done'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleMoveTask(viewingTask.id, st)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                      viewingTask.status === st
                        ? 'skeuo-button-primary text-white shadow-md'
                        : 'skeuo-button-secondary text-slate-700'
                    }`}
                  >
                    {st === 'in_progress' ? 'In Progress' : st === 'todo' ? 'To Do' : 'Done'}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingTask(viewingTask)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="skeuo-button-secondary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create Task Modal */}
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
                <KanbanIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
                <p className="text-xs text-slate-500 font-medium">Add task to Kanban board</p>
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
                  placeholder="e.g. Implement Drag & Drop Kanban"
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
                  placeholder="Details and scope..."
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
                <p className="text-xs text-slate-500 font-medium">Permanent removal from board</p>
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
