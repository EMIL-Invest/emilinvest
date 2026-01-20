import { Linkedin, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const teamMembers = [
  {
    name: "Emma Nordahl",
    role: "Leder",
    study: "Energi og miljøteknikk, 4. år",
    initials: "EN",
    email: "emma@stud.ntnu.no",
    linkedin: "#",
  },
  {
    name: "Lars Eriksen",
    role: "Økonomiansvarlig",
    study: "Energi og miljøteknikk, 3. år",
    initials: "LE",
    email: "lars@stud.ntnu.no",
    linkedin: "#",
  },
  {
    name: "Ingrid Solberg",
    role: "Analytiker",
    study: "Energi og miljøteknikk, 4. år",
    initials: "IS",
    email: "ingrid@stud.ntnu.no",
    linkedin: "#",
  },
  {
    name: "Magnus Haugen",
    role: "Analytiker",
    study: "Energi og miljøteknikk, 3. år",
    initials: "MH",
    email: "magnus@stud.ntnu.no",
    linkedin: "#",
  },
  {
    name: "Sofia Andersen",
    role: "Kommunikasjonsansvarlig",
    study: "Energi og miljøteknikk, 2. år",
    initials: "SA",
    email: "sofia@stud.ntnu.no",
    linkedin: "#",
  },
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="glass-card group hover:shadow-elevated transition-all duration-300"
            >
              <CardContent className="pt-6 text-center">
                <Avatar className="w-20 h-20 mx-auto mb-4 bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-serif font-semibold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <Badge variant="outline" className="mb-2">
                  {member.role}
                </Badge>
                <p className="text-sm text-muted-foreground mb-4">
                  {member.study}
                </p>
                <div className="flex justify-center gap-3">
                  <a
                    href={`mailto:${member.email}`}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
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
            Er du student ved Energi- og miljøingeniør og interessert i
            bærekraftige investeringer? Ta kontakt med oss!
          </p>
          <a
            href="mailto:emilinvest@stud.ntnu.no"
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
