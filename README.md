# EMIL Invest

Nettsiden til EMIL Invest — investeringskomiteen for Energi- og miljøstudenter
ved NTNU Gløshaugen. Siden viser komiteens portefølje målt mot OSEBX,
retningslinjer, kvartalsrapporter og teamet, og kjører en aksjekonkurranse
(digital simulering) som alle innloggede studenter kan delta i.

## Teknologi

- **Frontend:** Vite + React + TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** [Supabase](https://supabase.com) (Postgres, Auth, Storage, Edge Functions)
- **Hosting:** Vercel — hver push til `main` deployes automatisk
- **Kursdata:** Yahoo Finance via `stock-prices`-edge-funksjonen (alle priser konverteres til NOK)

## Lokal utvikling

Krever Node.js 18+.

```sh
git clone https://github.com/Henrik-star/emilinvest.git
cd emilinvest
npm install
cp .env.example .env   # fyll inn verdiene fra Supabase-dashbordet
npm run dev            # kjører på http://localhost:8080
```

## Nyttige kommandoer

```sh
npm run build    # produksjonsbygg
npm run lint     # ESLint
npm test         # Vitest
```

## Supabase

Prosjekt-ref: `nehqvobfwooyufxqbzpv` (region eu-west-3).

- Migrasjonsfiler ligger i `supabase/migrations/` (historikk fra Lovable-tiden —
  databasen ble migrert med dump/restore, så ikke kjør `supabase db push` uten videre).
- Engangsoppsett og sikkerhetsfikser gjort etter migreringen ligger i `supabase/manual/`.
- Edge-funksjoner deployes med:
  ```sh
  supabase functions deploy stock-prices daily-snapshot check-invitation delete-account competition-reset mcp
  ```
- Secrets: `CRON_SECRET` (brukes av den daglige snapshot-jobben) og eventuelt
  `ALLOWED_ORIGINS` (kommaseparert liste over domener som får kalle
  admin-funksjonene fra nettleseren).

## Historikk

Prosjektet ble opprinnelig bygget med [Lovable](https://lovable.dev) og
migrert til egen Supabase + Vercel i august 2026 — med all brukerdata,
innlogging og konkurransehistorikk intakt.
