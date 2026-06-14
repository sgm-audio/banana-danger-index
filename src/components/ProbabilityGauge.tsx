import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface ProbabilityGaugeProps {
  probability: number | null;
}

export function ProbabilityGauge({ probability }: ProbabilityGaugeProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (probability === null) {
      return;
    }

    const start = startRef.current;
    const diff = probability - start;
    const duration = 800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + diff * eased));
      startRef.current = Math.round(start + diff * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [probability, displayValue]);

  const level =
    probability === null
      ? "idle"
      : probability >= 70
        ? "danger"
        : probability >= 40
          ? "caution"
          : "safe";

  const levelColors = {
    idle: "text-muted-foreground",
    safe: "text-emerald-500",
    caution: "text-amber-500",
    danger: "text-red-500",
  };

  const levelLabels = {
    idle: "AWAITING DATA",
    safe: "LOW THREAT",
    caution: "ELEVATED RISK",
    danger: "IMMINENT DANGER",
  };

  const barColor = {
    idle: "bg-muted-foreground/20",
    safe: "bg-emerald-500",
    caution: "bg-amber-500",
    danger: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="text-center space-y-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={probability ?? "null"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "text-6xl sm:text-7xl font-black tracking-tighter font-mono transition-colors duration-500",
            levelColors[level]
          )}
        >
          {probability !== null ? `${displayValue}%` : "--"}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className={cn(
          "text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-500",
          levelColors[level]
        )}
      >
        {levelLabels[level]}
      </motion.div>

      {/* Progress bar */}
      {probability !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            className={cn("h-full rounded-full transition-colors", barColor[level])}
            initial={{ width: "0%" }}
            animate={{ width: `${displayValue}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
