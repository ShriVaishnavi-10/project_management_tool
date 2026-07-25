'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutGrid,
  Kanban,
  Briefcase,
  CheckCircle2,
  Activity,
  Calendar,
  Users,
  LogOut,
  Plus,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '@/lib/initial-data';

interface SidebarProps {
  currentUser?: User | null;
  onOpenTaskModal?: () => void;
  onOpenProjectModal?: () => void;
}

export function Sidebar({ currentUser, onOpenTaskModal, onOpenProjectModal }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('taskpulse_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
      toast.success('Switched to Light Mode');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
      toast.success('Switched to Dark Mode');
    }
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);

    if (currentUser) {
      setUser(currentUser);
      sessionStorage.setItem('taskpulse_user', JSON.stringify(currentUser));
    } else {
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('taskpulse_user');
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      }
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            sessionStorage.setItem('taskpulse_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('taskpulse_user');
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, badge: null },
    { href: '/kanban', label: 'Kanban Board', icon: Kanban, badge: 'Sprint' },
    { href: '/projects', label: 'Projects', icon: Briefcase, badge: null },
    { href: '/tasks', label: 'Tasks List', icon: CheckCircle2, badge: null },
    { href: '/activity', label: 'Activity Feed', icon: Activity, badge: 'Live' },
    { href: '/calendar', label: 'Calendar', icon: Calendar, badge: null },
    { href: '/team', label: 'Team Directory', icon: Users, badge: null },
  ];

  return (
    <>
      {/* Mobile Top Bar with Hamburger Trigger */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-100/90 backdrop-blur-md border-b border-slate-300 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="skeuo-badge p-2 rounded-xl">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            TaskPulse
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="skeuo-button-secondary p-2 rounded-xl text-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            suppressHydrationWarning
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="skeuo-button-secondary p-2 rounded-xl text-slate-700 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* Persistent Desktop Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-100 border-r border-slate-300 flex flex-col justify-between p-5 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 transition-transform duration-200' : '-translate-x-full lg:transition-none'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="skeuo-badge p-2.5 rounded-2xl">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  TaskPulse
                </span>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Workspace Studio
                </div>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>



          {/* Sidebar Menu Items List */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Menu
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white font-black shadow-md border border-blue-700'
                      : 'text-slate-700 dark:text-slate-300 font-bold hover:font-black hover:text-black dark:hover:text-white hover:bg-slate-300/70 dark:hover:bg-slate-800 border border-transparent hover:border-slate-400/40 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left Active/Hover Accent Bar */}
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 ${
                      isActive
                        ? 'bg-white opacity-100 scale-y-100'
                        : 'bg-blue-600 dark:bg-blue-400 opacity-0 scale-y-50 group-hover:opacity-100 group-hover:scale-y-100'
                    }`}
                  />

                  <div className="flex items-center gap-3 pl-1">
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white'
                      }`}
                    />
                    <span className="transition-colors duration-200">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                    }`}>
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer User Profile Card & Theme Switcher */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="w-full skeuo-button-secondary p-2.5 rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer hover:border-slate-400 transition-all"
            suppressHydrationWarning
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
              <span>{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {isDarkMode ? 'Dark On' : 'Light On'}
            </span>
          </button>

          {/* Reserved height container for User Profile Card to prevent layout movement */}
          <div className="min-h-[58px] flex items-center justify-center" suppressHydrationWarning>
            {user ? (
              <div className="w-full skeuo-panel p-3 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-xs text-blue-700 shrink-0 border border-slate-300">
                    {user.avatar ? (
                      // eslint-disable-next-next/no-img-element
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{user.name}</div>
                    <div className="text-[10px] font-semibold text-blue-600 capitalize flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{user.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full skeuo-panel p-3 rounded-2xl flex items-center justify-between gap-3 opacity-40">
                <div className="w-8 h-8 rounded-full bg-slate-300 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-300 rounded w-20" />
                  <div className="h-2 bg-slate-200 rounded w-12" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
