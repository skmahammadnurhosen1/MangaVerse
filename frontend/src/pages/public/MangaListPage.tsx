import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, BookOpen, Layers } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { Manga, Genre } from '../../types';
import { MangaCard } from '../../components/manga/MangaCard';
import { Button } from '../../components/ui/Button';

export const MangaListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const genreParam = searchParams.get('genre') || '';
  const statusParam = searchParams.get('status') || '';
  const sortParam = searchParams.get('sort') || 'popular';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await mangaService.getGenres();
        setGenres(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadGenres();
  }, []);

  useEffect(() => {
    const fetchManga = async () => {
      setIsLoading(true);
      try {
        const data = await mangaService.getMangaList({
          page: pageParam,
          limit: 24,
          genre: genreParam || undefined,
          status: statusParam || undefined,
          sort: sortParam || undefined,
        });
        setMangaList(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchManga();
  }, [genreParam, statusParam, sortParam, pageParam]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Browse Manga Catalog</h1>
        <p className="text-xs text-slate-400 mt-1">Explore all published series, filter by genres and reading status.</p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-dark-900 border border-dark-750 flex flex-wrap items-center gap-3">
        {/* Genre Filter */}
        <select
          value={genreParam}
          onChange={(e) => updateFilter('genre', e.target.value)}
          className="bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-xs outline-none focus:border-brand-500"
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.slug} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusParam}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-xs outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </select>

        {/* Sort Filter */}
        <select
          value={sortParam}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-xs outline-none focus:border-brand-500"
        >
          <option value="popular">Most Popular</option>
          <option value="latest">Latest Updates</option>
          <option value="rating">Highest Rated</option>
          <option value="title">Alphabetical (A-Z)</option>
        </select>

        {(genreParam || statusParam || sortParam !== 'popular') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchParams({})}
            className="text-xs text-slate-400 hover:text-white"
          >
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-xs text-slate-500 font-medium">
          Showing {mangaList.length} of {totalItems} titles
        </div>
      </div>

      {/* Manga Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mangaList.length === 0 ? (
        <div className="text-center py-20 bg-dark-900 border border-dark-800 rounded-3xl p-8">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No manga found</h3>
          <p className="text-xs text-slate-400">Try adjusting your category or status filters to discover titles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mangaList.map((manga) => (
            <MangaCard key={manga.slug} manga={manga} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={pageParam <= 1}
            onClick={() => updateFilter('page', (pageParam - 1).toString())}
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-300 px-4">
            Page {pageParam} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pageParam >= totalPages}
            onClick={() => updateFilter('page', (pageParam + 1).toString())}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
