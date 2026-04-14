import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Leaf, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
const AboutSection = () => {
  return <section id="om-oss" className="py-24 bg-secondary/30">
       <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Om oss
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            En investeringskomité for{" "}
            <span className="gradient-text">studenter</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">EMIL Invest er en studentdrevet investeringskomité under energi- og miljøingeniørenes linjeforening - EMIL. Vi forvalter en reell aksjeportefølje med mål om å slå Oslo Børs over tid, samtidig som vi gir medlemmene praktisk erfaring med investeringer og finansmarkedene.</p>
        </div>

        {/* Info cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card group hover:shadow-elevated transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                Vårt mål
              </h3>
              <p className="text-sm text-muted-foreground">
                Slå Oslo Børs (OSEBX) over tid gjennom grundige analyser og langsiktige investeringer.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card group hover:shadow-elevated transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                Regelmessige møter
              </h3>
              <p className="text-sm text-muted-foreground">
                Vi møtes annenhver uke for å evaluere porteføljen, diskutere markedstrender og presentere analyser.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card group hover:shadow-elevated transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                Diversifisert portefølje
              </h3>
              <p className="text-sm text-muted-foreground">
                Vi søker en godt diversifisert portefølje med eksponering mot ulike sektorer og selskaper på Oslo Børs.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card group hover:shadow-elevated transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                Transparent portefølje
              </h3>
              <p className="text-sm text-muted-foreground">
                Alle studenter ved energi og miljø på NTNU kan til enhver tid følge med på hvordan det går med porteføljen – full åpenhet, ingen hemmeligheter.
              </p>
            </CardContent>
          </Card>
         </div>
       </div>
     </section>;
};
export default AboutSection;