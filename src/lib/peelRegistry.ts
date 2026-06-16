export interface PeelRecord {
  id: string;
  timestamp: number;
  probability: number;
  warning: string;
  imageHash: string;
  imageName: string;
  metrics: Record<string, string>;
  notes: string;
  rating: 1 | 2 | 3 | 4 | 5;
  verdict: "ACQUITTED" | "GUILTY" | "MISTRIAL" | "PENDING";
  caseId: string;
}

const STORAGE_KEY = "banana-peel-registry:v1";
const MAX_RECORDS = 50;

function generateCaseId(): string {
  const adjectives = ["SLIPPERY", "HAZARDOUS", "TREACHEROUS", "VILE", "NEFARIOUS", "DEVIOUS"];
  const nouns = ["PEEL", "BANANA", "SKIN", "HUSK", "RIND", "CASING"];
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${num}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, "0");
}

export function getPeelRegistry(): PeelRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addPeelRecord(
  probability: number,
  warning: string,
  imageDataUrl: string,
  imageName: string,
  metrics: Record<string, string>
): PeelRecord {
  const registry = getPeelRegistry();
  const imageHash = simpleHash(imageDataUrl.slice(0, 1000));

  // Check for duplicate
  if (registry.some((r) => r.imageHash === imageHash)) {
    const existing = registry.find((r) => r.imageHash === imageHash)!;
    // Ensure backward compatibility for old records without caseId
    if (!existing.caseId) {
      existing.caseId = generateCaseId();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    }
    return existing;
  }

  const record: PeelRecord = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    probability,
    warning,
    imageHash,
    imageName,
    metrics,
    notes: "",
    rating: 3,
    verdict: "PENDING",
    caseId: generateCaseId(),
  };

  registry.unshift(record);
  if (registry.length > MAX_RECORDS) registry.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  return record;
}

export function updatePeelRecord(id: string, updates: Partial<PeelRecord>): boolean {
  const registry = getPeelRegistry();
  const idx = registry.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  registry[idx] = { ...registry[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  return true;
}

export function deletePeelRecord(id: string): boolean {
  const registry = getPeelRegistry();
  const filtered = registry.filter((r) => r.id !== id);
  if (filtered.length === registry.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function exportRegistry(): string {
  const registry = getPeelRegistry();
  const exportData = {
    version: "1.0",
    exported: new Date().toISOString(),
    totalCases: registry.length,
    cases: registry,
  };
  return JSON.stringify(exportData, null, 2);
}

export function importRegistry(json: string): { success: boolean; added: number; error?: string } {
  try {
    const data = JSON.parse(json);
    if (!data.cases || !Array.isArray(data.cases)) {
      return { success: false, added: 0, error: "Invalid format: missing cases array" };
    }
    const registry = getPeelRegistry();
    let added = 0;
    for (const c of data.cases) {
      if (!c.id || !c.timestamp || typeof c.probability !== "number") continue;
      if (!registry.some((r) => r.id === c.id)) {
        registry.unshift(c);
        added++;
      }
    }
    if (registry.length > MAX_RECORDS) registry.splice(MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    return { success: true, added };
  } catch (e) {
    return { success: false, added: 0, error: String(e) };
  }
}

export function clearRegistry(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRegistryStats() {
  const registry = getPeelRegistry();
  if (registry.length === 0) return null;
  const probs = registry.map((r) => r.probability);
  const avg = probs.reduce((a, b) => a + b, 0) / probs.length;
  const max = Math.max(...probs);
  const guilty = registry.filter((r) => r.verdict === "GUILTY").length;
  return { total: registry.length, avgProb: Math.round(avg), maxProb: max, guiltyCount: guilty };
}