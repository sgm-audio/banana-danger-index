import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert } from "lucide-react";

interface WarningBannerProps {
  warning: string | null;
}

export function WarningBanner({ warning }: WarningBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="relative"
    >
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 min-h-[5rem] flex items-center gap-4 backdrop-blur-sm">
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0"
        >
          <TriangleAlert className="h-6 w-6 text-red-400/80" />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.p
            key={warning ?? "empty"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm sm:text-base font-medium text-red-300/90 leading-relaxed"
          >
            {warning ?? (
              <span className="text-muted-foreground/50 italic">
                Waiting for banana data...
              </span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
