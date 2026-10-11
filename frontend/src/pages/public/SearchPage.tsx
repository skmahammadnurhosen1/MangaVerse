import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookOpen } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { Manga } from '../../types';
import { MangaCard } from '../../components/manga/MangaCard';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(queryParam);
  const [results, setResults] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputVal(queryParam);
    if (!queryParam.trim()) {
      setResults([]);
      return;
    }

    const runSearch = async () => {
      setIsLoading(true);
      try {
        const res = await mangaService.searchManga(queryParam);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    runSearch();
  }, [queryParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Search Manga</h1>
        <p className="text-xs text-slate-400">Search through all titles, authors, and artists across MangaVerse.</p>

        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Type series name or author..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700/90 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 shadow-xl"
          />
        </form>
      </div>

      {/* Results Header */}
      {queryParam && (
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <h2 className="text-sm font-bold text-slate-300">
            Results for <span className="text-white">"{queryParam}"</span> ({results.length})
          </h2>
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 && queryParam ? (
        <div className="text-center py-20 bg-dark-900 border border-dark-800 rounded-3xl p-8 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No matching titles</h3>
          <p className="text-xs text-slate-400">No manga matching "{queryParam}" was found. Try another search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((manga) => (
            <MangaCard key={manga.slug} manga={manga} />
          ))}
        </div>
      )}
    </div>
  );
};
