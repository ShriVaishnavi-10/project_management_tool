'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { toast } from 'sonner';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Mail,
  Calendar,
  Sparkles,
  Search,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { Task, User } from '@/lib/initial-data';
import { Sidebar } from '@/components/sidebar';

export default function TeamPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [uRes, mRes, tRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/users'),
        fetch('/api/tasks'),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setCurrentUser(uData.user);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setTeamMembers(mData.users || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTasks(tData.tasks || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team workspace');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');

      toast.success(`Role updated to ${newRole === 'admin' ? 'Administrator' : 'Team Member'}`);
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Role update failed';
      toast.error(msg);
    }
  };

  const filteredMembers = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar currentUser={currentUser} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
        
        {/* Header Banner */}
        <div className="skeuo-card p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full skeuo-badge text-[11px] font-bold text-blue-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Team Roster Subpage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Organization Members & RBAC Roles
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
              View team member roles, active workloads, and completion rates across all projects.
              {currentUser?.role === 'admin' && (
                <span className="text-purple-700 font-bold ml-1">
                  (Admin Mode: You can change user roles below)
                </span>
              )}
            </p>
          </div>

          <div className="skeuo-panel p-4 px-6 rounded-2xl flex items-center gap-3 shrink-0">
            <UserCheck className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-2xl font-black text-slate-900">{teamMembers.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Members</div>
            </div>
          </div>
        </div>

        {/* Member Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
            const completedTasks = memberTasks.filter((t) => t.status === 'done').length;
            const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress').length;
            const pct = memberTasks.length > 0 ? Math.round((completedTasks / memberTasks.length) * 100) : 0;

            return (
              <div key={member.id} className="skeuo-card p-6 rounded-3xl space-y-5 hover:border-slate-400 transition-all">
                <div className="flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl skeuo-badge overflow-hidden flex items-center justify-center font-bold text-base text-blue-700 shrink-0 border border-slate-300">
                      {member.avatar ? (
                        // eslint-disable-next-next/no-img-element
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{member.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Perfectly Aligned Role Indicator / Admin Control Dropdown */}
                  {currentUser?.role === 'admin' ? (
                    <div className="relative inline-flex items-center shrink-0">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as 'admin' | 'member')
                        }
                        className="skeuo-input h-7 pl-2.5 pr-6 py-0 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-purple-300 bg-purple-50 text-purple-900 appearance-none shadow-sm hover:bg-purple-100/70 transition-colors focus:ring-1 focus:ring-purple-400"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-purple-600 absolute right-1.5 pointer-events-none" />
                    </div>
                  ) : (
                    <span
                      className={`h-7 px-2.5 flex items-center rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {member.role}
                    </span>
                  )}
                </div>

                {/* Member Workload Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="skeuo-panel p-3 rounded-xl space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned</div>
                    <div className="text-base font-black text-slate-900">{memberTasks.length} tasks</div>
                  </div>
                  <div className="skeuo-panel p-3 rounded-xl space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed</div>
                    <div className="text-base font-black text-emerald-700">{completedTasks} tasks</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Sprint Delivery</span>
                    <span className="text-blue-700">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full skeuo-panel overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>
      </div>
    </div>
  );
}
