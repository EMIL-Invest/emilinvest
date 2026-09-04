import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FRIST } from "@/lib/opptak";

/**
 * Rekruttering — egen LYS seksjon kant til kant, rett under toppen mens
 * opptaket er åpent. Ingen boks: hvit flate med delelinjer skiller den
 * fra kremen rundt, og innholdet ligger redaksjonelt i to kolonner.
 *
 * Fristen ligger i src/lib/opptak.ts. Er opptaket over, kan hele
 * seksjonen fjernes fra Index.tsx uten at noe annet påvirkes.
 */
const RecruitmentSection = () => {
  return (
    <section id="rekruttering" className="bg-card border-y border-border">
      <div className="section-container py-14 md:py-16">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">
              Opptak
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Vi tar opp nye medlemmer
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              EMIL Invest utvider komiteen, og vi ser etter flere studenter som
              har lyst til å lære om investeringer og forvalte linjeforeningens
              midler sammen med oss. Du trenger ingen forkunnskaper — bare
              interesse og lyst til å bidra.
            </p>
          </div>

          <div className="lg:border-l lg:border-border lg:pl-14 space-y-6 lg:min-w-64">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">
                  Søknadsfrist
                </p>
                <p className="font-serif text-2xl text-foreground">{FRIST}</p>
              </div>
            </div>

            <Button asChild className="group">
              <Link to="/soknad">
                Slik søker du
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecruitmentSection;
