import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Facebook } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlatformIntegration } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

const FacebookConnect = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch Facebook integration status
  const { data: integrations, isLoading } = useQuery<PlatformIntegration[]>({
    queryKey: ['/api/integrations/facebook'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation to disconnect an integration
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await apiRequest('DELETE', `/api/integrations/facebook/${integrationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
      toast({
        title: 'Facebook page disconnected',
        description: 'Your Facebook page has been disconnected successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error disconnecting page',
        description: error.message || 'An error occurred while disconnecting your Facebook page.',
        variant: 'destructive',
      });
    },
  });

  // Start Facebook connection process
  const connectToFacebook = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest('GET', '/api/integrations/facebook/auth');
      const data = await response.json();
      
      if (data.url) {
        // Open Facebook auth URL in a new window
        window.location.href = data.url;
      } else {
        throw new Error('No authentication URL returned');
      }
    } catch (error: any) {
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to start Facebook connection process.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  // Handle disconnecting a Facebook page
  const disconnectFacebookPage = (integrationId: number) => {
    if (window.confirm('Are you sure you want to disconnect this Facebook page?')) {
      disconnectMutation.mutate(integrationId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Facebook className="h-6 w-6 mr-2 text-blue-600" />
          Facebook Integration
        </CardTitle>
        <CardDescription>
          Connect your Facebook pages to post content directly from Kontent Fire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : integrations && integrations.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Connected Facebook Pages</h3>
            <div className="grid gap-3">
              {integrations.map((integration) => (
                <div 
                  key={integration.id} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {integration.profileImageUrl ? (
                      <img 
                        src={integration.profileImageUrl} 
                        alt={integration.accountName || 'Facebook Page'} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Facebook className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{integration.accountName}</p>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant="outline">{integration.accountType}</Badge>
                        {integration.isActive ? (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => disconnectFacebookPage(integration.id)}
                    disabled={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTitle>No Facebook pages connected</AlertTitle>
            <AlertDescription>
              Connect your Facebook pages to post content directly to Facebook from Kontent Fire.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={connectToFacebook} 
          disabled={isConnecting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isConnecting ? (
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
              Connecting...
            </div>
          ) : (
            <div className="flex items-center">
              <Facebook className="mr-2 h-5 w-5" />
              {integrations && integrations.length > 0 
                ? 'Connect Another Facebook Page' 
                : 'Connect to Facebook'}
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FacebookConnect;