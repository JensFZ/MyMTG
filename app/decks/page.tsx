import Link from "next/link";
import { ArrowLeft, Layers3, Plus, Save, Trash2 } from "lucide-react";

import {
  addCardToDeckAction,
  createDeck,
  deleteDeckAction,
  removeCardFromDeckAction,
  updateDeckCardQuantityAction,
} from "@/app/actions";
import { ManaSymbol } from "@/components/mana-symbol";
import { Button } from "@/components/ui/button";
import {
  Card as Panel,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllCards, getDeckCards, getDecks } from "@/lib/db";

export const dynamic = "force-dynamic";

const formats = ["Casual", "Commander", "Standard", "Pioneer", "Modern", "Legacy", "Pauper"];

export default function DecksPage() {
  const decks = getDecks();
  const cards = getAllCards();

  return (
    <div className="animate-fade-up space-y-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurueck zum Dashboard
        </Link>
      </Button>

      <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Panel>
          <CardHeader>
            <p className="eyebrow">Deckbau</p>
            <CardTitle className="text-3xl">Deck anlegen</CardTitle>
            <CardDescription>
              Erstelle ein Deck und fuege danach Karten aus deiner Sammlung hinzu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDeck} className="grid gap-5">
              <div className="field-shell">
                <Label htmlFor="name">Deckname</Label>
                <Input id="name" name="name" placeholder="Gruul Stompy" required />
              </div>

              <div className="field-shell">
                <Label htmlFor="format">Format</Label>
                <select
                  id="format"
                  name="format"
                  className="form-select"
                  defaultValue="Casual"
                >
                  {formats.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-shell">
                <Label htmlFor="description">Notizen</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Gameplan, Sideboard-Ideen, fehlende Karten ..."
                />
              </div>

              <Button type="submit" className="w-full sm:w-fit">
                <Plus className="mr-2 h-4 w-4" />
                Deck speichern
              </Button>
            </form>
          </CardContent>
        </Panel>

        <Panel>
          <CardHeader>
            <CardTitle>Decks</CardTitle>
            <CardDescription>
              Verwalte Kartenlisten, Mengen und Formate deiner Decks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                Noch keine Decks gespeichert.
              </div>
            ) : (
              decks.map((deck) => {
                const deckCards = getDeckCards(deck.id);

                return (
                  <article
                    key={deck.id}
                    className="item-card"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold">{deck.name}</h3>
                          <span className="inline-flex rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                            {deck.format}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {deck.totalCards} Karten, {deck.uniqueCards} einzigartig
                        </p>
                        {deck.description ? (
                          <p className="max-w-2xl text-sm text-muted-foreground">
                            {deck.description}
                          </p>
                        ) : null}
                      </div>

                      <form action={deleteDeckAction}>
                        <input type="hidden" name="deckId" value={deck.id} />
                        <Button type="submit" variant="outline" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deck loeschen
                        </Button>
                      </form>
                    </div>

                    <form
                      action={addCardToDeckAction}
                      className="mt-5 grid gap-3 rounded-lg border border-white/10 bg-black/15 p-3 md:grid-cols-[1fr_7rem_auto]"
                    >
                      <input type="hidden" name="deckId" value={deck.id} />
                      <div className="field-shell">
                        <Label htmlFor={`card-${deck.id}`}>Karte hinzufuegen</Label>
                        <select
                          id={`card-${deck.id}`}
                          name="cardId"
                          className="form-select"
                          required
                          disabled={cards.length === 0}
                        >
                          <option value="">Karte auswaehlen</option>
                          {cards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.name} ({card.setName}) - verfuegbar: {card.quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-shell">
                        <Label htmlFor={`quantity-${deck.id}`}>Anzahl</Label>
                        <Input
                          id={`quantity-${deck.id}`}
                          name="quantity"
                          type="number"
                          min="1"
                          defaultValue="1"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="self-end"
                        disabled={cards.length === 0}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Hinzufuegen
                      </Button>
                    </form>

                    <div className="mt-4 space-y-2">
                      {deckCards.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-muted-foreground">
                          Dieses Deck ist noch leer.
                        </div>
                      ) : (
                        deckCards.map((card) => (
                          <div
                            key={card.id}
                            className="grid gap-3 rounded-lg border border-white/10 bg-black/10 p-3 md:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium">{card.name}</h4>
                                <span className="meta-pill">
                                  x{card.deckQuantity}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {card.setName} - {card.cardType}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(card.colors.length ? card.colors : ["Farblos"]).map(
                                  (color) => (
                                    <ManaSymbol key={color} color={color} showLabel />
                                  ),
                                )}
                                <span className="meta-pill">
                                  MV {card.manaValue}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-2 md:justify-end">
                              <form
                                action={updateDeckCardQuantityAction}
                                className="flex items-end gap-2"
                              >
                                <input type="hidden" name="deckId" value={deck.id} />
                                <input type="hidden" name="cardId" value={card.id} />
                                <div className="field-shell w-24">
                                  <Label htmlFor={`deck-${deck.id}-card-${card.id}`}>
                                    Anzahl
                                  </Label>
                                  <Input
                                    id={`deck-${deck.id}-card-${card.id}`}
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    max={card.quantity}
                                    defaultValue={card.deckQuantity}
                                  />
                                </div>
                                <Button type="submit" variant="outline" size="sm">
                                  <Save className="h-4 w-4" />
                                  <span className="sr-only">Anzahl speichern</span>
                                </Button>
                              </form>

                              <form action={removeCardFromDeckAction}>
                                <input type="hidden" name="deckId" value={deck.id} />
                                <input type="hidden" name="cardId" value={card.id} />
                                <Button type="submit" variant="ghost" size="sm">
                                  Entfernen
                                </Button>
                              </form>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </CardContent>
        </Panel>
      </section>

      {cards.length === 0 ? (
        <section className="glass-panel rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Keine Karten verfuegbar</h2>
              <p className="text-sm text-muted-foreground">
                Lege zuerst Karten an, bevor du Decks befuellst.
              </p>
            </div>
            <Button asChild>
              <Link href="/cards/add">
                <Layers3 className="mr-2 h-4 w-4" />
                Karte hinzufuegen
              </Link>
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
