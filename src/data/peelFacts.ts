export interface PeelFact {
  text: string;
  tone: "scientific" | "legal" | "historical" | "warning";
}

export const peelFacts: PeelFact[] = [
  {
    text: "This peel is {x}% more slippery than a buttered doorknob",
    tone: "scientific",
  },
  {
    text: "Classified as Level {x} on the International Peel Hazard Scale",
    tone: "scientific",
  },
  {
    text: "Equivalent to {x} newly waxed floors stacked vertically",
    tone: "scientific",
  },
  {
    text: "Scientists estimate 1 in {x} pedestrians would not survive this peel",
    tone: "scientific",
  },
  {
    text: "This banana generates {x} slip-tons of kinetic hazard force",
    tone: "scientific",
  },
  {
    text: "{x}% of banana-related emergencies originate within 5 feet of the peel",
    tone: "scientific",
  },
  {
    text: "Rated {x}.{y} on the Mohs Scale of Slip Hardness",
    tone: "scientific",
  },
  {
    text: "This peel could stop a small sedan at {x} mph",
    tone: "scientific",
  },
  {
    text: "Warning: peel slip-velocity exceeds recommended slapstick thresholds by {x}%",
    tone: "warning",
  },
  {
    text: "Legally required to carry a slip advisory in {x} countries",
    tone: "legal",
  },
  {
    text: "Over {x} banana peel incidents go unreported every day",
    tone: "historical",
  },
  {
    text: "Historical records show this level of peel danger hasn't been seen since {year}",
    tone: "historical",
  },
  {
    text: "The average banana peel generates enough slip energy to power a {x}W lightbulb for {y} seconds",
    tone: "scientific",
  },
  {
    text: "Classified as a Class {x} Biological Slip Agent by the World Health Organization",
    tone: "scientific",
  },
  {
    text: "The Geneva Convention technically has no position on this peel, and that's concerning",
    tone: "legal",
  },
  {
    text: "This peel registers {x} dB on the Slip Magnitude Scale",
    tone: "scientific",
  },
  {
    text: "NASA has reportedly used less slippery surfaces for spacecraft landings",
    tone: "scientific",
  },
  {
    text: "This level of peel danger has been deemed 'excessive' by the International Court of Justice",
    tone: "legal",
  },
  {
    text: "Archeologists believe ancient civilizations used similar peels as traps for mammoths",
    tone: "historical",
  },
  {
    text: "This banana peel has been flagged by {x} intelligence agencies for 'hazardous dismount potential'",
    tone: "warning",
  },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function interpolateFact(
  fact: PeelFact,
  probability: number
): string {
  const seed = probability * 100;
  const r = () => seededRandom(seed + fact.text.length);

  let text = fact.text;

  // Replace {x} with a probability-scaled number
  if (text.includes("{x}")) {
    const base = Math.max(10, Math.round(probability * 2.5 + r() * 20));
    text = text.replace("{x}", String(base));
  }

  // Replace {y} with a secondary random number
  if (text.includes("{y}")) {
    const base = Math.max(1, Math.round(r() * 30 + 1));
    text = text.replace("{y}", String(base));
  }

  // Replace {year} with a fake historical year
  if (text.includes("{year}")) {
    const years = ["1973", "1887", "1952", "1846", "1929", "1965", "1789"];
    text = text.replace("{year}", years[Math.floor(r() * years.length)]);
  }

  return text;
}
