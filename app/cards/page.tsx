import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";

import { deleteCardAction } from "@/app/actions";
import { ManaSymbol } from "@/components/mana-symbol";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCollectionStats, searchCards } from "@/lib/db";

export const dynamic = "force-dynamic";

type CardsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function CardsPage({ searchParams }: CardsPageProps) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const cards = searchCards(query);
  const stats = getCollectionStats();

  return (
    <div className="animate-fade-up space-y-6">
      <section className="glass-panel rounded-lg p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Sammlung</p>
            <h2 className="page-heading mt-3">Kartenuebersicht</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stats.uniqueCards} einzigartige Karten, {stats.totalCards} Karten gesamt.
            </p>
          </div>
          <Button asChild>
            <Link href="/cards/add">
              <Plus className="mr-2 h-4 w-4" />
              Karte hinzufuegen
            </Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Suche</CardTitle>
          <CardDescription>
            Suche nach Name, Set, Kartentyp, Seltenheit, Zustand oder Notizen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/cards" className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="field-shell">
              <Label htmlFor="q">Suchbegriff</Label>
              <Input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Lightning Bolt, Commander, Rare ..."
              />
            </div>
            <Button type="submit" className="self-end">
              <Search className="mr-2 h-4 w-4" />
              Suchen
            </Button>
            {query ? (
              <Button asChild variant="outline" className="self-end">
                <Link href="/cards">Zuruecksetzen</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {query ? `${cards.length} Treffer` : "Alle Karten"}
          </CardTitle>
          <CardDescription>
            Mengen, Farben und Kartendaten aus deiner lokalen Sammlung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
              Keine Karten gefunden.
            </div>
          ) : (
            <div className="grid gap-3">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="item-card grid gap-4 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-medium">{card.name}</h3>
                      <span className="meta-pill">
                        x{card.quantity}
                      </span>
                      <span className="rounded-md bg-primary/15 px-2 py-1 text-xs text-primary">
                        {card.condition}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.setName} - {card.cardType}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(card.colors.length ? card.colors : ["Farblos"]).map((color) => (
                        <ManaSymbol key={color} color={color} showLabel />
                      ))}
                      <span className="meta-pill">
                        MV {card.manaValue}
                      </span>
                      <span className="meta-pill">
                        {card.rarity}
                      </span>
                    </div>
                    {card.notes ? (
                      <p className="mt-3 text-sm text-muted-foreground">{card.notes}</p>
                    ) : null}
                  </div>

                  <form action={deleteCardAction} className="self-end lg:self-start">
                    <input type="hidden" name="cardId" value={card.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Loeschen
                    </Button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
