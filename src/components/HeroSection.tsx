import { TrendingUp, Leaf, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const HeroSection = () => {
  const { holdings, quotes, loading, calculatePortfolioValue } = usePortfolioData();
  
  const portfolioValue = calculatePortfolioValue(holdings, quotes);

  const scrollToPortfolio = () => {
    const element = document.querySelector("#portfolio");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: "var(--gradient-hero)",
        }}
      />

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-8 animate-fade-up">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">
              Bærekraftige investeringer for fremtiden
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="gradient-text">EMIL Invest</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Vi er studenter ved energi og miljø NTNU som forvalter våre
            investeringer med fokus på bærekraft og langsiktig vekst.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              onClick={scrollToPortfolio}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Se vår portefølje
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
              onClick={() => document.querySelector("#team")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Users className="w-5 h-5 mr-2" />
              Møt teamet
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-border/50 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-primary">16</p>
              <p className="text-sm text-muted-foreground mt-1">Aktive medlemmer</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-primary">
                {loading ? "..." : `${portfolioValue.toLocaleString("no-NO", { maximumFractionDigits: 0 })} kr`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Porteføljeverdi</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-primary">2024</p>
              <p className="text-sm text-muted-foreground mt-1">Etablert</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
