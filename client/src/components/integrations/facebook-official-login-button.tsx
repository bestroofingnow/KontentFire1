import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useFacebookSDK } from './facebook-sdk-provider';
import { apiRequest } from '@/lib/queryClient';

interface FacebookOfficialLoginButtonProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: Error) => void;
}

const FacebookOfficialLoginButton: React.FC<FacebookOfficialLoginButtonProps> = ({
  onLoginSuccess,
  onLoginFailure,
}) => {
  const { isLoaded, FB, loginStatus, checkLoginStatus } = useFacebookSDK();
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  // Handle login status changes
  const statusChangeCallback = async (response: any) => {
    console.log('statusChangeCallback', response);
    
    if (response.status === 'connected') {
      try {
        // Get user info
        FB.api('/me', { fields: 'name,email' }, async (userInfo: any) => {
          try {
            // Send token to backend to save it
            const serverResponse = await apiRequest('POST', '/api/integrations/facebook/connect', {
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID,
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
          }
        });
      } catch (error) {
        onLoginFailure?.(error as Error);
      }
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app
      console.log('Please log into this app.');
    } else {
      // The person is not logged into Facebook
      console.log('Please log into Facebook.');
    }
  };

  // This function is called when someone finishes with the Login Button
  const checkLoginState = () => {
    if (FB) {
      FB.getLoginStatus((response: any) => {
        statusChangeCallback(response);
      });
    }
  };

  useEffect(() => {
    // We need to render the Facebook button once the SDK is loaded
    if (isLoaded && buttonContainerRef.current) {
      // Clear any existing content
      buttonContainerRef.current.innerHTML = '';
      
      // Create the fb:login-button element
      const fbLoginButton = document.createElement('div');
      fbLoginButton.className = 'fb-login-button';
      fbLoginButton.setAttribute('data-width', '');
      fbLoginButton.setAttribute('data-size', '');
      fbLoginButton.setAttribute('data-button-type', '');
      fbLoginButton.setAttribute('data-layout', '');
      fbLoginButton.setAttribute('data-auto-logout-link', 'true');
      fbLoginButton.setAttribute('data-use-continue-as', 'true');
      fbLoginButton.setAttribute('data-scope', 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts');
      fbLoginButton.setAttribute('onlogin', 'checkLoginState()');
      
      buttonContainerRef.current.appendChild(fbLoginButton);
      
      // Make sure our checkLoginState function is available globally
      // Need to make it a regular function, not an async function to fix the error
      window.checkLoginState = function() {
        if (FB) {
          FB.getLoginStatus(function(response) {
            statusChangeCallback(response);
          });
        }
      };
      
      // Parse XFBML to render the button
      if (FB) {
        FB.XFBML.parse(buttonContainerRef.current);
      }
    }
  }, [isLoaded, FB]);

  // When the component mounts or when login status changes, check the login state
  useEffect(() => {
    if (loginStatus?.status === 'connected') {
      statusChangeCallback(loginStatus);
    }
  }, [loginStatus]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div ref={buttonContainerRef} id="facebook-login-button-container">
          {/* The Facebook Login Button will be rendered here */}
          {!isLoaded && <div>Loading Facebook SDK...</div>}
        </div>
      </CardContent>
    </Card>
  );
};

// Add this to make window.checkLoginState available globally
declare global {
  interface Window {
    checkLoginState: () => void;
  }
}

export default FacebookOfficialLoginButton;