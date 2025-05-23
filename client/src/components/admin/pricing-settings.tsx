import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Pricing schema
const pricingSchema = z.object({
  blazePrice: z.coerce.number().min(1, "Price must be at least $1").max(1000, "Price cannot exceed $1,000"),
  infernoPrice: z.coerce.number().min(1, "Price must be at least $1").max(5000, "Price cannot exceed $5,000"),
  selfPromoEnabled: z.boolean().default(true),
  selfPromoInterval: z.coerce.number().min(1, "Interval must be at least 1 day").max(30, "Interval cannot exceed 30 days"),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

type AdminSettings = {
  id: number;
  infernoPrice: number;
  blazePrice: number;
  stripeProductId: string | null;
  blazePriceId: string | null;
  infernoPriceId: string | null;
  selfPromoEnabled: boolean;
  selfPromoInterval: number;
};

type PricingSettingsProps = {
  settings: AdminSettings | undefined;
  isLoading: boolean;
};

export default function PricingSettings({ settings, isLoading }: PricingSettingsProps) {
  const { toast } = useToast();
  const [stripeSetupStatus, setStripeSetupStatus] = useState<'setup' | 'pending' | 'complete' | 'error'>(
    settings?.stripeProductId ? 'complete' : 'setup'
  );
  
  // Initialize form with settings
  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      blazePrice: settings ? settings.blazePrice / 100 : 99, // Convert cents to dollars
      infernoPrice: settings ? settings.infernoPrice / 100 : 199, // Convert cents to dollars
      selfPromoEnabled: settings ? settings.selfPromoEnabled : true,
      selfPromoInterval: settings ? settings.selfPromoInterval : 7,
    },
  });
  
  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        blazePrice: settings.blazePrice / 100, // Convert cents to dollars
        infernoPrice: settings.infernoPrice / 100, // Convert cents to dollars
        selfPromoEnabled: settings.selfPromoEnabled,
        selfPromoInterval: settings.selfPromoInterval,
      });
      
      setStripeSetupStatus(settings.stripeProductId ? 'complete' : 'setup');
    }
  }, [settings, form]);
  
  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (data: PricingFormValues) => {
      // Convert dollars to cents for API
      const payload = {
        blazePrice: Math.round(data.blazePrice * 100),
        infernoPrice: Math.round(data.infernoPrice * 100),
        selfPromoEnabled: data.selfPromoEnabled,
        selfPromoInterval: data.selfPromoInterval
      };
      
      const res = await apiRequest("POST", "/api/admin/settings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Pricing Updated",
        description: "Subscription pricing has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Setup Stripe mutation
  const setupStripeMutation = useMutation({
    mutationFn: async () => {
      setStripeSetupStatus('pending');
      const res = await apiRequest("POST", "/api/admin/setup-stripe", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setStripeSetupStatus('complete');
      toast({
        title: "Stripe Setup Complete",
        description: "Stripe products and prices have been created successfully.",
      });
    },
    onError: (error: Error) => {
      setStripeSetupStatus('error');
      toast({
        title: "Stripe Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PricingFormValues) => {
    updatePricingMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Pricing Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blaze Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Blaze Plan</CardTitle>
                <CardDescription>The standard subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="blazePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                          <Input {...field} type="number" step="0.01" className="pl-8" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Standard price is $99/month
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Inferno Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Inferno Plan</CardTitle>
                <CardDescription>The premium subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="infernoPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                          <Input {...field} type="number" step="0.01" className="pl-8" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Recommended price is $999/month
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Self-Promotion Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Self-Promotion Settings</CardTitle>
              <CardDescription>Configure how Kontent Fire promotes itself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="selfPromoEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Self-Promotion</FormLabel>
                      <FormDescription>
                        Enable automatic posts about Kontent Fire
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="selfPromoInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promotion Interval (Days)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" max="30" />
                    </FormControl>
                    <FormDescription>
                      How often to generate promotional posts (recommended: 7 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark"
                disabled={updatePricingMutation.isPending || isLoading}
              >
                {updatePricingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Pricing Settings'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      {/* Stripe Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration</CardTitle>
          <CardDescription>Set up payment processing for subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {stripeSetupStatus === 'error' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                There was an error setting up Stripe. Please check your API keys and try again.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Stripe Status</Label>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  stripeSetupStatus === 'complete' ? 'bg-green-500' : 
                  stripeSetupStatus === 'pending' ? 'bg-yellow-500' : 
                  stripeSetupStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span>
                  {stripeSetupStatus === 'complete' ? 'Connected and Ready' : 
                   stripeSetupStatus === 'pending' ? 'Setting up...' : 
                   stripeSetupStatus === 'error' ? 'Setup Failed' : 'Not Set Up'}
                </span>
              </div>
            </div>
            
            {settings && settings.stripeProductId && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Product ID:</span>
                    <div className="mt-1 truncate">{settings.stripeProductId}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Blaze Price ID:</span>
                    <div className="mt-1 truncate">{settings.blazePriceId || "Not set"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Inferno Price ID:</span>
                    <div className="mt-1 truncate">{settings.infernoPriceId || "Not set"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => setupStripeMutation.mutate()}
            disabled={setupStripeMutation.isPending || stripeSetupStatus === 'pending' || stripeSetupStatus === 'complete'}
            className={stripeSetupStatus === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary-dark'}
          >
            {setupStripeMutation.isPending || stripeSetupStatus === 'pending' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up Stripe...
              </>
            ) : stripeSetupStatus === 'complete' ? (
              'Stripe Integration Complete'
            ) : (
              'Set Up Stripe Integration'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
