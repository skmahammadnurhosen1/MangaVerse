import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, Bookmark, User as UserIcon, Menu, X, LogOut, Compass, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mangaService } from '../../services/mangaService';
import { Manga } from '../../types';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manga[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await mangaService.searchManga(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Manga', path: '/manga' },
    { label: 'Genres', path: '/genres' },
    { label: 'Popular', path: '/manga?sort=popular' },
    { label: 'Latest', path: '/manga?sort=latest' },
    { label: 'Bookmarks', path: '/library' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-dark-950/85 backdrop-blur-xl border-b border-dark-750/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-brand-300 transition-colors">
            Manga<span className="text-brand-400">Verse</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path.split('?')[0];
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-dark-800/90 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar & User Control */}
        <div className="flex items-center gap-3">
          {/* Quick Search Field */}
          <div ref={searchRef} className="relative hidden sm:block w-48 md:w-64">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search manga..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-dark-900 border border-dark-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </form>

            {/* Dropdown Live Search Suggestions */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-dark-900 border border-dark-750 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-dark-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Quick Results
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-dark-800">
                  {searchResults.map((m) => (
                    <Link
                      key={m.slug}
                      to={`/manga/${m.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 p-2 hover:bg-dark-800 transition-colors"
                    >
                      <img
                        src={m.coverUrl}
                        alt={m.title}
                        className="w-9 h-12 object-cover rounded shadow"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.genres?.slice(0, 2).join(', ')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={handleSearchSubmit}
                  className="w-full p-2 text-center text-xs text-brand-400 hover:text-brand-300 bg-dark-850 hover:bg-dark-800 font-medium transition-colors"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* User Sign In / Profile dropdown */}
          {user ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-800 transition-colors border border-dark-750/70"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/50 flex items-center justify-center text-brand-300 font-bold text-xs uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="hidden lg:block text-xs font-semibold text-slate-200">{user.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-750 rounded-xl shadow-2xl py-1 z-50 divide-y divide-dark-800">
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-white">{user.username}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/library"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-dark-800"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-brand-400" /> My Library
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-dark-800"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-400" /> Reading History
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-dark-800"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-indigo-400" /> Profile & Security
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="text-xs shadow-none">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-dark-800"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-dark-800 bg-dark-900/98 px-4 py-4 space-y-3">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search manga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white"
              />
            </div>
          </form>

          <nav className="flex flex-col space-y-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
