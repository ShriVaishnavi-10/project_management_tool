'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { LayoutGrid, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  return (
    <div className="skeuo-card p-8 rounded-3xl">
      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Email Address
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="skeuo-input block w-full pl-11 pr-4 py-3 rounded-xl text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Password
          </label>
          <div className="relative rounded-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="skeuo-input block w-full pl-11 pr-4 py-3 rounded-xl text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="skeuo-button-primary w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Fill Test Credentials Box */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Interviewer Test Credentials</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => fillDemo('admin@example.com')}
            className="skeuo-button-secondary flex items-center justify-between p-3 rounded-xl text-left text-xs"
          >
            <div>
              <div className="font-bold text-slate-800">Admin Account</div>
              <div className="text-[10px] text-slate-500 font-medium">admin@example.com</div>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => fillDemo('jane@example.com')}
            className="skeuo-button-secondary flex items-center justify-between p-3 rounded-xl text-left text-xs"
          >
            <div>
              <div className="font-bold text-slate-800">Member Account</div>
              <div className="text-[10px] text-slate-500 font-medium">jane@example.com</div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] text-slate-500 font-medium">
          Default password: <span className="font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">password123</span>
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs font-medium text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-100 text-slate-900 relative overflow-hidden">
      {/* Soft light background accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-blue-200/50 to-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-slate-200/60 to-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="skeuo-badge p-3.5 rounded-2xl">
            <LayoutGrid className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900">
            TaskPulse
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          Sign in to your Workspace
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Professional Project Management Tool
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Suspense fallback={
          <div className="skeuo-card p-8 rounded-3xl text-center text-slate-500 font-medium">
            Loading authentication...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
