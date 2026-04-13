"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addCard,
  addCardToDeck,
  addDeck,
  deleteCard,
  deleteDeck,
  removeCardFromDeck,
  updateDeckCardQuantity,
} from "@/lib/db";

function toNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toId(value: FormDataEntryValue | null) {
  return Math.max(0, Math.trunc(toNumber(value, 0)));
}

export async function createCard(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const setName = String(formData.get("setName") ?? "").trim();
  const cardType = String(formData.get("cardType") ?? "").trim();

  if (!name || !setName || !cardType) {
    throw new Error("Name, Set und Kartentyp sind Pflichtfelder.");
  }

  addCard({
    name,
    setName,
    cardType,
    colors: formData.getAll("colors").map(String),
    manaValue: Math.max(0, toNumber(formData.get("manaValue"), 0)),
    rarity: String(formData.get("rarity") ?? "Common"),
    condition: String(formData.get("condition") ?? "Near Mint"),
    quantity: Math.max(1, toNumber(formData.get("quantity"), 1)),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/cards/add");
  redirect("/");
}

export async function deleteCardAction(formData: FormData) {
  const cardId = toId(formData.get("cardId"));

  if (!cardId) {
    throw new Error("Karte wurde nicht gefunden.");
  }

  deleteCard(cardId);
  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/decks");
  revalidatePath("/scan");
}

export async function createDeck(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "Casual").trim();

  if (!name || !format) {
    throw new Error("Name und Format sind Pflichtfelder.");
  }

  addDeck({
    name,
    format,
    description: String(formData.get("description") ?? ""),
  });

  revalidatePath("/");
  revalidatePath("/decks");
  redirect("/decks");
}

export async function deleteDeckAction(formData: FormData) {
  const deckId = toId(formData.get("deckId"));

  if (!deckId) {
    throw new Error("Deck wurde nicht gefunden.");
  }

  deleteDeck(deckId);
  revalidatePath("/");
  revalidatePath("/decks");
}

export async function addCardToDeckAction(formData: FormData) {
  const deckId = toId(formData.get("deckId"));
  const cardId = toId(formData.get("cardId"));
  const quantity = Math.max(1, Math.trunc(toNumber(formData.get("quantity"), 1)));

  if (!deckId || !cardId) {
    throw new Error("Deck und Karte sind Pflichtfelder.");
  }

  addCardToDeck({ deckId, cardId, quantity });
  revalidatePath("/decks");
}

export async function updateDeckCardQuantityAction(formData: FormData) {
  const deckId = toId(formData.get("deckId"));
  const cardId = toId(formData.get("cardId"));
  const quantity = Math.max(1, Math.trunc(toNumber(formData.get("quantity"), 1)));

  if (!deckId || !cardId) {
    throw new Error("Deck und Karte sind Pflichtfelder.");
  }

  updateDeckCardQuantity({ deckId, cardId, quantity });
  revalidatePath("/decks");
}

export async function removeCardFromDeckAction(formData: FormData) {
  const deckId = toId(formData.get("deckId"));
  const cardId = toId(formData.get("cardId"));

  if (!deckId || !cardId) {
    throw new Error("Deck und Karte sind Pflichtfelder.");
  }

  removeCardFromDeck({ deckId, cardId });
  revalidatePath("/decks");
}
