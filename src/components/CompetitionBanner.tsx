import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const facts = [
  { value: "100 000 kr", label: "Virtuell startkapital" },
  { value: "Live", label: "Markedsdata fra Oslo Børs" },
  { value: "3 lister", label: "Månedlig, årlig og all-time rangering" },
];

const CompetitionBanner = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="section-container">
        <div
          className="rounded-md border border-border bg-card overflow-hidden"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="grid lg:grid-cols-[1.5fr_1fr]">
            {/* Venstre: invitasjonen */}
            <div className="p-8 md:p-12">
              <p className="eyebrow mb-5">Aksjekonkurranse</p>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
                Test dine investeringskunnskaper
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-xl mb-8">
                Bygg din egen portefølje med 100 000 kr i virtuell kapital og
                konkurrer mot andre studenter. Hvem oppnår høyest avkastning?
              </p>
              <Button asChild size="lg" className="group px-7">
                <Link to="/konkurranse">
                  Delta i konkurransen
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Høyre: nøkkelfakta med tynne skillelinjer */}
            <div className="border-t lg:border-t-0 lg:border-l border-border bg-secondary/50 p-8 md:p-10 flex flex-col justify-center">
              {facts.map((fact, i) => (
                <div key={fact.label} className={i > 0 ? "pt-5 mt-5 border-t border-border" : ""}>
                  <p className="font-serif text-2xl md:text-3xl text-foreground leading-none mb-1">
                    {fact.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitionBanner;
