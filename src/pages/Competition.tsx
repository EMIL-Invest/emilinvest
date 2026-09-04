import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCompetition } from "@/hooks/useCompetition";
import { Trophy, Wallet, ArrowUpRight, ArrowDownRight, ArrowLeftRight, RefreshCw, LogIn, Gift, Utensils, Coffee, Puzzle, TrendingUp } from "lucide-react";
import LeaderboardTable from "@/components/competition/LeaderboardTable";
import PortfolioManager from "@/components/competition/PortfolioManager";
import StockTrader from "@/components/competition/StockTrader";
import { ReglerKnapp, PorteforljeStatus } from "@/components/competition/KonkurranseGuide";
import middagBilde from "@/assets/premier/middag.jpg";
import britanniaBilde from "@/assets/premier/britannia.jpg";
import escapeBilde from "@/assets/premier/escape.jpg";
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
   * defaultValue på <Tabs> rekker ikke — den er låst før dataene finnes.
   */
  const [aktivFane, setAktivFane] = useState("leaderboard");
  const [faneAutovalgt, setFaneAutovalgt] = useState(false);

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
   * porteføljen blir gyldig — serveren sier fra via nylig_kvalifisert.
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
      <main className="pt-16 pb-28 md:py-24">
        <div className="section-container">
          {/* Header — kompaktere på mobil så innholdet kommer raskere frem */}
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-3 md:mb-4 bg-competition text-competition-foreground">
              <Trophy className="w-3 h-3 mr-1" />
              Aksjekonkurranse
            </Badge>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-3 md:mb-4">
              Investeringskonkurranse
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Start med {STARTING_CAPITAL.toLocaleString('nb-NO')} kr — høyest avkastning vinner.
            </p>
            {/* Reglene skal være ett trykk unna fra forsiden av konkurransen */}
            <div className="mt-5">
              <ReglerKnapp />
            </div>
          </div>

          {/* Premiene — synlige for alle, FØR påmelding: dette er
              grunnen til å bli med. Tall og premier vedtatt på
              komitémøtet 3. september. */}
          <div className="max-w-3xl mx-auto mb-8 md:mb-12">
            <Card className="border-competition/40 overflow-hidden">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5" style={{ color: "hsl(var(--competition))" }} />
                  <h2 className="font-serif text-xl font-bold">Dette kan du vinne</h2>
                </div>

                {/* Månedspremien: gavekortet tegnet som et «utklippet» kort */}
                <div className="flex items-center gap-4">
                  <svg
                    viewBox="0 0 200 126"
                    className="w-32 sm:w-36 flex-shrink-0 drop-shadow-md"
                    role="img"
                    aria-label="Gavekort på Sit, 150 kroner"
                  >
                    <defs>
                      <linearGradient id="sitkort" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#0b3f8f" />
                        <stop offset="1" stopColor="#1d6fe0" />
                      </linearGradient>
                    </defs>
                    <rect x="1" y="1" width="198" height="124" rx="12" fill="url(#sitkort)" />
                    <circle cx="168" cy="-8" r="52" fill="#ffffff" opacity="0.08" />
                    <circle cx="14" cy="120" r="38" fill="#ffffff" opacity="0.06" />
                    <text x="16" y="30" fill="#ffffff" opacity="0.85" fontSize="11" letterSpacing="2.5" fontFamily="Calibri, sans-serif">
                      GAVEKORT
                    </text>
                    <text x="16" y="76" fill="#ffffff" fontSize="34" fontWeight="bold" fontFamily="Cambria, serif">
                      150,-
                    </text>
                    <text x="16" y="108" fill="#ffffff" opacity="0.9" fontSize="15" fontWeight="bold" fontFamily="Calibri, sans-serif">
                      Sit
                    </text>
                    <rect x="150" y="92" width="34" height="22" rx="4" fill="#ffffff" opacity="0.22" />
                  </svg>
                  <div className="text-sm leading-relaxed">
                    <Badge className="bg-competition text-competition-foreground mb-1.5">
                      Hver måned
                    </Badge>
                    <p className="font-medium">Gavekort på Sit · 150 kr</p>
                    <p className="text-muted-foreground">Best avkastning den måneden vinner.</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-competition text-competition-foreground flex-shrink-0 mt-0.5">
                      1. juni
                    </Badge>
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium">Hovedpremien:</span>{" "}
                      <span className="text-muted-foreground">vinneren velger én av tre —</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-md border border-border bg-secondary/40 overflow-hidden">
                      <img
                        src={middagBilde}
                        alt="Dekket bord for to med levende lys"
                        className="w-full aspect-[16/10] object-cover"
                        loading="lazy"
                      />
                      <div className="p-3 text-sm">
                        <p className="font-medium leading-snug flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--competition))" }} />
                          Treretters på To Rom og Kjøkken
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">for 2 personer</p>
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/40 overflow-hidden">
                      <img
                        src={britanniaBilde}
                        alt="Britannia Hotel i Trondheim"
                        className="w-full aspect-[16/10] object-cover"
                        loading="lazy"
                      />
                      <div className="p-3 text-sm">
                        <p className="font-medium leading-snug flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--competition))" }} />
                          Frokost på Britannia
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">for 2 personer</p>
                      </div>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/40 overflow-hidden">
                      <img
                        src={escapeBilde}
                        alt="Låst dør med hengelås og kjetting"
                        className="w-full aspect-[16/10] object-cover"
                        loading="lazy"
                      />
                      <div className="p-3 text-sm">
                        <p className="font-medium leading-snug flex items-center gap-1.5">
                          <Puzzle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--competition))" }} />
                          Escape room i Trondheim
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">for opptil 4 personer</p>
                      </div>
                    </div>
                  </div>
                  {/* CC-lisensene krever navngivelse av fotografene */}
                  <p className="text-[10px] text-muted-foreground/70 leading-snug">
                    Foto: PattayaPatrol, Ssu, Annatsach / Wikimedia Commons (CC BY-SA 4.0)
                  </p>
                </div>

                <p className="flex items-start gap-2 text-sm text-muted-foreground border-t border-border pt-3">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--competition))" }} />
                  <span>
                    <span className="font-medium text-foreground">Det lønner seg å bli med tidlig</span>{" "}
                    — avkastningen din måles fra porteføljen er gyldig, så jo før du
                    starter, jo lenger får avkastningen jobbe for deg.
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Not logged in */}
          {!user && (
            <Card className="max-w-md mx-auto mb-12">
              <CardHeader className="text-center">
                <CardTitle>Logg inn for å delta</CardTitle>
                <CardDescription>
                  Du må være innlogget for å delta i konkurransen
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    Logg inn
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Logged in but not participating */}
          {user && !participant && (
            <Card className="max-w-md mx-auto mb-12">
              <CardHeader className="text-center">
                <CardTitle>Delta i konkurransen</CardTitle>
                <CardDescription>
                  Meld deg på og få {STARTING_CAPITAL.toLocaleString('nb-NO')} kr i virtuell kapital
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Det viktigste fra reglene, synlig FØR man melder seg på */}
                <div className="rounded-md bg-secondary/50 border border-border p-3 text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Slik blir porteføljen din gyldig:</p>
                  <p>
                    Kjøp minst {KRAV_ANTALL_AKSJER} ulike aksjer (minst{" "}
                    {MINSTE_FORSTEKJOP.toLocaleString("nb-NO")} kr per førstekjøp,
                    maks {MAKSVEKT_PROSENT} % i én aksje). Avkastningen din måles
                    fra porteføljen er gyldig.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Visningsnavn</Label>
                  <Input
                    id="displayName"
                    placeholder="Ditt navn på leaderboard"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full bg-competition hover:bg-competition/90 text-competition-foreground"
                >
                  {isJoining ? "Melder på..." : "Meld meg på"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Guiden: fra påmeldt til gyldig portefølje */}
          {participant && (
            <PorteforljeStatus participant={participant} holdings={holdings} />
          )}

          {/* Mobil: ett kompakt statuskort i stedet for tre store kort,
              slik at topplisten/handelen er synlig uten å scrolle en hel skjerm */}
          {participant && (
            <Card className="mb-6 md:hidden">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Porteføljeverdi</p>
                    <p className="text-2xl font-bold leading-tight">
                      {portfolioValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-lg font-bold flex-shrink-0 ${
                    totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totalReturn >= 0 ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                    {totalReturn.toFixed(2)}%
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Tilgjengelig:{" "}
                    <span className="font-medium text-foreground">
                      {getCashBalance().toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop: de tre store kortene som før */}
          {participant && (
            <div className="hidden md:grid grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Porteføljeverdi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {portfolioValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total avkastning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold flex items-center gap-2 ${
                    totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totalReturn >= 0 ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6" />
                    )}
                    {totalReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tilgjengelig (ASK)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-muted-foreground" />
                    {getCashBalance().toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content tabs — nye deltakere lander rett i handelen,
              slik at veien til gyldig portefølje er kortest mulig */}
          <Tabs value={aktivFane} onValueChange={setAktivFane} className="space-y-6">
            {/* Fanelisten øverst vises bare på desktop — på mobil overtar
                den faste navigasjonslinjen i bunnen (tommelavstand) */}
            <TabsList className="hidden md:grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              {participant && (
                <>
                  <TabsTrigger value="portfolio">Min portefølje</TabsTrigger>
                  <TabsTrigger value="trade">Kjøp/Selg</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="leaderboard">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold">Topplister</h2>
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
                  <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
                    <TabsTrigger value="monthly">Denne måneden</TabsTrigger>
                    <TabsTrigger value="yearly">I år</TabsTrigger>
                    <TabsTrigger value="all_time">All-time</TabsTrigger>
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
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>

      {/* Mobil: fast navigasjonslinje i bunnen — de tre delene av
          konkurransen er alltid ett tommeltrykk unna. Skjult på desktop. */}
      {participant && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Konkurransenavigasjon"
        >
          <div className="grid grid-cols-3">
            {[
              { id: "leaderboard", label: "Toppliste", Ikon: Trophy },
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
