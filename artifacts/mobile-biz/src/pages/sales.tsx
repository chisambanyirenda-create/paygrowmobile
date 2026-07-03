import { Layout } from "@/components/layout";
import { 
  useListSales, 
  useListProducts,
  useCreateSale,
  useDeleteSale,
  useListCustomers,
  getListSalesQueryKey,
  getListProductsQueryKey,
  Sale,
} from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatZMW } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, ShoppingCart, User, ReceiptText, ChevronRight, X, ArrowRight, CheckCircle, Printer, Plus, Banknote, Smartphone, CreditCard, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const saleSchema = z.object({
  customerId: z.coerce.number().optional(),
  items: z.array(z.object({
    productId: z.coerce.number().min(1, "Product required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.coerce.number().min(0, "Price must be positive"),
  })).min(1, "At least one item required"),
  discount: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

const CATEGORY_COLORS: Record<string, string> = {
  phones: 'hsl(var(--chart-1))',
  accessories: 'hsl(var(--chart-2))',
  tablets: 'hsl(var(--chart-4))',
  other: 'hsl(var(--chart-5))'
};

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  mobile_money: <Smartphone className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  bank_transfer: <Building2 className="w-4 h-4" />,
};

export default function Sales() {
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sales, isLoading: isLoadingSales } = useListSales();
  const { data: products } = useListProducts();
  const { data: customers } = useListCustomers();
  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [],
      discount: 0,
      paymentMethod: "cash",
      notes: "",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchItems = form.watch("items");
  const watchDiscount = form.watch("discount") || 0;
  const watchPaymentMethod = form.watch("paymentMethod");
  const watchCustomerId = form.watch("customerId");

  const { subtotal, totalAmount, totalProfit } = useMemo(() => {
    const sub = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);
    const profit = watchItems.reduce((acc, item) => {
      const product = products?.find(p => p.id === item.productId);
      const lp = product ? (item.quantity * item.unitPrice - item.quantity * product.costPrice) : 0;
      return acc + lp;
    }, 0);
    return {
      subtotal: sub,
      totalAmount: Math.max(0, sub - watchDiscount),
      totalProfit: profit,
    };
  }, [watchItems, watchDiscount, products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products?.filter(p => p.stockQuantity > 0) || [];
    return (products || []).filter(p =>
      p.stockQuantity > 0 &&
      (p.name.toLowerCase().includes(q) ||
       p.category.toLowerCase().includes(q) ||
       (p.brand || "").toLowerCase().includes(q) ||
       (p.sku || "").toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const filteredSales = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sales || [];
    return (sales || []).filter(s =>
      (s.customerName || "walk-in").toLowerCase().includes(q) ||
      `INV-${s.id.toString().padStart(5, '0')}`.toLowerCase().includes(q) ||
      s.paymentMethod.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const handleProductSelect = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      const existingIndex = watchItems.findIndex(i => i.productId === productId);
      if (existingIndex >= 0) {
        const currentQty = form.getValues(`items.${existingIndex}.quantity`);
        form.setValue(`items.${existingIndex}.quantity`, Number(currentQty) + 1);
      } else {
        append({ productId: product.id, quantity: 1, unitPrice: product.sellingPrice });
      }
    }
  };

  const onSubmit = (data: SaleFormValues) => {
    createSale.mutate({ data }, {
      onSuccess: (result: Sale) => {
        queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setCompletedSale(result);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Error creating sale", description: err.response?.data?.error || err.message || "Unknown error", variant: "destructive" });
      }
    });
  };

  const handleNewSale = () => {
    setCompletedSale(null);
    setProductSearch("");
    form.reset();
    setIsNewSaleOpen(true);
  };

  const handleClosePOS = () => {
    setIsNewSaleOpen(false);
    setCompletedSale(null);
    setProductSearch("");
    form.reset();
  };

  const handleDeleteSale = (id: number) => {
    if (confirm("Void this sale? Stock will be restored.")) {
      deleteSale.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Sale voided. Stock restored." });
        },
        onError: (err: any) => {
          toast({ title: "Error voiding sale", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const selectedCustomer = customers?.find(c => c.id === watchCustomerId);

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Sales Ledger
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Process new sales and view transaction history.</p>
          </div>

          <Button
            size="lg"
            onClick={handleNewSale}
            className="w-full sm:w-auto font-bold tracking-wide bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-400 border-0 shadow-[0_0_20px_-5px_hsl(var(--primary))] text-primary-foreground"
          >
            <ShoppingCart className="w-5 h-5 mr-2" /> New Sale (POS)
          </Button>
        </div>

        {/* POS Dialog */}
        <Dialog open={isNewSaleOpen} onOpenChange={(open) => { if (!open) handleClosePOS(); }}>
          <DialogContent className="sm:max-w-[1000px] h-[90vh] max-h-[900px] overflow-hidden flex flex-col p-0 bg-[#070b14] border-white/[0.05]">

            {completedSale ? (
              /* ── RECEIPT SCREEN ── */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Success header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/80 to-[#050C1B] border-b border-emerald-500/20 p-8 text-center shrink-0">
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(hsl(145 75% 45%) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_-5px_hsl(145_75%_45%)]">
                      <CheckCircle className="w-9 h-9 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Sale Complete!</h2>
                    <p className="text-emerald-400/70 font-mono text-sm mt-1 uppercase tracking-widest">
                      INV-{completedSale.id.toString().padStart(5, '0')} • {format(new Date(completedSale.createdAt), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-6">
                    {/* Business header on receipt */}
                    <div className="text-center py-2">
                      <p className="font-black text-white text-lg tracking-tight">MobiTrack</p>
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Zambia · app.mobitrack.zm</p>
                    </div>

                    {/* Customer & payment */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">Customer</p>
                        <p className="font-bold text-white">{completedSale.customerName || "Walk-in Customer"}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold">Payment</p>
                        <p className="font-bold text-white capitalize">{completedSale.paymentMethod.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-bold text-[10px] text-muted-foreground mb-3 uppercase tracking-widest">Items Sold</h4>
                      <div className="space-y-2">
                        {completedSale.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-lg border border-white/5 bg-black/20">
                            <div className="flex-1">
                              <p className="font-bold text-white/90">{item.productName}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {item.quantity} × {formatZMW(item.unitPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white font-mono">{formatZMW(item.lineTotal)}</p>
                              <p className="text-[10px] text-emerald-400 font-mono mt-0.5">+{formatZMW(item.lineProfit)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-white/[0.05] pt-4 space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground font-mono">
                        <span>Subtotal</span><span>{formatZMW(completedSale.subtotal)}</span>
                      </div>
                      {completedSale.discount > 0 && (
                        <div className="flex justify-between text-sm text-destructive font-mono">
                          <span>Discount</span><span>-{formatZMW(completedSale.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-2xl font-black pt-3 border-t border-white/[0.05]">
                        <span className="text-white">Total Paid</span>
                        <span className="text-primary font-mono text-glow-cyan whitespace-nowrap">{formatZMW(completedSale.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2">
                        <span className="text-muted-foreground font-mono">Your Profit</span>
                        <span className="text-[#ffcc00] font-bold font-mono text-glow-gold whitespace-nowrap">{formatZMW(completedSale.profit)}</span>
                      </div>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest pt-2">Thank you for your business!</p>
                  </div>
                </ScrollArea>

                {/* Action buttons */}
                <div className="p-5 border-t border-white/[0.05] bg-black/40 shrink-0 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10 hover:border-white/20 text-white"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4 mr-2" /> Print Receipt
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-cyan-400 text-black font-bold border-0"
                    onClick={() => { setCompletedSale(null); setProductSearch(""); }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Sale
                  </Button>
                </div>
              </div>
            ) : (
              /* ── POS FORM ── */
              <>
                <DialogHeader className="p-5 border-b border-white/[0.05] bg-black/40 shrink-0">
                  <DialogTitle className="text-xl flex items-center gap-3 text-white font-bold tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    Point of Sale Terminal
                    {fields.length > 0 && (
                      <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 font-mono">
                        {fields.length} item{fields.length !== 1 ? 's' : ''} in cart
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row h-full overflow-hidden flex-1">

                    {/* Left: Product Selection */}
                    <div className="w-full md:w-[55%] flex flex-col border-r border-white/[0.05] bg-black/20">
                      <div className="p-4 border-b border-white/[0.05]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search product, brand, SKU..."
                            className="pl-9 h-12 bg-black/40 border-white/5 focus-visible:ring-primary focus-visible:border-primary text-white font-medium"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                          />
                        </div>
                        {productSearch && (
                          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found
                          </p>
                        )}
                      </div>

                      <ScrollArea className="flex-1 p-4">
                        {filteredProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Search className="w-10 h-10 opacity-20 mb-3" />
                            <p className="text-sm font-medium text-white/40">No products found</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                            {filteredProducts.map(product => {
                              const inCart = watchItems.find(i => i.productId === product.id);
                              return (
                                <div
                                  key={product.id}
                                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all group relative ${
                                    inCart
                                      ? 'border-primary/60 bg-primary/[0.05] shadow-[0_0_15px_-5px_hsl(var(--primary)/0.4)]'
                                      : 'border-white/5 bg-white/[0.02] hover:border-primary/50 hover:bg-primary/[0.02] hover:shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]'
                                  }`}
                                  onClick={() => handleProductSelect(product.id)}
                                >
                                  {inCart && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <span className="text-[10px] font-black text-black">{inCart.quantity}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other }}></div>
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{product.category}</span>
                                    </div>
                                    {product.brand && <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-white/5 border-0 font-mono">{product.brand}</Badge>}
                                  </div>
                                  <p className="font-bold text-sm text-white line-clamp-2 leading-snug flex-1">{product.name}</p>
                                  <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/[0.05]">
                                    <p className="text-[10px] font-mono text-muted-foreground">
                                      Stock: <span className={product.stockQuantity <= 3 ? 'text-destructive' : 'text-emerald-400'}>{product.stockQuantity}</span>
                                    </p>
                                    <p className="font-bold text-primary font-mono text-base text-glow-cyan">{formatZMW(product.sellingPrice)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </ScrollArea>
                    </div>

                    {/* Right: Cart & Checkout */}
                    <div className="w-full md:w-[45%] flex flex-col bg-[#05080f]">
                      <ScrollArea className="flex-1 p-5">
                        {fields.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-20">
                            <ShoppingCart className="w-16 h-16 mb-4 text-primary/50" />
                            <p className="text-lg font-medium text-white">Cart is empty</p>
                            <p className="text-sm">Click a product to add it</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fields.map((field, index) => {
                              const product = products?.find(p => p.id === form.getValues(`items.${index}.productId`));
                              const qty = form.watch(`items.${index}.quantity`) || 0;
                              const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
                              const lineTotal = qty * unitPrice;
                              const lineProfit = product ? lineTotal - (qty * product.costPrice) : 0;

                              return (
                                <div key={field.id} className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent opacity-50"></div>
                                  <div className="flex justify-between items-start">
                                    <p className="font-bold text-sm text-white line-clamp-2 pr-6 leading-snug">{product?.name}</p>
                                    <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive shrink-0 transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-4 mt-1">
                                    <div className="w-28">
                                      <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                                        <FormItem className="space-y-0">
                                          <FormControl>
                                            <div className="flex items-center h-9 rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                                              <button type="button" className="w-8 hover:bg-white/10 h-full flex items-center justify-center text-muted-foreground transition-colors text-lg" onClick={() => field.onChange(Math.max(1, field.value - 1))}>−</button>
                                              <input type="number" className="flex-1 bg-transparent text-center text-sm font-mono outline-none text-white font-bold" {...field} />
                                              <button type="button" className="w-8 hover:bg-white/10 h-full flex items-center justify-center text-muted-foreground transition-colors text-lg" onClick={() => field.onChange(Number(field.value) + 1)}>+</button>
                                            </div>
                                          </FormControl>
                                        </FormItem>
                                      )} />
                                    </div>
                                    <div className="flex-1">
                                      <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                        <FormItem className="space-y-0">
                                          <FormControl>
                                            <Input type="number" step="0.01" className="h-9 text-right font-mono bg-black/20 border-white/5" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )} />
                                    </div>
                                    <div className="flex flex-col items-end w-24">
                                      <div className="font-bold text-primary font-mono text-sm whitespace-nowrap">{formatZMW(lineTotal)}</div>
                                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5 whitespace-nowrap">+{formatZMW(lineProfit)}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {form.formState.errors.items && (
                          <p className="text-sm text-destructive mt-3 font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">{form.formState.errors.items.message}</p>
                        )}
                      </ScrollArea>

                      {/* Checkout Footer */}
                      <div className="p-5 border-t border-white/[0.05] bg-black/40 shrink-0 relative z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="customerId" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Customer</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : Number(v))} value={field.value?.toString() || "none"}>
                                  <FormControl><SelectTrigger className="h-10 bg-white/5 border-white/10"><SelectValue placeholder="Walk-in" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Walk-in Customer</SelectItem>
                                    {customers?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger className="h-10 bg-white/5 border-white/10"><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="cash">💵 Cash</SelectItem>
                                    <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                                    <SelectItem value="card">💳 Card (POS)</SelectItem>
                                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground font-mono">Subtotal</span>
                              <span className="font-mono text-white/80 whitespace-nowrap">{formatZMW(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground font-mono">Discount (K)</span>
                              <div className="w-24">
                                <FormField control={form.control} name="discount" render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl><Input type="number" step="0.01" className="h-7 text-right bg-white/5 border-white/10 font-mono text-destructive" {...field} /></FormControl>
                                  </FormItem>
                                )} />
                              </div>
                            </div>
                            {fields.length > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground font-mono">Est. Profit</span>
                                <span className="font-mono text-[#ffcc00] font-bold whitespace-nowrap">{formatZMW(totalProfit)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-2xl font-black pt-3 border-t border-white/10 mt-1">
                              <span className="text-white tracking-tight">Total</span>
                              <span className="text-primary text-glow-cyan font-mono whitespace-nowrap">{formatZMW(totalAmount)}</span>
                            </div>
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-300 text-black border-0 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] transition-all hover:scale-[1.01]"
                            disabled={createSale.isPending || fields.length === 0}
                          >
                            {createSale.isPending ? (
                              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin"></span>Processing...</span>
                            ) : (
                              <span className="flex items-center gap-2">Complete Sale <ArrowRight className="w-5 h-5" /></span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Sales Table */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, invoice, payment..."
                className="pl-9 bg-background/50 border-white/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest shrink-0">
              {filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-secondary/80 to-secondary/40 hover:from-secondary/80 hover:to-secondary/40 border-b border-white/[0.05]">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Date / Ref</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Customer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Payment</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-bold">Items</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Total</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Profit</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSales ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-8 w-full bg-white/[0.02]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <ReceiptText className="w-16 h-16 opacity-30 text-primary" />
                        <p className="text-lg font-medium text-white/50">{search ? "No matching sales found." : "No sales yet. Make your first sale."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="cursor-pointer hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors group" onClick={() => setSelectedSale(sale)}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{format(new Date(sale.createdAt), "MMM d, yyyy HH:mm")}</span>
                          <span className="text-[10px] text-primary/70 font-mono mt-1 uppercase tracking-widest">INV-{sale.id.toString().padStart(5, '0')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.customerName ? (
                          <div className="flex items-center gap-2 text-white/90 font-medium">
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-black">
                              {sale.customerName.charAt(0)}
                            </div>
                            {sale.customerName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm flex items-center gap-2">
                            <User className="w-3 h-3" /> Walk-in
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-white/10 bg-black/20 text-muted-foreground font-mono text-[10px]">
                          {sale.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-white/80">{sale.items.length}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-white font-mono whitespace-nowrap">{formatZMW(sale.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[#ffcc00] font-bold font-mono whitespace-nowrap">{formatZMW(sale.profit)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSale(sale.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sale Detail Modal */}
        <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
          <DialogContent className="sm:max-w-[600px] bg-[#070b14] border-white/10 p-0 overflow-hidden rounded-xl">
            {selectedSale && (
              <>
                <div className="p-6 border-b border-white/[0.05] bg-black/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <DialogTitle className="text-2xl font-black text-white tracking-tight">
                        Invoice <span className="text-primary font-mono font-normal">#INV-{selectedSale.id.toString().padStart(5, '0')}</span>
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                        {format(new Date(selectedSale.createdAt), "MMMM d, yyyy · HH:mm")}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize text-primary border-primary/30 bg-primary/10 font-mono">
                      {selectedSale.paymentMethod.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#ffcc00]/5 rounded-full blur-xl pointer-events-none"></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Customer</p>
                      <p className="font-bold text-white">{selectedSale.customerName || "Walk-in Customer"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Profit Made</p>
                      <p className="font-bold text-[#ffcc00] font-mono text-lg text-glow-gold whitespace-nowrap">{formatZMW(selectedSale.profit)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[10px] text-muted-foreground mb-3 uppercase tracking-widest">Order Items</h4>
                    <div className="space-y-2">
                      {selectedSale.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm p-3 rounded-lg border border-white/5 bg-black/20">
                          <div className="flex-1">
                            <p className="font-bold text-white/90">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{item.quantity} × {formatZMW(item.unitPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white font-mono whitespace-nowrap">{formatZMW(item.lineTotal)}</p>
                            <p className="text-[10px] text-emerald-400 font-mono mt-1 whitespace-nowrap">+{formatZMW(item.lineProfit)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.05] pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground font-mono">
                      <span>Subtotal</span><span className="whitespace-nowrap">{formatZMW(selectedSale.subtotal)}</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-sm text-destructive font-mono">
                        <span>Discount</span><span className="whitespace-nowrap">-{formatZMW(selectedSale.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black pt-3 border-t border-white/[0.05]">
                      <span className="text-white">Total Paid</span>
                      <span className="text-primary font-mono text-glow-cyan whitespace-nowrap">{formatZMW(selectedSale.totalAmount)}</span>
                    </div>
                  </div>

                  {selectedSale.notes && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Notes</p>
                      <p className="text-white/80 leading-relaxed">{selectedSale.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10"
                      onClick={() => window.print()}
                    >
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => { setSelectedSale(null); handleDeleteSale(selectedSale.id); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Void Sale
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
