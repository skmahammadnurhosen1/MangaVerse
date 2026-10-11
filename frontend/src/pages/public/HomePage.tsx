import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Flame,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Download,
  Smartphone,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { Manga, Genre, SiteSettings } from '../../types';
import { MangaCard } from '../../components/manga/MangaCard';
import { Button } from '../../components/ui/Button';
import { getAssetUrl } from '../../services/api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [featured, setFeatured] = useState<Manga[]>([]);
  const [trending, setTrending] = useState<Manga[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const data = await mangaService.getHomeData();
        setSiteSettings(data.siteSettings);
        setFeatured(data.featured);
        setTrending(data.trending);
        setLatestUpdates(data.latestUpdates);
        setGenres(data.genres);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHome();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularTags = ['Action', 'Fantasy', 'Shadow Monarch', 'Moonlit Blade', 'Supernatural', 'Romance'];

  const brandTitle = siteSettings?.siteName || 'MangaVerse';

  return (
    <div className="space-y-16 pb-16 overflow-hidden">
      {/* Cinematic Hero Section - Recreating Screenshot 3 Visual Direction */}
      <section className="relative pt-8 pb-16 sm:py-20 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 border-b border-dark-800/80">
        {/* Ambient Backlight Glows */}
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left / Center Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 border border-brand-500/30 text-brand-300">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Next Generation Manga Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Discover Your Next <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-brand-300">
                  Favorite Manga
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Immerse yourself in thousands of high resolution chapters with our distraction-free reader, automatic reading progress, and downloadable PDFs.
              </p>

              {/* Big Prominent Search Field */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto lg:mx-0">
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or genre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-900/95 border border-dark-700/90 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-slate-400 shadow-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 transition-all"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="absolute right-2 px-5 py-2 text-xs rounded-xl shadow-none"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {/* Popular Search Suggestions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Trending:
                </span>
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-dark-750 transition-colors text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Right Visual: High-Impact Anime Artwork */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-brand-900/30 border border-dark-700/80 group">
                <img
                  src="/images/hero-character.jpg"
                  alt="Manga Artwork Banner"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300 bg-brand-500/30 px-2 py-0.5 rounded border border-brand-400/30">
                    Featured Spotlight
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-2">
                    {featured[0]?.title || 'Moonlit Blade: Chronicle of the Cherry Blossom'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {featured[0]?.synopsis || 'Under the blood-red moon of Kyoto, a masterless swordsman protects the sacred shrine.'}
                  </p>
                  <Link
                    to={featured[0] ? `/manga/${featured[0].slug}` : '/manga'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 mt-3"
                  >
                    Read Chapter 1 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Now Ranked Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Trending Now</h2>
              <p className="text-xs text-slate-400">Top ranked manga readers are devouring this week</p>
            </div>
          </div>
          <Link to="/manga?sort=popular" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {trending.slice(0, 5).map((manga, idx) => (
            <MangaCard key={manga.slug} manga={{ ...manga, rank: idx + 1 }} showRank />
          ))}
        </div>
      </section>

      {/* Browse by Genre Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Browse by Genre</h2>
              <p className="text-xs text-slate-400">Discover manga tailored to your preferred themes</p>
            </div>
          </div>
          <Link to="/genres" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            All categories <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {genres.slice(0, 12).map((g) => (
            <Link
              key={g.slug}
              to={`/manga?genre=${encodeURIComponent(g.name)}`}
              className="p-4 rounded-2xl bg-dark-900 border border-dark-750/70 hover:border-brand-500/50 hover:bg-dark-850 transition-all text-center group"
            >
              <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                {g.name}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Explore titles</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Latest Chapter Updates</h2>
              <p className="text-xs text-slate-400">Fresh chapters released and ready to read</p>
            </div>
          </div>
          <Link to="/manga?sort=latest" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all releases <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestUpdates.slice(0, 6).map((update, idx) => (
            <Link
              key={idx}
              to={`/manga/${update.mangaSlug}/chapter/${update.chapterNumber}`}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-dark-900 border border-dark-750/70 hover:border-brand-500/50 hover:bg-dark-850/80 transition-all group"
            >
              <img
                src={getAssetUrl(update.coverUrl)}
                alt={update.mangaTitle}
                className="w-14 h-18 object-cover rounded-xl shadow shrink-0 bg-dark-800"
              />
              <div className="overflow-hidden flex-1">
                <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                  Chapter {update.chapterNumber}
                </span>
                <h4 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors truncate mt-1.5">
                  {update.mangaTitle}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {update.chapterTitle || `Episode ${update.chapterNumber}`}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(update.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Reader Promotion & Offline Downloads Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-dark-750 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
            <img
              src="/images/banner-swordsman.jpg"
              alt="Background Texture"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="max-w-xl space-y-4 relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-300 bg-brand-500/20 px-2.5 py-1 rounded-full border border-brand-500/30">
              Premium Reading Experience
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Read Anywhere, Anytime with Instant PDF Downloads
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Enjoy continuous vertical webtoon mode on mobile, automatic progress tracking, and compiled PDF downloads for uninterrupted offline reading.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/manga">
                <Button variant="primary" size="md">
                  Browse Catalog
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="md">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
