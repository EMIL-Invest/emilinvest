import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from "lucide-react";
import { LeaderboardEntry } from "@/hooks/useCompetition";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentParticipantId?: string;
  periodLabel: string;
}

const LeaderboardTable = ({ entries, currentParticipantId, periodLabel }: LeaderboardTableProps) => {
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
            {entries.slice(0, 10).map((entry) => (
              <TableRow 
                key={entry.participant_id}
                className={entry.participant_id === currentParticipantId ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.display_name}</span>
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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeaderboardTable;
