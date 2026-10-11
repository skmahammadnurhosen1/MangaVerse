import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Tag,
  Users,
  MessageSquare,
  Settings,
  User,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { adminLogout, admin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manga', path: '/admin/manga', icon: BookOpen },
    { label: 'Chapters', path: '/admin/chapters', icon: Layers },
    { label: 'Genres', path: '/admin/genres', icon: Tag },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Comments', path: '/admin/comments', icon: MessageSquare },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'Profile', path: '/admin/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-750 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-dark-750 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">
              Manga<span className="text-brand-400">Verse</span>
            </h1>
            <span className="text-[10px] font-semibold text-brand-400 tracking-widest uppercase">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-dark-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-dark-750 space-y-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Visit Public Site
          </span>
        </a>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-dark-750 text-brand-300 font-bold text-xs flex items-center justify-center uppercase">
              {admin?.username?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{admin?.username || 'Admin'}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
