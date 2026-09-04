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
    <section id="team" className="pt-24">
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

        {/* Medlemmene - rene avatarer med navn og rolle, ingen kort */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10">
          {members.map((member) => (
            <div key={member.id} className="text-center">
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

      {/* Bli med-feltet - mørkegrønt kant til kant, bilde mot tekst */}
      <div className="mt-20" style={{ background: "hsl(var(--band))" }}>
        <div className="grid md:grid-cols-2 items-stretch">
          <div className="md:max-h-[420px] overflow-hidden">
            <img
              src={joinPhoto}
              alt="EMIL Invest-komiteen - den uformelle varianten"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center text-primary-foreground">
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3">
              Vil du bli med?
            </h3>
            <p className="text-primary-foreground/75 mb-7 max-w-xl">
              Er du student på energi og miljø og nysgjerrig på finans? Vi
              rekrutterer hver høst - ta kontakt, så forteller vi mer!
            </p>
            <div>
              <a
                href="mailto:kontakt@emilinvest.no"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] bg-competition text-competition-foreground font-medium hover:bg-competition/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Kontakt oss
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
