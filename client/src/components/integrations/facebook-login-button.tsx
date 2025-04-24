import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Facebook, Plus } from "lucide-react";
import { useFacebookSDK } from './facebook-sdk-provider';
import { apiRequest } from '@/lib/queryClient';

interface FacebookLoginButtonProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: Error) => void;
  className?: string;
}

const FacebookLoginButton: React.FC<FacebookLoginButtonProps> = ({
  onLoginSuccess,
  onLoginFailure,
  className = ''
}) => {
  const { FB, isLoaded } = useFacebookSDK();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleFacebookLogin = async () => {
    if (!isLoaded || !FB) {
      onLoginFailure?.(new Error('Facebook SDK not loaded'));
      return;
    }

    setIsConnecting(true);

    try {
      // Request login with extended permissions
      FB.login(async (response: any) => {
        if (response.authResponse) {
          // User is logged in and has authorized your app
          const { accessToken, userID } = response.authResponse;
          
          // Get user's name
          FB.api('/me', { fields: 'name,email' }, async (userInfo: any) => {
            try {
              // Send token to backend to save it
              const serverResponse = await apiRequest('POST', '/api/integrations/facebook/connect', {
                accessToken,
                userID,
                name: userInfo.name,
                email: userInfo.email
              });
              
              if (serverResponse.ok) {
                const data = await serverResponse.json();
                onLoginSuccess?.(data);
              } else {
                throw new Error('Failed to connect Facebook account on server');
              }
            } catch (error) {
              onLoginFailure?.(error as Error);
            } finally {
              setIsConnecting(false);
            }
          });
        } else {
          // User cancelled login or did not fully authorize
          setIsConnecting(false);
          onLoginFailure?.(new Error('Facebook login was cancelled or failed'));
        }
      }, {
        scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
        return_scopes: true
      });
    } catch (error) {
      setIsConnecting(false);
      onLoginFailure?.(error as Error);
    }
  };

  return (
    <Button
      className={className}
      onClick={handleFacebookLogin}
      disabled={!isLoaded || isConnecting}
    >
      {isConnecting ? 'Connecting...' : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Connect Facebook
        </>
      )}
    </Button>
  );
};

export default FacebookLoginButton;