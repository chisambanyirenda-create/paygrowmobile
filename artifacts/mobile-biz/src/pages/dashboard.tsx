import { Layout } from "@/components/layout";
import { 
  useGetDashboardSummary, 
  useGetProfitLoss, 
  useGetSalesByCategory, 
  useGetLowStockProducts,
  useGetTopProducts,
  GetDashboardSummaryPeriod
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatZMW } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

function AnimatedNumber({ value, formatter }: { value: number, formatter?: (val: number) => React.ReactNode }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return <>{formatter ? formatter(displayValue) : Math.round(displayValue)}</>;
}

export default function Dashboard() {
  const [period, setPeriod] = useState<GetDashboardSummaryPeriod>('week');

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ period }, { query: { queryKey: ['dashboard', period] } });
  const { data: profitLoss, isLoading: isLoadingPL } = useGetProfitLoss({ period: period === 'today' || period === 'all' ? 'week' : period }, { query: { queryKey: ['profit-loss', period] } });
  const { data: salesByCategory, isLoading: isLoadingCategory } = useGetSalesByCategory({ period: period === 'today' ? 'week' : period }, { query: { queryKey: ['sales-category', period] } });
  const { data: lowStock, isLoading: isLoadingStock } = useGetLowStockProducts();
  const { data: topProducts, isLoading: isLoadingTop } = useGetTopProducts({ limit: 5, period: period === 'today' ? 'week' : period }, { query: { queryKey: ['top-products', period] } });

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">
        
        {/* Hero strip */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-card to-card border border-border relative overflow-hidden flex flex-col justify-center px-8 py-8 mb-2">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent bg-[length:20px_20px] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-emerald-500 opacity-80"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-1 text-glow-cyan">Good morning, Chief.</h2>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
            </div>
            <div className="flex items-center gap-8 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Period Revenue</span>
                <span className="text-xl font-mono font-bold text-white">
                  {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : <AnimatedNumber value={summary?.totalRevenue || 0} formatter={(v) => formatZMW(v)} />}
                </span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Period Profit</span>
                <span className="text-xl font-mono font-bold text-[#ffcc00] text-glow-gold">
                  {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : <AnimatedNumber value={summary?.netProfit || 0} formatter={(v) => formatZMW(v)} />}
                </span>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Items Sold</span>
                <span className="text-xl font-mono font-bold text-[#b470ff] text-glow-violet">
                  {isLoadingSummary ? <Skeleton className="h-6 w-16" /> : <AnimatedNumber value={summary?.totalProductsSold || 0} formatter={(v) => Math.round(v).toString()} />}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector (Segmented) */}
        <div className="flex justify-end">
          <div className="inline-flex items-center bg-card p-1 rounded-lg border border-border">
            {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                  period === p 
                    ? 'bg-primary/20 text-primary border border-primary/50 shadow-[0_0_10px_-2px_hsl(var(--primary))]' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {p.replace('all', 'all time')}
              </button>
            ))}
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass border-0 relative overflow-hidden card-accent-cyan stat-glow-cyan">
            <CardContent className="p-6 relative z-10">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Revenue</h3>
              <div className="text-3xl font-black font-mono text-white text-glow-cyan mb-3 whitespace-nowrap overflow-hidden">
                {isLoadingSummary ? <Skeleton className="h-8 w-[120px]" /> : <AnimatedNumber value={summary?.totalRevenue || 0} formatter={(v) => formatZMW(v)} />}
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
                From {summary?.totalSales || 0} transactions
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass border-0 relative overflow-hidden card-accent-gold stat-glow-gold">
            <CardContent className="p-6 relative z-10">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Net Profit</h3>
              <div className="text-3xl font-black font-mono text-[#ffcc00] text-glow-gold mb-3 whitespace-nowrap overflow-hidden">
                {isLoadingSummary ? <Skeleton className="h-8 w-[120px]" /> : <AnimatedNumber value={summary?.netProfit || 0} formatter={(v) => formatZMW(v)} />}
              </div>
              <Badge variant="outline" className="bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20 font-mono text-[10px]">
                After operating costs
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass border-0 relative overflow-hidden card-accent-violet stat-glow-violet">
            <CardContent className="p-6 relative z-10">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Products Sold</h3>
              <div className="text-3xl font-black font-mono text-[#b470ff] text-glow-violet mb-3 whitespace-nowrap overflow-hidden">
                {isLoadingSummary ? <Skeleton className="h-8 w-[80px]" /> : <AnimatedNumber value={summary?.totalProductsSold || 0} />}
              </div>
              <Badge variant="outline" className="bg-[#b470ff]/10 text-[#b470ff] border-[#b470ff]/20 font-mono text-[10px]">
                {salesByCategory?.length || 0} categories
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass border-0 relative overflow-hidden card-accent-emerald stat-glow-emerald">
            <CardContent className="p-6 relative z-10">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Customers</h3>
              <div className="text-3xl font-black font-mono text-emerald-400 text-glow-emerald mb-3 whitespace-nowrap overflow-hidden">
                {isLoadingSummary ? <Skeleton className="h-8 w-[80px]" /> : <AnimatedNumber value={summary?.totalCustomers || 0} />}
              </div>
              <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 font-mono text-[10px]">
                Active this period
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Main Chart */}
          <Card className="glass-panel border-0 lg:col-span-2">
            <div className="p-6 pb-2 border-b border-white/[0.05]">
              <h3 className="font-bold text-white text-lg">Revenue vs Expenses</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Performance over selected period</p>
            </div>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                {isLoadingPL ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full bg-white/[0.02]" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitLoss || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1}/>
                          <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `K${val/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(10px)', borderColor: 'hsl(var(--primary)/0.5)', borderRadius: '12px', boxShadow: '0 0 20px -5px hsl(var(--primary)/0.3)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="revenue" fill="url(#cyanGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expenses" fill="url(#redGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Chart */}
          <Card className="glass-panel border-0">
            <div className="p-6 pb-2 border-b border-white/[0.05]">
              <h3 className="font-bold text-white text-lg">Sales by Category</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue distribution</p>
            </div>
            <CardContent className="p-6 flex flex-col h-[340px]">
              {isLoadingCategory ? (
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full bg-white/[0.02]" />
                </div>
              ) : (
                <>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByCategory || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="revenue"
                          nameKey="category"
                          stroke="none"
                        >
                          {(salesByCategory || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(10px)', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                          formatter={(val: number) => formatZMW(val)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black text-white font-mono">{formatZMW(summary?.totalRevenue || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {(salesByCategory || []).map((entry, index) => (
                      <div key={entry.category} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-xs text-muted-foreground capitalize">{entry.category}</span>
                        <span className="text-xs font-bold text-white font-mono">{Math.round((entry.revenue / (summary?.totalRevenue || 1)) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Low Stock Alerts */}
          <Card className="glass-panel border-0 lg:col-span-1 relative overflow-hidden card-accent-red">
            <div className="p-6 pb-4 border-b border-white/[0.05] relative z-10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-destructive text-lg text-glow-red">Stock Alerts</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Inventory Levels</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
                <span className="text-destructive font-bold">{lowStock?.length || 0}</span>
              </div>
            </div>
            <CardContent className="p-4 relative z-10">
              {isLoadingStock ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full bg-white/[0.02]" />)}
                </div>
              ) : lowStock?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3 border border-border">
                    <span className="text-emerald-500 font-bold text-xl">✓</span>
                  </div>
                  <p className="text-sm">All inventory healthy.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {(lowStock || []).slice(0, 8).map(product => {
                    const isZero = product.stockQuantity === 0;
                    const percent = Math.min(100, Math.max(0, (product.stockQuantity / product.lowStockThreshold) * 100));
                    return (
                      <div key={product.id} className={`flex flex-col gap-2 p-3 rounded-xl border ${isZero ? 'bg-destructive/5 border-destructive/30' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className={`font-bold text-sm truncate ${isZero ? 'text-white' : 'text-white/90'}`}>{product.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
                          </div>
                          <Badge variant="outline" className={`font-mono text-[10px] shrink-0 ${isZero ? 'border-destructive text-destructive' : 'border-orange-500/50 text-orange-400'}`}>
                            {product.stockQuantity} left
                          </Badge>
                        </div>
                        <Progress value={percent} className={`h-1.5 ${isZero ? 'bg-destructive/20' : 'bg-orange-500/20'}`} indicatorColor={isZero ? 'bg-destructive' : 'bg-orange-500'} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products Race */}
          <Card className="glass-panel border-0 lg:col-span-2">
            <div className="p-6 pb-4 border-b border-white/[0.05]">
              <h3 className="font-bold text-white text-lg">Top Performers</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Highest revenue drivers</p>
            </div>
            <CardContent className="p-6">
              {isLoadingTop ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full bg-white/[0.02]" />)}
                </div>
              ) : !topProducts?.length ? (
                <div className="text-center py-12 text-muted-foreground">No sales data for this period.</div>
              ) : (
                <div className="space-y-6">
                  {topProducts.map((product, i) => {
                    const maxRev = topProducts[0]?.revenue || 1;
                    const percent = Math.max(2, (product.revenue / maxRev) * 100);
                    return (
                      <div key={product.productId} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-end text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-xs font-bold text-muted-foreground">{(i+1).toString().padStart(2, '0')}</span>
                            <span className="font-bold text-white">{product.productName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted-foreground font-mono">{product.unitsSold} units</span>
                          </div>
                          <div className="flex gap-4 text-right">
                            <span className="font-mono text-[10px] text-[#ffcc00]">Profit: {formatZMW(product.profit)}</span>
                            <span className="font-bold text-primary font-mono">{formatZMW(product.revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-300"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}