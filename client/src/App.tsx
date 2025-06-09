import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PosPage from "@/pages/PosPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import ServicesPage from "@/pages/ServicesPage";
import UsersPage from "@/pages/UsersPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ReportsPage from "@/pages/ReportsPage";
import CustomersPage from "@/pages/CustomersPage";
import Layout from "@/components/layout/Layout";
import OnlineStorePage from "./pages/online-store/OnlineStorePage";



function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        <Layout>
          <DashboardPage />
        </Layout>
      </Route>

       <Route path="/store" component={OnlineStorePage} />
      
      <Route path="/dashboard">
        <Layout>
          <DashboardPage />
        </Layout>
      </Route>
      
      <Route path="/pos">
        <Layout>
          <PosPage />
        </Layout>
      </Route>
      
      <Route path="/orders">
        <Layout>
          <OrdersPage />
        </Layout>
      </Route>
      
      <Route path="/inventory">
        <Layout>
          <InventoryPage />
        </Layout>
      </Route>
      
      <Route path="/services">
        <Layout>
          <ServicesPage />
        </Layout>
      </Route>
      
      <Route path="/users">
        <Layout>
          <UsersPage />
        </Layout>
      </Route>
      
      <Route path="/expenses">
        <Layout>
          <ExpensesPage />
        </Layout>
      </Route>
      
      
      <Route path="/customers">
        <Layout>
          <CustomersPage />
        </Layout>
      </Route>
      
      <Route path="/reports">
        <Layout>
          <ReportsPage />
        </Layout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
