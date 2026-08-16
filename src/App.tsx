import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Portefolje from "./pages/Portefolje";
import Aksje from "./pages/Aksje";
import Auth from "./pages/Auth";
import NyttPassord from "./pages/NyttPassord";
import Personvern from "./pages/Personvern";
import Vilkar from "./pages/Vilkar";
import Spill from "./pages/Spill";
import Borskrakket from "./pages/Borskrakket";
import Admin from "./pages/Admin";
import Competition from "./pages/Competition";
import Account from "./pages/Account";
import ReportViewer from "./pages/ReportViewer";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Sikkerhetsnett for «glemt passord»: uansett hvilken side
 * gjenopprettingslenken lander på, sendes brukeren til /nytt-passord.
 */
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/nytt-passord");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
};

/**
 * Ny side = toppen av siden.
 *
 * React Router beholder rulleposisjonen ved navigering. Trykket man
 * «Les reglene» nede på forsiden, landet man derfor midt nedi vilkårene
 * i stedet for på reglene som står øverst. Hopper man til en anker-lenke
 * (#regler), lar vi nettleseren beholde oppførselen sin.
 */
const RullTilToppen = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RecoveryRedirect />
        <RullTilToppen />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/portefolje" element={<Portefolje />} />
          <Route path="/aksje/:ticker" element={<Aksje />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/nytt-passord" element={<NyttPassord />} />
          <Route path="/personvern" element={<Personvern />} />
          <Route path="/vilkar" element={<Vilkar />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/konkurranse" element={<Competition />} />
          <Route path="/spill" element={<Spill />} />
          <Route path="/borskrakket" element={<Borskrakket />} />
          <Route path="/konto" element={<Account />} />
          <Route path="/rapport" element={<ReportViewer />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
