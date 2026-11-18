import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { loadAssetManifest } from '../utils/assetLoader';

interface MusicPlayerProps {
  enabled: boolean;
  volume: number;
  customAudioUrl: string | null;
  onToggle: (nextEnabled: boolean) => void;
}

// Romantic 3/4 Royal Waltz chord & harp melody sequence (in Hz)
// Progression: Dmaj7 -> Bm7 -> Gmaj7 -> A7sus4 -> Dmaj7 -> F#m7 -> Em7 -> A7
const WALTZ_MEASURES: Array<{ bass: number; pad: number[]; arpeggio: number[] }> = [
  { bass: 146.83, pad: [293.66, 369.99, 440.0, 554.37], arpeggio: [587.33, 440.0, 554.37, 659.25, 739.99, 587.33] },
  { bass: 123.47, pad: [246.94, 293.66, 369.99, 440.0], arpeggio: [493.88, 369.99, 440.0, 587.33, 659.25, 493.88] },
  { bass: 98.0, pad: [196.0, 293.66, 369.99, 493.88], arpeggio: [587.33, 493.88, 392.0, 493.88, 587.33, 739.99] },
  { bass: 110.0, pad: [220.0, 293.66, 329.63, 440.0], arpeggio: [659.25, 554.37, 440.0, 493.88, 554.37, 659.25] },
  { bass: 146.83, pad: [293.66, 369.99, 440.0, 587.33], arpeggio: [739.99, 659.25, 587.33, 440.0, 554.37, 659.25] },
  { bass: 185.0, pad: [220.0, 277.18, 369.99, 440.0], arpeggio: [554.37, 440.0, 369.99, 440.0, 554.37, 739.99] },
  { bass: 164.81, pad: [196.0, 246.94, 329.63, 493.88], arpeggio: [493.88, 392.0, 329.63, 493.88, 587.33, 659.25] },
  { bass: 110.0, pad: [220.0, 277.18, 329.63, 392.0], arpeggio: [554.37, 440.0, 392.0, 440.0, 554.37, 493.88] },
];

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  enabled,
  volume,
  customAudioUrl,
  onToggle,
}) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(customAudioUrl);

  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);

  // Resolve optional manifest audio if no user upload override exists
  useEffect(() => {
    if (customAudioUrl) {
      setResolvedAudioUrl(customAudioUrl);
      return;
    }
    loadAssetManifest().then((manifest) => {
      setResolvedAudioUrl(manifest.audio.backgroundMusic);
    });
  }, [customAudioUrl]);

  // Unlock audio cleanly on first user gesture
  useEffect(() => {
    const unlock = () => setHasInteracted(true);
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Stop Web Audio synthesizer helper
  const stopSynth = () => {
    if (schedulerRef.current !== null) {
      window.clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    if (masterGainRef.current && audioCtxRef.current) {
      try {
        masterGainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.25);
      } catch {
        // Ignore closed context
      }
    }
  };

  // HTML5 Audio playback when a local audio file is configured
  useEffect(() => {
    if (!resolvedAudioUrl) {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current = null;
      }
      return;
    }

    stopSynth();
    const audio = new Audio(resolvedAudioUrl);
    audio.loop = true;
    audio.volume = enabled ? volume : 0;
    htmlAudioRef.current = audio;

    if (enabled && hasInteracted) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      htmlAudioRef.current = null;
    };
  }, [resolvedAudioUrl, enabled, hasInteracted]);

  // Update HTML5 Audio volume
  useEffect(() => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = enabled ? volume : 0;
      if (enabled && hasInteracted && htmlAudioRef.current.paused) {
        htmlAudioRef.current.play().catch(() => {});
      } else if (!enabled && !htmlAudioRef.current.paused) {
        htmlAudioRef.current.pause();
      }
    }
  }, [enabled, volume, hasInteracted]);

  // Built-in generative romantic Web Audio harp & strings waltz (100% local, offline)
  useEffect(() => {
    if (resolvedAudioUrl) return;
    if (!enabled || !hasInteracted) {
      stopSynth();
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!masterGainRef.current) {
      const master = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2100;

      // Subtle warm delay for palace hall acoustics
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.34;
      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.28;
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.22;

      master.connect(filter);
      filter.connect(ctx.destination);
      filter.connect(delay);
      delay.connect(delayFeedback);
      delayFeedback.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(ctx.destination);

      masterGainRef.current = master;
    }

    const master = masterGainRef.current;
    master.gain.setTargetAtTime(Math.max(0.01, volume * 0.24), ctx.currentTime, 0.35);

    const playNote = (
      freq: number,
      duration: number,
      type: OscillatorType,
      peakGain: number,
      attack = 0.03
    ) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    };

    const tick = () => {
      const step = stepIndexRef.current;
      const measureIdx = Math.floor(step / 6) % WALTZ_MEASURES.length;
      const beatInMeasure = step % 6;
      const measure = WALTZ_MEASURES[measureIdx];

      // On downbeat, bloom warm strings pad + soft cello bass
      if (beatInMeasure === 0) {
        playNote(measure.bass, 2.9, 'sine', 0.28, 0.14);
        measure.pad.forEach((f) => playNote(f, 2.8, 'triangle', 0.055, 0.45));
      }

      // Romantic harp arpeggio note on every 8th note of 3/4 waltz
      const harpNote = measure.arpeggio[beatInMeasure];
      playNote(harpNote, 1.45, 'triangle', beatInMeasure === 0 ? 0.18 : 0.12, 0.02);
      // Gentle octave crystalline shimmer on beat 1 & 4
      if (beatInMeasure === 0 || beatInMeasure === 3) {
        playNote(harpNote * 2, 1.1, 'sine', 0.04, 0.025);
      }

      stepIndexRef.current = (step + 1) % (WALTZ_MEASURES.length * 6);
    };

    tick();
    schedulerRef.current = window.setInterval(tick, 470);

    return () => {
      stopSynth();
    };
  }, [enabled, hasInteracted, resolvedAudioUrl]);

  // Smoothly update synth volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current && enabled) {
      masterGainRef.current.gain.setTargetAtTime(
        Math.max(0.001, volume * 0.24),
        audioCtxRef.current.currentTime,
        0.2
      );
    }
  }, [volume, enabled]);

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        setHasInteracted(true);
        onToggle(!enabled);
      }}
      title={enabled ? 'Mute Royal Waltz' : 'Play Royal Waltz'}
      aria-label={enabled ? 'Mute background music' : 'Play background music'}
      className="royal-btn-outline inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] sm:px-3.5"
    >
      {enabled ? (
        <>
          <Volume2 className="h-3.5 w-3.5 text-[#f3d9a4]" />
          <span className="hidden md:inline">Waltz On</span>
        </>
      ) : (
        <>
          <VolumeX className="h-3.5 w-3.5 text-[#f4c2c2]/75" />
          <span className="hidden md:inline">Muted</span>
        </>
      )}
      {enabled && hasInteracted && (
        <Music className="hidden h-3 w-3 animate-pulse text-[#f4c2c2] lg:inline" />
      )}
    </button>
  );
};
