import { formatMill, formatPct, formatTid } from "@/lib/invest-game/motor";
import { VARIGHET_SEK } from "@/config/invest-game/spillet";

interface TopLinjeProps {
  tSek: number;
  totalverdi: number;
  avkastning: number;
  kontanter: number;
}

/**
 * Den klistrede topplinjen under navigasjonen: nedtelling og de tre
 * tallene gruppen styrer etter. Store tall, ingenting annet.
 */
const TopLinje = ({ tSek, totalverdi, avkastning, kontanter }: TopLinjeProps) => {
  const igjen = VARIGHET_SEK - tSek;
  const snartSlutt = igjen <= 30;

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="section-container py-3 md:py-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 justify-between">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Tid igjen
            </p>
            <p
              className={`font-serif text-3xl md:text-4xl tabular-nums leading-none ${
                snartSlutt ? "stock-negative" : "text-foreground"
              }`}
            >
              {formatTid(igjen)}
            </p>
          </div>

          <div className="flex gap-8 md:gap-12">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Total verdi
              </p>
              <p className="font-serif text-2xl md:text-3xl tabular-nums leading-none text-foreground">
                {formatMill(totalverdi)}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Avkastning
              </p>
              <p
                className={`font-serif text-2xl md:text-3xl tabular-nums leading-none ${
                  avkastning >= 0 ? "stock-positive" : "stock-negative"
                }`}
              >
                {formatPct(avkastning)}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Kontanter
              </p>
              <p className="font-serif text-2xl md:text-3xl tabular-nums leading-none text-foreground">
                {formatMill(kontanter)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopLinje;
