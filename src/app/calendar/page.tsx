'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/navbar';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { Task, User, Project } from '@/lib/initial-data';

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Feb 2026

  const loadData = useCallback(async () => {
    try {
      const [uRes, tRes, pRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/tasks'),
        fetch('/api/projects'),
      ]);

      if (uRes.ok) setCurrentUser((await uRes.json()).user);
      if (tRes.ok) setTasks((await tRes.json()).tasks || []);
      if (pRes.ok) setProjects((await pRes.json()).projects || []);
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

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      <Navbar userName={currentUser?.name} userAvatar={currentUser?.avatar} />

      <div className="max-w-7xl w-full mx-auto px-6 sm:px-8 py-10 flex-1 space-y-8">
        {/* Header */}
        <div className="skeuo-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <span>Task Schedule Calendar</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              View task deadlines and due dates mapped on a monthly grid schedule
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="skeuo-button-secondary p-2.5 rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-black text-slate-900 min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="skeuo-button-secondary p-2.5 rounded-xl cursor-pointer"
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

              const isToday = day === 20 && currentMonth.getMonth() === 1;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-32 rounded-2xl p-3 flex flex-col justify-between transition-all ${
                    isToday
                      ? 'skeuo-card ring-2 ring-blue-600 border-blue-500'
                      : 'skeuo-panel hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="skeuo-badge px-2 py-0.5 rounded text-[10px] font-bold text-blue-700">
                        {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Task Items Snippet */}
                  <div className="space-y-1 overflow-y-auto max-h-20 text-[10px]">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-1.5 rounded-lg border font-bold truncate ${
                          t.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 line-through'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title={t.title}
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
  );
}
