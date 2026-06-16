import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Trash2,
  Upload,
  AlertTriangle,
  Clock,
  Gavel,
  Database,
} from "lucide-react";
import type { PeelRecord } from "../lib/peelRegistry";
import {
  getPeelRegistry,
  deletePeelRecord,
  exportRegistry,
  importRegistry,
  clearRegistry,
  getRegistryStats,
} from "../lib/peelRegistry";

export function PeelRegistryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [registry, setRegistry] = useState<PeelRecord[]>([]);
  const [stats, setStats] = useState(getRegistryStats());
  const [importResult, setImportResult] = useState<string | null>(null);

  const refresh = () => {
    setRegistry(getPeelRegistry());
    setStats(getRegistryStats());
  };

  const handleDelete = (id: string) => {
    deletePeelRecord(id);
    refresh();
  };

  const handleExport = () => {
    const json = exportRegistry();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peel-registry-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = importRegistry(text);
      if (result.success) {
        setImportResult(`Imported ${result.added} case(s)`);
        refresh();
      } else {
        setImportResult(`Import failed: ${result.error}`);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (registry.length === 0) return;
    clearRegistry();
    refresh();
    setImportResult("Registry cleared.");
  };

  const verdictColor = (v: string) => {
    switch (v) {
      case "GUILTY": return "text-red-400";
      case "ACQUITTED": return "text-green-400";
      case "MISTRIAL": return "text-yellow-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => { refresh(); setIsOpen(true); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full border border-border/40 bg-card/80 backdrop-blur-xl shadow-lg hover:bg-primary/10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Database className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono font-bold">
          PEEL RECORDS {stats ? `(${stats.total})` : "(0)"}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/30">
                <div>
                  <h2 className="font-mono text-lg font-bold tracking-wide flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    PEEL REGISTRY
                  </h2>
                  {stats && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {stats.total} case{stats.total !== 1 ? "s" : ""} · Avg danger{" "}
                      {stats.avgProb}% · {stats.guiltyCount} guilty verdicts
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-mono">✕</span>
                </button>
              </div>

              {/* Actions bar */}
              <div className="flex gap-2 p-4 border-b border-border/20 bg-muted/20">
                <button
                  onClick={handleExport}
                  disabled={registry.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 text-xs font-mono hover:bg-primary/10 transition-all disabled:opacity-30"
                >
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 text-xs font-mono hover:bg-primary/10 transition-all"
                >
                  <Upload className="h-3.5 w-3.5" /> Import
                </button>
                <button
                  onClick={handleClear}
                  disabled={registry.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/30 text-xs font-mono hover:bg-red-500/10 transition-all disabled:opacity-30 ml-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              </div>

              {/* Import result feedback */}
              <AnimatePresence>
                {importResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 bg-primary/10 border-b border-primary/20"
                  >
                    <p className="text-xs font-mono text-primary">{importResult}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Record list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {registry.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-sm font-mono">No peel records yet.</p>
                    <p className="text-xs font-mono mt-1 opacity-60">
                      Analyze a banana to populate the registry.
                    </p>
                  </div>
                ) : (
                  registry.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border/30 bg-card/50 p-4 hover:border-border/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-primary font-bold tracking-wider truncate">
                            {record.caseId}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(record.timestamp).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-full rounded-full bg-background overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${record.probability}%`,
                                  background:
                                    record.probability >= 80
                                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                      : record.probability >= 50
                                      ? "linear-gradient(90deg, #facc15, #f59e0b)"
                                      : "linear-gradient(90deg, #22c55e, #eab308)",
                                }}
                              />
                            </div>
                            <span className="text-sm font-mono font-bold tabular-nums shrink-0">
                              {record.probability}%
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-current ${verdictColor(record.verdict)}`}
                        >
                          <Gavel className="h-3 w-3 inline mr-1" />
                          {record.verdict}
                        </span>
                      </div>

                      <p className="text-[10px] font-mono text-muted-foreground mt-2 truncate">
                        {record.imageName}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}