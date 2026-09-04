/**
 * Begrepsbanken bak /spill - snu-kortene.
 *
 * Forsiden er begrepet, baksiden forklaringen. Nivået er nybegynner til
 * middels: en fersk student skal kunne lese en kvartalsrapport eller en
 * analyse etterpå uten å stoppe på hvert tredje ord.
 *
 * Skriveregler for nye kort:
 *  - Forklaringen skal stå på egne bein, uten å forutsette andre kort.
 *  - Én til to setninger. Blir det lengre, er begrepet for stort til et kort.
 *  - Ingen tall som eldes (rentenivå, beløpsgrenser, skattesatser).
 */

export interface Begrep {
  ord: string;
  forklaring: string;
  kategori: Kategori;
}

export type Kategori =
  | "Aksjer og børs"
  | "Nøkkeltall"
  | "Regnskap"
  | "Handel"
  | "Marked og risiko"
  | "Sparing og fond"
  | "Analyse og verdsettelse"
  | "Kunstig intelligens";

export const KATEGORIER: Kategori[] = [
  "Aksjer og børs",
  "Nøkkeltall",
  "Regnskap",
  "Handel",
  "Marked og risiko",
  "Sparing og fond",
  "Analyse og verdsettelse",
  "Kunstig intelligens",
];

export const BEGREPER: Begrep[] = [
  // ---------------- Aksjer og børs ----------------
  {
    ord: "Aksje",
    forklaring:
      "En eierandel i et selskap. Eier du én av hundre aksjer, eier du én prosent av selskapet - og har krav på din del av verdiene og et eventuelt utbytte.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Aksjonær",
    forklaring:
      "Den som eier aksjer i et selskap. Aksjonærene er selskapets eiere, og velger styret på generalforsamlingen.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Børs",
    forklaring:
      "En markedsplass der kjøpere og selgere av verdipapirer møtes under felles regler, slik at alle handler til samme kjente kurs.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "IPO",
    forklaring:
      "Initial Public Offering, altså børsnotering. Selskapet selger aksjer til publikum for første gang, og aksjen kan etterpå kjøpes og selges fritt på børsen.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Ticker",
    forklaring:
      "Den korte bokstavkoden en aksje handles under. Equinor er EQNR på Oslo Børs, Apple er AAPL på Nasdaq.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Børsverdi",
    forklaring:
      "Markedets prislapp på hele selskapet: kursen ganget med antall aksjer. Kalles også markedsverdi eller market cap.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Free float",
    forklaring:
      "Den andelen av aksjene som faktisk er tilgjengelig for handel i markedet. Aksjer som er låst hos grunnleggere eller staten regnes ikke med.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Emisjon",
    forklaring:
      "Selskapet utsteder nye aksjer for å hente inn penger. Eksisterende eiere blir utvannet - de eier en mindre andel etterpå, med mindre de deltar.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Utvanning",
    forklaring:
      "At eierandelen din krymper fordi selskapet har utstedt flere aksjer. Kaka er den samme, men den deles på flere.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Aksjesplitt",
    forklaring:
      "Hver aksje deles i flere, og kursen deles tilsvarende. Verdien av beholdningen din er uendret - den blir bare stykket opp i mindre biter.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Tilbakekjøp",
    forklaring:
      "Selskapet kjøper egne aksjer i markedet og sletter dem. Færre aksjer å dele overskuddet på gir høyere fortjeneste per aksje.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Utbytte",
    forklaring:
      "Andel av overskuddet som betales ut i kontanter til aksjonærene, som regel én eller flere ganger i året.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Ex-dato",
    forklaring:
      "Første dag aksjen handles uten rett til det neste utbyttet. Kjøper du på ex-datoen, får selgeren utbyttet - og kursen faller typisk tilsvarende.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Generalforsamling",
    forklaring:
      "Aksjonærenes årlige møte, der de velger styre, godkjenner regnskapet og vedtar utbyttet. Én aksje gir normalt én stemme.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Styret",
    forklaring:
      "Gruppen aksjonærene velger til å passe på selskapet for seg. Styret ansetter og sparker daglig leder, men driver ikke selskapet fra dag til dag.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Prospekt",
    forklaring:
      "Det omfattende dokumentet et selskap må publisere før en børsnotering eller emisjon, med regnskap, planer og risikofaktorer.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Oppkjøp",
    forklaring:
      "Ett selskap kjøper kontroll over et annet. Aksjonærene i målselskapet får som regel tilbud om en kurs over dagens børskurs.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Fusjon",
    forklaring:
      "To selskaper slår seg sammen til ett. Aksjonærene i begge blir eiere i det nye selskapet, etter en avtalt bytteforholdsnøkkel.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Spinoff",
    forklaring:
      "En del av et selskap skilles ut som et eget børsnotert selskap, og aksjonærene får aksjer i begge.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Blue chip",
    forklaring:
      "Et stort, veletablert og stabilt selskap med lang historikk. Sjelden spennende, sjelden katastrofe.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Small cap",
    forklaring:
      "Selskap med lav børsverdi. Svinger typisk mer enn store selskaper, og aksjen kan være tyngre å kjøpe og selge.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Primærinnsider",
    forklaring:
      "Person med ledende stilling eller styreverv som har tilgang til kurssensitiv informasjon. Handlene deres må meldes offentlig.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Innsidehandel",
    forklaring:
      "Å handle på informasjon som ikke er offentlig kjent, og som ville påvirket kursen. Det er forbudt og straffbart.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "Preferanseaksje",
    forklaring:
      "Aksjeklasse med fortrinnsrett til utbytte, men som regel svakere eller ingen stemmerett.",
    kategori: "Aksjer og børs",
  },
  {
    ord: "OSEBX",
    forklaring:
      "Hovedindeksen på Oslo Børs - et utvalg av de mest omsatte aksjene, brukt som målestokk for hvordan det norske aksjemarkedet går.",
    kategori: "Aksjer og børs",
  },

  // ---------------- Nøkkeltall ----------------
  {
    ord: "P/E",
    forklaring:
      "Kurs delt på fortjeneste per aksje. Sier hvor mange års overskudd du betaler for aksjen - P/E 15 betyr at prisen er 15 ganger fjorårets fortjeneste.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "P/B",
    forklaring:
      "Kurs delt på bokført egenkapital per aksje. Under 1 betyr at markedet priser selskapet lavere enn verdiene i balansen.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "P/S",
    forklaring:
      "Kurs delt på omsetning per aksje. Brukes ofte på selskaper som ennå ikke tjener penger, der P/E ikke gir mening.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "EPS",
    forklaring:
      "Earnings per share - fortjeneste per aksje. Resultatet etter skatt delt på antall aksjer.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "PEG",
    forklaring:
      "P/E delt på forventet vekst i overskuddet. Et forsøk på å svare på om en høy P/E er forsvarlig fordi selskapet vokser raskt.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "EV",
    forklaring:
      "Enterprise value, eller selskapsverdi: børsverdi pluss netto rentebærende gjeld. Prisen for å kjøpe hele selskapet, gjeld inkludert.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "EV/EBITDA",
    forklaring:
      "Selskapsverdien målt mot driftsresultatet før avskrivninger. Lar deg sammenligne selskaper med ulik gjeldsgrad.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "EV/EBIT",
    forklaring:
      "Som EV/EBITDA, men mot driftsresultatet etter avskrivninger. Strengere, og mer rettferdig mot selskaper som må investere tungt.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Direkteavkastning",
    forklaring:
      "Utbytte per aksje delt på kursen, oppgitt i prosent. Hvor mye du får utbetalt i året per krone investert.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Utdelingsgrad",
    forklaring:
      "Hvor stor andel av overskuddet som deles ut som utbytte. Over 100 prosent betyr at selskapet deler ut mer enn det tjener.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "ROE",
    forklaring:
      "Return on equity, egenkapitalavkastning: overskudd delt på egenkapital. Hvor godt selskapet forrenter eiernes penger.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "ROIC",
    forklaring:
      "Avkastning på investert kapital - overskuddet målt mot all kapital som er satt i arbeid, både egenkapital og gjeld.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Driftsmargin",
    forklaring:
      "Driftsresultat delt på omsetning. Hvor mange øre av hver omsatt krone som blir igjen etter alle driftskostnader.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Bruttomargin",
    forklaring:
      "Omsetning minus de direkte kostnadene ved å lage varen, i prosent av omsetningen. Sier noe om prisingsmakten.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Egenkapitalandel",
    forklaring:
      "Egenkapital i prosent av alle eiendeler. Høy andel betyr at selskapet tåler et dårlig år uten å komme i knipe.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Netto gjeld",
    forklaring:
      "Rentebærende gjeld minus kontanter. Negativ netto gjeld betyr at selskapet har mer i banken enn det skylder.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Netto gjeld / EBITDA",
    forklaring:
      "Hvor mange år med dagens driftsresultat som skal til for å betale ned gjelden. Over tre til fire regnes ofte som høyt.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Rentedekningsgrad",
    forklaring:
      "Driftsresultat delt på rentekostnader. Viser hvor mange ganger selskapet klarer å betjene rentene sine.",
    kategori: "Nøkkeltall",
  },
  {
    ord: "Bokført verdi",
    forklaring:
      "Verdien et regnskap setter på noe, i motsetning til hva markedet ville betalt. For et selskap: eiendeler minus gjeld.",
    kategori: "Nøkkeltall",
  },

  // ---------------- Regnskap ----------------
  {
    ord: "Omsetning",
    forklaring:
      "Summen av det selskapet har solgt for i perioden, før noen kostnader er trukket fra. Kalles også inntekter eller topplinje.",
    kategori: "Regnskap",
  },
  {
    ord: "EBITDA",
    forklaring:
      "Driftsresultat før avskrivninger og nedskrivninger. Viser hvordan driften går, uten støy fra investeringer gjort tidligere.",
    kategori: "Regnskap",
  },
  {
    ord: "EBIT",
    forklaring:
      "Driftsresultat: det som blir igjen etter alle driftskostnader og avskrivninger, men før renter og skatt.",
    kategori: "Regnskap",
  },
  {
    ord: "Bunnlinje",
    forklaring:
      "Resultatet etter skatt - det som faktisk er igjen til eierne når absolutt alt er betalt.",
    kategori: "Regnskap",
  },
  {
    ord: "Resultatregnskap",
    forklaring:
      "Oversikten over inntekter og kostnader i en periode. Forteller om selskapet tjente eller tapte penger.",
    kategori: "Regnskap",
  },
  {
    ord: "Balanse",
    forklaring:
      "Et øyeblikksbilde av hva selskapet eier og skylder på en gitt dato. Eiendeler er alltid lik egenkapital pluss gjeld.",
    kategori: "Regnskap",
  },
  {
    ord: "Eiendeler",
    forklaring:
      "Alt selskapet eier og har verdi av: bygninger, maskiner, varelager, kundefordringer og kontanter.",
    kategori: "Regnskap",
  },
  {
    ord: "Egenkapital",
    forklaring:
      "Eiendeler minus gjeld - den delen av selskapet som tilhører eierne.",
    kategori: "Regnskap",
  },
  {
    ord: "Kontantstrøm",
    forklaring:
      "Pengene som faktisk går inn og ut av kassa. Et selskap kan vise overskudd på papiret og likevel gå tomt for kontanter.",
    kategori: "Regnskap",
  },
  {
    ord: "Fri kontantstrøm",
    forklaring:
      "Kontantene fra driften minus det som må investeres for å holde hjulene i gang. Dette er pengene som kan gå til utbytte, nedbetaling eller oppkjøp.",
    kategori: "Regnskap",
  },
  {
    ord: "Arbeidskapital",
    forklaring:
      "Omløpsmidler minus kortsiktig gjeld - pengene som er bundet opp i varelager og kundefordringer for å drive den daglige virksomheten.",
    kategori: "Regnskap",
  },
  {
    ord: "Avskrivning",
    forklaring:
      "At kostnaden for noe langvarig, som et skip eller en fabrikk, fordeles over årene det brukes, i stedet for å tas alt i kjøpsåret.",
    kategori: "Regnskap",
  },
  {
    ord: "Nedskrivning",
    forklaring:
      "En engangsjustering der verdien av noe settes ned fordi det viste seg å være mindre verdt enn bokført. Reduserer resultatet, men koster ingen kontanter.",
    kategori: "Regnskap",
  },
  {
    ord: "Goodwill",
    forklaring:
      "Det et selskap betalte utover de identifiserbare verdiene ved et oppkjøp - merkevare, kunderelasjoner, forventninger. Må testes for nedskrivning.",
    kategori: "Regnskap",
  },
  {
    ord: "Kvartalsrapport",
    forklaring:
      "Regnskapet for tre måneders drift. Børsnoterte selskaper rapporterer jevnlig, og kursen reagerer ofte kraftig på avvik fra forventningene.",
    kategori: "Regnskap",
  },
  {
    ord: "Årsrapport",
    forklaring:
      "Selskapets samlede rapport for året, med reviderte tall, styrets beretning og noter som forklarer tallene.",
    kategori: "Regnskap",
  },
  {
    ord: "Noter",
    forklaring:
      "Forklaringene bakerst i regnskapet. Ofte her de virkelig interessante opplysningene står, som forutsetninger og forpliktelser.",
    kategori: "Regnskap",
  },
  {
    ord: "Revisor",
    forklaring:
      "Uavhengig kontrollør som går gjennom regnskapet og bekrefter at det gir et riktig bilde av selskapets økonomi.",
    kategori: "Regnskap",
  },
  {
    ord: "Ordrereserve",
    forklaring:
      "Summen av kontrakter som er signert, men ennå ikke levert og inntektsført. Gir sikt på framtidig omsetning, men sier lite om lønnsomheten.",
    kategori: "Regnskap",
  },
  {
    ord: "Guiding",
    forklaring:
      "Selskapets egne anslag for hva som kommer, for eksempel omsetning eller margin neste år. Endret guiding beveger ofte kursen mer enn tallene som ble lagt fram.",
    kategori: "Regnskap",
  },

  // ---------------- Handel ----------------
  {
    ord: "Ordrebok",
    forklaring:
      "Listen over alle kjøps- og salgsordrer som ligger inne i en aksje, sortert etter pris. Her ser du hvor mye som er til salgs på hvert nivå.",
    kategori: "Handel",
  },
  {
    ord: "Bid",
    forklaring:
      "Høyeste pris noen er villig til å betale for aksjen akkurat nå - kursen du får hvis du selger umiddelbart.",
    kategori: "Handel",
  },
  {
    ord: "Ask",
    forklaring:
      "Laveste pris noen er villig til å selge aksjen for akkurat nå - kursen du betaler hvis du kjøper umiddelbart.",
    kategori: "Handel",
  },
  {
    ord: "Spread",
    forklaring:
      "Forskjellen mellom bid og ask. Bred spread betyr at aksjen er lite likvid, og at du taper litt bare på å gå inn og ut.",
    kategori: "Handel",
  },
  {
    ord: "Markedsordre",
    forklaring:
      "En ordre som utføres straks til den beste kursen som finnes. Du er garantert handel, men ikke pris.",
    kategori: "Handel",
  },
  {
    ord: "Limitordre",
    forklaring:
      "En ordre med en øvre grense for hva du vil betale, eller nedre grense for hva du vil selge til. Du er garantert pris, men ikke handel.",
    kategori: "Handel",
  },
  {
    ord: "Stop loss",
    forklaring:
      "En ordre som utløses automatisk hvis kursen faller til et bestemt nivå, for å begrense tapet.",
    kategori: "Handel",
  },
  {
    ord: "Kurtasje",
    forklaring:
      "Gebyret megleren tar per handel. Små, hyppige handler spiser opp avkastningen fordi kurtasjen betales hver gang.",
    kategori: "Handel",
  },
  {
    ord: "Likviditet",
    forklaring:
      "Hvor lett det er å kjøpe eller selge uten å flytte kursen. Lav likviditet er en risiko folk oppdager først når de vil ut.",
    kategori: "Handel",
  },
  {
    ord: "Volum",
    forklaring:
      "Antall aksjer som har blitt omsatt i en periode. Store kursbevegelser på lavt volum er mindre å stole på.",
    kategori: "Handel",
  },
  {
    ord: "Sluttkurs",
    forklaring:
      "Kursen aksjen ble handlet til da børsen stengte. Brukes som dagens fasit i indekser og avkastningsberegninger.",
    kategori: "Handel",
  },
  {
    ord: "Shorting",
    forklaring:
      "Å låne aksjer, selge dem, og satse på å kjøpe dem tilbake billigere. Tjener penger når kursen faller - og har i teorien ubegrenset tapspotensial.",
    kategori: "Handel",
  },
  {
    ord: "Belåning",
    forklaring:
      "Å investere for lånte penger. Gir større gevinst når det går bra og større tap når det går galt - også kalt giring.",
    kategori: "Handel",
  },
  {
    ord: "Margin call",
    forklaring:
      "Beskjed fra megleren om at du må skyte inn mer penger eller selge, fordi de lånefinansierte posisjonene dine har falt for mye.",
    kategori: "Handel",
  },
  {
    ord: "Derivat",
    forklaring:
      "Et verdipapir som henter verdien sin fra noe annet, for eksempel en aksje eller en råvare. Opsjoner og terminer er derivater.",
    kategori: "Handel",
  },
  {
    ord: "Opsjon",
    forklaring:
      "En rett, men ingen plikt, til å kjøpe eller selge noe til en avtalt pris innen en frist.",
    kategori: "Handel",
  },
  {
    ord: "Termin",
    forklaring:
      "En avtale om å kjøpe eller selge noe på et bestemt tidspunkt til en pris avtalt i dag. I motsetning til en opsjon er dette en plikt.",
    kategori: "Handel",
  },
  {
    ord: "ETF",
    forklaring:
      "Exchange Traded Fund - et fond som handles på børsen som en aksje. De fleste følger en indeks og har lave kostnader.",
    kategori: "Handel",
  },
  {
    ord: "Daytrading",
    forklaring:
      "Å kjøpe og selge innenfor samme dag. Krever mye tid, gir mye kurtasje, og de aller fleste taper penger på det over tid.",
    kategori: "Handel",
  },

  // ---------------- Marked og risiko ----------------
  {
    ord: "Bull-marked",
    forklaring:
      "En lengre periode med stigende kurser og optimisme. Oksen stanger oppover.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Bear-marked",
    forklaring:
      "En lengre periode med fallende kurser, ofte definert som et fall på over 20 prosent fra toppen. Bjørnen slår nedover.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Korreksjon",
    forklaring:
      "Et kursfall på rundt ti prosent fra toppen. Ubehagelig, men normalt - det skjer omtrent årlig.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Volatilitet",
    forklaring:
      "Hvor mye kursen svinger. Høy volatilitet betyr store utslag begge veier, ikke nødvendigvis at det går nedover.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Beta",
    forklaring:
      "Hvor kraftig en aksje svinger sammenlignet med markedet. Beta 1 følger markedet, beta 2 svinger dobbelt så mye.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Diversifisering",
    forklaring:
      "Å spre pengene på flere selskaper og bransjer, slik at én enkelt ulykke ikke velter hele porteføljen.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Systematisk risiko",
    forklaring:
      "Risiko som rammer hele markedet - renter, krig, resesjon. Den kan du ikke diversifisere deg bort fra.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Selskapsrisiko",
    forklaring:
      "Risiko knyttet til det enkelte selskapet, som en tapt kontrakt eller en dårlig sjef. Denne forsvinner nesten når du eier mange nok selskaper.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Valutarisiko",
    forklaring:
      "At avkastningen din endrer seg fordi kronen styrker eller svekker seg mot valutaen investeringen er i.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Renterisiko",
    forklaring:
      "At verdien av en investering endrer seg når rentenivået endrer seg. Rammer særlig gjeldstunge selskaper og obligasjoner.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Inflasjon",
    forklaring:
      "Generell prisvekst. At pengene dine kjøper litt mindre for hvert år - og grunnen til at penger under madrassen taper verdi.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Styringsrente",
    forklaring:
      "Renten sentralbanken setter, og som styrer bankenes renter. Settes opp for å dempe inflasjon, ned for å stimulere økonomien.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Resesjon",
    forklaring:
      "En periode der økonomien krymper i stedet for å vokse, ofte målt som to kvartaler på rad med fall i BNP.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Syklisk selskap",
    forklaring:
      "Et selskap hvis inntjening svinger med konjunkturene - shipping, bygg og råvarer. Motsatt av defensive selskaper som mat og strøm.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Indeks",
    forklaring:
      "En kurv av verdipapirer brukt som målestokk for et marked, for eksempel OSEBX for Oslo Børs eller S&P 500 for de store amerikanske selskapene.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Risikopremie",
    forklaring:
      "Den ekstra avkastningen investorer krever for å ta risiko framfor å plassere pengene et trygt sted.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Effisiente markeder",
    forklaring:
      "Teorien om at all kjent informasjon allerede ligger i kursen, og at det derfor er svært vanskelig å slå markedet systematisk.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Boble",
    forklaring:
      "Når kursene drives langt over det de underliggende verdiene forsvarer, båret av forventning om at noen betaler enda mer i morgen.",
    kategori: "Marked og risiko",
  },
  {
    ord: "Likviditetsrisiko",
    forklaring:
      "Risikoen for at du ikke får solgt til en fornuftig kurs når du vil ut, fordi det ikke finnes kjøpere.",
    kategori: "Marked og risiko",
  },

  // ---------------- Sparing og fond ----------------
  {
    ord: "Aksjefond",
    forklaring:
      "Et fond som investerer i mange aksjer på vegne av andelseierne. Du får spredning fra første krone.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Indeksfond",
    forklaring:
      "Et fond som bare kopierer en indeks i stedet for å velge aksjer selv. Lave kostnader, og slår over tid de fleste aktive fond.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Aktivt forvaltet fond",
    forklaring:
      "Et fond der en forvalter velger aksjene selv, i håp om å slå indeksen. Koster mer, og lykkes sjeldnere enn man skulle tro.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Rentefond",
    forklaring:
      "Et fond som låner ut penger i stedet for å eie aksjer, gjennom obligasjoner og sertifikater. Lavere forventet avkastning og lavere risiko.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Obligasjon",
    forklaring:
      "Et lån gjort om til et verdipapir. Du låner penger til en stat eller et selskap og får renter, og pengene tilbake ved forfall.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Forvaltningshonorar",
    forklaring:
      "Den årlige prosenten fondet tar for å forvalte pengene dine. Trekkes uansett om det går bra eller dårlig, og betyr mye over mange år.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Referanseindeks",
    forklaring:
      "Indeksen et fond måler seg mot. Uten en referanseindeks er det umulig å vurdere om forvalteren faktisk har gjort en god jobb.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Aksjesparekonto",
    forklaring:
      "Norsk kontotype, forkortet ASK, der du kan kjøpe og selge børsnoterte aksjer og aksjefond uten å skatte av gevinsten før du tar pengene ut.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Renters rente",
    forklaring:
      "At avkastningen selv gir avkastning. Effekten er beskjeden de første årene og dramatisk etter tjue.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Månedlig sparing",
    forklaring:
      "Å kjøpe for et fast beløp hver måned. Du kjøper automatisk flere andeler når det er billig, og slipper å gjette på riktig tidspunkt.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Rebalansering",
    forklaring:
      "Å justere porteføljen tilbake til den fordelingen du bestemte deg for, ved å selge litt av det som har steget og kjøpe av det som har falt.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Tidshorisont",
    forklaring:
      "Hvor lenge pengene kan stå i fred. Kort horisont tåler dårlig aksjerisiko, uansett hvor god investeringen er.",
    kategori: "Sparing og fond",
  },
  {
    ord: "Skjermingsfradrag",
    forklaring:
      "Norsk regel som gjør at en liten del av avkastningen, omtrent tilsvarende en risikofri rente på det du har investert, er skattefri.",
    kategori: "Sparing og fond",
  },

  // ---------------- Analyse og verdsettelse ----------------
  {
    ord: "Fundamental analyse",
    forklaring:
      "Å vurdere selskapet selv - regnskap, marked, ledelse og konkurranse - for å anslå hva det er verdt.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Teknisk analyse",
    forklaring:
      "Å lete etter mønstre i kursgrafer og volum i stedet for i regnskapet. Omdiskutert, men mye brukt på kort sikt.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "DCF",
    forklaring:
      "Discounted cash flow: du anslår selskapets framtidige kontantstrømmer og regner dem tilbake til hva de er verdt i dag.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Diskonteringsrente",
    forklaring:
      "Renten du bruker for å gjøre framtidige kroner om til dagens kroner. Høyere rente gir lavere verdi i dag.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Terminalverdi",
    forklaring:
      "Verdien av alt som skjer etter den perioden du har regnet på i detalj. Utgjør ofte mesteparten av svaret i en DCF - og er det mest usikre leddet.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "WACC",
    forklaring:
      "Selskapets vektede kapitalkostnad: den gjennomsnittlige avkastningen både långivere og eiere krever. Brukes som diskonteringsrente.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Multippel",
    forklaring:
      "Et forholdstall som setter prisen opp mot noe fundamentalt, som P/E eller EV/EBITDA. Brukes for å sammenligne selskaper raskt.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Konsensus",
    forklaring:
      "Gjennomsnittet av analytikernes forventninger. Kursen reagerer på avviket fra konsensus, ikke på om tallene isolert sett var gode.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Kursmål",
    forklaring:
      "Kursen en analytiker mener aksjen bør stå i, typisk om tolv måneder. Et anslag, ikke et løfte.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Konkurransefortrinn",
    forklaring:
      "Det som gjør at et selskap klarer å holde på god lønnsomhet i mange år uten at konkurrentene spiser den opp. Kalles gjerne en vollgrav.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Verdiaksje",
    forklaring:
      "En aksje som er lavt priset mot inntjening eller bokførte verdier. Ofte i modne bransjer med lav vekst.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Vekstaksje",
    forklaring:
      "En aksje priset høyt fordi markedet venter kraftig vekst. Skuffer veksten, faller kursen tilsvarende hardt.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Sikkerhetsmargin",
    forklaring:
      "Å kjøpe godt under din egen verdivurdering, slik at du tåler å ta litt feil. Grunnprinsippet i verdiinvestering.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Due diligence",
    forklaring:
      "Den grundige gjennomgangen av et selskap før man investerer eller kjøper det - tall, kontrakter, juss og risiko.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Sensitivitetsanalyse",
    forklaring:
      "Å regne om verdivurderingen med andre forutsetninger for å se hvor mye svaret flytter seg. Viser hvilke antakelser som faktisk betyr noe.",
    kategori: "Analyse og verdsettelse",
  },
  {
    ord: "Investeringstese",
    forklaring:
      "Den korte begrunnelsen for hvorfor du eier aksjen, og hva som må skje for at du tar feil. Skrives ned før kjøpet, ikke etter.",
    kategori: "Analyse og verdsettelse",
  },

  // ---------------- Kunstig intelligens ----------------
  {
    ord: "LLM",
    forklaring:
      "Large language model - en språkmodell trent på enorme mengder tekst, som svarer ved å forutsi hva som er den mest sannsynlige fortsettelsen.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Prompt",
    forklaring:
      "Instruksjonen du gir en KI-modell. Presis prompt gir presist svar; vag prompt gir vagt svar.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Token",
    forklaring:
      "Tekstbiten en språkmodell regner på - ofte et ord eller en orddel. Både lengde og pris måles i tokens.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Hallusinasjon",
    forklaring:
      "At en KI-modell oppgir noe som er feil, men formulert like selvsikkert som noe den vet. Derfor må tall fra KI alltid kontrolleres mot kilden.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "MCP",
    forklaring:
      "Model Context Protocol - en åpen standard for å koble KI-modeller til verktøy og datakilder, slik at de kan hente informasjon og utføre handlinger.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "RAG",
    forklaring:
      "Retrieval-augmented generation: modellen slår opp i relevante dokumenter først, og svarer på grunnlag av det den fant.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Agent",
    forklaring:
      "En KI som ikke bare svarer, men utfører oppgaver i flere steg ved å bruke verktøy underveis.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Finjustering",
    forklaring:
      "Å trene en ferdig modell videre på et mindre, spesialisert datasett, slik at den blir bedre på akkurat den oppgaven.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Treningsdata",
    forklaring:
      "Materialet en modell har lært av. Skjevheter og feil i treningsdataene følger med inn i svarene modellen gir.",
    kategori: "Kunstig intelligens",
  },
  {
    ord: "Kontekstvindu",
    forklaring:
      "Hvor mye tekst en modell klarer å ha i hodet samtidig. Går samtalen ut over vinduet, faller det eldste ut.",
    kategori: "Kunstig intelligens",
  },
];
