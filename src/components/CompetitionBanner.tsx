import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CompetitionBanner = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <div className="section-container">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <CardContent className="p-8 md:p-12 relative">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left side - Content */}
              <div className="flex-1 text-center lg:text-left">
                <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
                  <Trophy className="w-3 h-3 mr-1" />
                  Aksjekonkurranse
                </Badge>
                
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                  Test dine investeringskunnskaper
                </h2>
                
                <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                  Bygg din egen portefølje med 100.000 kr i virtuell kapital og konkurrer mot andre 
                  medlemmer. Hvem klarer å oppnå høyest avkastning?
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Live markedsdata</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Månedlig, årlig & all-time ranking</span>
                  </div>
                </div>
                
                <Button asChild size="lg" className="group">
                  <Link to="/konkurranse">
                    Delta i konkurransen
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              
              {/* Right side - Visual */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {/* Podium illustration */}
                  <div className="flex items-end gap-2">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-secondary flex items-center justify-center mb-2">
                        <span className="text-2xl">🥈</span>
                      </div>
                      <div className="w-20 h-24 bg-gradient-to-t from-secondary/60 to-secondary/30 rounded-t-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-secondary-foreground">2</span>
                      </div>
                    </div>
                    
                    {/* 1st place */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2">
                        <span className="text-3xl">🥇</span>
                      </div>
                      <div className="w-24 h-32 bg-gradient-to-t from-primary/60 to-primary/30 rounded-t-lg flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary-foreground">1</span>
                      </div>
                    </div>
                    
                    {/* 3rd place */}
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-accent/50 border-2 border-accent flex items-center justify-center mb-2">
                        <span className="text-xl">🥉</span>
                      </div>
                      <div className="w-18 h-20 bg-gradient-to-t from-accent/60 to-accent/30 rounded-t-lg flex items-center justify-center" style={{ width: '72px' }}>
                        <span className="text-xl font-bold text-accent-foreground">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CompetitionBanner;
