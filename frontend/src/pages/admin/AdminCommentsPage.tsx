import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, EyeOff, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/ui/Badge';

export const AdminCommentsPage: React.FC = () => {
  const [comments, setComments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listComments(1, 50, statusFilter);
      setComments(data.comments);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminService.updateCommentStatus(id, status);
      fetchComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this comment?')) return;
    try {
      await adminService.deleteComment(id);
      fetchComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Comment Moderation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Review community commentary and manage reported flags.</p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-dark-900 text-white rounded-xl border border-dark-700 px-3 py-1.5 text-xs outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending / Flagged</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-850/80 border-b border-dark-750 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Manga</th>
                <th className="py-3 px-4">Comment Text</th>
                <th className="py-3 px-4 text-center">Reports</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading comments...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No comments found matching filter.
                  </td>
                </tr>
              ) : (
                comments.map((c) => (
                  <tr key={c._id} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {c.userId?.username || 'Unknown User'}
                    </td>
                    <td className="py-3 px-4 text-brand-300 font-medium">
                      {c.mangaId?.title || 'Unknown Manga'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate">{c.content}</td>
                    <td className="py-3 px-4 text-center">
                      {c.reportCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px] bg-red-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> {c.reportCount}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={c.status === 'approved' ? 'green' : c.status === 'pending' ? 'amber' : 'red'}
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {c.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(c._id, 'approved')}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {c.status !== 'hidden' && (
                        <button
                          onClick={() => handleUpdateStatus(c._id, 'hidden')}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Hide"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
