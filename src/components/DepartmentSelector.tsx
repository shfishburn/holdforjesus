import { motion } from "framer-motion";
import type { FaithConfig } from "@/lib/faiths";

interface DepartmentSelectorProps {
  value: string;
  onChange: (dept: string) => void;
  faith: FaithConfig;
}

const DepartmentSelector = ({ value, onChange, faith }: DepartmentSelectorProps) => {
  return (
    <div className="w-full max-w-lg space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Department
      </p>
      <div className="flex flex-wrap gap-2">
        {faith.departments.map((dept) => (
          <motion.button
            key={dept.id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(dept.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              value === dept.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
            title={dept.desc}
            aria-label={`${dept.label}: ${dept.desc}`}
            aria-pressed={value === dept.id}
          >
            <span>{dept.emoji}</span>
            <span>{dept.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DepartmentSelector;
