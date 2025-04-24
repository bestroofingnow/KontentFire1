import React, { useEffect, createContext, useContext, useState } from 'react';

// Auth response type from Facebook
interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}

// Login status response from Facebook
interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: FacebookAuthResponse | null;
}

interface FacebookSDKContextType {
  isLoaded: boolean;
  FB: any | null;
  loginStatus: FacebookLoginStatusResponse | null;
  checkLoginStatus: () => Promise<FacebookLoginStatusResponse>;
}

const defaultContextValue: FacebookSDKContextType = {
  isLoaded: false,
  FB: null,
  loginStatus: null,
  checkLoginStatus: async () => ({ status: 'unknown', authResponse: null }),
};

const FacebookSDKContext = createContext<FacebookSDKContextType>(defaultContextValue);

// Export as a named function for consistency
export function useFacebookSDK() {
  return useContext(FacebookSDKContext);
}

interface FacebookSDKProviderProps {
  appId: string;
  version?: string;
  children: React.ReactNode;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const FacebookSDKProvider: React.FC<FacebookSDKProviderProps> = ({
  appId,
  version = 'v18.0',
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [FB, setFB] = useState<any | null>(null);
  const [loginStatus, setLoginStatus] = useState<FacebookLoginStatusResponse | null>(null);

  // Function to check login status
  const checkLoginStatus = async (): Promise<FacebookLoginStatusResponse> => {
    return new Promise((resolve) => {
      if (!window.FB) {
        resolve({ status: 'unknown', authResponse: null });
        return;
      }
      
      window.FB.getLoginStatus((response: FacebookLoginStatusResponse) => {
        setLoginStatus(response);
        resolve(response);
      });
    });
  };

  useEffect(() => {
    // Only load the SDK once
    if (document.getElementById('facebook-jssdk')) return;

    // Initialize Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: version,
      });
      
      window.FB.AppEvents.logPageView();
      
      setIsLoaded(true);
      setFB(window.FB);
      
      // Check the login status when SDK loads
      window.FB.getLoginStatus((response: FacebookLoginStatusResponse) => {
        console.log('Facebook login status:', response);
        setLoginStatus(response);
      });
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0] as HTMLElement;
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = `https://connect.facebook.net/en_US/sdk.js`;
      if (fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));

    // Cleanup
    return () => {
      // We don't actually remove the SDK as it might be used by other components
      // But we can reset our state
      if (window.FB) {
        window.FB = undefined;
      }
    };
  }, [appId, version]);

  return (
    <FacebookSDKContext.Provider value={{ isLoaded, FB, loginStatus, checkLoginStatus }}>
      {children}
    </FacebookSDKContext.Provider>
  );
};

export default FacebookSDKProvider;