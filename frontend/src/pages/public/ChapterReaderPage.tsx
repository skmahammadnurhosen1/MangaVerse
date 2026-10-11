import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { mangaService } from '../../services/mangaService';
import { MangaReader } from '../../components/reader/MangaReader';
import { Button } from '../../components/ui/Button';

export const ChapterReaderPage: React.FC = () => {
  const { slug, chapterNumber } = useParams<{ slug: string; chapterNumber: string }>();

  const [data, setData] = useState<{
    manga: any;
    chapter: any;
    navigation: any;
    userProgress: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !chapterNumber) return;
    const num = parseFloat(chapterNumber);

    const loadChapter = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await mangaService.getChapter(slug, num);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };
    loadChapter();
  }, [slug, chapterNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-dark-900 border border-dark-750 p-8 rounded-3xl">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Chapter Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'This chapter could not be found.'}</p>
          <Link to={slug ? `/manga/${slug}` : '/manga'}>
            <Button variant="primary" size="sm">Back to Manga Info</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MangaReader
      manga={data.manga}
      chapter={data.chapter}
      navigation={data.navigation}
      initialPage={data.userProgress?.lastPage || 1}
    />
  );
};
