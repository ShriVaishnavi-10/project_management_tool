'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  LayoutGrid,
  Search,
  Plus,
  LogOut,
  FolderPlus,
  Kanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Activity,
  Sparkles,
  Trash2,
  X,
  Check,
  Briefcase,
  Eye,
  Calendar,
  User as UserIcon,
  Lock
} from 'lucide-react';
import { Project, Task, ActivityLog, User } from '@/lib/initial-data';

export default function DashboardPage() {
  const router = useRouter();

  // Core Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filters & Interactivity
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  // Form States
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'active' | 'on_hold' | 'completed'>('active');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [userRes, projRes, taskRes, actRes, membersRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/activities'),
        fetch('/api/users'),
      ]);

      if (userRes.ok) {
        const uData = await userRes.json();
        setCurrentUser(uData.user);
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (pData.projects?.length > 0 && !newTaskProjectId) {
          setNewTaskProjectId(pData.projects[0].id);
        }
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData.tasks || []);
      }

      if (actRes.ok) {
        const aData = await actRes.json();
        setActivities(aData.activities || []);
      }

      if (membersRes.ok) {
        const mData = await membersRes.json();
        setTeamMembers(mData.users || []);
        if (mData.users?.length > 0 && !newTaskAssigneeId) {
          setNewTaskAssigneeId(mData.users[0].id);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    }
  }, [newTaskProjectId, newTaskAssigneeId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          status: newProjectStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      toast.success(`Project "${data.project.name}" created!`);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowProjectModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating project';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Create Task
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      toast.success(`Task "${data.task.title}" created!`);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Update Task Status
  const handleTaskStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      toast.success('Task status updated');
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task status');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');

      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task');
    }
  };

  // Open Task Modal pre-selected with specific project
  const handleAddTaskForProject = (projId: string) => {
    setNewTaskProjectId(projId);
    setShowTaskModal(true);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesProject = selectedProjectId === 'all' || t.projectId === selectedProjectId;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Metrics Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-100/90 backdrop-blur-md border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="skeuo-badge p-2.5 rounded-xl">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              TaskPulse
            </span>
          </Link>

          {/* Centered Inset Search Input */}
          <div className="flex-1 max-w-lg hidden md:block relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tasks, assignees..."
              className="skeuo-input block w-full pl-11 pr-4 py-2.5 rounded-xl text-xs font-medium placeholder-slate-400"
            />
          </div>

          {/* Action Buttons & User Menu */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowTaskModal(true)}
              className="skeuo-button-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>

            <button
              onClick={() => setShowProjectModal(true)}
              className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hidden sm:flex"
            >
              <FolderPlus className="w-4 h-4 text-slate-700" />
              <span>New Project</span>
            </button>

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-300">
              <div
                title={currentUser?.name || 'User Profile'}
                className="w-9 h-9 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-xs text-blue-700 border border-slate-300"
              >
                {currentUser?.avatar ? (
                  // eslint-disable-next-next/no-img-element
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name.charAt(0) : 'U'
                )}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="skeuo-button-secondary p-2 rounded-xl text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-10">
        
        {/* Welcome Header Banner */}
        <div className="skeuo-card p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full skeuo-badge text-[11px] font-bold text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Executive Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {currentUser?.name || 'Workspace Manager'}
            </h1>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Track project milestones, sprint velocity, and team collaboration in real time.
            </p>
          </div>

          {/* Sprint Rate Radial Widget */}
          <div className="skeuo-panel p-4 px-6 rounded-2xl flex items-center gap-4 shrink-0">
            <div>
              <div className="text-2xl font-black text-blue-600">{completionRate}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sprint Completion</div>
            </div>
            <div className="w-12 h-12 rounded-full skeuo-card flex items-center justify-center p-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 4 Spacious Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Projects */}
          <div className="skeuo-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Projects</span>
              <div className="skeuo-badge p-2 rounded-xl">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{projects.length}</div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{projects.filter(p => p.status === 'active').length} Active Initiatives</span>
            </div>
          </div>

          {/* Card 2: Sprint Tasks */}
          <div className="skeuo-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Tasks</span>
              <div className="skeuo-badge p-2 rounded-xl">
                <Kanban className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalTasks}</div>
            <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{inProgressTasks} Currently In Progress</span>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="skeuo-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Completed Tasks</span>
              <div className="skeuo-badge p-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-700">{completedTasks}</div>
            <div className="text-xs font-semibold text-slate-500">
              {totalTasks - completedTasks} items remaining
            </div>
          </div>

          {/* Card 4: High Priority */}
          <div className="skeuo-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">High Priority</span>
              <div className="skeuo-badge p-2 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-700">{highPriorityTasks}</div>
            <div className="text-xs font-semibold text-amber-600">
              Action Required
            </div>
          </div>
        </div>

        {/* Workspace Grid Split: Left (Projects & Tasks) | Right (Activity & Team) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Active Projects Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span>Projects Overview</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Click any project card to open full details and task overview
                  </p>
                </div>

                <button
                  onClick={() => setShowProjectModal(true)}
                  className="skeuo-button-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  + Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {projects.length === 0 ? (
                  <div className="col-span-2 skeuo-panel p-8 text-center rounded-2xl text-slate-500 text-xs font-medium">
                    No projects created yet. Click "+ Add Project" to create your first workspace initiative.
                  </div>
                ) : (
                  projects.map((proj) => {
                    const projTasks = tasks.filter((t) => t.projectId === proj.id);
                    const projDone = projTasks.filter((t) => t.status === 'done').length;
                    const projPct = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;
                    const isSelected = selectedProjectId === proj.id;

                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setViewingProject(proj);
                        }}
                        className={`skeuo-card p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] ${
                          isSelected ? 'ring-2 ring-blue-600 border-blue-500 shadow-md' : 'hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{proj.name}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                              proj.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-5 font-medium leading-relaxed">
                          {proj.description || 'No detailed description provided.'}
                        </p>

                        {/* Progress Bar & View Action */}
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">{projTasks.length} tasks</span>
                              <span className="text-blue-700">{projPct}% done</span>
                            </div>
                            <div className="w-full h-2 rounded-full skeuo-panel overflow-hidden p-0.5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                                style={{ width: `${projPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-blue-600">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details & Tasks</span>
                            </span>
                            <span>&rarr;</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sprint Tasks Section */}
            <div className="skeuo-card p-8 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Kanban className="w-5 h-5 text-blue-600" />
                    <span>Sprint Tasks</span>
                    {selectedProjectId !== 'all' && (
                      <button
                        onClick={() => setSelectedProjectId('all')}
                        className="skeuo-badge px-2.5 py-0.5 rounded-md text-xs font-bold text-blue-700 ml-2 hover:bg-blue-50"
                      >
                        Reset Filter
                      </button>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Clean Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                  {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        statusFilter === st
                          ? 'skeuo-button-secondary text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'in_progress' ? 'In Progress' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Items List */}
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium skeuo-panel rounded-2xl space-y-3">
                    <div>No tasks found for this selection.</div>
                    {selectedProjectId !== 'all' && (
                      <button
                        onClick={() => handleAddTaskForProject(selectedProjectId)}
                        className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        + Add Task to this Project
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                    const project = projects.find((p) => p.id === task.projectId);
                    const canModify =
                      !currentUser ||
                      currentUser.role === 'admin' ||
                      task.assigneeId === currentUser.id ||
                      task.creatorId === currentUser.id;

                    return (
                      <div
                        key={task.id}
                        className={`skeuo-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                          task.status === 'done'
                            ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                            : !canModify
                            ? 'opacity-80 bg-slate-100/80'
                            : 'hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Toggle Checkbox */}
                          <button
                            disabled={!canModify}
                            onClick={() =>
                              canModify &&
                              handleTaskStatusChange(
                                task.id,
                                task.status === 'done' ? 'todo' : 'done'
                              )
                            }
                            title={canModify ? 'Toggle Status' : `Allocated to ${assignee?.name || 'another team member'}`}
                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                              !canModify
                                ? 'cursor-not-allowed bg-slate-200 border-slate-300 text-slate-400'
                                : task.status === 'done'
                                ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm cursor-pointer'
                                : 'skeuo-button-secondary border-slate-400 cursor-pointer'
                            }`}
                          >
                            {!canModify ? (
                              <Lock className="w-3 h-3 text-slate-400" />
                            ) : (
                              task.status === 'done' && <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-bold text-sm text-slate-900 ${
                                  task.status === 'done' ? 'line-through text-slate-500' : ''
                                }`}
                              >
                                {task.title}
                              </span>
                              {project && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                  {project.name}
                                </span>
                              )}
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

                        {/* Status, Priority & Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
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
                              handleTaskStatusChange(
                                task.id,
                                e.target.value as 'todo' | 'in_progress' | 'done'
                              )
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
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              title="Delete Task"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Team Members Section */}
            <div className="skeuo-card p-6 rounded-3xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-600" />
                <span>Team Members</span>
              </h2>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="skeuo-panel p-3.5 rounded-2xl flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">
                      {member.avatar ? (
                        // eslint-disable-next-next/no-img-element
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{member.name}</div>
                      <div className="text-[10px] text-slate-500 truncate font-medium">{member.email}</div>
                    </div>
                    <span className="skeuo-badge px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 uppercase tracking-wider shrink-0">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="skeuo-card p-6 rounded-3xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-blue-600" />
                <span>Recent Activity Feed</span>
              </h2>
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activities.length === 0 ? (
                  <div className="text-xs text-slate-500 font-medium pl-6">No activity logged.</div>
                ) : (
                  activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="relative pl-7 space-y-1">
                      <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full skeuo-badge border border-blue-400 bg-blue-600" />
                      <div className="text-xs font-bold text-slate-800 leading-snug">{act.details}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal 1: Project Details Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-2xl w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setViewingProject(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="skeuo-badge p-3.5 rounded-2xl shrink-0">
                <Briefcase className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">{viewingProject.name}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      viewingProject.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {viewingProject.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {viewingProject.description || 'No description provided for this project.'}
                </p>
              </div>
            </div>

            {/* Task Breakdown inside Project */}
            {(() => {
              const projTasks = tasks.filter((t) => t.projectId === viewingProject.id);
              const doneTasks = projTasks.filter((t) => t.status === 'done').length;
              const pct = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;

              return (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="skeuo-panel p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{projTasks.length} Scheduled Tasks</div>
                      <div className="text-[11px] text-slate-500 font-medium">{doneTasks} Completed</div>
                    </div>
                    <div className="text-xl font-black text-blue-600">{pct}% Complete</div>
                  </div>

                  {/* Tasks List inside Detail Modal */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {projTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium skeuo-panel rounded-xl">
                        No tasks created under this project yet.
                      </div>
                    ) : (
                      projTasks.map((t) => (
                        <div key={t.id} className="skeuo-panel p-3 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {t.title}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddTaskForProject(viewingProject.id);
                        setViewingProject(null);
                      }}
                      className="skeuo-button-primary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Add Task to this Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingProject(null)}
                      className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal 2: Create New Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="skeuo-badge p-3 rounded-2xl">
                <FolderPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
                <p className="text-xs text-slate-500 font-medium">Set up a new workspace initiative</p>
              </div>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Mobile App V2 Redesign"
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Briefly describe project objectives..."
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Status
                </label>
                <select
                  value={newProjectStatus}
                  onChange={(e) => setNewProjectStatus(e.target.value as 'active' | 'on_hold' | 'completed')}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create New Task */}
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
                <Kanban className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Sprint Task</h3>
                <p className="text-xs text-slate-500 font-medium">Add a task item to your project board</p>
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
                  placeholder="Additional task details..."
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
