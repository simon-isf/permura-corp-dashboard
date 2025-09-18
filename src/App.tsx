import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Companies from "./pages/admin/Companies";
import Users from "./pages/admin/Users";
import NotFound from "./pages/NotFound";

// Lazy load React Query DevTools for development - memoized to prevent infinite loops
let DevToolsComponent: React.ComponentType | null = null;
let devToolsLoaded = false;

const DevTools = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!devToolsLoaded) {
    try {
      const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
      DevToolsComponent = () => <ReactQueryDevtools initialIsOpen={false} />;
      devToolsLoaded = true;
    } catch (error) {
      console.warn('React Query DevTools not available:', error);
      DevToolsComponent = null;
      devToolsLoaded = true;
    }
  }

  return DevToolsComponent ? <DevToolsComponent /> : null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Log retry attempts in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Query retry attempt ${failureCount}:`, error)
        }

        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <Users />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
      {/* React Query DevTools - disabled temporarily to prevent loops */}
      {/* {process.env.NODE_ENV === 'development' && <DevTools />} */}
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
