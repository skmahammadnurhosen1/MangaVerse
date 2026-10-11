import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    navigate('/', { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register(username.trim(), email.trim(), password, passwordConfirm);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-900 border border-dark-750/90 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create MangaVerse Account</h1>
          <p className="text-xs text-slate-400">Save bookmarks, sync reading progress, and join reader discussions.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            placeholder="e.g. MangaReader99"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
            autoComplete="username"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            showPasswordToggle
            required
            autoComplete="new-password"
          />

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Create Free Account
          </Button>
        </form>

        <div className="pt-4 border-t border-dark-800 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
