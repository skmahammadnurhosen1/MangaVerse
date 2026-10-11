import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, Users, Eye, Plus, ArrowUpRight, ShieldCheck, Clock } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { OverviewStats, Manga } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getAssetUrl } from '../../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentManga, setRecentManga] = useState<Manga[]>([]);
  const [recentChapters, setRecentChapters] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data.stats);
        setRecentManga(data.recentManga || []);
        setRecentChapters(data.recentChapters || []);
        setRecentLogs(data.recentAuditLogs || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Manga',
      value: stats?.totalManga ?? 0,
      icon: BookOpen,
      color: 'from-brand-600 to-indigo-600',
      badge: 'Catalog',
    },
    {
      label: 'Total Chapters',
      value: stats?.totalChapters ?? 0,
      icon: Layers,
      color: 'from-indigo-600 to-cyan-600',
      badge: 'Published',
    },
    {
      label: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      badge: 'Active Accounts',
    },
    {
      label: 'Total Reads / Views',
      value: (stats?.totalViews ?? 0).toLocaleString(),
      icon: Eye,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Tracked',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time statistics and operational activity logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/manga">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Manga
            </Button>
          </Link>
          <Link to="/admin/chapters">
            <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Chapter
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-750/80 hover:border-dark-700 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <Badge variant="purple" size="sm">
                  {card.badge}
                </Badge>
              </div>
              <p className="text-2xl font-black text-white">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Manga & Recent Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Manga Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-dark-900 border border-dark-750 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" /> Recent Manga Additions
            </h3>
            <Link to="/admin/manga" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 pl-1">Cover & Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {recentManga.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No manga records found. Add your first manga to get started.
                    </td>
                  </tr>
                ) : (
                  recentManga.map((m) => (
                    <tr key={m.slug} className="hover:bg-dark-850/50 transition-colors">
                      <td className="py-2.5 pl-1 flex items-center gap-3">
                        <img
                          src={getAssetUrl(m.coverUrl)}
                          alt={m.title}
                          className="w-8 h-11 object-cover rounded shadow"
                        />
                        <span className="font-semibold text-white truncate max-w-[180px]">{m.title}</span>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant={m.status === 'completed' ? 'green' : 'purple'}
                          size="sm"
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-300">{m.viewCount || 0}</td>
                      <td className="py-2.5 text-right pr-1">
                        <Link
                          to={`/admin/manga`}
                          className="text-brand-400 hover:text-brand-300 font-semibold"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Logs (1 Col) */}
        <div className="rounded-2xl bg-dark-900 border border-dark-750 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Admin Audit Logs
            </h3>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No administrative activity recorded yet.</p>
            ) : (
              recentLogs.slice(0, 6).map((log, idx) => (
                <div key={log._id || idx} className="p-2.5 rounded-xl bg-dark-850 border border-dark-750/60 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    By <span className="text-brand-300 font-medium">{log.adminUsername || 'admin'}</span> on{' '}
                    <span className="text-slate-300 font-medium">{log.targetType}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
