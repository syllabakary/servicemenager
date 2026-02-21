import { Switch, Route, useLocation } from "wouter";
import axios from "axios";
import { setupAxiosAuth } from "@/config/api";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

setupAxiosAuth(axios);
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SiteTheme } from "@/components/SiteTheme";
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
import DevisDetail from "@/pages/admin/DevisDetail";
import AdminAvantages from "@/pages/admin/Avantages";
import AdminFormulairesDevis from "@/pages/admin/FormulairesDevis";
import AdminEmployes from "@/pages/admin/Employes";
import EmployeDetail from "@/pages/admin/EmployeDetail";
import AdminPatients from "@/pages/admin/Patients";
import AdminScans from "@/pages/admin/Scans";
import ScanQR from "@/pages/employe/ScanQR";
import EmployeLogin from "@/pages/employe/EmployeLogin";
import EmployeDashboard from "@/pages/employe/EmployeDashboard";
import PatientDetail from "@/pages/employe/PatientDetail";
import MyPatients from "@/pages/employe/MyPatients";
import ChangePassword from "@/pages/employe/ChangePassword";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/agences" component={Agencies} />
      <Route path="/agences/:slug" component={AgencyDetail} />
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
      <Route path="/admin/devis/:id" component={DevisDetail} />
      <Route path="/admin/formulaires-devis" component={AdminFormulairesDevis} />
      <Route path="/admin/avantages" component={AdminAvantages} />
      <Route path="/admin/employes" component={AdminEmployes} />
      <Route path="/admin/employe-detail" component={EmployeDetail} />
      <Route path="/admin/patients" component={AdminPatients} />
      <Route path="/admin/scans" component={AdminScans} />
      <Route path="/employe/login" component={EmployeLogin} />
      <Route path="/employe/dashboard" component={EmployeDashboard} />
      <Route path="/employe/scan" component={ScanQR} />
      <Route path="/employe/patients" component={MyPatients} />
      <Route path="/employe/patient/:id" component={PatientDetail} />
      <Route path="/employe/change-password" component={ChangePassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const isEmployePage = location.startsWith("/employe");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteTheme />
        <ScrollToTop />
        {!isAdminPage && !isEmployePage ? (
          <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
            <Navbar />
            <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-20">
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
