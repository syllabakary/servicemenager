import React, { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import axios from "axios";
import { setupAxiosAuth } from "@/config/api";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

setupAxiosAuth(axios);
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PermissionErrorProvider } from "@/hooks/usePermissionError";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SiteTheme } from "@/components/SiteTheme";
import Home from "@/pages/Home";

// Lazy load tout sauf l'accueil pour un premier chargement très rapide
const Services = React.lazy(() => import("@/pages/Services"));
const ServiceDetail = React.lazy(() => import("@/pages/ServiceDetail"));
const Agencies = React.lazy(() => import("@/pages/Agencies"));
const AgencyDetail = React.lazy(() => import("@/pages/AgencyDetail"));
const Contact = React.lazy(() => import("@/pages/Contact"));
const QuoteRequest = React.lazy(() => import("@/pages/QuoteRequest"));
const NotFound = React.lazy(() => import("@/pages/not-found"));

// Admin & employe
const AdminLogin = React.lazy(() => import("@/pages/admin/Login"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const AdminServices = React.lazy(() => import("@/pages/admin/Services"));
const AdminAgences = React.lazy(() => import("@/pages/admin/Agences"));
const AdminBannieres = React.lazy(() => import("@/pages/admin/Bannieres"));
const AdminUtilisateurs = React.lazy(() => import("@/pages/admin/Utilisateurs"));
const AdminCategories = React.lazy(() => import("@/pages/admin/Categories"));
const AdminParametres = React.lazy(() => import("@/pages/admin/Parametres"));
const AdminAvis = React.lazy(() => import("@/pages/admin/Avis"));
const AdminDevis = React.lazy(() => import("@/pages/admin/Devis"));
const DevisDetail = React.lazy(() => import("@/pages/admin/DevisDetail"));
const NouveauDevis = React.lazy(() => import("@/pages/admin/NouveauDevis"));
const AdminAvantages = React.lazy(() => import("@/pages/admin/Avantages"));
const AdminFormulairesDevis = React.lazy(() => import("@/pages/admin/FormulairesDevis"));
const AdminEmployes = React.lazy(() => import("@/pages/admin/Employes"));
const EmployeDetail = React.lazy(() => import("@/pages/admin/EmployeDetail"));
const AdminPatients = React.lazy(() => import("@/pages/admin/Patients"));
const AdminScans = React.lazy(() => import("@/pages/admin/Scans"));
const AdminRapportHeures = React.lazy(() => import("@/pages/admin/RapportHeures"));
const AdminChangePassword = React.lazy(() => import("@/pages/admin/AdminChangePassword"));
const AdminContactMessages = React.lazy(() => import("@/pages/admin/ContactMessages"));
const AdminFactures = React.lazy(() => import("@/pages/admin/Factures"));
const AdminLogs = React.lazy(() => import("@/pages/admin/Logs"));
const AdminPermissions = React.lazy(() => import("@/pages/admin/Permissions"));
const AdminHero = React.lazy(() => import("@/pages/admin/Hero"));
const AdminCorbeille = React.lazy(() => import("@/pages/admin/Corbeille"));
const ScanQR = React.lazy(() => import("@/pages/employe/ScanQR"));
const EmployeLogin = React.lazy(() => import("@/pages/employe/EmployeLogin"));
const EmployeDashboard = React.lazy(() => import("@/pages/employe/EmployeDashboard"));
const PatientDetail = React.lazy(() => import("@/pages/employe/PatientDetail"));
const MyPatients = React.lazy(() => import("@/pages/employe/MyPatients"));
const ChangePassword = React.lazy(() => import("@/pages/employe/ChangePassword"));

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-site-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      <Route path="/gestion-ease/acces-prive" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/agences" component={AdminAgences} />
      <Route path="/admin/bannieres" component={AdminBannieres} />
      <Route path="/admin/parametres" component={AdminParametres} />
      <Route path="/admin/utilisateurs" component={AdminUtilisateurs} />
      <Route path="/admin/avis" component={AdminAvis} />
      <Route path="/admin/devis" component={AdminDevis} />
      <Route path="/admin/devis/nouveau" component={NouveauDevis} />
      <Route path="/admin/devis/:id" component={DevisDetail} />
      <Route path="/admin/formulaires-devis" component={AdminFormulairesDevis} />
      <Route path="/admin/avantages" component={AdminAvantages} />
      <Route path="/admin/employes" component={AdminEmployes} />
      <Route path="/admin/employe-detail" component={EmployeDetail} />
      <Route path="/admin/patients" component={AdminPatients} />
      <Route path="/admin/scans" component={AdminScans} />
      <Route path="/admin/rapport-heures" component={AdminRapportHeures} />
      <Route path="/admin/change-password" component={AdminChangePassword} />
      <Route path="/admin/contact-messages" component={AdminContactMessages} />
      <Route path="/admin/factures" component={AdminFactures} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/permissions" component={AdminPermissions} />
      <Route path="/admin/hero" component={AdminHero} />
      <Route path="/admin/corbeille" component={AdminCorbeille} />
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
      <PermissionErrorProvider>
      <TooltipProvider>
        <SiteTheme />
        <ScrollToTop />
        {!isAdminPage && !isEmployePage ? (
          <div className="flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
            <Navbar />
            <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-20">
              <Suspense fallback={<PageLoader />}>
                <Router />
              </Suspense>
            </main>
            <Footer />
          </div>
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        )}
        <Toaster />
      </TooltipProvider>
      </PermissionErrorProvider>
    </QueryClientProvider>
  );
}

export default App;
