'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/sidebar';
import { TaskComments } from '@/components/task-comments';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  Kanban as KanbanIcon,
  User as UserIcon,
  Briefcase
} from 'lucide-react';
import { Task, User, Project } from '@/lib/initial-data';

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // View Task Details Modal State
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [uRes, tRes, pRes, mRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/users'),
      ]);

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (pRes.ok) setProjects((await pRes.json()).projects || []);
      if (mRes.ok) setTeamMembers((await mRes.json()).users || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentMonth(new Date());
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Sidebar currentUser={currentUser} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
          {/* Header */}
          <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                <span>Task Schedule Calendar</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Click on any calendar task event to view full details and team discussions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={jumpToToday}
                className="skeuo-button-secondary px-3 py-2 rounded-xl text-xs font-bold text-blue-600 cursor-pointer hover:text-blue-700"
              >
                Today
              </button>

              <button
                onClick={prevMonth}
                className="skeuo-button-secondary p-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-slate-900 min-w-[140px] text-center">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="skeuo-button-secondary p-2 rounded-xl cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="skeuo-card p-6 sm:p-8 rounded-3xl space-y-4">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-300">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-3">
              {paddingArray.map((p) => (
                <div key={`pad-${p}`} className="h-32 rounded-2xl bg-slate-200/40 opacity-40 border border-slate-200" />
              ))}

              {daysArray.map((day) => {
                const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dayTasks = tasks.filter((t) => {
                  if (!t.dueDate) return false;
                  const d = new Date(t.dueDate);
                  return (
                    d.getDate() === day &&
                    d.getMonth() === currentMonth.getMonth() &&
                    d.getFullYear() === currentMonth.getFullYear()
                  );
                });

                const now = new Date();
                const isToday =
                  day === now.getDate() &&
                  currentMonth.getMonth() === now.getMonth() &&
                  currentMonth.getFullYear() === now.getFullYear();

                return (
                  <div
                    key={`day-${day}`}
                    className={`h-32 rounded-2xl p-3 flex flex-col justify-between transition-all ${
                      isToday
                        ? 'skeuo-card ring-2 ring-blue-600 dark:ring-blue-500 border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-md'
                        : 'skeuo-panel hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-800'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                            Today
                          </span>
                        )}
                      </div>
                      {dayTasks.length > 0 && (
                        <span className="skeuo-badge px-2 py-0.5 rounded text-[10px] font-bold text-blue-700">
                          {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Task Items Pills */}
                    <div className="space-y-1 overflow-y-auto overflow-x-hidden max-h-20 text-[10px]">
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setViewingTask(t)}
                          className={`p-1.5 rounded-lg border font-bold truncate cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all shadow-sm ${
                            t.status === 'done'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 line-through'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                          title={`Click to view task details for "${t.title}"`}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Popup Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="skeuo-card max-w-xl w-full p-6 sm:p-8 rounded-3xl relative animate-in fade-in zoom-in duration-150 space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <button
              onClick={() => setViewingTask(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Title & Status */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="skeuo-badge p-3.5 rounded-2xl shrink-0">
                <CalendarIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {viewingTask.title}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-blue-100 text-blue-800 border-blue-200">
                    Status: {viewingTask.status.replace('_', ' ')}
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
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scheduled Due Date</div>
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

            {/* Footer Action */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="skeuo-button-secondary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Task View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
