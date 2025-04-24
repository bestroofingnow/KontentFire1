import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Plus, Facebook, Twitter, Instagram, Linkedin, Globe, Youtube, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SocialAccount } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import FacebookLoginButton from "@/components/integrations/facebook-login-button";
import FacebookOfficialLoginButton from "@/components/integrations/facebook-official-login-button";
import FacebookExampleLoginButton from "@/components/integrations/facebook-example-login-button";
import { useFacebookSDK } from "@/components/integrations/facebook-sdk-provider";

interface PlatformInfo {
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  comingSoon?: boolean;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const { isLoaded: facebookSdkLoaded } = useFacebookSDK();
  
  // Fetch connected social accounts
  const { data: socialAccounts, isLoading: accountsLoading } = useQuery<SocialAccount[]>({
    queryKey: ['/api/social-accounts'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/social-accounts', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch social accounts');
        }
        
        return response.json();
      } catch (error) {
        return []; // Return empty array on error
      }
    }
  });
  
  // Mutation to disconnect platform
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const response = await apiRequest("DELETE", `/api/social-accounts/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: "Platform Disconnected",
        description: "The platform has been successfully disconnected."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const platforms: Record<string, PlatformInfo> = {
    blog: {
      name: "Blog (WordPress)",
      icon: <Globe className="h-6 w-6" />,
      description: "Connect your WordPress blog to publish articles directly.",
      color: "bg-blue-500"
    },
    facebook: {
      name: "Facebook",
      icon: <Facebook className="h-6 w-6" />,
      description: "Share content to your Facebook page or profile.",
      color: "bg-blue-600"
    },
    twitter: {
      name: "Twitter",
      icon: <Twitter className="h-6 w-6" />,
      description: "Post tweets and threads to your Twitter account.",
      color: "bg-sky-500"
    },
    instagram: {
      name: "Instagram",
      icon: <Instagram className="h-6 w-6" />,
      description: "Share images and carousel posts to Instagram.",
      color: "bg-pink-500"
    },
    linkedin: {
      name: "LinkedIn",
      icon: <Linkedin className="h-6 w-6" />,
      description: "Publish articles and posts to your LinkedIn profile or page.",
      color: "bg-blue-700"
    },
    youtube: {
      name: "YouTube",
      icon: <Youtube className="h-6 w-6" />,
      description: "Upload videos to your YouTube channel.",
      color: "bg-red-600",
      comingSoon: true
    }
  };
  
  const handleConnectPlatform = (platform: string) => {
    // In a real app, this would redirect to OAuth flow
    setConnectingPlatform(platform);
    
    setTimeout(() => {
      setConnectingPlatform(null);
      toast({
        title: "Integration Coming Soon",
        description: `The ${platforms[platform].name} integration will be available soon.`,
      });
    }, 1500);
  };
  
  const isConnected = (platform: string): boolean => {
    if (!socialAccounts) return false;
    return socialAccounts.some(account => account.platform === platform);
  };
  
  const getAccountForPlatform = (platform: string): SocialAccount | undefined => {
    if (!socialAccounts) return undefined;
    return socialAccounts.find(account => account.platform === platform);
  };
  
  const handleDisconnect = (accountId: number) => {
    disconnectMutation.mutate(accountId);
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
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Integrations</h1>
              <p className="text-gray-600">Connect your social media accounts and publishing platforms</p>
            </div>
            
            {/* Integration Status */}
            <Alert className="mb-6">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertDescription>
                Connect your platforms to automatically publish content from Kontent Fire.
              </AlertDescription>
            </Alert>
            
            {/* Integrations */}
            <Tabs defaultValue="social" className="space-y-6">
              <TabsList className="mb-6">
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="cms">CMS & Blogs</TabsTrigger>
                <TabsTrigger value="other">Other Integrations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="social">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Facebook */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.facebook.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.facebook.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.facebook.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.facebook.name}</CardTitle>
                      </div>
                      
                      {isConnected('facebook') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.facebook.description}
                      </CardDescription>
                      
                      {isConnected('facebook') ? (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Connected as:</p>
                            <p className="font-medium">{getAccountForPlatform('facebook')?.platformUsername || 'Your Facebook Account'}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const account = getAccountForPlatform('facebook');
                              if (account) handleDisconnect(account.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      ) : (
                        facebookSdkLoaded ? (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 mb-2">Connect with the official Facebook example button:</p>
                            <FacebookExampleLoginButton 
                              onLoginSuccess={(response) => {
                                toast({
                                  title: "Facebook Connected",
                                  description: "Successfully connected your Facebook account.",
                                });
                                // Refresh social accounts data
                                queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
                              }}
                              onLoginFailure={(error) => {
                                toast({
                                  title: "Connection Failed",
                                  description: error.message,
                                  variant: "destructive"
                                });
                              }}
                            />
                          </div>
                        ) : (
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            disabled={true}
                          >
                            <span className="animate-pulse">Loading Facebook SDK...</span>
                          </Button>
                        )
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Twitter */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.twitter.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.twitter.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.twitter.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.twitter.name}</CardTitle>
                      </div>
                      
                      {isConnected('twitter') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.twitter.description}
                      </CardDescription>
                      
                      {isConnected('twitter') ? (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Connected as:</p>
                            <p className="font-medium">{getAccountForPlatform('twitter')?.platformUsername || '@YourTwitterHandle'}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const account = getAccountForPlatform('twitter');
                              if (account) handleDisconnect(account.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-sky-500 hover:bg-sky-600"
                          onClick={() => handleConnectPlatform('twitter')}
                          disabled={!!connectingPlatform}
                        >
                          {connectingPlatform === 'twitter' ? 'Connecting...' : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Connect Twitter
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Instagram */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.instagram.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.instagram.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.instagram.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.instagram.name}</CardTitle>
                      </div>
                      
                      {isConnected('instagram') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.instagram.description}
                      </CardDescription>
                      
                      {isConnected('instagram') ? (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Connected as:</p>
                            <p className="font-medium">{getAccountForPlatform('instagram')?.platformUsername || '@YourInstagramHandle'}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const account = getAccountForPlatform('instagram');
                              if (account) handleDisconnect(account.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-pink-500 hover:bg-pink-600"
                          onClick={() => handleConnectPlatform('instagram')}
                          disabled={!!connectingPlatform}
                        >
                          {connectingPlatform === 'instagram' ? 'Connecting...' : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Connect Instagram
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* LinkedIn */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.linkedin.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.linkedin.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.linkedin.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.linkedin.name}</CardTitle>
                      </div>
                      
                      {isConnected('linkedin') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.linkedin.description}
                      </CardDescription>
                      
                      {isConnected('linkedin') ? (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Connected as:</p>
                            <p className="font-medium">{getAccountForPlatform('linkedin')?.platformUsername || 'Your LinkedIn Profile'}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const account = getAccountForPlatform('linkedin');
                              if (account) handleDisconnect(account.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-blue-700 hover:bg-blue-800"
                          onClick={() => handleConnectPlatform('linkedin')}
                          disabled={!!connectingPlatform}
                        >
                          {connectingPlatform === 'linkedin' ? 'Connecting...' : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Connect LinkedIn
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* YouTube */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.youtube.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.youtube.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.youtube.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.youtube.name}</CardTitle>
                      </div>
                      
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Coming Soon
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.youtube.description}
                      </CardDescription>
                      
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={true}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="cms">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {/* WordPress */}
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${platforms.blog.color}`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${platforms.blog.color} bg-opacity-10 p-2 rounded-lg`}>
                          {platforms.blog.icon}
                        </div>
                        <CardTitle className="text-xl">{platforms.blog.name}</CardTitle>
                      </div>
                      
                      {isConnected('blog') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : null}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {platforms.blog.description}
                      </CardDescription>
                      
                      {isConnected('blog') ? (
                        <div className="space-y-4">
                          <div className="text-sm">
                            <p className="text-gray-500">Connected site:</p>
                            <p className="font-medium">{getAccountForPlatform('blog')?.platformUsername || 'Your WordPress Site'}</p>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const account = getAccountForPlatform('blog');
                              if (account) handleDisconnect(account.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleConnectPlatform('blog')}
                          disabled={!!connectingPlatform}
                        >
                          {connectingPlatform === 'blog' ? 'Connecting...' : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Connect WordPress
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Other CMS placeholder cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Additional CMS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        More CMS integrations coming soon (Wix, Squarespace, Webflow, etc.)
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="other">
                <div className="py-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900">Additional Integrations Coming Soon</h3>
                  <p className="mt-2 text-gray-500">
                    We're working on integrations with email marketing platforms, e-commerce stores, and more.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
