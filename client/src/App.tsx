import { Switch, Route, Redirect, useLocation } from "wouter";
import { useState, useEffect } from "react";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import ContentPage from "@/pages/content-page";
import SchedulePage from "@/pages/schedule-page";
import AnalyticsPage from "@/pages/analytics-page";
import IntegrationsPage from "@/pages/integrations-page";
import SettingsPage from "@/pages/settings-page";
import AdminPage from "@/pages/admin-page";
import SubscriptionPage from "@/pages/subscription-page";
import { Loader2 } from "lucide-react";

function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();

  // Fetch user data when component mounts
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Not logged in - that's okay
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Protected route component
  function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
    if (!isAuthenticated()) {
      // Redirect to auth page if not logged in
      return <Route path={path}><Redirect to="/auth" /></Route>;
    }
    
    return <Route path={path} component={Component} />;
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated() ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/content" component={ContentPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/integrations" component={IntegrationsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
