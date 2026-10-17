import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterValg {
  value: string;
  label: string;
  /** Vises over de vanlige valgene, skilt med en strek (f.eks. «Mine aksjer») */
  fremhevet?: boolean;
}

interface FlervalgFilterProps {
  /** Teksten når ingenting er valgt, f.eks. «Alle markeder» */
  alleTekst: string;
  /** Flertall brukt når flere er valgt, f.eks. «markeder» -> «3 markeder» */
  flertall: string;
  valg: FilterValg[];
  valgte: string[];
  onChange: (valgte: string[]) => void;
  className?: string;
}

/** Nedtrekksmeny med avkrysningsbokser og egen Tilbakestill-knapp. */
const FlervalgFilter = ({ alleTekst, flertall, valg, valgte, onChange, className }: FlervalgFilterProps) => {
  const toggle = (value: string) => {
    onChange(valgte.includes(value) ? valgte.filter(v => v !== value) : [...valgte, value]);
  };

  const tekst =
    valgte.length === 0
      ? alleTekst
      : valgte.length === 1
        ? valg.find(v => v.value === valgte[0])?.label ?? alleTekst
        : `${valgte.length} ${flertall}`;

  const fremhevede = valg.filter(v => v.fremhevet);
  const vanlige = valg.filter(v => !v.fremhevet);

  const rad = (v: FilterValg) => {
    const valgt = valgte.includes(v.value);
    return (
      <button
        key={v.value}
        type="button"
        role="menuitemcheckbox"
        aria-checked={valgt}
        onClick={() => toggle(v.value)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          v.fremhevet && "font-medium text-primary",
        )}
      >
        <span
          className={cn(
            "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border border-primary",
            valgt ? "bg-primary text-primary-foreground" : "bg-background",
          )}
        >
          {valgt && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        <span className="truncate">{v.label}</span>
      </button>
    );
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-10 w-full items-center justify-between gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className,
        )}
      >
        <span className="truncate">{tekst}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={e => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] min-w-[13rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {valgte.length === 0 ? alleTekst : `${valgte.length} valgt`}
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={valgte.length === 0}
            className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            Tilbakestill
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {fremhevede.map(rad)}
          {fremhevede.length > 0 && <div className="-mx-1 my-1 h-px bg-muted" />}
          {vanlige.map(rad)}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FlervalgFilter;
