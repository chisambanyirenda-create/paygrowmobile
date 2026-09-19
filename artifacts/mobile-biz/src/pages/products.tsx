import { Layout } from "@/components/layout";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListSuppliers,
  getListProductsQueryKey,
  Product
} from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatZMW, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Box, BookOpen, X, ChevronRight, Smartphone, ArrowLeft, HardDrive, Check, Headphones } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { phoneCatalog, catalogBrands, CatalogPhone, StorageVariant } from "@/data/phone-catalog";
import { accessoriesCatalog, accessoryCategories, CatalogAccessory, AccessoryVariant } from "@/data/accessories-catalog";

// ─── Brand theme map ──────────────────────────────────────────────────────────
const brandTheme: Record<string, { border: string; bg: string; text: string; glow: string; fallbackBg: string }> = {
  Apple:    { border:"border-slate-400/25",   bg:"bg-slate-400/5",   text:"text-slate-200",   glow:"shadow-slate-400/10",  fallbackBg:"from-slate-700 to-slate-900" },
  Samsung:  { border:"border-blue-400/25",    bg:"bg-blue-400/5",    text:"text-blue-200",    glow:"shadow-blue-400/10",   fallbackBg:"from-blue-800 to-blue-950" },
  OPPO:     { border:"border-emerald-400/25", bg:"bg-emerald-400/5", text:"text-emerald-200", glow:"shadow-emerald-400/10",fallbackBg:"from-emerald-800 to-emerald-950" },
  Huawei:   { border:"border-red-400/25",     bg:"bg-red-400/5",     text:"text-red-200",     glow:"shadow-red-400/10",    fallbackBg:"from-red-800 to-red-950" },
  Google:   { border:"border-yellow-400/25",  bg:"bg-yellow-400/5",  text:"text-yellow-200",  glow:"shadow-yellow-400/10", fallbackBg:"from-yellow-700 to-yellow-950" },
  Tecno:    { border:"border-cyan-400/25",    bg:"bg-cyan-400/5",    text:"text-cyan-200",    glow:"shadow-cyan-400/10",   fallbackBg:"from-cyan-800 to-cyan-950" },
  Infinix:  { border:"border-purple-400/25",  bg:"bg-purple-400/5",  text:"text-purple-200",  glow:"shadow-purple-400/10", fallbackBg:"from-purple-800 to-purple-950" },
  Xiaomi:   { border:"border-orange-400/25",  bg:"bg-orange-400/5",  text:"text-orange-200",  glow:"shadow-orange-400/10", fallbackBg:"from-orange-800 to-orange-950" },
  Realme:   { border:"border-amber-400/25",   bg:"bg-amber-400/5",   text:"text-amber-200",   glow:"shadow-amber-400/10",  fallbackBg:"from-amber-700 to-amber-950" },
  OnePlus:  { border:"border-red-500/25",     bg:"bg-red-500/5",     text:"text-red-300",     glow:"shadow-red-500/10",    fallbackBg:"from-red-700 to-red-950" },
  Motorola: { border:"border-indigo-400/25",  bg:"bg-indigo-400/5",  text:"text-indigo-200",  glow:"shadow-indigo-400/10", fallbackBg:"from-indigo-800 to-indigo-950" },
  Nokia:    { border:"border-sky-400/25",     bg:"bg-sky-400/5",     text:"text-sky-200",     glow:"shadow-sky-400/10",    fallbackBg:"from-sky-800 to-sky-950" },
};
const brandEmoji: Record<string, string> = {
  Apple:"🍎", Samsung:"📱", OPPO:"🟢", Huawei:"📡", Google:"🔵",
  Tecno:"🌟", Infinix:"⚡", Xiaomi:"🔶", Realme:"💎", OnePlus:"🔴",
  Motorola:"〽️", Nokia:"🏔️",
};
const defaultTheme = { border:"border-white/10", bg:"bg-white/[0.02]", text:"text-white/80", glow:"shadow-white/5", fallbackBg:"from-gray-800 to-gray-950" };

// ─── Local AI-generated phone images ─────────────────────────────────────────
function getLocalPhoneImage(brand: string, model: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (brand === "Samsung") {
    if (model.startsWith("Galaxy Z")) return `${base}/phones/samsung-z.jpg`;
    if (model.startsWith("Galaxy A")) return `${base}/phones/samsung-a.jpg`;
    return `${base}/phones/samsung-s.jpg`;
  }
  const map: Record<string, string> = {
    Apple:    `${base}/phones/apple.jpg`,
    OPPO:     `${base}/phones/oppo.jpg`,
    Huawei:   `${base}/phones/huawei.jpg`,
    Google:   `${base}/phones/google.jpg`,
    Tecno:    `${base}/phones/tecno.jpg`,
    Infinix:  `${base}/phones/infinix.jpg`,
    Xiaomi:   `${base}/phones/xiaomi.jpg`,
    Realme:   `${base}/phones/realme.jpg`,
    OnePlus:  `${base}/phones/oneplus.jpg`,
    Motorola: `${base}/phones/motorola.jpg`,
    Nokia:    `${base}/phones/nokia.jpg`,
  };
  return map[brand] ?? `${base}/phones/samsung-s.jpg`;
}

// ─── Phone image with branded fallback ───────────────────────────────────────
function PhoneImage({ phone, className }: { phone: CatalogPhone; className?: string }) {
  const [failed, setFailed] = useState(false);
  const theme = brandTheme[phone.brand] ?? defaultTheme;
  const src = getLocalPhoneImage(phone.brand, phone.model);
  if (failed) {
    return (
      <div className={cn(`bg-gradient-to-b ${theme.fallbackBg} flex flex-col items-center justify-center gap-1`, className)}>
        <span className="text-2xl">{brandEmoji[phone.brand] ?? "📱"}</span>
        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider leading-tight text-center px-1">{phone.brand}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={phone.name}
      className={cn("object-contain bg-black/40", className)}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Accessories Catalog Dialog ──────────────────────────────────────────────
interface AccCatalogSelection {
  accessory: CatalogAccessory;
  variant: AccessoryVariant;
}

function AccessoriesCatalogDialog({ onSelect }: { onSelect: (sel: AccCatalogSelection) => void }) {
  const [open, setOpen] = useState(false);
  const [accSearch, setAccSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [picked, setPicked] = useState<CatalogAccessory | null>(null);
  const [pickedVariant, setPickedVariant] = useState<AccessoryVariant | null>(null);

  const filtered = useMemo(() => {
    const q = accSearch.toLowerCase().trim();
    return accessoriesCatalog.filter(a => {
      const matchCat = activeCategory === "All" || a.category === activeCategory;
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.subcategory.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [accSearch, activeCategory]);

  const reset = () => { setAccSearch(""); setActiveCategory("All"); setPicked(null); setPickedVariant(null); };

  const handleConfirm = () => {
    if (!picked || !pickedVariant) return;
    onSelect({ accessory: picked, variant: pickedVariant });
    setOpen(false);
    reset();
  };

  const cats = ["All", ...accessoryCategories];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold tracking-wide">
          <Headphones className="w-4 h-4 mr-2" /> Acc. Catalog
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col bg-[#070f1e] border-white/[0.08] p-0 gap-0">
        {!picked ? (
          <>
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-amber-400" />
                Accessories Catalog
                <span className="text-sm font-normal text-muted-foreground ml-1">— {accessoriesCatalog.length} items</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Pick an accessory and choose a variant to pre-fill the Add Product form.</p>
            </DialogHeader>

            {/* Search */}
            <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search — e.g. Case, Charger, Earphones…"
                  className="pl-9 bg-black/30 border-white/10 text-sm h-10"
                  value={accSearch}
                  onChange={e => setAccSearch(e.target.value)}
                />
                {accSearch && (
                  <button onClick={() => setAccSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category tabs */}
            <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {cats.map(cat => {
                  const count = cat === "All" ? accessoriesCatalog.length : accessoriesCatalog.filter(a => a.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                        activeCategory === cat
                          ? "bg-amber-500 text-black border-amber-500 shadow-[0_0_14px_-3px] shadow-amber-500/50"
                          : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20 bg-white/[0.02]"
                      )}
                    >
                      {cat}
                      <span className={cn("font-mono opacity-50", activeCategory === cat ? "opacity-80" : "")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pt-3 pb-1 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto flex-1 px-6 pb-6 pt-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <Headphones className="w-12 h-12 opacity-20" />
                  <p>No accessories found</p>
                  <button onClick={() => { setAccSearch(""); setActiveCategory("All"); }} className="text-xs text-amber-400 hover:underline">Clear search</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => { setPicked(acc); setPickedVariant(acc.variants[0]); }}
                      className="group flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-amber-500/40 hover:bg-amber-500/5 overflow-hidden text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
                    >
                      <div className="w-full aspect-[4/3] overflow-hidden bg-black/40">
                        <img src={acc.imageUrl} alt={acc.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="font-bold text-white text-xs leading-tight truncate">{acc.name}</p>
                        <p className="text-[10px] text-amber-400/80 mt-0.5 truncate">{acc.subcategory}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{acc.variants.length} variant{acc.variants.length !== 1 ? "s" : ""}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Variant picker */
          <>
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                <button onClick={() => { setPicked(null); setPickedVariant(null); }} className="text-muted-foreground hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                Choose Variant
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">{picked.name} · {picked.subcategory}</p>
            </DialogHeader>

            <div className="px-6 py-6 flex-1 overflow-y-auto">
              <div className="flex gap-5">
                {/* Image */}
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/[0.07]">
                  <img src={picked.imageUrl} alt={picked.name} className="w-full h-full object-cover" />
                </div>
                {/* Variants */}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">Select variant</p>
                  <div className="flex flex-wrap gap-2">
                    {picked.variants.map(v => (
                      <button
                        key={v.label}
                        onClick={() => setPickedVariant(v)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all",
                          pickedVariant?.label === v.label
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-white"
                        )}
                      >
                        {pickedVariant?.label === v.label && <Check className="w-3.5 h-3.5" />}
                        {v.label}
                        {v.priceAdder > 0 && <span className="text-xs opacity-60">+{v.priceAdder}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.05]">
              <Button variant="outline" onClick={() => { setPicked(null); setPickedVariant(null); }}>Back</Button>
              <Button
                onClick={handleConfirm}
                disabled={!pickedVariant}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black"
              >
                Use This <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Phone Catalog Dialog ─────────────────────────────────────────────────────
interface CatalogSelection {
  phone: CatalogPhone;
  variant: StorageVariant;
}

function PhoneCatalogDialog({ onSelect }: { onSelect: (sel: CatalogSelection) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"browse" | "storage">("browse");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");
  const [pickedPhone, setPickedPhone] = useState<CatalogPhone | null>(null);
  const [pickedVariant, setPickedVariant] = useState<StorageVariant | null>(null);

  const filtered = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return phoneCatalog.filter(p => {
      const matchBrand = activeBrand === "All" || p.brand === activeBrand;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [catalogSearch, activeBrand]);

  const reset = () => {
    setStep("browse");
    setCatalogSearch("");
    setActiveBrand("All");
    setPickedPhone(null);
    setPickedVariant(null);
  };

  const handlePhonePick = (phone: CatalogPhone) => {
    setPickedPhone(phone);
    setPickedVariant(phone.storageVariants[0]);
    setStep("storage");
  };

  const handleConfirm = () => {
    if (!pickedPhone || !pickedVariant) return;
    onSelect({ phone: pickedPhone, variant: pickedVariant });
    setOpen(false);
    reset();
  };

  const theme = pickedPhone ? (brandTheme[pickedPhone.brand] ?? defaultTheme) : defaultTheme;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-bold tracking-wide">
          <BookOpen className="w-4 h-4 mr-2" /> Phone Catalog
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col bg-[#070f1e] border-white/[0.08] p-0 gap-0">

        {/* ── Step 1: Browse phones ── */}
        {step === "browse" && (
          <>
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
              <DialogTitle className="text-xl text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Phone Catalog
                <span className="text-sm font-normal text-muted-foreground ml-1">— {phoneCatalog.length} models</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Search for a phone, click it, then choose storage.</p>
            </DialogHeader>

            {/* Search */}
            <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search — e.g. iPhone 14 Pro, Galaxy S23, Spark 10…"
                  className="pl-9 bg-black/30 border-white/10 text-sm h-10"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Brand tabs */}
            <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {catalogBrands.map(brand => {
                  const t = brand !== "All" ? (brandTheme[brand] ?? defaultTheme) : defaultTheme;
                  const count = brand === "All" ? phoneCatalog.length : phoneCatalog.filter(p => p.brand === brand).length;
                  return (
                    <button
                      key={brand}
                      onClick={() => setActiveBrand(brand)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                        activeBrand === brand
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_14px_-3px] shadow-primary/50"
                          : `border-white/10 text-muted-foreground hover:text-white hover:border-white/20 bg-white/[0.02]`
                      )}
                    >
                      {brand !== "All" && <span>{brandEmoji[brand] ?? "📱"}</span>}
                      {brand}
                      <span className={cn("font-mono opacity-50", activeBrand === brand ? "opacity-80" : "")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results count */}
            <div className="px-6 pt-3 pb-0 flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {filtered.length} model{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Phone grid */}
            <div className="overflow-y-auto flex-1 px-6 pb-6 pt-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <Smartphone className="w-12 h-12 opacity-20" />
                  <p>No phones found for "{catalogSearch}"</p>
                  <button onClick={() => { setCatalogSearch(""); setActiveBrand("All"); }} className="text-xs text-primary hover:underline">Clear search</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map(phone => {
                    const t = brandTheme[phone.brand] ?? defaultTheme;
                    return (
                      <button
                        key={phone.id}
                        onClick={() => handlePhonePick(phone)}
                        className={cn(
                          "group flex flex-col rounded-2xl border overflow-hidden text-left transition-all duration-200",
                          "hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]",
                          t.border, t.bg, t.glow
                        )}
                      >
                        {/* Phone image */}
                        <div className="w-full aspect-[4/3] overflow-hidden relative bg-black/40">
                          <PhoneImage phone={phone} className="w-full h-full" />
                          {/* Storage badge */}
                          <div className="absolute bottom-1 right-1 flex gap-1 flex-wrap justify-end">
                            {phone.storageVariants.slice(0, 3).map(v => (
                              <span key={v.storage} className="text-[9px] font-bold bg-black/70 text-white/70 rounded px-1 py-0.5 leading-none">
                                {v.storage}
                              </span>
                            ))}
                            {phone.storageVariants.length > 3 && (
                              <span className="text-[9px] font-bold bg-black/70 text-white/50 rounded px-1 py-0.5 leading-none">+{phone.storageVariants.length - 3}</span>
                            )}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="px-2.5 py-2 flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-bold text-white text-xs leading-tight truncate">{phone.model}</p>
                            <p className={cn("text-[10px] mt-0.5 truncate", t.text)}>{phone.brand}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-80 transition-opacity" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Pick storage ── */}
        {step === "storage" && pickedPhone && (
          <>
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/[0.05] flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep("browse")} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <DialogTitle className="text-xl text-white">Choose Storage</DialogTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-11">Select the GB variant you are adding to inventory.</p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {/* Phone hero card */}
              <div className={cn("flex items-center gap-5 p-5 rounded-2xl border", theme.border, theme.bg)}>
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-black/50">
                  <PhoneImage phone={pickedPhone} className="w-full h-full" />
                </div>
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", theme.text)}>{pickedPhone.brand}</p>
                  <p className="text-2xl font-black text-white leading-tight">{pickedPhone.model}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pickedPhone.storageVariants.length} storage option{pickedPhone.storageVariants.length > 1 ? "s" : ""} available</p>
                </div>
              </div>

              {/* Storage options */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5" /> Storage Variants
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pickedPhone.storageVariants.map((variant, i) => {
                    const isSelected = pickedVariant?.storage === variant.storage;
                    return (
                      <button
                        key={variant.storage}
                        onClick={() => setPickedVariant(variant)}
                        className={cn(
                          "relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-[0_0_20px_-4px] shadow-primary/30 scale-[1.03]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <HardDrive className={cn("w-6 h-6 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-lg font-black font-mono", isSelected ? "text-white" : "text-white/70")}>{variant.storage}</span>
                        {variant.priceAdder > 0 ? (
                          <span className="text-[10px] text-emerald-400 font-bold mt-1">+{formatZMW(variant.priceAdder)}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground mt-1">Base price</span>
                        )}
                        {i === 0 && <span className="text-[9px] text-primary/60 font-bold uppercase tracking-wider mt-0.5">Entry</span>}
                        {i === pickedPhone.storageVariants.length - 1 && i > 0 && <span className="text-[9px] text-[#ffcc00]/60 font-bold uppercase tracking-wider mt-0.5">Top</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Price info */}
                {pickedVariant && (
                  <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-sm text-muted-foreground">
                    <p className="font-medium text-white/80">
                      <span className="text-primary">{pickedPhone.model} — {pickedVariant.storage}</span> will be added to your inventory.
                    </p>
                    <p className="text-xs mt-1">
                      {pickedVariant.priceAdder > 0
                        ? `Add ${formatZMW(pickedVariant.priceAdder)} to your entered acquisition costs for this variant.`
                        : "Enter your real acquisition costs and expected selling price in the next step."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm footer */}
            <div className="px-6 py-4 border-t border-white/[0.05] flex-shrink-0 flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep("browse")} className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!pickedVariant}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8"
              >
                Add to Inventory →
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Product form schema ──────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  category: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  acquisitionType: z.enum(["purchased", "free_gift", "trade_in", "other"]),
  purchasePrice: z.coerce.number().min(0),
  shippingCost: z.coerce.number().min(0),
  customsCost: z.coerce.number().min(0),
  repairCost: z.coerce.number().min(0),
  accessoriesCost: z.coerce.number().min(0),
  otherCost: z.coerce.number().min(0),
  tradeValue: z.coerce.number().min(0),
  acquisitionNote: z.string().optional(),
  stockQuantity: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
  supplierId: z.coerce.number().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

// ─── Shared product form fields ───────────────────────────────────────────────
function ProductFormFields({
  form,
  suppliers,
  catalogPhone,
}: {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  suppliers: { id: number; name: string }[] | undefined;
  catalogPhone?: { phone: CatalogPhone; variant: StorageVariant } | null;
}) {
  const values = form.watch();
  const additional = (values.shippingCost || 0) + (values.customsCost || 0) + (values.repairCost || 0) + (values.accessoriesCost || 0) + (values.otherCost || 0);
  const totalCost = (values.acquisitionType === "trade_in" ? (values.tradeValue || 0) : (values.purchasePrice || 0)) + additional;
  const expectedProfit = (values.sellingPrice || 0) - totalCost;
  const amountFields: Array<[keyof ProductFormValues, string]> = [
    ["purchasePrice", "Purchase price"],
    ["shippingCost", "Shipping"],
    ["customsCost", "Customs / import costs"],
    ["repairCost", "Repairs"],
    ["accessoriesCost", "Accessories"],
    ["otherCost", "Other costs"],
  ];
  return (
    <div className="space-y-4">
      {/* Catalog photo banner */}
      {catalogPhone && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
            <PhoneImage phone={catalogPhone.phone} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{catalogPhone.phone.brand}</p>
            <p className="text-base font-black text-white truncate">{catalogPhone.phone.model}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                {catalogPhone.variant.storage}
              </Badge>
              {catalogPhone.variant.priceAdder > 0 && (
                <span className="text-[11px] text-emerald-400 font-bold">+{formatZMW(catalogPhone.variant.priceAdder)} vs base</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Product Name *</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. Apple iPhone 15 Pro — 256GB" className="bg-background" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="phones">Phones</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="tablets">Tablets</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="sku" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">SKU / Barcode</FormLabel>
            <FormControl><Input {...field} placeholder="Optional" className="bg-background" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="brand" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Brand</FormLabel>
            <FormControl><Input {...field} placeholder="Apple, Samsung…" className="bg-background" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="model" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Model</FormLabel>
            <FormControl><Input {...field} placeholder="Optional" className="bg-background" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="acquisitionType" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">How did you get this phone? *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="purchased">Purchased</SelectItem>
                <SelectItem value="free_gift">Free / Gift</SelectItem>
                <SelectItem value="trade_in">Trade-in</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {values.acquisitionType === "trade_in" ? (
          <FormField control={form.control} name="tradeValue" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Value given up in trade (ZMW)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} className="bg-background font-mono" /></FormControl>
            </FormItem>
          )} />
        ) : amountFields.map(([name, label]) => (
          <FormField key={name} control={form.control} name={name} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">{label} (ZMW)</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} className="bg-background font-mono" /></FormControl>
            </FormItem>
          )} />
        ))}

        <FormField control={form.control} name="sellingPrice" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Expected selling price (ZMW)</FormLabel>
            <FormControl><Input type="number" step="0.01" {...field} className="bg-background font-mono" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <p className="text-muted-foreground">Transparent calculation</p>
          <p className="font-mono text-white">Total actual cost: {formatZMW(totalCost)}</p>
          <p className={cn("font-mono font-bold", expectedProfit >= 0 ? "text-emerald-400" : "text-red-400")}>Expected profit: {formatZMW(expectedProfit)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Cash invested is separate from potential selling value. Actual sale price is recorded only when sold.</p>
        </div>

        <FormField control={form.control} name="stockQuantity" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Initial Stock *</FormLabel>
            <FormControl><Input type="number" {...field} className="bg-background font-mono" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="lowStockThreshold" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Low Stock Alert At *</FormLabel>
            <FormControl><Input type="number" {...field} className="bg-background font-mono" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="supplierId" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Supplier (Optional)</FormLabel>
            <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))} value={field.value?.toString() || "none"}>
              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="acquisitionNote" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Acquisition notes</FormLabel>
            <FormControl><Input {...field} placeholder="Gift source, trade details, or other context" className="bg-background" /></FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [catalogSel, setCatalogSel] = useState<CatalogSelection | null>(null);
  const [accCatalogSel, setAccCatalogSel] = useState<AccCatalogSelection | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useListProducts({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });
  const { data: suppliers } = useListSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name:"", sku:"", category:"phones", brand:"", model:"", costPrice:0, sellingPrice:0, acquisitionType:"purchased", purchasePrice:0, shippingCost:0, customsCost:0, repairCost:0, accessoriesCost:0, otherCost:0, tradeValue:0, acquisitionNote:"", stockQuantity:0, lowStockThreshold:3 },
  });
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name:"", sku:"", category:"phones", brand:"", model:"", costPrice:0, sellingPrice:0, acquisitionType:"purchased", purchasePrice:0, shippingCost:0, customsCost:0, repairCost:0, accessoriesCost:0, otherCost:0, tradeValue:0, acquisitionNote:"", stockQuantity:0, lowStockThreshold:3 },
  });

  // Accessories Catalog → pre-fill form + open dialog
  const handleAccCatalogSelect = (sel: AccCatalogSelection) => {
    const { accessory, variant } = sel;
    form.reset({
      name: `${accessory.name}${variant.label !== "Standard" ? ` — ${variant.label}` : ""}`,
      brand: "",
      model: "",
      category: "accessories",
      sku: "",
      costPrice: 0,
      sellingPrice: 0,
      acquisitionType: "purchased", purchasePrice: 0, shippingCost: 0, customsCost: 0, repairCost: 0, accessoriesCost: 0, otherCost: 0, tradeValue: 0, acquisitionNote: "",
      stockQuantity: 0,
      lowStockThreshold: 5,
    });
    setAccCatalogSel(sel);
    setCatalogSel(null);
    setIsCreateOpen(true);
  };

  // Catalog phone → pre-fill form + open dialog
  const handleCatalogSelect = (sel: CatalogSelection) => {
    const { phone, variant } = sel;
    form.reset({
      name: `${phone.name} — ${variant.storage}`,
      brand: phone.brand,
      model: phone.model,
      category: "phones",
      sku: "",
      costPrice: 0,
      sellingPrice: 0,
      acquisitionType: "purchased", purchasePrice: 0, shippingCost: 0, customsCost: 0, repairCost: 0, accessoriesCost: 0, otherCost: 0, tradeValue: 0, acquisitionNote: "",
      stockQuantity: 0,
      lowStockThreshold: 3,
    });
    setCatalogSel(sel);
    setIsCreateOpen(true);
  };

  const onCreateSubmit = (data: ProductFormValues) => {
    const cost = data.acquisitionType === "trade_in" ? data.tradeValue : data.purchasePrice;
    const totalCost = cost + data.shippingCost + data.customsCost + data.repairCost + data.accessoriesCost + data.otherCost;
    createProduct.mutate({ data: { ...data, costPrice: totalCost } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setIsCreateOpen(false);
        setCatalogSel(null);
        setAccCatalogSel(null);
        form.reset();
        toast({ title: "Product added to inventory ✓" });
      },
    });
  };

  const onEditSubmit = (data: ProductFormValues) => {
    if (!editingProduct) return;
    const cost = data.acquisitionType === "trade_in" ? data.tradeValue : data.purchasePrice;
    const totalCost = cost + data.shippingCost + data.customsCost + data.repairCost + data.accessoriesCost + data.otherCost;
    updateProduct.mutate({ id: editingProduct.id, data: { ...data, costPrice: totalCost } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setEditingProduct(null);
        toast({ title: "Product updated ✓" });
      },
    });
  };

  const handleEdit = (product: Product) => {
    editForm.reset({
      name: product.name, sku: product.sku || "", category: product.category,
      brand: product.brand || "", model: product.model || "",
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
      acquisitionType: (product.acquisitionType as ProductFormValues["acquisitionType"]) || "purchased",
      purchasePrice: product.purchasePrice || 0, shippingCost: product.shippingCost || 0, customsCost: product.customsCost || 0,
      repairCost: product.repairCost || 0, accessoriesCost: product.accessoriesCost || 0, otherCost: product.otherCost || 0,
      tradeValue: product.tradeValue || 0, acquisitionNote: product.acquisitionNote || "",
      stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold,
      supplierId: product.supplierId || undefined,
    });
    setEditingProduct(product);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted" });
        },
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Inventory
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32" />
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Manage your products, pricing, and stock levels.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <AccessoriesCatalogDialog onSelect={handleAccCatalogSelect} />
            <PhoneCatalogDialog onSelect={handleCatalogSelect} />

            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setCatalogSel(null); setAccCatalogSel(null); form.reset(); } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { form.reset(); setCatalogSel(null); setAccCatalogSel(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">
                    {catalogSel ? "Add Phone from Catalog" : accCatalogSel ? "Add Accessory from Catalog" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4 mt-2">
                    <ProductFormFields form={form} suppliers={suppliers} catalogPhone={catalogSel} />
                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                      <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setCatalogSel(null); setAccCatalogSel(null); }}>Cancel</Button>
                      <Button type="submit" disabled={createProduct.isPending} className="font-bold">
                        {createProduct.isPending ? "Adding…" : "Add to Inventory"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Edit Product</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
                <ProductFormFields form={editForm} suppliers={suppliers} />
                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                  <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                  <Button type="submit" disabled={updateProduct.isPending} className="font-bold">
                    {updateProduct.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center border-0 bg-card/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total SKUs</span>
            <span className="text-3xl font-black font-mono text-white">{products?.length || 0}</span>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center card-accent-cyan stat-glow-cyan border-0 relative overflow-hidden">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Inventory Value</span>
            <span className="text-3xl font-black font-mono text-white text-glow-cyan">
              {formatZMW(products?.reduce((acc, p) => acc + (p.costPrice * p.stockQuantity), 0) || 0)}
            </span>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center text-center card-accent-gold stat-glow-gold border-0 relative overflow-hidden">
            <span className="text-[10px] font-bold text-[#ffcc00] uppercase tracking-widest mb-2">Avg Profit Margin</span>
            <span className="text-3xl font-black font-mono text-[#ffcc00] text-glow-gold">
              {products?.length
                ? (products.reduce((acc, p) => acc + ((p.sellingPrice - p.costPrice) / (p.costPrice || 1) * 100), 0) / products.length).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>

        {/* Product table */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, or brand…"
                className="pl-9 bg-background/50 border-white/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="phones">Phones</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="tablets">Tablets</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-secondary/80 to-secondary/40 hover:from-secondary/80 hover:to-secondary/40 border-b border-white/[0.05]">
                  <TableHead className="w-[300px] text-xs uppercase tracking-wider text-muted-foreground font-bold">Product</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Category</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Cost Price</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Expected Sale</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Margin</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-bold">Stock</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-8 w-full bg-white/[0.02]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Box className="w-16 h-16 opacity-30 text-primary" />
                        <p className="text-lg font-medium text-white/50">No products found.</p>
                        <Button variant="outline" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>Clear Filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product) => {
                    const margin = product.sellingPrice - product.costPrice;
                    const marginPercent = product.costPrice > 0 ? (margin / product.costPrice) * 100 : 0;
                    const isLowStock = product.stockQuantity <= product.lowStockThreshold;

                    return (
                      <TableRow key={product.id} className="group hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground flex gap-2 font-mono mt-1">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.brand && <span>{product.brand}</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize bg-black/30 border-white/5 text-muted-foreground">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono">{formatZMW(product.costPrice)}</TableCell>
                        <TableCell className="text-right font-bold text-primary font-mono text-glow-cyan">{formatZMW(product.sellingPrice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[#ffcc00] font-mono font-bold text-sm">{formatZMW(margin)}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground font-mono">{marginPercent.toFixed(1)}%</span>
                              <div className="w-12 h-1 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#ffcc00] to-orange-400" style={{ width: `${Math.min(100, marginPercent)}%` }} />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isLowStock ? "destructive" : "outline"} className={cn("font-mono text-xs border-0", isLowStock ? "animate-pulse shadow-[0_0_10px_-2px_hsl(var(--destructive))]" : "bg-white/5 text-white/70")}>
                            {product.stockQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={() => handleEdit(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
