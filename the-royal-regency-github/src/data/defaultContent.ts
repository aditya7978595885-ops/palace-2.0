import {
  ChapterMeta,
  FontStyleId,
  GalleryPhoto,
  PalaceCustomization,
  ThemeId,
  ThemePalette,
} from '../types/palace';

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'arrival',
    roman: 'I',
    title: 'The Royal Arrival',
    subtitle: 'Twilight Courtyard & Grand Gates',
    shortName: 'Arrival',
  },
  {
    id: 'foyer',
    roman: 'II',
    title: 'The Grand Foyer',
    subtitle: 'Marble Hall of Chandeliers',
    shortName: 'Foyer',
  },
  {
    id: 'gallery',
    roman: 'III',
    title: 'The Portrait Gallery',
    subtitle: 'Gilded Frames of Cherished Memories',
    shortName: 'Gallery',
  },
  {
    id: 'ballroom',
    roman: 'IV',
    title: 'The Royal Ballroom',
    subtitle: 'Grand Dedication & Golden Waltz',
    shortName: 'Ballroom',
  },
  {
    id: 'garden',
    roman: 'V',
    title: 'The Sunset Rose Garden',
    subtitle: 'Golden-Hour Gazebo & Royal Crown Mirror',
    shortName: 'Garden',
  },
];

export const THEMES: Record<ThemeId, ThemePalette> = {
  'rose-champagne': {
    id: 'rose-champagne',
    name: 'Rose Champagne',
    description: 'Blush petals, warm champagne gold, ivory marble, and deep burgundy velvet.',
    primary: '#d4af37',
    secondary: '#f4c2c2',
    ivory: '#faf6f0',
    burgundy: '#6b1d34',
    background: '#140c1e',
    wallColor: '#f3e7dc',
    petalColor: '#f2a7b8',
    ambientLight: '#ffe7d4',
    fogColor: '#1a1026',
  },
  'royal-burgundy': {
    id: 'royal-burgundy',
    name: 'Royal Burgundy',
    description: 'Rich crimson velvet, burnished antique gold, and candlelit romance.',
    primary: '#dfb649',
    secondary: '#e598a8',
    ivory: '#f9f1e8',
    burgundy: '#590d22',
    background: '#16070d',
    wallColor: '#eadad2',
    petalColor: '#d95d78',
    ambientLight: '#ffd9c2',
    fogColor: '#1f0b14',
  },
  'ivory-versailles': {
    id: 'ivory-versailles',
    name: 'Ivory Versailles',
    description: 'Luminous French limestone, gilded gold leaf, and soft pearl blush.',
    primary: '#cfa441',
    secondary: '#f6d6d0',
    ivory: '#fffdf9',
    burgundy: '#7c2946',
    background: '#1c1724',
    wallColor: '#f8f2e8',
    petalColor: '#f8c3cc',
    ambientLight: '#fff3e0',
    fogColor: '#251e30',
  },
  'midnight-velvet': {
    id: 'midnight-velvet',
    name: 'Midnight Velvet',
    description: 'Starlit indigo twilight, celestial champagne gold, and dusky rose.',
    primary: '#e6c26e',
    secondary: '#df9db6',
    ivory: '#f4eef7',
    burgundy: '#4d1938',
    background: '#0a0818',
    wallColor: '#dcd2e3',
    petalColor: '#e79ab6',
    ambientLight: '#eadcff',
    fogColor: '#100c24',
  },
};

export const FONT_STYLES: Record<
  FontStyleId,
  { name: string; display: string; body: string; script: string }
> = {
  'regency-classic': {
    name: 'Regency Classic (Cormorant & Cinzel)',
    display: '"Cinzel", Georgia, serif',
    body: '"Cormorant Garamond", Georgia, serif',
    script: '"Great Vibes", cursive',
  },
  'baroque-editorial': {
    name: 'Baroque Editorial (Playfair Display)',
    display: '"Playfair Display", Georgia, serif',
    body: '"Cormorant Garamond", Georgia, serif',
    script: '"Great Vibes", cursive',
  },
  'imperial-cinzel': {
    name: 'Imperial Court (Cinzel & Sans)',
    display: '"Cinzel", Georgia, serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    script: '"Great Vibes", cursive',
  },
};

export function createDefaultPhotos(count = 8): GalleryPhoto[] {
  const permanentPortraits: Array<{
    dataUrl: string | null;
    caption: string;
    date: string;
    aspectRatio: number;
  }> = [
    {
      dataUrl: '/assets/images/portrait-1.jpg',
      caption: 'Hi Wifey',
      date: 'Portrait I',
      aspectRatio: 0.547,
    },
    {
      dataUrl: '/assets/images/portrait-2.jpg',
      caption: 'MY CUTU BABYY<333',
      date: '23 / 11 / 2013',
      aspectRatio: 1.333,
    },
    {
      dataUrl: '/assets/images/portrait-3.jpg',
      caption: 'MY JAANUUUU',
      date: 'Portrait III',
      aspectRatio: 0.547,
    },
    {
      dataUrl: '/assets/images/portrait-4.jpg',
      caption: 'MERII LAXIIIMIII',
      date: 'Portrait IV',
      aspectRatio: 0.562,
    },
    {
      dataUrl: '/assets/images/portrait-5.jpg',
      caption: 'CHATPATI BAUNIII',
      date: 'Portrait V',
      aspectRatio: 0.562,
    },
    {
      dataUrl: '/assets/images/portrait-6.jpg',
      caption: 'CURVESSSS',
      date: 'Portrait VI',
      aspectRatio: 0.562,
    },
    {
      dataUrl: '/assets/images/portrait-7.jpg',
      caption: 'THEE EYESSSS I FELLL FORRRRR',
      date: 'Portrait VII',
      aspectRatio: 1.778,
    },
    {
      dataUrl: '/assets/images/portrait-8.jpg',
      caption: 'MYYY LOVEEEE MYY AADYAAAA FOREVEERRR<3333333',
      date: 'Portrait VIII',
      aspectRatio: 0.562,
    },
    {
      dataUrl: null,
      caption: 'Two Hearts, One Kingdom',
      date: 'Chapter IX',
      aspectRatio: 0.8,
    },
    {
      dataUrl: null,
      caption: 'Written in Candlelight',
      date: 'Chapter X',
      aspectRatio: 0.8,
    },
    {
      dataUrl: null,
      caption: 'Memories Preserved in Marble',
      date: 'Chapter XI',
      aspectRatio: 0.8,
    },
    {
      dataUrl: null,
      caption: 'Our Eternal Fairytale',
      date: 'Chapter XII',
      aspectRatio: 0.8,
    },
  ];

  return Array.from({ length: count }, (_, idx) => {
    const preset = permanentPortraits[idx % permanentPortraits.length];
    return {
      id: `frame-${idx + 1}`,
      dataUrl: idx < permanentPortraits.length ? preset.dataUrl : null,
      caption: preset.caption,
      date: preset.date,
      rotationY: 0,
      aspectRatio: preset.aspectRatio,
    };
  });
}

export const DEFAULT_CUSTOMIZATION: PalaceCustomization = {
  recipientName: 'Aadya',
  senderName: 'Rudra',
  arrivalTitle: 'The Royal Regency',
  arrivalSubtitle: 'A Private Palace Built Exclusively For You',
  arrivalMessage:
    'Beneath a velvet twilight sky, the golden gates open to a kingdom crafted from every cherished moment we share.',
  foyerWelcomeTitle: 'Welcome Home, Aadya',
  foyerWelcomeMessage:
    'Every chandelier glows with the warmth you bring into my life. Step through these marble halls and wander through the memories we treasure.',
  galleryTitle: 'The Hall of Cherished Portraits',
  gallerySubtitle:
    'Eight cherished portraits preserved forever inside gilded royal frames.',
  galleryFrameCount: 8,
  galleryLayout: 'corridor',
  photos: createDefaultPhotos(8),
  plaque: {
    mainTitle: 'THE ROYAL DEDICATION',
    dedication: 'Eternally Dedicated To',
    recipientName: 'Aadya',
    romanticMessage:
      "In every lifetime and every season of my life, I want you, and my heart always chooses yours, as it belongs to you, my lady. From the start to the end, I'll always be at your service. May this palace stand as a timeless tribute to you and your kindness—the world belongs to you, my lady, and you'll always deserve the best.",
    specialDate: 'Forever & Always',
    additionalText: 'Sealed beneath the golden chandeliers of The Royal Regency',
  },
  gardenTitle: 'The Sunset Rose Garden',
  gardenDedication: 'For the One Who Wears the Crown of My Heart',
  gardenClosingMessage:
    'As the sun melts into rose gold across the garden, know that every bloom, every star, and every beat of this palace belongs to you.',
  memories: [
    {
      id: 'mem-1',
      title: 'The Day Everything Changed',
      date: 'Our Beginning',
      description: 'The moment a simple hello turned into my favorite fairytale.',
    },
    {
      id: 'mem-2',
      title: 'Under Golden Skies',
      date: 'Unforgettable Evening',
      description: 'Hours felt like seconds, and the world faded into soft candlelight.',
    },
    {
      id: 'mem-3',
      title: 'Our Promise Ahead',
      date: 'Every Tomorrow',
      description: 'A lifetime of laughter, adventures, and quiet evenings side by side.',
    },
  ],
  themeId: 'rose-champagne',
  customBackgroundColor: '#140c1e',
  customAccentColor: '#d4af37',
  fontStyle: 'regency-classic',
  decoratives: {
    enableFallingPetals: true,
    enableStardust: true,
    enableChandelierGlow: true,
    enableButterflies: true,
    roseDensity: 'abundant',
    enableMusic: true,
    musicVolume: 0.45,
  },
  assets: {
    marbleTextureUrl: null,
    wallpaperTextureUrl: null,
    velvetTextureUrl: null,
    roseTextureUrl: null,
    exteriorBackdropUrl: null,
    gardenBackdropUrl: null,
    crownModelUrl: null,
    customAudioUrl: null,
  },
  crownStyle: 'sovereign',
};
