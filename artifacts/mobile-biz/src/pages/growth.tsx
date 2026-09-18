import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGetMoneySummary, useListProducts } from "@workspace/api-client-react";
import { ArrowUpRight, Check, CircleDollarSign, Package, Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatZMW } from "@/lib/utils";

const TARGETS = [5, 10, 20, 50];

export default function Growth() {
  const { data: summary } = useGetMoneySummary();
  const { data: products } = useListProducts();
  const [desired, setDesired] = useState("10");
  const [withdraw, setWithdraw] = useState("0");
  const currentPhones = summary?.phonesInStock ?? 0;
  const stockCost = summary?.stockCost ?? 0;
  const averageCost = currentPhones > 0 ? stockCost / currentPhones : 0;
  const target = TARGETS.find((n) => n > currentPhones) ?? 50;
  const progress = Math.min(100, Math.round((currentPhones / target) * 100));
  const targetCost = target * averageCost;
  const capitalGap = Math.max(0, targetCost - (summary?.cashAvailable ?? 0));

  const calc = useMemo(() => {
    const cash = Math.max(0, (summary?.cashAvailable ?? 0) - Number(withdraw || 0));
    const unitCost = averageCost || 0;
    const desiredPhones = Math.max(0, Number(desired || 0));
    const affordable = unitCost > 0 ? Math.floor(cash / unitCost) : 0;
    const additional = Math.max(0, desiredPhones - currentPhones);
    const required = Math.max(0, additional * unitCost - cash);
    const estimatedRevenue = desiredPhones * (currentPhones > 0 && summary?.stockValue ? summary.stockValue / currentPhones : 0);
    return { cash, affordable, additional, required, estimatedRevenue, potentialProfit: estimatedRevenue - desiredPhones * unitCost };
  }, [summary, withdraw, desired, averageCost, currentPhones]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 page-enter">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Growth Plan</h2>
          <p className="text-muted-foreground mt-2 text-sm">Track the next inventory milestone without spending money needed to replace stock.</p>
        </div>

        <Card className="glass-panel border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Target className="w-8 h-8 text-primary" /></div>
              <div className="flex-1">
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div><p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Inventory milestone</p><p className="text-2xl font-black text-white mt-1">{currentPhones} / {target} phones</p></div>
                  <span className="text-primary font-black">{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-muted-foreground mt-3">{currentPhones >= target ? "Target reached. Choose your next level carefully." : `${target - currentPhones} more phones to reach your next target.`}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Capital gap</p>
                <p className="text-xl font-black font-mono text-amber-300 mt-1">{formatZMW(capitalGap)}</p>
                <p className="text-[10px] text-muted-foreground">for the next target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Package} label="Phones in stock" value={String(currentPhones)} />
          <Stat icon={CircleDollarSign} label="Business capital" value={formatZMW(summary?.businessCapital ?? 0)} />
          <Stat icon={TrendingUp} label="Stock value" value={formatZMW(summary?.stockValue ?? 0)} />
          <Stat icon={ArrowUpRight} label="Avg. landed cost" value={formatZMW(averageCost)} />
        </div>

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white">Reinvestment calculator</h3><p className="text-xs text-muted-foreground mt-1">Estimate a purchase without confusing cash with profit.</p></div>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Desired phones"><Input type="number" min="0" value={desired} onChange={(e) => setDesired(e.target.value)} className="bg-background border-white/10" /></Field>
            <Field label="Planned withdrawal"><Input type="number" min="0" value={withdraw} onChange={(e) => setWithdraw(e.target.value)} className="bg-background border-white/10" /></Field>
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05]"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Can afford</p><p className="text-2xl font-black text-emerald-400 mt-2">{calc.affordable} phones</p><p className="text-xs text-muted-foreground mt-1">after planned withdrawal</p></div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05]"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Additional capital</p><p className="text-2xl font-black text-amber-300 mt-2">{formatZMW(calc.required)}</p><p className="text-xs text-muted-foreground mt-1">to reach your goal</p></div>
            <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Mini label="Remaining cash" value={formatZMW(calc.cash)} />
              <Mini label="Estimated revenue" value={formatZMW(calc.estimatedRevenue)} />
              <Mini label="Estimated potential profit" value={formatZMW(calc.potentialProfit)} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white">Milestones</h3></div>
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {TARGETS.map((item) => {
              const reached = currentPhones >= item;
              return <div key={item} className={`p-4 rounded-xl border ${reached ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/[0.06] bg-black/20"}`}><div className="flex items-center gap-2">{reached ? <Check className="w-4 h-4 text-emerald-400" /> : <Target className="w-4 h-4 text-muted-foreground" />}<span className="font-black text-white">{item} phones</span></div><p className="text-xs text-muted-foreground mt-2">{reached ? "Target reached" : `${Math.max(0, item - currentPhones)} to go`}</p></div>;
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <Card className="glass-panel border-0"><CardContent className="p-4"><Icon className="w-4 h-4 text-primary mb-3" /><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p><p className="text-lg font-black font-mono text-white mt-1 truncate">{value}</p></CardContent></Card>;
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-xl bg-primary/5 border border-primary/10"><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p><p className="text-base font-black font-mono text-white mt-1">{value}</p></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold space-y-2 block">{label}{children}</label>;
}