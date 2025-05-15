import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function SubscriptionSuccessPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!user) return;

      try {
        // Get the payment_intent and payment_intent_client_secret from URL
        const searchParams = new URLSearchParams(window.location.search);
        const paymentIntentId = searchParams.get('payment_intent');
        
        if (!paymentIntentId) {
          setError("Invalid payment information");
          setIsLoading(false);
          return;
        }

        // Verify the payment with the server
        const response = await apiRequest("POST", "/api/verify-subscription", { 
          paymentIntentId,
          userId: user.id
        });
        
        const data = await response.json();
        setSubscriptionData(data);
      } catch (error) {
        console.error("Error verifying payment:", error);
        setError("Failed to verify your payment. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  const planName = user?.plan === 'inferno' ? 'Inferno Plan' : 'Ember Plan';

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card className="border-green-100">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to Kontent Fire
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-1">Subscription Details</h3>
            <p className="text-gray-600">{planName}</p>
            {subscriptionData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Subscription ID:</span>
                  <span className="font-medium">{subscriptionData.subscriptionId?.substring(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next billing date:</span>
                  <span className="font-medium">
                    {subscriptionData.nextBillingDate ? 
                      new Date(subscriptionData.nextBillingDate).toLocaleDateString() : 
                      'Not available'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="mt-4">
            You now have access to all features of your subscription plan. 
            Get started creating amazing content right away!
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}