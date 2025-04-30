import React from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Facebook, Instagram, Linkedin, Globe, Loader2, Info, AlertCircle } from 'lucide-react';
import { TutorialSection } from './tutorial-guide';

// Content for Company Profile step
export const CompanyProfileStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="flex items-center text-blue-800">
          <Info className="h-5 w-5 mr-2 text-blue-600" />
          Fill out your company profile in the Settings page to help generate relevant content
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Company Profile Setup</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your company profile information is used to tailor the AI-generated content to your specific business needs.
            </p>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/settings')}
              >
                Go to Company Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for Company Colors step
export const CompanyColorsStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-orange-50 border-orange-200">
        <AlertDescription className="flex items-center text-orange-800">
          <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
          Choose your brand colors in the Brand Settings tab
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <h3 className="font-medium">Brand Color Setup</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set your primary and secondary brand colors to personalize your dashboard and generated content.
            </p>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/settings?tab=brand')}
              >
                Go to Brand Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for Website and Social Links step
export const SocialLinksStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-purple-50 border-purple-200">
        <AlertDescription className="flex items-center text-purple-800">
          <Info className="h-5 w-5 mr-2 text-purple-600" />
          Add your website and social media information in the Integrations page
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Connect Your Web Presence</h3>
            </div>
            <p className="text-sm text-gray-600">
              Connect your website and social media accounts to allow Kontent Fire to share your content across multiple platforms.
            </p>
            <div className="flex justify-center mt-4 space-x-3">
              <Facebook className="h-8 w-8 text-blue-600" />
              <Instagram className="h-8 w-8 text-pink-600" />
              <Linkedin className="h-8 w-8 text-blue-700" />
            </div>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/integrations')}
              >
                Go to Integrations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for First Auto Post step
export const AutoPostConfigStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 border-green-200">
        <AlertDescription className="flex items-center text-green-800">
          <Info className="h-5 w-5 mr-2 text-green-600" />
          Create your first automated content schedule in the Content Manager
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="font-medium">Content Automation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set up automated content creation with your preferred topics, tone, and posting frequency.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Industry News</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Professional</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Weekly</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Standard</span>
            </div>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/content')}
              >
                Go to Content Manager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for Facebook Connection step
export const FacebookConnectStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  const goToFacebookIntegration = () => {
    // Make sure navigation works or at least close the tutorial if it fails
    try {
      navigate('/integrations');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Facebook className="h-12 w-12 text-blue-600" />
            <h3 className="font-medium">Connect Your Facebook Page</h3>
            <p className="text-sm text-gray-600">
              Connect your Facebook Page to automatically post your content directly to Facebook.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={goToFacebookIntegration}
            >
              Connect Facebook Page
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Alert className="bg-muted/30 mt-4">
        <AlertDescription>
          You'll need to authorize Kontent Fire to post on your behalf, but we'll never post without your permission.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Content for First Post Preview step
export const FirstPostPreviewStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertDescription className="flex items-center text-amber-800">
          <Info className="h-5 w-5 mr-2 text-amber-600" />
          Generate your first AI-powered content in the Content Creation page
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <h3 className="font-medium">AI Content Creation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Generate optimized content for multiple platforms using our advanced AI engine. 
              Preview and edit before publishing.
            </p>
            <div className="bg-gray-50 p-3 rounded-md mt-2 text-xs text-gray-600 italic">
              "AI-generated content tailored to your brand voice, industry, and target audience..."
            </div>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/content/create')}
              >
                Create Content Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for Schedule Setup step
export const ScheduleSetupStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-4">
      <Alert className="bg-indigo-50 border-indigo-200">
        <AlertDescription className="flex items-center text-indigo-800">
          <Info className="h-5 w-5 mr-2 text-indigo-600" />
          Configure your posting schedule in the Scheduler section
        </AlertDescription>
      </Alert>
      
      <Card className="border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="font-medium">Schedule Setup</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set up your optimal posting schedule and let AI determine the best times to reach your audience.
            </p>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm mt-3">
              <span className="text-gray-600">AI-driven posting times</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Recommended</span>
            </div>
            <div className="flex justify-center mt-2">
              <Button 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => navigate('/scheduler')}
              >
                Go to Scheduler
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Content for Completion step
export const CompletionStep: React.FC = () => {
  const [_, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-medium mb-2">All Set!</h2>
        <p className="text-gray-600 mb-6">
          You've successfully set up your company profile and created your first auto post.
          Your content will be automatically generated and published according to your schedule.
        </p>
        <div className="flex space-x-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => navigate('/content')}
          >
            Create More Content
          </Button>
        </div>
      </div>
    </div>
  );
};

// Tutorial Sections - Focused only on Company and Brand Setup
export const tutorialSections: TutorialSection[] = [
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Let\'s set up your company profile to maximize the AI content generation.',
    steps: [
      {
        id: 'basic-info',
        title: 'Basic Information',
        description: 'Enter your company name, industry, and a brief description.',
        content: <CompanyProfileStep />,
      },
      {
        id: 'brand-colors',
        title: 'Brand Colors',
        description: 'Choose your brand colors to customize your experience.',
        content: <CompanyColorsStep />,
      }
    ]
  },
  {
    id: 'brand-settings',
    title: 'Brand Identity',
    description: 'Define your brand voice and identity to personalize AI content.',
    steps: [
      {
        id: 'brand-voice',
        title: 'Brand Voice',
        description: 'Set the tone and style of your brand\'s communications.',
        content: (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="flex items-center text-blue-800">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Configure your brand voice in the Brand tab of Settings
              </AlertDescription>
            </Alert>
            
            <Card className="border border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="font-medium">Brand Voice Setup</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Define how your brand speaks to customers - professional, friendly, casual, or create custom voices for different content types.
                  </p>
                  <div className="flex justify-center mt-2">
                    <Button 
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => navigate('/settings?tab=brand&brandTab=voice')}
                    >
                      Configure Brand Voice
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ),
      },
      {
        id: 'brand-story',
        title: 'Brand Story',
        description: 'Share your company\'s mission, vision, and core values.',
        content: (
          <div className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="flex items-center text-amber-800">
                <Info className="h-5 w-5 mr-2 text-amber-600" />
                Add your brand story in the Brand tab of Settings
              </AlertDescription>
            </Alert>
            
            <Card className="border border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="font-medium">Brand Story Elements</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tell your brand's story to help our AI understand what makes your company unique. This informs all content creation.
                  </p>
                  <div className="flex justify-center mt-2">
                    <Button 
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => navigate('/settings?tab=brand&brandTab=story')}
                    >
                      Set Brand Story
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ),
      }
    ]
  },
  {
    id: 'completion',
    title: 'All Set',
    description: 'You\'ve completed the brand setup process.',
    steps: [
      {
        id: 'done',
        title: 'Setup Complete',
        description: 'Your brand settings are ready. For any questions about features, chat with our AI assistant.',
        content: (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Brand Setup Complete!</h2>
              <p className="text-gray-600 mb-6">
                You've successfully set up your company profile and brand settings.
                For help with specific features, try asking our AI assistant in the chat.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => window.location.href = '/assistant'}
                >
                  Chat with Assistant
                </Button>
              </div>
            </div>
          </div>
        ),
      }
    ]
  }
];