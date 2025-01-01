import { useEffect, useRef } from "react";

export type MusicStyle = "harps" | "gospel" | "chant";

// Pentatonic scale frequencies for harp
const HARP_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
const HARP_PATTERNS = [
  [0, 2, 4, 6, 8, 6, 4, 2],
  [1, 3, 5, 7, 9, 7, 5, 3],
  [0, 4, 6, 8, 6, 4, 2, 0],
  [2, 4, 6, 8, 9, 8, 6, 4],
];

// Gospel: warm sustained chords, lower register
const GOSPEL_NOTES = [130.81, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
const GOSPEL_PATTERNS = [
  [0, 2, 4, 6, 4, 2],
  [1, 3, 5, 7, 5, 3],
  [0, 4, 6, 8, 6, 4],
];

// Gregorian: modal scale, slow monophonic
const CHANT_NOTES = [196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];
const CHANT_PATTERNS = [
  [0, 1, 2, 3, 4, 3, 2, 1],
  [2, 3, 4, 5, 6, 5, 4, 3],
  [0, 2, 4, 6, 7, 6, 4, 2],
];

interface StyleConfig {
  notes: number[];
  patterns: number[][];
  noteSpacing: number;
  noteDuration: number;
  volume: number;
  waveType: OscillatorType;
  harmonicRatio: number;
  filterFreq: number;
}

const STYLE_CONFIGS: Record<MusicStyle, StyleConfig> = {
  harps: {
    notes: HARP_NOTES,
    patterns: HARP_PATTERNS,
    noteSpacing: 0.35,
    noteDuration: 1.2,
    volume: 0.08,
    waveType: "sine",
    harmonicRatio: 0.15,
    filterFreq: 2000,
  },
  gospel: {
    notes: GOSPEL_NOTES,
    patterns: GOSPEL_PATTERNS,
    noteSpacing: 0.5,
    noteDuration: 2.0,
    volume: 0.06,
    waveType: "triangle",
    harmonicRatio: 0.2,
    filterFreq: 1200,
  },
  chant: {
    notes: CHANT_NOTES,
    patterns: CHANT_PATTERNS,
    noteSpacing: 0.7,
    noteDuration: 2.5,
    volume: 0.07,
    waveType: "sine",
    harmonicRatio: 0.05,
    filterFreq: 800,
  },
};

function playNote(ctx: AudioContext, freq: number, startTime: number, config: StyleConfig) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = config.waveType;
  osc.frequency.value = freq;

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2;
  gain2.gain.value = config.harmonicRatio;

  filter.type = "lowpass";
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 1;

  const vol = config.volume * (0.7 + Math.random() * 0.3);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.noteDuration);

  gain2.gain.setValueAtTime(0, startTime);
  gain2.gain.linearRampToValueAtTime(vol * config.harmonicRatio, startTime + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + config.noteDuration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + config.noteDuration);
  osc2.start(startTime);
  osc2.stop(startTime + config.noteDuration);
}

function schedulePattern(ctx: AudioContext, startTime: number, config: StyleConfig): number {
  const pattern = config.patterns[Math.floor(Math.random() * config.patterns.length)];
  pattern.forEach((noteIdx, i) => {
    playNote(ctx, config.notes[noteIdx], startTime + i * config.noteSpacing, config);
  });
  return startTime + pattern.length * config.noteSpacing;
}

export function useHoldMusic(playing: boolean, style: MusicStyle = "harps") {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;

    const config = STYLE_CONFIGS[style];
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    let nextTime = ctx.currentTime + 0.1;
    nextTime = schedulePattern(ctx, nextTime, config);

    const interval = config.noteSpacing * config.patterns[0].length * 1000 + 500;
    intervalRef.current = setInterval(() => {
      if (ctx.state === "closed") return;
      nextTime = schedulePattern(ctx, nextTime + 0.5, config);
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      ctx.close();
      ctxRef.current = null;
    };
  }, [playing, style]);
}
