import { useState } from "react";
import { Plus, Trash2, Edit2, Save, X, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Holding, StockQuote } from "@/hooks/usePortfolioData";

interface PortfolioAdminProps {
  holdings: Holding[];
  quotes: Record<string, StockQuote>;
  onRefresh: () => void;
}

const iDag = () => new Date().toISOString().slice(0, 10);

const tomtSkjema = {
  ticker: "",
  name: "",
  quantity: "",
  purchase_price: "",
  holding_type: "stock",
  sector: "",
  exchange: "OSE",
  purchase_date: iDag(),
};

const PortfolioAdmin = ({ holdings, quotes, onRefresh }: PortfolioAdminProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(tomtSkjema);
  const [saving, setSaving] = useState(false);
  const [visKostpris, setVisKostpris] = useState(false);
  const [nullstiller, setNullstiller] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({ ...tomtSkjema, purchase_date: iDag() });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(parseFloat(formData.quantity) > 0)) {
      toast({ title: "Ugyldig antall", description: "Antall må være større enn 0.", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const antall = parseFloat(formData.quantity);
      const kurs = parseFloat(formData.purchase_price) || 0;

      const { error } = await supabase.from("portfolio_holdings").insert([{
        ticker: formData.ticker.toUpperCase(),
        name: formData.name,
        quantity: antall,
        purchase_price: kurs,
        // cost_basis må skrives, ikke bare purchase_price: grafene leser
        // cost_basis først og faller bare tilbake på kurs × antall når den
        // er tom. Uten denne linjen ble kjøpsprisen du taster inn
        // ignorert på alle posisjoner som allerede hadde en cost_basis.
        cost_basis: antall * kurs,
        purchase_date: formData.purchase_date || null,
        holding_type: formData.holding_type,
        sector: formData.sector || null,
        exchange: formData.holding_type === "stock" ? formData.exchange : null,
      }]);

      if (error) throw error;

      toast({
        title: "Lagt til!",
        description: `${formData.name} er lagt til i porteføljen.`,
      });
      resetForm();
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

  const handleEdit = (holding: Holding) => {
    setEditingId(holding.id);
    setFormData({
      ticker: holding.ticker,
      name: holding.name,
      quantity: holding.quantity.toString(),
      purchase_price: holding.purchase_price.toString(),
      holding_type: holding.holding_type,
      sector: holding.sector || "",
      exchange: holding.exchange || "OSE",
      purchase_date: holding.purchase_date || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!(parseFloat(formData.quantity) > 0)) {
      toast({ title: "Ugyldig antall", description: "Antall må være større enn 0.", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase
        .from("portfolio_holdings")
        .update({
          ticker: formData.ticker.toUpperCase(),
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          purchase_price: parseFloat(formData.purchase_price) || 0,
          // Samme grunn som i handleAdd: cost_basis må følge kjøpsprisen,
          // ellers måler grafene fortsatt mot det gamle tallet.
          cost_basis: parseFloat(formData.quantity) * (parseFloat(formData.purchase_price) || 0),
          purchase_date: formData.purchase_date || null,
          holding_type: formData.holding_type,
          sector: formData.sector || null,
          exchange: formData.holding_type === "stock" ? formData.exchange : null,
        })
        .eq("id", editingId);

      if (error) throw error;

      toast({
        title: "Oppdatert!",
        description: `${formData.name} er oppdatert.`,
      });
      resetForm();
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette ${name} fra porteføljen?`)) return;
    try {
      const { error } = await supabase
        .from("portfolio_holdings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Slettet",
        description: `${name} er fjernet fra porteføljen.`,
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

  const stocks = holdings.filter(h => h.holding_type === "stock");
  const funds = holdings.filter(h => h.holding_type === "fund");

  /**
   * Forslag til nye kostpriser: dagens kurs for hver aksje.
   * Brukes når posisjonene nettopp er kjøpt, slik at «Avkastning per
   * aksje» starter på null og bare måler endringen fra kjøpet og framover.
   */
  const kostprisforslag = stocks.map((h) => {
    const kurs = quotes[h.ticker]?.price ?? null;
    const gammel = h.cost_basis ?? h.purchase_price * h.quantity;
    return {
      holding: h,
      kurs,
      gammelKostpris: gammel,
      nyKostpris: kurs !== null ? kurs * h.quantity : null,
      // Slik grafen ser posisjonen i dag, altså det utslaget som forsvinner.
      utslag: kurs !== null && gammel > 0 ? ((kurs * h.quantity) / gammel - 1) * 100 : null,
    };
  });
  const utenKurs = kostprisforslag.filter((f) => f.kurs === null);

  const nullstillKostpriser = async () => {
    const klare = kostprisforslag.filter((f) => f.kurs !== null);
    if (klare.length === 0) {
      toast({
        title: "Ingen kurser tilgjengelig",
        description: "Kursene må lastes før kostprisene kan settes. Prøv å oppdatere siden.",
        variant: "destructive",
      });
      return;
    }
    if (!window.confirm(
      `Setter kostpris til dagens kurs for ${klare.length} ${klare.length === 1 ? "aksje" : "aksjer"} ` +
      `og kjøpsdato til i dag. Avkastningen per aksje starter da på null. Fortsette?`
    )) return;

    setNullstiller(true);
    const feilet: string[] = [];
    for (const f of klare) {
      const { error } = await supabase
        .from("portfolio_holdings")
        .update({
          purchase_price: f.kurs as number,
          cost_basis: f.nyKostpris as number,
          purchase_date: iDag(),
        })
        .eq("id", f.holding.id);
      if (error) feilet.push(`${f.holding.ticker}: ${error.message}`);
    }
    setNullstiller(false);

    if (feilet.length) {
      toast({
        title: "Noen posisjoner ble ikke oppdatert",
        description: feilet.join(" · "),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Kostprisene er nullstilt",
        description: `${klare.length} ${klare.length === 1 ? "aksje" : "aksjer"} måles nå fra dagens kurs.`,
      });
      setVisKostpris(false);
    }
    onRefresh();
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif">Porteføljeadministrasjon</CardTitle>
            <CardDescription>Legg til, rediger eller fjern aksjer og fond</CardDescription>
          </div>
          {!showAddForm && !editingId && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Legg til
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <form 
            onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(); } : handleAdd} 
            className="p-4 rounded-lg bg-muted/50 border border-border mb-6"
          >
            <h4 className="font-medium mb-4">
              {editingId ? "Rediger holding" : "Legg til ny holding"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="holding_type">Type</Label>
                <Select 
                  value={formData.holding_type} 
                  onValueChange={(v) => setFormData({ ...formData, holding_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Aksje</SelectItem>
                    <SelectItem value="fund">Fond</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticker">Ticker / ID</Label>
                <Input
                  id="ticker"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  placeholder="f.eks. AAPL"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Navn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="f.eks. Apple Inc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">
                  {formData.holding_type === "stock" ? "Antall aksjer" : "Antall andeler"}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_price">
                  {formData.holding_type === "stock" ? "Kjøpspris per aksje" : "Verdi per andel"}
                </Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_date">
                  {formData.holding_type === "stock" ? "Kjøpsdato" : "Startdato"}
                </Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utgangspunktet avkastningen måles fra.
                </p>
              </div>
              <div>
                <Label htmlFor="sector">Sektor / Kategori</Label>
                <Input
                  id="sector"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="f.eks. Teknologi"
                />
              </div>
              {formData.holding_type === "stock" && (
                <div>
                  <Label htmlFor="exchange">Børs</Label>
                  <Select 
                    value={formData.exchange} 
                    onValueChange={(v) => setFormData({ ...formData, exchange: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OSE">Oslo Børs</SelectItem>
                      <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                      <SelectItem value="NYSE">NYSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Lagrer..." : editingId ? "Oppdater" : "Legg til"}
                {!saving && (editingId ? <Save className="w-4 h-4 ml-2" /> : <Plus className="w-4 h-4 ml-2" />)}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
            </div>
          </form>
        )}

        {/* Kostpriser - utgangspunktet grafene måler fra */}
        {stocks.length > 0 && !showAddForm && !editingId && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <h4 className="font-medium text-sm mb-1">Kostpriser</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  «Avkastning per aksje» måler dagens kurs mot kostprisen på
                  posisjonen. Er aksjene nettopp kjøpt til omtrent dagens kurs,
                  skal utslaget være nær null - viser grafen store tall, står
                  det gamle kjøpskurser i basen.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setVisKostpris(!visKostpris)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                {visKostpris ? "Skjul" : "Sett til dagens kurs"}
              </Button>
            </div>

            {visKostpris && (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground text-left">
                        <th className="py-2 pr-4 font-medium">Aksje</th>
                        <th className="py-2 pr-4 font-medium text-right">Kostpris nå</th>
                        <th className="py-2 pr-4 font-medium text-right">Dagens kurs</th>
                        <th className="py-2 pr-4 font-medium text-right">Ny kostpris</th>
                        <th className="py-2 font-medium text-right">Utslag i dag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kostprisforslag.map((f) => (
                        <tr key={f.holding.id} className="border-t border-border/50">
                          <td className="py-2 pr-4">{f.holding.ticker}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {Math.round(f.gammelKostpris).toLocaleString("no-NO")} kr
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {f.kurs === null ? "-" : `${f.kurs.toLocaleString("no-NO")} kr`}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {f.nyKostpris === null
                              ? "-"
                              : `${Math.round(f.nyKostpris).toLocaleString("no-NO")} kr`}
                          </td>
                          <td className={`py-2 text-right tabular-nums ${
                            f.utslag === null ? "" : f.utslag >= 0 ? "text-emerald-700" : "text-destructive"
                          }`}>
                            {f.utslag === null
                              ? "-"
                              : `${f.utslag >= 0 ? "+" : ""}${f.utslag.toFixed(1).replace(".", ",")} %`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {utenKurs.length > 0 && (
                  <p className="flex items-start gap-2 text-xs text-muted-foreground mt-3">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Mangler kurs for {utenKurs.map((f) => f.holding.ticker).join(", ")}. Disse
                      blir stående som de er - sett kjøpsprisen manuelt under «Rediger».
                    </span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm" onClick={nullstillKostpriser} disabled={nullstiller}>
                    {nullstiller ? "Oppdaterer…" : "Bekreft - sett kostpris og kjøpsdato til i dag"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setVisKostpris(false)}>
                    Avbryt
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Vet du hva komiteen faktisk betalte, er det bedre å skrive inn
                  kjøpskursen og kjøpsdatoen per aksje under «Rediger». Da måler
                  grafen fra det virkelige kjøpet i stedet for fra i dag.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Holdings List */}
        <div className="space-y-6">
          {/* Stocks */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Aksjer ({stocks.length})
            </h4>
            {stocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen aksjer lagt til.</p>
            ) : (
              <div className="space-y-2">
                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{stock.ticker}</Badge>
                      <div>
                        <p className="font-medium text-sm">{stock.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stock.quantity} aksjer @ {stock.purchase_price.toLocaleString("no-NO")} kr
                          {stock.sector && ` • ${stock.sector}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kostpris {Math.round(stock.cost_basis ?? stock.purchase_price * stock.quantity).toLocaleString("no-NO")} kr
                          {stock.purchase_date
                            ? ` • kjøpt ${new Date(stock.purchase_date).toLocaleDateString("no-NO", {
                                day: "numeric", month: "short", year: "numeric",
                              })}`
                            : " • kjøpsdato ikke satt"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(stock)}
                        disabled={!!editingId}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(stock.id, stock.name)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Funds */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Fond ({funds.length})
            </h4>
            {funds.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen fond lagt til.</p>
            ) : (
              <div className="space-y-2">
                {funds.map((fund) => (
                  <div
                    key={fund.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{fund.sector || "Fond"}</Badge>
                      <div>
                        <p className="font-medium text-sm">{fund.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Verdi: {(fund.purchase_price * fund.quantity).toLocaleString("no-NO")} kr
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fund)}
                        disabled={!!editingId}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(fund.id, fund.name)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioAdmin;
