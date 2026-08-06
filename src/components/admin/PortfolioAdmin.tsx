import { useState } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Holding } from "@/hooks/usePortfolioData";

interface PortfolioAdminProps {
  holdings: Holding[];
  onRefresh: () => void;
}

const PortfolioAdmin = ({ holdings, onRefresh }: PortfolioAdminProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    quantity: "",
    purchase_price: "",
    holding_type: "stock",
    sector: "",
    exchange: "OSE",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      ticker: "",
      name: "",
      quantity: "",
      purchase_price: "",
      holding_type: "stock",
      sector: "",
      exchange: "OSE",
    });
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
      const { error } = await supabase.from("portfolio_holdings").insert([{
        ticker: formData.ticker.toUpperCase(),
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price) || 0,
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
