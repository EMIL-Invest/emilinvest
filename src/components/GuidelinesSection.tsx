import {
  Leaf,
  PieChart,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const guidelines = [
  {
    icon: Leaf,
    title: "Bærekraftige investeringer",
    description:
      "Vi fokuserer på selskaper med sterke ESG-profiler som bidrar til bærekraftig utvikling og positiv miljøpåvirkning.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Clock,
    title: "Langsiktig horisont",
    description:
      "Vi investerer med langsiktig perspektiv og unngår kortsiktig spekulasjon. Tålmodighet og tid i markedet er nøkkelen.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Target,
    title: "Diversifisering",
    description:
      "Porteføljen er diversifisert på tvers av sektorer og geografier for å redusere risiko og sikre stabil avkastning.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: PieChart,
    title: "Månedlig evaluering",
    description:
      "Komiteen møtes månedlig for å evaluere porteføljen, diskutere markedsutviklingen og vurdere eventuelle justeringer.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

const GuidelinesSection = () => {
  return (
    <section id="guidelines" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Retningslinjer
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Våre investeringsprinsipper
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Disse prinsippene styrer alle våre investeringsbeslutninger og
            sikrer at vi investerer ansvarlig og bærekraftig.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guidelines.map((guideline, index) => (
            <Card
              key={index}
              className="glass-card group hover:shadow-elevated transition-all duration-300"
            >
              <CardContent className="pt-6">
                <div
                  className={`w-12 h-12 rounded-lg ${guideline.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <guideline.icon className={`w-6 h-6 ${guideline.color}`} />
                </div>
                <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
                  {guideline.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {guideline.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notice */}
        <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-foreground mb-1">
                Viktig merknad
              </h4>
              <p className="text-sm text-muted-foreground">
                Dette er en studentdrevet investeringskomité med pedagogisk
                formål. Alle investeringer innebærer risiko, og tidligere
                avkastning gir ingen garanti for fremtidige resultater. Vi
                oppfordrer alle til å gjøre egne undersøkelser før de tar
                investeringsbeslutninger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuidelinesSection;
