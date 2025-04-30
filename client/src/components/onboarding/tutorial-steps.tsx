import React from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Facebook, Instagram, Linkedin, Globe, Loader2 } from 'lucide-react';
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex">
            <Input
              id="primary-color"
              type="color"
              defaultValue="#FF5B2E"
              className="w-12 h-12 p-1 rounded-l-md border-r-0"
            />
            <Input
              type="text"
              defaultValue="#FF5B2E"
              className="rounded-l-none flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondary-color">Secondary Color (Optional)</Label>
          <div className="flex">
            <Input
              id="secondary-color"
              type="color"
              defaultValue="#0070F3"
              className="w-12 h-12 p-1 rounded-l-md border-r-0"
            />
            <Input
              type="text"
              defaultValue="#0070F3"
              className="rounded-l-none flex-1"
            />
          </div>
        </div>
      </div>
      
      <Alert className="bg-muted/30 mt-4">
        <AlertDescription>
          Your brand colors will be used to customize your dashboard and generated content.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Content for Website and Social Links step
export const SocialLinksStep: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <Input id="website-url" placeholder="https://yourcompany.com" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="facebook-url" className="flex items-center">
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook Page URL
          </Label>
          <Input id="facebook-url" placeholder="https://facebook.com/yourcompany" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="instagram-url" className="flex items-center">
            <Instagram className="h-4 w-4 mr-2 text-pink-600" />
            Instagram Profile URL
          </Label>
          <Input id="instagram-url" placeholder="https://instagram.com/yourcompany" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedin-url" className="flex items-center">
            <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
            LinkedIn Page URL
          </Label>
          <Input id="linkedin-url" placeholder="https://linkedin.com/company/yourcompany" />
        </div>
      </div>
    </div>
  );
};

// Content for First Auto Post step
export const AutoPostConfigStep: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="post-frequency">Posting Frequency</Label>
          <Select>
            <SelectTrigger id="post-frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-topics">Content Topics</Label>
          <Select>
            <SelectTrigger id="content-topics">
              <SelectValue placeholder="Select primary topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="industry-news">Industry News</SelectItem>
              <SelectItem value="product-updates">Product Updates</SelectItem>
              <SelectItem value="tips-advice">Tips & Advice</SelectItem>
              <SelectItem value="company-news">Company News</SelectItem>
              <SelectItem value="customer-stories">Customer Stories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-tone">Content Tone</Label>
          <Select>
            <SelectTrigger id="content-tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="authoritative">Authoritative</SelectItem>
              <SelectItem value="humorous">Humorous</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-template">Content Template</Label>
          <Select>
            <SelectTrigger id="content-template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="battle-royale">Battle Royale</SelectItem>
              <SelectItem value="basics-101">Basics 101</SelectItem>
              <SelectItem value="myth-buster">Myth Buster</SelectItem>
              <SelectItem value="technical-guide">Technical Guide</SelectItem>
              <SelectItem value="case-against">Case Against</SelectItem>
              <SelectItem value="checklist">Checklist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="author-selection">Author</Label>
          <Select>
            <SelectTrigger id="author-selection">
              <SelectValue placeholder="Select author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              <SelectItem value="parker-cohn">Parker Cohn</SelectItem>
              <SelectItem value="michelle-taylor">Michelle Taylor</SelectItem>
              <SelectItem value="james-peterson">James Peterson</SelectItem>
              <SelectItem value="add-new">+ Add New Author</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="post-preview">Your First Post</Label>
            <Textarea
              id="post-preview"
              className="min-h-[120px]"
              placeholder="AI will generate your post here based on your company profile and settings..."
              readOnly
            />
            <div className="flex justify-end">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Generate Sample Post
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>When to Post</Label>
          <div className="flex items-center space-x-2">
            <input type="radio" id="best-time" name="posting-time" className="rounded text-primary" />
            <Label htmlFor="best-time" className="cursor-pointer">Use AI to determine best posting times</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="radio" id="specific-time" name="posting-time" className="rounded text-primary" />
            <Label htmlFor="specific-time" className="cursor-pointer">Choose specific posting times</Label>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default-hashtags">Default Hashtags (optional)</Label>
          <Input id="default-hashtags" placeholder="#yourbrand #industry #keyword" />
          <p className="text-xs text-muted-foreground mt-1">Separate hashtags with spaces</p>
        </div>
        
        <div className="flex justify-center mt-2">
          <Button className="bg-primary text-white hover:bg-primary/90">
            Enable Auto Posting
          </Button>
        </div>
      </div>
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

// Tutorial Sections
export const tutorialSections: TutorialSection[] = [
  {
    id: 'company-profile',
    title: 'Company Profile',
    description: 'Let\'s set up your company profile to help generate more relevant content.',
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
      },
      {
        id: 'social-links',
        title: 'Website & Social Links',
        description: 'Add your website and social media profiles.',
        content: <SocialLinksStep />,
      }
    ]
  },
  {
    id: 'auto-post',
    title: 'Create Auto Post',
    description: 'Configure your automatic posting settings.',
    steps: [
      {
        id: 'post-config',
        title: 'Post Configuration',
        description: 'Set up your content preferences for automated posts.',
        content: <AutoPostConfigStep />,
      },
      {
        id: 'social-connect',
        title: 'Connect Social Media',
        description: 'Connect your social media accounts for auto-posting.',
        content: <FacebookConnectStep />,
        cta: {
          text: 'Connect Later',
          onClick: () => {
            console.log('User chose to connect Facebook later');
            // No need to return anything, the controller will always go to next step now
          }
        }
      },
      {
        id: 'post-preview',
        title: 'Preview Your First Post',
        description: 'See a preview of what your first auto-generated post will look like.',
        content: <FirstPostPreviewStep />,
      },
      {
        id: 'schedule',
        title: 'Schedule Setup',
        description: 'Set up your posting schedule and preferences.',
        content: <ScheduleSetupStep />,
      }
    ]
  },
  {
    id: 'completion',
    title: 'All Set!',
    description: 'You\'re ready to start using Kontent Fire!',
    steps: [
      {
        id: 'done',
        title: 'Setup Complete',
        description: 'You\'ve successfully set up your account and created your first auto post.',
        content: <CompletionStep />,
      }
    ]
  }
];