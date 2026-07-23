import Link from "next/link";
import { LayoutGrid, ArrowRight, CheckCircle2, Shield, Zap, Kanban, Users, Layers, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-200 selection:text-blue-900 relative overflow-hidden">
      {/* Soft light background accents */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-br from-blue-200/50 to-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-slate-200/60 to-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-100/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeuo-badge p-2.5 rounded-xl">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              TaskPulse
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="skeuo-button-secondary px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full skeuo-badge text-xs font-bold text-blue-700 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tactile & Professional Skeuomorphic UI</span>
        </div>

        <h1 className="max-w-4xl text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
          Manage Projects with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700">Tactile Precision</span> & Speed
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600 font-medium leading-relaxed">
          TaskPulse brings back physical depth, embossed controls, and clean executive tactile surfaces to modern project management. Streamline workflows with speed and clarity.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link
            href="/login"
            className="skeuo-button-primary flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold shadow-lg"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="skeuo-button-secondary flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold"
          >
            <span>Create Free Account</span>
          </Link>
        </div>

        {/* Skeuomorphic Live Workspace Mockup Preview Card */}
        <div className="mt-16 w-full max-w-5xl skeuo-card rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden">
          {/* Card Title & Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500 shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-inner" />
              <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500 shadow-inner" />
              <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Q3 Engineering Sprint Overview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="skeuo-badge px-3 py-1 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Sprint #14
              </span>
            </div>
          </div>

          {/* Kanban Board Columns Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Backlog */}
            <div className="skeuo-panel p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">To Do</h3>
                </div>
                <span className="skeuo-badge px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-600">3</span>
              </div>
              <div className="space-y-3">
                <div className="skeuo-card p-3.5 rounded-xl">
                  <div className="text-xs font-bold text-slate-800 mb-1">Implement SSO Authentication</div>
                  <div className="text-[11px] text-slate-500 mb-2">OAuth2 & NextAuth integration for enterprise teams</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High Priority</span>
                    <span className="text-[10px] text-slate-400 font-mono">TASK-102</span>
                  </div>
                </div>
                <div className="skeuo-card p-3.5 rounded-xl">
                  <div className="text-xs font-bold text-slate-800 mb-1">Database Schema Migration</div>
                  <div className="text-[11px] text-slate-500 mb-2">Update Prisma schemas for task attachments</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Medium</span>
                    <span className="text-[10px] text-slate-400 font-mono">TASK-108</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="skeuo-panel p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">In Progress</h3>
                </div>
                <span className="skeuo-badge px-2 py-0.5 rounded-md text-[11px] font-bold text-blue-700">2</span>
              </div>
              <div className="space-y-3">
                <div className="skeuo-card p-3.5 rounded-xl border-l-4 border-l-blue-600">
                  <div className="text-xs font-bold text-slate-800 mb-1">Skeuomorphic Light Theme Redesign</div>
                  <div className="text-[11px] text-slate-500 mb-2">Craft executive light tactile styling & shadows</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 font-medium">In Design</span>
                    <span className="text-[10px] text-blue-600 font-bold font-mono">TASK-124</span>
                  </div>
                </div>
                <div className="skeuo-card p-3.5 rounded-xl">
                  <div className="text-xs font-bold text-slate-800 mb-1">REST API Rate Limiting</div>
                  <div className="text-[11px] text-slate-500 mb-2">Redis middleware throttles for public endpoints</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>
                    <span className="text-[10px] text-slate-400 font-mono">TASK-115</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Done */}
            <div className="skeuo-panel p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Completed</h3>
                </div>
                <span className="skeuo-badge px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-700">2</span>
              </div>
              <div className="space-y-3">
                <div className="skeuo-card p-3.5 rounded-xl opacity-90">
                  <div className="text-xs font-bold text-slate-800 mb-1 line-through decoration-emerald-500">Project Setup & Auth Route</div>
                  <div className="text-[11px] text-slate-500 mb-2">Initial Next.js setup with custom JWT & Supabase</div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Verified</span>
                    <span className="text-[10px] text-emerald-700 font-mono">TASK-090</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="skeuo-card p-6 rounded-2xl text-left">
            <div className="skeuo-badge w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Kanban className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tactile Kanban Boards</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Drag-and-drop task cards designed with realistic depth, tactile borders, and embossed status indicators.
            </p>
          </div>

          <div className="skeuo-card p-6 rounded-2xl text-left">
            <div className="skeuo-badge w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Team Collaboration</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Assign roles, track task updates in real-time, and manage workspace permissions effortlessly.
            </p>
          </div>

          <div className="skeuo-card p-6 rounded-2xl text-left">
            <div className="skeuo-badge w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Enterprise Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Built on secure authentication tokens and Supabase infrastructure with role-based access control.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-200/60 border-t border-slate-300 py-8 text-center text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>TaskPulse &copy; {new Date().getFullYear()} — Professional Light Skeuomorphic Design</div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-800 underline">Login</Link>
            <Link href="/register" className="hover:text-slate-800 underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
