import Link from "next/link";
import { LibraryBig, Plus, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/10 transition-colors group-hover:bg-white/15">
            <LibraryBig className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Persoenliche Sammlung</p>
            <h1 className="text-xl font-semibold tracking-tight">MyMTG</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/cards">Karten</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/decks">Decks</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/scan">
              <ScanLine className="mr-2 h-4 w-4" />
              Scan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cards/add">
              <Plus className="mr-2 h-4 w-4" />
              Karte
            </Link>
          </Button>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8">{children}</main>
    </div>
  );
}
