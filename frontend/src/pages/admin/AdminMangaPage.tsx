import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, Eye, Check, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Manga } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { getAssetUrl } from '../../services/api';

export const AdminMangaPage: React.FC = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    slug: '',
    synopsis: '',
    author: '',
    artist: '',
    genres: 'Action, Fantasy',
    status: 'ongoing' as 'ongoing' | 'completed' | 'hiatus',
    contentRating: 'safe' as 'safe' | 'suggestive' | 'mature',
  });

  const fetchManga = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listManga(1, 50);
      setMangaList(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManga();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      originalTitle: '',
      slug: '',
      synopsis: '',
      author: '',
      artist: '',
      genres: 'Action, Fantasy',
      status: 'ongoing',
      contentRating: 'safe',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (m: Manga) => {
    setSelectedManga(m);
    setFormData({
      title: m.title,
      originalTitle: m.originalTitle || '',
      slug: m.slug,
      synopsis: m.synopsis,
      author: m.author,
      artist: m.artist,
      genres: m.genres ? m.genres.join(', ') : 'Action',
      status: m.status,
      contentRating: m.contentRating || 'safe',
    });
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.createManga({
        ...formData,
        genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
      });
      setIsCreateOpen(false);
      fetchManga();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create manga');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManga) return;
    setIsSubmitting(true);
    try {
      const mangaId = selectedManga.id || selectedManga._id;
      if (!mangaId) throw new Error('Invalid manga id');
      await adminService.updateManga(mangaId, {
        ...formData,
        genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
      });
      setIsEditOpen(false);
      fetchManga();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update manga');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Manga) => {
    const mangaId = m.id || m._id;
    if (!mangaId) return;
    if (!confirm(`Are you sure you want to permanently delete "${m.title}" and all its chapters/files?`)) {
      return;
    }
    try {
      await adminService.deleteManga(mangaId);
      fetchManga();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete manga');
    }
  };

  const handleTogglePublish = async (m: Manga) => {
    const mangaId = m.id || m._id;
    if (!mangaId) return;
    try {
      await adminService.togglePublish(mangaId);
      fetchManga();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle publication');
    }
  };

  const handleUploadCover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManga || !coverFile) return;
    setIsSubmitting(true);
    try {
      const mangaId = selectedManga.id || selectedManga._id;
      if (!mangaId) throw new Error('Invalid manga id');
      await adminService.uploadCover(mangaId, coverFile);
      setIsCoverModalOpen(false);
      setCoverFile(null);
      fetchManga();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload cover');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Manga Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage manga catalog, covers, metadata, and visibility.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          New Manga
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-850/80 border-b border-dark-750 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Manga</th>
                <th className="py-3 px-4">Author / Artist</th>
                <th className="py-3 px-4">Genres</th>
                <th className="py-3 px-4">Chapters</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Published</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading manga records...
                  </td>
                </tr>
              ) : mangaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No manga registered yet. Click "New Manga" to create one.
                  </td>
                </tr>
              ) : (
                mangaList.map((m) => (
                  <tr key={m.slug} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={getAssetUrl(m.coverUrl)}
                        alt={m.title}
                        className="w-9 h-12 object-cover rounded-lg shadow bg-dark-800 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white text-xs">{m.title}</p>
                        <p className="text-[10px] text-slate-500">{m.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <p>{m.author}</p>
                      <p className="text-[10px] text-slate-500">{m.artist}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {m.genres?.slice(0, 3).map((g) => (
                          <span key={g} className="bg-dark-800 text-[10px] px-1.5 py-0.5 rounded border border-dark-700">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{m.chapterCount || 0}</td>
                    <td className="py-3 px-4">
                      <Badge variant={m.status === 'completed' ? 'green' : 'purple'} size="sm">
                        {m.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(m)}
                        title={m.isPublished ? 'Click to Unpublish' : 'Click to Publish'}
                        className={`p-1 rounded-lg transition-colors ${
                          m.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {m.isPublished ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedManga(m);
                          setIsCoverModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Upload Cover"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                        title="Edit Manga"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Manga"
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

      {/* Create / Edit Manga Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }}
        title={isCreateOpen ? 'Create New Manga' : `Edit "${selectedManga?.title}"`}
        maxWidth="2xl"
      >
        <form onSubmit={isCreateOpen ? handleCreate : handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <Input
              label="Original Title (Optional)"
              value={formData.originalTitle}
              onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Slug (URL identifier)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              required
            />
            <Input
              label="Genres (Comma separated)"
              value={formData.genres}
              onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
              placeholder="Action, Fantasy, Romance"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
            <Input
              label="Artist"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Content Rating
              </label>
              <select
                value={formData.contentRating}
                onChange={(e) => setFormData({ ...formData, contentRating: e.target.value as any })}
                className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="safe">Safe</option>
                <option value="suggestive">Suggestive</option>
                <option value="mature">Mature</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Synopsis
            </label>
            <textarea
              rows={4}
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 p-3 text-sm outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isCreateOpen ? 'Create Manga' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Cover Modal */}
      <Modal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        title={`Upload Cover: ${selectedManga?.title}`}
      >
        <form onSubmit={handleUploadCover} className="space-y-4">
          <p className="text-xs text-slate-400">
            Upload a high quality cover image (JPEG, PNG, or WEBP). It will be saved into MongoDB Atlas GridFS storage.
          </p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files ? e.target.files[0] : null)}
            className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
            <Button type="button" variant="secondary" onClick={() => setIsCoverModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!coverFile}>
              Upload to GridFS
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
