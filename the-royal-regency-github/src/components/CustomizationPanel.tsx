import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FileUp,
  Image as ImageIcon,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { FONT_STYLES, THEMES } from '../data/defaultContent';
import {
  BallroomPlaqueData,
  CustomAssetOverrides,
  DecorativeOptions,
  FontStyleId,
  GalleryLayout,
  GalleryPhoto,
  PalaceCustomization,
  RomanticMemory,
  ThemeId,
} from '../types/palace';
import { processUploadedImage, readFileAsDataUrl } from '../utils/imageUtils';

interface CustomizationPanelProps {
  isOpen: boolean;
  customization: PalaceCustomization;
  saveStatus: 'idle' | 'saving' | 'saved';
  isUploading: boolean;
  uploadError: string | null;
  onClose: () => void;
  onUpdateField: <K extends keyof PalaceCustomization>(
    key: K,
    value: PalaceCustomization[K]
  ) => void;
  onSetTheme: (themeId: ThemeId) => void;
  onUpdatePlaque: (partial: Partial<BallroomPlaqueData>) => void;
  onUpdateDecoratives: (partial: Partial<DecorativeOptions>) => void;
  onUpdateAssetOverride: <K extends keyof CustomAssetOverrides>(
    key: K,
    value: CustomAssetOverrides[K]
  ) => void;
  onSetFrameCount: (count: number) => void;
  onUpdatePhoto: (id: string, partial: Partial<GalleryPhoto>) => void;
  onDeletePhotoImage: (id: string) => void;
  onReorderPhotos: (from: number, to: number) => void;
  onUploadSinglePhoto: (frameId: string, file: File) => Promise<boolean>;
  onUploadMultiplePhotos: (files: FileList) => Promise<number>;
  onClearUploadError: () => void;
  onAddMemory: (memory: Omit<RomanticMemory, 'id'>) => void;
  onUpdateMemory: (id: string, partial: Partial<RomanticMemory>) => void;
  onDeleteMemory: (id: string) => void;
  onResetToDefault: () => Promise<void>;
  onImportJson: (raw: string) => boolean;
}

type TabId = 'photos' | 'messages' | 'visuals';

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  isOpen,
  customization,
  saveStatus,
  isUploading,
  uploadError,
  onClose,
  onUpdateField,
  onSetTheme,
  onUpdatePlaque,
  onUpdateDecoratives,
  onUpdateAssetOverride,
  onSetFrameCount,
  onUpdatePhoto,
  onDeletePhotoImage,
  onReorderPhotos,
  onUploadSinglePhoto,
  onUploadMultiplePhotos,
  onClearUploadError,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onResetToDefault,
  onImportJson,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('photos');
  const [confirmReset, setConfirmReset] = useState(false);
  const [assetNotice, setAssetNotice] = useState<string | null>(null);
  const [publishSaved, setPublishSaved] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const importJsonRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePublishDownload = () => {
    const publishedPayload: PalaceCustomization = {
      ...customization,
      publishedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(publishedPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palace-config.json';
    a.click();
    URL.revokeObjectURL(url);
    setPublishSaved(true);
    window.setTimeout(() => setPublishSaved(false), 4500);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(customization, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royal-regency-palace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAssetUpload = async (
    key: keyof CustomAssetOverrides,
    file: File,
    isImage: boolean
  ) => {
    try {
      setAssetNotice(null);
      if (isImage) {
        const processed = await processUploadedImage(file, 1024, 0.85);
        onUpdateAssetOverride(key, processed.dataUrl);
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        onUpdateAssetOverride(key, dataUrl);
      }
      setAssetNotice(`Saved custom local asset (${file.name}).`);
    } catch (err) {
      setAssetNotice(err instanceof Error ? err.message : 'Unable to load asset file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <aside className="royal-glass flex h-full w-full max-w-xl flex-col border-l border-[#d4af37]/35">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d4af37]/25 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 font-royal-display text-[10px] uppercase tracking-[0.3em] text-[#f4c2c2]">
              <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
              Royal Atelier Studio
            </div>
            <h2 className="font-royal-display mt-0.5 text-lg tracking-[0.14em] text-[#f3d9a4] sm:text-xl">
              Personalize Your Palace
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#d4af37]/25 bg-black/30 px-2.5 py-1 text-[10px] font-royal-display uppercase tracking-wider text-[#f3d9a4]">
              <Check className="h-3 w-3 text-[#d4af37]" />
              {saveStatus === 'saving' ? 'Saving...' : 'Saved Locally'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Customization Dashboard"
              className="rounded-full border border-[#d4af37]/35 p-2 text-[#f3d9a4] transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 border-b border-[#d4af37]/20 bg-black/25 p-2">
          {(
            [
              { id: 'photos', label: 'Portraits', icon: ImageIcon },
              { id: 'messages', label: 'Messages', icon: Type },
              { id: 'visuals', label: 'Visuals & Assets', icon: Palette },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 font-royal-display text-[11px] uppercase tracking-[0.14em] transition ${
                  active
                    ? 'bg-gradient-to-r from-[#c89a2a]/90 to-[#e7ca7e]/90 font-semibold text-[#1b0d13]'
                    : 'text-[#faf6f0]/80 hover:bg-white/5 hover:text-[#f3d9a4]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="royal-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* TAB 1: PHOTO CUSTOMIZATION */}
          {activeTab === 'photos' && (
            <div className="space-y-5">
              {/* Bulk Upload Dropzone */}
              <div className="rounded-2xl border border-dashed border-[#d4af37]/50 bg-[#d4af37]/5 p-5 text-center">
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadMultiplePhotos(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <Upload className="mx-auto h-7 w-7 text-[#f3d9a4]" />
                <p className="font-royal-display mt-2 text-xs uppercase tracking-[0.2em] text-[#f3d9a4]">
                  Upload Your Own Photographs
                </p>
                <p className="mt-1 text-sm italic text-[#faf6f0]/75">
                  Select one or multiple JPG, JPEG, PNG, or WEBP photos from your device.
                  Stored privately in your browser.
                </p>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => bulkInputRef.current?.click()}
                  className="royal-btn mt-4 rounded-full px-5 py-2.5 text-[11px]"
                >
                  {isUploading ? 'Processing Photographs...' : 'Choose Photos to Upload'}
                </button>
                {uploadError && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-[#5c162b]/65 px-3 py-2 text-xs text-[#ffdce5]">
                    <span>{uploadError}</span>
                    <button type="button" onClick={onClearUploadError}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Gallery Arrangement & Frame Count */}
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#f3d9a4]">
                    <span className="font-royal-display uppercase tracking-wider">
                      Gallery Frames
                    </span>
                    <span className="font-semibold">{customization.galleryFrameCount}</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={1}
                    value={customization.galleryFrameCount}
                    onChange={(e) => onSetFrameCount(Number(e.target.value))}
                    className="royal-slider mt-2.5 w-full"
                  />
                </div>

                <div>
                  <label className="block font-royal-display text-[10px] uppercase tracking-[0.2em] text-[#f3d9a4]">
                    Gallery Arrangement
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {(['corridor', 'semicircle', 'rotunda'] as GalleryLayout[]).map((layout) => (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => onUpdateField('galleryLayout', layout)}
                        className={`rounded-lg border py-1.5 font-royal-display text-[9px] uppercase tracking-wider transition ${
                          customization.galleryLayout === layout
                            ? 'border-[#f3d9a4] bg-[#d4af37]/25 text-[#fff6df]'
                            : 'border-white/10 bg-white/5 text-[#faf6f0]/70 hover:border-[#d4af37]/40'
                        }`}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Frame Cards */}
              <div className="space-y-3">
                {customization.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="rounded-2xl border border-[#d4af37]/25 bg-black/30 p-3.5"
                  >
                    <div className="flex gap-3.5">
                      {/* Thumbnail preview */}
                      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#d4af37]/40 bg-[#230e26]">
                        {photo.dataUrl ? (
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-[10px] text-[#f3d9a4]/75">
                            <ImageIcon className="mb-1 h-4 w-4 opacity-70" />
                            Frame {index + 1}
                          </div>
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-royal-display text-[10px] uppercase tracking-[0.2em] text-[#f4c2c2]">
                            Portrait #{index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => onReorderPhotos(index, index - 1)}
                              title="Move Earlier"
                              className="rounded-lg border border-white/15 p-1 text-[#f3d9a4] hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === customization.photos.length - 1}
                              onClick={() => onReorderPhotos(index, index + 1)}
                              title="Move Later"
                              className="rounded-lg border border-white/15 p-1 text-[#f3d9a4] hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            {photo.dataUrl && (
                              <button
                                type="button"
                                onClick={() => onDeletePhotoImage(photo.id)}
                                title="Remove Photograph"
                                className="rounded-lg border border-rose-400/30 p-1 text-rose-300 hover:bg-rose-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={photo.caption}
                          placeholder="Add romantic caption..."
                          onChange={(e) =>
                            onUpdatePhoto(photo.id, { caption: e.target.value })
                          }
                          className="w-full rounded-lg border border-[#d4af37]/25 bg-black/40 px-2.5 py-1.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={photo.date}
                            placeholder="Date / Chapter"
                            onChange={(e) =>
                              onUpdatePhoto(photo.id, { date: e.target.value })
                            }
                            className="rounded-lg border border-[#d4af37]/25 bg-black/40 px-2.5 py-1 text-xs text-[#f3d9a4] outline-none focus:border-[#f3d9a4]"
                          />

                          <label className="royal-btn-outline inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[10px]">
                            <Upload className="h-3 w-3" />
                            {photo.dataUrl ? 'Replace Photo' : 'Upload Photo'}
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onUploadSinglePhoto(photo.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Individual Frame Rotation Angle */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-[#faf6f0]/65">
                            Frame Angle
                          </span>
                          <input
                            type="range"
                            min={-0.65}
                            max={0.65}
                            step={0.05}
                            value={photo.rotationY || 0}
                            onChange={(e) =>
                              onUpdatePhoto(photo.id, {
                                rotationY: parseFloat(e.target.value),
                              })
                            }
                            className="royal-slider flex-1"
                          />
                          <span className="w-8 text-right text-[10px] text-[#f3d9a4]">
                            {Math.round(((photo.rotationY || 0) * 180) / Math.PI)}°
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TEXT & MESSAGES CUSTOMIZATION */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              {/* Royal Dedication Identity */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Royal Dedication
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Recipient&apos;s Name</label>
                    <input
                      type="text"
                      value={customization.recipientName}
                      onChange={(e) => {
                        onUpdateField('recipientName', e.target.value);
                        onUpdatePlaque({ recipientName: e.target.value });
                      }}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Your Signature / Sender</label>
                    <input
                      type="text"
                      value={customization.senderName}
                      onChange={(e) => onUpdateField('senderName', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
                    />
                  </div>
                </div>
              </section>

              {/* Chapter 1 & 2 Welcome Messages */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Chapter I &amp; II — Arrival &amp; Foyer
                </h3>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Palace Title</label>
                  <input
                    type="text"
                    value={customization.arrivalTitle}
                    onChange={(e) => onUpdateField('arrivalTitle', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Arrival Welcome Subtitle</label>
                  <input
                    type="text"
                    value={customization.arrivalSubtitle}
                    onChange={(e) => onUpdateField('arrivalSubtitle', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Arrival Romantic Note</label>
                  <textarea
                    rows={2}
                    value={customization.arrivalMessage}
                    onChange={(e) => onUpdateField('arrivalMessage', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Grand Foyer Welcome Title</label>
                  <input
                    type="text"
                    value={customization.foyerWelcomeTitle}
                    onChange={(e) => onUpdateField('foyerWelcomeTitle', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Grand Foyer Romantic Message</label>
                  <textarea
                    rows={3}
                    value={customization.foyerWelcomeMessage}
                    onChange={(e) => onUpdateField('foyerWelcomeMessage', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
              </section>

              {/* Chapter 4 Ballroom Plaque */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Chapter IV — Royal Ballroom Plaque
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Main Title</label>
                    <input
                      type="text"
                      value={customization.plaque.mainTitle}
                      onChange={(e) => onUpdatePlaque({ mainTitle: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Dedication</label>
                    <input
                      type="text"
                      value={customization.plaque.dedication}
                      onChange={(e) => onUpdatePlaque({ dedication: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Plaque Recipient Name</label>
                    <input
                      type="text"
                      value={customization.plaque.recipientName}
                      onChange={(e) => onUpdatePlaque({ recipientName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#f4c2c2]">Special Date</label>
                    <input
                      type="text"
                      value={customization.plaque.specialDate}
                      onChange={(e) => onUpdatePlaque({ specialDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Romantic Message</label>
                  <textarea
                    rows={3}
                    value={customization.plaque.romanticMessage}
                    onChange={(e) => onUpdatePlaque({ romanticMessage: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Additional Personal Text</label>
                  <input
                    type="text"
                    value={customization.plaque.additionalText}
                    onChange={(e) => onUpdatePlaque({ additionalText: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
              </section>

              {/* Chapter 5 Garden Dedication */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Chapter V — Sunset Rose Garden
                </h3>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Garden Dedication Headline</label>
                  <input
                    type="text"
                    value={customization.gardenDedication}
                    onChange={(e) => onUpdateField('gardenDedication', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#f4c2c2]">Closing Romantic Message</label>
                  <textarea
                    rows={3}
                    value={customization.gardenClosingMessage}
                    onChange={(e) =>
                      onUpdateField('gardenClosingMessage', e.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-[#d4af37]/30 bg-black/35 px-3 py-2 text-sm text-[#faf6f0]"
                  />
                </div>
              </section>

              {/* Custom Memories */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                    Custom Memories Timeline
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onAddMemory({
                        title: 'New Cherished Memory',
                        date: 'Special Date',
                        description: 'Write a romantic moment to preserve forever.',
                      })
                    }
                    className="royal-btn-outline inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px]"
                  >
                    <Plus className="h-3 w-3" />
                    Add Memory
                  </button>
                </div>

                <div className="space-y-3">
                  {customization.memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="space-y-2 rounded-xl border border-[#d4af37]/20 bg-black/30 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={memory.title}
                          onChange={(e) =>
                            onUpdateMemory(memory.id, { title: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1 text-sm text-[#faf6f0]"
                        />
                        <input
                          type="text"
                          value={memory.date}
                          onChange={(e) =>
                            onUpdateMemory(memory.id, { date: e.target.value })
                          }
                          className="w-32 rounded-lg border border-white/15 bg-black/35 px-2.5 py-1 text-xs text-[#f3d9a4]"
                        />
                        <button
                          type="button"
                          onClick={() => onDeleteMemory(memory.id)}
                          aria-label="Delete memory"
                          className="rounded-lg border border-rose-400/25 p-1.5 text-rose-300 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={memory.description}
                        onChange={(e) =>
                          onUpdateMemory(memory.id, { description: e.target.value })
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 text-xs text-[#faf6f0]/90"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: VISUALS, AUDIO & LOCAL ASSET REPLACEMENTS */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
              {/* Palace Color Themes */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Palace Color Theme
                </h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {(Object.keys(THEMES) as ThemeId[]).map((id) => {
                    const theme = THEMES[id];
                    const selected = customization.themeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSetTheme(id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          selected
                            ? 'border-[#f3d9a4] bg-[#d4af37]/20'
                            : 'border-white/15 bg-black/25 hover:border-[#d4af37]/45'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-royal-display text-xs uppercase tracking-wider text-[#fff6df]">
                            {theme.name}
                          </span>
                          <div className="flex gap-1">
                            {[theme.primary, theme.secondary, theme.burgundy].map((c, i) => (
                              <span
                                key={i}
                                className="h-3.5 w-3.5 rounded-full border border-white/30"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs italic text-[#faf6f0]/70">
                          {theme.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center justify-between rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-[#f3d9a4]">
                    <span>Gold Accent</span>
                    <input
                      type="color"
                      value={customization.customAccentColor}
                      onChange={(e) =>
                        onUpdateField('customAccentColor', e.target.value)
                      }
                      className="h-6 w-9 cursor-pointer rounded border-0 bg-transparent"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-[#f3d9a4]">
                    <span>Ambient Backdrop</span>
                    <input
                      type="color"
                      value={customization.customBackgroundColor}
                      onChange={(e) =>
                        onUpdateField('customBackgroundColor', e.target.value)
                      }
                      className="h-6 w-9 cursor-pointer rounded border-0 bg-transparent"
                    />
                  </label>
                </div>
              </section>

              {/* Typography */}
              <section className="space-y-2.5 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Royal Typography Style
                </h3>
                {(Object.keys(FONT_STYLES) as FontStyleId[]).map((fontId) => (
                  <button
                    key={fontId}
                    type="button"
                    onClick={() => onUpdateField('fontStyle', fontId)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                      customization.fontStyle === fontId
                        ? 'border-[#f3d9a4] bg-[#d4af37]/20 text-[#fff7e2]'
                        : 'border-white/10 bg-black/20 text-[#faf6f0]/80 hover:border-[#d4af37]/40'
                    }`}
                  >
                    <span style={{ fontFamily: FONT_STYLES[fontId].display }}>
                      {FONT_STYLES[fontId].name}
                    </span>
                    {customization.fontStyle === fontId && (
                      <Check className="h-4 w-4 text-[#f3d9a4]" />
                    )}
                  </button>
                ))}
              </section>

              {/* Atmosphere, Decoratives & Music */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Atmosphere &amp; Audio
                </h3>

                {(
                  [
                    { key: 'enableFallingPetals', label: 'Falling Rose Petals' },
                    { key: 'enableStardust', label: 'Floating Golden Stardust' },
                    { key: 'enableChandelierGlow', label: 'Warm Chandelier Candlelight' },
                    { key: 'enableButterflies', label: 'Animated Garden Butterflies' },
                    { key: 'enableMusic', label: 'Background Romantic Waltz' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-[#faf6f0]/90"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={customization.decoratives[item.key]}
                      onChange={(e) =>
                        onUpdateDecoratives({ [item.key]: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#d4af37]"
                    />
                  </label>
                ))}

                {/* Rose Garden Density */}
                <div className="pt-1">
                  <span className="text-xs text-[#f4c2c2]">Garden Rose Abundance</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {(['lush', 'abundant', 'grand'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => onUpdateDecoratives({ roseDensity: level })}
                        className={`rounded-lg border py-1.5 font-royal-display text-[10px] uppercase tracking-wider ${
                          customization.decoratives.roseDensity === level
                            ? 'border-[#f3d9a4] bg-[#d4af37]/25 text-[#fff7df]'
                            : 'border-white/10 bg-white/5 text-[#faf6f0]/75'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music Volume */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-[#f3d9a4]">
                    <span>Music Volume</span>
                    <span>{Math.round(customization.decoratives.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={customization.decoratives.musicVolume}
                    onChange={(e) =>
                      onUpdateDecoratives({ musicVolume: parseFloat(e.target.value) })
                    }
                    className="royal-slider mt-2 w-full"
                  />
                </div>
              </section>

              {/* Replaceable Local Asset Manager */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Replace Local Palace Assets
                </h3>
                <p className="text-xs italic text-[#faf6f0]/70">
                  Override textures, models (.glb), or audio right from your computer, or place
                  files in <code className="text-[#f3d9a4]">public/assets/</code>.
                </p>

                {assetNotice && (
                  <div className="rounded-xl border border-[#d4af37]/35 bg-[#d4af37]/15 px-3 py-2 text-xs text-[#fff4d4]">
                    {assetNotice}
                  </div>
                )}

                {(
                  [
                    {
                      key: 'marbleTextureUrl',
                      label: 'Marble Floor Texture',
                      accept: 'image/jpeg,image/png,image/webp',
                      isImage: true,
                    },
                    {
                      key: 'wallpaperTextureUrl',
                      label: 'Palace Wall Damask Texture',
                      accept: 'image/jpeg,image/png,image/webp',
                      isImage: true,
                    },
                    {
                      key: 'roseTextureUrl',
                      label: 'Rose Petal Sprite Texture',
                      accept: 'image/jpeg,image/png,image/webp',
                      isImage: true,
                    },
                    {
                      key: 'crownModelUrl',
                      label: 'Custom 3D Crown (.glb / .gltf)',
                      accept: '.glb,.gltf',
                      isImage: false,
                    },
                    {
                      key: 'customAudioUrl',
                      label: 'Custom Waltz Audio (.mp3 / .wav)',
                      accept: 'audio/*',
                      isImage: false,
                    },
                  ] as const
                ).map((slot) => {
                  const hasCustom = Boolean(customization.assets[slot.key]);
                  return (
                    <div
                      key={slot.key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs text-[#faf6f0]">{slot.label}</div>
                        <div className="text-[10px] text-[#f4c2c2]/75">
                          {hasCustom ? 'Custom local override active' : 'Using procedural royal default'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="royal-btn-outline cursor-pointer rounded-lg px-2.5 py-1 text-[10px]">
                          Upload
                          <input
                            type="file"
                            accept={slot.accept}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleAssetUpload(slot.key, file, slot.isImage);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                        {hasCustom && (
                          <button
                            type="button"
                            onClick={() => onUpdateAssetOverride(slot.key, null)}
                            className="rounded-lg border border-rose-400/30 p-1 text-rose-300 hover:bg-rose-500/20"
                            title="Revert to default"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Backup / Restore / Reset */}
              <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-black/25 p-4">
                <h3 className="font-royal-display text-xs uppercase tracking-[0.22em] text-[#f3d9a4]">
                  Palace Backup &amp; Reset
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Backup JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => importJsonRef.current?.click()}
                    className="royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px]"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Import Backup
                  </button>
                  <input
                    ref={importJsonRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      file.text().then((txt) => {
                        const ok = onImportJson(txt);
                        setAssetNotice(
                          ok ? 'Palace configuration imported successfully.' : 'Invalid palace JSON file.'
                        );
                      });
                      e.target.value = '';
                    }}
                  />
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer with Publish for All Visitors & Reset to Default */}
        <div className="space-y-3 border-t border-[#d4af37]/25 bg-black/35 px-5 py-4 sm:px-6">
          {/* One-click Publish banner so all website visitors see user's photos & texts */}
          <div className="flex flex-col gap-2 rounded-2xl border border-[#d4af37]/40 bg-[#d4af37]/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-snug text-[#faf6f0]/90">
              <div className="font-royal-display text-[10px] uppercase tracking-[0.2em] text-[#f3d9a4]">
                Make Visible to All Visitors
              </div>
              <p className="mt-0.5 text-[11px] text-[#f4c2c2]/85">
                {publishSaved
                  ? 'Downloaded palace-config.json! Upload it into public/ on GitHub to publish.'
                  : 'Download palace-config.json & place it in public/ on GitHub so everyone sees your photos & texts.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePublishDownload}
              className="royal-btn inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[10px]"
            >
              <Download className="h-3.5 w-3.5" />
              {publishSaved ? 'Downloaded!' : 'Publish File'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/35 px-4 py-2 font-royal-display text-[10px] uppercase tracking-widest text-rose-200 transition hover:bg-rose-500/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Default
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-200">Reset all photos &amp; text?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetToDefault();
                    setConfirmReset(false);
                  }}
                  className="rounded-full bg-rose-600 px-3 py-1.5 font-royal-display text-[10px] uppercase tracking-wider text-white hover:bg-rose-500"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] text-white/80"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="royal-btn-outline rounded-full px-5 py-2 text-[10px]"
            >
              Return to Palace
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
