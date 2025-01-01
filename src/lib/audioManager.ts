// Shared singleton audio manager — ensures only one TTS plays at a time
// and preserves user-gesture context for autoplay unlock.

let currentAudio: HTMLAudioElement | null = null;
let currentCleanup: (() => void) | null = null;

/**
 * Stop any currently playing TTS audio globally.
 */
export function stopGlobalAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
}

/**
 * Claim the global audio slot. Returns an Audio element that is already
 * "unlocked" synchronously in the user-gesture context.
 * Any previous audio is stopped first.
 *
 * @param onCleanup - optional callback when this audio is superseded
 */
export function claimAudio(onCleanup?: () => void): HTMLAudioElement {
  stopGlobalAudio();

  const audio = new Audio();
  // Synchronous unlock trick: play a silent source in the gesture context.
  // We do NOT await — keeping everything synchronous preserves the gesture.
  audio.muted = true;
  audio.play().catch(() => {});
  audio.pause();
  audio.muted = false;

  currentAudio = audio;
  currentCleanup = onCleanup ?? null;

  return audio;
}

/**
 * Check if a specific Audio element is still the active global one.
 */
export function isActiveAudio(audio: HTMLAudioElement): boolean {
  return currentAudio === audio;
}
