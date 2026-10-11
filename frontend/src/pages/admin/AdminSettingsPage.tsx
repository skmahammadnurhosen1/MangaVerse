import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SiteSettings } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [siteName, setSiteName] = useState('MangaVerse');
  const [siteDescription, setSiteDescription] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminService.getSettings();
        setSettings(data);
        setSiteName(data.siteName || 'MangaVerse');
        setSiteDescription(data.siteDescription || '');
        setAnnouncement(data.announcement || '');
        setContactEmail(data.contactEmail || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSavedSuccess(false);
    try {
      const updated = await adminService.updateSettings({
        siteName,
        siteDescription,
        announcement,
        contactEmail,
      });
      setSettings(updated.settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Website Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure branding, announcements, and contact details displayed across the public portal.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Site settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-750 rounded-2xl p-6 space-y-5 shadow-lg">
        <Input
          label="Site Name / Brand"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="e.g. MangaVerse"
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Site Description
          </label>
          <textarea
            rows={3}
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 p-3 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Homepage Announcement Banner
          </label>
          <textarea
            rows={2}
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full bg-dark-950 text-white rounded-xl border border-dark-700 p-3 text-sm outline-none focus:border-brand-500"
          />
        </div>

        <Input
          label="Support / Contact Email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="admin@example.com"
        />

        <div className="pt-4 border-t border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Sensitive environment credentials remain protected on the backend</span>
          </div>
          <Button type="submit" variant="primary" isLoading={isSubmitting} icon={<Save className="w-4 h-4" />}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
