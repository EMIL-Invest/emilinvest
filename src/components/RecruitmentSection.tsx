import { CalendarDays, Mail } from "lucide-react";

/**
 * Rekruttering — ligger rett under toppen på forsiden mens opptaket er åpent.
 *
 * Boksen står i profilfargen, så den skiller seg fra de lyse kortene
 * ellers på siden. Derfor er tekstfargene invertert (primary-foreground)
 * i stedet for de vanlige foreground/muted-tokenene.
 *
 * Fristen og e-postadressen står som konstanter under, så det er to
 * linjer å endre neste gang. Er opptaket over, kan hele seksjonen fjernes
 * fra Index.tsx uten at noe annet påvirkes.
 */
const FRIST = "6. september";
const EPOST = "kontakt@emilinvest.no";

const RecruitmentSection = () => {
  return (
    <section id="rekruttering" className="py-14 md:py-16">
      <div className="section-container">
        <div
          className="rounded-md bg-primary text-primary-foreground p-7 md:p-10"
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

            <div className="lg:w-80 lg:flex-shrink-0 lg:border-l lg:border-primary-foreground/20 lg:pl-10 space-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-primary-foreground/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60 mb-1">
                    Søknadsfrist
                  </p>
                  <p className="font-serif text-xl">{FRIST}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-foreground/60 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary-foreground/60 mb-1">
                    Slik søker du
                  </p>
                  <p className="text-sm text-primary-foreground/75 leading-relaxed">
                    Send en e-post til{" "}
                    <a
                      href={`mailto:${EPOST}?subject=Søknad%20til%20EMIL%20Invest`}
                      className="text-primary-foreground underline underline-offset-2 hover:decoration-2 break-words"
                    >
                      {EPOST}
                    </a>{" "}
                    med litt om deg selv, hvorfor du vil være med, og eventuelle
                    forkunnskaper.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecruitmentSection;
