import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontSize = "sm" | "default" | "lg";

interface FontSizeState {
  fontSize: FontSize;
  increase: () => void;
  decrease: () => void;
}

const SIZES: FontSize[] = ["sm", "default", "lg"];

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontSize: "default",
      increase: () => {
        const i = SIZES.indexOf(get().fontSize);
        if (i < SIZES.length - 1) set({ fontSize: SIZES[i + 1] });
      },
      decrease: () => {
        const i = SIZES.indexOf(get().fontSize);
        if (i > 0) set({ fontSize: SIZES[i - 1] });
      },
    }),
    { name: "hotline-font-size" },
  ),
);
