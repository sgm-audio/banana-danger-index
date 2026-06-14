export const batmanWords: string[] = [
  "BAM!",
  "POW!",
  "ZAP!",
  "WHAM!",
  "CRUNCH!",
  "SPLATT!",
  "OOOFF!",
  "KLONK!",
  "ZLONK!",
  "BIFF!",
  "SOCK!",
  "KAPOW!",
  "THWACK!",
  "OOF!",
  "CRACK!",
  "SWOOOOSH!",
  "BOOF!",
  "ZOWIE!",
];

export function getRandomBatmanWord(): string {
  return batmanWords[Math.floor(Math.random() * batmanWords.length)];
}
