export const hazardWarnings: string[] = [
  "Attention: This peel exhibits irregular slipperiness. Engage anti-skid socks.",
  "Banana peel detected. Sidewalk insurance advised.",
  "Unstable organic hazard. Estimated pratfall magnitude: 6.3 on the Peel Scale.",
  "WARNING: Peel is in a committed relationship with gravity.",
  "Surfaces ahead may contain banana-based turbulence.",
  "Caution: The banana peel has been observed plotting against pedestrians.",
  "Freelance slipping consultant required beyond this point.",
  "This peel has a 0.0 average in maintaining upright posture.",
  "Public service announcement: The ground will be temporarily more horizontal than you anticipate.",
  "Local physics temporarily suspended due to banana interference.",
  "Standing is not guaranteed where this peel resides.",
  "Alert: The coefficient of friction has called in sick.",
  "Slipperiness level: Insubordinate.",
  "Pedestrian stability compromised. Recommend controlled descent.",
  "The banana peel reminds you that gravity remains undefeated.",
  "Emergency services have been notified of a potential non-emergency.",
  "This peel is performing an unauthorized slip-hazard recital.",
  "It's not you, it's the banana. (But it's still you on the ground.)",
];

export function getRandomWarning(): string {
  return hazardWarnings[Math.floor(Math.random() * hazardWarnings.length)];
}
