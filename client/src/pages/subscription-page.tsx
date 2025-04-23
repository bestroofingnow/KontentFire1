import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Flame, Zap, Calendar, ImageIcon, Video, Shield, Check, Loader2, PenTool } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type SubscriptionData = {
  status: string;
  plan: 'free' | 'ember' | 'inferno';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

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

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("plans");
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);
  const [confirmUpgradeDialog, setConfirmUpgradeDialog] = useState(false);
  const [confirmResumeDialog, setConfirmResumeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Fetch subscription data
  const { data: subscription, isLoading: subLoading, refetch: refetchSubscription } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscription', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      
      return response.json();
    }
  });
  
  // Fetch admin settings for pricing
  const { data: adminSettings, isLoading: settingsLoading } = useQuery<AdminSettings>({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch pricing settings');
        }
        
        return response.json();
      } catch (error) {
        // Return default values if not an admin or error
        return {
          blazePrice: 9900,
          infernoPrice: 19900
        };
      }
    }
  });
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", `/api/subscribe/${plan}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      // If we have a client secret for payment, we need to redirect
      if (data.clientSecret) {
        // This would be where we'd handle payment if implemented
        toast({
          title: "Payment Required",
          description: "You'll be redirected to complete payment shortly.",
        });
        
        // Simulate complete for now (in a real app, we'd handle the payment flow)
        setTimeout(() => {
          refetchSubscription();
          setConfirmUpgradeDialog(false);
          setSelectedPlan(null);
          toast({
            title: "Subscription Updated",
            description: "Your subscription has been updated successfully.",
          });
        }, 1500);
      } else {
        refetchSubscription();
        setConfirmUpgradeDialog(false);
        setSelectedPlan(null);
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/cancel", {});
      return response.json();
    },
    onSuccess: () => {
      refetchSubscription();
      setConfirmCancelDialog(false);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the end of your current billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/resume", {});
      return response.json();
    },
    onSuccess: () => {
      refetchSubscription();
      setConfirmResumeDialog(false);
      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Resume Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleUpgrade = (plan: string) => {
    setSelectedPlan(plan);
    setConfirmUpgradeDialog(true);
  };
  
  const confirmUpgrade = () => {
    if (!selectedPlan) return;
    subscribeMutation.mutate(selectedPlan);
  };
  
  const handleCancel = () => {
    setConfirmCancelDialog(true);
  };
  
  const confirmCancel = () => {
    cancelSubscriptionMutation.mutate();
  };
  
  const handleResume = () => {
    setConfirmResumeDialog(true);
  };
  
  const confirmResume = () => {
    resumeSubscriptionMutation.mutate();
  };
  
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };
  
  // Format date to locale string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Subscription</h1>
              <p className="text-gray-600">Manage your subscription plan and billing</p>
            </div>
            
            {/* Loading State */}
            {(subLoading || settingsLoading) && (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading subscription information...</span>
              </div>
            )}
            
            {/* Subscription Content */}
            {!subLoading && !settingsLoading && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="mb-6">
                  <TabsTrigger value="plans">Plans</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                
                {/* Plans Tab */}
                <TabsContent value="plans">
                  {/* Current Plan */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Your current subscription plan and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Badge 
                          className={
                            subscription?.plan === 'free' ? 'bg-gray-200 text-dark' : 
                            subscription?.plan === 'ember' ? 'bg-secondary text-dark' : 
                            'bg-primary text-white'
                          }
                        >
                          {subscription?.plan === 'free' ? 'Free Plan' : 
                           subscription?.plan === 'ember' ? 'Ember Plan' : 
                           'Inferno Plan'}
                        </Badge>
                        
                        {subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && (
                          <Badge variant="outline" className="ml-3 bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        )}
                        
                        {subscription?.cancelAtPeriodEnd && (
                          <Badge variant="outline" className="ml-3 bg-orange-50 text-orange-700 border-orange-200">
                            Cancelling
                          </Badge>
                        )}
                      </div>
                      
                      {subscription?.status === 'active' && (
                        <div className="mt-4">
                          <p className="text-gray-600">
                            {subscription?.plan === 'free' ? (
                              <>You are currently on the Free plan.</>
                            ) : subscription?.plan === 'ember' ? (
                              <>You are currently on the Ember plan at $99/month.</>
                            ) : (
                              <>You are currently on the Inferno plan at $999/month.</>
                            )}
                          </p>
                          
                          {subscription?.currentPeriodEnd && (
                            <p className="mt-2 text-gray-600">
                              {subscription?.cancelAtPeriodEnd ? (
                                <>Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.</>
                              ) : (
                                <>Your next billing date is {formatDate(subscription.currentPeriodEnd)}.</>
                              )}
                            </p>
                          )}
                          
                          {subscription?.cancelAtPeriodEnd ? (
                            <Button 
                              onClick={handleResume} 
                              className="mt-4 bg-primary hover:bg-primary-dark"
                              disabled={resumeSubscriptionMutation.isPending}
                            >
                              {resumeSubscriptionMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Resuming...
                                </>
                              ) : (
                                'Resume Subscription'
                              )}
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleCancel} 
                              variant="outline" 
                              className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                              disabled={cancelSubscriptionMutation.isPending}
                            >
                              {cancelSubscriptionMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                'Cancel Subscription'
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Available Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ember Plan */}
                    <Card className={`border-2 ${subscription?.plan === 'ember' ? 'border-secondary' : 'border-transparent'}`}>
                      <CardHeader className="bg-secondary bg-opacity-5">
                        <CardTitle className="flex items-center">
                          <Flame className="mr-2 h-5 w-5 text-secondary" />
                          Ember Plan
                        </CardTitle>
                        <CardDescription>
                          Standard Plan
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <span className="text-3xl font-bold">$99</span>
                          <span className="text-gray-500 ml-1">/month</span>
                        </div>
                        
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>1 post per day</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>AI text generation</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>AI image generation</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>1 platform integration</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>PR content creation</span>
                          </li>
                          <li className="flex items-start text-gray-500">
                            <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                            <span>Limited platform integrations</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {subscription?.plan === 'ember' ? (
                          <Button className="w-full" disabled>
                            <Check className="mr-2 h-4 w-4" />
                            Current Plan
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleUpgrade('ember')} 
                            variant="outline" 
                            className="w-full"
                            disabled={subscribeMutation.isPending}
                          >
                            {subscription?.plan === 'free' ? 'Upgrade to Ember' : 'Downgrade to Ember'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                    
                    {/* Inferno Plan */}
                    <Card className={`border-2 ${subscription?.plan === 'inferno' ? 'border-primary' : 'border-transparent'}`}>
                      <CardHeader className="bg-primary bg-opacity-5">
                        <div className="flex justify-between items-start">
                          <CardTitle className="flex items-center">
                            <Flame className="mr-2 h-5 w-5 text-primary" />
                            Inferno Plan
                          </CardTitle>
                          <Badge className="bg-primary text-white">Recommended</Badge>
                        </div>
                        <CardDescription>
                          Premium Plan
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="mb-4">
                          <span className="text-3xl font-bold">$999</span>
                          <span className="text-gray-500 ml-1">/month</span>
                        </div>
                        
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Everything in Ember Plan</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Unlimited posts</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>All premium features</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Unlimited platform integrations</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Advanced AI customization</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Advanced analytics</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {subscription?.plan === 'inferno' ? (
                          <Button className="w-full bg-primary hover:bg-primary-dark" disabled>
                            <Check className="mr-2 h-4 w-4" />
                            Current Plan
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleUpgrade('inferno')} 
                            className="w-full bg-primary hover:bg-primary-dark"
                            disabled={subscribeMutation.isPending}
                          >
                            {subscribeMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Upgrade to Inferno'
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                  
                  {/* Plan Comparison */}
                  <div className="mt-12">
                    <h2 className="text-xl font-bold font-display text-dark mb-6">Plan Comparison</h2>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-4 px-6 text-left font-medium text-gray-500">Feature</th>
                            <th className="py-4 px-6 text-center font-medium text-gray-500">Ember</th>
                            <th className="py-4 px-6 text-center font-medium text-gray-500">Inferno</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <PenTool className="h-5 w-5 text-gray-400 mr-2" />
                              AI Text Generation
                            </td>
                            <td className="py-4 px-6 text-center">Unlimited</td>
                            <td className="py-4 px-6 text-center">Unlimited</td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <ImageIcon className="h-5 w-5 text-gray-400 mr-2" />
                              AI Image Generation
                            </td>
                            <td className="py-4 px-6 text-center">Unlimited</td>
                            <td className="py-4 px-6 text-center">Unlimited</td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <Video className="h-5 w-5 text-gray-400 mr-2" />
                              AI Video Generation
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-red-500">
                                <AlertCircle className="h-4 w-4 mr-1" /> Not included
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" /> Included
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                              Manual Scheduling
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" /> Included
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" /> Included
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <Zap className="h-5 w-5 text-gray-400 mr-2" />
                              Automatic Scheduling
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-red-500">
                                <AlertCircle className="h-4 w-4 mr-1" /> Not included
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" /> Included
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium flex items-center">
                              <Shield className="h-5 w-5 text-gray-400 mr-2" />
                              Support
                            </td>
                            <td className="py-4 px-6 text-center">Standard (Email)</td>
                            <td className="py-4 px-6 text-center">Priority (Chat + Email)</td>
                          </tr>
                          <tr>
                            <td className="py-4 px-6 text-left font-medium">Price</td>
                            <td className="py-4 px-6 text-center font-medium">$99/month</td>
                            <td className="py-4 px-6 text-center font-medium">$999/month</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Billing Tab */}
                <TabsContent value="billing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Information</CardTitle>
                      <CardDescription>Manage your payment methods and billing history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscription?.status === 'active' ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium">Current Plan</h3>
                            <div className="mt-2 p-4 bg-gray-50 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Badge 
                                    className={subscription?.plan === 'ember' ? 'bg-secondary text-dark' : 'bg-primary text-white'}
                                  >
                                    {subscription?.plan === 'free' ? 'Free Plan' : 
                                      subscription?.plan === 'ember' ? 'Ember Plan' : 'Inferno Plan'}
                                  </Badge>
                                  <p className="mt-2 text-gray-600">
                                    {subscription?.plan === 'free' ? 'Free' : 
                                      subscription?.plan === 'ember' ? '$99' : '$999'}/month
                                  </p>
                                </div>
                                
                                {subscription?.currentPeriodEnd && (
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">Next billing date</p>
                                    <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h3 className="text-lg font-medium">Payment Method</h3>
                            <div className="mt-2 p-4 bg-gray-50 rounded-md">
                              <p className="text-gray-600">Payment information not displayed for demo purposes.</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h3 className="text-lg font-medium">Billing History</h3>
                            <div className="mt-2">
                              <p className="text-gray-600">Your billing history will appear here once you have made payments.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>No Active Subscription</AlertTitle>
                          <AlertDescription>
                            You don't have an active subscription. Please subscribe to a plan to access premium features.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button variant="outline">Download Invoices</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      {/* Upgrade Confirmation Dialog */}
      <Dialog open={confirmUpgradeDialog} onOpenChange={setConfirmUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Subscription Change</DialogTitle>
            <DialogDescription>
              {selectedPlan === 'inferno' ? 
                'You are about to upgrade to the Inferno plan.' :
                'You are about to switch to the Ember plan.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              {selectedPlan === 'inferno' ? (
                <>You will be charged $999 monthly for the Inferno plan.</>
              ) : (
                <>Your plan will be changed to Ember at $99 per month.</>
              )}
            </p>
            
            {selectedPlan === 'inferno' && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">You'll get access to:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Automatic content scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>AI video generation (via Runway)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUpgradeDialog(false)}>Cancel</Button>
            <Button 
              onClick={confirmUpgrade} 
              className="bg-primary hover:bg-primary-dark"
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmCancelDialog} onOpenChange={setConfirmCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Your subscription will remain active until the end of your current billing period. After that, you'll lose access to:
            </p>
            
            <ul className="mt-4 space-y-2">
              {subscription?.plan === 'inferno' && (
                <>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Automatic content scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>AI video generation</span>
                  </li>
                </>
              )}
              <li className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span>AI text and image generation</span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span>Content scheduling and publishing</span>
              </li>
            </ul>
            
            <p className="mt-4 text-gray-700">
              You can resume your subscription at any time before the end of your billing period.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancelDialog(false)}>Keep Subscription</Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancel}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Resume Confirmation Dialog */}
      <Dialog open={confirmResumeDialog} onOpenChange={setConfirmResumeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resume Subscription</DialogTitle>
            <DialogDescription>
              Would you like to resume your subscription?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              By resuming your subscription, you'll continue to have access to all features of your plan beyond the current billing period.
            </p>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="font-medium">You'll keep access to:</p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>AI content generation</span>
                </li>
                {subscription?.plan === 'inferno' && (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Automatic scheduling</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Video generation</span>
                    </li>
                  </>
                )}
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>All your existing content and schedules</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResumeDialog(false)}>Cancel</Button>
            <Button 
              onClick={confirmResume} 
              className="bg-primary hover:bg-primary-dark"
              disabled={resumeSubscriptionMutation.isPending}
            >
              {resumeSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                'Resume Subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
