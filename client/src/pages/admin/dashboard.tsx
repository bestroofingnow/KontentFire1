import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserTable from "@/components/admin/user-table";
import PricingSettings from "@/components/admin/pricing-settings";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, Users, DollarSign, Settings, Zap, Flame } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("users");
  
  // Fetch admin settings
  const { data: adminSettings, isLoading: adminSettingsLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin settings');
      }
      
      return response.json();
    },
    enabled: user?.isAdmin === true
  });

  // Redirect if not admin
  if (user && !user.isAdmin) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin portal",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Admin Portal</h1>
              <p className="text-gray-600">Manage users, subscriptions, and platform settings</p>
            </div>
            
            {/* Admin Alert */}
            <Alert className="mb-6 border-primary bg-primary/10">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle>Admin Mode Active</AlertTitle>
              <AlertDescription>
                You are currently in admin mode. Changes made here will affect the entire platform.
              </AlertDescription>
            </Alert>
            
            {/* Admin Sections */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="mb-6">
                <TabsTrigger value="users" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Pricing</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Features</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Users Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      View and manage platform users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserTable />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Pricing</CardTitle>
                    <CardDescription>
                      Configure and manage subscription plans
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PricingSettings settings={adminSettings} isLoading={adminSettingsLoading} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Features Tab */}
              <TabsContent value="features">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Management</CardTitle>
                    <CardDescription>
                      Toggle features and capabilities per plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <div className="bg-secondary bg-opacity-10 p-2 rounded-lg mr-3">
                            <Flame className="h-6 w-6 text-secondary" />
                          </div>
                          <h3 className="text-lg font-semibold">Blaze Plan Features</h3>
                        </div>
                        
                        <ul className="space-y-3 text-gray-600">
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Text Generation
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Image Generation
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Manual Scheduling
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Basic Analytics
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Automatic Scheduling
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            AI Video Generation
                          </li>
                        </ul>
                      </div>
                      
                      <div className="border rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <div className="bg-primary bg-opacity-10 p-2 rounded-lg mr-3">
                            <Flame className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold">Inferno Plan Features</h3>
                        </div>
                        
                        <ul className="space-y-3 text-gray-600">
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Text Generation
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Image Generation
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Manual Scheduling
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Basic Analytics
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Automatic Scheduling
                          </li>
                          <li className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI Video Generation
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <p className="text-center text-gray-500">Feature management interface is currently in development</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* System Tab */}
              <TabsContent value="system">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                      Configure platform-wide settings and integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">API Integration</h3>
                        <p className="text-gray-500 mb-4">
                          Configure your external API keys for AI content generation
                        </p>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                              <input 
                                type="password" 
                                className="w-full p-2 border rounded-md" 
                                value="••••••••••••••••••••••••••••••"
                                disabled
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Stripe API Key</label>
                              <input 
                                type="password" 
                                className="w-full p-2 border rounded-md" 
                                value="••••••••••••••••••••••••••••••"
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Self-Promotion Settings</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Self-Promotion</label>
                            <select className="w-full p-2 border rounded-md">
                              <option value="enabled">Enabled</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interval (days)</label>
                            <input 
                              type="number" 
                              className="w-full p-2 border rounded-md" 
                              defaultValue="7"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <p className="text-center text-gray-500">Advanced system settings interface is under development</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
