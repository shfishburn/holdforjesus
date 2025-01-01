import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-lg"
      title={theme === "dark" ? "Day Prayer mode" : "Night Prayer mode"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </Button>
  );
};

export default DarkModeToggle;
