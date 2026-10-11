import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Download,
  Settings,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';
import { Chapter, Manga } from '../../types';
import { mangaService } from '../../services/mangaService';
import { getAssetUrl } from '../../services/api';
import { Button } from '../ui/Button';

interface MangaReaderProps {
  manga: { id: string; title: string; slug: string; status: string };
  chapter: Chapter;
  navigation: {
    previous: { chapterNumber: number; title: string } | null;
    next: { chapterNumber: number; title: string } | null;
    allChapters: { chapterNumber: number; title: string }[];
  };
  initialPage?: number;
}

export const MangaReader: React.FC<MangaReaderProps> = ({
  manga,
  chapter,
  navigation,
  initialPage = 1,
}) => {
  const navigate = useNavigate();
  const pages = chapter.pages || [];

  // Reading settings
  const [readingMode, setReadingMode] = useState<'webtoon' | 'single' | 'double'>('webtoon');
  const [readingDirection, setReadingDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save reading progress (debounced)
  const saveProgress = useCallback(
    (page: number) => {
      mangaService.saveProgress({
        mangaId: manga.id,
        chapterId: chapter.id,
        chapterNumber: chapter.chapterNumber,
        lastPage: page,
        completed: page >= pages.length,
      }).catch(() => {
        // Silently ignore if unauthenticated
      });
    },
    [manga.id, chapter.id, chapter.chapterNumber, pages.length]
  );

  useEffect(() => {
    saveProgress(currentPage);
  }, [currentPage, saveProgress]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'ArrowRight') {
        if (readingDirection === 'rtl') prevPage();
        else nextPage();
      } else if (e.key === 'ArrowLeft') {
        if (readingDirection === 'rtl') nextPage();
        else prevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, readingDirection, readingMode, pages.length]);

  const nextPage = () => {
    if (readingMode === 'double') {
      if (currentPage + 2 <= pages.length) setCurrentPage(currentPage + 2);
      else if (navigation.next) navigateToChapter(navigation.next.chapterNumber);
    } else {
      if (currentPage < pages.length) setCurrentPage(currentPage + 1);
      else if (navigation.next) navigateToChapter(navigation.next.chapterNumber);
    }
  };

  const prevPage = () => {
    if (readingMode === 'double') {
      if (currentPage - 2 >= 1) setCurrentPage(currentPage - 2);
      else if (navigation.previous) navigateToChapter(navigation.previous.chapterNumber);
    } else {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
      else if (navigation.previous) navigateToChapter(navigation.previous.chapterNumber);
    }
  };

  const navigateToChapter = (chapterNum: number) => {
    navigate(`/manga/${manga.slug}/chapter/${chapterNum}`);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const downloadUrl = `/api/manga/${manga.slug}/chapters/${chapter.chapterNumber}/download`;
      window.open(downloadUrl, '_blank');
    } catch {
      alert('Failed to trigger chapter download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col relative select-none">
      {/* Top Floating Control Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-dark-950/90 backdrop-blur-xl border-b border-dark-750/80 px-4 py-2.5 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back & Chapter Info */}
          <div className="flex items-center gap-3">
            <Link
              to={`/manga/${manga.slug}`}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
              title="Back to Manga details"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs">{manga.title}</h2>
              <p className="text-[11px] text-brand-300 font-medium">Chapter {chapter.chapterNumber}</p>
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={chapter.chapterNumber}
              onChange={(e) => navigateToChapter(parseFloat(e.target.value))}
              aria-label="Select chapter"
              className="bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-brand-500"
            >
              {navigation.allChapters.map((c) => (
                <option key={c.chapterNumber} value={c.chapterNumber}>
                  Ch. {c.chapterNumber} {c.title ? `- ${c.title}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reading Mode & Zoom & Download Controls */}
          <div className="flex items-center gap-2">
            {/* Download PDF button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={isDownloading}
              icon={<Download className="w-3.5 h-3.5 text-brand-400" />}
              className="hidden sm:inline-flex text-xs py-1"
            >
              PDF
            </Button>

            {/* Reading Mode Toggle */}
            <div className="hidden md:flex bg-dark-900 border border-dark-700/80 rounded-lg p-0.5">
              <button
                onClick={() => setReadingMode('webtoon')}
                className={`px-2 py-1 text-[11px] font-semibold rounded ${
                  readingMode === 'webtoon' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Webtoon
              </button>
              <button
                onClick={() => setReadingMode('single')}
                className={`px-2 py-1 text-[11px] font-semibold rounded ${
                  readingMode === 'single' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setReadingMode('double')}
                className={`px-2 py-1 text-[11px] font-semibold rounded ${
                  readingMode === 'double' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Double
              </button>
            </div>

            {/* Settings Dropdown Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              title="Reader Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reader Settings Modal / Drawer */}
      {isSettingsOpen && (
        <div className="fixed top-14 right-4 z-50 bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl p-4 w-72 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-dark-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-400" /> Reader Settings
            </span>
            <button onClick={() => setIsSettingsOpen(false)} className="text-xs text-slate-400 hover:text-white">
              Close
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Reading Layout
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['webtoon', 'single', 'double'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setReadingMode(m)}
                  className={`text-xs py-1.5 rounded-lg border capitalize font-medium ${
                    readingMode === m
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-dark-950 border-dark-700 text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Reading Direction
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setReadingDirection('ltr')}
                className={`text-xs py-1.5 rounded-lg border font-medium ${
                  readingDirection === 'ltr'
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-dark-950 border-dark-700 text-slate-300'
                }`}
              >
                Left to Right (Webtoon)
              </button>
              <button
                onClick={() => setReadingDirection('rtl')}
                className={`text-xs py-1.5 rounded-lg border font-medium ${
                  readingDirection === 'rtl'
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-dark-950 border-dark-700 text-slate-300'
                }`}
              >
                Right to Left (Manga)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Zoom: {zoomLevel}%
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))}
                className="p-1 rounded bg-dark-950 border border-dark-700 text-slate-300"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="60"
                max="160"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 10))}
                className="p-1 rounded bg-dark-950 border border-dark-700 text-slate-300"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Viewport */}
      <main
        ref={containerRef}
        onClick={() => setShowControls(!showControls)}
        className="flex-1 flex flex-col items-center justify-center pt-16 pb-20 overflow-x-hidden min-h-screen cursor-pointer"
      >
        {pages.length === 0 ? (
          <div className="text-center p-12 max-w-md bg-dark-900 border border-dark-800 rounded-2xl my-auto">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No pages uploaded yet</h3>
            <p className="text-xs text-slate-400 mb-4">
              This chapter does not have published page assets in the storage system.
            </p>
            <Link to={`/manga/${manga.slug}`}>
              <Button variant="secondary" size="sm">Back to Chapters</Button>
            </Link>
          </div>
        ) : readingMode === 'webtoon' ? (
          /* Continuous Vertical Webtoon Mode */
          <div
            className="flex flex-col items-center w-full transition-all duration-200"
            style={{ maxWidth: `${Math.round(850 * (zoomLevel / 100))}px` }}
          >
            {pages.map((p, idx) => (
              <div key={p.pageNumber || idx} className="w-full relative bg-dark-950 mb-0">
                <img
                  src={getAssetUrl(p.imageUrl)}
                  alt={`Page ${p.pageNumber}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto block select-none pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/hero-character.jpg';
                  }}
                />
              </div>
            ))}
          </div>
        ) : readingMode === 'single' ? (
          /* Single Page Mode */
          <div
            className="flex items-center justify-center max-w-full px-2"
            style={{ width: `${Math.round(900 * (zoomLevel / 100))}px` }}
          >
            {pages[currentPage - 1] && (
              <img
                src={getAssetUrl(pages[currentPage - 1].imageUrl)}
                alt={`Page ${currentPage}`}
                className="max-h-[90vh] w-auto object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero-character.jpg';
                }}
              />
            )}
          </div>
        ) : (
          /* Double Page Mode */
          <div
            className="flex items-center justify-center gap-2 max-w-full px-2"
            style={{ width: `${Math.round(1400 * (zoomLevel / 100))}px` }}
          >
            {/* If RTL, left page is next and right page is current */}
            {readingDirection === 'rtl' ? (
              <>
                {pages[currentPage] && (
                  <img
                    src={getAssetUrl(pages[currentPage].imageUrl)}
                    alt={`Page ${currentPage + 1}`}
                    className="max-h-[90vh] w-1/2 object-contain rounded-lg shadow-2xl"
                  />
                )}
                {pages[currentPage - 1] && (
                  <img
                    src={getAssetUrl(pages[currentPage - 1].imageUrl)}
                    alt={`Page ${currentPage}`}
                    className="max-h-[90vh] w-1/2 object-contain rounded-lg shadow-2xl"
                  />
                )}
              </>
            ) : (
              <>
                {pages[currentPage - 1] && (
                  <img
                    src={getAssetUrl(pages[currentPage - 1].imageUrl)}
                    alt={`Page ${currentPage}`}
                    className="max-h-[90vh] w-1/2 object-contain rounded-lg shadow-2xl"
                  />
                )}
                {pages[currentPage] && (
                  <img
                    src={getAssetUrl(pages[currentPage].imageUrl)}
                    alt={`Page ${currentPage + 1}`}
                    className="max-h-[90vh] w-1/2 object-contain rounded-lg shadow-2xl"
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation Controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-dark-950/90 backdrop-blur-xl border-t border-dark-750/80 px-4 py-3 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1 && !navigation.previous}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Prev
          </Button>

          {/* Page Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            {readingMode === 'webtoon' ? (
              <span>Continuous Scroll ({pages.length} Pages)</span>
            ) : (
              <>
                <span>
                  Page {currentPage} of {pages.length}
                </span>
                <input
                  type="range"
                  min="1"
                  max={pages.length}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                  className="w-24 accent-brand-500 cursor-pointer"
                />
              </>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={nextPage}
            disabled={currentPage >= pages.length && !navigation.next}
            className="flex-row-reverse"
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
