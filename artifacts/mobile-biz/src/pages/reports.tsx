import { Layout } from "@/components/layout";
import { 
  useGetDashboardSummary, 
  useGetProfitLoss, 
  useGetSalesByCategory,
  useGetTopProducts,
  GetDashboardSummaryPeriod
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatZMW } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const [period, setPeriod] = useState<GetDashboardSummaryPeriod>('year');

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ period }, { query: { queryKey: ['reports-summary', period] } });
  const { data: profitLoss, isLoading: isLoadingPL } = useGetProfitLoss({ period: period === 'today' || period === 'all' ? 'year' : period }, { query: { queryKey: ['reports-pl', period] } });
  const { data: salesByCategory, isLoading: isLoadingCategory } = useGetSalesByCategory({ period: period === 'today' ? 'week' : period }, { query: { queryKey: ['reports-category', period] } });
  const { data: topProducts, isLoading: isLoadingTop } = useGetTopProducts({ limit: 10, period: period === 'today' ? 'week' : period }, { query: { queryKey: ['reports-top', period] } });

  const marginPercentage = summary?.totalRevenue ? ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Financial Reports
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Deep dive into business performance and margins.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select value={period} onValueChange={(v) => setPeriod(v as GetDashboardSummaryPeriod)}>
                <SelectTrigger className="bg-card border-white/10">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" title="Print Report" className="border-white/10 hover:bg-white/10"><Printer className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" title="Export CSV" className="border-white/10 hover:bg-white/10"><Download className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* P&L Waterfall Card */}
        <div className="w-full rounded-2xl bg-[#070b14] border border-white/[0.05] p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]">
           <div className="absolute right-0 top-0 w-64 h-64 bg-[#ffcc00]/5 rounded-full blur-[100px] pointer-events-none"></div>
           
           <div className="flex-1 flex flex-col items-center text-center">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Revenue</span>
             {isLoadingSummary ? <Skeleton className="h-10 w-32 bg-white/5" /> : (
               <span className="text-3xl font-black font-mono text-white">{formatZMW(summary?.totalRevenue || 0)}</span>
             )}
           </div>

           <div className="w-full md:w-auto flex flex-col items-center gap-2">
             <div className="w-px h-8 bg-white/10 md:rotate-0 rotate-90"></div>
             <span className="w-6 h-6 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center text-xs font-bold font-mono border border-white/10">-</span>
             <div className="w-px h-8 bg-white/10 md:rotate-0 rotate-90"></div>
           </div>

           <div className="flex-1 flex flex-col items-center text-center">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">COGS</span>
             {isLoadingSummary ? <Skeleton className="h-10 w-32 bg-white/5" /> : (
               <span className="text-3xl font-black font-mono text-muted-foreground">{formatZMW(summary?.totalCost || 0)}</span>
             )}
           </div>

           <div className="w-full md:w-auto flex flex-col items-center gap-2">
             <div className="w-px h-8 bg-white/10 md:rotate-0 rotate-90"></div>
             <span className="w-6 h-6 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center text-xs font-bold font-mono border border-white/10">-</span>
             <div className="w-px h-8 bg-white/10 md:rotate-0 rotate-90"></div>
           </div>

           <div className="flex-1 flex flex-col items-center text-center">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Expenses</span>
             {isLoadingSummary ? <Skeleton className="h-10 w-32 bg-white/5" /> : (
               <span className="text-3xl font-black font-mono text-destructive text-glow-red">{formatZMW(summary?.totalExpenses || 0)}</span>
             )}
           </div>

           <div className="w-full md:w-auto flex flex-col items-center gap-2">
             <div className="w-px h-8 bg-[#ffcc00]/20 md:rotate-0 rotate-90"></div>
             <span className="w-8 h-8 rounded-full bg-[#ffcc00]/20 text-[#ffcc00] flex items-center justify-center text-lg font-black font-mono border border-[#ffcc00]/30 shadow-[0_0_15px_-3px_hsl(45_100%_50%/0.5)]">=</span>
             <div className="w-px h-8 bg-[#ffcc00]/20 md:rotate-0 rotate-90"></div>
           </div>

           <div className="flex-1 flex flex-col items-center text-center relative z-10">
             <span className="text-[10px] font-bold text-[#ffcc00] uppercase tracking-widest mb-2">Net Profit</span>
             {isLoadingSummary ? <Skeleton className="h-12 w-40 bg-white/5" /> : (
               <div className="flex flex-col items-center gap-1">
                 <span className="text-4xl font-black font-mono text-[#ffcc00] text-glow-gold">{formatZMW(summary?.netProfit || 0)}</span>
                 <Badge variant="outline" className="mt-2 bg-[#ffcc00]/10 text-[#ffcc00] border-[#ffcc00]/20 font-mono text-xs shadow-[0_0_10px_-2px_hsl(45_100%_50%/0.3)]">{marginPercentage}% Margin</Badge>
               </div>
             )}
           </div>
        </div>

        {/* Growth Chart */}
        <Card className="glass-panel border-0">
          <div className="p-6 pb-2 border-b border-white/[0.05]">
            <h3 className="font-bold text-white text-lg">Profit & Loss Trend</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Visualizing revenue growth vs expense accumulation</p>
          </div>
          <CardContent className="p-6">
            <div className="h-[400px] w-full">
              {isLoadingPL ? (
                 <div className="h-full flex items-center justify-center"><Skeleton className="h-full w-full bg-white/[0.02]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitLoss || []} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#ffcc00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `K${val/1000}k`} />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(10px)', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', fontFamily: 'monospace' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}
                      formatter={(val: number) => formatZMW(val)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" strokeWidth={3} />
                    <Area type="monotone" dataKey="profit" stroke="#ffcc00" fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Performance */}
          <Card className="glass-panel border-0">
            <div className="p-6 pb-2 border-b border-white/[0.05]">
              <h3 className="font-bold text-white text-lg">Category Performance</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue and profit by product family</p>
            </div>
            <CardContent className="p-6">
              <div className="h-[350px] w-full">
                {isLoadingCategory ? (
                   <div className="h-full flex items-center justify-center"><Skeleton className="h-full w-full bg-white/[0.02]" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCategory || []} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barRev" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="barProf" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ffcc00" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#ffcc00" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `K${val/1000}k`} />
                      <YAxis dataKey="category" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} style={{ textTransform: 'capitalize' }} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card)/0.9)', backdropFilter: 'blur(10px)', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', fontFamily: 'monospace' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}
                        formatter={(val: number) => formatZMW(val)}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="url(#barRev)" radius={[0, 4, 4, 0]} maxBarSize={24} />
                      <Bar dataKey="profit" name="Profit" fill="url(#barProf)" radius={[0, 4, 4, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Products Table */}
          <Card className="glass-panel border-0">
            <div className="p-6 pb-4 border-b border-white/[0.05]">
              <h3 className="font-bold text-white text-lg">Top Products by Profit</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">The items driving the business</p>
            </div>
            <CardContent className="p-0">
               {isLoadingTop ? (
                 <div className="p-6 space-y-4">
                   {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full bg-white/[0.02]" />)}
                 </div>
               ) : !topProducts?.length ? (
                  <div className="text-center py-20 text-muted-foreground">No sales data for this period.</div>
               ) : (
                 <div className="divide-y divide-white/[0.05]">
                   {[...topProducts].sort((a,b) => b.profit - a.profit).slice(0,10).map((product, i) => (
                     <div key={product.productId} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs ${i === 0 ? 'bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/30 shadow-[0_0_10px_-2px_hsl(45_100%_50%/0.4)]' : i === 1 ? 'bg-zinc-300/20 text-zinc-300 border border-zinc-300/30' : i === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' : 'bg-white/5 text-muted-foreground'}`}>
                            {i+1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white tracking-tight">{product.productName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{product.unitsSold} units sold</p>
                          </div>
                       </div>
                       <div className="text-right">
                         <p className="text-base font-black font-mono text-[#ffcc00] text-glow-gold">{formatZMW(product.profit)}</p>
                         <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Rev: <span className="text-primary">{formatZMW(product.revenue)}</span></p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}