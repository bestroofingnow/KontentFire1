import React, { useState, useEffect } from 'react';
import { LinkedInPost } from '@/components/integrations/linked-in-post';
import { LinkedInConnectButton } from '@/components/integrations/linked-in-connect-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function LinkedInDemoPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Query for LinkedIn connection status
  const { data: connectionStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/integrations/linkedin/status'],
    queryFn: () => apiRequest('GET', '/api/integrations/linkedin/status').then(res => res.json()),
  });
  
  // Function to test direct API endpoints
  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      // Get auth URL for testing
      const authUrlRes = await apiRequest('GET', '/api/integrations/linkedin/auth-url');
      const authUrlData = await authUrlRes.json();
      
      setDebugInfo({
        authUrl: authUrlData.authUrl,
        timestamp: new Date().toISOString(),
        host: window.location.host,
        protocol: window.location.protocol,
        origin: window.location.origin,
        productionRedirectUri: 'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback'
      });
    } catch (err) {
      console.error('Error fetching debug info:', err);
      setDebugInfo({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LinkedIn Integration Demo</h1>
        <p className="text-gray-500 mb-4">
          Test the LinkedIn integration functionality here
        </p>
        <Separator className="my-4" />
        
        <Alert className="mb-6">
          <AlertTitle>Company Verification Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">LinkedIn requires company verification for this integration. To complete the verification process:</p>
            <ol className="list-decimal pl-5 mb-2 space-y-1">
              <li>A LinkedIn Page Admin for Kynex needs to approve the association</li>
              <li>During approval, your LinkedIn profile details will be visible to the Page Admin</li>
              <li>Once verified, the integration will allow posting to the company page</li>
            </ol>
            <p>This process must be completed in the LinkedIn Developer Portal.</p>
          </AlertDescription>
        </Alert>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to check LinkedIn connection status: {String(error)}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>LinkedIn Connection</CardTitle>
            <CardDescription>
              Connect your LinkedIn account to enable posting directly to your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <LinkedInConnectButton variant="card" />
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Connection Status</h3>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking connection status...</span>
                </div>
              ) : (
                <div>
                  <p>Status: <span className={connectionStatus?.isConnected ? "text-green-600 font-medium" : "text-amber-600"}>
                    {connectionStatus?.isConnected ? 'Connected' : 'Not connected'}
                  </span></p>
                  {connectionStatus?.isConnected && connectionStatus?.profile && (
                    <div className="mt-2">
                      <p>Connected as: {connectionStatus.profile.name}</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()} 
                    className="mt-2"
                  >
                    Refresh Status
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details to help troubleshoot LinkedIn integration issues and complete company verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchDebugInfo} 
              disabled={loading} 
              className="mb-4"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test LinkedIn Auth URL
            </Button>
            
            {debugInfo && (
              <div className="mt-4">
                <div className="p-4 bg-slate-50 rounded-md overflow-x-auto">
                  <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
                
                <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-md">
                  <h4 className="font-medium text-amber-800 mb-2">Company Verification Instructions</h4>
                  <p className="text-sm mb-2">For the LinkedIn Developer Portal:</p>
                  <ol className="list-decimal text-sm pl-5 mb-2 space-y-1">
                    <li>Go to the LinkedIn Developer Portal and select your app</li>
                    <li>In the app settings, look for the "Company verification" section</li>
                    <li>Copy the verification URL provided there</li>
                    <li>Send this URL to a LinkedIn Page Admin for Kynex</li>
                    <li>They must click the link and approve the application</li>
                  </ol>
                  <p className="text-sm">Once verification is complete, you'll be able to use all authorized scopes.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post to LinkedIn</CardTitle>
            <CardDescription>
              Create and publish content directly to your LinkedIn profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedInPost 
              defaultText="Check out this amazing post created with Kontent Fire!" 
              showCreateAnimation={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}