import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, Ban } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { User } from '../../types';
import { Badge } from '../../components/ui/Badge';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listUsers(1, 50, search);
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
    const userId = u.id || (u as any)._id;
    if (!userId) return;
    try {
      await adminService.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">User Moderation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Inspect registered accounts and moderate user access.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-850/80 border-b border-dark-750 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.email} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-dark-750 text-brand-300 font-bold text-[10px] flex items-center justify-center uppercase">
                        {u.username.charAt(0)}
                      </div>
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'red' : 'purple'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status === 'suspended' ? 'red' : 'green'} size="sm">
                        {u.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role === 'admin' ? (
                        <span className="text-[10px] text-slate-500">Admin Locked</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
