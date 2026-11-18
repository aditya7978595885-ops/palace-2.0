import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CHAPTERS } from '../data/defaultContent';
import { ChapterId } from '../types/palace';
import { MusicPlayer } from './MusicPlayer';

interface NavigationProps {
  currentChapter: ChapterId;
  recipientName: string;
  palaceTitle: string;
  musicEnabled: boolean;
  musicVolume: number;
  customAudioUrl: string | null;
  onSelectChapter: (chapter: ChapterId) => void;
  onToggleMusic: (enabled: boolean) => void;
  onOpenCustomize: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentChapter,
  recipientName,
  palaceTitle,
  musicEnabled,
  musicVolume,
  customAudioUrl,
  onSelectChapter,
  onToggleMusic,
  onOpenCustomize,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentIdx = CHAPTERS.findIndex((c) => c.id === currentChapter);
  const prevChapter = currentIdx > 0 ? CHAPTERS[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < CHAPTERS.length - 1 ? CHAPTERS[currentIdx + 1] : null;

  return (
    <>
      {/* Top Floating Royal Bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
        {/* Left: Royal Emblem & Dedication */}
        <button
          type="button"
          onClick={() => onSelectChapter('arrival')}
          className="pointer-events-auto royal-glass-soft group flex items-center gap-2.5 rounded-full px-3.5 py-2 text-left transition hover:border-[#d4af37]/60 sm:px-4"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/15">
            <Crown className="h-4 w-4 text-[#f3d9a4] transition-transform group-hover:scale-110" />
          </span>
          <div className="leading-tight">
            <div className="font-royal-display text-[11px] font-semibold tracking-[0.18em] text-[#f3d9a4] sm:text-xs">
              {palaceTitle}
            </div>
            <div className="text-[11px] italic text-[#f4c2c2]/85">
              For {recipientName}
            </div>
          </div>
        </button>

        {/* Center: Desktop 5-Chapter Navigation Pills */}
        <nav
          aria-label="Palace Chapters"
          className="pointer-events-auto royal-glass-soft hidden items-center gap-1 rounded-full p-1.5 lg:flex"
        >
          {CHAPTERS.map((chapter) => {
            const active = chapter.id === currentChapter;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => onSelectChapter(chapter.id)}
                className={`relative rounded-full px-3.5 py-1.5 font-royal-display text-[11px] tracking-[0.14em] uppercase transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#c89a2a] via-[#ebd089] to-[#c89a2a] font-semibold text-[#1b0e13] shadow-gilded'
                    : 'text-[#faf6f0]/80 hover:bg-white/5 hover:text-[#f3d9a4]'
                }`}
              >
                <span className="mr-1.5 opacity-75">{chapter.roman}.</span>
                {chapter.shortName}
              </button>
            );
          })}
        </nav>

        {/* Right: Audio, Customize, Mobile Menu */}
        <div className="pointer-events-auto flex items-center gap-2">
          <MusicPlayer
            enabled={musicEnabled}
            volume={musicVolume}
            customAudioUrl={customAudioUrl}
            onToggle={onToggleMusic}
          />

          <button
            type="button"
            onClick={onOpenCustomize}
            className="royal-btn inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] sm:px-4"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle chapter menu"
            className="royal-btn-outline inline-flex items-center justify-center rounded-full p-2 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Chapter Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-3 top-16 z-30 royal-glass rounded-2xl p-3 lg:hidden">
          <p className="px-3 pb-2 font-royal-display text-[10px] uppercase tracking-[0.25em] text-[#f4c2c2]/80">
            Palace Chapters
          </p>
          <div className="grid gap-1.5">
            {CHAPTERS.map((chapter) => {
              const active = chapter.id === currentChapter;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => {
                    onSelectChapter(chapter.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition ${
                    active
                      ? 'bg-[#d4af37]/25 border border-[#d4af37]/60 text-[#fff6df]'
                      : 'hover:bg-white/5 text-[#faf6f0]/85'
                  }`}
                >
                  <div>
                    <div className="font-royal-display text-xs tracking-[0.14em] uppercase">
                      {chapter.roman}. {chapter.title}
                    </div>
                    <div className="text-xs italic text-[#f4c2c2]/75">
                      {chapter.subtitle}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#d4af37]" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Corner Chapter Step Controls */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-20 flex items-center gap-2 sm:bottom-6 sm:right-6">
        {prevChapter && (
          <button
            type="button"
            onClick={() => onSelectChapter(prevChapter.id)}
            className="pointer-events-auto royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] sm:text-[11px]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{prevChapter.shortName}</span>
          </button>
        )}
        {nextChapter && (
          <button
            type="button"
            onClick={() => onSelectChapter(nextChapter.id)}
            className="pointer-events-auto royal-btn-outline inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] sm:text-[11px]"
          >
            <span className="hidden sm:inline">Next: {nextChapter.shortName}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </>
  );
};
