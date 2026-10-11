import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Genre } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const AdminGenresPage: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGenres = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listGenres();
      setGenres(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleOpenCreate = () => {
    setSelectedGenre(null);
    setName('');
    setSlug('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Genre) => {
    setSelectedGenre(g);
    setName(g.name);
    setSlug(g.slug);
    setDescription(g.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedGenre) {
        const genreId = selectedGenre.id || selectedGenre._id;
        if (!genreId) throw new Error('Invalid genre id');
        await adminService.updateGenre(genreId, { name, slug, description });
      } else {
        await adminService.createGenre({ name, slug, description });
      }
      setIsModalOpen(false);
      fetchGenres();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (g: Genre) => {
    const genreId = g.id || g._id;
    if (!genreId) return;
    if (!confirm(`Delete genre "${g.name}"?`)) return;
    try {
      await adminService.deleteGenre(genreId);
      fetchGenres();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete genre');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Genre Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage manga genres, tags, and category descriptions.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          New Genre
        </Button>
      </div>

      <div className="bg-dark-900 border border-dark-750 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-dark-850/80 border-b border-dark-750 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    Loading genres...
                  </td>
                </tr>
              ) : genres.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    No genres defined yet.
                  </td>
                </tr>
              ) : (
                genres.map((g) => (
                  <tr key={g.slug} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{g.name}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{g.slug}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-md truncate">{g.description || '-'}</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                        title="Edit Genre"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Genre"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGenre ? `Edit Genre: ${selectedGenre.name}` : 'Create New Genre'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Genre Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!selectedGenre) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            }}
            required
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 p-3 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {selectedGenre ? 'Save Changes' : 'Create Genre'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
