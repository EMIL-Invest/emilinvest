import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import teamPhoto from "@/assets/team-photo.jpg";

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
    <section id="team" className="py-24 bg-secondary/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Komiteen
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Møt komiteen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vi er rundt 15 engasjerte studenter som forvalter linjeforeningens
            midler sammen — og lærer finans i praksis mens vi gjør det.
          </p>
        </div>

        {/* Team Photo */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-elevated">
            <img
              src={teamPhoto}
              alt="EMIL Invest-komiteen samlet"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {members.map((member) => (
            <Card
              key={member.id}
              className="glass-card group hover:shadow-elevated transition-all duration-300"
            >
              <CardContent className="pt-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  {member.photo_url && (
                    <AvatarImage src={member.photo_url} alt={member.name} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-serif font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-sm font-serif font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {member.role}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Join CTA */}
        <div className="mt-16 text-center p-8 rounded-2xl bg-primary text-primary-foreground shadow-card">
          <h3 className="text-2xl font-serif font-bold mb-3">
            Vil du bli med?
          </h3>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Er du student på energi og miljø og nysgjerrig på finans? Vi
            rekrutterer hver høst — ta kontakt, så forteller vi mer!
          </p>
          <a
            href="mailto:kontakt@emilinvest.no"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary font-medium hover:bg-white/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Kontakt oss
          </a>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
