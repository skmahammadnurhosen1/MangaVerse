import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tag, BookOpen, ArrowRight } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { Genre } from '../../types';

export const GenresPage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await mangaService.getGenres();
        setGenres(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGenres();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Manga Genres & Categories</h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore manga categorized by thematic genre, narrative style, and story setting.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {genres.map((g) => (
            <Link
              key={g.slug}
              to={`/manga?genre=${encodeURIComponent(g.name)}`}
              className="p-5 rounded-2xl bg-dark-900 border border-dark-750/80 hover:border-brand-500/50 hover:bg-dark-850/80 transition-all group flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                  {g.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {g.description || 'Explore titles under this category.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-800 flex items-center justify-between text-xs font-semibold text-brand-400">
                <span>View Titles</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
