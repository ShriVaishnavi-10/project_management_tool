'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  Plus,
  FolderPlus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Eye,
  X,
  Calendar,
  User as UserIcon,
  Lock,
  AlertCircle
} from 'lucide-react';
import { Project, Task, User } from '@/lib/initial-data';
import { Sidebar } from '@/components/sidebar';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function ProjectsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');

  // Create Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<Project['status']>('active');

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<Project['status']>('active');

  // View Project Dashboard Modal State
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  // Delete Project Confirmation Modal State
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes, tRes, mRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/users'),
      ]);

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (pRes.ok) setProjects((await pRes.json()).projects || []);
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (mRes.ok) setTeamMembers((await mRes.json()).users || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Project Handler
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

      toast.success(`Project "${data.project.name}" created successfully!`);
      setNewProjectName('');
      setNewProjectDesc('');
      setShowProjectModal(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating project';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDesc(proj.description || '');
    setEditStatus(proj.status);
  };

  // Edit Project Handler
  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProject.id,
          name: editName,
          description: editDesc,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');

      toast.success(`Project "${editName}" updated!`);
      setEditingProject(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating project';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Project Handler
  const confirmDeleteProject = async () => {
    if (!deletingProject) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects?id=${deletingProject.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');

      toast.success(`Project "${deletingProject.name}" deleted`);
      setDeletingProject(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting project';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.status.toLowerCase().replace('_', ' ').includes(query);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canModifyProject = (proj: Project) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return proj.ownerId === currentUser.id;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar currentUser={currentUser} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
          {/* Header Banner */}
          <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <Briefcase className="w-6 h-6 text-blue-600" />
                <span>Projects Portfolio</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Create, manage, edit, and track project initiatives across your organization
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                {(['all', 'active', 'on_hold', 'completed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'skeuo-button-secondary text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'on_hold' ? 'On Hold' : st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowProjectModal(true)}
                className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, description, or status..."
              className="skeuo-input block w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Projects Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <LoadingSpinner label="Loading projects portfolio..." />
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full skeuo-panel p-12 text-center rounded-3xl text-slate-500 text-xs font-medium">
                No projects found. Click "+ Create Project" to start a new initiative.
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const projTasks = tasks.filter((t) => t.projectId === proj.id);
                const doneTasks = projTasks.filter((t) => t.status === 'done').length;
                const pct = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;
                const owner = teamMembers.find((m) => m.id === proj.ownerId);
                const canModify = canModifyProject(proj);

                return (
                  <div key={proj.id} className="skeuo-card p-6 rounded-3xl flex flex-col justify-between space-y-6 hover:border-slate-400 transition-all">
                    <div className="space-y-3">
                      {/* Title & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{proj.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                            proj.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : proj.status === 'on_hold'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {proj.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                        {proj.description || 'No detailed description provided.'}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      {/* Task Completion Progress Meter */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500">{projTasks.length} tasks</span>
                          <span className="text-blue-700">{pct}% completion</span>
                        </div>
                        <div className="w-full h-2 rounded-full skeuo-panel overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Owner Info & Created Date */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2">
                          {owner && (
                            <div
                              title={`Owner: ${owner.name}`}
                              className="w-6 h-6 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-700 shrink-0"
                            >
                              {owner.avatar ? (
                                // eslint-disable-next-next/no-img-element
                                <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                              ) : (
                                owner.name.charAt(0)
                              )}
                            </div>
                          )}
                          <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
                            {owner?.name || 'Workspace Owner'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Interactive Actions: View Dashboard | Edit | Delete */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setViewingProject(proj)}
                          className="skeuo-button-secondary px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Dashboard</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {canModify && (
                            <>
                              <button
                                onClick={() => openEditModal(proj)}
                                title="Edit Project"
                                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingProject(proj)}
                                title="Delete Project"
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Create Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
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
                  placeholder="e.g. AI Workflow Engine v2"
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
                  placeholder="Scope, objectives, and deliverables..."
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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

      {/* Modal 2: Edit Project */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-lg w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setEditingProject(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="skeuo-badge p-3 rounded-2xl">
                <Edit3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Project</h3>
                <p className="text-xs text-slate-500 font-medium">Update initiative parameters & status</p>
              </div>
            </div>

            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Project Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Project['status'])}
                  className="skeuo-input block w-full px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
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

      {/* Modal 3: View Project Dashboard */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-2xl w-full p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6 max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-1 pr-6">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {viewingProject.name}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      viewingProject.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : viewingProject.status === 'on_hold'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {viewingProject.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Created: {new Date(viewingProject.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="skeuo-panel p-4 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {viewingProject.description || 'No description set for this project.'}
              </p>
            </div>

            {/* Tasks Progress & List */}
            {(() => {
              const pTasks = tasks.filter((t) => t.projectId === viewingProject.id);
              const pDone = pTasks.filter((t) => t.status === 'done').length;
              const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

              return (
                <div className="space-y-4">
                  <div className="skeuo-panel p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Sprint Delivery Meter</span>
                      <span className="text-blue-700">{pDone} / {pTasks.length} Completed ({pPct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full skeuo-panel overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                        style={{ width: `${pPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Project Tasks ({pTasks.length})
                    </h4>
                    {pTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-medium skeuo-panel rounded-2xl">
                        No tasks created for this project yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {pTasks.map((t) => {
                          const assignee = teamMembers.find((m) => m.id === t.assigneeId);
                          return (
                            <div
                              key={t.id}
                              className="skeuo-panel p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    t.status === 'done'
                                      ? 'bg-emerald-500'
                                      : t.status === 'in_progress'
                                      ? 'bg-blue-500'
                                      : 'bg-amber-400'
                                  }`}
                                />
                                <span className={`font-bold text-slate-900 truncate ${t.status === 'done' ? 'line-through text-slate-400' : ''}`}>
                                  {t.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {assignee && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {assignee.name}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                                  {t.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setViewingProject(null)}
                className="skeuo-button-secondary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Custom Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="skeuo-card max-w-md w-full p-6 sm:p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6">
            <button
              onClick={() => setDeletingProject(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="skeuo-badge p-3.5 rounded-2xl shrink-0 bg-red-50 text-red-600 border-red-200">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Project</h3>
                <p className="text-xs text-slate-500 font-medium">Permanent workspace action</p>
              </div>
            </div>

            <div className="skeuo-panel p-4 rounded-2xl bg-red-50/40 border border-red-200 space-y-1.5">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deletingProject.name}"</span>?
              </p>
              <p className="text-[11px] text-red-600 font-semibold">
                This action will permanently remove the project and its associated task linkages.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="skeuo-button-secondary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={confirmDeleteProject}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md border border-red-600 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submitting ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
