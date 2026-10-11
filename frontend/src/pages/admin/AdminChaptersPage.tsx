import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, FileText, CheckCircle2, Layers } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Manga, Chapter } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export const AdminChaptersPage: React.FC = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pageFiles, setPageFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);

  // Create Form
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [volume, setVolume] = useState<number | ''>('');

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const data = await adminService.listManga(1, 100);
        setMangaList(data.items);
        if (data.items.length > 0) {
          const firstId = data.items[0].id || data.items[0]._id || '';
          setSelectedMangaId(firstId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchManga();
  }, []);

  const fetchChapters = async (mangaId: string) => {
    if (!mangaId) return;
    setIsLoading(true);
    try {
      const data = await adminService.listChapters(mangaId);
      setChapters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMangaId) {
      fetchChapters(selectedMangaId);
    }
  }, [selectedMangaId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMangaId) return;
    setIsSubmitting(true);
    try {
      await adminService.createChapter({
        mangaId: selectedMangaId,
        chapterNumber,
        title: chapterTitle,
        volume: volume === '' ? null : volume,
      });
      setIsCreateOpen(false);
      setChapterTitle('');
      fetchChapters(selectedMangaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter || !pageFiles || pageFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      const chapterId = selectedChapter.id || selectedChapter._id;
      if (!chapterId) throw new Error('Invalid chapter id');
      await adminService.uploadPages(chapterId, Array.from(pageFiles));
      setIsUploadOpen(false);
      setPageFiles(null);
      fetchChapters(selectedMangaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload chapter pages');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePdf = async (chapter: Chapter) => {
    const chapterId = chapter.id || chapter._id;
    if (!chapterId) return;
    setPdfGeneratingId(chapterId);
    try {
      await adminService.generatePdf(chapterId);
      alert('Chapter PDF successfully generated and saved to GridFS!');
      fetchChapters(selectedMangaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setPdfGeneratingId(null);
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    const chapterId = chapter.id || chapter._id;
    if (!chapterId) return;
    if (!confirm(`Permanently delete Chapter ${chapter.chapterNumber} and all its page files?`)) {
      return;
    }
    try {
      await adminService.deleteChapter(chapterId);
      fetchChapters(selectedMangaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete chapter');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Chapter Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Upload pages, order chapters, and generate PDF downloads.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // Find next chapter number
            const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1;
            setChapterNumber(nextNum);
            setIsCreateOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          disabled={!selectedMangaId}
        >
          New Chapter
        </Button>
      </div>

      {/* Manga Selector Bar */}
      <div className="bg-dark-900 border border-dark-750 p-4 rounded-2xl flex items-center gap-3">
        <label htmlFor="manga-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider shrink-0">
          Select Manga:
        </label>
        <select
          id="manga-select"
          value={selectedMangaId}
          onChange={(e) => setSelectedMangaId(e.target.value)}
          aria-label="Select manga to manage chapters"
          className="bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-sm max-w-md outline-none focus:border-brand-500"
        >
          {mangaList.map((m) => (
            <option key={m.slug} value={m.id || m._id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Chapters Table */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-850/80 border-b border-dark-750 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Chapter #</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4 text-center">Pages</th>
                <th className="py-3 px-4 text-center">PDF Download</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading chapters...
                  </td>
                </tr>
              ) : chapters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No chapters published for this manga yet. Click "New Chapter" to create one.
                  </td>
                </tr>
              ) : (
                chapters.map((c) => (
                  <tr key={c.chapterNumber} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white text-xs">Chapter {c.chapterNumber}</td>
                    <td className="py-3 px-4 text-slate-300">{c.title || '-'}</td>
                    <td className="py-3 px-4 text-slate-400">{c.volume ? `Vol. ${c.volume}` : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-white bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                        {c.pageCount ?? c.pages?.length ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.hasPdf || c.downloadAvailable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Available
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Not compiled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="green" size="sm">
                        {c.publicationStatus || 'published'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedChapter(c);
                          setIsUploadOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Upload Page Images"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleGeneratePdf(c)}
                        disabled={pdfGeneratingId === (c.id || c._id)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Compile PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Chapter Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Chapter">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Chapter Number"
            type="number"
            step="0.1"
            value={chapterNumber}
            onChange={(e) => setChapterNumber(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Chapter Title (Optional)"
            placeholder="e.g. The Awakening"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />
          <Input
            label="Volume Number (Optional)"
            type="number"
            value={volume}
            onChange={(e) => setVolume(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Chapter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Pages Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={`Upload Pages: Chapter ${selectedChapter?.chapterNumber}`}
      >
        <form onSubmit={handleUploadPages} className="space-y-4">
          <p className="text-xs text-slate-400">
            Select ordered manga chapter image files (JPEG, PNG, or WEBP). Files are uploaded directly to MongoDB Atlas GridFS.
          </p>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPageFiles(e.target.files)}
            className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
            required
          />

          {pageFiles && pageFiles.length > 0 && (
            <div className="p-3 bg-dark-950 border border-dark-750 rounded-xl text-xs text-brand-300">
              Selected <strong>{pageFiles.length}</strong> pages ready for upload.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
            <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!pageFiles || pageFiles.length === 0}>
              Upload Pages
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
