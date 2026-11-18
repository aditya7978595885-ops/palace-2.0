import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Crown, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  ready: boolean;
  title: string;
  recipientName: string;
  onFinished: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  ready,
  title,
  recipientName,
  onFinished,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(12);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (ready) return Math.min(100, prev + 16);
        return Math.min(88, prev + 6);
      });
    }, 90);
    return () => window.clearInterval(interval);
  }, [ready]);

  useEffect(() => {
    if (progress >= 100 && ready && containerRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setHidden(true);
          onFinished();
        },
      });
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.9,
        ease: 'power2.inOut',
        delay: 0.25,
      });
    }
  }, [progress, ready, onFinished]);

  if (hidden) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_38%,#2b1230_0%,#120a1c_58%,#08050d_100%)] px-6 text-center"
    >
      {/* Decorative golden frame rings */}
      <div className="pointer-events-none absolute inset-6 rounded-3xl border border-[#d4af37]/20 sm:inset-10" />
      <div className="pointer-events-none absolute inset-8 rounded-3xl border border-[#f4c2c2]/10 sm:inset-12" />

      <div className="relative flex flex-col items-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af37]/50 bg-[#d4af37]/10 shadow-gilded animate-soft-float">
          <Crown className="h-9 w-9 text-[#f3d9a4]" />
        </div>

        <p className="font-royal-display text-[11px] uppercase tracking-[0.4em] text-[#f4c2c2]/85">
          Preparing Your Private Estate
        </p>

        <h1 className="gold-shimmer-text font-royal-display mt-3 text-3xl font-semibold tracking-[0.18em] sm:text-5xl">
          {title}
        </h1>

        <p className="font-royal-script mt-3 text-3xl text-[#f4c2c2] sm:text-4xl">
          Dedicated to {recipientName}
        </p>

        {/* Gilded progress bar */}
        <div className="mt-10 w-64 sm:w-80">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#b88920] via-[#f7e1a0] to-[#f4c2c2] transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs tracking-widest text-[#f3d9a4]/80 font-royal-display">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
              LIGHTING THE CHANDELIERS
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
