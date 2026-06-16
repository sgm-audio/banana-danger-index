import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banana, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { Header } from "./components/Header";
import { UploadZone } from "./components/UploadZone";
import { ProbabilityGauge } from "./components/ProbabilityGauge";
import { BananaCanvas } from "./components/BananaCanvas";
import { ConfettiPeel } from "./components/ConfettiPeel";
import { PeelFactTicker } from "./components/PeelFactTicker";
import { WarningBanner } from "./components/WarningBanner";
import { AbsurdMetricsPanel } from "./components/AbsurdMetricsPanel";
import { PeelRegistryPanel } from "./components/PeelRegistryPanel";
import { Button } from "./components/ui/button";
import { getRandomWarning } from "./data/hazardWarnings";
import { setMasterVolume, playConfettiChime } from "./lib/audio";

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [probability, setProbability] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);

  const calculateSlipProbability = useCallback(
    (img: HTMLImageElement): number => {
      const canvas = analysisCanvasRef.current;
      if (!canvas) return 50;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return 50;

      ctx.clearRect(0, 0, 100, 100);
      ctx.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      let totalR = 0,
        totalG = 0,
        totalB = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
      }

      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;

      const yellowScore = Math.max(0, (avgR + avgG) / 2 - avgB) / 255;
      let prob = Math.round(yellowScore * 100);
      if (prob < 5) prob = 5;
      if (prob > 99) prob = 99;
      return prob;
    },
    []
  );

  const handleImageUpload = useCallback((_file: File, dataUrl: string) => {
    setImageFile(_file);
    setImageDataUrl(dataUrl);
    setProbability(null);
    setWarning(null);
    setHasAnalyzed(false);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!imageDataUrl) return;

    const img = new Image();
    img.onload = () => {
      const prob = calculateSlipProbability(img);
      setProbability(prob);
      setWarning(getRandomWarning());
      setHasAnalyzed(true);
      setAnimKey((k) => k + 1);
      if (prob >= 80 && soundEnabled) {
        setMasterVolume(0.2);
        playConfettiChime();
      }
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, calculateSlipProbability, soundEnabled]);

  // Sync master volume with sound toggle
  useEffect(() => {
    setMasterVolume(soundEnabled ? 0.3 : 0);
  }, [soundEnabled]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#0d0b08] selection:bg-primary/20">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Hidden canvas for pixel analysis */}
      <canvas
        ref={analysisCanvasRef}
        width={100}
        height={100}
        className="hidden"
      />

      <motion.div
        className="relative w-full px-4 py-6 sm:py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Sound toggle */}
        <motion.button
          onClick={() => setSoundEnabled((s) => !s)}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full border border-border/30 bg-card/70 backdrop-blur-md text-xs font-mono hover:bg-primary/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-primary" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="hidden sm:inline">{soundEnabled ? "SFX ON" : "SFX OFF"}</span>
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${soundEnabled ? "bg-green-400" : "bg-red-400"}`}
          />
        </motion.button>
        <Header />

        <motion.div
          className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <UploadZone onImageUpload={handleImageUpload} />

          <AnimatePresence>
            {imageFile && !hasAnalyzed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-center"
              >
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Banana className="h-5 w-5" />
                  Analyze Peel Danger
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {probability !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <ProbabilityGauge probability={probability} />
                <BananaCanvas
                  slipProbability={probability}
                  animKey={animKey}
                />
                <PeelFactTicker probability={probability} />
                <WarningBanner warning={warning} />
                <AbsurdMetricsPanel probability={probability} />
              </motion.div>
            )}
          </AnimatePresence>

          <ConfettiPeel active={probability !== null && probability >= 80} />

          {/* Small disclaimer */}
          <motion.p
            className="text-center text-xs text-muted-foreground/50 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            This tool does not account for cartoon physics, but it should.
          </motion.p>
        </motion.div>
      </motion.div>

      <PeelRegistryPanel />
    </div>
  );
}

export default App;
