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
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatZMW, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useListProducts({ 
    search: search || undefined, 
    category: categoryFilter !== 'all' ? categoryFilter : undefined 
  });
  
  const { data: suppliers } = useListSuppliers();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "phones",
      brand: "",
      model: "",
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 5,
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setEditingProduct(null);
          toast({ title: "Product updated successfully" });
        }
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsCreateOpen(false);
          form.reset();
          toast({ title: "Product created successfully" });
        }
      });
    }
  };

  const handleEdit = (product: Product) => {
    form.reset({
      name: product.name,
      sku: product.sku || "",
      category: product.category,
      brand: product.brand || "",
      model: product.model || "",
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      supplierId: product.supplierId || undefined,
    });
    setEditingProduct(product);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
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
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Inventory
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Manage your products, pricing, and stock levels.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { form.reset(); setEditingProduct(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Product Name *</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. iPhone 15 Pro Max" className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormControl><Input {...field} placeholder="Apple, Samsung..." className="bg-background" /></FormControl>
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
                  
                  <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                    <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingProduct(null); }}>Cancel</Button>
                    <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="font-bold">
                      {editingProduct ? 'Save Changes' : 'Create Product'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog handled by state */}
          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
             <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl text-white">Edit Product</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Product Name *</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="brand" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Brand</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="model" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Model</FormLabel>
                        <FormControl><Input {...field} className="bg-background" /></FormControl>
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
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Stock Quantity *</FormLabel>
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
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                    <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                    <Button type="submit" disabled={updateProduct.isPending} className="font-bold">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

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
               {products?.length ? (products.reduce((acc, p) => acc + ((p.sellingPrice - p.costPrice)/p.costPrice * 100), 0) / products.length).toFixed(1) : 0}%
             </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products, SKU, or brand..." 
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
                        <p className="text-lg font-medium text-white/50">No products found matching your search.</p>
                        <Button variant="outline" className="mt-2" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>Clear Filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products?.map((product) => {
                    const margin = product.sellingPrice - product.costPrice;
                    const marginPercent = ((margin / product.costPrice) * 100);
                    const isLowStock = product.stockQuantity <= product.lowStockThreshold;

                    return (
                      <TableRow key={product.id} className="group hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight">{product.name}</span>
                            <span className="text-[10px] text-muted-foreground flex gap-2 font-mono mt-1">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.brand && <span>B: {product.brand}</span>}
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