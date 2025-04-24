import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Facebook, Plus, RefreshCw } from "lucide-react";
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
  const { FB, isLoaded, loginStatus, checkLoginStatus } = useFacebookSDK();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check if the user is already connected when component mounts
  useEffect(() => {
    if (isLoaded && loginStatus?.status === 'connected') {
      // User is already logged in and connected to our app
      console.log('Already connected to Facebook');
      
      // If already connected, we can get user info and connect to our backend
      handleExistingSession(loginStatus.authResponse);
    }
  }, [isLoaded, loginStatus]);

  // Handle an existing Facebook session
  const handleExistingSession = async (authResponse: any) => {
    if (!authResponse || !FB) return;
    
    try {
      setIsConnecting(true);
      
      // Get user info
      FB.api('/me', { fields: 'name,email' }, async (userInfo: any) => {
        try {
          // Send token to backend to save it
          const serverResponse = await apiRequest('POST', '/api/integrations/facebook/connect', {
            accessToken: authResponse.accessToken,
            userID: authResponse.userID,
            name: userInfo.name,
            email: userInfo.email
          });
          
          if (serverResponse.ok) {
            const data = await serverResponse.json();
            onLoginSuccess?.(data);
          }
        } catch (error) {
          console.error('Error connecting existing Facebook session:', error);
          // Don't call onLoginFailure for existing sessions as that would show an error to the user
        } finally {
          setIsConnecting(false);
        }
      });
    } catch (error) {
      console.error('Error handling existing Facebook session:', error);
      setIsConnecting(false);
    }
  };

  // Refresh the login status
  const refreshLoginStatus = async () => {
    if (!isLoaded || !FB) {
      onLoginFailure?.(new Error('Facebook SDK not loaded'));
      return;
    }

    setIsCheckingStatus(true);
    try {
      const status = await checkLoginStatus();
      if (status.status === 'connected') {
        handleExistingSession(status.authResponse);
      }
    } catch (error) {
      console.error('Error checking Facebook login status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

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

  // If we know the user is already connected, show a different button
  if (loginStatus?.status === 'connected') {
    return (
      <Button
        className={className}
        onClick={refreshLoginStatus}
        disabled={isCheckingStatus || isConnecting}
        variant="outline"
      >
        {isCheckingStatus ? 'Checking status...' : isConnecting ? 'Connecting...' : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Facebook Connection
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      className={className}
      onClick={handleFacebookLogin}
      disabled={!isLoaded || isConnecting}
    >
      {isConnecting ? 'Connecting...' : (
        <>
          <Facebook className="h-4 w-4 mr-2" />
          Connect Facebook
        </>
      )}
    </Button>
  );
};

export default FacebookLoginButton;