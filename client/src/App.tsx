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
import SubscriptionPage from "@/pages/subscription-page";
import AutoContentPage from "@/pages/auto-content-page";
import AutoPostingSetup from "@/pages/auto-posting-setup";
import ListingsPage from "@/pages/listings-page";
import FactCheckPage from "@/pages/fact-check-page";
import PRKreationPage from "@/pages/pr-kreation-page";
import PipelinesPage from "@/pages/pipelines-page";
import PipelineRunPage from "@/pages/pipeline-run-page";
import TestAuthPage from "@/pages/test-auth-page";
import { Loader2 } from "lucide-react";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAuthPage from "@/pages/admin/admin-auth-page";

// Components
import { AIAssistant } from "@/components/assistant/ai-assistant";
import FacebookSDKProvider from "@/components/integrations/facebook-sdk-provider";

// Route protection components
import { ProtectedRoute } from "@/lib/protected-route";
import { PremiumProtectedRoute } from "@/lib/premium-protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";

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
  
  // Facebook App ID from env
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID || '1420191842748498';
  
  return (
    <FacebookSDKProvider appId={facebookAppId} version="v18.0">
      {/* AI Assistant always visible for authenticated users */}
      {user && !user.isAdmin && <AIAssistant />}
      
      <Switch>
        {/* Regular user authentication */}
        <Route path="/auth">
          {user ? <Redirect to="/" /> : <AuthPage />}
        </Route>
        
        {/* Admin authentication - separate from regular user auth */}
        <Route path="/admin/login">
          {user && user.isAdmin ? <Redirect to="/admin" /> : <AdminAuthPage />}
        </Route>
      
      {/* Admin protected routes */}
      <AdminProtectedRoute path="/admin" component={AdminDashboard} />
      
      {/* Regular user routes */}
      <Route path="/">
        <ProtectedRoute path="/" component={HomePage} />
      </Route>
      <Route path="/content">
        <PremiumProtectedRoute path="/content" component={ContentPage} requiredPlan="inferno" />
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
      <Route path="/auto-content">
        <ProtectedRoute path="/auto-content" component={AutoContentPage} />
      </Route>
      <Route path="/auto-posting-setup">
        <ProtectedRoute path="/auto-posting-setup" component={AutoPostingSetup} />
      </Route>
      <Route path="/listings">
        <ProtectedRoute path="/listings" component={ListingsPage} />
      </Route>
      <Route path="/fact-check">
        <ProtectedRoute path="/fact-check" component={FactCheckPage} />
      </Route>
      <Route path="/pr-kreation">
        <PremiumProtectedRoute path="/pr-kreation" component={PRKreationPage} requiredPlan="inferno" />
      </Route>
      <Route path="/pipelines">
        <PremiumProtectedRoute path="/pipelines" component={PipelinesPage} requiredPlan="inferno" />
      </Route>
      <Route path="/pipeline-runs/:runId">
        <PremiumProtectedRoute path="/pipeline-runs/:runId" component={PipelineRunPage} requiredPlan="inferno" />
      </Route>
      {/* Test auth route - not protected for debugging */}
      <Route path="/test-auth">
        <TestAuthPage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
    </FacebookSDKProvider>
  );
}

export default App;
