import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Calendar, Banknote, RefreshCw } from "lucide-react";
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

interface CapitalFlow {
  id: string;
  flow_date: string;
  amount: number;
  note: string | null;
}

/**
 * Innskudd/uttak av penger føres her — og KUN her. Aksjebytter skal aldri
 * registreres som kapitalflyt. Daily-snapshot leser summen av disse radene
 * som «investert kapital», som gjør at avkastningsgrafen (TWR) ikke
 * påvirkes av at komiteen får tilført mer penger.
 */
const CapitalFlowsAdmin = () => {
  const [flows, setFlows] = useState<CapitalFlow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    flow_date: new Date().toISOString().split("T")[0],
    amount: "",
    note: "",
  });
  const { toast } = useToast();

  // capital_flows er ikke med i de genererte typene ennå — bruk untyped klient.
  const db = supabase as unknown as {
    from: (t: string) => ReturnType<typeof supabase.from>;
  };

  const fetchFlows = useCallback(async () => {
    const { data, error } = await db
      .from("capital_flows")
      .select("*")
      .order("flow_date", { ascending: false });
    if (!error && data) setFlows(data as unknown as CapitalFlow[]);
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await db.from("capital_flows").insert([
        {
          flow_date: form.flow_date,
          amount: parseFloat(form.amount),
          note: form.note || null,
        },
      ] as never);
      if (error) throw error;
      toast({
        title: "Kapitalflyt registrert",
        description: "Avkastningsmålingen tar nå hensyn til beløpet.",
      });
      setForm({ flow_date: new Date().toISOString().split("T")[0], amount: "", note: "" });
      setShowForm(false);
      fetchFlows();
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (flow: CapitalFlow) => {
    if (!window.confirm("Slette denne kapitalflyten?")) return;
    const { error } = await db.from("capital_flows").delete().eq("id", flow.id);
    if (error) {
      toast({ title: "Feil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slettet" });
      fetchFlows();
    }
  };

  const total = flows.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <Card className="glass-card mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Innskudd og uttak
            </CardTitle>
            <CardDescription>
              Registrer penger inn/ut av porteføljen — dette holder
              avkastningsprosenten riktig. Aksjebytter skal IKKE føres her.
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleAdd} className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="flow_date">Dato</Label>
                <Input
                  id="flow_date"
                  type="date"
                  value={form.flow_date}
                  onChange={(e) => setForm({ ...form, flow_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Beløp (kr)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="40000 (negativt = uttak)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="note">Notat (valgfritt)</Label>
                <Input
                  id="note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="F.eks. «Tilskudd fra EMIL høst 2026»"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Lagrer..." : "Registrer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        )}

        {flows.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            Ingen kapitalflyt registrert ennå.
          </p>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Dato</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Beløp</th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Notat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {flows.map((flow) => (
                  <tr key={flow.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-sm">
                      {new Date(flow.flow_date).toLocaleDateString("no-NO")}
                    </td>
                    <td className={`py-2 px-3 text-sm text-right font-medium ${Number(flow.amount) < 0 ? "text-destructive" : ""}`}>
                      {Number(flow.amount).toLocaleString("no-NO")} kr
                    </td>
                    <td className="py-2 px-3 text-sm text-muted-foreground">{flow.note || "–"}</td>
                    <td className="py-2 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(flow)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground mt-3 text-right">
              Total innskutt kapital: <span className="font-semibold text-foreground">{total.toLocaleString("no-NO")} kr</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const HistoryAdmin = ({ history, onRefresh }: HistoryAdminProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    portfolio_value: "",
    osebx_value: "",
    invested_capital: "",
  });
  const [saving, setSaving] = useState(false);
  const [tarSnapshot, setTarSnapshot] = useState(false);
  const { toast } = useToast();

  /**
   * Kjør daily-snapshot manuelt — samme funksjon som cron-jobben kaller
   * hverdager kl. 10. Funksjonen godtar innloggede administratorer, så
   * dette virker uten cron-hemmeligheten. Brukes når en kjøring har
   * feilet, eller etter en nullstilling for å få første datapunkt inn
   * med én gang.
   */
  const taSnapshotNaa = async () => {
    setTarSnapshot(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-snapshot", { body: {} });
      if (error) throw error;
      toast({
        title: "Snapshot lagret",
        description: data?.portfolioValue
          ? `Porteføljeverdi ${Number(data.portfolioValue).toLocaleString("no-NO")} kr er lagt inn for i dag.`
          : "Dagens datapunkt er lagt inn.",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Snapshot feilet",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setTarSnapshot(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from("portfolio_history").insert([{
        date: formData.date,
        portfolio_value: parseFloat(formData.portfolio_value) || 0,
        osebx_value: formData.osebx_value ? parseFloat(formData.osebx_value) : null,
        invested_capital: formData.invested_capital ? parseFloat(formData.invested_capital) : null,
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
        invested_capital: "",
      });
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (date: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette historikken for ${date}?`)) return;
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
    } catch (error) {
      toast({
        title: "Feil",
        description: error instanceof Error ? error.message : "Ukjent feil",
        variant: "destructive",
      });
    }
  };

  // Sort history by date descending for display
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={taSnapshotNaa} disabled={tarSnapshot}>
                <RefreshCw className={`w-4 h-4 mr-2 ${tarSnapshot ? "animate-spin" : ""}`} />
                {tarSnapshot ? "Henter kurser…" : "Ta snapshot nå"}
              </Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          «Ta snapshot nå» henter dagens kurser og lagrer dagens datapunkt —
          det samme som den automatiske jobben gjør hverdager kl. 10.
        </p>
      </CardHeader>
      <CardContent>
        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
            <h4 className="font-medium mb-4">Legg til historisk verdi</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <Label htmlFor="invested_capital">Investert kapital (valgfritt)</Label>
                <Input
                  id="invested_capital"
                  type="number"
                  step="0.01"
                  value={formData.invested_capital}
                  onChange={(e) => setFormData({ ...formData, invested_capital: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              «Investert kapital» brukes til å skille innskudd fra avkastning i grafen.
              Oppgi total innskutt kapital per denne datoen — uten den antas ingen
              kapitalendring siden forrige punkt.
            </p>
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
    <CapitalFlowsAdmin />
    </>
  );
};

export default HistoryAdmin;
