import { Request, Response } from 'express';
import { SiteSettings } from '../models/SiteSettings.js';
import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';

export class AdminSettingsController {
  /**
   * Retrieves current website settings.
   */
  static async getSettings(_req: Request, res: Response): Promise<void> {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({
        siteName: 'MangaVerse',
        siteDescription: 'Discover and read your favorite manga online in high quality for free.',
        announcement: 'Welcome to MangaVerse! Enjoy thousands of chapters with our fast, modern reader.',
        contactEmail: 'admin@mangaverse.example',
      });
      await settings.save();
    }

    res.json({ settings });
  }

  /**
   * Updates public website settings.
   */
  static async updateSettings(req: Request, res: Response): Promise<void> {
    const { siteName, siteDescription, announcement, contactEmail, logoUrl, maintenanceMode, bannerImages } = req.body;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings();
    }

    if (siteName !== undefined) settings.siteName = siteName;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (announcement !== undefined) settings.announcement = announcement;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (bannerImages !== undefined) settings.bannerImages = bannerImages;

    await settings.save();

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'UPDATE_SITE_SETTINGS',
        targetType: 'SETTINGS',
        details: { siteName: settings.siteName },
        ipAddress: getClientIp(req),
      });
    }

    res.json({ message: 'Website settings updated successfully', settings });
  }
}
