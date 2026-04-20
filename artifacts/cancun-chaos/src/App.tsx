import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getPlayerId } from "@/lib/auth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import GamePage from "@/pages/game";
import LocationPage from "@/pages/location";
import MinigamePage from "@/pages/minigame";
import InventoryPage from "@/pages/inventory";
import SocialPage from "@/pages/social";
import MissionsPage from "@/pages/missions";
import AchievementsPage from "@/pages/achievements";
import HousePage from "@/pages/house";
import AdminPage from "@/pages/admin";
import ConsolaPage from "@/pages/consola";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [_, setLocation] = useLocation();
  const playerId = getPlayerId();

  useEffect(() => {
    if (!playerId) setLocation("/");
  }, [playerId, setLocation]);

  if (!playerId) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/game">
        <AuthGuard>
          <GamePage />
        </AuthGuard>
      </Route>
      <Route path="/location/:id">
        <AuthGuard>
          <LocationPage />
        </AuthGuard>
      </Route>
      <Route path="/minigame/:id">
        <AuthGuard>
          <MinigamePage />
        </AuthGuard>
      </Route>
      <Route path="/inventory">
        <AuthGuard>
          <InventoryPage />
        </AuthGuard>
      </Route>
      <Route path="/social">
        <AuthGuard>
          <SocialPage />
        </AuthGuard>
      </Route>
      <Route path="/missions">
        <AuthGuard>
          <MissionsPage />
        </AuthGuard>
      </Route>
      <Route path="/achievements">
        <AuthGuard>
          <AchievementsPage />
        </AuthGuard>
      </Route>
      <Route path="/house">
        <AuthGuard>
          <HousePage />
        </AuthGuard>
      </Route>
      <Route path="/admin" component={AdminPage} />
      <Route path="/consola/consola" component={ConsolaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
