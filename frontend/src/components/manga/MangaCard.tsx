import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import { Manga } from '../../types';
import { getAssetUrl } from '../../services/api';

interface MangaCardProps {
  manga: Manga;
  showRank?: boolean;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, showRank = false }) => {
  const coverUrl = getAssetUrl(manga.coverUrl);

  return (
    <Link
      to={`/manga/${manga.slug}`}
      className="group flex flex-col h-full rounded-2xl bg-dark-900/60 hover:bg-dark-850/80 border border-dark-750/50 hover:border-brand-500/50 p-2.5 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-dark-800">
        <img
          src={coverUrl}
          alt={manga.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Broken image fallback to local hero asset
            (e.target as HTMLImageElement).src = '/images/hero-character.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />

        {/* Rank Badge */}
        {showRank && manga.rank && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-brand-500/40">
            #{manga.rank}
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-dark-950/85 backdrop-blur-md border border-dark-700/80 rounded-lg px-2 py-0.5 flex items-center gap-1 text-[11px] font-bold text-amber-300">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{manga.rating ? manga.rating.toFixed(1) : '5.0'}</span>
        </div>

        {/* Latest Chapter Pill */}
        {manga.latestChapter !== undefined && manga.latestChapter !== null && (
          <div className="absolute bottom-2 left-2 bg-dark-900/90 backdrop-blur-md border border-brand-500/40 text-brand-300 rounded-md px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>Ch. {manga.latestChapter}</span>
          </div>
        )}
      </div>

      {/* Meta Content */}
      <div className="mt-2.5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
            {manga.title}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{manga.author || 'MangaVerse'}</p>
        </div>

        {/* Genre Tags */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {manga.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[9px] font-medium text-slate-400 bg-dark-800/80 px-1.5 py-0.5 rounded border border-dark-700/60"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};
