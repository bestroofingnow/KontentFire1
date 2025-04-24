import { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useFacebookSDK } from './facebook-sdk-provider';
import { apiRequest } from '@/lib/queryClient';

interface FacebookExampleLoginButtonProps {
  onLoginSuccess?: (response: any) => void;
  onLoginFailure?: (error: Error) => void;
}

// This component follows exactly the example from Facebook documentation
const FacebookExampleLoginButton = ({ onLoginSuccess, onLoginFailure }: FacebookExampleLoginButtonProps) => {
  const { isLoaded, FB } = useFacebookSDK();
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  // This function is called when the SDK is loaded
  useEffect(() => {
    if (!isLoaded || !buttonContainerRef.current) return;

    // Define the status change callback function
    window.statusChangeCallback = function(response: any) {
      console.log('statusChangeCallback');
      console.log(response);
      
      if (response.status === 'connected') {
        // Send data to server and call onLoginSuccess
        testAPI(response);
      } else {
        console.log('Please log into this app.');
        onLoginFailure?.(new Error('Not authorized'));
      }
    };

    // This function is called when someone clicks the login button
    window.checkLoginState = function() {
      FB.getLoginStatus(function(response: any) {
        window.statusChangeCallback(response);
      });
    };

    // Get user information if connected
    async function testAPI(authResponse: any) {
      console.log('Welcome! Fetching your information....');
      
      FB.api('/me', { fields: 'name,email' }, async function(userInfo: any) {
        console.log('Successful login for: ' + userInfo.name);
        
        try {
          // Send token to backend to save it
          const serverResponse = await apiRequest('POST', '/api/integrations/facebook/connect', {
            accessToken: authResponse.authResponse.accessToken,
            userID: authResponse.authResponse.userID,
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
    }

    // Render the fb:login-button
    const fbLoginButton = document.createElement('fb:login-button');
    fbLoginButton.setAttribute('scope', 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts');
    fbLoginButton.setAttribute('onlogin', 'checkLoginState();');
    fbLoginButton.setAttribute('data-size', 'large');
    fbLoginButton.setAttribute('data-button-type', 'continue_with');
    fbLoginButton.setAttribute('data-layout', '');
    fbLoginButton.setAttribute('data-auto-logout-link', 'false');
    fbLoginButton.setAttribute('data-use-continue-as', 'true');
    
    buttonContainerRef.current.innerHTML = '';
    buttonContainerRef.current.appendChild(fbLoginButton);
    
    // Parse XFBML
    if (FB) {
      FB.XFBML.parse(buttonContainerRef.current);
    }

    return () => {
      // Cleanup
      delete window.statusChangeCallback;
      delete window.checkLoginState;
    };
  }, [isLoaded, FB, onLoginSuccess, onLoginFailure]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div ref={buttonContainerRef} id="facebook-login-button-container">
          {!isLoaded && <div>Loading Facebook SDK...</div>}
        </div>
      </CardContent>
    </Card>
  );
};

// Define the global functions
declare global {
  interface Window {
    checkLoginState: () => void;
    statusChangeCallback: (response: any) => void;
  }
}

export default FacebookExampleLoginButton;