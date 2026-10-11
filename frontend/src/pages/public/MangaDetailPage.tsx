import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  BookOpen,
  Bookmark,
  Share2,
  Download,
  Calendar,
  User as UserIcon,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { useAuth } from '../../contexts/AuthContext';
import { Manga, Chapter, Comment } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MangaCard } from '../../components/manga/MangaCard';
import { getAssetUrl } from '../../services/api';

export const MangaDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [related, setRelated] = useState<Manga[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userProgress, setUserProgress] = useState<any | null>(null);
  const [bookmarkStatus, setBookmarkStatus] = useState<string | null>(null);
  const [isBookmarkDropdownOpen, setIsBookmarkDropdownOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentRating, setCommentRating] = useState<number>(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchManga = async () => {
      setIsLoading(true);
      try {
        const data = await mangaService.getMangaBySlug(slug);
        setManga(data.manga);
        setChapters(data.chapters);
        setRelated(data.related);
        setUserProgress(data.userProgress || null);

        // Fetch comments
        const mangaId = data.manga.id || data.manga._id;
        if (mangaId) {
          const commData = await mangaService.getComments(mangaId);
          setComments(commData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchManga();
  }, [slug]);

  // Check user bookmark if logged in
  useEffect(() => {
    if (!user || !manga) return;
    const checkBookmark = async () => {
      try {
        const bookmarks = await mangaService.getBookmarks();
        const mangaId = manga.id || manga._id;
        const found = bookmarks.find((b) => (b.manga.id || b.manga._id) === mangaId);
        if (found) setBookmarkStatus(found.status);
      } catch {}
    };
    checkBookmark();
  }, [user, manga]);

  const handleSetBookmark = async (status: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const mangaId = manga?.id || manga?._id;
    if (!mangaId) return;

    try {
      await mangaService.setBookmark(mangaId, status);
      setBookmarkStatus(status);
      setIsBookmarkDropdownOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update bookmark');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const mangaId = manga?.id || manga?._id;
    if (!mangaId || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await mangaService.postComment({
        mangaId,
        content: newCommentText.trim(),
        rating: commentRating,
      });
      setComments([res.comment, ...comments]);
      setNewCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await mangaService.reportComment(commentId);
      alert('Comment reported to moderators. Thank you for keeping the community safe.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to report comment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4">
        <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Manga Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The requested manga title does not exist or may have been unpublished.</p>
        <Link to="/manga">
          <Button variant="primary">Browse All Manga</Button>
        </Link>
      </div>
    );
  }

  const sortedChapters = [...chapters].sort((a, b) =>
    sortOrder === 'desc' ? b.chapterNumber - a.chapterNumber : a.chapterNumber - b.chapterNumber
  );

  const firstChapter = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber)[0];

  return (
    <div className="space-y-12 pb-16">
      {/* Header Backdrop & Meta */}
      <div className="relative bg-gradient-to-b from-dark-900 to-dark-950 border-b border-dark-800/80 pt-8 pb-12">
        {/* Subtle Backdrop Image */}
        <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none">
          <img
            src={getAssetUrl(manga.bannerUrl || manga.coverUrl)}
            alt="Banner backdrop"
            className="w-full h-full object-cover blur-md"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Cover Column */}
            <div className="md:col-span-4 lg:col-span-3 flex justify-center">
              <div className="w-48 sm:w-56 md:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-dark-700/80 bg-dark-850 relative group">
                <img
                  src={getAssetUrl(manga.coverUrl)}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Details Column */}
            <div className="md:col-span-8 lg:col-span-9 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={manga.status === 'completed' ? 'green' : 'purple'} size="md">
                    {manga.status}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-400">Language: {manga.language?.toUpperCase() || 'EN'}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {manga.title}
                </h1>
                {manga.originalTitle && (
                  <p className="text-sm font-medium text-slate-400">{manga.originalTitle}</p>
                )}
              </div>

              {/* Author, Artist, Rating Info */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Author</span>
                  <span className="font-bold text-white">{manga.author}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Artist</span>
                  <span className="font-bold text-white">{manga.artist}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Rating</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {manga.rating ? manga.rating.toFixed(2) : '5.00'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Total Chapters</span>
                  <span className="font-bold text-white">{chapters.length}</span>
                </div>
              </div>

              {/* Genre Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {manga.genres?.map((g) => (
                  <Link
                    key={g}
                    to={`/manga?genre=${encodeURIComponent(g)}`}
                    className="text-xs font-medium text-slate-300 bg-dark-850 hover:bg-dark-800 px-3 py-1 rounded-xl border border-dark-700/80 transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl whitespace-pre-line">
                  {manga.synopsis}
                </p>
              </div>

              {/* Action Buttons: Continue Reading, Read Chapter 1, Bookmark Dropdown */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {userProgress && (
                  <Link to={`/manga/${manga.slug}/chapter/${userProgress.chapterNumber}`}>
                    <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                      Continue (Ch. {userProgress.chapterNumber}{userProgress.lastPage > 1 ? `, P. ${userProgress.lastPage}` : ''})
                    </Button>
                  </Link>
                )}

                {firstChapter && (!userProgress || userProgress.chapterNumber !== firstChapter.chapterNumber) && (
                  <Link to={`/manga/${manga.slug}/chapter/${firstChapter.chapterNumber}`}>
                    <Button variant={userProgress ? "secondary" : "primary"} size="md" icon={<BookOpen className="w-4 h-4" />}>
                      Read Chapter 1
                    </Button>
                  </Link>
                )}

                {/* Bookmark Dropdown */}
                <div className="relative">
                  <Button
                    variant={bookmarkStatus ? 'outline' : 'secondary'}
                    size="md"
                    onClick={() => setIsBookmarkDropdownOpen(!isBookmarkDropdownOpen)}
                    icon={<Bookmark className={`w-4 h-4 ${bookmarkStatus ? 'fill-brand-400 text-brand-400' : ''}`} />}
                  >
                    {bookmarkStatus ? `Bookmarked: ${bookmarkStatus.replace('_', ' ')}` : 'Add to Library'}
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>

                  {isBookmarkDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl py-1 z-30">
                      {(['reading', 'plan_to_read', 'completed', 'favorite'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleSetBookmark(st)}
                          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-dark-800 capitalize text-left"
                        >
                          <span>{st.replace('_', ' ')}</span>
                          {bookmarkStatus === st && <Check className="w-3.5 h-3.5 text-brand-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters & Community Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Chapter List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-dark-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" /> Available Chapters ({chapters.length})
            </h2>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Order: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          <div className="divide-y divide-dark-800 bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
            {chapters.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No chapters published yet.
              </div>
            ) : (
              sortedChapters.map((ch) => (
                <div
                  key={ch.chapterNumber}
                  className="flex items-center justify-between p-3.5 hover:bg-dark-850/60 transition-colors"
                >
                  <Link
                    to={`/manga/${manga.slug}/chapter/${ch.chapterNumber}`}
                    className="flex-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                        Chapter {ch.chapterNumber}
                      </span>
                      {ch.title && (
                        <span className="text-xs text-slate-400 truncate max-w-sm">
                          - {ch.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ch.publishedAt).toLocaleDateString()}
                    </span>
                  </Link>

                  {/* PDF Download link */}
                  <a
                    href={`/api/manga/${manga.slug}/chapters/${ch.chapterNumber}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Download Chapter PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px] font-semibold">PDF</span>
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Comment & Review Section */}
          <div className="pt-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Reader Discussions ({comments.length})
            </h3>

            {/* Post Comment Box */}
            <form onSubmit={handlePostComment} className="bg-dark-900 border border-dark-750 p-4 rounded-2xl space-y-3">
              <textarea
                rows={3}
                placeholder={user ? "Share your thoughts about this series..." : "Sign in to join the discussion..."}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={!user}
                className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 p-3 text-xs outline-none focus:border-brand-500 disabled:opacity-50"
                required
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Rating:</span>
                  <select
                    value={commentRating}
                    onChange={(e) => setCommentRating(parseInt(e.target.value, 10))}
                    disabled={!user}
                    className="bg-dark-950 text-white border border-dark-700 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingComment}
                  disabled={!user || !newCommentText.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </form>

            {/* Comment List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No comments posted yet. Be the first to start the discussion!</p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="p-4 rounded-2xl bg-dark-900 border border-dark-750/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-dark-750 text-brand-300 text-[10px] font-bold flex items-center justify-center uppercase">
                          {comm.user.username.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-white">{comm.user.username}</span>
                        {comm.rating && (
                          <span className="text-[10px] text-amber-300 font-bold">★ {comm.rating}.0</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">{new Date(comm.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleReportComment(comm.id)}
                          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                          title="Report comment"
                        >
                          Report
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{comm.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-base font-bold text-white">Recommended for You</h3>
          <div className="grid grid-cols-2 gap-3">
            {related.slice(0, 4).map((m) => (
              <MangaCard key={m.slug} manga={m} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
