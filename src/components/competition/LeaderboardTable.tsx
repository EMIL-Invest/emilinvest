import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from "lucide-react";
import { KRAV_ANTALL_AKSJER, LeaderboardEntry, StockQuote } from "@/hooks/useCompetition";
import ParticipantPortfolioDialog from "./ParticipantPortfolioDialog";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentParticipantId?: string;
  periodLabel: string;
  quotes: Record<string, StockQuote>;
}

const LeaderboardTable = ({ entries, currentParticipantId, periodLabel, quotes }: LeaderboardTableProps) => {
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null);

  // Bare de som oppfyller diversifiseringskravet rangeres. De øvrige
  // vises i en egen gruppe under, med hva som mangler.
  const rangerte = entries.filter((e) => e.kvalifisert);
  const ikkeKvalifisert = entries.filter((e) => !e.kvalifisert);

  // Din egen rad hvis du er utenfor topp 10 — vises som egen rad nederst
  const ownEntryOutsideTop10 = currentParticipantId
    ? rangerte.find(e => e.participant_id === currentParticipantId && e.rank > 10)
    : undefined;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-primary" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-accent-foreground" />;
      default:
        return <span className="text-muted-foreground font-medium">{rank}</span>;
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Ingen deltakere ennå. Bli den første til å melde deg på!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top 10 {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Plass</TableHead>
                <TableHead>Deltaker</TableHead>
                <TableHead className="text-right">Porteføljeverdi</TableHead>
                <TableHead className="text-right">Avkastning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rangerte.slice(0, 10).map((entry) => (
                <TableRow 
                  key={entry.participant_id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    entry.participant_id === currentParticipantId ? "bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedParticipant({ 
                    id: entry.participant_id, 
                    name: entry.display_name 
                  })}
                >
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium hover:underline">{entry.display_name}</span>
                      {entry.participant_id === currentParticipantId && (
                        <Badge variant="secondary" className="text-xs">Deg</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.portfolio_value.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 font-medium ${
                      entry.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.return_percentage >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {entry.return_percentage >= 0 ? '+' : ''}
                      {entry.return_percentage.toFixed(2)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {ownEntryOutsideTop10 && (
                <>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-1">
                      ⋯
                    </TableCell>
                  </TableRow>
                  <TableRow
                    key={ownEntryOutsideTop10.participant_id}
                    className="cursor-pointer bg-primary/5 hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedParticipant({
                      id: ownEntryOutsideTop10.participant_id,
                      name: ownEntryOutsideTop10.display_name
                    })}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center w-8 h-8">
                        <span className="text-muted-foreground font-medium">{ownEntryOutsideTop10.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium hover:underline">{ownEntryOutsideTop10.display_name}</span>
                        <Badge variant="secondary" className="text-xs">Deg</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ownEntryOutsideTop10.portfolio_value.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-medium ${
                        ownEntryOutsideTop10.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {ownEntryOutsideTop10.return_percentage >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {ownEntryOutsideTop10.return_percentage >= 0 ? '+' : ''}
                        {ownEntryOutsideTop10.return_percentage.toFixed(2)}%
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>

          {rangerte.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 max-w-md mx-auto leading-relaxed">
              Ingen deltakere er kvalifisert ennå. Du kommer på ledertavlen når
              du eier minst {KRAV_ANTALL_AKSJER} ulike aksjer.
            </p>
          )}

          {ikkeKvalifisert.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Ikke kvalifisert ennå ({ikkeKvalifisert.length})
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-2xl leading-relaxed">
                For å bli rangert må porteføljen inneholde minst{" "}
                {KRAV_ANTALL_AKSJER} ulike aksjer. Konkurransen skal gi erfaring
                med å bygge en portefølje, ikke belønne den som satser alt på ett
                selskap og har flaks.
              </p>
              <ul className="space-y-2">
                {ikkeKvalifisert.map((e) => (
                  <li
                    key={e.participant_id}
                    className={`flex items-center justify-between gap-3 text-sm rounded-[4px] border border-border px-3 py-2 ${
                      e.participant_id === currentParticipantId ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{e.display_name}</span>
                      {e.participant_id === currentParticipantId && (
                        <Badge variant="secondary" className="text-xs">Deg</Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground tabular-nums flex-shrink-0">
                      {e.antall_aksjer} av {KRAV_ANTALL_AKSJER} aksjer
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipantPortfolioDialog
        open={!!selectedParticipant}
        onOpenChange={(open) => !open && setSelectedParticipant(null)}
        participantId={selectedParticipant?.id || ""}
        displayName={selectedParticipant?.name || ""}
        quotes={quotes}
      />
    </>
  );
};

export default LeaderboardTable;
