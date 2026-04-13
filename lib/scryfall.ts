export type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  type_line: string;
  rarity: string;
  cmc: number;
  colors?: string[];
  color_identity?: string[];
  image_uris?: {
    small?: string;
    normal?: string;
  };
  card_faces?: Array<{
    name: string;
    type_line?: string;
    colors?: string[];
    image_uris?: {
      small?: string;
      normal?: string;
    };
  }>;
};

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

type ScryfallList = {
  data?: ScryfallCard[];
};

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const headers = {
  Accept: "application/json",
  "User-Agent": "MyMTG/0.1 local collection scanner",
};

const colorNames: Record<string, string> = {
  W: "Weiss",
  U: "Blau",
  B: "Schwarz",
  R: "Rot",
  G: "Gruen",
};

function normalizeSearchText(value: string) {
  return value
    .replace(/[^\w\s,'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapColors(card: ScryfallCard) {
  const faceColors = card.card_faces?.flatMap((face) => face.colors ?? []) ?? [];
  const colors = card.colors?.length
    ? card.colors
    : faceColors.length
      ? faceColors
      : card.color_identity ?? [];

  return Array.from(new Set(colors)).map((color) => colorNames[color]).filter(Boolean);
}

function getImageUrl(card: ScryfallCard) {
  return (
    card.image_uris?.small ??
    card.card_faces?.find((face) => face.image_uris?.small)?.image_uris?.small ??
    card.image_uris?.normal ??
    card.card_faces?.find((face) => face.image_uris?.normal)?.image_uris?.normal ??
    null
  );
}

export function mapScryfallCard(card: ScryfallCard): CardMatch {
  return {
    id: card.id,
    name: card.name,
    setCode: card.set.toUpperCase(),
    setName: card.set_name,
    collectorNumber: card.collector_number,
    cardType: card.type_line,
    rarity: card.rarity.replace(/^\w/, (letter) => letter.toUpperCase()),
    manaValue: Math.max(0, Math.round(card.cmc)),
    colors: mapColors(card),
    imageUrl: getImageUrl(card),
  };
}

async function scryfallGet<T>(path: string) {
  const response = await fetch(`${SCRYFALL_BASE_URL}${path}`, {
    headers,
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function findByExactName(name: string, setCode?: string) {
  const params = new URLSearchParams({ exact: name });
  if (setCode) params.set("set", setCode.toLowerCase());

  return scryfallGet<ScryfallCard>(`/cards/named?${params.toString()}`);
}

async function findByFuzzyName(name: string, setCode?: string) {
  const params = new URLSearchParams({ fuzzy: name });
  if (setCode) params.set("set", setCode.toLowerCase());

  return scryfallGet<ScryfallCard>(`/cards/named?${params.toString()}`);
}

async function searchCandidates(name: string, setCode?: string) {
  const queryParts = [`name:${JSON.stringify(name)}`];
  if (setCode) queryParts.push(`set:${setCode.toLowerCase()}`);
  const params = new URLSearchParams({
    q: queryParts.join(" "),
    unique: "prints",
    order: "released",
    dir: "desc",
  });

  const result = await scryfallGet<ScryfallList>(`/cards/search?${params.toString()}`);
  return result?.data ?? [];
}

export async function matchScryfallCard(input: {
  name: string;
  setCode?: string;
  collectorNumber?: string;
}) {
  const name = normalizeSearchText(input.name);
  const setCode = normalizeSearchText(input.setCode ?? "");
  const collectorNumber = normalizeSearchText(input.collectorNumber ?? "");

  if (setCode && collectorNumber) {
    const card = await scryfallGet<ScryfallCard>(
      `/cards/${encodeURIComponent(setCode.toLowerCase())}/${encodeURIComponent(collectorNumber)}`,
    );
    if (card) {
      return { best: mapScryfallCard(card), candidates: [] };
    }
  }

  if (!name) {
    return { best: null, candidates: [] };
  }

  const exact = await findByExactName(name, setCode);
  if (exact) {
    return { best: mapScryfallCard(exact), candidates: [] };
  }

  const fuzzy = await findByFuzzyName(name, setCode);
  if (fuzzy) {
    const candidates = await searchCandidates(fuzzy.name, setCode);
    return {
      best: mapScryfallCard(fuzzy),
      candidates: candidates.slice(0, 5).map(mapScryfallCard),
    };
  }

  const candidates = await searchCandidates(name, setCode);
  return {
    best: candidates[0] ? mapScryfallCard(candidates[0]) : null,
    candidates: candidates.slice(0, 5).map(mapScryfallCard),
  };
}
