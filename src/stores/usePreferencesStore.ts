import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PrayerCategory } from "@/components/PrayerCategories";
import type { FaithId } from "@/lib/faiths";
import { PreferencesSchema } from "@/lib/schemas";

interface PreferencesState {
  faithId: FaithId;
  department: string;
  category: PrayerCategory;
  researchConsent: boolean;
  shareToWall: boolean;
  setFaith: (id: FaithId) => void;
  setDepartment: (dept: string) => void;
  setCategory: (cat: PrayerCategory) => void;
  setResearchConsent: (consent: boolean) => void;
  setShareToWall: (share: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      faithId: "christianity",
      department: "general",
      category: null,
      researchConsent: false,
      shareToWall: true,
      setFaith: (id) => set({ faithId: id, department: "general" }),
      setDepartment: (dept) => set({ department: dept }),
      setCategory: (cat) => set({ category: cat }),
      setResearchConsent: (consent) => set({ researchConsent: consent }),
      setShareToWall: (share) => set({ shareToWall: share }),
    }),
    {
      name: "hotline-preferences",
      merge: (persisted, current) => {
        const parsed = PreferencesSchema.safeParse(persisted);
        if (parsed.success) {
          return { ...current, ...parsed.data };
        }
        return current;
      },
    },
  ),
);
