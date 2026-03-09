import { z } from "zod";

export const FAITH_IDS = [
  "christianity",
  "islam",
  "judaism",
  "hinduism",
  "buddhism",
  "secular",
] as const;

export const PreferencesSchema = z.object({
  faithId: z.enum(FAITH_IDS).catch("christianity"),
  department: z.string().catch("general"),
  category: z.enum(["gratitude", "guidance", "complaint", "emergency"]).nullable().catch(null),
  researchConsent: z.boolean().catch(false),
  shareToWall: z.boolean().catch(true),
  analyticsConsent: z.boolean().catch(false),
  analyticsConsentPrompted: z.boolean().catch(false),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const PrayerRecordSchema = z.object({
  id: z.string(),
  prayer: z.string(),
  response: z.string(),
  timestamp: z.number(),
  rating: z.enum(["up", "down"]).nullable().optional(),
  faithId: z.enum(FAITH_IDS).optional(),
  department: z.string().optional(),
  category: z.string().optional(),
});

export type PrayerRecord = z.infer<typeof PrayerRecordSchema>;

export const PrayerHistorySchema = z.array(PrayerRecordSchema).catch([]);
