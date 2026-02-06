import { useState } from "react";
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
import { Trophy, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, LogIn } from "lucide-react";
import LeaderboardTable from "@/components/competition/LeaderboardTable";
import PortfolioManager from "@/components/competition/PortfolioManager";
import StockTrader from "@/components/competition/StockTrader";

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
    STARTING_CAPITAL,
  } = useCompetition();

  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

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

  const portfolioValue = participant 
    ? calculatePortfolioValue(holdings, quotes) 
    : 0;

  const totalReturn = participant 
    ? ((portfolioValue - STARTING_CAPITAL) / STARTING_CAPITAL) * 100 
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
            <Badge variant="secondary" className="mb-4">
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
                  className="w-full"
                >
                  {isJoining ? "Melder på..." : "Meld meg på"}
                </Button>
              </CardContent>
            </Card>
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

          {/* Main content tabs */}
          <Tabs defaultValue="leaderboard" className="space-y-6">
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
                    />
                  </TabsContent>

                  <TabsContent value="yearly">
                    <LeaderboardTable 
                      entries={leaderboard.yearly} 
                      currentParticipantId={participant?.id}
                      periodLabel="i år"
                    />
                  </TabsContent>

                  <TabsContent value="all_time">
                    <LeaderboardTable 
                      entries={leaderboard.all_time} 
                      currentParticipantId={participant?.id}
                      periodLabel="totalt"
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
                    onBuy={buyStock}
                    onRefreshQuotes={fetchQuotes}
                    quotesLoading={quotesLoading}
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
