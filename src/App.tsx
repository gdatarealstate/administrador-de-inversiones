import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { User, onAuthStateChanged } from "firebase/auth";
import { AppLayout } from "@/components/AppLayout";
import { auth } from "@/lib/firebase";
import Dashboard from "./pages/Dashboard";
import Inversionistas from "./pages/Inversionistas";
import Contratos from "./pages/Contratos";
import Pagos from "./pages/Pagos";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedLayout({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route element={<ProtectedLayout isAuthenticated={Boolean(user)} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inversionistas" element={<Inversionistas />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
