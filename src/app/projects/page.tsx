'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { toast } from 'sonner';
import { Briefcase, Plus, FolderPlus, Search, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { Project, Task, User } from '@/lib/initial-data';

export default function ProjectsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_hold' | 'completed'>('all');

  // Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'active' | 'on_hold' | 'completed'>('active');
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
      if (pRes.ok) setProjects((await pRes.json()).projects || []);
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (mRes.ok) setTeamMembers((await mRes.json()).users || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating project';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Navbar
        userName={currentUser?.name}
        userAvatar={currentUser?.avatar}
        onOpenProjectModal={() => setShowProjectModal(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
        {/* Header */}
        <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <span>Projects Portfolio</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage organization initiatives, task milestone progress, and project statuses
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full skeuo-panel p-12 text-center rounded-3xl text-slate-500 text-xs font-medium">
              No projects found. Click "+ Add Project" to create a new initiative.
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const doneTasks = projTasks.filter((t) => t.status === 'done').length;
              const pct = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;
              const owner = teamMembers.find((m) => m.id === proj.ownerId);

              return (
                <div key={proj.id} className="skeuo-card p-6 rounded-3xl flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
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

                    <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed">
                      {proj.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">{projTasks.length} tasks scheduled</span>
                        <span className="text-blue-700">{pct}% completion</span>
                      </div>
                      <div className="w-full h-2 rounded-full skeuo-panel overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        {owner && (
                          <div
                            title={`Owner: ${owner.name}`}
                            className="w-6 h-6 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-700"
                          >
                            {owner.avatar ? (
                              // eslint-disable-next-next/no-img-element
                              <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                            ) : (
                              owner.name.charAt(0)
                            )}
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-slate-600">
                          {owner?.name || 'Workspace Owner'}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Create Project */}
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
    </div>
  );
}
