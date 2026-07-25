'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Kanban,
  Briefcase,
  Activity,
  Calendar,
  CheckCircle2,
  Users,
  LogOut,
  Plus,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  userName?: string;
  userAvatar?: string;
  onOpenTaskModal?: () => void;
  onOpenProjectModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export function Navbar({
  userName,
  userAvatar,
  onOpenTaskModal,
  onOpenProjectModal,
  searchQuery = '',
  onSearchChange,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

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

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/kanban', label: 'Kanban', icon: Kanban },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/tasks', label: 'Tasks', icon: CheckCircle2 },
    { href: '/activity', label: 'Activity', icon: Activity },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/team', label: 'Team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-100/90 backdrop-blur-md border-b border-slate-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        
        {/* Brand Logo & Main Navigation Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <div className="skeuo-badge p-2.5 rounded-xl">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              TaskPulse
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'skeuo-button-secondary text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Optional Search */}
        {onSearchChange && (
          <div className="flex-1 max-w-sm hidden xl:block relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search items..."
              className="skeuo-input block w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium placeholder-slate-400"
            />
          </div>
        )}

        {/* Actions & Profile */}
        <div className="flex items-center gap-3 shrink-0">


          {/* User Avatar & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-300">
            <div
              title={userName || 'User Profile'}
              className="w-9 h-9 rounded-full skeuo-badge overflow-hidden flex items-center justify-center font-bold text-xs text-blue-700 border border-slate-300"
            >
              {userAvatar ? (
                // eslint-disable-next-next/no-img-element
                <img src={userAvatar} alt={userName || 'User'} className="w-full h-full object-cover" />
              ) : (
                userName ? userName.charAt(0) : 'U'
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

      {/* Mobile Navigation Sub-bar */}
      <div className="lg:hidden flex items-center justify-around px-4 py-2 border-t border-slate-200 bg-slate-100">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 ${
                isActive ? 'text-blue-600 font-black' : 'text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
