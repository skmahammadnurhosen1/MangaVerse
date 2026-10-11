import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect immediately
  if (admin) {
    const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
    navigate(from, { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your administrative email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await adminLogin(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Panel Container */}
      <div className="w-full max-w-4xl bg-dark-900/90 border border-dark-750/90 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10">
        {/* Left Visual Panel: Artwork & Branding */}
        <div className="relative p-8 sm:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-dark-850 to-dark-950 border-b md:border-b-0 md:border-r border-dark-750/60">
          {/* Background Artwork */}
          <div className="absolute inset-0 z-0 opacity-40">
            <img
              src="/images/hero-character.jpg"
              alt="Anime Moonlight Scenery"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-900/60 to-dark-950/40" />
          </div>

          {/* Top Brand */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/40">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Manga<span className="text-brand-400">Verse</span>
              </span>
            </div>
            <a
              href="/"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-dark-900/80 px-2.5 py-1 rounded-lg border border-dark-700/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Site
            </a>
          </div>

          {/* Middle Headings */}
          <div className="relative z-10 my-8">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-300 bg-brand-500/20 border border-brand-500/30 mb-3">
              Administrative Control
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Manage the World of Manga
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-sm">
              Control library publications, upload high-definition chapter pages, moderate reader comments, and monitor server analytics.
            </p>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 text-[11px] text-slate-400 border-t border-dark-700/60 pt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Argon2id Encrypted Security Architecture</span>
          </div>
        </div>

        {/* Right Form Panel: Authentication Controls */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-dark-900">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Admin Login</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the administrative control center.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              showPasswordToggle
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Login to Dashboard
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-800 text-center">
            <p className="text-[11px] text-slate-500">
              Administrative accounts are managed directly through MongoDB Atlas. There is no public registration or email recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
