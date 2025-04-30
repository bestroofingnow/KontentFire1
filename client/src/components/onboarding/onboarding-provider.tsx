import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import GetStartedPopup from './get-started-popup';

type OnboardingProviderProps = {
  children: React.ReactNode;
};

/**
 * OnboardingProvider - Manages the display of onboarding popups
 * Checks if user needs to see the Get Started popup based on their profile completion
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [showGetStarted, setShowGetStarted] = useState(false);
  
  // Get company profile data
  const { data: companyProfile } = useQuery({
    queryKey: ['/api/company-profile'],
    enabled: !!user,
  });
  
  // Get brand settings data
  const { data: brandSettings } = useQuery({
    queryKey: ['/api/brand-settings'],
    enabled: !!user,
  });
  
  useEffect(() => {
    // Don't show for admin users
    if (!user || user.isAdmin) return;
    
    // Check if user has already dismissed the popup
    const isDismissed = localStorage.getItem('onboardingDismissed') === 'true';
    
    // Check if user has completed their profile
    const hasCompanyProfile = !!companyProfile && 
      !!companyProfile.name && 
      !!companyProfile.industry;
    
    // Check if user has set up brand settings
    const hasBrandSettings = !!brandSettings && 
      !!brandSettings.voice && 
      !!brandSettings.primaryColor;
    
    // Show popup if not dismissed and either company profile or brand settings are incomplete
    const shouldShow = !isDismissed && (!hasCompanyProfile || !hasBrandSettings);
    
    // Small delay to ensure not showing immediately on navigation
    const timer = setTimeout(() => {
      setShowGetStarted(shouldShow);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, companyProfile, brandSettings]);
  
  // Handle popup close
  const handleCloseGetStarted = () => {
    setShowGetStarted(false);
  };
  
  return (
    <>
      {children}
      
      {user && !user.isAdmin && (
        <GetStartedPopup
          userName={user.username}
          isOpen={showGetStarted}
          onClose={handleCloseGetStarted}
          hasCompanyProfile={
            !!companyProfile && 
            !!companyProfile.name && 
            !!companyProfile.industry
          }
          hasBrandSettings={
            !!brandSettings && 
            !!brandSettings.voice && 
            !!brandSettings.primaryColor
          }
        />
      )}
    </>
  );
};

export default OnboardingProvider;