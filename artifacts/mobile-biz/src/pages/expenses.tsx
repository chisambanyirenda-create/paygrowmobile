import { Layout } from "@/components/layout";
import { 
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getListExpensesQueryKey,
  Expense
} from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatZMW, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Receipt, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useListExpenses({ 
    category: categoryFilter !== 'all' ? categoryFilter : undefined 
  });
  
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      category: "other",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    }
  });

  const onSubmit = (data: ExpenseFormValues) => {
    // Ensure date is properly formatted as ISO for API
    const formattedData = {
      ...data,
      date: new Date(data.date).toISOString()
    };

    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data: formattedData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          setEditingExpense(null);
          toast({ title: "Expense updated" });
        }
      });
    } else {
      createExpense.mutate({ data: formattedData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          setIsCreateOpen(false);
          form.reset({
            description: "",
            category: "other",
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            notes: "",
          });
          toast({ title: "Expense recorded" });
        }
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    form.reset({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || "",
    });
    setEditingExpense(expense);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this expense record?")) {
      deleteExpense.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
          toast({ title: "Expense deleted" });
        }
      });
    }
  };

  const categories = ["rent", "utilities", "transport", "marketing", "salaries", "stock", "other"];

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto page-enter">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Expenses
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-32"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Track operating costs to calculate accurate net profit.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              form.reset({
                description: "",
                category: "other",
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                notes: "",
              });
              setEditingExpense(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="font-bold tracking-wide shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.8)]">
                <Plus className="w-4 h-4 mr-2" /> Record Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-destructive/20 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-3 text-xl tracking-tight text-glow-red font-bold">
                  <Receipt className="w-5 h-5" />
                  {editingExpense ? 'Edit Expense' : 'Record New Expense'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Shop Rent October" className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Amount (ZMW) *</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} className="bg-background border-white/10 font-mono text-destructive" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date *</FormLabel>
                        <FormControl><Input type="date" {...field} className="bg-background border-white/10 font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background border-white/10"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Additional Notes</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingExpense(null); }}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={createExpense.isPending || updateExpense.isPending} className="font-bold">
                      {editingExpense ? 'Save Changes' : 'Save Expense'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

           {/* Edit Dialog handled by state */}
           <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
            <DialogContent className="bg-card border-destructive/20 sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-3 text-xl tracking-tight text-glow-red font-bold">
                  <Receipt className="w-5 h-5" /> Edit Expense
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Description *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Shop Rent October" className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Amount (ZMW) *</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} className="bg-background border-white/10 font-mono text-destructive" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Date *</FormLabel>
                        <FormControl><Input type="date" {...field} className="bg-background border-white/10 font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-background border-white/10"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Additional Notes</FormLabel>
                      <FormControl><Input {...field} className="bg-background border-white/10" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={() => setEditingExpense(null)}>Cancel</Button>
                    <Button type="submit" variant="destructive" disabled={updateExpense.isPending} className="font-bold">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Top Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-0 bg-card/60">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Records</span>
             <span className="text-4xl font-black font-mono text-white">{formatNumber(expenses?.length || 0)}</span>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center border-0 card-accent-red stat-glow-red relative overflow-hidden">
             <span className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-2">Total Operating Cost</span>
             <span className="text-4xl font-black font-mono text-destructive text-glow-red">
               {formatZMW(expenses?.reduce((acc, e) => acc + e.amount, 0) || 0)}
             </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col border-0">
          <div className="p-4 border-b border-white/[0.05] bg-black/20 flex justify-end">
            <div className="w-full sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                     <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-secondary/80 to-secondary/40 hover:from-secondary/80 hover:to-secondary/40 border-b border-white/[0.05]">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Description</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Category</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground font-bold">Amount</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.02]">
                      <TableCell><Skeleton className="h-6 w-24 bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full max-w-[300px] bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 bg-white/[0.02]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 ml-auto bg-white/[0.02]" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Receipt className="w-16 h-16 opacity-30 text-destructive" />
                        <p className="text-lg font-medium text-white/50">No expenses recorded.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((expense) => (
                    <TableRow key={expense.id} className="group hover:bg-white/[0.025] border-b border-white/[0.02] transition-colors">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                         <div className="flex items-center gap-2 font-mono">
                           <CalendarIcon className="w-4 h-4 text-white/30" />
                           {format(new Date(expense.date), "MMM d, yyyy")}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-tight">{expense.description}</span>
                          {expense.notes && <span className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-widest">{expense.notes}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-destructive border-destructive/30 bg-destructive/10 font-mono text-[10px]">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-destructive font-mono text-glow-red text-base">-{formatZMW(expense.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10" onClick={() => handleEdit(expense)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(expense.id)}>
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
    </Layout>
  );
}