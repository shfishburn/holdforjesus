import { useCallback } from "react";

export function useDingSound() {
  return useCallback(() => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Two-note chime: E5 then G5
      const notes = [659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.8);
      });

      // Close context after sounds finish
      setTimeout(() => ctx.close(), 2000);
    } catch {
      // Audio not supported
    }
  }, []);
}
