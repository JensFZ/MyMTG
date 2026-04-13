import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { addCard } from "@/lib/db";
import type { CardMatch } from "@/lib/scryfall";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      card?: CardMatch;
      quantity?: number;
    };

    if (!body.card?.name || !body.card.setName || !body.card.cardType) {
      return NextResponse.json(
        { message: "Kartendaten sind unvollstaendig." },
        { status: 400 },
      );
    }

    addCard({
      name: body.card.name,
      setName: body.card.setName,
      cardType: body.card.cardType,
      colors: body.card.colors,
      manaValue: body.card.manaValue,
      rarity: body.card.rarity,
      condition: "Near Mint",
      quantity: Math.max(1, Math.trunc(body.quantity ?? 1)),
      notes: `Gescannt: ${body.card.setCode} #${body.card.collectorNumber}`,
    });

    revalidatePath("/");
    revalidatePath("/cards");
    revalidatePath("/scan");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Karte konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}
