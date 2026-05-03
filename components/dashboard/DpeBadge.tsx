import { cn } from "@/lib/utils";

type DpeLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

interface Props {
  letter: DpeLetter | string | null | undefined;
  className?: string;
}

export default function DpeBadge({ letter, className }: Props) {
  const normalized = (letter ?? "").toString().toUpperCase().slice(0, 1);
  const valid = ["A", "B", "C", "D", "E", "F", "G"].includes(normalized);
  if (!valid) {
    return (
      <span
        className={cn(
          "inline-flex h-6 min-w-6 items-center justify-center rounded px-2 text-[12px] font-semibold text-tk-text-faint border border-dashed border-tk-border",
          className,
        )}
      >
        —
      </span>
    );
  }
  return (
    <span className={cn("dpe-badge", className)} data-letter={normalized} aria-label={`Étiquette DPE ${normalized}`}>
      {normalized}
    </span>
  );
}
