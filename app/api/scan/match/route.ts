import { NextResponse } from "next/server";

import { matchScryfallCard } from "@/lib/scryfall";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      setCode?: string;
      collectorNumber?: string;
    };

    const result = await matchScryfallCard({
      name: body.name ?? "",
      setCode: body.setCode,
      collectorNumber: body.collectorNumber,
    });

    if (!result.best && result.candidates.length === 0) {
      return NextResponse.json(
        { message: "Keine passende Karte bei Scryfall gefunden." },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Scryfall-Abgleich konnte nicht abgeschlossen werden." },
      { status: 500 },
    );
  }
}
