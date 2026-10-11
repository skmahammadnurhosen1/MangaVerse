import React, { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminProfilePage: React.FC = () => {
  const { admin } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccess('Administrator password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Admin Profile & Security</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage administrator credentials and account security.</p>
      </div>

      {/* Admin Identity Card */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 shadow-lg flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-xl flex items-center justify-center uppercase shadow-lg shadow-brand-600/30">
          {admin?.username?.charAt(0) || 'A'}
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{admin?.username || 'Administrator'}</h3>
          <p className="text-xs text-slate-400">{admin?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-500/30">
              <Shield className="w-3 h-3" /> System Admin
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">• Active</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center gap-2.5 pb-3 border-b border-dark-800">
          <Lock className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Change Administrator Password</h3>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showPasswordToggle
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            showPasswordToggle
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPasswordToggle
            required
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
