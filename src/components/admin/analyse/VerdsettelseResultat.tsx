import type { VerdsettelseInputs, VerdsettelseResultater } from "@/lib/analyse/verdsettelse";
import { ANBEFALING_TEKST, beloep, prosent, sats, tall } from "@/lib/finans/konklusjon";
import { MULTIPPEL_NAVN } from "@/lib/finans/multipler";
import { Forklar, Nokkeltall, Retning, Seksjon } from "./felles";
import FotballBane from "./FotballBane";
import Sensitivitet from "./Sensitivitet";

/**
 * Resultatpanelet i ekspertvisningen - alle tall, i den rekkefølgen en
 * analytiker vil lese dem: konklusjon, fotballbane, WACC-kjeden, DCF-
 * tabellen, scenarioer og sensitivitet, utbytte og multipler.
 */
const VerdsettelseResultat = ({ inn, res }: { inn: VerdsettelseInputs; res: VerdsettelseResultater }) => {
  const v = inn.valuta;
  const s = res.samlet;
  const tone = s ? (s.anbefaling === "kjop" ? "god" : s.anbefaling === "selg" ? "daarlig" : "noytral") : "noytral";

  return (
    <div className="space-y-4">
      {/* Konklusjon */}
      <Seksjon tittel="Konklusjon" beskrivelse={s ? `${s.enighet.antall} av ${s.enighet.av} metoder peker samme vei.` : "Fyll inn minst én metode for å få en konklusjon."}>
        {s ? (
          <>
            <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">
              <Nokkeltall etikett="Vurdering" verdi={ANBEFALING_TEKST[s.anbefaling].tittel} tone={tone} />
              <Nokkeltall etikett="Samlet verdi per aksje" verdi={beloep(s.sentralverdi, v, 0)} under={`Kurs ${beloep(inn.aksjekurs, v, 2)}`} />
              <Nokkeltall etikett="Oppside" verdi={prosent(s.oppside)} tone={tone} />
              <Nokkeltall etikett="Sikkerhetsmargin" verdi={sats(s.sikkerhetsmargin)} under="(verdi − kurs) / verdi" />
            </div>
            <div className="mt-4">
              <FotballBane metoder={res.metoder} samlet={s} aksjekurs={inn.aksjekurs} valuta={v} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen gyldig metode ennå. Sjekk at kurs, antall aksjer og omsetning er fylt inn.</p>
        )}
      </Seksjon>

      {/* Kapitalkostnad */}
      <Seksjon
        tittel="Avkastningskrav (WACC)"
        beskrivelse="CAPM gir egenkapitalkravet; WACC vekter det mot gjeldskostnaden etter skatt med markedsverdier."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-3 text-sm">
          <Nokkeltall etikett="Beta brukt" verdi={tall(res.beta, 2)} under={inn.kapital.betaKilde} />
          <Nokkeltall etikett="Krav egenkapital" verdi={sats(res.wacc.rE)} under={`${sats(inn.kapital.risikofriRente)} + β × ${sats(inn.kapital.markedspremie)}`} />
          <Nokkeltall etikett="Gjeld etter skatt" verdi={sats(res.wacc.rDEtterSkatt)} under={`${sats(inn.kapital.gjeldskostnad)} × (1 − ${sats(inn.kapital.skattesats, 0)})`} />
          <Nokkeltall etikett="Vekter E / D" verdi={`${(res.wacc.vektE * 100).toFixed(0)} / ${(res.wacc.vektD * 100).toFixed(0)}`} under="markedsverdi" />
          <Nokkeltall etikett="WACC" verdi={sats(res.waccBrukt)} under={inn.kapital.waccManuell !== null ? "overstyrt manuelt" : "regnet ut"} stor />
        </div>
        {res.implisittWacc !== null && isFinite(res.implisittWacc) && (
          <p className="text-xs text-muted-foreground mt-3">
            Markedet priser inn en WACC på <span className="text-foreground font-medium">{sats(res.implisittWacc)}</span> med dine kontantstrømmer - er kravet ditt høyere enn det, sier du at aksjen er for dyr.
            <Forklar tekst="Den diskonteringsrenten som gjør at DCF-verdien treffer dagens kurs. Samme logikk som IRR." kap="kap. 7 og 9.3" />
          </p>
        )}
      </Seksjon>

      {/* DCF */}
      {inn.dcf.bruk && (
        <Seksjon tittel="Fri kontantstrøm (DCF)" beskrivelse={res.dcf?.feil ?? "FCF = EBIT × (1 − skatt) + avskrivninger − investeringer − Δ arbeidskapital. Beløp i millioner."}>
          {res.dcf && res.dcf.gyldig ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs tabular-nums">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-1.5 pr-2 font-normal">År</th>
                      {res.dcf.aar.map((a) => (
                        <th key={a.aar} className="text-right py-1.5 px-2 font-normal">{a.aar}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Omsetning", (a) => tall(a.omsetning)],
                        ["Vekst", (a) => sats(a.vekst)],
                        ["EBIT", (a) => tall(a.ebit)],
                        ["− Skatt", (a) => tall(-a.skatt)],
                        ["+ Avskrivninger", (a) => tall(a.avskrivning)],
                        ["− Investeringer", (a) => tall(-a.capex)],
                        ["− Δ Arbeidskapital", (a) => tall(-a.deltaNwc)],
                        ["= Fri kontantstrøm", (a) => tall(a.fcf)],
                        ["Nåverdi", (a) => tall(a.pv)],
                      ] as [string, (a: (typeof res.dcf.aar)[number]) => string][]
                    ).map(([navn, f]) => (
                      <tr key={navn} className={`border-b border-border/50 ${navn.startsWith("=") ? "font-medium" : ""}`}>
                        <td className="py-1.5 pr-2 whitespace-nowrap">{navn}</td>
                        {res.dcf!.aar.map((a) => (
                          <td key={a.aar} className="text-right py-1.5 px-2">{f(a)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Nokkeltall etikett="Sum nåverdi FCF" verdi={tall(res.dcf.sumPvFcf)} />
                <Nokkeltall etikett="Nåverdi terminalverdi" verdi={tall(res.dcf.pvTerminalverdi)} under={`${(res.dcf.terminalAndel * 100).toFixed(0)} % av EV`} />
                <Nokkeltall etikett="Enterprise value" verdi={tall(res.dcf.ev)} under={`− netto gjeld ${tall(inn.nettoGjeld)}`} />
                <Nokkeltall etikett="Verdi per aksje" verdi={beloep(res.dcf.verdiPerAksje, v, 1)} tone={res.dcf.oppside >= 0 ? "god" : "daarlig"} under={prosent(res.dcf.oppside)} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Implisitt EV/EBITDA i terminalåret: <span className="text-foreground">{tall(res.dcf.implisittEvEbitda, 1)}x</span>. Er den langt over peer-gruppen, er terminalveksten trolig for optimistisk.
                {res.dcf.terminalAndel > 0.8 && <span className="block mt-1 text-amber-700">Over 80 % av verdien ligger i terminalverdien - konklusjonen hviler nesten bare på WACC og evig vekst.</span>}
              </p>

              {res.scenarioer && (
                <div className="mt-5">
                  <h4 className="text-sm font-medium mb-2">Scenarioer</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {res.scenarioer.map((sc) => (
                      <Nokkeltall key={sc.navn} etikett={sc.navn} verdi={beloep(sc.verdiPerAksje, v, 0)} under={prosent(sc.oppside)} tone={sc.oppside >= 0 ? "god" : "daarlig"} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">Pessimistisk: vekst −3 pp, margin −2 pp, evig vekst −0,5 pp, WACC +1 pp. Optimistisk: motsatt.</p>
                </div>
              )}

              {res.sensitivitet && (
                <div className="mt-5">
                  <h4 className="text-sm font-medium mb-2">Sensitivitet: WACC × terminalvekst</h4>
                  <Sensitivitet data={res.sensitivitet} aksjekurs={inn.aksjekurs} valuta={v} senterWacc={res.waccBrukt} senterVekst={inn.dcf.terminalvekst} />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{res.dcf?.feil ?? "Fyll inn omsetning og antall aksjer."}</p>
          )}
        </Seksjon>
      )}

      {/* Utbytte */}
      {inn.utbytte.bruk && res.utbytte && (
        <Seksjon tittel="Utbyttemodell" beskrivelse="P₀ = Div₁ / (rₑ − g). Egner seg for selskaper med stabil utbetaling.">
          {res.utbytte.gyldig ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Nokkeltall etikett="Verdi per aksje" verdi={beloep(res.utbytte.verdiPerAksje, v, 1)} tone={res.utbytte.oppside >= 0 ? "god" : "daarlig"} under={prosent(res.utbytte.oppside)} />
              <Nokkeltall etikett="Krav rₑ" verdi={sats(res.wacc.rE)} />
              <Nokkeltall etikett="Vekst g" verdi={sats(inn.utbytte.vekst)} />
              {isFinite(res.utbytte.implisittKrav) && <Nokkeltall etikett="Markedets implisitte krav" verdi={sats(res.utbytte.implisittKrav)} under="Div₁/P₀ + g" />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{res.utbytte.feil}</p>
          )}
        </Seksjon>
      )}

      {/* Multipler */}
      {inn.multipler.bruk && res.multipler && (
        <Seksjon tittel="Multipler mot peers" beskrivelse="Peer-gruppens median brukes på selskapets tall. Kvartilene gir spennet.">
          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1.5 font-normal">Multippel</th>
                  <th className="text-right py-1.5 px-2 font-normal">Egen</th>
                  <th className="text-right py-1.5 px-2 font-normal">Peer-median</th>
                  <th className="text-right py-1.5 px-2 font-normal">Kvartiler</th>
                  <th className="text-right py-1.5 px-2 font-normal">Verdi/aksje</th>
                  <th className="text-right py-1.5 px-2 font-normal">Oppside</th>
                  <th className="text-right py-1.5 pl-2 font-normal">Teller</th>
                </tr>
              </thead>
              <tbody>
                {res.multipler.map((m) => (
                  <tr key={m.multippel} className="border-b border-border/50">
                    <td className="py-1.5">{MULTIPPEL_NAVN[m.multippel]}</td>
                    <td className="text-right py-1.5 px-2">{m.egen !== null ? `${tall(m.egen, 1)}x` : "-"}</td>
                    <td className="text-right py-1.5 px-2">{tall(m.median, 1)}x</td>
                    <td className="text-right py-1.5 px-2 text-muted-foreground">{tall(m.lav, 1)} - {tall(m.hoey, 1)}</td>
                    <td className="text-right py-1.5 px-2">{m.verdiPerAksje !== null ? beloep(m.verdiPerAksje, "", 1) : "-"}</td>
                    <td className="text-right py-1.5 px-2"><Retning v={m.oppside} /></td>
                    <td className="text-right py-1.5 pl-2">{inn.multipler.valgte.includes(m.multippel) ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {res.multipelSnitt !== null && (
            <p className="text-sm mt-3">
              Snitt av valgte multipler: <span className="font-medium">{beloep(res.multipelSnitt, v, 1)}</span> per aksje.
            </p>
          )}
        </Seksjon>
      )}
    </div>
  );
};

export default VerdsettelseResultat;
