import {
  PieChart,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const guidelines = [
  {
    icon: Target,
    title: "Kvalitetsinvesteringer",
    description:
      "Vi fokuserer på selskaper med sterke fundamentale verdier, solid ledelse og bærekraftig konkurransefortrinn.",
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
    title: "Evaluering annenhver uke",
    description:
      "Komiteen møtes annenhver uke for å evaluere porteføljen, diskutere markedsutviklingen og vurdere eventuelle justeringer.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

const GuidelinesSection = () => {
  return (
    <section id="guidelines" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <p className="eyebrow mb-5">Retningslinjer</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Våre investeringsprinsipper
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Disse prinsippene styrer alle våre investeringsbeslutninger og
            sikrer at vi investerer ansvarlig og langsiktig.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guidelines.map((guideline, index) => (
            <Card
              key={index}
              className="glass-card group transition-shadow duration-300 hover:shadow-[var(--shadow-card)]"
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center mb-4">
                  <guideline.icon className="w-5 h-5 text-foreground/70" />
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
        <div className="mt-12 p-6 rounded-md bg-card border border-border">
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
