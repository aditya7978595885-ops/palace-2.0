import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ChapterMeta } from '../types/palace';

interface ChapterTransitionProps {
  transitionChapter: ChapterMeta | null;
}

export const ChapterTransition: React.FC<ChapterTransitionProps> = ({
  transitionChapter,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transitionChapter || !overlayRef.current) return;
    gsap.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.42, ease: 'power2.out' }
    );
  }, [transitionChapter]);

  if (!transitionChapter) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(36,14,38,0.96)_0%,rgba(10,5,16,0.99)_100%)] text-center"
    >
      <div className="h-px w-28 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      <p className="font-royal-display mt-5 text-xs uppercase tracking-[0.42em] text-[#f4c2c2]">
        Chapter {transitionChapter.roman}
      </p>
      <h2 className="gold-shimmer-text font-royal-display mt-2 text-2xl tracking-[0.2em] sm:text-4xl">
        {transitionChapter.title}
      </h2>
      <p className="mt-2 text-lg italic text-[#faf6f0]/80">
        {transitionChapter.subtitle}
      </p>
      <div className="mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
    </div>
  );
};
