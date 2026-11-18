export type ChapterId =
  | 'arrival'
  | 'foyer'
  | 'gallery'
  | 'ballroom'
  | 'garden';

export type ThemeId =
  | 'rose-champagne'
  | 'royal-burgundy'
  | 'ivory-versailles'
  | 'midnight-velvet';

export type FontStyleId =
  | 'regency-classic'
  | 'baroque-editorial'
  | 'imperial-cinzel';

export type GalleryLayout = 'corridor' | 'semicircle' | 'rotunda';

export type CrownStyleId = 'sovereign' | 'rose-tiara' | 'imperial-diadem';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  description: string;
  primary: string;        // Main accent gold / rose gold
  secondary: string;      // Soft rose / champagne tint
  ivory: string;          // Light marble / text ivory
  burgundy: string;       // Velvet curtains / carpet / rich accent
  background: string;     // Deep ambient backdrop
  wallColor: string;      // Interior palace wall hue
  petalColor: string;     // Falling petals hue
  ambientLight: string;   // Warm fill light tint
  fogColor: string;       // Atmospheric fog color
}

export interface GalleryPhoto {
  id: string;
  dataUrl: string | null; // null = graceful royal placeholder ready for upload
  caption: string;
  date: string;
  rotationY: number;      // radians offset for custom frame angling
  aspectRatio: number;    // width / height
}

export interface RomanticMemory {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface BallroomPlaqueData {
  mainTitle: string;
  dedication: string;
  recipientName: string;
  romanticMessage: string;
  specialDate: string;
  additionalText: string;
}

export interface DecorativeOptions {
  enableFallingPetals: boolean;
  enableStardust: boolean;
  enableChandelierGlow: boolean;
  enableButterflies: boolean;
  roseDensity: 'lush' | 'abundant' | 'grand';
  enableMusic: boolean;
  musicVolume: number; // 0 to 1
}

export interface CustomAssetOverrides {
  marbleTextureUrl: string | null;
  wallpaperTextureUrl: string | null;
  velvetTextureUrl: string | null;
  roseTextureUrl: string | null;
  exteriorBackdropUrl: string | null;
  gardenBackdropUrl: string | null;
  crownModelUrl: string | null;
  customAudioUrl: string | null;
}

export interface PalaceCustomization {
  publishedAt?: number;
  recipientName: string;
  senderName: string;
  arrivalTitle: string;
  arrivalSubtitle: string;
  arrivalMessage: string;
  foyerWelcomeTitle: string;
  foyerWelcomeMessage: string;
  galleryTitle: string;
  gallerySubtitle: string;
  galleryFrameCount: number;
  galleryLayout: GalleryLayout;
  photos: GalleryPhoto[];
  plaque: BallroomPlaqueData;
  gardenTitle: string;
  gardenDedication: string;
  gardenClosingMessage: string;
  memories: RomanticMemory[];
  themeId: ThemeId;
  customBackgroundColor: string;
  customAccentColor: string;
  fontStyle: FontStyleId;
  decoratives: DecorativeOptions;
  assets: CustomAssetOverrides;
  crownStyle: CrownStyleId;
}

export interface ChapterMeta {
  id: ChapterId;
  roman: string;
  title: string;
  subtitle: string;
  shortName: string;
}

export interface CrownTransform {
  x: number;
  y: number;
  scale: number;
  rotationZ: number;
  rotationY: number;
  rotationX: number;
}
