import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { peelFacts, interpolateFact } from "../data/peelFacts";
import type { PeelFact } from "../data/peelFacts";

interface PeelFactTickerProps {
  probability: number;
}

export function PeelFactTicker({ probability }: PeelFactTickerProps) {
  const [fact, setFact] = useState<PeelFact | null>(null);
  const [displayText, setDisplayText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Pick a starting fact immediately
    const pickFact = () => {
      const f = peelFacts[Math.floor(Math.random() * peelFacts.length)];
      setFact(f);
      setDisplayText(interpolateFact(f, probability));
    };
    pickFact();

    // Rotate every 5 seconds
    intervalRef.current = setInterval(() => {
      setFact((prev) => {
        let f: PeelFact;
        do {
          f = peelFacts[Math.floor(Math.random() * peelFacts.length)];
        } while (prev && f.text === prev.text);
        setDisplayText(interpolateFact(f, probability));
        return f;
      });
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [probability]);

  const toneColors = {
    scientific: "text-blue-300/60",
    legal: "text-amber-300/60",
    historical: "text-emerald-300/60",
    warning: "text-red-300/60",
  };

  const tonePrefix = {
    scientific: "PEEL SCIENCE:",
    legal: "PEEL LAW:",
    historical: "PEEL HISTORY:",
    warning: "PEEL ALERT:",
  };

  if (!fact) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="text-center pt-2"
    >
      <div className="relative h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={displayText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className={`text-[10px] leading-6 font-mono tracking-wide ${toneColors[fact.tone]}`}
          >
            <span className="font-bold mr-1.5 opacity-70">
              {tonePrefix[fact.tone]}
            </span>
            {displayText}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
