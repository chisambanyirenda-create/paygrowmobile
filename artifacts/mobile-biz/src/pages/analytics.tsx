import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetDashboardSummary, useGetTopProducts, GetDashboardSummaryPeriod } from "@workspace/api-client-react";
import { BarChart3, Boxes, CircleDollarSign, Percent, ShoppingCart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatZMW } from "@/lib/utils";

export default function Analytics() {
  const [period, setPeriod] = useState<GetDashboardSummaryPeriod>("month");
  const { data: summary } = useGetDashboardSummary({ period }, { query: { queryKey: ["analytics-summary", period] } });
  const { data: products } = useGetTopProducts({ limit: 10, period: period === "today" ? "week" : period }, { query: { queryKey: ["analytics-top", period] } });
  const margin = summary?.totalRevenue ? (summary.netProfit / summary.totalRevenue) * 100 : 0;
  const avgSale = summary?.totalSales ? summary.totalRevenue / summary.totalSales : 0;
  const avgProfit = summary?.totalProductsSold ? summary.totalProfit / summary.totalProductsSold : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div><h2 className="text-3xl font-bold tracking-tight text-white">Analytics</h2><p className="text-muted-foreground mt-2 text-sm">Understand what is actually driving profit.</p></div>
          <Select value={period} onValueChange={(v) => setPeriod(v as GetDashboardSummaryPeriod)}><SelectTrigger className="w-44 bg-card border-white/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This week</SelectItem><SelectItem value="month">This month</SelectItem><SelectItem value="year">This year</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent></Select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric icon={CircleDollarSign} label="Revenue" value={formatZMW(summary?.totalRevenue ?? 0)} />
          <Metric icon={TrendingUp} label="Gross profit" value={formatZMW(summary?.totalProfit ?? 0)} tone="emerald" />
          <Metric icon={Percent} label="Profit margin" value={`${margin.toFixed(1)}%`} tone="amber" />
          <Metric icon={ShoppingCart} label="Avg. sale" value={formatZMW(avgSale)} tone="violet" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel border-0 lg:col-span-2"><div className="p-5 border-b border-white/[0.05]"><h3 className="font-bold text-white">Performance snapshot</h3></div><CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Snapshot label="Phones sold" value={String(summary?.totalProductsSold ?? 0)} />
            <Snapshot label="Transactions" value={String(summary?.totalSales ?? 0)} />
            <Snapshot label="Avg. profit / phone" value={formatZMW(avgProfit)} />
            <Snapshot label="Operating expenses" value={formatZMW(summary?.totalExpenses ?? 0)} />
          </CardContent></Card>
          <Card className="glass-panel border-0"><CardContent className="p-5 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Boxes className="w-6 h-6 text-primary" /></div><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Inventory value</p><p className="text-2xl font-black font-mono text-white mt-1">{formatZMW(summary?.inventoryValue ?? 0)}</p><p className="text-xs text-muted-foreground mt-1">{summary?.totalProducts ?? 0} products listed</p></div></CardContent></Card>
        </div>
        <Card className="glass-panel border-0"><div className="p-5 border-b border-white/[0.05] flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><h3 className="font-bold text-white">Model performance</h3></div><CardContent className="p-0">{!products?.length ? <p className="p-6 text-sm text-muted-foreground">No sales data for this period.</p> : <div className="divide-y divide-white/[0.05]">{products.map((product, i) => <div key={product.productId} className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3 min-w-0"><span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{i + 1}</span><div className="min-w-0"><p className="font-bold text-white truncate">{product.productName}</p><p className="text-xs text-muted-foreground">{product.unitsSold} units · {product.category}</p></div></div><div className="text-right shrink-0"><p className="font-mono font-bold text-emerald-400">{formatZMW(product.profit)}</p><p className="text-[10px] text-muted-foreground">profit · {formatZMW(product.revenue)} revenue</p></div></div>)}</div>}</CardContent></Card>
      </div>
    </Layout>
  );
}
function Metric({ icon: Icon, label, value, tone = "cyan" }: { icon: React.ElementType; label: string; value: string; tone?: "cyan" | "emerald" | "amber" | "violet" }) {
  const color = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-300" : tone === "violet" ? "text-violet-300" : "text-primary";
  return <Card className="glass-panel border-0"><CardContent className="p-4"><Icon className={`w-4 h-4 ${color} mb-3`} /><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p><p className="text-xl font-black font-mono text-white mt-1">{value}</p></CardContent></Card>;
}
function Snapshot({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05]"><p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p><p className="text-base font-black font-mono text-white mt-2">{value}</p></div>;
}