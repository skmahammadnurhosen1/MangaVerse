import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Manga } from '../src/models/Manga.js';
import { Chapter } from '../src/models/Chapter.js';
import { Genre } from '../src/models/Genre.js';
import { SiteSettings } from '../src/models/SiteSettings.js';

const SAMPLE_GENRES = [
  { name: 'Action', slug: 'action', description: 'Action-packed stories filled with dynamic battles and intense martial arts.' },
  { name: 'Fantasy', slug: 'fantasy', description: 'Magical realms, mythical creatures, and wondrous adventures.' },
  { name: 'Romance', slug: 'romance', description: 'Heartfelt emotional bonds, love stories, and relationships.' },
  { name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic technologies, cyberpunk cities, and space exploration.' },
  { name: 'Supernatural', slug: 'supernatural', description: 'Mystic powers, spirits, exorcists, and hidden worlds.' },
  { name: 'Adventure', slug: 'adventure', description: 'Epic journeys across vast continents and dangerous dungeons.' },
  { name: 'Comedy', slug: 'comedy', description: 'Humorous encounters, parody, and entertaining antics.' },
  { name: 'Drama', slug: 'drama', description: 'Compelling character developments and emotional storylines.' },
];

const SAMPLE_MANGA = [
  {
    title: 'Shadow Monarch: The Awakening',
    originalTitle: '그림자의 군주',
    slug: 'shadow-monarch-the-awakening',
    synopsis: 'In a world where mysterious gates opened connecting dimensions, hunters with supernatural abilities protect mankind. An ordinary E-rank hunter on the brink of death discovers a hidden quest system that transforms him into the legendary Shadow Monarch.',
    author: 'Chugong',
    artist: 'DUBU (REDICE)',
    genres: ['Action', 'Fantasy', 'Adventure'],
    status: 'ongoing',
    contentRating: 'safe',
    language: 'en',
    rating: 4.95,
    ratingCount: 1420,
    viewCount: 245000,
    featured: true,
    isPublished: true,
  },
  {
    title: 'Moonlit Blade: Chronicle of the Cherry Blossom',
    originalTitle: '月下の剣士',
    slug: 'moonlit-blade-chronicle-of-the-cherry-blossom',
    synopsis: 'Under the blood-red moon of Kyoto, a masterless swordsman protects the shrine of the fallen maiden. Armed only with a cursed katana and ancient cherry blossom techniques, he stands against the demonic clans.',
    author: 'Ryunosuke K.',
    artist: 'Hoshino M.',
    genres: ['Action', 'Supernatural', 'Drama'],
    status: 'ongoing',
    contentRating: 'safe',
    language: 'en',
    rating: 4.88,
    ratingCount: 980,
    viewCount: 182000,
    featured: true,
    isPublished: true,
  },
  {
    title: 'Celestial Empress of the Lotus Palace',
    originalTitle: '九天玄女',
    slug: 'celestial-empress-of-the-lotus-palace',
    synopsis: 'Reborn into the ancient imperial court with supreme martial memories, she rises from an abandoned concubine to the invincible sovereign of the celestial realm.',
    author: 'Feng Ling',
    artist: 'Bai Yue',
    genres: ['Fantasy', 'Romance', 'Drama'],
    status: 'ongoing',
    contentRating: 'safe',
    language: 'en',
    rating: 4.92,
    ratingCount: 1120,
    viewCount: 198000,
    featured: true,
    isPublished: true,
  },
  {
    title: 'Omniscient Reader: The Ruined World',
    originalTitle: '전지적 독자 시점',
    slug: 'omniscient-reader-the-ruined-world',
    synopsis: 'Only one person read a thousand chapters of an unpopular web novel to its conclusion. When the world transforms into the exact scenario of that novel, only he knows how the story ends.',
    author: 'sing N song',
    artist: 'Sleepy-C',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    status: 'ongoing',
    contentRating: 'safe',
    language: 'en',
    rating: 4.97,
    ratingCount: 2850,
    viewCount: 310000,
    featured: true,
    isPublished: true,
  },
  {
    title: 'Neon Cyberpunk: Zero Requiem',
    originalTitle: 'ネオン・ゼロ',
    slug: 'neon-cyberpunk-zero-requiem',
    synopsis: 'In Neo-Tokyo of 2145, augmented corporate mercenaries run the shadows. A rogue hacker with neural implants fights to expose the megacorp that stole her memories.',
    author: 'Kenji Sato',
    artist: 'Yuki Tanaka',
    genres: ['Sci-Fi', 'Action'],
    status: 'completed',
    contentRating: 'safe',
    language: 'en',
    rating: 4.79,
    ratingCount: 650,
    viewCount: 94000,
    featured: false,
    isPublished: true,
  },
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  console.log('[Seed] Seeding genres...');
  for (const g of SAMPLE_GENRES) {
    await Genre.findOneAndUpdate({ slug: g.slug }, g, { upsert: true });
  }

  console.log('[Seed] Seeding site settings...');
  await SiteSettings.findOneAndUpdate(
    {},
    {
      siteName: 'MangaVerse',
      siteDescription: 'Discover and read your favorite manga, manhwa, and manhua in high quality online.',
      announcement: 'Welcome to MangaVerse! Fast loading, high-definition artwork, and offline chapter downloads.',
      contactEmail: 'support@mangaverse.example',
      bannerImages: [
        {
          title: 'Moonlit Blade: Chronicle of the Cherry Blossom',
          subtitle: 'Read the latest trending epic chapter now',
          imageUrl: '/images/banner-swordsman.jpg',
          linkUrl: '/manga/moonlit-blade-chronicle-of-the-cherry-blossom',
          active: true,
        },
        {
          title: 'Celestial Empress of the Lotus Palace',
          subtitle: 'New chapters released every Friday',
          imageUrl: '/images/banner-heroine.jpg',
          linkUrl: '/manga/celestial-empress-of-the-lotus-palace',
          active: true,
        },
      ],
    },
    { upsert: true }
  );

  console.log('[Seed] Seeding sample manga titles and chapters...');
  for (const mData of SAMPLE_MANGA) {
    let manga = await Manga.findOne({ slug: mData.slug });
    if (!manga) {
      manga = new Manga(mData);
      await manga.save();
    }

    // Seed 3 sample chapters for each manga if none exist
    const count = await Chapter.countDocuments({ mangaId: manga._id });
    if (count === 0) {
      for (let ch = 1; ch <= 3; ch++) {
        await Chapter.create({
          mangaId: manga._id,
          chapterNumber: ch,
          title: `Episode ${ch}: The Awakening Part ${ch}`,
          publicationStatus: 'published',
          publishedAt: new Date(Date.now() - (4 - ch) * 86400000),
          downloadAvailable: false,
          pages: [],
        });
      }
    }
  }

  console.log('[Seed] Database content seed completed successfully!');
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
