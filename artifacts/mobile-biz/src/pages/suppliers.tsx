import { Layout } from "@/components/layout";
import { 
  useListSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  getListSuppliersQueryKey,
  Supplier
} from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Truck, Phone, Mail, MapPin, Search, Building2, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const supplierSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

function SupplierForm({ form, onSubmit, isPending, onCancel, isEdit }: {
  form: ReturnType<typeof useForm<SupplierFormValues>>;
  onSubmit: (d: SupplierFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Company Name *</FormLabel>
            <FormControl><Input {...field} className="bg-background border-white/10" placeholder="e.g. Tecno Mobile Zambia" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactName" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Contact Person</FormLabel>
            <FormControl><Input {...field} className="bg-background border-white/10" placeholder="Sales rep name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Phone</FormLabel>
              <FormControl><Input {...field} className="bg-background border-white/10 font-mono" placeholder="+260 977..." /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email</FormLabel>
              <FormControl><Input type="email" {...field} className="bg-background border-white/10" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Address / Location</FormLabel>
            <FormControl><Input {...field} className="bg-background border-white/10" placeholder="Street, Area, City" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Internal Notes</FormLabel>
            <FormControl><Textarea {...field} className="bg-background border-white/10" placeholder="Payment terms, delivery lead time..." /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
          <Button type="button" variant="outline" className="border-white/10" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90">
            {isEdit ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Suppliers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useListSuppliers();
  
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactName: "", phone: "", email: "", address: "", notes: "" }
  });

  const editForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactName: "", phone: "", email: "", address: "", notes: "" }
  });

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliers || [];
    return (suppliers || []).filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.contactName || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const suppliersWithContact = useMemo(() =>
    (suppliers || []).filter(s => s.phone || s.email).length,
    [suppliers]
  );

  const onSubmitCreate = (data: SupplierFormValues) => {
    createSupplier.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        setIsCreateOpen(false);
        form.reset();
        toast({ title: "Supplier added" });
      },
      onError: () => toast({ title: "Error adding supplier", variant: "destructive" })
    });
  };

  const onSubmitEdit = (data: SupplierFormValues) => {
    if (!editingSupplier) return;
    updateSupplier.mutate({ id: editingSupplier.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        setEditingSupplier(null);
        toast({ title: "Supplier updated" });
      },
      onError: () => toast({ title: "Error updating supplier", variant: "destructive" })
    });
  };

  const handleEdit = (supplier: Supplier) => {
    editForm.reset({
      name: supplier.name,
      contactName: supplier.contactName || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setEditingSupplier(supplier);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this supplier? Products linked to them will keep the supplier ID but lose the reference.")) {
      deleteSupplier.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
          toast({ title: "Supplier removed" });
        }
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
              Suppliers
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Manage your wholesale contacts and distributors.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) form.reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground hover:from-primary/90 hover:to-cyan-400 border-0 font-bold tracking-wide shadow-[0_0_20px_-5px_hsl(var(--primary))]">
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-white tracking-tight">Add New Supplier</DialogTitle>
              </DialogHeader>
              <SupplierForm
                form={form}
                onSubmit={onSubmitCreate}
                isPending={createSupplier.isPending}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-2xl border-0 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))_0%,_transparent_70%)]"></div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Partners</span>
            <span className="text-4xl font-black font-mono text-white">{suppliers?.length || 0}</span>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-0 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_hsl(145_75%_45%)_0%,_transparent_70%)]"></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Have Contact</span>
            <span className="text-4xl font-black font-mono text-emerald-400">{suppliersWithContact}</span>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-0 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top,_hsl(270_80%_65%)_0%,_transparent_70%)]"></div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
              <StickyNote className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">With Notes</span>
            <span className="text-4xl font-black font-mono text-violet-400">
              {(suppliers || []).filter(s => s.notes).length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] flex flex-col sm:flex-row gap-3 items-center bg-black/20">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-9 bg-background/50 border-white/10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest ml-auto shrink-0">
              {filteredSuppliers.length} of {suppliers?.length || 0} partners
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-secondary/80 to-secondary/40 hover:from-secondary/80 hover:to-secondary/40 border-b border-white/[0.05]">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Company</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Contact Person</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Contact Details</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Address</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Notes</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-6 w-full bg-white/[0.02]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Truck className="w-16 h-16 opacity-30 text-primary" />
                        <p className="text-lg font-medium text-white/50">{search ? "No matching suppliers." : "No suppliers added yet."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="group hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors cursor-pointer" onClick={() => setViewingSupplier(supplier)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="font-black text-primary text-sm">{supplier.name.charAt(0)}</span>
                          </div>
                          <span className="font-bold text-white">{supplier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{supplier.contactName || <span className="opacity-40 text-[10px] uppercase tracking-widest">—</span>}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          {supplier.phone && (
                            <span className="flex items-center gap-2 font-mono text-xs"><Phone className="w-3 h-3 text-white/30" /> {supplier.phone}</span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-2 text-xs"><Mail className="w-3 h-3 text-white/30" /> {supplier.email}</span>
                          )}
                          {!supplier.phone && !supplier.email && <span className="opacity-40 text-[10px] uppercase tracking-widest">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.address ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono uppercase tracking-widest">
                            <MapPin className="w-3 h-3 shrink-0 text-white/30" />
                            <span className="line-clamp-1">{supplier.address}</span>
                          </span>
                        ) : <span className="opacity-40 text-[10px] uppercase tracking-widest">—</span>}
                      </TableCell>
                      <TableCell>
                        {supplier.notes ? (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{supplier.notes}</span>
                        ) : <span className="opacity-40 text-[10px] uppercase tracking-widest">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={() => handleEdit(supplier)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(supplier.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="bg-card border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-white tracking-tight">Edit Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm
            form={editForm}
            onSubmit={onSubmitEdit}
            isPending={updateSupplier.isPending}
            onCancel={() => setEditingSupplier(null)}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
        <DialogContent className="bg-[#070b14] border-white/10 sm:max-w-[480px] p-0 overflow-hidden rounded-xl">
          {viewingSupplier && (
            <>
              <div className="p-6 border-b border-white/[0.05] bg-black/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-violet-500"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_hsl(var(--primary))]">
                    <span className="font-black text-2xl text-primary">{viewingSupplier.name.charAt(0)}</span>
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-white">{viewingSupplier.name}</DialogTitle>
                    {viewingSupplier.contactName && (
                      <p className="text-muted-foreground text-sm mt-0.5">c/o {viewingSupplier.contactName}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {viewingSupplier.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-white">{viewingSupplier.phone}</span>
                  </div>
                )}
                {viewingSupplier.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-white">{viewingSupplier.email}</span>
                  </div>
                )}
                {viewingSupplier.address && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{viewingSupplier.address}</span>
                  </div>
                )}
                {viewingSupplier.notes && (
                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Notes</p>
                    <p className="text-white/80 text-sm leading-relaxed">{viewingSupplier.notes}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" onClick={() => { setViewingSupplier(null); handleEdit(viewingSupplier); }}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => { setViewingSupplier(null); handleDelete(viewingSupplier.id); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
