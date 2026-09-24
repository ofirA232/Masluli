import { lazy, Suspense, useEffect, useRef } from "react";
import { MotionConfig } from "motion/react";
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
import { PlanCoverProvider } from "@/components/PlanLoading";
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
  useSmoothScroll(location.pathname);
  // The first page paints as-is; only later navigations fade in, except into
  // a trip being generated, which arrives under the loading cover. Decided
  // once per page: the workspace clears that navigation state right away,
  // and re-deciding then would replay the fade.
  const firstPage = useRef(true);
  useEffect(() => {
    firstPage.current = false;
  }, []);
  const shell = useRef({ path: "", fade: false });
  if (shell.current.path !== location.pathname)
    shell.current = {
      path: location.pathname,
      fade: !firstPage.current && !location.state?.generate,
    };
  return (
    // Keyed on the path so each page mounts fresh and fades in (CSS). There is
    // no exit phase: the next page never waits for the old one to leave.
    <div
      key={location.pathname}
      className={shell.current.fade ? "route-shell is-entering" : "route-shell"}
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
    </div>
  );
}
export default function App() {
  useScrollReveal();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          {/* Under reduced motion, Motion keeps fades and drops movement. */}
          <MotionConfig reducedMotion="user">
            <PlanCoverProvider>
              <BrowserRouter>
                <AnimatedRoutes />
              </BrowserRouter>
            </PlanCoverProvider>
          </MotionConfig>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
