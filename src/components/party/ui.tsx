import { Link } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { QueueItem, Track } from "@/lib/types";

type Variant = "primary" | "accent" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-110",
  accent: "bg-accent text-accent-foreground hover:brightness-110",
  ghost: "bg-secondary text-secondary-foreground hover:bg-muted border border-border",
  danger: "bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25",
};

export function BigButton({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function DemoBadge({ children = "Dados fictícios" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
      ● {children}
    </span>
  );
}

export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
      <Link to="/" className="font-display text-xl font-extrabold">
        <span className="text-party">Festa</span> na Fila
      </Link>
      {right}
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl border border-border bg-card/80 p-5 backdrop-blur", className)}>{children}</section>;
}

/** Miniatura fictícia (gradiente). Futuro: <img src={thumbnail do YouTube} />. */
export function Thumb({ track, size = "md" }: { track: Track; size?: "md" | "lg" }) {
  return (
    <div
      aria-label="Miniatura fictícia"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl text-xs font-bold text-foreground/80",
        size === "lg" ? "aspect-video w-full text-sm" : "h-14 w-20",
      )}
      style={{
        background: `linear-gradient(135deg, oklch(0.55 0.2 ${track.hue}), oklch(0.3 0.1 ${track.hue + 40}))`,
      }}
    >
      DEMO
    </div>
  );
}

export function QueueList({ items, highlightName }: { items: QueueItem[]; highlightName?: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-3xl">🎶</p>
        <p className="mt-2 font-semibold">A fila está vazia</p>
        <p className="text-sm text-muted-foreground">Peça a primeira música e comece a festa!</p>
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li
          key={item.queueId}
          className={cn(
            "flex items-center gap-3 rounded-2xl bg-secondary/60 p-2 pr-3",
            highlightName && item.requestedBy === highlightName && "ring-2 ring-accent",
          )}
        >
          <span className="w-6 text-center font-display font-bold text-muted-foreground">{i + 1}</span>
          <Thumb track={item} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{item.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {item.channel} · pedido por <span className="text-accent">{item.requestedBy}</span>
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{item.duration}</span>
        </li>
      ))}
    </ol>
  );
}

export function EndedState() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-5xl">🌙</p>
      <h2 className="mt-3 text-2xl font-bold">Festa encerrada</h2>
      <p className="mt-2 text-muted-foreground">O anfitrião encerrou esta festa. Obrigado por animar a pista!</p>
      <Link to="/" className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground">
        Voltar ao início
      </Link>
    </Card>
  );
}
