import { CalendarDays, Mail } from "lucide-react";

/**
 * Rekruttering — ligger rett under toppen på forsiden mens opptaket er åpent.
 *
 * Fristen står ett sted (under), så det er én linje å endre neste gang.
 * Er opptaket over, kan hele seksjonen fjernes fra Index.tsx uten at noe
 * annet påvirkes.
 */
const FRIST = "6. september";
const EPOST = "kontakt@emilinvest.no";

const RecruitmentSection = () => {
  return (
    <section id="rekruttering" className="py-14 md:py-16">
      <div className="section-container">
        <div
          className="rounded-md border border-border bg-card p-7 md:p-10"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="flex-1">
              <p className="eyebrow mb-4">Opptak</p>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                Vi tar opp nye medlemmer
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                EMIL Invest utvider komiteen, og vi ser etter flere studenter som
                har lyst til å lære om investeringer og forvalte linjeforeningens
                midler sammen med oss. Du trenger ingen forkunnskaper — bare
                interesse og lyst til å bidra.
              </p>
            </div>

            <div className="lg:w-72 lg:flex-shrink-0 lg:border-l lg:border-border lg:pl-10 space-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-foreground/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">
                    Søknadsfrist
                  </p>
                  <p className="font-serif text-xl text-foreground">{FRIST}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-foreground/60 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">
                    Slik søker du
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Send en e-post til{" "}
                    <a
                      href={`mailto:${EPOST}?subject=Søknad%20til%20EMIL%20Invest`}
                      className="text-foreground underline underline-offset-2 hover:decoration-2 break-words"
                    >
                      {EPOST}
                    </a>{" "}
                    med litt om deg selv og hvorfor du vil være med.
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
