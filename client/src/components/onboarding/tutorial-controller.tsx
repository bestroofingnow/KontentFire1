import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TutorialGuide from './tutorial-guide';
import { tutorialSections } from './tutorial-steps';

// Type for the company profile form data
type CompanyProfileData = {
  companyName: string;
  industry: string;
  description: string;
  primaryColor: string;
  secondaryColor?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
};

// Type for the auto post configuration
type AutoPostConfig = {
  postFrequency: string;
  contentTopics: string[];
  contentTone: string;
  bestTimeToPost: boolean;
  specificPostTime?: string;
  defaultHashtags?: string;
};

// Custom handles removed to avoid circular dependencies

const TutorialController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form data for company profile
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData>({
    companyName: '',
    industry: '',
    description: '',
    primaryColor: '#FF5B2E',
    secondaryColor: '#0070F3',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
  });

  // Form data for auto post config
  const [autoPostConfig, setAutoPostConfig] = useState<AutoPostConfig>({
    postFrequency: 'weekly',
    contentTopics: ['industry-news'],
    contentTone: 'professional',
    bestTimeToPost: true,
    defaultHashtags: '',
  });

  // This determines whether to show the onboarding tutorial
  // In a real app, this would check the user's onboarding status from the database
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if the user has just registered (via URL parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const isNewUser = urlParams.get('new_user') === 'true';
        
        // If it's explicitly a new user via URL param, always show the tutorial
        if (isNewUser) {
          showWelcomeDialog();
          return;
        }
        
        // Check if this is a first login for this user
        try {
          // Get user data from API to check if this is their first login
          const response = await apiRequest('GET', '/api/user');
          const userData = await response.json();
          
          // First check localStorage to see if tutorial was already completed
          const tutorialCompleted = localStorage.getItem('tutorial-completed') === 'true';
          
          if (tutorialCompleted) {
            console.log('Tutorial already completed according to localStorage');
            return;
          }
          
          // Check if the user has any company profile - if not, they're likely new
          const profileResponse = await apiRequest('GET', '/api/company-profile');
          if (profileResponse.status === 404 || profileResponse.status === 204) {
            // No company profile found, likely new user
            showWelcomeDialog();
            return;
          }
          
          // For demo purposes, also check if the user has been active for less than 1 minute
          // This helps ensure new users see the tutorial
          const createdAt = new Date(userData.createdAt);
          const now = new Date();
          const timeDiff = now.getTime() - createdAt.getTime();
          const isNewAccount = timeDiff < 1000 * 60 * 60; // Less than 1 hour old
          
          if (isNewAccount && !hasShownWelcome) {
            showWelcomeDialog();
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // If there's an error, default to showing the welcome
          if (!hasShownWelcome) {
            showWelcomeDialog();
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [hasShownWelcome]);

  // Mutation for saving company profile
  const saveCompanyProfileMutation = useMutation({
    mutationFn: async (data: CompanyProfileData) => {
      const response = await apiRequest('POST', '/api/company-profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      toast({
        title: 'Company profile saved',
        description: 'Your company profile has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving profile',
        description: error.message || 'An error occurred while saving your company profile.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for saving auto post config
  const saveAutoPostConfigMutation = useMutation({
    mutationFn: async (data: AutoPostConfig) => {
      const response = await apiRequest('POST', '/api/auto-post-config', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-post-config'] });
      toast({
        title: 'Auto post configuration saved',
        description: 'Your auto post configuration has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving configuration',
        description: error.message || 'An error occurred while saving your auto post configuration.',
        variant: 'destructive',
      });
    },
  });

  // Show welcome dialog
  const showWelcomeDialog = () => {
    setHasShownWelcome(true);
  };

  // Handle starting the tutorial
  const handleStartTutorial = () => {
    setIsOpen(true);
  };

  // Handle completing the tutorial
  const handleCompleteTutorial = async () => {
    try {
      // Mark tutorial as completed
      // await apiRequest('POST', '/api/user/complete-onboarding');
      
      setIsOpen(false);
      toast({
        title: 'Onboarding Completed',
        description: "You're all set to start using Kontent Fire!",
      });
      
      // Save completed state to localStorage
      try {
        localStorage.setItem('tutorial-completed', 'true');
        console.log('Saved tutorial-completed=true to localStorage');
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
    }
  };

  // Handle skipping the tutorial
  const handleSkipTutorial = () => {
    console.log('handleSkipTutorial called in TutorialController');
    
    // Forcibly close by directly setting state
    try {
      setIsOpen(false);
      console.log('isOpen set to false');
      
      // Show a toast notification
      toast({
        title: 'Tutorial Skipped',
        description: 'You can always access the tutorial from the help menu.',
      });
      console.log('Toast displayed');
      
      // Mark as completed in local storage to prevent re-showing on refresh
      localStorage.setItem('tutorial-completed', 'true');
    } catch (error) {
      console.error('Error in handleSkipTutorial:', error);
    }
  };

  return (
    <>
      {/* Welcome Dialog */}
      <Dialog open={hasShownWelcome && !isOpen} onOpenChange={(open) => {
        if (!open) {
          handleStartTutorial();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Welcome to Kontent Fire!</h2>
            <p className="text-gray-600">
              Let's set up your account with a quick tutorial to get the most out of Kontent Fire.
            </p>
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full bg-primary text-white hover:bg-primary/90"
                onClick={handleStartTutorial}
              >
                Start Quick Tutorial
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSkipTutorial}
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Guide */}
      <TutorialGuide
        sections={tutorialSections}
        isOpen={isOpen}
        onClose={() => {
          console.log('onClose in controller called');
          
          try {
            // Forcibly close the tutorial
            setIsOpen(false);
            console.log('isOpen set to false in onClose');
            
            // Add a delay for the animation to complete
            setTimeout(() => {
              console.log('Confirming tutorial is closed');
              if (isOpen) setIsOpen(false);
            }, 100);
          } catch (error) {
            console.error('Error in onClose:', error);
          }
        }}
        onComplete={handleCompleteTutorial}
        onSkip={handleSkipTutorial}
      />
    </>
  );
};

export default TutorialController;