import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  getGetMoneySummaryQueryKey,
  getListWithdrawalsQueryKey,
  useCreateWithdrawal,
  useDeleteWithdrawal,
  useGetMoneySummary,
  useListWithdrawals,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calculator,
  CircleCheck,
  CircleX,
  Landmark,
  Loader2,
  LockKeyhole,
  Package,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn, formatZMW } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);
const GUARD_SETTINGS_KEY = "mobitrack-money-guard-settings";

const categories = [
  ["new_phone_stock", "New phone stock"],
  ["shipping", "Shipping"],
  ["repairs", "Repairs"],
  ["accessories", "Accessories"],
  ["advertising", "Advertising"],
  ["transport", "Transport"],
  ["business_equipment", "Business equipment"],
  ["personal", "Personal spending"],
  ["other", "Other"],
] as const;

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "cyan",
  helper,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "cyan" | "emerald" | "amber" | "violet" | "red";
  helper: string;
}) {
  const colors = {
    cyan: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber: "text-amber-300 bg-amber-300/10 border-amber-300/20",
    violet: "text-violet-300 bg-violet-300/10 border-violet-300/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return (
    <Card className="glass-panel border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
            <p className={cn("text-2xl font-black font-mono mt-2", tone === "red" ? "text-red-400" : tone === "emerald" ? "text-emerald-400" : "text-white")}>{formatZMW(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{helper}</p>
          </div>
          <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center", colors[tone])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GuardValue({ label, value, helper, tone = "white" }: { label: string; value: string; helper: string; tone?: "white" | "amber" | "emerald" | "red" | "violet" | "cyan" }) {
  return (
    <div className="p-4 rounded-xl bg-black/20 border border-white/[0.06]">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className={cn("text-xl font-black font-mono mt-2", tone === "amber" && "text-amber-300", tone === "emerald" && "text-emerald-400", tone === "red" && "text-red-400", tone === "violet" && "text-violet-300", tone === "cyan" && "text-primary", tone === "white" && "text-white")}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{helper}</p>
    </div>
  );
}

export default function Money() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: summary } = useGetMoneySummary({ query: { queryKey: getGetMoneySummaryQueryKey() } });
  const { data: withdrawals, isLoading: withdrawalsLoading } = useListWithdrawals({ query: { queryKey: getListWithdrawalsQueryKey() } });
  const createWithdrawal = useCreateWithdrawal();
  const deleteWithdrawal = useDeleteWithdrawal();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number][0]>("personal");
  const [date, setDate] = useState(today);
  const [emergencyReserve, setEmergencyReserve] = useState("1000");
  const [targetPhones, setTargetPhones] = useState("");
  const [strictMode, setStrictMode] = useState(true);
  const [plannedSpend, setPlannedSpend] = useState("");
  const [spendChecked, setSpendChecked] = useState(false);
  const [withdrawalChecked, setWithdrawalChecked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GUARD_SETTINGS_KEY) ?? "{}") as Partial<{ emergencyReserve: string; targetPhones: string; strictMode: boolean }>;
      if (typeof saved.emergencyReserve === "string") setEmergencyReserve(saved.emergencyReserve);
      if (typeof saved.targetPhones === "string") setTargetPhones(saved.targetPhones);
      if (typeof saved.strictMode === "boolean") setStrictMode(saved.strictMode);
    } catch {
      // Keep safe defaults when browser storage is unavailable or malformed.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(GUARD_SETTINGS_KEY, JSON.stringify({ emergencyReserve, targetPhones, strictMode }));
  }, [emergencyReserve, targetPhones, strictMode]);

  const s = summary;
  const cash = s?.cashAvailable ?? 0;
  const stockCost = s?.stockCost ?? 0;
  const phonesInStock = s?.phonesInStock ?? 0;
  const averageLandedCost = phonesInStock > 0 ? stockCost / phonesInStock : 0;
  const target = Math.max(phonesInStock, Number(targetPhones) || phonesInStock);
  const reserve = Math.max(0, Number(emergencyReserve) || 0);
  const protectedStockCapital = Math.max(stockCost, target * averageLandedCost);
  const safeToSpend = Math.max(0, cash - protectedStockCapital - reserve);
  const planned = Math.max(0, Number(plannedSpend) || 0);
  const canSpend = planned <= safeToSpend;
  const maxSafeWithdrawal = safeToSpend;
  const nextStockTargetCost = target * averageLandedCost;
  const amountNeededForTarget = Math.max(0, nextStockTargetCost - stockCost);
  const maxAdditionalPhones = averageLandedCost > 0 ? Math.floor(safeToSpend / averageLandedCost) : 0;
  const recommendedReinvestment = maxAdditionalPhones * averageLandedCost;

  const submitWithdrawal = (confirmed = false) => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || !reason.trim()) {
      toast({ title: "Enter an amount and reason", description: "Both fields are required.", variant: "destructive" });
      return;
    }

    const exceedsGuard = parsed > maxSafeWithdrawal;
    if (strictMode && exceedsGuard && !confirmed) {
      const proceed = window.confirm(`STOP — this spending exceeds your safe limit of ${formatZMW(maxSafeWithdrawal)}. It can affect protected stock capital. Continue anyway?`);
      if (!proceed) return;
      confirmed = true;
    }

    createWithdrawal.mutate({ data: { amount: parsed, reason: reason.trim(), category, date, confirm: confirmed || exceedsGuard } }, {
      onSuccess: (result) => {
        qc.invalidateQueries({ queryKey: getGetMoneySummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        setAmount("");
        setReason("");
        setCategory("personal");
        if (result.warning) {
          toast({ title: "Recorded with a capital warning", description: `Cash would fall below ${formatZMW(result.requiredReplacementCapital)} needed to replace current stock.`, variant: "destructive" });
        } else {
          toast({ title: "Spending recorded", description: "The Business Money Guard has been updated." });
        }
      },
      onError: (error) => {
        const data = (error as { data?: { warning?: boolean; cashAvailableAfter?: number; requiredReplacementCapital?: number } })?.data;
        if (data?.warning && window.confirm(`Careful: this would leave recorded cash at ${formatZMW(data.cashAvailableAfter ?? 0)}, below the ${formatZMW(data.requiredReplacementCapital ?? 0)} needed to replace your stock. Continue anyway?`)) {
          submitWithdrawal(true);
          return;
        }
        if (!data?.warning) toast({ title: "Could not record spending", variant: "destructive" });
      },
    });
  };

  const removeWithdrawal = (id: number) => {
    if (!window.confirm("Delete this spending record?")) return;
    deleteWithdrawal.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMoneySummaryQueryKey() });
        qc.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      },
      onError: () => toast({ title: "Could not delete spending record", variant: "destructive" }),
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 page-enter">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">Business Money Guard</h2>
            {strictMode && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-amber-200"><LockKeyhole className="w-3 h-3" /> Strict mode</span>}
          </div>
          <p className="text-muted-foreground mt-2 text-sm">Separate protected stock capital, safe-to-spend money, and your emergency reserve.</p>
        </div>

        {cash < protectedStockCapital && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-400/30">
            <AlertTriangle className="w-5 h-5 text-red-300 mt-0.5" />
            <div>
              <p className="font-black text-red-200">STOP — THIS MONEY IS PROTECTED FOR STOCK.</p>
              <p className="text-sm text-red-100/70 mt-1">Current recorded cash is below the {formatZMW(protectedStockCapital)} required for your current stock and target. Do not treat inventory value or expected profit as spendable cash.</p>
            </div>
          </div>
        )}

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05] flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Three-money system</h3>
              <p className="text-xs text-muted-foreground mt-1">These figures never combine inventory value with cash.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} className="accent-cyan-400" />
              Strict mode
            </label>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GuardValue label="Protected stock capital" value={formatZMW(protectedStockCapital)} helper={`Target: ${target} phones at ${formatZMW(averageLandedCost)} average landed cost`} tone="amber" />
              <GuardValue label="Safe-to-spend amount" value={formatZMW(safeToSpend)} helper="Cash less protected capital and emergency reserve" tone={safeToSpend > 0 ? "emerald" : "red"} />
              <GuardValue label="Emergency business reserve" value={formatZMW(reserve)} helper="Repairs, returns, shipping changes, and surprises" tone="violet" />
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold space-y-2">Emergency reserve (K)<Input type="number" min="0" step="0.01" value={emergencyReserve} onChange={(e) => setEmergencyReserve(e.target.value)} className="bg-background border-white/10 normal-case tracking-normal font-normal" /></label>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold space-y-2">Target phones<Input type="number" min={phonesInStock} step="1" placeholder={String(phonesInStock)} value={targetPhones} onChange={(e) => setTargetPhones(e.target.value)} className="bg-background border-white/10 normal-case tracking-normal font-normal" /></label>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Calculation</p><p className="text-sm font-bold text-white mt-2">{formatZMW(cash)} cash − {formatZMW(protectedStockCapital)} protected − {formatZMW(reserve)} reserve</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Business cash" value={cash} icon={Wallet} tone={cash < 0 ? "red" : "emerald"} helper="Recorded cash after sales, expenses & spending" />
          <MetricCard label="Stock cost" value={stockCost} icon={Package} tone="amber" helper="Money tied up in current inventory" />
          <MetricCard label="Realized gross profit" value={s?.realizedGrossProfit ?? 0} icon={Banknote} tone="cyan" helper="Revenue minus landed cost of sold phones" />
          <MetricCard label="Business capital" value={s?.businessCapital ?? 0} icon={Landmark} tone="violet" helper="Stock cost plus recorded cash" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel border-0">
            <div className="p-5 border-b border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Can I afford this?</h3>
              <p className="text-xs text-muted-foreground mt-1">Check spending against protected capital before money leaves the business.</p>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <GuardValue label="Business cash" value={formatZMW(cash)} helper="Money actually available" />
                <GuardValue label="Safe to spend" value={formatZMW(safeToSpend)} helper="Never below zero" tone={safeToSpend > 0 ? "emerald" : "red"} />
              </div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold space-y-2 block">I want to spend (K)<Input type="number" min="0" step="0.01" value={plannedSpend} onChange={(e) => { setPlannedSpend(e.target.value); setSpendChecked(false); }} placeholder="Enter amount" className="bg-background border-white/10 normal-case tracking-normal font-normal" /></label>
              <Button onClick={() => setSpendChecked(true)} className="w-full font-black tracking-wide"><Calculator className="w-4 h-4 mr-2" /> CAN I AFFORD THIS?</Button>
              {spendChecked && (
                <div className={cn("rounded-xl border p-4", canSpend ? "border-emerald-400/30 bg-emerald-400/10" : "border-red-400/30 bg-red-500/10")}>
                  <div className="flex items-start gap-3">
                    {canSpend ? <CircleCheck className="w-5 h-5 text-emerald-400 mt-0.5" /> : <CircleX className="w-5 h-5 text-red-300 mt-0.5" />}
                    <div>
                      <p className={cn("font-black", canSpend ? "text-emerald-200" : "text-red-200")}>{canSpend ? "YES — SAFE TO SPEND" : "NO — DO NOT SPEND"}</p>
                      <p className="text-sm text-white mt-1">{canSpend ? `You can spend up to ${formatZMW(safeToSpend)}.` : `You would exceed your safe spending limit by ${formatZMW(planned - safeToSpend)}.`}</p>
                      <p className="text-xs text-muted-foreground mt-1">{canSpend ? `Remaining safe-to-spend money: ${formatZMW(safeToSpend - planned)}` : "Your protected stock capital would be affected."}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-0">
            <div className="p-5 border-b border-white/[0.05]">
              <h3 className="font-bold text-white flex items-center gap-2"><ArrowDownLeft className="w-4 h-4 text-primary" /> Profit withdrawal calculator</h3>
              <p className="text-xs text-muted-foreground mt-1">The maximum safe withdrawal protects stock, reserve, and recorded expenses.</p>
            </div>
            <CardContent className="p-5">
              <Button variant="outline" onClick={() => setWithdrawalChecked((value) => !value)} className="w-full border-primary/30 text-primary hover:bg-primary/10 font-black"><Wallet className="w-4 h-4 mr-2" /> HOW MUCH CAN I TAKE OUT?</Button>
              {withdrawalChecked && (
                <div className="mt-4 rounded-xl bg-black/20 border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-end justify-between gap-3"><span className="text-sm text-muted-foreground">Maximum safe withdrawal</span><span className="text-2xl font-black font-mono text-emerald-400">{formatZMW(maxSafeWithdrawal)}</span></div>
                  <p className="text-xs text-muted-foreground">If you withdraw this amount, {formatZMW(protectedStockCapital)} remains protected for stock and {formatZMW(reserve)} remains reserved for emergencies.</p>
                  <div className="grid grid-cols-2 gap-3"><GuardValue label="Stock protected" value={formatZMW(protectedStockCapital)} helper="Must remain in business" tone="amber" /><GuardValue label="Reserve protected" value={formatZMW(reserve)} helper="Unexpected business costs" tone="violet" /></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Next stock order</h3><p className="text-xs text-muted-foreground mt-1">Reinvest only the amount left after protecting the business.</p></div>
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <GuardValue label="Current cash" value={formatZMW(cash)} helper="Actual cash" />
            <GuardValue label="Protected capital" value={formatZMW(protectedStockCapital)} helper="Stock target" tone="amber" />
            <GuardValue label="Available money" value={formatZMW(safeToSpend)} helper="Safe to spend" tone="emerald" />
            <GuardValue label="Average landed cost" value={formatZMW(averageLandedCost)} helper="Per phone" />
            <GuardValue label="Max additional phones" value={String(maxAdditionalPhones)} helper="At average cost" tone="emerald" />
            <GuardValue label="Recommended reinvestment" value={formatZMW(recommendedReinvestment)} helper={`Cash after: ${formatZMW(cash - recommendedReinvestment)}`} tone="cyan" />
          </CardContent>
        </Card>

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> Business discipline indicators</h3><p className="text-xs text-muted-foreground mt-1">Facts from your records, not an arbitrary score.</p></div>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Indicator label="Stock capital protected" yes={cash >= protectedStockCapital} />
            <Indicator label="Emergency reserve maintained" yes={cash - protectedStockCapital >= reserve} />
            <Indicator label="Spending within limit" yes={planned <= safeToSpend} />
            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.06]"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Next stock target</p><p className="text-lg font-black font-mono text-white mt-2">{formatZMW(nextStockTargetCost)}</p><p className="text-[10px] text-muted-foreground mt-1">Amount needed: {formatZMW(amountNeededForTarget)}</p></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel border-0 lg:col-span-2">
            <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white">Money position</h3><p className="text-xs text-muted-foreground mt-1">Unsold inventory value and expected profit are not spendable cash.</p></div>
            <CardContent className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["Stock value", s?.stockValue ?? 0, "Expected selling value, not cash"],
                ["Potential profit", s?.potentialProfit ?? 0, "Expected value less stock cost"],
                ["Revenue", s?.totalRevenue ?? 0, "Completed sales"],
                ["Operating expenses", s?.operatingExpenses ?? 0, "Recorded business expenses"],
                ["Personal spending", s?.personalWithdrawals ?? 0, "Money taken out"],
                ["Phones sold", s?.phonesSold ?? 0, "Completed units"],
              ].map(([label, value, helper]) => (
                <div key={label as string} className="p-3 rounded-xl bg-black/20 border border-white/[0.05]">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label as string}</p>
                  <p className="text-lg font-black font-mono text-white mt-2">{typeof value === "number" && label !== "Phones sold" ? formatZMW(value) : value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{helper as string}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel border-0">
            <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-primary" /> Record spending</h3><p className="text-xs text-muted-foreground mt-1">Strict mode warns before a personal withdrawal affects protected money.</p></div>
            <CardContent className="p-5 space-y-3">
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (K)" className="bg-background border-white/10" />
              <select value={category} onChange={(e) => setCategory(e.target.value as (typeof categories)[number][0])} className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-white">
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason or note" className="bg-background border-white/10" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background border-white/10" />
              <Button onClick={() => submitWithdrawal()} disabled={createWithdrawal.isPending} className="w-full font-bold">
                {createWithdrawal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Record spending
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel border-0">
          <div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white">Spending history</h3></div>
          <CardContent className="p-0">
            {withdrawalsLoading ? <div className="p-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div> : !withdrawals?.length ? (
              <p className="p-6 text-sm text-muted-foreground">No spending records yet.</p>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {withdrawals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div><p className="text-sm font-bold text-white">{item.reason}</p><p className="text-xs text-muted-foreground">{categoryLabel(item.category)} · {item.date}</p></div>
                    <div className="flex items-center gap-4"><p className="font-mono font-bold text-amber-300">{formatZMW(item.amount)}</p><button onClick={() => removeWithdrawal(item.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete spending record"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function categoryLabel(value: string) {
  return categories.find(([key]) => key === value)?.[1] ?? "Other";
}

function Indicator({ label, yes }: { label: string; yes: boolean }) {
  return (
    <div className={cn("p-4 rounded-xl border", yes ? "bg-emerald-400/5 border-emerald-400/20" : "bg-red-500/5 border-red-400/20")}>
      <div className="flex items-center gap-2">{yes ? <CircleCheck className="w-4 h-4 text-emerald-400" /> : <CircleX className="w-4 h-4 text-red-300" />}<span className="text-sm font-bold text-white">{yes ? "YES" : "NO"}</span></div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
    </div>
  );
}