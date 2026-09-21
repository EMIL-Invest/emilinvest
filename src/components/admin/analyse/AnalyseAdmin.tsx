import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, PieChart, SlidersHorizontal } from "lucide-react";
import type { Holding, StockQuote } from "@/hooks/usePortfolioData";
import { Forutsetninger, STANDARD_FORUTSETNINGER, hentForutsetninger } from "@/lib/analyse/db";
import Verdsettelser from "./Verdsettelser";
import Portefoljeanalyse from "./Portefoljeanalyse";
import ForutsetningerPanel from "./ForutsetningerPanel";

/**
 * Analyse-fanen i admin: verdsettelse av enkeltaksjer, analyse av hele
 * porteføljen, og de felles forutsetningene begge bygger på. Teorien er
 * Berk & DeMarzo kap. 9-13 og 18 - kapittelreferanser står i
 * forklaringene inne i verktøyet.
 */
const AnalyseAdmin = ({ holdings, quotes }: { holdings: Holding[]; quotes: Record<string, StockQuote> }) => {
  const [forutsetninger, setForutsetninger] = useState<Forutsetninger>(STANDARD_FORUTSETNINGER);
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    hentForutsetninger()
      .then(setForutsetninger)
      .catch(() => setForutsetninger(STANDARD_FORUTSETNINGER))
      .finally(() => setKlar(true));
  }, []);

  const tickerForslag = useMemo(
    () => holdings.filter((h) => h.holding_type === "stock").map((h) => ({ ticker: h.ticker, navn: h.name })),
    [holdings],
  );

  if (!klar) return <p className="text-sm text-muted-foreground">Laster forutsetninger...</p>;

  return (
    <Tabs defaultValue="verdsettelse" className="space-y-6">
      <TabsList className="grid w-full max-w-xl grid-cols-3">
        <TabsTrigger value="verdsettelse" className="flex items-center gap-2"><Calculator className="w-4 h-4" />Verdsettelse</TabsTrigger>
        <TabsTrigger value="portefolje" className="flex items-center gap-2"><PieChart className="w-4 h-4" />Portefølje</TabsTrigger>
        <TabsTrigger value="forutsetninger" className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" />Forutsetninger</TabsTrigger>
      </TabsList>
      <TabsContent value="verdsettelse">
        <Verdsettelser forutsetninger={forutsetninger} tickerForslag={tickerForslag} />
      </TabsContent>
      <TabsContent value="portefolje">
        <Portefoljeanalyse holdings={holdings} quotes={quotes} forutsetninger={forutsetninger} />
      </TabsContent>
      <TabsContent value="forutsetninger">
        <ForutsetningerPanel key={JSON.stringify(forutsetninger)} verdi={forutsetninger} onLagret={setForutsetninger} />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyseAdmin;
