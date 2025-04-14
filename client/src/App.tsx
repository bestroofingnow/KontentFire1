import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

// Protected route component
function ProtectedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <Component />;
}

function App() {
  const { user, isLoading } = useAuth();
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/">
        <ProtectedRoute path="/" component={HomePage} />
      </Route>
      <Route path="/content">
        <ProtectedRoute path="/content" component={ContentPage} />
      </Route>
      <Route path="/schedule">
        <ProtectedRoute path="/schedule" component={SchedulePage} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      </Route>
      <Route path="/integrations">
        <ProtectedRoute path="/integrations" component={IntegrationsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute path="/settings" component={SettingsPage} />
      </Route>
      <Route path="/subscription">
        <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute path="/admin" component={AdminPage} />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;
