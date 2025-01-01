import { Button } from "@/components/ui/button";
import { useFontSizeStore } from "@/stores/useFontSizeStore";

const FontSizeToggle = () => {
  const { fontSize, increase, decrease } = useFontSizeStore();

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={decrease}
        disabled={fontSize === "sm"}
        className="text-xs px-2 h-8 font-bold"
        title="Decrease font size"
        aria-label="Decrease font size"
      >
        A-
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={increase}
        disabled={fontSize === "lg"}
        className="text-sm px-2 h-8 font-bold"
        title="Increase font size"
        aria-label="Increase font size"
      >
        A+
      </Button>
    </div>
  );
};

export default FontSizeToggle;
