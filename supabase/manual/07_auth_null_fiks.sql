-- ============================================================================
-- EmilInvest: fiks NULL-verdier i auth.users etter migreringen fra Lovable
-- Kjøres i SQL Editor. Idempotent.
--
-- GoTrue (Supabase Auth) forventer tom streng '' i disse kolonnene, men
-- database-migreringen ga NULL. Det knekker bl.a. «glemt passord» med:
--   "Error finding user: converting NULL to string is unsupported"
-- ============================================================================

UPDATE auth.users
SET confirmation_token       = COALESCE(confirmation_token, ''),
    recovery_token           = COALESCE(recovery_token, ''),
    email_change_token_new   = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    email_change             = COALESCE(email_change, ''),
    phone_change             = COALESCE(phone_change, ''),
    phone_change_token       = COALESCE(phone_change_token, ''),
    reauthentication_token   = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR reauthentication_token IS NULL;

-- Kontroll: skal vise 0 rader med NULL igjen
SELECT count(*) AS brukere_med_null
FROM auth.users
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change IS NULL;
