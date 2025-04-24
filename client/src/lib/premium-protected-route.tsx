import { useAuth } from "@/hooks/use-auth";
import { Loader2, Flame } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Button } from "@/components/ui/button";

export function PremiumProtectedRoute({
  path,
  component: Component,
  requiredPlan = 'inferno',
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredPlan?: string;
}) {
  const { user, isLoading } = useAuth();

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
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If the user doesn't have the required plan, show an upgrade message
  if (user.plan !== requiredPlan) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto text-center p-6">
          <div className="bg-primary/10 rounded-full p-4 mb-6">
            <Flame className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Inferno Plan Required</h1>
          <p className="text-gray-600 mb-6">
            This area is exclusive to our Inferno Plan subscribers. Upgrade your plan to access the content creation area and unleash the full power of Kontent Fire.
          </p>
          <div className="space-y-4 w-full">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/subscription'}
            >
              Upgrade to Inferno Plan
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}