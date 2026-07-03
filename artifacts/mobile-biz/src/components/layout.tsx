import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Receipt, 
  Truck, 
  BarChart3,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useGetLowStockProducts } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: lowStock } = useGetLowStockProducts();
  const lowStockCount = lowStock?.length || 0;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-border flex flex-col shrink-0 relative overflow-hidden" 
             style={{ background: 'linear-gradient(180deg, hsl(222 50% 4%) 0%, hsl(220 45% 6%) 100%)' }}>
        
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay z-0" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}>
        </div>

        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/[0.05] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_-5px_hsl(var(--primary))] relative">
              <div className="absolute inset-0 rounded-xl border border-primary/60 animate-[pulse-glow_3s_ease-in-out_infinite]"></div>
              <span className="font-black text-xl text-primary text-glow-cyan font-mono">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white leading-tight">MobiTrack</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Zambia</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto z-10">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            const isInventory = item.href === "/inventory";
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "text-white bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary" 
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-white border-l-2 border-transparent"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300 group-hover:scale-110",
                    isActive ? "text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" : ""
                  )} />
                  {isInventory && lowStockCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center border border-background shadow-[0_0_8px_-2px_hsl(var(--destructive))]">
                      <span className="text-[8px] font-black text-white leading-none">{lowStockCount > 9 ? '9+' : lowStockCount}</span>
                    </span>
                  )}
                </div>
                <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
                {isInventory && lowStockCount > 0 && !isActive && (
                  <span className="ml-auto text-[9px] font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                    LOW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom strip */}
        <div className="p-4 border-t border-white/[0.05] z-10">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
              <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">Live</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Owner View</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-[60px] flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl shrink-0 z-20 relative border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold capitalize text-white tracking-tight">
                {location === "/" ? "Dashboard" : location.split("/")[1].replace(/-/g, " ")}
              </h1>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-2">
                <span>app.mobitrack.zm</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                <span>{location === "/" ? "overview" : location.split("/")[1]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {lowStockCount > 0 && (
              <Link href="/inventory" className="flex items-center gap-1.5 text-[10px] font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-3 py-1.5 rounded-full border border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span>
                {lowStockCount} Low Stock
              </Link>
            )}
            <div className="text-right flex flex-col items-end">
              <span className="text-sm font-medium text-white font-mono">
                {currentTime.toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-ZM', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border border-primary/50 flex items-center justify-center font-bold relative group bg-background">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-sm group-hover:bg-primary/40 transition-all"></div>
              <div className="absolute inset-0 rounded-full border border-primary/50"></div>
              <span className="relative z-10 text-primary text-sm tracking-widest text-glow-cyan font-mono">AK</span>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        </header>
        <div className="flex-1 overflow-auto p-8 relative z-10 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
