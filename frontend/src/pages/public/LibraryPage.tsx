import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark as BookmarkIcon, BookOpen, Trash2 } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { useAuth } from '../../contexts/AuthContext';
import { Bookmark } from '../../types';
import { MangaCard } from '../../components/manga/MangaCard';
import { Button } from '../../components/ui/Button';

export const LibraryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('reading');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const data = await mangaService.getBookmarks(activeTab);
        setBookmarks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, [user, activeTab]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4 space-y-4">
        <BookmarkIcon className="w-16 h-16 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Your Library</h2>
        <p className="text-xs text-slate-400">Save titles to your library, track your reading states, and sync progress.</p>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'reading', label: 'Currently Reading' },
    { id: 'plan_to_read', label: 'Plan to Read' },
    { id: 'completed', label: 'Completed' },
    { id: 'favorite', label: 'Favorites' },
  ];

  const handleRemove = async (mangaId: string) => {
    try {
      await mangaService.removeBookmark(mangaId);
      setBookmarks(bookmarks.filter((b) => (b.manga.id || b.manga._id) !== mangaId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove bookmark');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Manga Library</h1>
        <p className="text-xs text-slate-400 mt-1">Organize and keep track of all series you follow.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-800 gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'text-brand-300 bg-dark-900 border-t border-x border-dark-750'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-dark-900 border border-dark-800 rounded-3xl p-8 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No titles in this section</h3>
          <p className="text-xs text-slate-400 mb-6">
            You haven't bookmarked any manga under "{tabs.find((t) => t.id === activeTab)?.label}" yet.
          </p>
          <Link to="/manga">
            <Button variant="secondary" size="sm">Explore Manga Catalog</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {bookmarks.map((b) => (
            <div key={b.id} className="relative group">
              <MangaCard manga={b.manga} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(b.manga.id || b.manga._id || '');
                }}
                className="absolute top-4 left-4 p-1.5 bg-dark-950/90 text-slate-400 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-dark-750 shadow-md"
                title="Remove Bookmark"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
