import React, { useState, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronRight, X, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import InteractiveHover from '@/components/ui/interactive-hover';

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  completionCriteria?: () => boolean;
  content: React.ReactNode;
  cta?: {
    text: string;
    onClick: () => void;
  };
};

export type TutorialSection = {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
};

type TutorialGuideProps = {
  sections: TutorialSection[];
  onComplete?: () => void;
  onSkip?: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const TutorialGuide: React.FC<TutorialGuideProps> = ({
  sections,
  onComplete,
  onSkip,
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [activeStep, setActiveStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize first step of the first section
  useEffect(() => {
    if (sections.length > 0 && sections[0].steps.length > 0) {
      setActiveStep(sections[0].steps[0].id);
    }
  }, [sections]);

  // Check if the current section is completed
  const isSectionCompleted = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return false;
    
    return section.steps.every(step => completedSteps[step.id]);
  };

  // Get the current section and step
  const currentSection = sections.find(s => s.id === activeSection);
  const currentStep = currentSection?.steps.find(s => s.id === activeStep);
  
  // Mark a step as completed
  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
  };

  // Go to the next step or section
  const goToNextStep = () => {
    if (!currentSection || !currentStep) return;
    
    // Mark current step as complete
    completeStep(currentStep.id);
    
    // Find the current step index
    const stepIndex = currentSection.steps.findIndex(s => s.id === currentStep.id);
    
    // If there's a next step in the current section, go to it
    if (stepIndex < currentSection.steps.length - 1) {
      setActiveStep(currentSection.steps[stepIndex + 1].id);
      return;
    }
    
    // If current section is completed, find the next section
    const sectionIndex = sections.findIndex(s => s.id === currentSection.id);
    if (sectionIndex < sections.length - 1) {
      const nextSection = sections[sectionIndex + 1];
      setActiveSection(nextSection.id);
      setActiveStep(nextSection.steps[0].id);
      return;
    }
    
    // If all sections are completed
    if (onComplete) {
      onComplete();
    }
    
    toast({
      title: "Tutorial Completed!",
      description: "You've successfully completed the onboarding tutorial.",
    });
  };

  // Navigate to a specific step
  const navigateToStep = (sectionId: string, stepId: string) => {
    setActiveSection(sectionId);
    setActiveStep(stepId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 right-4 z-50 w-full max-w-md"
      >
        <Card className="shadow-xl border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <span className="text-primary mr-2">
                <Info className="h-5 w-5" />
              </span>
              {currentSection?.title}
            </CardTitle>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={onSkip}
              >
                <span className="sr-only">Skip tutorial</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <Tabs value={activeSection} className="w-full">
            <div className="px-6">
              <TabsList className="w-full h-auto p-1 bg-muted/60 mb-4">
                {sections.map((section, index) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex-1 data-[state=active]:bg-white relative",
                      isSectionCompleted(section.id) && "text-green-600"
                    )}
                  >
                    <span className="flex items-center justify-center">
                      {isSectionCompleted(section.id) ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <span className="h-5 w-5 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center text-xs mr-1">
                          {index + 1}
                        </span>
                      )}
                      {section.title}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="pt-0 pb-3">
                <div className="bg-muted/10 p-3 px-6 mb-4">
                  <div className="flex items-start mb-2">
                    <span className="flex-shrink-0 pt-0.5 mr-2 text-primary">
                      <AlertCircle className="h-4 w-4" />
                    </span>
                    <p className="text-sm text-muted-foreground leading-tight">
                      {section.description}
                    </p>
                  </div>
                  
                  {/* Steps progress */}
                  <div className="flex items-center space-x-1 mt-3">
                    {section.steps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <div 
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            step.id === activeStep 
                              ? "bg-primary" 
                              : completedSteps[step.id]
                                ? "bg-green-500" 
                                : "bg-gray-200"
                          )}
                          onClick={() => navigateToStep(section.id, step.id)}
                        />
                        {index < section.steps.length - 1 && <div className="w-1" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                <CardContent>
                  {section.steps.map((step) => (
                    <AnimatePresence mode="wait" key={step.id}>
                      {step.id === activeStep && (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="space-y-3">
                            <h3 className="font-medium text-lg">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                            <div className="py-2">{step.content}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </CardContent>
                
                <CardFooter className="flex justify-between pt-2 px-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const stepIndex = section.steps.findIndex(s => s.id === activeStep);
                      if (stepIndex > 0) {
                        setActiveStep(section.steps[stepIndex - 1].id);
                      } else {
                        const sectionIndex = sections.findIndex(s => s.id === section.id);
                        if (sectionIndex > 0) {
                          const prevSection = sections[sectionIndex - 1];
                          setActiveSection(prevSection.id);
                          setActiveStep(prevSection.steps[prevSection.steps.length - 1].id);
                        }
                      }
                    }}
                    disabled={
                      activeStep === sections[0].steps[0].id
                    }
                  >
                    Previous
                  </Button>
                  
                  <InteractiveHover effect="pulse" intensity="strong">
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      size="sm"
                      onClick={() => {
                        if (currentStep?.cta?.onClick) {
                          currentStep.cta.onClick();
                        } else {
                          goToNextStep();
                        }
                      }}
                    >
                      {currentStep?.cta?.text || "Next Step"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </InteractiveHover>
                </CardFooter>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialGuide;