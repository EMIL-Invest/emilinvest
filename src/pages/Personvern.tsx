import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Personvernerklæring - kravet følger av GDPR/personopplysningsloven siden
 * nettsiden lagrer brukerkontoer, konkurransedata og bilder av komiteen.
 */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-serif text-2xl text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </section>
);

const Personvern = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-14 md:py-20 max-w-3xl">
          <p className="eyebrow mb-6">Personvern</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Personvernerklæring
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-8" />
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            Denne erklæringen forklarer hvilke personopplysninger EMIL Invest
            samler inn på emilinvest.no, hvorfor vi gjør det, og hvilke
            rettigheter du har. Kort oppsummert: vi lagrer bare det som trengs
            for å drive nettsiden og aksjekonkurransen, vi sporer deg ikke, og
            vi deler aldri opplysningene dine videre.
          </p>

          <Section title="Hvem er behandlingsansvarlig?">
            <p>
              EMIL Invest, investeringskomiteen i EMIL - Energi- og
              miljøingeniørenes linjeforening ved NTNU - er ansvarlig for
              behandlingen av personopplysninger på dette nettstedet. Har du
              spørsmål, kontakt oss på{" "}
              <a href="mailto:kontakt@emilinvest.no" className="text-primary underline underline-offset-2">
                kontakt@emilinvest.no
              </a>.
            </p>
          </Section>

          <Section title="Hvilke opplysninger samler vi inn?">
            <p>
              <span className="text-foreground font-medium">Brukerkonto:</span>{" "}
              Når du oppretter en konto lagrer vi e-postadressen din, navnet du
              oppgir og et kryptert passord. Passordet kan aldri leses av oss.
            </p>
            <p>
              <span className="text-foreground font-medium">Aksjekonkurransen:</span>{" "}
              Deltar du i konkurransen lagrer vi visningsnavnet du velger, den
              virtuelle porteføljen din og hver enkelt handel du gjør, med
              tidspunkt, aksje, antall og kurs. Handelshistorikken trengs for å
              regne ut avkastningen din og for å kunne rette opp feil.
            </p>
            <p>
              <span className="text-foreground font-medium">Komitémedlemmer:</span>{" "}
              Navn, rolle og bilde av komiteens medlemmer vises på nettsiden
              med den enkeltes samtykke. Et medlem kan når som helst be om å
              bli fjernet.
            </p>
            <p>
              <span className="text-foreground font-medium">Teknisk:</span>{" "}
              Nettsiden bruker lokal lagring i nettleseren din kun for å holde
              deg innlogget. Vi bruker ingen sporingsinformasjonskapsler,
              annonser eller tredjeparts analyseverktøy.
            </p>
          </Section>

          <Section title="Hva andre deltakere kan se om deg">
            <p>
              Konkurransen har en åpen ledertavle. Er du påmeldt, kan andre
              innloggede deltakere se{" "}
              <span className="text-foreground">visningsnavnet ditt</span>,{" "}
              <span className="text-foreground">porteføljeverdien</span>,{" "}
              <span className="text-foreground">avkastningen din</span> og{" "}
              <span className="text-foreground">hvilke aksjer du eier</span> med
              antall og verdi. De kan ikke se e-postadressen din, det fulle
              navnet ditt eller noe annet fra kontoen.
            </p>
            <p>
              Dette er kjernen i konkurransen - poenget er å kunne sammenligne
              og lære av hverandres valg. Men det betyr at du bør velge
              visningsnavn med det i tanke. Du står fritt til å bruke et
              kallenavn i stedet for ditt eget navn, og du kan endre
              visningsnavnet under Konto.
            </p>
            <p>
              Melder du deg av konkurransen, eller sletter kontoen, forsvinner
              du fra ledertavlen.
            </p>
          </Section>

          <Section title="Hvorfor behandler vi opplysningene?">
            <p>
              Vi behandler kontoopplysninger og konkurransedata for å levere
              tjenesten du melder deg på (avtale, GDPR art. 6 nr. 1 b) - det
              omfatter at visningsnavn, avkastning og portefølje vises på
              ledertavlen, siden en konkurranse uten resultatliste ikke er en
              konkurranse. Bilder av komiteen behandles på grunnlag av samtykke
              (art. 6 nr. 1 a), og tekniske driftsdata ut fra vår berettigede
              interesse i å holde nettsiden sikker og stabil (art. 6 nr. 1 f).
              Opplysningene brukes aldri til markedsføring, og vi tar ingen
              automatiserte avgjørelser om deg.
            </p>
          </Section>

          <Section title="Hvor lagres opplysningene?">
            <p>
              Dataene lagres hos vår databehandler Supabase på servere i EU
              (Paris), og nettsiden driftes av Vercel. Begge behandler data på
              våre vegne etter databehandleravtale. Vi selger eller deler aldri
              personopplysninger med andre.
            </p>
          </Section>

          <Section title="Hvor lenge lagrer vi dem?">
            <p>
              Kontoen din, porteføljen og handelshistorikken lagres så lenge du
              har en aktiv konto. Sletter du kontoen under Konto, slettes
              opplysningene dine - også handlene og plasseringen på ledertavlen.
              Bilder og navn på komitémedlemmer fjernes når medlemmet trer ut
              av komiteen eller trekker samtykket.
            </p>
          </Section>

          <Section title="Dine rettigheter">
            <p>
              Du har rett til innsyn i hvilke opplysninger vi har om deg, og
              til å få dem rettet eller slettet. Kontoen kan du slette selv
              under «Min konto» når du er innlogget - da fjernes alt vi har
              lagret om deg. Du kan også kontakte oss på{" "}
              <a href="mailto:kontakt@emilinvest.no" className="text-primary underline underline-offset-2">
                kontakt@emilinvest.no
              </a>
              , så hjelper vi deg innen 30 dager.
            </p>
            <p>
              Mener du at vi behandler personopplysninger i strid med
              regelverket, har du rett til å klage til{" "}
              <a
                href="https://www.datatilsynet.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Datatilsynet
              </a>.
            </p>
          </Section>

          <Section title="Endringer">
            <p>
              Vi kan oppdatere denne erklæringen ved behov, for eksempel hvis
              nettsiden får ny funksjonalitet. Vesentlige endringer varsles på
              nettsiden.
            </p>
            <p className="text-sm">Sist oppdatert: 13. august 2026</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Personvern;
