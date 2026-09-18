import { lazy, Suspense } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import Index from "./pages/Index";
const Auth = lazy(() => import("./pages/Auth"));
const Trip = lazy(() => import("./pages/Trip"));
const NewTrip = lazy(() => import("./pages/NewTrip"));
const MyTrips = lazy(() => import("./pages/MyTrips"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Legal = lazy(() => import("./pages/Legal"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, gcTime: 0 },
  },
});
function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useSmoothScroll(location.pathname);
  const fade = reduce ? { opacity: 1 } : { opacity: 0 };
  return (
    // mode="wait" lets the old page leave before the next one arrives, so the
    // two are never on screen together.
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="route-shell"
        initial={fade}
        animate={{ opacity: 1 }}
        exit={fade}
        transition={{ duration: reduce ? 0 : 0.22, ease: [0.2, 0, 0, 1] }}
      >
        <Suspense
          fallback={
            <div className="empty-state" role="status">
              רק רגע, יוצאים לדרך…
            </div>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/trip/new" element={<NewTrip />} />
            <Route path="/trip/:id" element={<Trip />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/privacy" element={<Legal />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
export default function App() {
  useScrollReveal();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
