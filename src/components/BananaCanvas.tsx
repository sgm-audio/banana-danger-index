import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { getRandomBatmanWord } from "../data/batmanWords";

interface BananaCanvasProps {
  slipProbability: number;
  animKey: number;
}

const CANVAS_W = 600;
const CANVAS_H = 300;
const GROUND_Y = 220;
const PEEL_X = 350;
const PEEL_Y = GROUND_Y - 5;

type Phase = "idle" | "walking" | "slipping" | "fallen" | "comicbook" | "slowmo";

interface CrowdMember {
  x: number;
  y: number;
  fromLeft: boolean;
  word: string;
  pose: "horror" | "point" | "cover" | "laugh" | "facepalm";
}

const reactionWords = [
  "OOOF!", "GAH!", "YIKES!", "CLASSIC!",
  "DOH!", "HE'S DONE!", "NO WAY!",
  "RIGHT ON THE PEEL!", "OUCH!", "BAHAHA!",
  "HE GOT PEELED!", "WHAT A FALL!",
];

function pickReaction(used: string[]): string {
  const pool = reactionWords.filter((w) => !used.includes(w));
  return pool[Math.floor(Math.random() * pool.length)] || "OOF!";
}

function drawCrowdFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  pose: CrowdMember["pose"]
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 3;

  // Head
  ctx.beginPath();
  ctx.arc(0, -20, 9, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes — dots
  ctx.fillStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.arc(-3, -23, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -23, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  if (pose === "laugh" || pose === "horror") {
    ctx.arc(0, -17, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#e0e0e0";
    ctx.fill();
  } else if (pose === "facepalm") {
    ctx.moveTo(-3, -17);
    ctx.lineTo(3, -17);
    ctx.stroke();
  } else {
    ctx.arc(0, -17, 2.5, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  ctx.strokeStyle = "#e0e0e0";

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, 28);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  if (pose === "horror") {
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, -20);
    ctx.moveTo(0, 0);
    ctx.lineTo(14, -20);
  } else if (pose === "point") {
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, 5);
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -18);
  } else if (pose === "cover") {
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -12);
    ctx.moveTo(0, 0);
    ctx.lineTo(10, -12);
  } else if (pose === "laugh") {
    ctx.moveTo(0, 10);
    ctx.lineTo(-14, 26);
    ctx.moveTo(0, 10);
    ctx.lineTo(14, 26);
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(4, 14);
    ctx.lineTo(0, 28);
    ctx.stroke();
  } else if (pose === "facepalm") {
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -8);
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 10);
  }
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(-9, 48);
  ctx.moveTo(0, 28);
  ctx.lineTo(9, 48);
  ctx.stroke();

  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  direction: "left" | "right"
) {
  ctx.save();

  ctx.font = 'bold 10px "Impact", "Arial Black", sans-serif';
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const pad = 6;
  const bh = 18;
  const bw = tw + pad * 2;
  const bx = direction === "left" ? x - bw : x;
  const by = y - bh - 8;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;

  const r = 5;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
  ctx.lineTo(bx + bw, by + bh - r);
  ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
  ctx.lineTo(bx + r, by + bh);
  ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
  ctx.lineTo(bx, by + r);
  ctx.arcTo(bx, by, bx + r, by, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(x - 3, by + bh);
  ctx.lineTo(x + 3, by + bh);
  ctx.lineTo(x, by + bh + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.fillText(text, x, by + bh / 2);

  ctx.restore();
}

export function BananaCanvas({ slipProbability, animKey }: BananaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  // All animation state as refs so the rAF loop always sees fresh values
  const phaseRef = useRef<Phase>("idle");
  const walkXRef = useRef(80);
  const walkFrameRef = useRef(0);
  const slipProgressRef = useRef(0);
  const fallProgressRef = useRef(0);
  const comicTimeRef = useRef(0);
  const impactWordsRef = useRef<string[]>([]);

  // Crowd reaction state
  const crowdMembersRef = useRef<CrowdMember[]>([]);
  const crowdSpawnedRef = useRef(false);
  const crowdEntryProgressRef = useRef(0);

  // Screen shake state
  const shakeActiveRef = useRef(false);
  const shakeFramesRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slow-mo replay state
  const slowmoActiveRef = useRef(false);
  const slowmoFrameRef = useRef(0);
  // Sub-phase for the slow-mo: "walk" | "slip" | "fall" | "done"
  type SlowmoSub = "walk" | "slip" | "fall" | "done";
  const slowmoSubRef = useRef<SlowmoSub>("walk");
  const slowmoWalkXRef = useRef(80);
  const slowmoSlipRef = useRef(0);
  const slowmoFallRef = useRef(0);
  const slowmoSparklesRef = useRef<{ x: number; y: number; life: number }[]>([]);

  const drawBananaPeel = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.12);

      // Ground shadow
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;
      ctx.beginPath();
      ctx.ellipse(2, 6, 40, 14, -0.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fill();

      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;

      // Outer peel (yellow crescent)
      ctx.beginPath();
      ctx.moveTo(-32, 8);
      ctx.bezierCurveTo(-24, -22, 10, -28, 32, -10);
      ctx.bezierCurveTo(40, -2, 38, 10, 34, 14);
      ctx.bezierCurveTo(24, 6, 18, -4, 6, -6);
      ctx.bezierCurveTo(-10, -8, -22, 0, -32, 8);
      ctx.closePath();

      const grad = ctx.createRadialGradient(0, -8, 5, -2, 2, 44);
      grad.addColorStop(0, "#fae154");
      grad.addColorStop(0.35, "#f8dc53");
      grad.addColorStop(0.7, "#ecc848");
      grad.addColorStop(0.9, "#d4a830");
      grad.addColorStop(1, "#bf9630");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#b89328";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner cream
      ctx.beginPath();
      ctx.moveTo(-24, 6);
      ctx.bezierCurveTo(-14, -11, 10, -16, 26, -4);
      ctx.bezierCurveTo(20, 1, 14, -4, 6, -4);
      ctx.bezierCurveTo(-4, -2, -14, 2, -24, 6);
      ctx.closePath();

      const creamGrad = ctx.createLinearGradient(-10, -12, 10, 6);
      creamGrad.addColorStop(0, "#fef9e0");
      creamGrad.addColorStop(0.5, "#fcf7db");
      creamGrad.addColorStop(1, "#f5ecc0");
      ctx.fillStyle = creamGrad;
      ctx.fill();
      ctx.strokeStyle = "#e8d8a0";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Texture lines
      ctx.strokeStyle = "rgba(220, 200, 150, 0.3)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const lx = -12 + i * 12;
        ctx.moveTo(lx - 2, -8 + i * 2);
        ctx.quadraticCurveTo(lx + 4, -2 + i, lx + 6, 2 + i);
        ctx.stroke();
      }

      // Stem
      ctx.beginPath();
      ctx.ellipse(-34, 9, 5, 4.5, -0.4, 0, Math.PI * 2);
      const stemGrad = ctx.createRadialGradient(-34, 9, 1, -34, 9, 5);
      stemGrad.addColorStop(0, "#b89048");
      stemGrad.addColorStop(0.5, "#a2783b");
      stemGrad.addColorStop(1, "#7a5a2c");
      ctx.fillStyle = stemGrad;
      ctx.fill();
      ctx.strokeStyle = "#6a4a1c";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tip
      ctx.beginPath();
      ctx.ellipse(36, 10, 5.5, 4, 0.35, 0, Math.PI * 2);
      const tipGrad = ctx.createRadialGradient(36, 10, 1, 36, 10, 5.5);
      tipGrad.addColorStop(0, "#b89050");
      tipGrad.addColorStop(0.5, "#9b7b4a");
      tipGrad.addColorStop(1, "#7a5a2c");
      ctx.fillStyle = tipGrad;
      ctx.fill();
      ctx.strokeStyle = "#6a4a1c";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spots
      const spots: [number, number, number, number][] = [
        [-10, -4, 2.0, 0.55], [4, -8, 1.8, 0.5], [16, -2, 2.5, 0.45],
        [-5, -10, 1.2, 0.4], [22, 0, 1.8, 0.5], [10, -6, 1.2, 0.35],
        [-15, -6, 1.5, 0.4], [0, -6, 2.2, 0.5], [-20, 2, 1.0, 0.3],
        [26, 4, 1.2, 0.35], [-8, -2, 0.8, 0.25], [14, -4, 1.0, 0.3],
      ];

      for (const [sx, sy, sr, alpha] of spots) {
        ctx.beginPath();
        ctx.ellipse(sx, sy, sr, sr * 0.75, Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(133, 105, 52, ${alpha})`;
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  const drawStickFigure = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      angle = 0,
      legPose: "stand" | "walk1" | "walk2" | "flail" = "stand",
      bodyXoffset = 0
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 3.5;

      // Head
      ctx.beginPath();
      ctx.arc(0, -20, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes — X eyes for anything beyond normal walking
      const xEyes = angle !== 0 && Math.abs(angle) > 0.3;
      if (xEyes) {
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -24); ctx.lineTo(-1, -20);
        ctx.moveTo(-1, -24); ctx.lineTo(-5, -20);
        ctx.moveTo(3, -24);  ctx.lineTo(7, -20);
        ctx.moveTo(7, -24);  ctx.lineTo(3, -20);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#e0e0e0";
        ctx.beginPath();
        ctx.arc(-3, -23, 1.8, 0, Math.PI * 2);
        ctx.arc(3, -23, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 3;

      // Body
      ctx.beginPath();
      ctx.moveTo(0 + bodyXoffset, -10);
      ctx.lineTo(0 + bodyXoffset, 30);
      ctx.stroke();

      // Arms — flail if slipping
      if (legPose === "flail") {
        ctx.beginPath();
        ctx.moveTo(0 + bodyXoffset, 0);
        ctx.lineTo(-20, -10);
        ctx.moveTo(0 + bodyXoffset, 0);
        ctx.lineTo(20, -15);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0 + bodyXoffset, 0);
        ctx.lineTo(-15, 10);
        ctx.moveTo(0 + bodyXoffset, 0);
        ctx.lineTo(15, 10);
        ctx.stroke();
      }

      // Legs
      ctx.beginPath();
      if (legPose === "walk1") {
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(-14, 50);
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(10, 44);
      } else if (legPose === "walk2") {
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(-10, 44);
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(14, 50);
      } else if (legPose === "flail") {
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(-20, 20);
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(22, 10);
      } else {
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(-10, 50);
        ctx.moveTo(0 + bodyXoffset, 30);
        ctx.lineTo(10, 50);
      }
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  const drawComicBookWord = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      scale: number,
      rotation: number,
      hueShift: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const fontSize = 42;
      ctx.font = `bold ${fontSize}px "Impact", "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Outer shadow / glow
      const glowColors = [
        `hsl(${hueShift}, 100%, 55%)`,
        `hsl(${hueShift + 20}, 100%, 60%)`,
      ];
      for (let i = 6; i > 0; i--) {
        ctx.shadowColor = glowColors[i % 2];
        ctx.shadowBlur = i * 4;
        ctx.shadowOffsetX = i * 0.5;
        ctx.shadowOffsetY = i * 0.5;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 5 + i;
        ctx.strokeText(text, 0, 0);
      }

      // Main fill
      ctx.shadowColor = `hsla(${hueShift}, 100%, 50%, 0.3)`;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = `hsl(${hueShift}, 100%, 65%)`;
      ctx.fillText(text, 0, 0);

      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = `hsl(${hueShift}, 100%, 80%)`;
      ctx.fillText(text, -2, -2);

      // Comic-style burst lines around the word
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      const burstR = 40 + fontSize * 0.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rotation;
        const inner = burstR * 0.7;
        const outer = burstR;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }

      ctx.restore();
    },
    []
  );

  const startAnimation = useCallback(() => {
    // Reset all refs
    phaseRef.current = "walking";
    walkXRef.current = 80;
    walkFrameRef.current = 0;
    slipProgressRef.current = 0;
    fallProgressRef.current = 0;
    comicTimeRef.current = 0;

    // Generate a sequence of impact words
    impactWordsRef.current = [];
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      let w = getRandomBatmanWord();
      // Avoid immediate repeats
      while (impactWordsRef.current.length > 0 && w === impactWordsRef.current[impactWordsRef.current.length - 1]) {
        w = getRandomBatmanWord();
      }
      impactWordsRef.current.push(w);
    }

    // Generate crowd rubberneckers
    const usedWords: string[] = [];
    const crowd: CrowdMember[] = [
      { x: 80,  y: GROUND_Y - 15, fromLeft: true,  word: pickReaction(usedWords), pose: "horror" },
      { x: 145, y: GROUND_Y - 10, fromLeft: true,  word: pickReaction(usedWords), pose: "point" },
      { x: 210, y: GROUND_Y - 12, fromLeft: true,  word: pickReaction(usedWords), pose: "cover" },
      { x: 440, y: GROUND_Y - 15, fromLeft: false, word: pickReaction(usedWords), pose: "laugh" },
      { x: 500, y: GROUND_Y - 10, fromLeft: false, word: pickReaction(usedWords), pose: "facepalm" },
      { x: 555, y: GROUND_Y - 12, fromLeft: false, word: pickReaction(usedWords), pose: "point" },
    ];
    // Shuffle the crowd order so the laugh guy isn't always 4th
    for (let i = crowd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [crowd[i], crowd[j]] = [crowd[j], crowd[i]];
    }
    crowdMembersRef.current = crowd;
    crowdSpawnedRef.current = false;
    crowdEntryProgressRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // --- Ground ---
      const gradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
      gradient.addColorStop(0, "rgba(255,255,255,0.05)");
      gradient.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(CANVAS_W, GROUND_Y);
      ctx.stroke();

      // --- Banana peel ---
      drawBananaPeel(ctx, PEEL_X, PEEL_Y);

      const phase = phaseRef.current;

      if (phase === "walking") {
        const legPose: "walk1" | "walk2" =
          Math.floor(walkFrameRef.current / 8) % 2 === 0 ? "walk1" : "walk2";
        const bounce = Math.sin(walkFrameRef.current * 0.18) * 3;
        drawStickFigure(ctx, walkXRef.current, GROUND_Y - 30 + bounce, 0, legPose);

        // Bobbing shadow
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(walkXRef.current, GROUND_Y + 4, 18, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${0.10 + bounce * 0.005})`;
        ctx.fill();
        ctx.restore();

        walkXRef.current += 2;
        walkFrameRef.current += 1;

        // Arm swing offset
        if (walkFrameRef.current % 16 < 8) {
          ctx.save();
          ctx.translate(walkXRef.current, GROUND_Y - 30 + bounce);
          ctx.rotate(0);
          ctx.strokeStyle = "#e0e0e0";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(16, 8);
          ctx.stroke();
          ctx.restore();
        }

        if (walkXRef.current >= PEEL_X - 5) {
          phaseRef.current = "slipping";
          slipProgressRef.current = 0;
        }
      } else if (phase === "slipping") {
        const t = slipProgressRef.current;
        // Backward launch
        const backD = 80 * t;
        const upD = 70 * Math.sin(t * Math.PI);
        const cx = Math.max(PEEL_X - backD, 20);
        const cy = GROUND_Y - 30 - upD;
        const rot = -1.4 * t;

        drawStickFigure(ctx, cx, cy, rot, "flail");

        // Flying shadow
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx + 10, GROUND_Y + 2, 20, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${0.08 + t * 0.04})`;
        ctx.fill();
        ctx.restore();

        // Comic burst dots during slip
        if (t > 0.2 && t < 0.9) {
          for (let i = 0; i < 6; i++) {
            const da = (i / 6) * Math.PI * 2 + t * 3;
            const dr = 20 + t * 30;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(da) * dr, cy + Math.sin(da) * dr - 20, 3 + t * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${30 + i * 40}, 100%, 60%, ${0.6 * (1 - t)})`;
            ctx.fill();
          }
        }

        slipProgressRef.current += 1 / 50;
        if (slipProgressRef.current >= 1) {
          phaseRef.current = "fallen";
          fallProgressRef.current = 0;
          // Trigger screen shake proportional to danger
          const intensity = Math.min(slipProbability / 100, 1);
          shakeFramesRef.current = Math.floor(10 + intensity * 20);
          shakeActiveRef.current = true;
        }
      } else if (phase === "fallen") {
        const t = fallProgressRef.current;
        // The figure slams onto his back
        const landX = PEEL_X - 45;
        const landY = GROUND_Y - 5;
        const landRot = -Math.PI / 2 + (1 - t) * 0.3;

        ctx.save();
        ctx.translate(landX, landY);
        ctx.rotate(landRot);
        drawStickFigure(ctx, 0, 0, 0, "stand");
        ctx.restore();

        // Dust cloud on landing
        if (t < 0.4) {
          const dustProgress = t / 0.4;
          for (let i = 0; i < 8; i++) {
            const da = (i / 8) * Math.PI * 2 + t * 2;
            const dr = dustProgress * 25;
            ctx.beginPath();
            ctx.arc(
              landX + 5 + Math.cos(da) * dr,
              GROUND_Y + Math.sin(da) * dr * 0.5,
              6 * (1 - dustProgress * 0.5),
              0,
              Math.PI * 2
            );
            ctx.fillStyle = `rgba(200, 200, 180, ${0.3 * (1 - dustProgress)})`;
            ctx.fill();
          }
        }

        // Slide marks
        ctx.beginPath();
        ctx.moveTo(PEEL_X + 5, GROUND_Y + 1);
        ctx.lineTo(PEEL_X + 20 - t * 10, GROUND_Y + 1);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 2;
        ctx.stroke();

        fallProgressRef.current += 1 / 30;
        if (fallProgressRef.current >= 1) {
          phaseRef.current = "comicbook";
          comicTimeRef.current = 0;
        }
      } else if (phase === "comicbook") {
        comicTimeRef.current += 1;

        // Keep drawing the fallen figure
        ctx.save();
        ctx.translate(PEEL_X - 45, GROUND_Y - 5);
        ctx.rotate(-Math.PI / 2);
        drawStickFigure(ctx, 0, 0, 0, "stand");
        ctx.restore();

        // --- COMIC BOOK WORD SEQUENCE ---
        // Each word appears for ~30 frames, partially overlapping
        const words = impactWordsRef.current;
        const totalWords = words.length;
        const framesPerWord = 35;
        const overlap = 10;
        const ct = comicTimeRef.current;

        for (let wi = 0; wi < totalWords; wi++) {
          const wordStart = wi * (framesPerWord - overlap);
          const wordEnd = wordStart + framesPerWord;
          if (ct < wordStart || ct > wordEnd) continue;

          const wordT = (ct - wordStart) / framesPerWord; // 0 to 1
          // Ease: quick pop in, slow fade out
          const appear = wordT < 0.15 ? wordT / 0.15 : 1;
          const fade = wordT > 0.7 ? 1 - (wordT - 0.7) / 0.3 : 1;

          // Each word gets its own position and rotation for variety
          const baseX = [
            PEEL_X - 10,
            PEEL_X + 30,
            PEEL_X - 40,
            PEEL_X + 15,
            PEEL_X - 25,
            PEEL_X + 40,
          ][wi % 6];
          const baseY = [
            GROUND_Y - 70,
            GROUND_Y - 95,
            GROUND_Y - 55,
            GROUND_Y - 85,
            GROUND_Y - 110,
            GROUND_Y - 65,
          ][wi % 6];

          // Pulsing scale
          const pulse = 0.85 + 0.15 * Math.sin(ct * 0.12 + wi * 1.5);
          const scale = pulse * (0.7 + 0.3 * appear);

          // Each word gets a different hue
          const hueShift = (wi * 60 + 10) % 360;

          const rotOff = [-0.2, 0.25, -0.3, 0.15, -0.15, 0.35][wi % 6];

          ctx.globalAlpha = fade;
          drawComicBookWord(ctx, words[wi], baseX, baseY, scale, rotOff, hueShift);
          ctx.globalAlpha = 1;
        }

        // --- Comic action lines radiating from impact point ---
        const impactX = PEEL_X - 10;
        const impactY = GROUND_Y - 30;

        // Radial action lines
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + ct * 0.02;
          const innerR = 35 + Math.sin(ct * 0.08 + i) * 5;
          const outerR = innerR + 12 + Math.sin(ct * 0.1 + i * 0.7) * 6;
          ctx.beginPath();
          ctx.moveTo(impactX + Math.cos(a) * innerR, impactY + Math.sin(a) * innerR);
          ctx.lineTo(impactX + Math.cos(a) * outerR, impactY + Math.sin(a) * outerR);
          ctx.stroke();
        }

        // Pulse ring
        const ringR = 45 + 20 * Math.sin(ct * 0.08);
        ctx.beginPath();
        ctx.arc(impactX, impactY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 100, 50, ${0.15 + 0.1 * Math.sin(ct * 0.1)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- Small action stars ---
        for (let i = 0; i < 5; i++) {
          const sa = (i / 5) * Math.PI * 2 + ct * 0.03;
          const sr = 50 + 15 * Math.sin(ct * 0.06 + i * 1.3);
          const starSize = 4 + 3 * Math.sin(ct * 0.15 + i * 2);
          ctx.save();
          ctx.translate(
            impactX + Math.cos(sa) * sr,
            impactY + Math.sin(sa) * sr
          );
          ctx.rotate(Math.PI / 4 + ct * 0.05 + i);
          ctx.fillStyle = `rgba(255, 220, 50, ${0.4 + 0.3 * Math.sin(ct * 0.12 + i)})`;
          ctx.fillRect(-starSize / 2, -starSize / 2, starSize, starSize);
          ctx.restore();
        }

        // --- CROWD REACTION ---
        // After the main impact words (~120 frames), spawn crowd
        const crowdSpawnFrame = 120;
        if (ct >= crowdSpawnFrame) {
          if (!crowdSpawnedRef.current) {
            crowdSpawnedRef.current = true;
            crowdEntryProgressRef.current = 0;
          }

          const entryProgress = Math.min(crowdEntryProgressRef.current, 1);
          crowdEntryProgressRef.current += 1 / 35;

          const crowdCx = (m: CrowdMember) =>
            m.fromLeft
              ? m.x * entryProgress
              : CANVAS_W - (CANVAS_W - m.x) * entryProgress;

          for (const m of crowdMembersRef.current) {
            const cx = crowdCx(m);
            const cy = m.y;

            drawCrowdFigure(ctx, cx, cy, 0.45, m.pose);

            if (entryProgress > 0.7) {
              const bubbleAlpha = Math.min((entryProgress - 0.7) / 0.3, 1);
              ctx.globalAlpha = bubbleAlpha;
              drawSpeechBubble(
                ctx,
                m.word,
                cx,
                cy - 12,
                m.fromLeft ? "right" : "left"
              );
              ctx.globalAlpha = 1;
            }
          }

          // Exclamation marks over late-arriving crowd
          ctx.font = 'bold 10px "Impact", sans-serif';
          for (const m of crowdMembersRef.current) {
            if (entryProgress > 0.5) {
              const bounce = Math.sin(ct * 0.1 + m.x) * 2;
              ctx.fillStyle = `hsl(${40 + m.x * 0.5}, 100%, 60%)`;
              ctx.textAlign = "center";
              ctx.fillText("!", crowdCx(m), m.y - 38 + bounce);
            }
          }
        }

        // --- Slip index label ---
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`SLIP INDEX: ${slipProbability}%`, 16, 14);

        // Trigger slow-mo replay after the crowd has settled
        if (ct > 300 && !slowmoActiveRef.current) {
          slowmoActiveRef.current = true;
          slowmoFrameRef.current = 0;
          slowmoSubRef.current = "walk";
          slowmoWalkXRef.current = 80;
          slowmoSlipRef.current = 0;
          slowmoFallRef.current = 0;
          slowmoSparklesRef.current = [];
        }
      } else if (phase === "slowmo") {
        const sf = slowmoFrameRef.current;
        slowmoFrameRef.current = sf + 1;

        // Draw the background + ground + banana
        const gradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
        gradient.addColorStop(0, "rgba(255,255,255,0.05)");
        gradient.addColorStop(1, "rgba(255,255,255,0.02)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(CANVAS_W, GROUND_Y);
        ctx.stroke();

        drawBananaPeel(ctx, PEEL_X, PEEL_Y);

        // Slow-mo speed divisor — every 6 frames = 1 normal frame
        const slowTick = Math.floor(sf / 6);
        const slowPhase = slowmoSubRef.current;

        if (slowPhase === "walk") {
          const walkX = 80 + slowTick * 2;
          slowmoWalkXRef.current = walkX;
          const legPose: "walk1" | "walk2" =
            Math.floor(slowTick / 8) % 2 === 0 ? "walk1" : "walk2";
          const bounce = Math.sin(sf * 0.03) * 3;
          drawStickFigure(ctx, walkX, GROUND_Y - 30 + bounce, 0, legPose);

          // Sparkle trail
          slowmoSparklesRef.current.push({
            x: walkX,
            y: GROUND_Y - 25 + bounce,
            life: 30,
          });
          if (walkX >= PEEL_X - 5) {
            slowmoSubRef.current = "slip";
            slowmoSlipRef.current = 0;
          }
        } else if (slowPhase === "slip") {
          const t = Math.min(slowTick / 50, 1);
          slowmoSlipRef.current = t;
          const walkX = slowmoWalkXRef.current;
          const backD = 80 * t;
          const upD = 70 * Math.sin(t * Math.PI);
          const cx = Math.max(walkX - backD, 20);
          const cy = GROUND_Y - 30 - upD;
          const rot = -1.4 * t;
          drawStickFigure(ctx, cx, cy, rot, "flail");

          // Sparkle trail
          slowmoSparklesRef.current.push({
            x: cx,
            y: cy,
            life: 25,
          });

          if (t >= 1) {
            slowmoSubRef.current = "fall";
            slowmoFallRef.current = 0;
          }
        } else if (slowPhase === "fall") {
          const t = Math.min(slowTick / 30, 1);
          slowmoFallRef.current = t;
          const landX = PEEL_X - 45;
          const landY = GROUND_Y - 5;

          ctx.save();
          ctx.translate(landX, landY);
          ctx.rotate(-Math.PI / 2 + (1 - t) * 0.3);
          drawStickFigure(ctx, 0, 0, 0, "stand");
          ctx.restore();

          if (t >= 1) {
            slowmoSubRef.current = "done";
          }
        } else {
          // "done" — hold the fallen figure then switch back to comicbook
          ctx.save();
          ctx.translate(PEEL_X - 45, GROUND_Y - 5);
          ctx.rotate(-Math.PI / 2);
          drawStickFigure(ctx, 0, 0, 0, "stand");
          ctx.restore();

          if (sf > slowmoFrameRef.current + 30) {
            // Cycle back to comicbook
            phaseRef.current = "comicbook";
            comicTimeRef.current = 301; // just past the trigger threshold
            slowmoActiveRef.current = false;
          }
        }

        // --- Draw sparkle trail ---
        for (let i = slowmoSparklesRef.current.length - 1; i >= 0; i--) {
          const s = slowmoSparklesRef.current[i];
          s.life -= 0.15;
          if (s.life <= 0) {
            slowmoSparklesRef.current.splice(i, 1);
            continue;
          }
          const alpha = s.life / 30;
          const size = 2 + s.life * 0.2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.6})`;
          ctx.fill();
        }

        // --- Vignette overlay ---
        const vg = ctx.createRadialGradient(
          CANVAS_W / 2, GROUND_Y / 2, 80,
          CANVAS_W / 2, GROUND_Y / 2, CANVAS_W * 0.7
        );
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(0.6, "rgba(0,0,0,0.15)");
        vg.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // --- "INSTANT REPLAY" label ---
        ctx.save();
        ctx.font = 'bold 14px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const replayPulse = 0.1 * Math.sin(sf * 0.06);
        ctx.shadowColor = "rgba(255,200,50,0.4)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = `rgba(255, 220, 80, ${0.7 + replayPulse})`;
        ctx.fillText("◆ I N S T A N T   R E P L A Y ◆", CANVAS_W / 2, 10);
        ctx.restore();

        // --- Slow-mo badge ---
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("0.15x", CANVAS_W - 12, 14);
        ctx.restore();

        // --- Slip index label ---
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`SLIP INDEX: ${slipProbability}%`, 16, 14);
      }

      // --- Screen shake ---
      const wrapper = containerRef.current;
      if (shakeActiveRef.current && wrapper) {
        const frames = shakeFramesRef.current;
        if (frames > 0) {
          const intensity =
            (Math.min(slipProbability, 100) / 100) *
            (1 - (frames % 20) / 20) *
            12;
          const tx = (Math.random() - 0.5) * intensity * 2;
          const ty = (Math.random() - 0.5) * intensity * 1.5;
          wrapper.style.transform = `translate(${tx}px, ${ty}px)`;
          shakeFramesRef.current = frames - 1;
        } else {
          wrapper.style.transform = "";
          shakeActiveRef.current = false;
        }
      } else if (wrapper) {
        // Keep reset in case of race
        wrapper.style.transform = "";
      }

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
  }, [slipProbability, drawBananaPeel, drawStickFigure, drawComicBookWord]);

  useEffect(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    }

    const timer = setTimeout(() => {
      startAnimation();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [animKey, startAnimation]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="relative"
    >
      <div ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full max-w-[600px] mx-auto rounded-2xl border border-border/50 canvas-glow"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,15,20,0.95) 0%, rgba(20,18,14,0.98) 100%)",
          }}
        />
      </div>
    </motion.div>
  );
}
