import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bot, Briefcase, GraduationCap, Heart, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FRIST, EPOST, MAILTO } from "@/lib/opptak";

/**
 * Søknadssiden — hit kommer man fra opptaksboksen på forsiden.
 *
 * Tonen er bevisst lav terskel: den som leser dette lurer på om hun er
 * «flink nok» til å søke, og svaret skal komme før alt annet. Frist og
 * e-postadresse hentes fra src/lib/opptak.ts, så de står likt her og på
 * forsiden.
 */

const PUNKTER = [
  {
    ikon: GraduationCap,
    tittel: "Du trenger ingen forkunnskaper",
    tekst:
      "Vi forventer ikke at du kan noe om aksjer fra før — de fleste av oss kunne lite da vi begynte. Har du likevel noe med deg, enten det er fag i finans, egen sparing eller bare at du følger markedet, er det hyggelig å høre om i e-posten. Men det er ingen forutsetning.",
  },
  {
    ikon: Heart,
    tittel: "Dette betyr mest for oss",
    tekst:
      "At du har lyst til å bidra, og at du er nysgjerrig på investeringer og finans. Det er alt. Resten lærer du hos oss, i et tempo der det er helt greit å spørre om ting du ikke skjønner.",
  },
  {
    ikon: Bot,
    tittel: "Du blir kurset i AI-verktøy",
    tekst:
      "Vi holder kurs i hvordan du bruker AI-verktøy til å jobbe raskere og bedre med aksjeanalyser og kvartalsrapporter. Det er ferdigheter du tar med deg videre, langt utenfor komiteen.",
  },
  {
    ikon: Briefcase,
    tittel: "Ekte penger og ekte erfaring",
    tekst:
      "Som medlem er du med på å forvalte linjeforeningens midler — du analyserer selskaper, pitcher ideer og er med på beslutningene. Det er lærerikt i seg selv, og det er erfaring næringslivet faktisk bryr seg om når du søker jobb eller sommerjobb.",
  },
];

const Soknad = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="section-container py-14 md:py-20 max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Til forsiden
          </Link>

          <p className="eyebrow mb-6">Opptak</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
            Slik søker du
          </h1>
          <div className="w-10 h-px bg-foreground/30 mb-8" />
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Hyggelig at du vurderer å søke! Her står alt du trenger å vite, og
            det er kortere enn du kanskje tror. Kort fortalt: har du lyst til å
            være med, er du kvalifisert.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-14">
            Søknadsfristen er <span className="text-foreground font-medium">{FRIST}</span>.
          </p>

          <div className="space-y-8 mb-14">
            {PUNKTER.map(({ ikon: Ikon, tittel, tekst }) => (
              <div key={tittel} className="flex gap-5">
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-primary"
                  aria-hidden="true"
                >
                  <Ikon className="w-5 h-5 text-primary-foreground" />
                </span>
                <div>
                  <h2 className="font-serif text-xl md:text-2xl text-foreground mb-2">
                    {tittel}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{tekst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Selve oppskriften — det siste man skal lese før man sender. */}
          <section
            className="rounded-md bg-primary text-primary-foreground p-7 md:p-10"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60 mb-4">
              Send søknaden
            </p>
            <h2 className="font-serif text-2xl md:text-3xl mb-5">
              Én e-post er alt som skal til
            </h2>
            <p className="text-primary-foreground/75 leading-relaxed mb-6">
              Skriv noen ord om hvem du er og hvilket studieprogram og trinn du
              går på, hvorfor du har lyst til å være med, og eventuelle
              forkunnskaper hvis du har noen. Noen få avsnitt er nok — du trenger
              verken CV, karakterutskrift eller en formell søknad.
            </p>

            <a
              href={MAILTO}
              className="inline-flex items-center gap-2.5 rounded-md bg-primary-foreground text-primary px-6 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Skriv til {EPOST}
              <ArrowRight className="w-4 h-4" />
            </a>

            <p className="text-sm text-primary-foreground/60 leading-relaxed mt-7 pt-6 border-t border-primary-foreground/20">
              Lurer du på noe før du søker? Send en e-post til samme adresse —
              vi svarer gjerne, og det er ingen spørsmål som er for små.
            </p>
          </section>

          <p className="text-sm text-muted-foreground leading-relaxed mt-10">
            Vil du se hva vi holder på med først? Ta en titt på{" "}
            <Link to="/portefolje" className="text-primary underline underline-offset-2">
              porteføljen
            </Link>{" "}
            eller prøv{" "}
            <Link to="/spill" className="text-primary underline underline-offset-2">
              spillene våre
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Soknad;
