import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Facebook } from 'lucide-react';
import { useFacebookSDK } from './facebook-sdk-provider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

interface FacebookLoginButtonProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: Error) => void;
  className?: string;
}

const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onLoginSuccess,
  onLoginFailure,
  className = '',
}) => {
  const { isLoaded, FB } = useFacebookSDK();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    if (!isLoaded || !FB) {
      toast({
        title: 'Facebook SDK not loaded',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      // Try to use our server-side OAuth flow which is more secure
      const response = await apiRequest('GET', '/api/integrations/facebook/auth');
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Facebook auth URL
        window.location.href = data.url;
        return;
      }
      
      // Fall back to client-side login if server-side auth URL is not available
      FB.login(
        async (response: any) => {
          if (response.authResponse) {
            try {
              // Send access token to your server to validate and store
              // This is an extra step to connect FB SDK login with our server
              const serverResponse = await apiRequest('POST', '/api/integrations/facebook/sdk-auth', {
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID,
              });
              
              if (serverResponse.ok) {
                const result = await serverResponse.json();
                
                toast({
                  title: 'Successfully connected',
                  description: 'Your Facebook account has been connected.',
                });
                
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['/api/integrations/facebook'] });
                
                if (onLoginSuccess) {
                  onLoginSuccess(result);
                }
              } else {
                throw new Error('Server failed to validate Facebook login');
              }
            } catch (error: any) {
              console.error('Facebook login server validation error:', error);
              
              toast({
                title: 'Connection Error',
                description: error.message || 'Failed to connect your Facebook account.',
                variant: 'destructive',
              });
              
              if (onLoginFailure) {
                onLoginFailure(error);
              }
            }
          } else {
            const error = new Error('User cancelled login or did not fully authorize.');
            
            if (onLoginFailure) {
              onLoginFailure(error);
            }
          }
          
          setIsLoggingIn(false);
        },
        {
          scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata',
          return_scopes: true,
        }
      );
    } catch (error: any) {
      console.error('Facebook login error:', error);
      
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect your Facebook account.',
        variant: 'destructive',
      });
      
      if (onLoginFailure) {
        onLoginFailure(error);
      }
      
      setIsLoggingIn(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogin}
      disabled={!isLoaded || isLoggingIn}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      {isLoggingIn ? (
        <div className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
          Connecting...
        </div>
      ) : (
        <div className="flex items-center">
          <Facebook className="mr-2 h-5 w-5" />
          Connect with Facebook
        </div>
      )}
    </Button>
  );
};

export default FacebookLoginButton;