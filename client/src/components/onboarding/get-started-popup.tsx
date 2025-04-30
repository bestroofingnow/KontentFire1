import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, Palette, LucideArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TransitionElement } from '@/components/ui/page-transition';
import { AnimatedText } from '@/components/ui/animated-text';
import { AnimatedBadge } from '@/components/ui/animated-badge';

type GetStartedPopupProps = {
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  hasCompanyProfile: boolean;
  hasBrandSettings: boolean;
}

/**
 * GetStartedPopup - Onboarding popup for new users
 * Guides them to set up their company profile and brand settings
 */
export const GetStartedPopup: React.FC<GetStartedPopupProps> = ({
  userName = 'there',
  isOpen,
  onClose,
  hasCompanyProfile = false,
  hasBrandSettings = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  
  // Handle popup close
  const handleClose = () => {
    // Store in localStorage that the user has seen this popup
    localStorage.setItem('onboardingDismissed', 'true');
    setDismissed(true);
    onClose();
  };
  
  // Setup steps data
  const steps = [
    {
      title: 'Welcome to Kontent Fire!',
      description: `Hi ${userName}! Let's make sure your account is set up properly before you start creating content.`,
      icon: <Info className="h-6 w-6 text-primary" />,
      action: {
        text: 'Let\'s Get Started',
        url: '',
        onClick: () => setCurrentStep(2)
      }
    },
    {
      title: 'Set Up Your Company Profile',
      description: 'Fill in your company details to personalize your experience and ensure your content represents your brand accurately.',
      icon: <Building className="h-6 w-6 text-primary" />,
      isComplete: hasCompanyProfile,
      action: {
        text: hasCompanyProfile ? 'Already Done ✓' : 'Set Up Company Profile',
        url: hasCompanyProfile ? '' : '/settings?tab=company',
        onClick: hasCompanyProfile ? () => setCurrentStep(3) : undefined
      }
    },
    {
      title: 'Configure Brand Settings',
      description: 'Define your brand voice, style, and messaging guidelines to ensure all generated content aligns with your brand identity.',
      icon: <Palette className="h-6 w-6 text-primary" />,
      isComplete: hasBrandSettings,
      action: {
        text: hasBrandSettings ? 'Already Done ✓' : 'Configure Brand Settings',
        url: hasBrandSettings ? '' : '/brand-settings',
        onClick: hasBrandSettings ? () => setCurrentStep(4) : undefined
      }
    },
    {
      title: 'You\'re All Set!',
      description: 'You\'ve completed the essential setup steps. You\'re now ready to start creating amazing content with Kontent Fire!',
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
      action: {
        text: 'Start Creating Content',
        url: '/content',
        onClick: undefined
      }
    }
  ];

  const currentStepData = steps[currentStep - 1];
  
  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { duration: 0.2 } 
    }
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
        >
          <motion.div
            className="w-full max-w-lg p-4"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="shadow-xl border-primary/10">
              <CardHeader className="relative">
                <button 
                  onClick={handleClose} 
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full p-1 
                          hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <TransitionElement effect="fade-in">
                  <div className="flex items-center space-x-3 mb-2">
                    {currentStepData.icon}
                    <AnimatedText effect="highlight" hoverTrigger={false}>
                      <CardTitle>{currentStepData.title}</CardTitle>
                    </AnimatedText>
                  </div>
                </TransitionElement>
                
                <TransitionElement effect="slide-up" delay={0.1}>
                  <CardDescription>{currentStepData.description}</CardDescription>
                </TransitionElement>
                
                {/* Step indicator */}
                <TransitionElement effect="fade-in" delay={0.2}>
                  <div className="flex space-x-2 mt-4">
                    {steps.map((_, index) => (
                      <motion.div 
                        key={index}
                        className={`h-1 rounded-full flex-1 ${currentStep > index ? 'bg-primary' : 'bg-muted'}`}
                        initial={false}
                        animate={currentStep > index ? { opacity: 1 } : { opacity: 0.5 }}
                      />
                    ))}
                  </div>
                </TransitionElement>
              </CardHeader>
              
              <CardContent>
                <TransitionElement effect="slide-up" delay={0.2}>
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm">
                          To get the most out of Kontent Fire, you'll need to:
                        </p>
                        
                        <ul className="mt-2 space-y-2 text-sm">
                          <li className="flex items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                              <span className="text-xs text-primary">1</span>
                            </div>
                            <span>Set up your company profile</span>
                            {hasCompanyProfile && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                          </li>
                          <li className="flex items-center">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                              <span className="text-xs text-primary">2</span>
                            </div>
                            <span>Configure your brand settings</span>
                            {hasBrandSettings && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                          </li>
                        </ul>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        These settings help us generate content that matches your brand's voice and style.
                      </p>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      {hasCompanyProfile ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm font-medium">Your company profile is complete!</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            You can always edit it later from Settings.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm">
                            In your company profile, you'll need to set:
                          </p>
                          
                          <ul className="mt-2 space-y-2 text-sm">
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Company name and industry</span>
                            </li>
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Company description</span>
                            </li>
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Logo and website URL</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      {hasBrandSettings ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm font-medium">Your brand settings are configured!</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            You can always adjust them later from Brand Settings.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm">
                            In brand settings, you'll need to define:
                          </p>
                          
                          <ul className="mt-2 space-y-2 text-sm">
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Brand voice (formal, casual, etc.)</span>
                            </li>
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Brand colors and visual style</span>
                            </li>
                            <li className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                              <span>Target audience and messaging guidelines</span>
                            </li>
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Setting up your brand profile is crucial for AI-generated content that truly represents your brand's voice and style.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <AnimatedBadge effect="tada" animate={true} variant="success" className="mb-2">
                          <span>Ready to go!</span>
                        </AnimatedBadge>
                        <p className="text-sm">
                          You've completed all the essential setup steps. Now you can start creating amazing content with Kontent Fire!
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <h4 className="text-sm font-medium">Content Creation</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Generate blog posts, social media content, and more
                          </p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <h4 className="text-sm font-medium">Scheduling</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Plan and schedule posts across platforms
                          </p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <h4 className="text-sm font-medium">Analytics</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Track performance of your content
                          </p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border">
                          <h4 className="text-sm font-medium">Integrations</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Connect with your favorite platforms
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TransitionElement>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <TransitionElement effect="fade-in" delay={0.3}>
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      Back
                    </Button>
                  )}
                  
                  {currentStep === 1 && (
                    <Button
                      variant="outline"
                      onClick={handleClose}
                    >
                      Skip Setup
                    </Button>
                  )}
                </TransitionElement>
                
                <TransitionElement effect="fade-in" delay={0.3}>
                  {currentStepData.action.url ? (
                    <Link href={currentStepData.action.url}>
                      <Button className="ml-auto">
                        {currentStepData.action.text}
                        <LucideArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={currentStepData.action.onClick}
                      className="ml-auto"
                    >
                      {currentStepData.action.text}
                      {currentStep < 4 && <LucideArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  )}
                </TransitionElement>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GetStartedPopup;