import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription/success',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const planDetails = {
    ember: {
      name: "Ember Plan",
      price: "$99/month",
      description: "Standard content creation for small businesses",
      features: [
        "Up to 50 content generations per month",
        "5 social media accounts",
        "Basic analytics",
        "Email support"
      ]
    },
    inferno: {
      name: "Inferno Plan",
      price: "$999/month",
      description: "Advanced content creation with unlimited generations",
      features: [
        "Unlimited content generations",
        "20 social media accounts",
        "Advanced analytics and insights",
        "Priority support",
        "Custom brand voice training"
      ]
    }
  };

  const currentPlan = plan === 'inferno' ? planDetails.inferno : planDetails.ember;

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentPlan.name}</CardTitle>
          <CardDescription>{currentPlan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">{currentPlan.price}</div>
          <ul className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Enter your card details</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentElement />
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !stripe || !elements}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, params] = useLocation();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const plan = searchParams.get('plan') || 'ember';

  useEffect(() => {
    if (!user) {
      // If user is not logged in, redirect to auth page
      window.location.href = '/auth';
      return;
    }

    const initializePayment = async () => {
      setIsLoading(true);
      try {
        // Call backend to create a subscription payment intent
        const response = await apiRequest("POST", "/api/create-subscription", { 
          plan,
          userId: user.id
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error("Error initializing payment:", error);
        setError("Unable to initialize payment. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [plan, user]);

  if (isLoading && !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Setting up your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
        <p className="text-gray-600">You're almost there! Set up your payment details below.</p>
      </div>

      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm plan={plan} />
        </Elements>
      )}
    </div>
  );
}