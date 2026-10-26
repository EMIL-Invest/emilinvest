import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
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
    <section id="team" className="py-24">
      <div className="section-container">
        <div className="mb-14">
          <h2 className="text-4xl md:text-5xl font-serif font-normal text-primary mb-4">
            Møt komiteen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Vi er rundt 15 engasjerte studenter som forvalter linjeforeningens
            midler sammen - og lærer finans i praksis mens vi gjør det.
          </p>
        </div>

        {/* Gruppebildet står allerede øverst på forsiden, så her vises bare medlemmene. */}
        {/* Medlemmene - rolige kort i ett samlet rutenett */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {members.map((member) => (
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

        {/* Bli med-feltet: samme mørkegrønne flate som toppen, bilde med bue */}
        <div className="mt-16 overflow-hidden text-primary-foreground" style={{ background: "hsl(var(--band))" }}>
          <div className="grid md:grid-cols-2 items-stretch">
            <div className="md:max-h-[420px] overflow-hidden">
              <img
                src={joinPhoto}
                alt="EMIL Invest-komiteen - den uformelle varianten"
                className="w-full h-full object-cover"
                style={{ borderRadius: "0 50% 50% 0 / 0 34% 34% 0" }}
              />
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-serif font-normal mb-3">
                Vil du bli med?
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto md:mx-0">
                Er du student på energi og miljø og nysgjerrig på finans? Vi
                rekrutterer hver høst - ta kontakt, så forteller vi mer!
              </p>
              <div>
                <a
                  href="mailto:kontakt@emilinvest.no"
                  className="knapp-skraa inline-flex items-center gap-2 px-8 py-3.5 font-semibold hover:brightness-105 transition-[filter] focus-visible:underline"
                  style={{ background: "hsl(var(--competition))", color: "hsl(var(--competition-foreground))" }}
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
