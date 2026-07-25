'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { Activity as ActivityIcon, Filter, Clock, User as UserIcon } from 'lucide-react';
import { ActivityLog, User } from '@/lib/initial-data';
import { Sidebar } from '@/components/sidebar';

export default function ActivityPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [uRes, aRes, mRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/activities'),
        fetch('/api/users'),
      ]);

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (aRes.ok) setActivities((await aRes.json()).activities || []);
      if (mRes.ok) setTeamMembers((await mRes.json()).users || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredActivities = activities.filter((a) => {
    if (actionFilter === 'all') return true;
    return a.action === actionFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar currentUser={currentUser} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="max-w-4xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
        {/* Header */}
        <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <ActivityIcon className="w-6 h-6 text-blue-600" />
              <span>Workspace Audit Feed</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time system events, task updates, project creations, and audit records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="skeuo-input px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="PROJECT_CREATED">Project Created</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_UPDATED">Task Updated</option>
              <option value="COMMENT_ADDED">Comment Added</option>
            </select>
          </div>
        </div>

        {/* Timeline */}
        <div className="skeuo-card p-8 rounded-3xl">
          <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-300">
            {filteredActivities.length === 0 ? (
              <div className="text-xs text-slate-500 font-medium pl-8 py-4">No activity events recorded.</div>
            ) : (
              filteredActivities.map((act) => {
                const user = teamMembers.find((m) => m.id === act.userId);

                return (
                  <div key={act.id} className="relative pl-10 space-y-2">
                    <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full skeuo-badge border-2 border-blue-400 bg-blue-600" />
                    
                    <div className="skeuo-panel p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 leading-snug">
                          {act.details}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          {user && (
                            <span className="text-blue-700 font-bold flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              {user.name}
                            </span>
                          )}
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                            {act.action.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
