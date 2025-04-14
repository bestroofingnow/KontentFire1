import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const [location] = useLocation();
  let auth;
  
  try {
    auth = useAuth();
  } catch (error) {
    console.error("Auth context not available:", error);
    // If auth context isn't available, just render a loader
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }
  
  const { user, isLoading } = auth;

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    // Only redirect if we're on this route
    if (location === path) {
      return (
        <Route path={path}>
          <Redirect to="/auth" />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
