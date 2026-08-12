import { Shield, Users } from "lucide-react";

const philosophy = [
  {
    icon: Shield,
    title: "Risikostyrt forvaltning",
    text: "Vår strategi bygger på grundig analyse, diversifisering og kontinuerlig oppfølging.",
  },
  {
    icon: Users,
    title: "Åpenhet og fellesskap",
    text: "Vi deler våre vurderinger og resultater åpent med medlemmene i linjeforeningen.",
  },
];

const AboutSection = () => {
  return (
    <section id="om-oss" className="py-20 md:py-28">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Venstre: filosofien */}
          <div>
            <p className="eyebrow mb-6">Vår filosofi</p>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.15] text-foreground mb-8">
              Kunnskap.
              <br />
              Ansvar.
              <br />
              Langsiktig verdiskaping.
            </h2>
            <div className="w-10 h-px bg-foreground/30 mb-8" />
            <p className="text-muted-foreground leading-relaxed max-w-md">
              EMIL Invest er investeringskomiteen i linjeforeningen EMIL. Vi
              forvalter foreningens midler med mål om å skape langsiktig
              avkastning gjennom grundig analyse, risikostyring og åpenhet —
              og å slå Oslo Børs over tid.
            </p>
          </div>

          {/* Høyre: prinsippene som rolig liste.
              Rene tekstrader — ingen pil, ingen hover-effekt. Radene lenker
              ikke noe sted, så de skal heller ikke se klikkbare ut. */}
          <div
            className="rounded-md border border-border bg-card divide-y divide-border"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            {philosophy.map((item) => (
              <div key={item.title} className="flex items-center gap-5 p-6 md:p-7">
                <div className="w-12 h-12 rounded-full border border-foreground/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <h3 className="font-sans font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
