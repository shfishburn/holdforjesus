import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo.tsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type FaithId, getFaith } from "@/lib/faiths";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { usePrayerHistoryStore } from "@/stores/usePrayerHistoryStore";
import { usePreferencesStore } from "@/stores/usePreferencesStore";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { faithId } = usePreferencesStore();
  const faith = getFaith(faithId);
  const { history, clearHistory } = usePrayerHistoryStore();
  const { isFavorite } = useFavoritesStore();

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Seo
        title={`Call History — ${faith.hotlineName}`}
        description="Review your local call history, revisit past prayers, and jump back into the hotline flow."
        path="/history"
      />

      <div className="flex flex-col items-center px-6 py-12 min-h-screen gap-6">
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-primary uppercase tracking-wider font-special-elite"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          📋 Call History
        </motion.h1>

        {history.length === 0 ? (
          <motion.div
            className="text-center space-y-4 py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">
              No calls yet. Your call history will appear here.
            </p>
            <Button onClick={() => navigate("/pray")} className="gap-2">
              📞 Make Your First Call
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-lg space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {history.length} call{history.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2 pr-3">
                {history.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    className="w-full text-left bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate("/pray", { state: { recordId: record.id } })}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm text-foreground line-clamp-1 flex-1">
                        {isFavorite(record.id) && <span className="mr-1">⭐</span>}
                        {record.prayer}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(record.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {record.faithId &&
                        (() => {
                          const f = getFaith(record.faithId as FaithId);
                          return (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {f.emoji} {f.name}
                            </Badge>
                          );
                        })()}
                      {record.department &&
                        record.faithId &&
                        (() => {
                          const f = getFaith(record.faithId as FaithId);
                          const dept = f.departments.find((d) => d.id === record.department);
                          return dept ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {dept.emoji} {dept.label}
                            </Badge>
                          ) : null;
                        })()}
                      {record.category && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {record.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {record.response}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default HistoryPage;
