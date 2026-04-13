export type CardMatch = {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  cardType: string;
  rarity: string;
  manaValue: number;
  colors: string[];
  imageUrl: string | null;
};

export type ScanStatus =
  | "idle"
  | "starting"
  | "searching"
  | "detected"
  | "processing"
  | "added"
  | "uncertain"
  | "error";

export type ScanResult = {
  card: CardMatch;
  addedAt: number;
};
