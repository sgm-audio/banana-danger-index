import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPeelProps {
  active: boolean;
}

// Pre-generated at module init — no randomness during render
const BANANA_PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 91) + 4,          // deterministic spread
  delay: ((i * 7) % 20) * 0.1,           // 0s to 1.9s
  duration: 2 + ((i * 3) % 12) * 0.25,   // 2s to 4.75s
  rotation: ((i * 47) % 360),             // 0-359 degrees
  scale: 0.6 + ((i * 11) % 8) * 0.075,   // 0.6 to 1.125
}));

export function ConfettiPeel({ active }: ConfettiPeelProps) {
  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {BANANA_PIECES.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute top-0"
              style={{ left: `${piece.x}%` }}
              initial={{
                y: -40,
                rotate: 0,
                scale: piece.scale,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation,
                opacity: [1, 1, 1, 0],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.25, 0.1, 0.25, 1],
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            >
              <span
                className="block text-center"
                style={{ fontSize: `${piece.scale * 28}px` }}
              >
                🍌
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
