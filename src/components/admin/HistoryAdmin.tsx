import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HistoryPoint } from "@/hooks/usePortfolioData";

interface HistoryAdminProps {
  history: HistoryPoint[];
  onRefresh: () => void;
}

const HistoryAdmin = ({ history, onRefresh }: HistoryAdminProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    portfolio_value: "",
    osebx_value: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from("portfolio_history").insert([{
        date: formData.date,
        portfolio_value: parseFloat(formData.portfolio_value) || 0,
        osebx_value: formData.osebx_value ? parseFloat(formData.osebx_value) : null,
      }]);

      if (error) throw error;

      toast({
        title: "Historikk lagt til!",
        description: `Data for ${formData.date} er lagret.`,
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        portfolio_value: "",
        osebx_value: "",
      });
      setShowAddForm(false);
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (date: string) => {
    try {
      const { error } = await supabase
        .from("portfolio_history")
        .delete()
        .eq("date", date);

      if (error) throw error;

      toast({
        title: "Slettet",
        description: `Data for ${date} er fjernet.`,
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Sort history by date descending for display
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Historiske verdier
            </CardTitle>
            <CardDescription>
              Legg til daglige porteføljeverdier for å vise i grafen
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Legg til
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <h4 className="font-medium mb-4">Legg til historisk verdi</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Dato</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="portfolio_value">Porteføljeverdi (kr)</Label>
                <Input
                  id="portfolio_value"
                  type="number"
                  step="0.01"
                  value={formData.portfolio_value}
                  onChange={(e) => setFormData({ ...formData, portfolio_value: e.target.value })}
                  placeholder="100000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="osebx_value">OSEBX-verdi (valgfritt)</Label>
                <Input
                  id="osebx_value"
                  type="number"
                  step="0.01"
                  value={formData.osebx_value}
                  onChange={(e) => setFormData({ ...formData, osebx_value: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Lagrer..." : "Legg til"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Avbryt
              </Button>
            </div>
          </form>
        )}

        {/* History List */}
        {sortedHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ingen historiske data lagt til ennå.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    Dato
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">
                    Portefølje
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">
                    OSEBX
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">
                    
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((item) => (
                  <tr key={item.date} className="border-b border-border/50">
                    <td className="py-2 px-3 text-sm">
                      {new Date(item.date).toLocaleDateString("no-NO")}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium">
                      {item.portfolio_value.toLocaleString("no-NO")} kr
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-muted-foreground">
                      {item.osebx_value 
                        ? `${item.osebx_value.toLocaleString("no-NO")} kr`
                        : "-"
                      }
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.date)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryAdmin;
