-- ============================================================
-- 12_aksjedata.sql — fyller aksjesidene med faktiske tall
-- Kjøres i Supabase SQL Editor (prosjekt nehqvobfwooyufxqbzpv).
-- Krever at 10_aksjeprofiler.sql er kjørt først.
--
-- Innhold: 10 selskaper med multipler, fire år og fire kvartaler hver,
-- kort beskrivelse og bransjeforklaring. Tallene er hentet fra
-- selskapenes egne kvartals- og årsrapporter i august 2026, med
-- kildehenvisning i feltet «kilde» som vises på siden.
--
-- Skriptet er trygt å kjøre flere ganger: alt bruker ON CONFLICT og
-- oppdaterer eksisterende rader i stedet for å lage duplikater.
--
-- Tickeren matches mot porteføljen, så profilene knyttes til den
-- skrivemåten som faktisk ligger i portfolio_holdings (MOWI eller
-- MOWI.OL). Selskaper dere ikke eier, får ingen rad.
--
-- MERK om beløp: alle regnskapstall er i MILLIONER av valutaen som
-- står på selskapet. Mowi og Subsea 7 rapporterer i EUR/USD, ikke NOK.
--
-- MERK om bank og forsikring: DNB og Protector har ikke omsetning og
-- EBITDA på samme måte som industriselskaper. Der er EBIT satt til
-- resultat før skatt, EBITDA og netto gjeld står tomme, og
-- egenkapitalandel viser CET1 (DNB) og solvensmargin (Protector).
-- ============================================================

-- ----------------------------------------------------------
-- Mowi ASA (MOWI) — EUR
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Mowi ASA', 'Sjømat', 'OSE', 'EUR', 'https://mowi.com/investors/', 'Mowi er verdens største oppdretter av atlantisk laks, med en integrert verdikjede fra rogn og settefisk via oppdrett i sjø til slakting og videreforedling. Selskapet har oppdrettsvirksomhet i Norge, Skottland, Chile, Canada, Irland, på Færøyene og Island, og selger laks i over 70 land.', 'Lakseoppdrett er en biologisk produksjonsprosess med lang syklus. Fra rogn til slakteklar fisk går det typisk to til tre år, hvorav rundt halvparten av tiden foregår i merder i sjøen. Produksjonen er regulert gjennom konsesjoner: i Norge setter myndighetene et tak på hvor mye levende fisk et selskap kan ha i sjøen til enhver tid, kalt maksimalt tillatt biomasse. Fordi nye konsesjoner deles ut sjelden og i begrenset omfang, kan ikke selskapene øke volumet fritt selv om etterspørselen og prisene er høye. Det gjør tilbudssiden treg og lite fleksibel på kort sikt.

Inntektene bestemmes i praksis av to størrelser: hvor mange kilo laks selskapet slakter, og hvilken pris det får per kilo. Laksepris settes i et globalt spotmarked og svinger mye, både gjennom året og mellom år, fordi tilbudet er tregt mens etterspørselen endres raskere. Deler av volumet selges på faste kontrakter for å dempe svingningene, resten til spotpris. På kostnadssiden er fôr klart største post og utgjør omtrent halvparten av kostnaden per kilo; fôret bygger på fiskemel, fiskeolje og vegetabilske råvarer, slik at råvarepriser slår rett inn i marginen. Videre kommer kostnader til smolt, lønn, behandling mot lakselus og sykdom, og siden 2023 en grunnrenteskatt på norsk havbruk som tar en andel av overskuddet fra sjøfasen.

Bransjen er konsentrert rundt et fåtall store, delvis integrerte aktører. Mowi er størst målt i volum, og de nærmeste konkurrentene er norske SalMar, Lerøy Seafood Group, Grieg Seafood og Cermaq, færøyske Bakkafrost, samt chilenske aktører som Multi X og AquaChile. Konkurransen handler mindre om pris til sluttkunde enn om kostnad per kilo og biologisk kontroll, siden laks i stor grad er en råvare der alle får omtrent samme markedspris. Selskapene skiller seg derfor først og fremst gjennom hvor effektivt de driver anleggene, hvor lave tap de har til sykdom og lus, og hvor mye av volumet de klarer å foredle til produkter med høyere margin.

Den største usikkerheten framover er kombinasjonen av biologi, regulering og pris. Perioder med kraftig volumvekst i bransjen presser lakseprisen ned, samtidig som sykdom, lakselus, alger og varmere sjøtemperaturer kan gi høy dødelighet og løfte kostnaden per kilo uten forvarsel. Regulatorisk risiko er reell: skattenivået på norsk havbruk har vært politisk omstridt, og tilgangen til nye konsesjoner avgjør hvor mye selskapene kan vokse. I tillegg kommer usikkerhet om handelsbetingelser og toll i viktige markeder, og om landbasert og havbasert oppdrett over tid vil tilføre betydelig nytt tilbud utenfor dagens konsesjonssystem.', 9.57::numeric, 11.4::numeric, 2.03::numeric, 1.62::numeric, 12.9::numeric, 10.9::numeric, 3.38::numeric, 14.4::numeric, 45.5::numeric, 2.9::numeric, '2026-08-11'::date, 'Q1 2026-rapport og Q2-oppdatering, kurs 11.08.2026'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('MOWI', 'MOWI.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 4940.8::numeric, 1179.4::numeric, 1053.8::numeric, 785.3::numeric, 3687.1::numeric, 1758.9::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 5505.7::numeric, 1221.0::numeric, 981.0::numeric, 439.5::numeric, 3754.7::numeric, 1790.3::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 5603.8::numeric, 1030.1::numeric, 758.6::numeric, 474.8::numeric, 4005.6::numeric, 1867.1::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 5720.2::numeric, 948.9::numeric, 960.5::numeric, 706.6::numeric, 4565.0::numeric, 2654.1::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2025'::text, '2025-06-30'::date, 1392.7::numeric, 241.8::numeric, 81.8::numeric, 41.5::numeric, 3787.5::numeric, 1895.8::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 1390.4::numeric, 165.2::numeric, 172.4::numeric, 108.9::numeric, 3824.1::numeric, 1759.8::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 1584.3::numeric, 273.3::numeric, 665.1::numeric, 538.7::numeric, 4565.0::numeric, 2654.1::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 1543.0::numeric, 279.9::numeric, 216.8::numeric, 151.4::numeric, 4719.9::numeric, 2737.8::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('MOWI', 'MOWI.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- DNB Bank ASA (DNB) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'DNB Bank ASA', 'Finans / Bank', 'OSE', 'NOK', 'https://www.dnb.no', 'DNB Bank ASA er Norges største finanskonsern og tilbyr utlån, sparing, betalingsløsninger, forsikring og investeringstjenester til privatkunder, bedrifter og offentlig sektor. Konsernet har i tillegg en internasjonal virksomhet rettet mot næringer som shipping, energi og sjømat.', 'En bank tjener først og fremst penger på forskjellen mellom renten den får på utlån og renten den betaler på innskudd og annen finansiering. Denne forskjellen kalles rentemarginen, og det den gir i kroner kalles netto renteinntekter. I DNB utgjorde netto renteinntekter 64,7 milliarder kroner av samlede inntekter på 90,6 milliarder i 2025, altså rundt 70 prosent. Resten kommer i hovedsak fra provisjoner og gebyrer: betalingsformidling, fondsforvaltning, forsikring, eiendomsmegling og rådgivning ved oppkjøp og børsnoteringer. Provisjonsinntektene svinger mindre med renten og gjør de samlede inntektene mer stabile over tid.

Rentenivået i økonomien slår derfor rett inn i inntektene. Når Norges Bank setter opp styringsrenten, stiger utlånsrentene normalt raskere enn innskuddsrentene, og marginen utvides; når renten faller, skjer det motsatte, fordi banken ikke kan sette innskuddsrenten stort lavere enn null. DNB merket dette i 2026: netto renteinntekter falt til 15,1 milliarder kroner i andre kvartal, ned om lag sju prosent fra samme kvartal året før, mens provisjonsinntekter og utlånsvekst holdt de totale inntektene nesten uendret. Samtidig er konkurransen om boliglånskunder hard, slik at bankene ofte må gi bort deler av marginen for å beholde volum.

Den største risikoen i bankdrift er at låntakere ikke betaler tilbake. Slike tap bokføres som nedskrivninger på utlån og går direkte på resultatet, uavhengig av hvor godt den løpende driften går. I gode tider er tapene små: DNB bokførte 338 millioner kroner i andre kvartal 2026, en brøkdel av kvartalsresultatet på 9,8 milliarder. I nedgangstider kan tapene mangedobles, særlig i sykliske næringer som shipping, olje, næringseiendom og bygg og anlegg. Derfor er soliditet sentralt: ren kjernekapitaldekning (CET1) viser hvor mye egenkapital banken har målt mot risikovektede utlån, og myndighetenes minstekrav avgjør i praksis hvor mye banken kan dele ut som utbytte og aksjetilbakekjøp.

I Norge konkurrerer DNB med Nordea, SpareBank 1-alliansen, Sparebanken Vest og Sparebanken Sør, Handelsbanken og Danske Bank, i tillegg til mindre digitale aktører og utenlandske kredittgivere som særlig presser prisene på boliglån. Den viktigste usikkerheten framover er hvor lavt rentenivået går og hvor stor del av rentenedgangen banken klarer å beholde som margin, siden dette avgjør den største inntektsposten. Ved siden av dette kommer utviklingen i norsk økonomi og boligmarkedet, som styrer tapsnivået, og endringer i regulatoriske kapitalkrav, som styrer hvor mye kapital banken kan betale ut. Fordi DNB er så stor og bredt eksponert, følger resultatet i praksis den norske økonomien tett.', 447.5::numeric, 11.17::numeric, 1.6::numeric, NULL::numeric, NULL::numeric, NULL::numeric, 5.84::numeric, 14.6::numeric, 17.4::numeric, NULL::numeric, '2026-08-07'::date, 'Q2 2026-rapport, kurs 07.08.2026. Bank: EBIT = resultat før skatt, egenkapitalandel = CET1'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('DNB', 'DNB.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 66133::numeric, NULL::numeric, 40579::numeric, 33438::numeric, 249840::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 81697::numeric, NULL::numeric, 50440::numeric, 39479::numeric, 269296::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 86537::numeric, NULL::numeric, 54878::numeric, 45804::numeric, 283325::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 90649::numeric, NULL::numeric, 53398::numeric, 43586::numeric, 295855::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 22691::numeric, NULL::numeric, 13347::numeric, 10684::numeric, 284050::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 23555::numeric, NULL::numeric, 13346::numeric, 11612::numeric, 295855::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 21793::numeric, NULL::numeric, 12711::numeric, 9860::numeric, 300875::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 22323::numeric, NULL::numeric, 13008::numeric, 9821::numeric, 279296::numeric, NULL::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('DNB', 'DNB.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Subsea 7 S.A. (SUBC) — USD
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Subsea 7 S.A.', 'Energi / Subsea', 'OSE', 'USD', 'https://www.subsea7.com', 'Subsea 7 er et internasjonalt entreprenørselskap som prosjekterer, bygger og installerer undervanns- og offshoreinfrastruktur for olje- og gassfelt og for havvindparker, med en flåte spesialfartøy og rundt 13 500 ansatte. Selskapet er i ferd med å fusjonere med italienske Saipem til det nye selskapet Saipem7.', 'Subsea 7 er en entreprenør i offshoreindustrien. Oljeselskapene og vindutbyggerne eier feltene, mens Subsea 7 blir hyret inn for å bygge og installere infrastrukturen under vann. Typiske oppdrag er å legge rørledninger og kabler, koble brønner på havbunnen til plattformer eller produksjonsskip, og installere fundamenter og kabler til havvindturbiner. Arbeidet utføres av spesialskip med tunge kraner, rørleggingsutstyr og fjernstyrte undervannsfarkoster, og et prosjekt løper ofte to til fire år fra kontrakten signeres til anlegget er i drift. Selskapet tjener altså ikke penger på å eie olje eller strøm, men på å utføre teknisk krevende byggearbeid for dem som gjør det.

Inntektene styres av hvor mye oljeselskapene velger å investere i nye undervannsfelt, og det henger tett sammen med oljeprisen og kundenes langsiktige planer. Siden det går lang tid fra en investeringsbeslutning til arbeidet faktisk utføres, kommer omsetningen med ett til tre års etterslep etter at markedet snur. På kostnadssiden er de største postene mannskap, drivstoff, innleide underleverandører og vedlikehold og kapitalkostnader på flåten. Et skip koster nesten det samme å ha i drift enten det er fullt utnyttet eller ikke, så marginen svinger kraftig med utnyttelsesgraden og med prisen selskapet får per skipsdøgn.

Ordrereserven, «backlog», er summen av signerte kontrakter som ennå ikke er utført, og var 13,6 milliarder dollar ved utgangen av juni 2026. En stor ordrereserve gir god sikt på framtidig omsetning, men sier lite om lønnsomheten, fordi mange kontrakter har fast pris: blir prosjektet dyrere enn forutsatt, må entreprenøren selv bære tapet. Subsea 7 opplevde nettopp dette i havvind, der kostnadssprekk på fastpriskontrakter bidro til at driftsresultatet falt til 105 millioner dollar i 2023 selv om omsetningen vokste. Ellers ligger risikoen i forsinkelser, dårlig vær, tvister om endringsordrer og at kunder kan skyve prosjekter ut i tid.

Konkurrentene er de andre store offshoreentreprenørene: Saipem, TechnipFMC, McDermott og Allseas innen olje og gass, og aktører som DEME, Van Oord og Cadeler innen havvind. Den største usikkerheten nå er ikke driften, men selskapsstrukturen: Subsea 7 og Saipem har avtalt å slå seg sammen til Saipem7 med hovedkontor i Milano, der Subsea 7-aksjonærene får 6,688 Saipem-aksjer per aksje. Amerikanske konkurransemyndigheter ga klarsignal i juli 2026, og selskapet melder at prosessen går som planlagt med ventet gjennomføring i andre halvår 2026 — blir den fullført, opphører SUBC som egen aksje på Oslo Børs. Utover dette er hovedspørsmålene om det høye investeringsnivået i undervannsfelt holder seg, og om kostnadsinflasjon spiser opp marginen i kontrakter som ble priset tidligere.', 10.26::numeric, 16.9::numeric, 2.34::numeric, 1.37::numeric, 5.79::numeric, 9.74::numeric, 3.95::numeric, 13.9::numeric, 53.2::numeric, -0.11::numeric, '2026-08-05'::date, 'Q2 2026-rapport, kurs 05.08.2026'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('SUBC', 'SUBC.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 5135.8::numeric, 559.4::numeric, 148.8::numeric, 36.4::numeric, 4450.7::numeric, -32.6::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 5973.7::numeric, 714.4::numeric, 104.7::numeric, 10.0::numeric, 4357.1::numeric, 552.3::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 6837::numeric, 1090::numeric, 446::numeric, 217::numeric, 4295::numeric, 602::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 7086::numeric, 1480::numeric, 771::numeric, 404::numeric, 4444.8::numeric, -21.0::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 1839.5::numeric, 407.2::numeric, 231.6::numeric, 108.8::numeric, 4286.3::numeric, 504.7::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 1962::numeric, 477::numeric, 276::numeric, 148::numeric, 4444.8::numeric, -21.0::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 1789.3::numeric, 384.7::numeric, 210.2::numeric, 97.3::numeric, 4514::numeric, -198.0::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 1927.4::numeric, 470.9::numeric, 316.5::numeric, 253.9::numeric, 4378.6::numeric, -190.1::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('SUBC', 'SUBC.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Aker BP ASA (AKERBP) — USD
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Aker BP ASA', 'Energi / Utbytte', 'OSE', 'USD', 'https://akerbp.com', 'Aker BP er et norsk børsnotert olje- og gasselskap som leter etter, bygger ut og produserer petroleum utelukkende på norsk kontinentalsokkel, med Johan Sverdrup, Alvheim, Skarv og Valhall blant hovedområdene. Selskapet er kontrollert av Aker ASA og bp, og betaler utbytte hvert kvartal.', 'Et olje- og gasselskap på norsk sokkel tjener penger ved å hente opp hydrokarboner fra felt under havbunnen og selge dem i et globalt marked til priser selskapet selv ikke kan påvirke. Inntekten er i praksis produsert volum multiplisert med markedspris, mens kostnadene deles i to deler: svært store investeringer i plattformer, brønner og rørledninger som betales mange år før første fat kommer opp, og løpende driftskostnader for å holde feltene i gang. Aker BP oppgir en produksjonskostnad på rundt 8 dollar per fat oljeekvivalent for 2026, som er lavt i internasjonal sammenligning. Fordi driftskostnaden per fat er lav, blir driftsmarginen høy i år med gode priser, men selskapet må stadig investere for å erstatte de fatene som produseres bort.

Olje- og gassprisen er den enkeltfaktoren som betyr mest for inntektene. Siden driftskostnadene er nokså faste på kort sikt, slår prisendringer nesten rett gjennom til driftsresultatet, slik at resultatet svinger langt mer i prosent enn prisen gjør. Gass prises i det europeiske markedet og påvirkes av vær, fyllingsgrad i lagrene og industriell etterspørsel, og har de siste årene svingt kraftigere enn olje. Selskapet selger både væsker og gass, så inntektsmiksen avhenger av hvilke felt som produserer mest til enhver tid.

Norsk petroleumsvirksomhet har et eget skatteregime som skiller sokkelselskapene fra vanlige børsselskaper. Overskudd fra sokkelvirksomhet beskattes med 22 prosent ordinær selskapsskatt pluss 56 prosent særskatt, altså 78 prosent marginalskatt, mens investeringer til gjengjeld kan utgiftsføres umiddelbart i særskattegrunnlaget slik at staten i praksis bærer størstedelen av investeringskostnaden. Det gjør at utbygginger som ellers ville vært marginale kan gjennomføres, men det betyr også at bare rundt en femtedel av overskuddet før skatt blir liggende igjen til aksjonærene. Effekten er godt synlig i regnskapet: i 2025 hadde Aker BP en EBITDA på 9 355 millioner dollar, men bare 132 millioner dollar i resultat etter skatt. En student bør derfor være klar over at P/E for et sokkelselskap kan svinge voldsomt fra år til år selv når kontantstrømmen er stabil.

Konkurrentene på norsk sokkel er først og fremst Equinor, som er mange ganger større, i tillegg til Vår Energi, DNO, OKEA og internasjonale selskaper som Shell, TotalEnergies og ConocoPhillips. Siden olje selges til én global pris, konkurrerer disse selskapene mindre om kunder og mer om lisenser, riggkapasitet, leverandørkapasitet og erfarne ingeniører. Den største usikkerheten framover er prisen på olje og gass, som avhenger av global økonomisk vekst, produksjonspolitikken til OPEC+ og hvor raskt elektrifisering av transport demper etterspørselen. I tillegg kommer risiko for kostnadsoverskridelser i de store utbyggingsprosjektene, politisk risiko knyttet til endringer i petroleumsskatten, og at selskapet har økt netto rentebærende gjeld kraftig gjennom en investeringstung periode.', 22.7::numeric, 16.0::numeric, 1.94::numeric, 1.91::numeric, 2.87::numeric, 4.37::numeric, 7.4::numeric, 12.3::numeric, 24::numeric, 0.67::numeric, '2026-08-12'::date, 'Q2 2026-rapport, kurs 12.08.2026. Q1 2026 har reversert nedskrivning på Valhall som løfter EBIT'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('AKERBP', 'AKERBP.OL', 'AKRBP', 'AKRBP.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 13010::numeric, 11782::numeric, 8964::numeric, 1603::numeric, 12428::numeric, 2658::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 13669.9::numeric, 12285.7::numeric, 8989.4::numeric, 1335.7::numeric, 12362::numeric, 3114.0::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 12379.4::numeric, 11083.0::numeric, 8263.6::numeric, 1827.7::numeric, 12691.1::numeric, 3929.0::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 10943.1::numeric, 9355.3::numeric, 4759.9::numeric, 132.3::numeric, 11226.0::numeric, 7094.0::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 2598.5::numeric, 2262.1::numeric, 1474.9::numeric, 285.5::numeric, 11738.3::numeric, 6070.6::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 2559.8::numeric, 2069.2::numeric, 448.6::numeric, -145.3::numeric, 11226.0::numeric, 7094.0::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 3025.9::numeric, 2661.6::numeric, 2653.3::numeric, 757.8::numeric, 11566.4::numeric, 7626.3::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 3682.5::numeric, 3350.9::numeric, 2205.3::numeric, 521.0::numeric, 11669.7::numeric, 6937.7::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('AKERBP', 'AKERBP.OL', 'AKRBP', 'AKRBP.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Protector Forsikring ASA (PROT) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Protector Forsikring ASA', 'Forsikring', 'OSE', 'NOK', 'https://www.protectorforsikring.no/', 'Protector Forsikring er et norsk skadeforsikringsselskap som forsikrer store og mellomstore bedrifter, borettslag og offentlig sektor i Norge, Sverige, Danmark, Finland, Storbritannia og Frankrike. Nesten alt salg skjer gjennom uavhengige forsikringsmeglere.', 'Et skadeforsikringsselskap tar inn premier fra kundene på forhånd og betaler ut erstatninger når skader inntreffer i etterkant. Forskjellen mellom premiene selskapet tjener opp i en periode og summen av erstatninger og driftskostnader er forsikringsresultatet, og det måles med combined ratio: skadeprosent pluss kostnadsprosent. En combined ratio under 100 prosent betyr at selve forsikringsvirksomheten tjener penger, mens over 100 prosent betyr at den taper penger. I tillegg tjener selskapet penger på å forvalte premiene i tiden fra de kommer inn til skadene er betalt ut, en pengebeholdning som kalles float og som plasseres i rentepapirer og noe aksjer.

Lønnsomhet i skadeforsikring handler om tre ting samtidig: å velge og prise risiko riktig, å holde egne kostnader lave, og å få akseptabel avkastning på investeringene. Riktig prising krever gode data og disiplin, fordi den endelige kostnaden for en forsikring først er kjent år etter at premien er betalt, og selskapet må sette av reserver til framtidige erstatninger underveis. Skadeinflasjon, altså at reparasjoner, byggevarer, helsetjenester og personskadeerstatninger blir dyrere, kan gjøre at reservene viser seg for lave. Protector har forbedret combined ratio fra 89,4 prosent i 2022 til 84,7 prosent i 2025 og 83,2 prosent i første halvår 2026, mot et eget mål om under 91 prosent. Resultatene svinger likevel mye fra kvartal til kvartal fordi finansavkastningen varierer.

Protectors forretningsmodell skiller seg fra de store nordiske konkurrentene først og fremst på distribusjonen. Der Gjensidige, If, Tryg og Fremtind i stor grad selger direkte til privatkunder og bedrifter gjennom egne salgsapparat, banker og nettsider, selger Protector nesten bare gjennom uavhengige forsikringsmeglere til bedrifter og offentlig sektor. Det betyr få, men store kontrakter, ofte tildelt gjennom offentlige anbud med forutsigbare fornyelsesdatoer, og det gir en svært lav kostnadsprosent fordi selskapet ikke trenger et stort eget salgs- og filialnett. Til gjengjeld er selskapet avhengig av at meglerne velger å legge oppdrag hos dem, kundene sammenligner pris mer aktivt enn privatkunder gjør, og enkeltkontrakter kan bety mye for veksten.

Den største usikkerheten framover ligger i om prisingen holder mål når konkurransen om anbudene hardner, og i om erstatningskostnadene utvikler seg som forutsatt. Selskapet har selv pekt på svakere lønnsomhet i motorsegmentet, og premieveksten målt i kroner var negativ i andre kvartal 2026 fordi valutakursene trakk ned. Samtidig gjør størrelsen på investeringsporteføljen at renter og aksjemarkeder påvirker resultatet betydelig fra kvartal til kvartal, uavhengig av hvor god selve forsikringsdriften er. Vekst i nye markeder som Frankrike gir muligheter men også risiko for å prise ukjent risiko feil i en oppstartsfase. Soliditeten er god, med en solvenskapitaldekning på 221 prosent ved utgangen av andre kvartal 2026, godt over selskapets eget minstemål på 150 prosent.', 39.6::numeric, 19.0::numeric, 5.3::numeric, 2.7::numeric, NULL::numeric, NULL::numeric, 4.2::numeric, 26.5::numeric, 221::numeric, NULL::numeric, '2026-08-12'::date, 'Q2 2026-rapport, kurs 12.08.2026. Forsikring: EBIT = resultat før skatt, egenkapitalandel = solvensmargin'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('PROT', 'PROT.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 6619::numeric, NULL::numeric, 1711::numeric, 1379::numeric, 3762::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 9386::numeric, NULL::numeric, 1933::numeric, 1509::numeric, 4529::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 11783::numeric, NULL::numeric, 2086::numeric, 1573::numeric, 5787::numeric, NULL::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 13756::numeric, NULL::numeric, 3438::numeric, 2646::numeric, 7674::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 3529::numeric, NULL::numeric, 632::numeric, 459::numeric, 6873::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 3560::numeric, NULL::numeric, 897::numeric, 705::numeric, 7674::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 3696::numeric, NULL::numeric, 291::numeric, 165::numeric, 7314::numeric, NULL::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 3698::numeric, NULL::numeric, 990::numeric, 755::numeric, 7408::numeric, NULL::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('PROT', 'PROT.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Sats ASA (SATS) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Sats ASA', 'Forbruk / Trening', 'OSE', 'NOK', 'https://satsgroup.com/', 'SATS ASA er Nordens største treningssenterkjede, med om lag 769 000 medlemmer og 272 sentre i Norge, Sverige, Finland og Danmark. Selskapet driver merkevarene SATS, ELIXIA, Fresh Fitness, SATS Yoga og SATS Online, og henter hovedtyngden av inntektene fra løpende månedlige medlemsavgifter.', 'En treningssenterkjede tjener penger på noe som i utgangspunktet er enkelt: et månedlig beløp fra hvert medlem. Inntekten kan derfor deles i to størrelser som er verdt å følge hver for seg, nemlig hvor mange medlemmer kjeden har, og hvor mye hvert medlem betaler i snitt per måned. Det siste kalles ofte ARPM, og for SATS lå den på 649 kroner per måned i første kvartal 2026, fire prosent høyere enn året før. Vekst kan altså komme fra flere medlemmer, fra prisøkninger, eller fra at medlemmene kjøper tillegg som personlig trener og gruppetimer. Motstykket er frafall, som i bransjen kalles churn: en betydelig andel av medlemmene sier opp i løpet av et år, og kjeden må derfor selge et stort antall nye medlemskap hvert år bare for å holde medlemstallet uendret.

Kostnadssiden domineres av utgifter som ligger nokså fast uansett hvor mange som faktisk møter opp. Lokalleie løper hver måned enten senteret er fullt eller halvtomt, og det samme gjør grunnbemanning, strøm, vedlikehold og avskrivninger på treningsutstyr. Dette gir det som kalles operasjonell giring: når inntekten per senter stiger, faller nesten hele økningen ned på bunnlinjen, fordi kostnadene ikke øker i takt. Den samme mekanikken virker like sterkt i motsatt retning. Nedstengningene under pandemien er en tydelig illustrasjon: SATS gikk fra 246 millioner kroner i underskudd i 2022 til 474 millioner kroner i overskudd i 2025, mens omsetningen i samme periode bare steg fra 4 082 til 5 509 millioner kroner. En viktig detalj for den som leser regnskapet er at leiekontrakter etter regnskapsstandarden IFRS 16 føres som gjeld i balansen og som avskrivning og rentekostnad i resultatet, ikke som husleie. EBITDA blir derfor kunstig høy hvis man ikke er oppmerksom på dette.

Året har et tydelig mønster for treningssentre. Januar og februar er den klart sterkeste salgsperioden, fordi nyttårsforsetter gir en topp i antall nye medlemskap, og de første månedene i året legger dermed mye av grunnlaget for hele årets medlemstall. Sommeren er svakest, ettersom folk er på ferie, trener utendørs og i større grad sier opp eller setter medlemskapet på pause. Dette synes i tallene: tredje kvartal 2025 hadde 1 293 millioner kroner i omsetning mot 1 483 millioner i første kvartal 2026. Kvartalene kan derfor ikke sammenlignes rett mot forrige kvartal, men bør sammenlignes med samme kvartal året før.

Konkurransen kommer fra flere retninger samtidig. I den ene enden står lavpriskjeder som EVO Fitness og Fitness24Seven med lite bemanning, enklere lokaler og priser godt under halvparten av et fullservicemedlemskap, og de presser hvor høyt en fullservicekjede kan sette prisen. I den andre enden vokser mindre, spesialiserte studioer innen styrkeløft, yoga, klatring og gruppetimer, som tar de mest engasjerte kundene. SATS møter dette ved å drive i flere prisklasser selv, blant annet gjennom lavpriskonseptet Fresh Fitness. Den største usikkerheten framover er om medlemmene tåler videre prisøkninger uten at flere sier opp, siden mye av resultatveksten de siste årene har kommet fra økt inntekt per medlem snarere enn kraftig medlemsvekst. I tillegg kommer at treningsmedlemskap er en utgift mange kutter når privatøkonomien strammer seg til, og at de faste leiekontraktene gjør det vanskelig å redusere kostnadene raskt hvis inntektene faller.', 7.94::numeric, 16.73::numeric, 5.9::numeric, 1.42::numeric, 6.46::numeric, 15.04::numeric, 3.28::numeric, 36.15::numeric, 14.8::numeric, 2.76::numeric, '2026-08-13'::date, 'Q1 2026-rapport, kurs 13.08.2026. EBITDA og netto gjeld inkluderer IFRS 16-leieforpliktelser'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('SATS', 'SATS.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 4082::numeric, 1140::numeric, 20::numeric, -246::numeric, 860::numeric, 6160::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 4734::numeric, 1784::numeric, 607::numeric, 224::numeric, 1020::numeric, 6377::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 5064::numeric, 1942::numeric, 744::numeric, 326::numeric, 1345::numeric, 6119::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 5509::numeric, 2109::numeric, 892::numeric, 474::numeric, 1454::numeric, 6144::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2025'::text, '2025-06-30'::date, 1393::numeric, 580::numeric, 274::numeric, 162::numeric, 1501::numeric, 6219::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 1293::numeric, 502::numeric, 198::numeric, 98::numeric, 1436::numeric, 6174::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 1428::numeric, 534::numeric, 228::numeric, 121::numeric, 1454::numeric, 6144::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 1483::numeric, 526::numeric, 220::numeric, 106::numeric, 1345::numeric, 5905::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('SATS', 'SATS.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Orkla ASA (ORK) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Orkla ASA', 'Forbruk / Konglomerat', 'OSE', 'NOK', 'https://www.orkla.com', 'Orkla ASA er et norsk industrielt investeringsselskap som eier og utvikler merkevarer innen mat, snacks, helse, hjem og personlig pleie, matingredienser og maleverktøy, i hovedsak i Norden, Baltikum, Sentral-Europa og India. Konsernet er delt i rundt ti selvstendige porteføljeselskaper og eier i tillegg 42,7 prosent av malingsprodusenten Jotun.', 'Orkla tjener penger på å eie og utvikle merkevarer som selges gjennom dagligvarebutikker, apotek, netthandel og til storhusholdning. Inntekten er volum ganget med pris, mens lønnsomheten avgjøres av hva selskapet betaler for råvarer, emballasje, lønn, frakt og markedsføring. Etterspørselen er relativt stabil fordi folk kjøper mat, snacks, kosttilskudd og rengjøringsmidler også i dårlige tider, men marginene er sjelden høye — Orkla ligger rundt 10 prosent driftsmargin. Fordelen ligger i skala: samme fabrikker, samme innkjøp og samme distribusjonsnett kan brukes på mange merker, og et sterkt merke gir litt bedre pris enn butikkenes egne varer.

Orkla er bevisst satt opp som et investeringsselskap framfor ett integrert konsern. Konsernet består av rundt ti porteføljeselskaper — blant annet Orkla Foods, Orkla Snacks, Orkla Home & Personal Care, Orkla Health, Orkla Food Ingredients, Orkla House Care og Orkla India — som hver har eget styre, egen ledelse og egne resultatmål. Poenget er at hver enhet skal måles og utvikles for seg, og at Orkla kan kjøpe, fusjonere eller selge enheter uten å rive opp resten av konsernet. Ved siden av de konsoliderte selskapene eier Orkla 42,7 prosent av Jotun, som ikke inngår i omsetningen men bidrar til resultatet som resultatandel fra tilknyttet selskap — en betydelig verdi som ikke synes i driftsinntektene. De siste årene har Orkla ryddet aktivt: vannkraftporteføljen ble solgt for 6,1 milliarder kroner i 2025, og Orkla India ble børsnotert i India høsten 2025.

Marginen svinger først og fremst med råvarepriser og med forhandlingene mot dagligvarekjedene. Kakao, kaffe, korn, meieri, fett, sukker og emballasje kan endre seg raskt, og et merkevareselskap kan ikke sende kostnadsøkningen videre umiddelbart, fordi prisene mot kjedene i praksis settes i faste runder — i Norge 1. februar og 1. juli. Det gir et etterslep der marginen faller når råvarene stiger, og henter seg inn igjen når de faller eller når prisøkningene er gjennomført. I Norden er kjøpermakten dessuten svært konsentrert: noen få kjeder kontrollerer nesten hele dagligvaresalget, og de har egne merkevarer som presser prisene ovenfra. Utfallet av én forhandlingsrunde kan derfor betyr mer for et kvartalsresultat enn den underliggende etterspørselen.

Konkurrentene er dels globale merkevarehus som Nestlé, Unilever, Mondelez, Danone og Reckitt, dels nordiske og regionale aktører som Lantmännen, Fazer, Cloetta, Mills og Nortura, og dels kjedenes egne merkevarer. Den største usikkerheten framover er kombinasjonen av svak volumvekst og press på forbrukernes kjøpekraft: veksten de siste årene har i stor grad kommet fra prisøkninger og oppkjøp, ikke fra at folk kjøper flere enheter. I tillegg er Orkla i praksis en sum av deler, der Jotun og Orkla India utgjør en stor del av verdien — leverer disse svakere, eller priser markedet konglomeratstrukturen med rabatt, slår det direkte på kursen. Til sist gjør oppkjøpsstrategien at balansen og kontantstrømmen må vurderes sammen med driften, siden en god del av veksten er kjøpt og ikke organisk.', 103::numeric, 16.2::numeric, 2.15::numeric, 1.44::numeric, 11.3::numeric, 16.6::numeric, 5.7::numeric, 13.3::numeric, 56.8::numeric, 1.3::numeric, '2026-08-12'::date, 'Q1 2026-rapport, kurs 12.08.2026. 2025-tall er uten solgt vannkraft'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('ORK', 'ORK.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 58391::numeric, 9668::numeric, 6897::numeric, 5268::numeric, 43156::numeric, 17188::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 67797::numeric, 9578::numeric, 6234::numeric, 5421::numeric, 46748::numeric, 18847::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 70656::numeric, 10744::numeric, 7351::numeric, 6399::numeric, 51372::numeric, 15992::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 71547::numeric, 10379::numeric, 7086::numeric, 12057::numeric, 52147::numeric, 14167::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2025'::text, '2025-06-30'::date, 17650::numeric, 2549::numeric, 1872::numeric, 6367::numeric, 47731::numeric, 19775::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 17946::numeric, 2715::numeric, 1638::numeric, 1692::numeric, 49056::numeric, 17650::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 18775::numeric, 2701::numeric, 1826::numeric, 2091::numeric, 52147::numeric, 14167::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 17401::numeric, 2398::numeric, 1691::numeric, 1776::numeric, 51042::numeric, 13565::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('ORK', 'ORK.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Norsk Hydro ASA (NHY) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Norsk Hydro ASA', 'Industri / Aluminium', 'OSE', 'NOK', 'https://www.hydro.com', 'Norsk Hydro er et norsk industrikonsern og en av verdens største aluminiumprodusenter, med virksomhet i hele verdikjeden fra bauksittgruver og aluminaraffinering til elektrolyseverk, ekstruderte og valsede produkter, resirkulering og egen vannkraft. Den norske staten er største eier.', 'Aluminium er en råvare, og et selskap som Hydro tjener i praksis penger på forskjellen mellom det metallet selges for og det det koster å lage. Salgsprisen bestemmes i stor grad av verdensmarkedsprisen på London Metal Exchange (LME), en børs der standardiserte aluminiumkontrakter handles, og som fungerer som referansepris for hele bransjen. Oppå LME-prisen kommer såkalte premier: et påslag kunden betaler for å få metallet levert på et bestemt sted, i en bestemt form og med en bestemt legering. Premiene svinger uavhengig av LME-prisen og kan utgjøre en betydelig del av inntekten, særlig for videreforedlede produkter. Fordi selskapet i liten grad kan påvirke prisen det får, blir kostnadskontroll og evnen til å selge produkter med høyere påslag den viktigste måten å skille seg fra konkurrentene på.

Å skille aluminium fra oksygen krever elektrolyse, og elektrolyse krever svært mye strøm. Et moderne aluminiumverk bruker i størrelsesorden 13 til 15 kilowattimer strøm per kilo metall, og kraft utgjør derfor ofte anslagsvis en tredjedel av produksjonskostnaden. Det betyr at kraftpris og kraftkontrakter er nesten like avgjørende for lønnsomheten som metallprisen selv, og at verk plasseres der kraften er billig og forutsigbar, historisk Norge, Island, Canada, Midtøsten og Kina. Hydro har langsiktige kraftavtaler og egen vannkraftproduksjon i Norge, noe som demper svingningene, men når avtaler løper ut må de fornyes til nye priser. Høye europeiske kraftpriser rammer europeiske produsenter hardere enn konkurrenter i regioner med billig kraft.

Verdikjeden starter med bauksitt, en jordart som brytes i dagbrudd i land som Australia, Guinea, Brasil og Indonesia. Bauksitten raffineres til alumina, altså aluminiumoksid, og grovt regnet går det fire tonn bauksitt til to tonn alumina til ett tonn aluminium. Alumina omsettes til sine egne priser, som kan bevege seg helt annerledes enn LME-prisen, og i perioder med knapphet har aluminaprisen skutt i været og flyttet mye av bransjens inntjening oppstrøms. Et selskap som eier hele kjeden fra gruve til metall er derfor mindre utsatt for at innkjøpsprisen på alumina plutselig stiger, men til gjengjeld mer utsatt for driftsproblemer, miljøkrav og politisk risiko i landene der gruvene og raffineriene ligger.

Aluminiumproduksjon gir store klimagassutslipp, både fra kraften som brukes og fra selve elektrolyseprosessen, og i Europa må produsenter kjøpe klimakvoter gjennom EUs kvotesystem. Kvoteprisen er dermed en reell kostnad for europeiske verk, samtidig som EUs grensejusteringsmekanisme CBAM skal legge en tilsvarende kostnad på importert metall. Resirkulert aluminium krever bare en brøkdel av energien som primærproduksjon, har tilsvarende lavere utslipp og oppnår ofte en prispremie fra kunder med klimakrav, og skrapbasert produksjon er derfor et voksende og mindre kraftavhengig forretningsområde. Konkurrentene er dels store integrerte vestlige og midtøstlige selskaper som Alcoa, Rio Tinto og Emirates Global Aluminium, dels og i økende grad kinesiske produsenter som Chalco og Hongqiao, som samlet står for godt over halvparten av verdens produksjon. Den største usikkerheten framover er kombinasjonen av kinesisk kapasitet og handelspolitikk, kraftprisene i Europa, og hvor mye kundene faktisk er villige til å betale ekstra for lavutslippsaluminium.', 176.0::numeric, 18.03::numeric, 1.7::numeric, 0.84::numeric, 6.86::numeric, 10.71::numeric, 3.35::numeric, 9.6::numeric, 53.3::numeric, 0.56::numeric, '2026-08-12'::date, 'Q2 2026-rapport, kurs 12.08.2026. EBITDA og EBIT er Hydros justerte tall'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('NHY', 'NHY.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 213672::numeric, 39664::numeric, 31179::numeric, 24417::numeric, 107798::numeric, -1310::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 198263::numeric, 22258::numeric, 12983::numeric, 2804::numeric, 107182::numeric, 8191::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 208663::numeric, 26318::numeric, 16284::numeric, 5040::numeric, 107452::numeric, 15976::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 213281::numeric, 28889::numeric, 18663::numeric, 8304::numeric, 107096::numeric, 9669::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 51993::numeric, 5996::numeric, 3510::numeric, 2149::numeric, 109054::numeric, 13590::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 48862::numeric, 5587::numeric, 2853::numeric, -2156::numeric, 107096::numeric, 9669::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 51776::numeric, 8668::numeric, 6075::numeric, 4341::numeric, 110005::numeric, 12860::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 57458::numeric, 8923::numeric, 6253::numeric, 5965::numeric, 111770::numeric, 16283::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('NHY', 'NHY.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Telenor ASA (TEL) — NOK
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Telenor ASA', 'Telekom', 'OSE', 'NOK', 'https://www.telenor.com', 'Telenor er Norges største telekomselskap og tilbyr mobil, bredbånd og TV i Norge, Sverige, Danmark og Finland, i tillegg til heleid mobilvirksomhet i Bangladesh gjennom Grameenphone. Selskapet er deleid av den norske staten.', 'En mobil- og bredbåndsoperatør tjener først og fremst penger på faste, månedlige abonnementer. Inntekten per kunde, ofte kalt ARPU, ganget med antall abonnenter utgjør det bransjen kaller tjenesteinntekter, og dette er den delen av omsetningen investorer følger tettest. I modne markeder som Norge og resten av Norden har nesten alle allerede både mobiltelefon og bredbånd, så veksten kan i praksis ikke komme fra flere kunder. Derfor må selskapene i stedet heve prisene, flytte kunder opp til dyrere pakker eller selge tilleggstjenester som strømming, sikkerhet og mobilt bredbånd. Resten av omsetningen kommer i hovedsak fra salg av telefoner og utstyr, som gir langt lavere margin enn abonnementene.

Bransjen er svært kapitalintensiv. Et mobilnett må i praksis bygges ut på nytt omtrent hvert tiende år når en ny teknologigenerasjon kommer, slik som overgangen fra 4G til 5G, og fibernett må graves ned meter for meter. I tillegg må operatørene kjøpe frekvenslisenser fra staten i auksjoner, og disse kostnadene kan løpe opp i milliarder før en enkelt kunde er betjent. Konsekvensen er at en typisk operatør bruker en betydelig del av omsetningen på investeringer hvert år, og at avstanden mellom driftsresultat før avskrivninger og det som til slutt blir kontanter til eierne kan være stor. Derfor er både gjeldsgrad og forholdet mellom netto rentebærende gjeld og EBITDA sentrale størrelser når et slikt selskap vurderes.

De nordiske markedene skiller seg klart fra de asiatiske Telenor har vært inne i. I Norden er kjøpekraften høy, inntekten per kunde er blant verdens høyeste, reguleringen er forutsigbar og markedet deles gjerne mellom tre til fire aktører, noe som gir stabile men lave vekstrater. I land som Bangladesh, Pakistan, Malaysia og Thailand er inntekten per kunde bare en brøkdel av den nordiske, men befolkningen er ung og datatrafikken vokser raskt, samtidig som politisk risiko, valutasvingninger og hardere priskonkurranse gjør resultatene mer ustabile. Telenor har de siste årene bygget ned denne eksponeringen ved å slå sammen virksomheter med lokale aktører i Malaysia og Thailand, selge Telenor Pakistan ved utgangen av 2025 og konsentrere seg om Norden. Dette gjør selskapet mer forutsigbart, men fjerner samtidig den delen av porteføljen som hadde høyest underliggende vekst.

Fordi kundene betaler hver måned og etterspørselen etter mobil og internett endrer seg lite med konjunkturene, er kontantstrømmen forutsigbar, og telekomselskaper eies derfor ofte først og fremst for utbyttet. Telenors nærmeste konkurrenter er Telia og Ice i Norge, Telia og Tele2 i Sverige, Nuuday og Telia i Danmark og Elisa og Telia i Finland, i tillegg til Altibox og andre fiberaktører på bredbånd. Den største usikkerheten framover er om selskapet klarer å løfte prisene raskere enn kostnadene i et marked uten volumvekst, samtidig som nye investeringer i nett, IT-modernisering og datasentre skal finansieres. Videre kan strengere regulering, nye frekvensauksjoner og priskrig mellom operatørene presse marginene, og for Telenor spesielt vil valutakurser og utviklingen i Bangladesh fortsette å påvirke resultatene.', 181::numeric, 11.3::numeric, 2.66::numeric, 2.4::numeric, 7.14::numeric, 14.01::numeric, 7.3::numeric, 25::numeric, 33.1::numeric, 1.4::numeric, '2026-08-10'::date, 'Q2 2026-rapport, kurs 10.08.2026. 2022-23 inkluderer solgt Pakistan-virksomhet'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('TEL', 'TEL.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 76877::numeric, 34758::numeric, 15143::numeric, 47578::numeric, 64375::numeric, 97900::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 80452::numeric, 33524::numeric, 16964::numeric, 15380::numeric, 70434::numeric, 79800::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 75487::numeric, 33863::numeric, 17912::numeric, 20109::numeric, 81772::numeric, 86788::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 76548::numeric, 34292::numeric, 17978::numeric, 9514::numeric, 76765::numeric, 81731::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 19147::numeric, 8977::numeric, 4884::numeric, 3379::numeric, 71901::numeric, 85011::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 19844::numeric, 8124::numeric, 4031::numeric, -508::numeric, 76765::numeric, 81731::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 18197::numeric, 7838::numeric, 3908::numeric, 8477::numeric, 80977::numeric, 46153::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 18135::numeric, 7630::numeric, 3771::numeric, 2880::numeric, 68085::numeric, 51502::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('TEL', 'TEL.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;

-- ----------------------------------------------------------
-- Yara International ASA (YAR) — USD
-- ----------------------------------------------------------
INSERT INTO public.stock_profiles
  (ticker, name, sector, exchange, valuta, nettside, kort_beskrivelse, bransjeforklaring, borsverdi_mrd, pe, pb, ps, ev_ebitda, ev_ebit, utbytte_prosent, roe_prosent, egenkapitalandel, netto_gjeld_ebitda, tall_per_dato, kilde)
SELECT DISTINCT h.ticker, 'Yara International ASA', 'Industri / Gjødsel', 'OSE', 'USD', 'https://www.yara.com', 'Yara International er et norsk gjødsel- og plantenæringsselskap med hovedkontor i Oslo, og er verdens største omsetter av ammoniakk med produksjon og salg i over 60 land. Selskapet leverer nitrogenbasert mineralgjødsel og industrielle nitrogenprodukter, og den norske staten er største eier.', 'Gjødselprodusenter som Yara tjener penger på differansen mellom prisen de får for et tonn gjødsel og kostnaden for å lage det. Kjerneprosessen er å binde nitrogen fra luften til ammoniakk, som deretter videreforedles til urea, nitrat, NPK og spesialprodukter med høyere pris per tonn. Både gjødselprisene og innsatskostnadene settes i globale råvaremarkeder, så resultatet svinger med marginen per tonn multiplisert med hvor mange tonn selskapet får solgt. Fordi anleggene er kapitalkrevende og bør kjøres nær full kapasitet, slår små endringer i margin kraftig ut på resultatet, og bransjen er derfor tydelig syklisk.

Naturgass er den avgjørende kostnaden fordi gass både er råstoffet som leverer hydrogenet i ammoniakken og energien som driver prosessen. Gass utgjør typisk størstedelen av de variable kostnadene i europeisk ammoniakkproduksjon, og europeiske priser har historisk vært betydelig høyere og mer volatile enn i USA, Midtøsten og Nord-Afrika, der gass ofte er lokalt overskuddsvare eller prises på langsiktige avtaler. Når europeisk gass blir dyr nok, blir det billigere å importere ferdig ammoniakk enn å produsere den selv, og produsentene kutter da produksjonen i stedet for å selge med tap. Yara demper dette ved å ha egen produksjon også utenfor Europa og ved å være en stor kjøper og selger av ammoniakk i verdensmarkedet, men kostnadsulempen i de europeiske anleggene forsvinner ikke.

Etterspørselen etter gjødsel drives i siste instans av at verden trenger mat, og på kort sikt av bondens økonomi. Avlingsprisene på korn, mais, soya og andre vekster bestemmer hvor mye bonden tjener på en ekstra kilo nitrogen, og forholdet mellom avlingspris og gjødselpris er derfor en sentral indikator for etterspørselen. Er gjødsel dyr relativt til avlingsprisen, utsetter bønder kjøp, gjødsler mindre eller tapper ned jordas næringsreserver, men slik utsettelse kan sjelden vare mange sesonger uten at avlingene faller. Volumene er dessuten sterkt sesongavhengige og påvirkes av vær, valutakurser i importland, kreditt og tilgang for bønder i framvoksende økonomier, samt myndighetenes subsidier og eksportrestriksjoner i store land som India, Kina, Russland og Brasil.

Klimapolitikk er i ferd med å endre konkurransebildet i Europa. Ammoniakkproduksjon slipper ut betydelige mengder CO2, og europeiske anlegg må kjøpe utslippskvoter i EUs kvotesystem etter hvert som gratiskvotene bransjen historisk har fått, trappes ned. Parallelt innføres EUs karbontoll CBAM, som legger en tilsvarende karbonkostnad på importert gjødsel og ammoniakk, med den definitive ordningen fra 2026. Fungerer mekanismen som tenkt, jevner den ut noe av kostnadsulempen mot importører fra regioner uten karbonpris; fungerer den dårlig, blir den en ren kostnad for europeisk produksjon. De viktigste konkurrentene er nordamerikanske og globale aktører som CF Industries, Nutrien og Mosaic, Midtøsten- og Nord-Afrika-baserte produsenter som Fertiglobe og SABIC Agri-Nutrients, europeiske aktører som Grupa Azoty, K+S, ICL og OCI, samt russiske og kinesiske produsenter som konkurrerer på svært lav gass- eller kullkostnad. Den største usikkerheten framover er nettopp marginen: hvordan europeisk gasspris utvikler seg i forhold til globale gjødselpriser, hvor mye ny kapasitet som kommer i lavkostregioner, og hvor lenge bøndenes økonomi holder etterspørselen oppe.', 11.36::numeric, 7.4::numeric, 1.26::numeric, 0.68::numeric, 4.35::numeric, 6.39::numeric, 5.21::numeric, 17.6::numeric, 51.5::numeric, 0.93::numeric, '2026-08-12'::date, 'Q2 2026-rapport, kurs 12.08.2026. EBITDA er eksklusiv spesielle poster'
FROM public.portfolio_holdings h
WHERE h.ticker IN ('YAR', 'YAR.OL')
ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      exchange = EXCLUDED.exchange,
      valuta = EXCLUDED.valuta,
      nettside = EXCLUDED.nettside,
      kort_beskrivelse = EXCLUDED.kort_beskrivelse,
      bransjeforklaring = EXCLUDED.bransjeforklaring,
      borsverdi_mrd = EXCLUDED.borsverdi_mrd,
      pe = EXCLUDED.pe,
      pb = EXCLUDED.pb,
      ps = EXCLUDED.ps,
      ev_ebitda = EXCLUDED.ev_ebitda,
      ev_ebit = EXCLUDED.ev_ebit,
      utbytte_prosent = EXCLUDED.utbytte_prosent,
      roe_prosent = EXCLUDED.roe_prosent,
      egenkapitalandel = EXCLUDED.egenkapitalandel,
      netto_gjeld_ebitda = EXCLUDED.netto_gjeld_ebitda,
      tall_per_dato = EXCLUDED.tall_per_dato,
      kilde = EXCLUDED.kilde;

INSERT INTO public.stock_financials
  (ticker, periode_type, periode_navn, periode_slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
SELECT DISTINCT h.ticker, v.typ, v.navn, v.slutt, v.omsetning, v.ebitda, v.ebit, v.resultat, v.egenkapital, v.netto_gjeld
FROM public.portfolio_holdings h
CROSS JOIN (
    SELECT 'ar'::text, '2022'::text, '2022-12-31'::date, 24051::numeric, 4889::numeric, 3827::numeric, 2782::numeric, 8587::numeric, 3206::numeric
    UNION ALL
    SELECT 'ar'::text, '2023'::text, '2023-12-31'::date, 15547::numeric, 1712::numeric, 312::numeric, 54::numeric, 7552::numeric, 3690::numeric
    UNION ALL
    SELECT 'ar'::text, '2024'::text, '2024-12-31'::date, 13934::numeric, 2051::numeric, 686::numeric, 15::numeric, 7003::numeric, 3730::numeric
    UNION ALL
    SELECT 'ar'::text, '2025'::text, '2025-12-31'::date, 15715::numeric, 2803::numeric, 1571::numeric, 1372::numeric, 8724::numeric, 3271::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q3 2025'::text, '2025-09-30'::date, 4108::numeric, 804::numeric, 470::numeric, 320::numeric, 8397::numeric, 3316::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q4 2025'::text, '2025-12-31'::date, 4012::numeric, 709::numeric, 443::numeric, 344::numeric, 8724::numeric, 3271::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q1 2026'::text, '2026-03-31'::date, 4259::numeric, 896::numeric, 610::numeric, 327::numeric, 9095::numeric, 3053::numeric
    UNION ALL
    SELECT 'kvartal'::text, 'Q2 2026'::text, '2026-06-30'::date, 4428::numeric, 906::numeric, 735::numeric, 545::numeric, 9013::numeric, 3067::numeric
) AS v(typ, navn, slutt, omsetning, ebitda, ebit, resultat, egenkapital, netto_gjeld)
WHERE h.ticker IN ('YAR', 'YAR.OL')
ON CONFLICT (ticker, periode_type, periode_navn) DO UPDATE SET
      omsetning = EXCLUDED.omsetning,
      ebitda = EXCLUDED.ebitda,
      ebit = EXCLUDED.ebit,
      resultat = EXCLUDED.resultat,
      egenkapital = EXCLUDED.egenkapital,
      netto_gjeld = EXCLUDED.netto_gjeld,
      periode_slutt = EXCLUDED.periode_slutt;


-- ============================================================
-- KONTROLL
-- ============================================================

-- Hvor mange selskaper og perioder ble lagt inn?
SELECT
  (SELECT count(*) FROM public.stock_profiles)   AS selskaper,
  (SELECT count(*) FROM public.stock_financials) AS regnskapsperioder;

-- Er det aksjer i porteføljen som ennå mangler profil?
SELECT h.ticker, h.name
FROM public.portfolio_holdings h
LEFT JOIN public.stock_profiles p ON p.ticker = h.ticker
WHERE h.holding_type = 'stock' AND p.ticker IS NULL
ORDER BY h.name;

-- Oversikt per selskap
SELECT p.ticker, p.name, p.valuta, p.tall_per_dato,
       count(f.id) FILTER (WHERE f.periode_type = 'ar')      AS ar,
       count(f.id) FILTER (WHERE f.periode_type = 'kvartal') AS kvartal
FROM public.stock_profiles p
LEFT JOIN public.stock_financials f ON f.ticker = p.ticker
GROUP BY p.ticker, p.name, p.valuta, p.tall_per_dato
ORDER BY p.name;
