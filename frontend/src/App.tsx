import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { MangaListPage } from './pages/public/MangaListPage';
import { MangaDetailPage } from './pages/public/MangaDetailPage';
import { ChapterReaderPage } from './pages/public/ChapterReaderPage';
import { GenresPage } from './pages/public/GenresPage';
import { SearchPage } from './pages/public/SearchPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { LibraryPage } from './pages/public/LibraryPage';
import { HistoryPage } from './pages/public/HistoryPage';
import { ProfilePage } from './pages/public/ProfilePage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMangaPage } from './pages/admin/AdminMangaPage';
import { AdminChaptersPage } from './pages/admin/AdminChaptersPage';
import { AdminGenresPage } from './pages/admin/AdminGenresPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCommentsPage } from './pages/admin/AdminCommentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

// Public Layout wrapper with Header & Footer
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Dedicated Reader Route (Full-screen, focused) */}
          <Route path="/manga/:slug/chapter/:chapterNumber" element={<ChapterReaderPage />} />

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Management Workspace */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="manga" element={<AdminMangaPage />} />
            <Route path="chapters" element={<AdminChaptersPage />} />
            <Route path="genres" element={<AdminGenresPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="comments" element={<AdminCommentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          {/* Public Portal Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="manga" element={<MangaListPage />} />
            <Route path="manga/:slug" element={<MangaDetailPage />} />
            <Route path="genres" element={<GenresPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
