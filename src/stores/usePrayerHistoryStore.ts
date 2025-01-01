import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FaithId } from "@/lib/faiths";
import { PrayerHistorySchema, type PrayerRecord } from "@/lib/schemas";

interface PrayerHistoryState {
  history: PrayerRecord[];
  addRecord: (
    prayer: string,
    response: string,
    faithId?: FaithId,
    department?: string,
    category?: string,
  ) => PrayerRecord;
  rateRecord: (id: string, rating: "up" | "down") => void;
  clearHistory: () => void;
}

const MAX_RECORDS = 50;

export const usePrayerHistoryStore = create<PrayerHistoryState>()(
  persist(
    (set, _get) => ({
      history: [],
      addRecord: (prayer, response, faithId, department, category) => {
        const record: PrayerRecord = {
          id: crypto.randomUUID(),
          prayer,
          response,
          timestamp: Date.now(),
          rating: null,
          faithId,
          department,
          category,
        };
        set((state) => ({
          history: [record, ...state.history].slice(0, MAX_RECORDS),
        }));
        return record;
      },
      rateRecord: (id, rating) => {
        set((state) => ({
          history: state.history.map((r) => (r.id === id ? { ...r, rating } : r)),
        }));
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "jesus-hotline-history",
      merge: (persisted: unknown, current) => {
        const persistedHistory =
          typeof persisted === "object" && persisted !== null && "history" in persisted
            ? (persisted as { history?: unknown }).history
            : undefined;
        const parsed = PrayerHistorySchema.safeParse(persistedHistory);
        return { ...current, history: parsed.success ? parsed.data : [] };
      },
    },
  ),
);
