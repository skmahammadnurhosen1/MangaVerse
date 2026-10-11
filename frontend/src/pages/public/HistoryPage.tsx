import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, ArrowRight } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { useAuth } from '../../contexts/AuthContext';
import { ReadingProgress } from '../../types';
import { Button } from '../../components/ui/Button';
import { getAssetUrl } from '../../services/api';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await mangaService.getReadingHistory();
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4 space-y-4">
        <Compass className="w-16 h-16 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Reading History</h2>
        <p className="text-xs text-slate-400">Track and automatically resume from where you left off across any device.</p>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Reading History</h1>
        <p className="text-xs text-slate-400 mt-1">Pick up right where you left off on previously opened series.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-dark-900 border border-dark-800 rounded-3xl p-8 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No reading history recorded</h3>
          <p className="text-xs text-slate-400 mb-6">
            When you read manga chapters, your progress is automatically bookmarked here.
          </p>
          <Link to="/manga">
            <Button variant="primary" size="sm">Start Reading</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-dark-900 border border-dark-750/80 hover:border-brand-500/50 hover:bg-dark-850/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={getAssetUrl(item.manga.coverUrl)}
                  alt={item.manga.title}
                  className="w-14 h-20 object-cover rounded-xl shadow bg-dark-800 shrink-0"
                />
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{item.manga.title}</h3>
                  <p className="text-xs text-brand-300 font-semibold mt-0.5">
                    Chapter {item.chapterNumber} {item.chapterTitle ? `- ${item.chapterTitle}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Last read page: {item.lastPage} • {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Link
                to={`/manga/${item.manga.slug}/chapter/${item.chapterNumber}`}
                className="shrink-0"
              >
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                  Resume Reading
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
