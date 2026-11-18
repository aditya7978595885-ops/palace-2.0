import React from 'react';
import { Crown, Sparkles, X } from 'lucide-react';
import { BallroomPlaqueData } from '../types/palace';

interface PlaqueEditorModalProps {
  isOpen: boolean;
  plaque: BallroomPlaqueData;
  onChange: (partial: Partial<BallroomPlaqueData>) => void;
  onClose: () => void;
}

export const PlaqueEditorModal: React.FC<PlaqueEditorModalProps> = ({
  isOpen,
  plaque,
  onChange,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/45 p-3 backdrop-blur-sm sm:p-6">
      <div className="royal-glass royal-scroll max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#d4af37]/25 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 font-royal-display text-[10px] uppercase tracking-[0.3em] text-[#f4c2c2]">
              <Crown className="h-3.5 w-3.5 text-[#d4af37]" />
              Royal Ballroom Engraving
            </div>
            <h3 className="font-royal-display mt-1 text-xl tracking-[0.14em] text-[#f3d9a4]">
              Customize Gilded Plaque
            </h3>
            <p className="mt-1 text-sm italic text-[#faf6f0]/75">
              Changes engrave live onto the 3D golden plaque in the ballroom.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plaque editor"
            className="rounded-full border border-[#d4af37]/30 p-2 text-[#f3d9a4] transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
              Main Title
            </label>
            <input
              type="text"
              value={plaque.mainTitle}
              onChange={(e) => onChange({ mainTitle: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
                Dedication Line
              </label>
              <input
                type="text"
                value={plaque.dedication}
                onChange={(e) => onChange({ dedication: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
              />
            </div>

            <div>
              <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
                Recipient&apos;s Name
              </label>
              <input
                type="text"
                value={plaque.recipientName}
                onChange={(e) => onChange({ recipientName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
              />
            </div>
          </div>

          <div>
            <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
              Romantic Message
            </label>
            <textarea
              rows={4}
              value={plaque.romanticMessage}
              onChange={(e) => onChange({ romanticMessage: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm leading-relaxed text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
            />
          </div>

          <div>
            <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
              Special Date
            </label>
            <input
              type="text"
              value={plaque.specialDate}
              onChange={(e) => onChange({ specialDate: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
            />
          </div>

          <div>
            <label className="block font-royal-display text-[10px] uppercase tracking-[0.22em] text-[#f3d9a4]">
              Additional Personal Text
            </label>
            <input
              type="text"
              value={plaque.additionalText}
              onChange={(e) => onChange({ additionalText: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-[#d4af37]/35 bg-black/35 px-3.5 py-2.5 text-sm text-[#faf6f0] outline-none focus:border-[#f3d9a4]"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#d4af37]/20 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs italic text-[#f4c2c2]">
            <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
            Auto-saved locally
          </span>
          <button
            type="button"
            onClick={onClose}
            className="royal-btn rounded-full px-5 py-2.5 text-[11px]"
          >
            Admire Plaque
          </button>
        </div>
      </div>
    </div>
  );
};
