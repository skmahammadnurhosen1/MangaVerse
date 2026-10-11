import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { admin, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Administrator Workspace...</p>
        </div>
      </div>
    );
  }

  if (!admin || admin.role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full z-10">
            <AdminSidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur-md border-b border-dark-750 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold text-slate-400 capitalize">
                Admin Area / {location.pathname.replace('/admin/', '').replace('/', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-2.5 py-1 text-xs text-brand-300 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
              <span>Admin Session Active</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
