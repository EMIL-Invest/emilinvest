import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { FRIST } from "@/lib/opptak";

/**
 * Rekruttering — ligger rett under toppen på forsiden mens opptaket er åpent.
 *
 * Hele boksen er én lenke til /soknad, der det står hvordan man søker.
 * Derfor ligger ingen e-postlenke her: en <a> inni en <Link> er ugyldig
 * markup, og ett trykkmål er tydeligere enn to.
 *
 * Boksen står i profilfargen, så den skiller seg fra de lyse kortene
 * ellers på siden. Derfor er tekstfargene invertert (primary-foreground)
 * i stedet for de vanlige foreground/muted-tokenene.
 *
 * Fristen ligger i src/lib/opptak.ts. Er opptaket over, kan hele seksjonen
 * fjernes fra Index.tsx uten at noe annet påvirkes.
 */
const RecruitmentSection = () => {
  return (
    <section id="rekruttering" className="py-14 md:py-16">
      <div className="section-container">
        <Link
          to="/soknad"
          className="block rounded-md bg-primary text-primary-foreground p-7 md:p-10 group transition-shadow hover:shadow-lg"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 mb-4">
                Opptak
              </p>
              <h2 className="font-serif text-2xl md:text-3xl mb-3">
                Vi tar opp nye medlemmer
              </h2>
              <p className="text-primary-foreground/75 leading-relaxed max-w-2xl">
                EMIL Invest utvider komiteen, og vi ser etter flere studenter som
                har lyst til å lære om investeringer og forvalte linjeforeningens
                midler sammen med oss. Du trenger ingen forkunnskaper — bare
                interesse og lyst til å bidra.
              </p>
            </div>

            <div className="lg:w-72 lg:flex-shrink-0 lg:border-l lg:border-primary-foreground/20 lg:pl-10 space-y-6">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-primary-foreground/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60 mb-1">
                    Søknadsfrist
                  </p>
                  <p className="font-serif text-xl">{FRIST}</p>
                </div>
              </div>

              <p className="inline-flex items-center gap-2 font-medium">
                Slik søker du
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default RecruitmentSection;
