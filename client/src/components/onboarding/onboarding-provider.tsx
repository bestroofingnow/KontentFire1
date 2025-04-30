import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import GetStartedPopup from './get-started-popup';

// Interface definitions for API data
interface CompanyProfile {
  id?: number;
  name: string;
  industry: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  foundedYear?: number;
  size?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface BrandSettings {
  id?: number;
  voice: string;
  primaryColor: string;
  secondaryColor?: string;
  tone?: string;
  targetAudience?: string;
  messagingGuidelines?: string;
  brandValues?: string[];
  brandStory?: string;
}

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
  const { data: companyProfile } = useQuery<CompanyProfile | undefined>({
    queryKey: ['/api/company-profile'],
    enabled: !!user,
  });
  
  // Get brand settings data
  const { data: brandSettings } = useQuery<BrandSettings | undefined>({
    queryKey: ['/api/brand-settings'],
    enabled: !!user,
  });
  
  // Cast data to proper types - using type assertion for API response data
  const profileData = companyProfile as CompanyProfile | undefined;
  const brandData = brandSettings as BrandSettings | undefined;
  
  // Flag for whether company profile is complete
  const hasCompanyProfile = !!(profileData && 
    profileData.name && 
    profileData.industry);
  
  // Flag for whether brand settings are complete
  const hasBrandSettings = !!(brandData && 
    brandData.voice && 
    brandData.primaryColor);
  
  useEffect(() => {
    // Don't show for admin users
    if (!user || user.isAdmin) return;
    
    // Check if user has already dismissed the popup
    const isDismissed = localStorage.getItem('onboardingDismissed') === 'true';
    
    // Show popup if not dismissed and either company profile or brand settings are incomplete
    const shouldShow = !isDismissed && (!hasCompanyProfile || !hasBrandSettings);
    
    // Small delay to ensure not showing immediately on navigation
    const timer = setTimeout(() => {
      setShowGetStarted(shouldShow);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, hasCompanyProfile, hasBrandSettings]);
  
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
          hasCompanyProfile={hasCompanyProfile}
          hasBrandSettings={hasBrandSettings}
        />
      )}
    </>
  );
};

export default OnboardingProvider;