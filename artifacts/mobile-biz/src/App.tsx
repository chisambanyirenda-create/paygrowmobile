import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import Products from '@/pages/products';
import Sales from '@/pages/sales';
import Customers from '@/pages/customers';
import Expenses from '@/pages/expenses';
import Suppliers from '@/pages/suppliers';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';
import AIAdvisor from '@/pages/ai-advisor';
import Money from '@/pages/money';
import Growth from '@/pages/growth';
import Analytics from '@/pages/analytics';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Products} />
      <Route path="/sales" component={Sales} />
      <Route path="/customers" component={Customers} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/reports" component={Reports} />
      <Route path="/ai-advisor" component={AIAdvisor} />
      <Route path="/money" component={Money} />
      <Route path="/growth" component={Growth} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
