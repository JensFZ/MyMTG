import Link from "next/link";
import { LibraryBig, Plus, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <LibraryBig className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Persoenliche Sammlung</p>
            <h1 className="text-xl font-semibold tracking-tight">MyMTG</h1>
          </div>
        </Link>

        <nav className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto rounded-lg border border-white/10 bg-black/15 p-1 lg:w-fit">
          <Button asChild variant="ghost">
            <Link href="/" className="shrink-0">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/cards" className="shrink-0">Karten</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/decks" className="shrink-0">Decks</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/scan" className="shrink-0">
              <ScanLine className="mr-2 h-4 w-4" />
              Scan
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cards/add" className="shrink-0">
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
