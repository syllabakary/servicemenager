import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Agencies from "@/pages/Agencies";
import AgencyDetail from "@/pages/AgencyDetail";
import Contact from "@/pages/Contact";
import QuoteRequest from "@/pages/QuoteRequest";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminServices from "@/pages/admin/Services";
import AdminAgences from "@/pages/admin/Agences";
import AdminBannieres from "@/pages/admin/Bannieres";
import AdminUtilisateurs from "@/pages/admin/Utilisateurs";
import AdminCategories from "@/pages/admin/Categories";
import AdminParametres from "@/pages/admin/Parametres";
import AdminAvis from "@/pages/admin/Avis";
import AdminDevis from "@/pages/admin/Devis";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/agences" component={Agencies} />
      <Route path="/agences/:id" component={AgencyDetail} />
      <Route path="/contact" component={Contact} />
      <Route path="/devis" component={QuoteRequest} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/agences" component={AdminAgences} />
      <Route path="/admin/bannieres" component={AdminBannieres} />
      <Route path="/admin/parametres" component={AdminParametres} />
      <Route path="/admin/utilisateurs" component={AdminUtilisateurs} />
      <Route path="/admin/avis" component={AdminAvis} />
      <Route path="/admin/devis" component={AdminDevis} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        {!isAdminPage ? (
          <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
            <Navbar />
            <main className="flex-1 w-full max-w-full overflow-x-hidden">
              <Router />
            </main>
            <Footer />
          </div>
        ) : (
          <Router />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
