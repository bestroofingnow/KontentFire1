/**
 * LinkedIn Connect Button Component
 * 
 * This component provides a button that allows users to connect to their LinkedIn account.
 * It handles the connection status and provides appropriate UI for each state.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type LinkedInConnectButtonProps = {
  onStatusChange?: (connected: boolean) => void;
  variant?: 'default' | 'card';
};

export function LinkedInConnectButton({ 
  onStatusChange,
  variant = 'default'
}: LinkedInConnectButtonProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<{
    name: string;
    profilePicture: string | null;
  } | null>(null);
  const { toast } = useToast();

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Notify parent component when connection status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isConnected);
    }
  }, [isConnected, onStatusChange]);

  // Check if the user is connected to LinkedIn
  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/integrations/linkedin/status');
      const data = await response.json();
      
      setIsConnected(data.isConnected);
      
      if (data.isConnected && data.profile) {
        setProfile({
          name: data.profile.name,
          profilePicture: data.profile.profilePicture
        });
      }
    } catch (error) {
      console.error('Failed to check LinkedIn connection status:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to check LinkedIn connection status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate LinkedIn authentication flow
  const connectToLinkedIn = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/integrations/linkedin/auth-url');
      const data = await response.json();
      
      // Redirect to LinkedIn auth page
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Failed to get LinkedIn auth URL:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to initiate LinkedIn authentication',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Disconnect from LinkedIn
  const disconnectFromLinkedIn = async () => {
    try {
      setIsLoading(true);
      await apiRequest('DELETE', '/api/integrations/linkedin');
      
      setIsConnected(false);
      setProfile(null);
      
      toast({
        title: 'Success',
        description: 'Successfully disconnected from LinkedIn',
      });
    } catch (error) {
      console.error('Failed to disconnect from LinkedIn:', error);
      toast({
        title: 'Disconnection Error',
        description: 'Failed to disconnect from LinkedIn',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render a button based on connection status
  if (variant === 'default') {
    if (isLoading) {
      return (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking Connection
        </Button>
      );
    }

    if (isConnected) {
      return (
        <Button 
          variant="outline" 
          onClick={disconnectFromLinkedIn}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <Linkedin className="mr-2 h-4 w-4" />
          Disconnect LinkedIn
        </Button>
      );
    }

    return (
      <Button 
        onClick={connectToLinkedIn}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Linkedin className="mr-2 h-4 w-4" />
        Connect LinkedIn
      </Button>
    );
  }

  // Card variant
  if (variant === 'card') {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <span className="text-gray-600">Checking connection status...</span>
        </div>
      );
    }

    if (isConnected && profile) {
      return (
        <div className="flex flex-col items-center">
          {profile.profilePicture ? (
            <img 
              src={profile.profilePicture} 
              alt={profile.name} 
              className="w-16 h-16 rounded-full mb-3" 
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <Linkedin className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <span className="font-medium text-lg mb-1">{profile.name}</span>
          <span className="text-sm text-gray-500 mb-4">LinkedIn Connected</span>
          <Button 
            variant="outline" 
            onClick={disconnectFromLinkedIn}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Disconnect Account
          </Button>
        </div>
      );
    }

    return (
      <Button 
        size="lg"
        onClick={connectToLinkedIn}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Linkedin className="mr-2 h-5 w-5" />
        Connect with LinkedIn
      </Button>
    );
  }

  return null;
}