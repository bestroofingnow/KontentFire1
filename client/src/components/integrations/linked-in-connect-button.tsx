import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SiLinkedin } from 'react-icons/si';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LinkedInConnectButtonProps {
  isConnected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export function LinkedInConnectButton({
  isConnected = false,
  onConnect,
  onDisconnect,
  className = ''
}: LinkedInConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Start the LinkedIn OAuth flow
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/integrations/linkedin/auth-url');
      const data = await response.json();
      
      // Open the LinkedIn authorization page
      window.location.href = data.authUrl;
      
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Failed to start LinkedIn authentication:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Could not connect to LinkedIn',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect the LinkedIn integration
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await apiRequest('DELETE', '/api/integrations/linkedin');
      
      // Invalidate the integrations cache
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      
      toast({
        title: 'LinkedIn Disconnected',
        description: 'Your LinkedIn account has been disconnected',
      });
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect LinkedIn:', error);
      toast({
        title: 'Disconnection Failed',
        description: error instanceof Error ? error.message : 'Could not disconnect from LinkedIn',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      className={`flex items-center gap-2 ${className}`}
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <SiLinkedin className="h-4 w-4" />
      )}
      {isConnected ? 'Disconnect LinkedIn' : 'Connect LinkedIn'}
    </Button>
  );
}