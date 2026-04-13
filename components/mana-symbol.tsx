import { Circle, Droplet, Flame, Skull, Sun, TreePine } from "lucide-react";

import { cn } from "@/lib/utils";

const manaStyles: Record<string, string> = {
  Weiss: "bg-zinc-100 text-zinc-950 ring-zinc-300/70",
  Blau: "bg-sky-400 text-sky-950 ring-sky-200/70",
  Schwarz: "bg-zinc-950 text-zinc-100 ring-zinc-600/80",
  Rot: "bg-red-500 text-white ring-red-300/70",
  Gruen: "bg-emerald-500 text-emerald-950 ring-emerald-200/70",
  Farblos: "bg-stone-300 text-stone-950 ring-stone-100/70",
};

const manaIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Weiss: Sun,
  Blau: Droplet,
  Schwarz: Skull,
  Rot: Flame,
  Gruen: TreePine,
  Farblos: Circle,
};

export function ManaSymbol({
  color,
  className,
  showLabel = false,
}: {
  color: string;
  className?: string;
  showLabel?: boolean;
}) {
  const Icon = manaIcons[color] ?? Circle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        manaStyles[color] ?? "bg-white/10 text-foreground ring-white/15",
        className,
      )}
      title={color}
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 ring-1 ring-inset ring-current/20">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {showLabel ? <span>{color}</span> : null}
    </span>
  );
}

export const mtgColors = ["Weiss", "Blau", "Schwarz", "Rot", "Gruen"];
