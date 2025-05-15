import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Check, X, HelpCircle, AlertCircle } from 'lucide-react';

export default function LinkedInTroubleshootPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [configInfo, setConfigInfo] = useState<any>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [redirectUri, setRedirectUri] = useState<string>('https://kontentfire.kynexpro.com/api/integrations/linkedin/callback');
  const [statusChecks, setStatusChecks] = useState<{[key: string]: boolean | null}>({
    clientId: null,
    clientSecret: null,
    redirectUri: null,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch debug configuration
  const fetchDebugConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/integrations/linkedin/debug-config');
      const data = await response.json();
      setConfigInfo(data);
      
      // Update status checks
      setStatusChecks({
        clientId: data.clientIdConfigured,
        clientSecret: data.clientSecretConfigured,
        redirectUri: true, // We'll assume this is configured correctly
      });
    } catch (err) {
      console.error('Error fetching LinkedIn config:', err);
      setError('Failed to fetch LinkedIn configuration: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to test auth URL generation
  const testAuthUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/integrations/linkedin/auth-url');
      const data = await response.json();
      setAuthUrl(data.authUrl);
    } catch (err) {
      console.error('Error generating auth URL:', err);
      setError('Failed to generate auth URL: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to create a test with custom redirect URI (unused for now)
  const testCustomRedirect = async () => {
    setIsLoading(true);
    setError(null);
    setAuthUrl('');
    
    try {
      const response = await apiRequest('POST', '/api/integrations/linkedin/test-redirect', {
        redirectUri
      });
      const data = await response.json();
      setAuthUrl(data.authUrl);
    } catch (err) {
      console.error('Error testing custom redirect:', err);
      setError('Failed to test custom redirect: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load configuration on mount
  useEffect(() => {
    fetchDebugConfig();
  }, []);
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LinkedIn Integration Troubleshooter</h1>
        <p className="text-gray-500 mb-4">
          Advanced tools to diagnose and fix LinkedIn integration issues
        </p>
        <Separator className="my-4" />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>
              Check if all required configuration parameters are set correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchDebugConfig} 
              disabled={isLoading}
              className="mb-6"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Configuration Status
            </Button>
            
            <div className="grid gap-4">
              <div className="flex items-start justify-between p-4 border rounded-md">
                <div>
                  <h3 className="font-medium">LinkedIn Client ID</h3>
                  <p className="text-sm text-gray-500">
                    Required to identify our application to LinkedIn
                  </p>
                </div>
                <StatusIcon status={statusChecks.clientId} />
              </div>
              
              <div className="flex items-start justify-between p-4 border rounded-md">
                <div>
                  <h3 className="font-medium">LinkedIn Client Secret</h3>
                  <p className="text-sm text-gray-500">
                    Required to authenticate with LinkedIn API
                  </p>
                </div>
                <StatusIcon status={statusChecks.clientSecret} />
              </div>
              
              <div className="flex items-start justify-between p-4 border rounded-md">
                <div>
                  <h3 className="font-medium">Redirect URI</h3>
                  <p className="text-sm text-gray-500">
                    Must be registered in LinkedIn Developer Portal
                  </p>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                    {configInfo?.redirectUri || 'Not available'}
                  </div>
                </div>
                <StatusIcon status={statusChecks.redirectUri} />
              </div>
            </div>
            
            {configInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md overflow-x-auto">
                <h3 className="font-medium mb-2">Raw Configuration Data:</h3>
                <pre className="text-xs">{JSON.stringify(configInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Deployment Authentication</CardTitle>
            <CardDescription>
              Special authentication for deployment environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Deployment-Specific Authentication</h3>
                <p className="text-sm mb-4">
                  This special authentication method generates a LinkedIn auth URL using the exact domain of your 
                  deployed application. It uses the new OpenID Connect scopes (<strong>openid</strong> and <strong>profile</strong>) 
                  to properly authenticate with LinkedIn's latest API requirements.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                  <h4 className="text-amber-800 font-medium">About the "unauthorized_scope_error"</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This error happens when your LinkedIn application requests scopes that haven't been approved for your app.
                    We've updated our integration to use the officially supported OpenID Connect scopes <code className="px-1 py-0.5 bg-amber-100 rounded">openid</code> and 
                    <code className="px-1 py-0.5 bg-amber-100 rounded">profile</code>, which should solve this issue.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    If you still encounter this error, please make sure your LinkedIn app has the "Sign In with LinkedIn using OpenID Connect" product 
                    added in the Developer Portal under the Products tab.
                  </p>
                </div>
                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await apiRequest('GET', '/api/integrations/linkedin-deployment/deployment-info');
                      const data = await response.json();
                      setConfigInfo({...configInfo, deployment: data});
                    } catch (err) {
                      console.error('Error checking deployment:', err);
                      setError('Failed to check deployment configuration');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="mb-4 mr-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check Deployment Setup
                </Button>
                
                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await apiRequest('GET', '/api/integrations/linkedin-deployment/auth-url');
                      const data = await response.json();
                      setAuthUrl(data.authUrl);
                    } catch (err) {
                      console.error('Error getting deployment auth URL:', err);
                      setError('Failed to get deployment auth URL');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  variant="default"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Deployment Auth URL
                </Button>
                
                {configInfo?.deployment && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium mb-2 text-blue-800">Deployment Information</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="font-medium">Environment:</div>
                        <div>{configInfo.deployment.environment}</div>
                        
                        <div className="font-medium">Current URL:</div>
                        <div className="break-all">{configInfo.deployment.currentUrl}</div>
                        
                        <div className="font-medium">Recommended Redirect URI:</div>
                        <div className="break-all">{configInfo.deployment.recommendedRedirectUri}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {authUrl && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Auth URL:</h3>
                <div className="p-4 bg-gray-50 rounded-md overflow-x-auto">
                  <p className="text-xs font-mono break-all">{authUrl}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigator.clipboard.writeText(authUrl)}
                      className="w-full"
                    >
                      Copy URL
                    </Button>
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(authUrl, '_blank')}
                      className="w-full"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Deployment Environment Check</CardTitle>
            <CardDescription>
              Verify that the correct URLs are registered in LinkedIn Developer Portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Current Environment</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Host:</div>
                  <div>{window.location.host}</div>
                  
                  <div className="font-medium">Protocol:</div>
                  <div>{window.location.protocol}</div>
                  
                  <div className="font-medium">Origin:</div>
                  <div>{window.location.origin}</div>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="font-medium mb-2">Registered Redirect URI</h3>
                <p className="text-sm mb-2">
                  Make sure this <strong>exact URL</strong> is registered in the LinkedIn Developer Portal:
                </p>
                <div className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
                  {configInfo?.redirectUri || 'Not available'}
                </div>
                
                <Alert className="mt-4">
                  <AlertTitle>Important: URL Must Match Exactly</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mb-1">The LinkedIn redirect URI must match character-for-character:</p>
                    <ul className="list-disc text-sm pl-5 space-y-1">
                      <li>HTTP vs HTTPS matters</li>
                      <li>Trailing slashes matter</li>
                      <li>Subdomains matter (www vs non-www)</li>
                      <li>Ports matter (if included)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>LinkedIn Developer Portal Setup Guide</CardTitle>
            <CardDescription>
              Step-by-step instructions to configure your LinkedIn app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">1. Register OAuth 2.0 Redirect URLs</h3>
                <p className="text-sm mb-2">In the LinkedIn Developer Portal:</p>
                <ol className="list-decimal text-sm pl-5 space-y-1">
                  <li>Go to your app's Auth tab</li>
                  <li>Under "OAuth 2.0 settings", add this URL:</li>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                    {configInfo?.redirectUri || 'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback'}
                  </div>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">2. Request OAuth 2.0 Scopes</h3>
                <p className="text-sm mb-2">Required scopes (using OpenID Connect):</p>
                <ul className="list-disc text-sm pl-5 space-y-1">
                  <li><code className="px-1 py-0.5 bg-gray-100 rounded">openid</code>: Required for OpenID Connect authentication</li>
                  <li><code className="px-1 py-0.5 bg-gray-100 rounded">profile</code>: Get basic profile information (replaces r_liteprofile)</li>
                  <li><code className="px-1 py-0.5 bg-gray-100 rounded">email</code>: Get email address (optional)</li>
                  <li><code className="px-1 py-0.5 bg-gray-100 rounded">w_member_social</code>: Post content to LinkedIn (if needed)</li>
                </ul>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md mb-2">
                  <h4 className="text-blue-800 font-medium">LinkedIn API Update</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    LinkedIn has migrated from their legacy scopes (r_liteprofile) to OpenID Connect scopes.
                    We've updated our integration to use these new scopes.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">3. App Review & Verification Notes</h3>
                <p className="text-sm mb-2">Important information:</p>
                <ul className="list-disc text-sm pl-5 space-y-1">
                  <li>New LinkedIn apps start with limited permissions</li>
                  <li>To use <code className="px-1 py-0.5 bg-gray-100 rounded">w_member_social</code>, LinkedIn requires company verification</li>
                  <li>A LinkedIn Page Admin for Kynex must approve the application</li>
                  <li>Add detailed descriptions for how you'll use each requested scope</li>
                </ul>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Common Error: unauthorized_scope_error</AlertTitle>
                <AlertDescription>
                  If you see this error, it means your app hasn't been authorized for one or more requested scopes. 
                  Try using only <code className="px-1 py-0.5 bg-gray-100 rounded">r_liteprofile</code> scope for initial testing.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: boolean | null }) {
  if (status === null) {
    return <HelpCircle className="h-5 w-5 text-gray-400" />;
  }
  
  if (status === true) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  
  return <X className="h-5 w-5 text-red-500" />;
}