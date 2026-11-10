import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCompetition } from "@/hooks/useCompetition";
import { FANE, BRIKKE } from "@/lib/konkurranseStil";
import { Trophy, Wallet, ArrowLeftRight, RefreshCw, LogIn } from "lucide-react";
import LeaderboardTable from "@/components/competition/LeaderboardTable";
import PortfolioManager from "@/components/competition/PortfolioManager";
import StockTrader from "@/components/competition/StockTrader";
import { ReglerKnapp, PorteforljeStatus } from "@/components/competition/KonkurranseGuide";
import { PremieKnapp } from "@/components/competition/Premier";
import {
  KRAV_ANTALL_AKSJER,
  MAKSVEKT_PROSENT,
  MINSTE_FORSTEKJOP,
} from "@/lib/konkurranseregler";

const Competition = () => {
  const { toast } = useToast();
  const {
    user,
    participant,
    holdings,
    availableStocks,
    quotes,
    leaderboard,
    loading,
    quotesLoading,
    joinCompetition,
    buyStock,
    sellStock,
    fetchQuotes,
    getCashBalance,
    calculatePortfolioValue,
    checkTradingAllowed,
    STARTING_CAPITAL,
    MAX_DAILY_TRANSACTIONS_PER_STOCK,
  } = useCompetition();

  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  /**
   * Fanen styres manuelt: en ny deltaker uten gyldig portefølje skal lande
   * rett i Kjøp/Selg. Auth og deltakerdata kommer asynkront, så en ren
   * defaultValue på <Tabs> rekker ikke - den er låst før dataene finnes.
   */
  const [aktivFane, setAktivFane] = useState("leaderboard");
  const [faneAutovalgt, setFaneAutovalgt] = useState(false);
  // Kjøp fra Min portefølje: bytt til handelsfanen med kjøpsdialogen åpen,
  // og gå tilbake til porteføljen når dialogen lukkes.
  const [kjoepTicker, setKjoepTicker] = useState<string | null>(null);
  const kjoepFraPortefolje = (ticker: string) => {
    setKjoepTicker(ticker);
    setAktivFane("trade");
  };
  const kjoepFerdig = useCallback(() => {
    setKjoepTicker(null);
    setAktivFane("portfolio");
  }, []);

  const handleJoin = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Mangler visningsnavn",
        description: "Du må oppgi et visningsnavn for å delta",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    const { error } = await joinCompetition(displayName.trim());
    setIsJoining(false);

    if (error) {
      toast({
        title: "Kunne ikke melde deg på",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Velkommen til konkurransen!",
        description: `Du har nå ${STARTING_CAPITAL.toLocaleString('nb-NO')} kr å investere.`,
      });
    }
  };

  /**
   * Kjøpet går via en wrapper slik at siden kan feire øyeblikket
   * porteføljen blir gyldig - serveren sier fra via nylig_kvalifisert.
   */
  const handleBuy = async (ticker: string, quantity: number, price: number) => {
    const result = await buyStock(ticker, quantity, price);
    if (!result.error && result.nyligKvalifisert) {
      toast({
        title: "Porteføljen din er gyldig! 🎉",
        description:
          "Du har nå minst " + KRAV_ANTALL_AKSJER + " aksjer og rangeres på ledertavlen. Avkastningen din måles fra nå av.",
      });
    }
    return result;
  };

  const antallAksjer = holdings.filter((h) => h.ticker !== "ASK").length;

  useEffect(() => {
    if (!faneAutovalgt && participant) {
      if (antallAksjer < KRAV_ANTALL_AKSJER) setAktivFane("trade");
      setFaneAutovalgt(true);
    }
  }, [faneAutovalgt, participant, antallAksjer]);

  const portfolioValue = participant
    ? calculatePortfolioValue(holdings, quotes)
    : 0;

  // Avkastning måles fra porteføljen ble gyldig (startverdiene nullstilles
  // i det øyeblikket), med startkapitalen som reserve for eldre deltakere.
  const startValue = participant
    ? Number(participant.all_time_start_value) || STARTING_CAPITAL
    : STARTING_CAPITAL;

  const totalReturn = participant
    ? ((portfolioValue - startValue) / startValue) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="py-24">
          <div className="section-container text-center">
            <p className="text-muted-foreground">Laster konkurranse...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Mobil: plass i bunnen til den faste navigasjonslinjen */}
      <main className="pt-16 pb-28 md:pb-24">
        {/* Grønt toppfelt, samme bånd som på forsiden: invitasjon til venstre,
            dine tall (eller påmelding) til høyre under en gul strek */}
        <section className="text-white" style={{ background: "hsl(var(--band))" }}>
          <div className="section-container grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-20 pt-8 pb-10 md:pt-14 md:pb-16">
            <div>
              <h1 className="font-serif font-normal text-[40px] md:text-6xl leading-[1.02] tracking-[-0.015em]">
                Aksjekonkurransen
              </h1>
              <p className="text-white/75 text-base md:text-lg leading-relaxed mt-4 max-w-[32em]">
                Start med {STARTING_CAPITAL.toLocaleString("nb-NO")} kr i virtuell kapital, bygg din egen portefølje
                og se om du slår oss. Beste avkastning hver måned vinner premie.
              </p>
              {/* Regler og premier: ett trykk unna, uten å ta plass på siden */}
              <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                <ReglerKnapp moerk />
                <PremieKnapp moerk />
              </div>
            </div>

            <div className="border-t-2 pt-6 self-end" style={{ borderColor: "hsl(var(--competition))" }}>
              {!user && (
                <>
                  <p className="font-serif text-2xl md:text-3xl leading-tight">Logg inn for å være med</p>
                  <p className="text-white/70 mt-2 mb-6">Det er gratis og åpent for alle studenter.</p>
                  <Link
                    to="/auth"
                    className="knapp-skraa inline-flex items-center gap-2 px-8 py-3.5 font-semibold focus-visible:underline underline-offset-4"
                    style={{ background: "hsl(var(--competition))", color: "hsl(var(--competition-foreground))" }}
                  >
                    <LogIn className="w-4 h-4" />
                    Logg inn
                  </Link>
                </>
              )}

              {user && !participant && (
                <>
                  <p className="font-serif text-2xl md:text-3xl leading-tight">Meld deg på</p>
                  {/* Det viktigste fra reglene, synlig FØR man melder seg på */}
                  <p className="text-white/70 text-sm leading-relaxed mt-2 mb-5 max-w-md">
                    Porteføljen din blir gyldig når du eier minst {KRAV_ANTALL_AKSJER} ulike aksjer (minst{" "}
                    {MINSTE_FORSTEKJOP.toLocaleString("nb-NO")} kr per førstekjøp, maks {MAKSVEKT_PROSENT} % i én
                    aksje). Avkastningen måles fra da.
                  </p>
                  <Label htmlFor="displayName" className="text-white/80">
                    Visningsnavn
                  </Label>
                  <div className="mt-2 flex flex-col sm:flex-row gap-3">
                    <Input
                      id="displayName"
                      placeholder="Navnet ditt på ledertavlen"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      maxLength={50}
                      className="h-12 bg-white/10 border-white/25 text-white placeholder:text-white/40 focus-visible:ring-competition"
                    />
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="knapp-skraa shrink-0 px-8 h-12 font-semibold disabled:opacity-60 focus-visible:underline underline-offset-4"
                      style={{ background: "hsl(var(--competition))", color: "hsl(var(--competition-foreground))" }}
                    >
                      {isJoining ? "Melder på …" : "Meld meg på"}
                    </button>
                  </div>
                </>
              )}

              {participant && (
                <>
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-white/65">
                    <span>Porteføljen din</span>
                    <PorteforljeStatus participant={participant} holdings={holdings} moerk />
                  </div>
                  <p className="font-serif text-5xl md:text-[62px] leading-none tracking-[-0.01em] mt-3 mb-3 tabular-nums">
                    {portfolioValue.toLocaleString("nb-NO", { maximumFractionDigits: 0 })}
                    <span className="text-2xl ml-1.5 opacity-70">kr</span>
                  </p>
                  <p className="flex flex-wrap gap-x-6 gap-y-1 text-[14.5px] text-white/65">
                    <span>
                      Avkastning{" "}
                      <b className={`font-semibold tabular-nums ${totalReturn >= 0 ? "text-[#93D2A3]" : "text-[#F0A493]"}`}>
                        {totalReturn >= 0 ? "+" : "−"}
                        {Math.abs(totalReturn).toFixed(2).replace(".", ",")} %
                      </b>
                    </span>
                    <span>
                      Tilgjengelig{" "}
                      <b className="font-semibold text-white tabular-nums">
                        {getCashBalance().toLocaleString("nb-NO", { maximumFractionDigits: 0 })} kr
                      </b>
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="section-container pt-8 md:pt-12">
          {/* Main content tabs - nye deltakere lander rett i handelen,
              slik at veien til gyldig portefølje er kortest mulig */}
          <Tabs value={aktivFane} onValueChange={setAktivFane} className="space-y-6">
            {/* Fanelisten øverst vises bare på desktop - på mobil overtar
                den faste navigasjonslinjen i bunnen (tommelavstand) */}
{/* Uten deltakelse finnes bare ledertavlen, og da trengs ingen faner */}
            {participant && (
            <TabsList className="hidden md:flex h-auto w-full justify-start gap-9 rounded-none bg-transparent p-0 border-b border-border">
              <TabsTrigger value="leaderboard" className={FANE}>Ledertavle</TabsTrigger>
              <TabsTrigger value="portfolio" className={FANE}>Min portefølje</TabsTrigger>
              <TabsTrigger value="trade" className={FANE}>Kjøp og selg</TabsTrigger>
            </TabsList>
            )}

            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl md:text-4xl font-serif font-normal text-primary">Ledertavlen</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchQuotes()}
                    disabled={quotesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${quotesLoading ? 'animate-spin' : ''}`} />
                    Oppdater
                  </Button>
                </div>

                <Tabs defaultValue="monthly" className="space-y-4">
                  <TabsList className="h-auto flex flex-wrap justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger value="monthly" className={BRIKKE}>Denne måneden</TabsTrigger>
                    <TabsTrigger value="yearly" className={BRIKKE}>I år</TabsTrigger>
                    <TabsTrigger value="all_time" className={BRIKKE}>Hele perioden</TabsTrigger>
                  </TabsList>

                  <TabsContent value="monthly">
                    <LeaderboardTable 
                      entries={leaderboard.monthly} 
                      currentParticipantId={participant?.id}
                      periodLabel="denne måneden"
                      quotes={quotes}
                    />
                  </TabsContent>

                  <TabsContent value="yearly">
                    <LeaderboardTable 
                      entries={leaderboard.yearly} 
                      currentParticipantId={participant?.id}
                      periodLabel="i år"
                      quotes={quotes}
                    />
                  </TabsContent>

                  <TabsContent value="all_time">
                    <LeaderboardTable 
                      entries={leaderboard.all_time} 
                      currentParticipantId={participant?.id}
                      periodLabel="totalt"
                      quotes={quotes}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {participant && (
              <>
                <TabsContent value="portfolio">
                  <PortfolioManager
                    holdings={holdings}
                    quotes={quotes}
                    onSell={sellStock}
                    onKjoep={kjoepFraPortefolje}
                  />
                </TabsContent>

                <TabsContent value="trade">
                  <StockTrader
                    availableStocks={availableStocks}
                    quotes={quotes}
                    holdings={holdings}
                    cashBalance={getCashBalance()}
                    erKvalifisert={!!participant?.qualified_at}
                    onBuy={handleBuy}
                    onSell={sellStock}
                    onRefreshQuotes={fetchQuotes}
                    quotesLoading={quotesLoading}
                    checkTradingAllowed={checkTradingAllowed}
                    maxDailyTransactions={MAX_DAILY_TRANSACTIONS_PER_STOCK}
                    forhandsvalgtKjoep={kjoepTicker}
                    onForhandsvalgFerdig={kjoepFerdig}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>

      {/* Mobil: fast navigasjonslinje i bunnen - de tre delene av
          konkurransen er alltid ett tommeltrykk unna. Skjult på desktop. */}
      {participant && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Konkurransenavigasjon"
        >
          <div className="grid grid-cols-3">
            {[
              { id: "leaderboard", label: "Ledertavle", Ikon: Trophy },
              { id: "portfolio", label: "Portefølje", Ikon: Wallet },
              { id: "trade", label: "Handle", Ikon: ArrowLeftRight },
            ].map(({ id, label, Ikon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAktivFane(id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-current={aktivFane === id ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  aktivFane === id
                    ? "text-competition"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Ikon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <Footer />
    </div>
  );
};

export default Competition;
