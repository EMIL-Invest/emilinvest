import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KRAV_ANTALL_AKSJER } from "@/hooks/useCompetition";

/**
 * Lett variant av ledertavlen for forsiden.
 *
 * useCompetition henter auth, hele aksjeuniverset og brukerens egen
 * portefølje i tillegg — mer enn en teaser på forsiden trenger. Denne
 * gjør tre spørringer og regner ut det samme månedstallet, med samme
 * kvalifiseringskrav (KRAV_ANTALL_AKSJER) slik at plasseringene her og
 * på /konkurranse aldri spriker.
 *
 * Tabellene er lesbare uten innlogging — ledertavlen er åpen, og det
 * står i personvernerklæringen at visningsnavn og avkastning vises.
 */

export interface ToppNavn {
  id: string;
  navn: string;
  avkastning: number;
}

interface Deltaker {
  id: string;
  display_name: string;
  monthly_start_value: number;
}

interface Post {
  participant_id: string;
  ticker: string;
  quantity: number;
  average_purchase_price: number;
}

export const useToppliste = (antall = 3) => {
  const [topp, setTopp] = useState<ToppNavn[]>([]);
  const [antallDeltakere, setAntallDeltakere] = useState(0);
  const [laster, setLaster] = useState(true);

  const hent = useCallback(async () => {
    const { data: deltakere, error } = await supabase
      .from("competition_participants")
      .select("id, display_name, monthly_start_value")
      .eq("is_active", true);

    if (error || !deltakere || deltakere.length === 0) {
      setTopp([]);
      setAntallDeltakere(0);
      setLaster(false);
      return;
    }
    setAntallDeltakere(deltakere.length);

    const { data: poster } = await supabase
      .from("competition_portfolios")
      .select("participant_id, ticker, quantity, average_purchase_price");

    const alle = (poster ?? []) as Post[];
    const tickere = [...new Set(alle.map((p) => p.ticker).filter((t) => t !== "ASK"))];

    // Live-kurser. Feiler kallet, faller vi tilbake på kjøpskurs — da
    // blir avkastningen for lav, men ingen rad forsvinner.
    const kurser: Record<string, number> = {};
    if (tickere.length > 0) {
      try {
        const { data } = await supabase.functions.invoke("stock-prices", {
          body: { tickers: tickere },
        });
        for (const q of data?.quotes ?? []) {
          if (q?.ticker && q.price > 0) kurser[q.ticker] = q.price;
        }
      } catch {
        // stille — fallback under
      }
    }

    const rader = (deltakere as Deltaker[]).map((d) => {
      const mine = alle.filter((p) => p.participant_id === d.id);
      const verdi = mine.reduce((sum, p) => {
        if (p.ticker === "ASK") return sum + Number(p.quantity);
        const kurs = kurser[p.ticker] ?? Number(p.average_purchase_price);
        return sum + kurs * Number(p.quantity);
      }, 0);
      const start = Number(d.monthly_start_value);
      const aksjer = mine.filter((p) => p.ticker !== "ASK").length;
      return {
        id: d.id,
        navn: d.display_name,
        avkastning: start > 0 ? ((verdi - start) / start) * 100 : 0,
        kvalifisert: aksjer >= KRAV_ANTALL_AKSJER,
      };
    });

    setTopp(
      rader
        .filter((r) => r.kvalifisert)
        .sort((a, b) => b.avkastning - a.avkastning)
        .slice(0, antall)
        .map(({ id, navn, avkastning }) => ({ id, navn, avkastning }))
    );
    setLaster(false);
  }, [antall]);

  useEffect(() => {
    hent();
  }, [hent]);

  return { topp, antallDeltakere, laster };
};
