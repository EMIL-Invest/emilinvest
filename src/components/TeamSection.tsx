import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import teamPhoto from "@/assets/team-photo.jpg";
import joinPhoto from "@/assets/join-photo.jpg";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
}

/**
 * Deler medlemmene i grupper etter rollenavnet. Rekkefølgen innad i
 * hver gruppe følger sort_order fra databasen, som før.
 */
const grupperMedlemmer = (members: TeamMember[]) => {
  const erAnalytiker = (r: string) => /analytiker/i.test(r);
  const erAnsvarsrolle = (r: string) => /leder|ansvarlig|økonomi/i.test(r);

  const grupper = [
    { navn: "Ledelse og ansvarsroller", medlemmer: members.filter((m) => erAnsvarsrolle(m.role)) },
    { navn: "Analytikere", medlemmer: members.filter((m) => !erAnsvarsrolle(m.role) && erAnalytiker(m.role)) },
    { navn: "Medlemmer", medlemmer: members.filter((m) => !erAnsvarsrolle(m.role) && !erAnalytiker(m.role)) },
  ].filter((g) => g.medlemmer.length > 0);

  // Har alle samme gruppe (eller rollene ikke matcher mønstrene),
  // er inndelingen bare støy - da vises én samlet liste uten overskrift.
  return grupper.length > 1 ? grupper : [{ navn: "Komiteen", medlemmer: members }];
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .join("")
    .toUpperCase();

const TeamSection = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setMembers(data);
      }
    };
    fetchMembers();
  }, []);

  return (
    <section id="team" className="py-24">
      <div className="section-container">
        <div className="text-center mb-16">
          <p className="eyebrow mb-5">Komiteen</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Møt komiteen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vi er rundt 15 engasjerte studenter som forvalter linjeforeningens
            midler sammen - og lærer finans i praksis mens vi gjør det.
          </p>
        </div>

        {/* Team Photo */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto rounded-md overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <img
              src={teamPhoto}
              alt="EMIL Invest-komiteen samlet"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Medlemmene - gruppert etter rolle, med rolige kort.
            Grupperingen leser rollenavnet: analytikere for seg,
            ansvarsroller (leder, økonomi, IT osv.) for seg, resten
            som medlemmer. Grupper uten folk vises ikke. */}
        <div className="space-y-12">
          {grupperMedlemmer(members).map((gruppe) => (
            <div key={gruppe.navn}>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap">
                  {gruppe.navn}
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {gruppe.medlemmer.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-md border border-border bg-card p-5 text-center"
                  >
                    <Avatar className="w-20 h-20 mx-auto mb-3">
                      {member.photo_url && (
                        <AvatarImage src={member.photo_url} alt={member.name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-serif font-semibold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-serif font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bli med-boksen - som før: avrundet felt med gradient fra logoen */}
        <div
          className="mt-16 rounded-2xl overflow-hidden text-primary-foreground shadow-card"
          style={{ background: "var(--gradient-brand)" }}
        >
          <div className="grid md:grid-cols-2 items-stretch">
            <div className="md:max-h-[420px] overflow-hidden">
              <img
                src={joinPhoto}
                alt="EMIL Invest-komiteen - den uformelle varianten"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3">
                Vil du bli med?
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto md:mx-0">
                Er du student på energi og miljø og nysgjerrig på finans? Vi
                rekrutterer hver høst - ta kontakt, så forteller vi mer!
              </p>
              <div>
                <a
                  href="mailto:kontakt@emilinvest.no"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary font-medium hover:bg-white/90 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Kontakt oss
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
