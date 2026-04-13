import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Layers3,
  ScanLine,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";

import { deleteCardAction } from "@/app/actions";
import { CardDistributionChart } from "@/components/card-distribution-chart";
import { ManaSymbol } from "@/components/mana-symbol";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCollectionStats, getColorDistribution, getLatestCards } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const latestCards = getLatestCards();
  const stats = getCollectionStats();
  const colorDistribution = getColorDistribution();

  return (
    <div className="animate-fade-up space-y-7">
      <section className="glass-panel rounded-lg px-5 py-7 sm:px-8 sm:py-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <p className="eyebrow">
              Lokale SQLite Sammlung
            </p>
            <div className="space-y-3">
              <h2 className="page-heading max-w-3xl">
                Deine Magic Karten, sauber sortiert.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Erfasse Karten, pruefe deine letzten Eintraege und behalte die
                Farbverteilung deiner Sammlung im Blick.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-fit">
              <Link href="/scan">
                Live scannen
                <ScanLine className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-fit">
              <Link href="/cards/add">
                Manuell hinzufuegen
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<WalletCards className="h-5 w-5" />}
          label="Karten gesamt"
          value={stats.totalCards}
        />
        <StatCard
          icon={<Layers3 className="h-5 w-5" />}
          label="Einzigartige Karten"
          value={stats.uniqueCards}
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Durchschnitt Manawert"
          value={stats.averageMana}
        />
        <StatCard
          icon={<Boxes className="h-5 w-5" />}
          label="Decks"
          value={stats.decks}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Farbverteilung</CardTitle>
            <CardDescription>Anzahl der Karten nach Farbidentitaet.</CardDescription>
          </CardHeader>
          <CardContent>
            <CardDistributionChart data={colorDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte MTG Karten</CardTitle>
            <CardDescription>Die neuesten Eintraege aus deiner lokalen Sammlung.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestCards.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                Noch keine Karten gespeichert. Fuege deine erste Karte hinzu.
              </div>
            ) : (
              latestCards.map((card) => (
                <article
                  key={card.id}
                  className="item-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{card.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.setName} - {card.cardType}
                      </p>
                    </div>
                    <span className="meta-pill">
                      x{card.quantity}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap gap-2">
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
                    <form action={deleteCardAction}>
                      <input type="hidden" name="cardId" value={card.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Loeschen
                      </Button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex min-h-32 items-center justify-between p-5 sm:p-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
