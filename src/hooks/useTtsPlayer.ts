import { useCallback, useEffect, useRef, useState } from "react";
import { claimAudio, isActiveAudio, stopGlobalAudio } from "@/lib/audioManager";

export type PlaybackState = "idle" | "loading" | "playing" | "done" | "error";

interface UseTtsPlayerOptions {
  text: string;
  department: string;
  faith: string;
  type?: "response" | "prayer";
  /** If true, skip prefetch and playback entirely */
  disabled?: boolean;
}

interface UseTtsPlayerReturn {
  state: PlaybackState;
  prefetching: boolean;
  prefetchReady: boolean;
  handlePlay: () => Promise<void>;
  handleStop: () => void;
}

export function useTtsPlayer({
  text,
  department,
  faith,
  type,
  disabled = false,
}: UseTtsPlayerOptions): UseTtsPlayerReturn {
  const [state, setState] = useState<PlaybackState>("idle");
  const [prefetching, setPrefetching] = useState(false);
  const [prefetchReady, setPrefetchReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const cachedBlobRef = useRef<Blob | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current && isActiveAudio(audioRef.current)) {
        stopGlobalAudio();
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  // Pre-fetch TTS audio on mount
  useEffect(() => {
    if (disabled || cachedBlobRef.current) return;
    const controller = new AbortController();
    setPrefetching(true);
    (async () => {
      try {
        const body: Record<string, string> = { text, department, faith };
        if (type) body.type = type;

        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0) {
            cachedBlobRef.current = blob;
            setPrefetchReady(true);
          }
        }
      } catch {
        // Pre-fetch failed silently — will retry on play
      } finally {
        setPrefetching(false);
      }
    })();
    return () => controller.abort();
  }, [text, department, faith, type, disabled]);

  const playBlob = useCallback((audio: HTMLAudioElement, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = url;

    audio.addEventListener(
      "canplaythrough",
      () => {
        if (!isActiveAudio(audio)) return;
        setState("playing");
        audio.play().catch(() => setState("error"));
      },
      { once: true },
    );

    audio.addEventListener(
      "ended",
      () => {
        if (isActiveAudio(audio)) setState("done");
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        if (isActiveAudio(audio)) setState("error");
      },
      { once: true },
    );

    audio.src = url;
    audio.load();
  }, []);

  const handlePlay = useCallback(async () => {
    if (state === "loading") return;

    const audio = claimAudio(() => {
      setState((s) => (s === "playing" || s === "loading" ? "done" : s));
    });
    audioRef.current = audio;

    if (cachedBlobRef.current) {
      playBlob(audio, cachedBlobRef.current);
      return;
    }

    setState("loading");

    try {
      const body: Record<string, string> = { text, department, faith };
      if (type) body.type = type;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Empty audio response");

      cachedBlobRef.current = blob;

      if (!isActiveAudio(audio)) return;
      playBlob(audio, blob);
    } catch (err) {
      console.error("[TTS] Fetch failed:", { type: type ?? "response", err });
      if (isActiveAudio(audio)) setState("error");
    }
  }, [state, text, department, faith, type, playBlob]);

  const handleStop = useCallback(() => {
    stopGlobalAudio();
    audioRef.current = null;
    setState("done");
  }, []);

  return { state, prefetching, prefetchReady, handlePlay, handleStop };
}
