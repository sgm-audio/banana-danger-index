import { motion } from "framer-motion";
import { Calculator, Flame, Zap, Atom, Target, Droplet, Wind } from "lucide-react";

interface AbsurdMetricsProps {
  probability: number;
}

const metricCategories = [
  { key: "friction", label: "Coefficient of Friction", unit: "μ", icon: Flame, color: "text-orange-400" },
  { key: "tensile", label: "Peel Tensile Strength", unit: "MPa", icon: Target, color: "text-green-400" },
  { key: "velocity", label: "Slip Velocity Vector", unit: "m/s²", icon: Zap, color: "text-yellow-400" },
  { key: "dna", label: "Banana DNA Purity", unit: "%", icon: Atom, color: "text-pink-400" },
  { key: "hazard", label: "Hazard Classification", unit: "Class", icon: Calculator, color: "text-red-400" },
  { key: "viscosity", label: "Residue Viscosity", unit: "cP", icon: Droplet, color: "text-cyan-400" },
  { key: "aerodynamics", label: "Aerodynamic Drag Coeff.", unit: "Cd", icon: Wind, color: "text-purple-400" },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMetrics(probability: number) {
  const baseSeed = probability * 1000;
  return metricCategories.map((cat, i) => {
    const seed = baseSeed + i * 37;
    const r = seededRandom(seed);
    const r2 = seededRandom(seed + 1);
    const r3 = seededRandom(seed + 2);

    let value: string;
    let subtext: string;

    switch (cat.key) {
      case "friction": {
        value = (0.02 + r * 0.15 + probability * 0.003).toFixed(4);
        subtext = `(${["Teflon-like", "Buttered eel", "Wet ice", "Greased lightning"][Math.floor(r3 * 4)]})`;
        break;
      }
      case "tensile": {
        value = (0.5 + r * 8 + probability * 0.05).toFixed(1);
        subtext = `(${["Tissue paper", "Duct tape", "Spider silk", "Titanium"][Math.floor(r3 * 4)]})`;
        break;
      }
      case "velocity": {
        value = (1.2 + r * 15 + probability * 0.2).toFixed(1);
        subtext = `(${["Leisurely stroll", "Brisk walk", "Sprint", "Rocket sled"][Math.floor(r3 * 4)]})`;
        break;
      }
      case "dna": {
        value = (45 + r * 40 + probability * 0.3).toFixed(1);
        subtext = `(${["Cavendish clone", "Wild Musa", "GMO mystery", "Alien cultivar"][Math.floor(r3 * 4)]})`;
        break;
      }
      case "hazard": {
        const classes = ["I - Nuisance", "II - Menace", "III - Threat", "IV - Catastrophe", "V - Extinction Event"];
        const idx = Math.min(4, Math.floor(probability / 20 + r * 2));
        value = classes[idx];
        subtext = `(OSHA would weep)`;
        break;
      }
      case "viscosity": {
        value = (10 + r * 5000 + probability * 20).toFixed(0);
        subtext = `(${["Water", "Honey", "Molasses", "Glue"][Math.floor(r3 * 4)]})`;
        break;
      }
      case "aerodynamics": {
        value = (0.05 + r * 1.2 + probability * 0.005).toFixed(3);
        subtext = `(${["Arrow", "Brick", "Parachute", "Flying squirrel"][Math.floor(r3 * 4)]})`;
        break;
      }
      default: {
        value = "???";
        subtext = "";
        break;
      }
    }

    return { ...cat, value, subtext, r, r2 };
  });
}

export function AbsurdMetricsPanel({ probability }: AbsurdMetricsProps) {
  const metrics = generateMetrics(probability);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-mono text-lg font-bold tracking-wide">PEEL TELEMETRY v3.7.α</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">
          LIVE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: "easeOut" }}
            className="relative rounded-xl border border-border/30 bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {m.label}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums">
              {m.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{m.unit}</span>
            </div>
            <div className="text-[10px] text-muted-foreground/70 font-mono mt-1 truncate">
              {m.subtext}
            </div>

            {/* Animated "live" indicator */}
            <div className="absolute top-3 right-3">
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: m.r * 2 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Absurd derived metrics row */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ delay: 0.6 }}
        className="pt-4 border-t border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"
      >
        <DerivedMetric
          label="Est. Insurance Premium"
          value={`$${(probability * 47 + seededRandom(probability * 1000 + 0.5) * 500).toFixed(2)}`}
          unit="/incident"
        />
        <DerivedMetric
          label="Lawsuit Probability"
          value={`${Math.min(99.9, probability * 1.3 + seededRandom(probability * 1000 + 1.5) * 10).toFixed(1)}%`}
          unit="confidence"
        />
        <DerivedMetric
          label="Cartoon Physics Violation"
          value={`${Math.floor(probability / 10 + 3)}.${Math.floor(seededRandom(probability * 1000 + 2.5) * 10)}`}
          unit="Looney Units"
        />
        <DerivedMetric
          label="Peel Half-Life"
          value={`${(2 + seededRandom(probability * 1000 + 3.5) * 48).toFixed(1)}`}
          unit="hours"
        />
      </motion.div>
    </motion.div>
  );
}

function DerivedMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg bg-background/50 p-3 border border-border/20">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-mono text-xl font-bold tabular-nums text-primary">
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground font-mono">{unit}</div>
    </div>
  );
}