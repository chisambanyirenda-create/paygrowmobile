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
import { Search, Plus, Edit, Trash2, Box, BookOpen, X, ChevronRight, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { phoneCatalog, catalogBrands, CatalogPhone } from "@/data/phone-catalog";

// ─── Brand accent colours ───────────────────────────────────────────────────
const brandColor: Record<string, string> = {
  Apple:    "border-gray-400/30 bg-gray-400/5 text-gray-300",
  Samsung:  "border-blue-400/30 bg-blue-400/5 text-blue-300",
  OPPO:     "border-green-400/30 bg-green-400/5 text-green-300",
  Huawei:   "border-red-400/30 bg-red-400/5 text-red-300",
  Google:   "border-yellow-400/30 bg-yellow-400/5 text-yellow-300",
  Tecno:    "border-cyan-400/30 bg-cyan-400/5 text-cyan-300",
  Infinix:  "border-purple-400/30 bg-purple-400/5 text-purple-300",
  Xiaomi:   "border-orange-400/30 bg-orange-400/5 text-orange-300",
  Realme:   "border-yellow-300/30 bg-yellow-300/5 text-yellow-200",
  OnePlus:  "border-red-500/30 bg-red-500/5 text-red-400",
  Motorola: "border-indigo-400/30 bg-indigo-400/5 text-indigo-300",
  Nokia:    "border-blue-300/30 bg-blue-300/5 text-blue-200",
};
const brandEmoji: Record<string, string> = {
  Apple: "🍎", Samsung: "📱", OPPO: "🟢", Huawei: "📡",
  Google: "🔵", Tecno: "🌟", Infinix: "⚡", Xiaomi: "🔶",
  Realme: "🔷", OnePlus: "🔴", Motorola: "〽️", Nokia: "🏔️",
};

// ─── Phone Catalog Dialog ─────────────────────────────────────────────────────
function PhoneCatalogDialog({ onSelect }: { onSelect: (phone: CatalogPhone) => void }) {
  const [open, setOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeBrand, setActiveBrand] = useState("All");

  const filtered = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return phoneCatalog.filter(p => {
      const matchBrand = activeBrand === "All" || p.brand === activeBrand;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [catalogSearch, activeBrand]);

  const handlePick = (phone: CatalogPhone) => {
    onSelect(phone);
    setOpen(false);
    setCatalogSearch("");
    setActiveBrand("All");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-bold tracking-wide">
          <BookOpen className="w-4 h-4 mr-2" /> Phone Catalog
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card border-border/50 p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/[0.05] flex-shrink-0">
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Phone Catalog
            <span className="text-sm font-normal text-muted-foreground ml-1">— {phoneCatalog.length} models</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a phone to pre-fill the product form. You'll only need to enter your prices.
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="px-6 py-4 border-b border-white/[0.05] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by model, e.g. iPhone 14 Pro, Galaxy S23, Spark 10..."
              className="pl-9 bg-background/60 border-white/10 text-sm h-11"
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

        {/* Brand filter strip */}
        <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {catalogBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                  activeBrand === brand
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_-2px] shadow-primary/40"
                    : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20 bg-white/[0.02]"
                )}
              >
                {brand !== "All" && (brandEmoji[brand] ?? "📱")} {brand}
                {brand !== "All" && (
                  <span className="ml-1 opacity-60 font-mono">
                    {phoneCatalog.filter(p => p.brand === brand).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="px-6 pt-3 pb-1 flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {filtered.length} model{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Phone grid */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Smartphone className="w-12 h-12 opacity-20" />
              <p className="text-base">No phones found for "{catalogSearch}"</p>
              <button onClick={() => { setCatalogSearch(""); setActiveBrand("All"); }} className="text-xs text-primary hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {filtered.map(phone => (
                <button
                  key={phone.id}
                  onClick={() => handlePick(phone)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                    brandColor[phone.brand] ?? "border-white/10 bg-white/[0.02] text-white/80",
                    "hover:brightness-125"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center text-base flex-shrink-0">
                    {brandEmoji[phone.brand] ?? "📱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight truncate">{phone.model}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{phone.brand}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product form schema ─────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0),
  lowStockThreshold: z.coerce.number().min(0),
  supplierId: z.coerce.number().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

// ─── Shared product form fields ───────────────────────────────────────────────
function ProductFormFields({ form, suppliers }: { form: ReturnType<typeof useForm<ProductFormValues>>; suppliers: { id: number; name: string }[] | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Product Name *</FormLabel>
          <FormControl><Input {...field} placeholder="e.g. Apple iPhone 15 Pro Max" className="bg-background" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="category" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
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

      <FormField control={form.control} name="costPrice" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Cost Price (ZMW) *</FormLabel>
          <FormControl><Input type="number" step="0.01" {...field} className="bg-background font-mono" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name="sellingPrice" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Selling Price (ZMW) *</FormLabel>
          <FormControl><Input type="number" step="0.01" {...field} className="bg-background font-mono" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

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
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // When a catalog phone is picked, store it to show the banner
  const [catalogSource, setCatalogSource] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useListProducts({ 
    search: search || undefined, 
    category: categoryFilter !== "all" ? categoryFilter : undefined 
  });
  const { data: suppliers } = useListSuppliers();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", sku: "", category: "phones", brand: "", model: "",
      costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 3,
    }
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", sku: "", category: "phones", brand: "", model: "",
      costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 3,
    }
  });

  // Called when user picks a phone from the catalog
  const handleCatalogSelect = (phone: CatalogPhone) => {
    form.reset({
      name: phone.name,
      brand: phone.brand,
      model: phone.model,
      category: "phones",
      sku: "", costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 3,
    });
    setCatalogSource(phone.name);
    setIsCreateOpen(true);
  };

  const onCreateSubmit = (data: ProductFormValues) => {
    createProduct.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setIsCreateOpen(false);
        setCatalogSource(null);
        form.reset();
        toast({ title: "Product added to inventory ✓" });
      }
    });
  };

  const onEditSubmit = (data: ProductFormValues) => {
    if (!editingProduct) return;
    updateProduct.mutate({ id: editingProduct.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setEditingProduct(null);
        toast({ title: "Product updated ✓" });
      }
    });
  };

  const handleEdit = (product: Product) => {
    editForm.reset({
      name: product.name, sku: product.sku || "", category: product.category,
      brand: product.brand || "", model: product.model || "",
      costPrice: product.costPrice, sellingPrice: product.sellingPrice,
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
        }
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Inventory
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Manage your products, pricing, and stock levels.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Catalog picker */}
            <PhoneCatalogDialog onSelect={handleCatalogSelect} />

            {/* Manual add */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setCatalogSource(null); form.reset(); } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { form.reset(); setCatalogSource(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">
                    {catalogSource ? "Add from Catalog" : "Add New Product"}
                  </DialogTitle>
                </DialogHeader>
                {/* Catalog source banner */}
                {catalogSource && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary mt-1">
                    <Smartphone className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium truncate">{catalogSource}</span>
                    <span className="text-muted-foreground text-xs ml-auto">— just enter your prices below</span>
                  </div>
                )}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4 mt-2">
                    <ProductFormFields form={form} suppliers={suppliers} />
                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                      <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setCatalogSource(null); }}>Cancel</Button>
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

        {/* 3-Stat Summary Bar */}
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
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
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
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Selling Price</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Margin</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-bold">Stock</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      <TableCell><Skeleton className="h-10 w-full bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 mx-auto bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 bg-white/[0.02]" /></TableCell>
                    </TableRow>
                  ))
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Box className="w-16 h-16 opacity-30 text-primary" />
                        <p className="text-lg font-medium text-white/50">No products found.</p>
                        <Button variant="outline" className="mt-2" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>Clear Filters</Button>
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
                                <div className="h-full bg-gradient-to-r from-[#ffcc00] to-orange-400" style={{ width: `${Math.min(100, marginPercent)}%` }}></div>
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
