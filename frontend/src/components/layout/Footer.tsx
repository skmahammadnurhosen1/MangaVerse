import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Heart, Github, Twitter, Disc as Discord } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-800 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Manga<span className="text-brand-400">Verse</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your destination for reading high quality manga, manhwa, and manhua with zero interruptions, responsive reading modes, and offline downloads.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/manga" className="hover:text-white transition-colors">Browse Catalog</Link></li>
              <li><Link to="/genres" className="hover:text-white transition-colors">Genres & Categories</Link></li>
              <li><Link to="/manga?sort=popular" className="hover:text-white transition-colors">Popular Titles</Link></li>
              <li><Link to="/manga?sort=latest" className="hover:text-white transition-colors">Latest Releases</Link></li>
            </ul>
          </div>

          {/* User Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">User Space</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/library" className="hover:text-white transition-colors">Personal Library</Link></li>
              <li><Link to="/history" className="hover:text-white transition-colors">Reading History</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          {/* Legal & DMCA */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Copyright & Legal
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              MangaVerse only distributes authorized manga content. If you are a copyright owner wishing to submit an inquiry, please contact our administrative team.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="#" className="hover:text-white transition-colors" aria-label="Discord"><Discord className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="GitHub"><Github className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MangaVerse. Built with security and performance in mind.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">DMCA Notice</span>
            <Link to="/admin/login" className="text-dark-700 hover:text-dark-600 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
