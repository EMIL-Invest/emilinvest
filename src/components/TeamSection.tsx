import { Linkedin, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import teamPhoto from "@/assets/team-photo.jpg";
import henrikPhoto from "@/assets/henrik-heierstad.png";

const teamMembers = [
  { name: "Kristian Hove", role: "Leder", initials: "KH" },
  { name: "Henrik Heierstad", role: "Nestleder", initials: "HH", image: henrikPhoto },
  { name: "Daniel Dowsett", role: "Ex. Nestleder", initials: "DD" },
  { name: "Tom-Vegar Moen", role: "Analytiker", initials: "TM" },
  { name: "Sondre Pettersen", role: "Analytiker", initials: "SP" },
  { name: "Anne Håkanes", role: "SOME-ansvarlig", initials: "AH" },
  { name: "Andreas Dahl Jørgensen", role: "Analytiker", initials: "AJ" },
  { name: "Erik Munch-Finne", role: "Analytiker", initials: "EM" },
  { name: "Adrian Andersen", role: "Analytiker", initials: "AA" },
  { name: "Henrik Kvennås", role: "Analytiker", initials: "HK" },
  { name: "Jakob Wigulf Christensen", role: "Økonomiansvarlig", initials: "JC" },
  { name: "Vinh Diep", role: "Logistikk-ansvarlig", initials: "VD" },
  { name: "Erik Nysæther", role: "Bedriftskontakt", initials: "EN" },
  { name: "Gustav Stockholm", role: "Forvalter", initials: "GS" },
  { name: "Marie Rogn Kværnes", role: "Støttemedlem", initials: "MK" },
  { name: "Johannes Lyssand Mjelde", role: "IT-ansvarlig", initials: "JM" },
];

const TeamSection = () => {
  return (
    <section id="team" className="py-24 bg-secondary/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Teamet
          </Badge>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Møt komiteen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vi er en gruppe engasjerte studenter som brenner for bærekraftige
            investeringer og økonomisk forståelse.
          </p>
        </div>

        {/* Team Photo */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-elevated">
            <img 
              src={teamPhoto} 
              alt="EMIL Invest teamet samlet" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="glass-card group hover:shadow-elevated transition-all duration-300"
            >
              <CardContent className="pt-6 text-center">
                <Avatar className="w-14 h-14 mx-auto mb-3 bg-primary text-primary-foreground">
                  {member.image && (
                    <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-serif font-semibold">
                    {member.initials}
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
        <div className="mt-16 text-center p-8 rounded-2xl bg-card border border-border shadow-card">
          <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
            Vil du bli med?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Er du student på energi og miljø og interessert i
            bærekraftige investeringer? Ta kontakt med oss!
          </p>
          <a
            href="mailto:Henrikb.heierstad@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
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
