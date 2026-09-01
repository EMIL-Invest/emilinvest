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
import { Trophy, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, LogIn } from "lucide-react";
import LeaderboardTable from "@/components/competition/LeaderboardTable";
import PortfolioManager from "@/components/competition/PortfolioManager";
import StockTrader from "@/components/competition/StockTrader";
import { ReglerKnapp, PorteforljeStatus } from "@/components/competition/KonkurranseGuide";
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
      
      <main className="py-24">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-competition text-competition-foreground">
              <Trophy className="w-3 h-3 mr-1" />
              Aksjekonkurranse
            </Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Investeringskonkurranse
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bygg din virtuelle portefølje og konkurrer mot andre. Start med {STARTING_CAPITAL.toLocaleString('nb-NO')} kr
              og se hvem som oppnår høyest avkastning!
            </p>
            {/* Reglene skal være ett trykk unna fra forsiden av konkurransen */}
            <div className="mt-5">
              <ReglerKnapp />
            </div>
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

          {/* Participating - Show portfolio overview */}
          {participant && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
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
                  <TabsList>
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

      <Footer />
    </div>
  );
};

export default Competition;
