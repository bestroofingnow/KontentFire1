/**
 * LinkedIn Connect Button Component
 * Displays a button to connect/disconnect a LinkedIn account
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Linkedin, ExternalLink, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * LinkedIn connection status type
 */
interface LinkedInStatus {
  connected: boolean;
  profile?: {
    name: string;
    profilePicture?: string;
  };
}

/**
 * LinkedIn connect button props
 */
interface LinkedInConnectButtonProps {
  variant?: 'default' | 'card';
  onStatusChange?: (connected: boolean) => void;
}

/**
 * LinkedIn Connect Button Component
 */
export function LinkedInConnectButton({ 
  variant = 'default',
  onStatusChange 
}: LinkedInConnectButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Query LinkedIn connection status
  const { 
    data: status, 
    isLoading: isStatusLoading, 
    error 
  } = useQuery<LinkedInStatus>({
    queryKey: ['/api/integrations/linkedin/status'],
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  
  // Call onStatusChange when status changes
  useEffect(() => {
    if (status && onStatusChange) {
      onStatusChange(status.connected);
    }
  }, [status, onStatusChange]);
  
  // Handle connect button click
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest('GET', '/api/integrations/linkedin/auth-url');
      const data = await res.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to get LinkedIn auth URL:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to LinkedIn. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  // Handle disconnect button click
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await apiRequest('DELETE', '/api/integrations/linkedin');
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/linkedin/status'] });
      toast({
        title: 'Successfully Disconnected',
        description: 'Your LinkedIn account has been disconnected.',
      });
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error);
      toast({
        title: 'Disconnection Failed',
        description: 'Could not disconnect from LinkedIn. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  // Show loading state
  if (isStatusLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
        Checking Connection...
      </Button>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Button variant="destructive" className="w-full" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/integrations/linkedin/status'] })}>
        Error Checking Status
      </Button>
    );
  }
  
  // Show connected state (card variant)
  if (status?.connected && variant === 'card') {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-blue-600 to-blue-800 text-white pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Linkedin className="mr-2 h-5 w-5" />
              LinkedIn Connected
            </CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-blue-700">
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect LinkedIn?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disconnect your LinkedIn account? This will revoke posting permissions for Kontent Fire.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisconnect} disabled={isDisconnecting}>
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center">
            {status.profile?.profilePicture ? (
              <img 
                src={status.profile.profilePicture} 
                alt={status.profile.name} 
                className="h-10 w-10 rounded-full mr-3" 
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Linkedin className="h-5 w-5 text-blue-500" />
              </div>
            )}
            <div>
              <h4 className="font-medium">{status.profile?.name}</h4>
              <p className="text-sm text-muted-foreground">Connected Account</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 py-2 px-6">
          <a 
            href="https://www.linkedin.com/feed/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            View LinkedIn Profile <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </CardFooter>
      </Card>
    );
  }
  
  // Show connected state (default variant)
  if (status?.connected) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700">
            <Linkedin className="mr-2 h-4 w-4" />
            Connected to LinkedIn
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect LinkedIn?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your LinkedIn account? This will revoke posting permissions for Kontent Fire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={isDisconnecting}>
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  // Show disconnected state
  return (
    <Button 
      variant="outline" 
      className="bg-white border-blue-500 text-blue-700 hover:bg-blue-50"
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
        </>
      ) : (
        <>
          <Linkedin className="mr-2 h-4 w-4" /> Connect LinkedIn
        </>
      )}
    </Button>
  );
}