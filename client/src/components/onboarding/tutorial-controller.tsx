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
        // Mock API call to check onboarding status
        // const response = await apiRequest('GET', '/api/user/onboarding-status');
        // const { completed } = await response.json();
        
        // For demo, always show tutorial after welcome dialog
        const completed = false;
        
        if (!completed && !hasShownWelcome) {
          // Show welcome dialog first
          showWelcomeDialog();
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

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
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
    }
  };

  // Handle skipping the tutorial
  const handleSkipTutorial = () => {
    setIsOpen(false);
    toast({
      title: 'Tutorial Skipped',
      description: 'You can always access the tutorial from the help menu.',
    });
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
        onClose={() => setIsOpen(false)}
        onComplete={handleCompleteTutorial}
        onSkip={handleSkipTutorial}
      />
    </>
  );
};

export default TutorialController;