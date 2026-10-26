import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Den innloggedes deltaker-id, hvis hen er med i konkurransen.
 * null = ikke innlogget eller ikke påmeldt; undefined = vet ikke ennå.
 */
export const useMinDeltaker = () => {
  const [deltakerId, setDeltakerId] = useState<string | null | undefined>(undefined);
  const [innlogget, setInnlogget] = useState(false);

  useEffect(() => {
    let aktiv = true;
    const slaaOpp = async (userId: string | undefined) => {
      if (!userId) {
        if (aktiv) {
          setInnlogget(false);
          setDeltakerId(null);
        }
        return;
      }
      setInnlogget(true);
      const { data } = await supabase
        .from("competition_participants")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();
      if (aktiv) setDeltakerId(data?.id ?? null);
    };
    supabase.auth.getSession().then(({ data: { session } }) => slaaOpp(session?.user?.id));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      slaaOpp(session?.user?.id);
    });
    return () => {
      aktiv = false;
      subscription.unsubscribe();
    };
  }, []);

  return { deltakerId, innlogget };
};
