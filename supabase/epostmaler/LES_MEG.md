# E-postmaler for innlogging og passord

HTML-en for e-postene Supabase sender ut (passordbytte, bekreftelse,
invitasjon, magisk lenke, endring av e-post). Filene her er **kilden** —
Supabase leser dem ikke automatisk, så de må limes inn i dashbordet.

## Slik oppdaterer du dem

1. Supabase → prosjektet → **Authentication** → **Emails** → fanen
   **Templates**.
2. Velg malen, bytt til HTML-visning, lim inn hele innholdet fra den
   tilsvarende filen her, og lagre.

| Fil | Mal i Supabase |
|---|---|
| `tilbakestill-passord.html` | Reset Password |
| `bekreft-registrering.html` | Confirm signup |
| `invitasjon.html` | Invite user |
| `magisk-lenke.html` | Magic Link |
| `endre-epost.html` | Change Email Address |

Endrer du noe i dashbordet, kopier det tilbake hit — ellers mister vi
sporet på hva som faktisk sendes ut.

## Hva som er endret fra standardmalene

- **Venstrestilt.** Kortet ligger til venstre i vinduet, og ordmerket,
  knappen og bunnteksten står langs venstre kant. Ingenting er sentrert.
- **Profilfargen.** Toppfeltet og knappen bruker `#24332C` og `#293832`
  — samme grønn som nettsiden. Bakgrunn `#F5F3F0`, kort `#FAF8F5`,
  tekst `#1B2722`, dus tekst `#596961`, kantlinje `#D9D6CE`. Ingen blått
  igjen noe sted.
- **Serif-ordmerke** i Georgia, som er den nærmeste serifen man kan
  regne med i alle e-postklienter. Nettsidens egen font kan ikke lastes
  i e-post.
- **Reservelenke** under knappen, i klartekst, for klienter som blokkerer
  knapper.
- **Forhåndsvisningstekst** øverst i hver mal — den skjulte linjen som
  vises ved siden av emnefeltet i innboksen.

## Teknisk om e-post-HTML

E-postklienter er ikke nettlesere. Malene bruker derfor tabeller til
oppsett, `bgcolor` i tillegg til `background`, og all CSS inline. Knappen
er en tabellcelle med bakgrunnsfarge, ikke en `<a>` med padding, fordi
Outlook ignorerer padding på lenker. Ikke bytt dette til flexbox eller
klasser i `<style>` — det ser riktig ut i forhåndsvisningen og knekker i
Outlook.

Variablene (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`)
fylles inn av Supabase. De må stå akkurat slik, med mellomrom innenfor
klammene.

## Avsenderlogoen i Gmail — hva som faktisk kreves

Logoen ved siden av avsendernavnet styres **ikke** av HTML-en i
e-posten. Den kommer fra BIMI, en standard som krever tre ting samtidig:

1. **DMARC på `p=quarantine` eller `p=reject`** for emilinvest.no.
   `p=none` er ikke nok. Sjekk hva som står i DNS i dag før noe annet.
2. **Logoen som SVG Tiny PS** — en egen, begrenset SVG-profil. Kvadratisk
   (1:1), på en offentlig HTTPS-URL. EI-merket passer godt til dette
   formatet, men filen må konverteres; en vanlig SVG blir avvist.
3. **Et sertifikat.** VMC krever registrert varemerke og koster rundt
   1 000–1 500 USD per år. CMC (Common Mark Certificate) krever bare at
   logoen kan dokumenteres brukt i minst ett år, ikke varemerke, og
   koster mindre. Gmail har godtatt CMC siden 2025, så det er den veien
   en studentforening realistisk går.

Uten sertifikat viser Gmail den grå standardavataren uansett hva vi
gjør. Det finnes ingen gratis snarvei: Gravatar fungerer ikke i Gmail
lenger, og et bilde i signaturen påvirker ikke avatarikonet.

Vurder om det er verdt årsavgiften. Alternativet som koster ingenting er
å la ordmerket øverst i e-posten gjøre jobben — det er det første
mottakeren ser når e-posten åpnes.
