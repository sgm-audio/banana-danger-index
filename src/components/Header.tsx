import { motion } from "framer-motion";
import { Banana } from "lucide-react";

export function Header() {
  return (
    <motion.div
      className="text-center space-y-3 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="inline-flex items-center justify-center gap-2"
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
      >
        <Banana className="h-8 w-8 text-banana-400" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Banana Danger Index
        </h1>
        <Banana className="h-8 w-8 text-banana-400 scale-x-[-1]" />
      </motion.div>
      <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base leading-relaxed">
        Upload a photo of a banana peel. We'll assess the gravity of the
        situation using cutting-edge yellowness analysis.
      </p>
    </motion.div>
  );
}
