import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { createCard } from "@/app/actions";
import { CardScanner } from "@/components/card-scanner";
import { ManaSymbol, mtgColors } from "@/components/mana-symbol";
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
import { Textarea } from "@/components/ui/textarea";

const rarities = ["Common", "Uncommon", "Rare", "Mythic Rare"];
const conditions = ["Near Mint", "Excellent", "Good", "Played", "Poor"];

export default function AddCardPage() {
  return (
    <div className="mx-auto max-w-4xl animate-fade-up space-y-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck zum Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <p className="eyebrow">Sammlung</p>
          <CardTitle className="text-3xl">Karte hinzufuegen</CardTitle>
          <CardDescription>
            Speichere eine MTG Karte lokal in deiner SQLite Sammlung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCard} className="grid gap-6">
            <CardScanner targetInputId="name" />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="field-shell">
                <Label htmlFor="name">Kartenname</Label>
                <Input id="name" name="name" placeholder="Lightning Bolt" required />
              </div>
              <div className="field-shell">
                <Label htmlFor="setName">Set</Label>
                <Input id="setName" name="setName" placeholder="Magic 2011" required />
              </div>
              <div className="field-shell">
                <Label htmlFor="cardType">Kartentyp</Label>
                <Input id="cardType" name="cardType" placeholder="Instant" required />
              </div>
              <div className="field-shell">
                <Label htmlFor="manaValue">Manawert</Label>
                <Input id="manaValue" name="manaValue" type="number" min="0" defaultValue="1" />
              </div>
              <div className="field-shell">
                <Label htmlFor="quantity">Anzahl</Label>
                <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" />
              </div>
              <div className="field-shell">
                <Label htmlFor="rarity">Seltenheit</Label>
                <select
                  id="rarity"
                  name="rarity"
                  className="form-select"
                  defaultValue="Common"
                >
                  {rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-shell md:col-span-2">
                <Label htmlFor="condition">Zustand</Label>
                <select
                  id="condition"
                  name="condition"
                  className="form-select"
                  defaultValue="Near Mint"
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-shell">
              <Label>Farben</Label>
              <div className="grid gap-3 sm:grid-cols-5">
                {mtgColors.map((color) => (
                  <label
                    key={color}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-white/[0.07]"
                  >
                    <input
                      type="checkbox"
                      name="colors"
                      value={color}
                      className="h-4 w-4 accent-emerald-400"
                    />
                    <ManaSymbol color={color} showLabel />
                  </label>
                ))}
              </div>
            </div>

            <div className="field-shell">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Foil, Commander-Staple, Tauschkarte ..."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="outline">
                <Link href="/">Abbrechen</Link>
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Karte speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
