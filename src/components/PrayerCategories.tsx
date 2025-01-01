import { motion } from "framer-motion";

export type PrayerCategory = "gratitude" | "guidance" | "complaint" | "emergency" | null;

interface PrayerCategoriesProps {
  value: PrayerCategory;
  onChange: (cat: PrayerCategory) => void;
}

const categories: { id: PrayerCategory; label: string; emoji: string }[] = [
  { id: "gratitude", label: "Gratitude", emoji: "🙏" },
  { id: "guidance", label: "Guidance", emoji: "🧭" },
  { id: "complaint", label: "Complaint", emoji: "😤" },
  { id: "emergency", label: "Emergency", emoji: "🆘" },
];

const PrayerCategories = ({ value, onChange }: PrayerCategoriesProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(value === cat.id ? null : cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            value === cat.id
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-card text-muted-foreground border-border hover:border-accent/50"
          }`}
          aria-label={`${cat.label} category`}
          aria-pressed={value === cat.id}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default PrayerCategories;
