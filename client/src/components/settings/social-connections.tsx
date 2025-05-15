import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnimatedElement } from '@/components/ui/animated-element';
import { Loader2, AlertCircle, Link, CheckCircle2 } from 'lucide-react';
import { LinkedInConnectButton } from '@/components/integrations/linked-in-connect-button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SiLinkedin, SiFacebook, SiInstagram, SiTiktok, SiWordpress } from 'react-icons/si';
import { useToast } from '@/hooks/use-toast';
import { SocialAccount } from '@shared/schema';

export function SocialConnections() {
  const [activeTab, setActiveTab] = useState('accounts');
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  
  // Check for error or success states in the URL (from OAuth redirects)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const linkedinParam = urlParams.get('linkedin');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(errorParam),
        variant: 'destructive'
      });
      
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.toString());
    }
    
    if (linkedinParam === 'connected') {
      toast({
        title: 'LinkedIn Connected',
        description: 'Your LinkedIn account has been successfully connected!',
      });
      
      // Refresh the integrations list
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('linkedin');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [toast]);

  // Fetch connected social accounts
  const { 
    data: socialAccounts, 
    isLoading,
    error: queryError
  } = useQuery<SocialAccount[]>({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations');
      const data = await response.json();
      return data;
    }
  });

  // Helper function to check if a platform is connected
  const isConnected = (platform: string) => {
    if (!socialAccounts) return false;
    return socialAccounts.some(account => 
      account.platform === platform && account.isConnected
    );
  };

  // Get account by platform
  const getAccountByPlatform = (platform: string) => {
    if (!socialAccounts) return null;
    return socialAccounts.find(account => 
      account.platform === platform && account.isConnected
    );
  };

  // Show error if fetch failed
  if (queryError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load social connections. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Platform icons mapping
  const platformIcons = {
    facebook: <SiFacebook className="h-5 w-5 text-[#1877F2]" />,
    linkedin: <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />,
    instagram: <SiInstagram className="h-5 w-5 text-[#E4405F]" />,
    tiktok: <SiTiktok className="h-5 w-5 text-black" />,
    wordpress: <SiWordpress className="h-5 w-5 text-[#21759B]" />
  };

  return (
    <AnimatedElement className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Social Connections</CardTitle>
          <CardDescription>
            Connect your social media accounts to publish content directly from the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
              <TabsTrigger value="connect">Connect New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accounts">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : socialAccounts && socialAccounts.length > 0 ? (
                <div className="space-y-4">
                  {socialAccounts.filter(account => account.isConnected).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {platformIcons[account.platform as keyof typeof platformIcons] || 
                          <Link className="h-5 w-5" />}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {account.platformUsername}
                            <Badge variant="outline" className="text-xs">
                              {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {account.lastUsed ? `Last used: ${new Date(account.lastUsed).toLocaleDateString()}` : 'Not used yet'}
                          </div>
                        </div>
                      </div>
                      
                      {account.platform === 'linkedin' && (
                        <LinkedInConnectButton 
                          isConnected={true} 
                          onDisconnect={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
                          }} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No connected accounts yet.</p>
                  <p className="text-sm">
                    <a
                      href="#"
                      className="text-primary underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('connect');
                      }}
                    >
                      Connect a social media account
                    </a>
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="connect">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* LinkedIn */}
                  <Card className="border-2 border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />
                        LinkedIn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {isConnected('linkedin') ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" /> Connected
                              <a 
                                href="#" 
                                className="text-primary text-xs ml-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setActiveTab('accounts');
                                }}
                              >
                                (View in Connected Accounts)
                              </a>
                            </span>
                          ) : 'Share professional content'}
                        </div>
                        {!isConnected('linkedin') && (
                          <LinkedInConnectButton
                            isConnected={false}
                            onConnect={() => {
                              setError(null);
                            }}
                            onDisconnect={() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
                            }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Coming Soon Platforms */}
                  <Card className="border-2 border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SiFacebook className="h-5 w-5 text-[#1877F2]" />
                        Facebook
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Post to pages and groups</div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Instagram (Coming Soon) */}
                  <Card className="border-2 border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SiInstagram className="h-5 w-5 text-[#E4405F]" />
                        Instagram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Share photos and videos</div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* TikTok (Coming Soon) */}
                  <Card className="border-2 border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SiTiktok className="h-5 w-5" />
                        TikTok
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Share short videos</div>
                        <Badge variant="outline">Coming Soon</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AnimatedElement>
  );
}