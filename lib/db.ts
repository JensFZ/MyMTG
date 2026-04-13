import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "mymtg.sqlite");

export type Card = {
  id: number;
  name: string;
  setName: string;
  colors: string[];
  manaValue: number;
  cardType: string;
  rarity: string;
  condition: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
};

export type Deck = {
  id: number;
  name: string;
  format: string;
  description: string | null;
  createdAt: string;
  totalCards: number;
  uniqueCards: number;
};

export type DeckCard = Card & {
  deckQuantity: number;
};

type CardRow = Omit<Card, "colors"> & {
  colors: string;
};

type DeckRow = Deck;

type DeckCardRow = Omit<DeckCard, "colors"> & {
  colors: string;
};

function getDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      setName TEXT NOT NULL,
      colors TEXT NOT NULL DEFAULT '[]',
      manaValue INTEGER NOT NULL DEFAULT 0,
      cardType TEXT NOT NULL,
      rarity TEXT NOT NULL,
      condition TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'Casual',
      description TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
      deckId INTEGER NOT NULL,
      cardId INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (deckId, cardId),
      FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE,
      FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
    );
  `);

  return db;
}

function mapCard(row: CardRow): Card {
  return {
    ...row,
    colors: JSON.parse(row.colors) as string[],
  };
}

function mapDeckCard(row: DeckCardRow): DeckCard {
  return {
    ...row,
    colors: JSON.parse(row.colors) as string[],
  };
}

export function addCard(input: {
  name: string;
  setName: string;
  colors: string[];
  manaValue: number;
  cardType: string;
  rarity: string;
  condition: string;
  quantity: number;
  notes?: string;
}) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO cards (
      name, setName, colors, manaValue, cardType, rarity, condition, quantity, notes
    ) VALUES (
      @name, @setName, @colors, @manaValue, @cardType, @rarity, @condition, @quantity, @notes
    )
  `).run({
    ...input,
    colors: JSON.stringify(input.colors),
    notes: input.notes?.trim() || null,
  });
}

export function getLatestCards(limit = 8) {
  const db = getDatabase();

  const rows = db
    .prepare("SELECT * FROM cards ORDER BY createdAt DESC, id DESC LIMIT ?")
    .all(limit) as CardRow[];

  return rows.map(mapCard);
}

export function getAllCards() {
  const db = getDatabase();

  const rows = db
    .prepare("SELECT * FROM cards ORDER BY name ASC, setName ASC, id ASC")
    .all() as CardRow[];

  return rows.map(mapCard);
}

export function searchCards(query: string) {
  const db = getDatabase();
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getAllCards();
  }

  const searchTerm = `%${normalizedQuery.toLowerCase()}%`;
  const rows = db
    .prepare(`
      SELECT *
      FROM cards
      WHERE
        lower(name) LIKE @searchTerm OR
        lower(setName) LIKE @searchTerm OR
        lower(cardType) LIKE @searchTerm OR
        lower(rarity) LIKE @searchTerm OR
        lower(condition) LIKE @searchTerm OR
        lower(COALESCE(notes, '')) LIKE @searchTerm
      ORDER BY name ASC, setName ASC, id ASC
    `)
    .all({ searchTerm }) as CardRow[];

  return rows.map(mapCard);
}

export function deleteCard(id: number) {
  const db = getDatabase();
  db.prepare("DELETE FROM cards WHERE id = ?").run(id);
}

export function addDeck(input: {
  name: string;
  format: string;
  description?: string;
}) {
  const db = getDatabase();

  db.prepare(`
    INSERT INTO decks (name, format, description)
    VALUES (@name, @format, @description)
  `).run({
    name: input.name,
    format: input.format,
    description: input.description?.trim() || null,
  });
}

export function deleteDeck(id: number) {
  const db = getDatabase();
  db.prepare("DELETE FROM decks WHERE id = ?").run(id);
}

export function getDecks() {
  const db = getDatabase();

  return db
    .prepare(`
      SELECT
        decks.id,
        decks.name,
        decks.format,
        decks.description,
        decks.createdAt,
        COALESCE(SUM(deck_cards.quantity), 0) as totalCards,
        COUNT(deck_cards.cardId) as uniqueCards
      FROM decks
      LEFT JOIN deck_cards ON deck_cards.deckId = decks.id
      GROUP BY decks.id
      ORDER BY decks.createdAt DESC, decks.id DESC
    `)
    .all() as DeckRow[];
}

export function getDeckCards(deckId: number) {
  const db = getDatabase();

  const rows = db
    .prepare(`
      SELECT cards.*, deck_cards.quantity as deckQuantity
      FROM deck_cards
      JOIN cards ON cards.id = deck_cards.cardId
      WHERE deck_cards.deckId = ?
      ORDER BY cards.name ASC, cards.id ASC
    `)
    .all(deckId) as DeckCardRow[];

  return rows.map(mapDeckCard);
}

export function addCardToDeck(input: {
  deckId: number;
  cardId: number;
  quantity: number;
}) {
  const db = getDatabase();
  const card = db
    .prepare("SELECT quantity FROM cards WHERE id = ?")
    .get(input.cardId) as { quantity: number } | undefined;

  if (!card) {
    throw new Error("Karte wurde nicht gefunden.");
  }

  const quantity = Math.min(Math.max(1, input.quantity), card.quantity);

  db.prepare(`
    INSERT INTO deck_cards (deckId, cardId, quantity)
    VALUES (@deckId, @cardId, @quantity)
    ON CONFLICT(deckId, cardId) DO UPDATE SET
      quantity = MIN(deck_cards.quantity + excluded.quantity, @availableQuantity)
  `).run({
    deckId: input.deckId,
    cardId: input.cardId,
    quantity,
    availableQuantity: card.quantity,
  });
}

export function updateDeckCardQuantity(input: {
  deckId: number;
  cardId: number;
  quantity: number;
}) {
  const db = getDatabase();
  const card = db
    .prepare("SELECT quantity FROM cards WHERE id = ?")
    .get(input.cardId) as { quantity: number } | undefined;

  if (!card) {
    throw new Error("Karte wurde nicht gefunden.");
  }

  const quantity = Math.min(Math.max(1, input.quantity), card.quantity);

  db.prepare(`
    UPDATE deck_cards
    SET quantity = @quantity
    WHERE deckId = @deckId AND cardId = @cardId
  `).run({
    deckId: input.deckId,
    cardId: input.cardId,
    quantity,
  });
}

export function removeCardFromDeck(input: { deckId: number; cardId: number }) {
  const db = getDatabase();

  db.prepare("DELETE FROM deck_cards WHERE deckId = ? AND cardId = ?").run(
    input.deckId,
    input.cardId,
  );
}

export function getCollectionStats() {
  const db = getDatabase();

  const totalCards = db
    .prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM cards")
    .get() as { total: number };
  const uniqueCards = db
    .prepare("SELECT COUNT(*) as total FROM cards")
    .get() as { total: number };
  const averageMana = db
    .prepare("SELECT COALESCE(ROUND(AVG(manaValue), 1), 0) as total FROM cards")
    .get() as { total: number };

  return {
    totalCards: totalCards.total,
    uniqueCards: uniqueCards.total,
    averageMana: averageMana.total,
    decks: getDecks().length,
  };
}

export function getColorDistribution() {
  const cards = getLatestCards(500);
  const counts = new Map<string, number>();

  for (const card of cards) {
    const colors = card.colors.length ? card.colors : ["Farblos"];
    for (const color of colors) {
      counts.set(color, (counts.get(color) ?? 0) + card.quantity);
    }
  }

  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}
