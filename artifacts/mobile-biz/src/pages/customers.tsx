import { Layout } from "@/components/layout";
import { 
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getListCustomersQueryKey,
  Customer
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatZMW, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Users, MapPin, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function Customers() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers, isLoading } = useListCustomers({ search: search || undefined });
  
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    }
  });

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomer.mutate({ id: editingCustomer.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setEditingCustomer(null);
          toast({ title: "Customer updated" });
        }
      });
    } else {
      createCustomer.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          setIsCreateOpen(false);
          form.reset();
          toast({ title: "Customer added" });
        }
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    form.reset({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setEditingCustomer(customer);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this customer?")) {
      deleteCustomer.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
          toast({ title: "Customer deleted" });
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
              Customers
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Manage your client base and track their value.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { form.reset(); setEditingCustomer(null); }} className="font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-white tracking-tight">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Full Name *</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Phone Number</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10 font-mono" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email Address</FormLabel>
                      <FormControl><Input type="email" {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Address / Location</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingCustomer(null); }}>Cancel</Button>
                    <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending} className="font-bold">
                      {editingCustomer ? 'Save Changes' : 'Add Customer'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog Trigger via State */}
          <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
            <DialogContent className="bg-card border-white/10 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-white tracking-tight">Edit Customer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Full Name *</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Phone Number</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10 font-mono" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Email Address</FormLabel>
                      <FormControl><Input type="email" {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Address / Location</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>Cancel</Button>
                    <Button type="submit" disabled={updateCustomer.isPending} className="font-bold">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Top Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-0 card-accent-emerald stat-glow-emerald relative overflow-hidden">
             <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Total Customer Base</span>
             <span className="text-4xl font-black font-mono text-white text-glow-emerald">{formatNumber(customers?.length || 0)}</span>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-0 card-accent-cyan stat-glow-cyan relative overflow-hidden">
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Aggregate Lifetime Value</span>
             <span className="text-4xl font-black font-mono text-white text-glow-cyan">
               {formatZMW(customers?.reduce((acc, c) => acc + c.totalSpent, 0) || 0)}
             </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] bg-black/20">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers by name, phone or email..." 
                className="pl-9 bg-background/50 border-white/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-secondary/80 to-secondary/40 hover:from-secondary/80 hover:to-secondary/40 border-b border-white/[0.05]">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Customer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Contact</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Joined</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider text-muted-foreground font-bold">Total Orders</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Lifetime Value</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      <TableCell><Skeleton className="h-12 w-full bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 mx-auto bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/[0.02]" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : customers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Users className="w-16 h-16 opacity-30 text-emerald-500" />
                        <p className="text-lg font-medium text-white/50">No customers found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers?.map((customer) => {
                    const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <TableRow key={customer.id} className="group hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-primary/20 text-emerald-400 flex items-center justify-center font-black font-mono border border-emerald-500/30 shadow-[0_0_15px_-3px_hsl(145_75%_45%/0.3)]">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-base tracking-tight">{customer.name}</span>
                              {customer.address && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-mono uppercase tracking-widest">
                                  <MapPin className="w-3 h-3" /> {customer.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                            {customer.phone && (
                              <span className="flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-white/40" /> {customer.phone}</span>
                            )}
                            {customer.email && (
                              <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-white/40" /> {customer.email}</span>
                            )}
                            {!customer.phone && !customer.email && <span className="italic opacity-50 text-[10px] uppercase tracking-widest">No contact info</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {format(new Date(customer.createdAt), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-white/80 text-lg">
                          {customer.totalPurchases}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-primary text-lg font-mono text-glow-cyan">{formatZMW(customer.totalSpent)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={() => handleEdit(customer)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(customer.id)}>
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