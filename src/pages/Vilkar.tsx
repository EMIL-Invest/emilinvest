import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { REGLER, HVORFOR_REGLER } from "@/lib/konkurranseregler";

/**
 * Vilkår for bruk - inkluderer ansvarsfraskrivelsen (ikke investeringsråd)
 * og reglene for aksjekonkurransen.
 */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-serif text-2xl text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </section>
);

const Vilkar = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-14 md:py-20 max-w-3xl">
          <p className="eyebrow mb-6">Vilkår</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Vilkår for bruk
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-8" />
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            Ved å bruke emilinvest.no og delta i aksjekonkurransen godtar du
            disse vilkårene. De er korte og skrevet for å leses. Reglene i
            konkurransen står først - resten er det formelle.
          </p>

          {/* Reglene øverst, punktvis. Folk som trykker «Les reglene» skal
              ikke måtte lete gjennom vilkårene for å finne dem. */}
          <section
            id="regler"
            className="rounded-md border border-border bg-card p-6 md:p-8 mb-14"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <p className="eyebrow mb-3">Kortversjonen</p>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
              Reglene i aksjekonkurransen
            </h2>

            <ul className="space-y-4">
              {REGLER.map((regel) => (
                <li key={regel.tittel} className="flex gap-3.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2.5"
                    style={{ background: "hsl(var(--competition))" }}
                  />
                  <span className="leading-relaxed">
                    <span className="text-foreground font-medium">{regel.tittel}.</span>{" "}
                    <span className="text-muted-foreground">{regel.tekst}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground leading-relaxed mt-7 pt-6 border-t border-border">
              {HVORFOR_REGLER}
            </p>

            <p className="text-sm text-muted-foreground mt-5">
              Reglene håndheves automatisk når du handler - et kjøp som bryter
              en av dem blir avvist med en forklaring.{" "}
              <Link to="/konkurranse" className="text-primary underline underline-offset-2">
                Til konkurransen
              </Link>
            </p>
          </section>

          <Section title="Om tjenesten">
            <p>
              emilinvest.no drives av EMIL Invest, den studentdrevne
              investeringskomiteen i EMIL - Energi- og miljøingeniørenes
              linjeforening ved NTNU. Nettsiden viser komiteens portefølje
              åpent og tilbyr en aksjekonkurranse for studenter. Tjenesten er
              gratis.
            </p>
          </Section>

          <Section title="Ikke investeringsråd">
            <p>
              Alt innhold på nettsiden - porteføljen vår, analyser, grafer og
              tall - er laget av studenter med pedagogisk formål og deles for
              åpenhet og læring. Ingenting her er investeringsrådgivning eller
              en anbefaling om å kjøpe eller selge verdipapirer. Historisk
              avkastning er ingen garanti for fremtidige resultater. Gjør
              alltid egne vurderinger, og invester aldri mer enn du har råd
              til å tape.
            </p>
          </Section>

          <Section title="Aksjekonkurransen">
            <p>
              Konkurransen foregår utelukkende med virtuelle penger. Du
              handler ikke ekte verdipapirer, har ingen reell risiko og kan
              ikke tape eller kreve utbetalt penger. Startkapitalen, kursene
              og porteføljen i konkurransen er en simulering basert på
              markedsdata fra Oslo Børs.
            </p>
            <p>
              Vi kan justere konkurranseregler, nullstille perioder (for
              eksempel månedlige og årlige rangeringer) og dele ut eventuelle
              premier etter eget skjønn. Forsøk på å utnytte tekniske feil,
              opprette flere kontoer eller manipulere kurser fører til
              utestengelse.
            </p>
          </Section>

          <Section title="Hva andre deltakere ser">
            <p>
              Ledertavlen er åpen for alle innloggede deltakere. De ser
              visningsnavnet du velger, porteføljeverdien, avkastningen din og
              hvilke aksjer du eier. De ser ikke e-postadressen din eller det
              fulle navnet ditt.
            </p>
            <p>
              Velg visningsnavn med det i tanke - du kan godt bruke et
              kallenavn. Se{" "}
              <Link to="/personvern" className="underline underline-offset-2 hover:text-foreground">
                personvernerklæringen
              </Link>{" "}
              for hva vi lagrer og hvorfor.
            </p>
          </Section>

          <Section title="Din konto">
            <p>
              Du er selv ansvarlig for å holde passordet ditt hemmelig. Velg
              et visningsnavn som ikke er støtende eller villedende - vi
              forbeholder oss retten til å endre eller fjerne upassende navn.
              Du kan når som helst slette kontoen din under «Min konto».
            </p>
          </Section>

          <Section title="Innhold og rettigheter">
            <p>
              Innholdet på nettsiden, inkludert logo, tekst og design,
              tilhører EMIL Invest. Du kan gjerne dele og sitere med
              kildehenvisning, men ikke utgi innholdet for å være ditt eget
              eller bruke det kommersielt uten avtale.
            </p>
          </Section>

          <Section title="Ansvar">
            <p>
              Nettsiden leveres «som den er». Vi tilstreber at kurser og tall
              er korrekte, men kan ikke garantere at informasjonen til enhver
              tid er feilfri eller tilgjengelig. EMIL Invest er ikke ansvarlig
              for beslutninger tatt på grunnlag av innhold på nettsiden.
            </p>
          </Section>

          <Section title="Endringer og kontakt">
            <p>
              Vi kan oppdatere vilkårene ved behov; vesentlige endringer
              varsles på nettsiden. Spørsmål? Ta kontakt på{" "}
              <a href="mailto:kontakt@emilinvest.no" className="text-primary underline underline-offset-2">
                kontakt@emilinvest.no
              </a>.
            </p>
            <p className="text-sm">Sist oppdatert: 13. august 2026</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Vilkar;
