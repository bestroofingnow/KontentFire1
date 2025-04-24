import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Calendar, CheckCircle2, ClockIcon, Edit2, Flame, Globe, Info, Settings } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Template types
type Template = {
  id: string;
  name: string;
  description: string;
};

// Content types
type ContentType = {
  id: string;
  name: string;
  description: string;
};

// Author profiles
type Author = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
};

// Platform options
type Platform = {
  id: string;
  name: string;
  icon: React.ReactNode;
  available: boolean;
};

// Duration options for automation
type DurationOption = {
  value: string;
  label: string;
  type: 'days' | 'months' | 'continuous';
};

// User data type
type UserData = {
  id: number;
  username: string;
  email: string;
  plan?: string;
  isAdmin?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export default function AutoPostingSetup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState<string>("ember");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [duration, setDuration] = useState<string>("30-days");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Fetch user data to get plan information
  const { data: user } = useQuery<UserData>({
    queryKey: ['/api/user'],
    retry: false,
  });
  
  useEffect(() => {
    if (user?.plan) {
      setPlanType(user.plan);
    }
  }, [user]);

  // Mock templates
  const templates: Template[] = [
    { id: "standard", name: "Standard Article", description: "Balanced informational content" },
    { id: "battle-royale", name: "Battle Royale", description: "Compare competing options/solutions" },
    { id: "basics-101", name: "Basics 101", description: "Educational content for beginners" },
    { id: "myth-buster", name: "Myth Buster", description: "Debunk common misconceptions" },
    { id: "technical-guide", name: "Technical Guide", description: "Detailed how-to content" },
    { id: "case-against", name: "Case Against", description: "Contrarian viewpoint on a topic" },
    { id: "checklist", name: "Checklist", description: "Step-by-step guidelines or checklists" },
  ];

  // Mock content types
  const contentTypes: ContentType[] = [
    { id: "article", name: "Article", description: "Longer-form written content" },
    { id: "social", name: "Social Post", description: "Short-form social media content" },
    { id: "video", name: "Video Script", description: "Script for video content" },
    { id: "newsletter", name: "Newsletter", description: "Email-friendly format" },
  ];

  // Real authors with their distinct tones
  const authors: Author[] = [
    { id: "parker", name: "Parker Cohn", avatar: "🎓", bio: "Professional: Authoritative and analytical, with precise language and evidence-based statements" },
    { id: "kay", name: "Kay Warner", avatar: "👩‍🏫", bio: "Approachable: Friendly and explanatory, using relatable analogies and clear examples" },
    { id: "wallace", name: "Wallace Valdez", avatar: "🌟", bio: "Optimistic: Constructively hopeful, identifying genuine opportunities with concrete examples" },
    { id: "maurice", name: "Maurice Salas", avatar: "📋", bio: "Matter-of-Fact: Clear and unembellished, presenting information in a straightforward, logical sequence" },
    { id: "irene", name: "Irene Burke", avatar: "🕰️", bio: "Nostalgic: Contemplatively historical, connecting past experiences with present insights" },
    { id: "alanna", name: "Alanna Santiago", avatar: "✨", bio: "Witty: Intellectually playful, with subtle wordplay and clever observations" },
    { id: "jermell", name: "Jermell Hasen", avatar: "🔥", bio: "Ardent: Intensely committed, conveying genuine enthusiasm and deep expertise" },
    { id: "ken", name: "Ken Uchiyama", avatar: "🌱", bio: "Altruistic: Community-minded, focusing on collective benefit and positive impact" },
    { id: "dinesh", name: "Dinesh Saraf", avatar: "🤝", bio: "Sincere: Authentically direct, building credibility through transparent communication" },
    { id: "enrique", name: "Enrique Casillas", avatar: "😏", bio: "Irreverent: Boldly mocks industry hype and overblown marketing claims with edgy humor" },
    { id: "jade", name: "Jade Strom", avatar: "🎭", bio: "Playful: Energetically engaging, using creativity to keep readers invested and entertained" },
  ];

  // Available platforms (with availability based on plan)
  const platforms: Platform[] = [
    { id: "linkedin", name: "LinkedIn", icon: <Globe className="h-5 w-5" />, available: true },
    { id: "facebook", name: "Facebook", icon: <Globe className="h-5 w-5" />, available: true },
    { id: "instagram", name: "Instagram", icon: <Globe className="h-5 w-5" />, available: true },
    { id: "gmb", name: "Google Business", icon: <Globe className="h-5 w-5" />, available: true },
    { id: "medium", name: "Medium", icon: <Globe className="h-5 w-5" />, available: true },
    { id: "blog", name: "Blog", icon: <Edit2 className="h-5 w-5" />, available: planType === "inferno" },
    { id: "twitter", name: "Twitter", icon: <Globe className="h-5 w-5" />, available: planType === "inferno" },
    { id: "pinterest", name: "Pinterest", icon: <Globe className="h-5 w-5" />, available: planType === "inferno" },
  ];

  // Duration options
  const durationOptions: DurationOption[] = [
    { value: "7-days", label: "7 days", type: "days" },
    { value: "14-days", label: "14 days", type: "days" },
    { value: "30-days", label: "30 days", type: "days" },
    { value: "60-days", label: "60 days", type: "days" },
    { value: "90-days", label: "90 days", type: "days" },
    { value: "3-months", label: "3 months", type: "months" },
    { value: "6-months", label: "6 months", type: "months" },
    { value: "12-months", label: "12 months", type: "months" },
    { value: "continuous", label: "Continue until stopped", type: "continuous" },
  ];

  // Toggle template selection
  const toggleTemplate = (id: string) => {
    if (selectedTemplates.includes(id)) {
      setSelectedTemplates(selectedTemplates.filter(t => t !== id));
    } else {
      setSelectedTemplates([...selectedTemplates, id]);
    }
  };

  // Toggle content type selection
  const toggleContentType = (id: string) => {
    if (selectedContentTypes.includes(id)) {
      setSelectedContentTypes(selectedContentTypes.filter(t => t !== id));
    } else {
      setSelectedContentTypes([...selectedContentTypes, id]);
    }
  };

  // Toggle author selection
  const toggleAuthor = (id: string) => {
    if (selectedAuthors.includes(id)) {
      setSelectedAuthors(selectedAuthors.filter(a => a !== id));
    } else {
      setSelectedAuthors([...selectedAuthors, id]);
    }
  };

  // Handle platform selection
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
  };

  // Handle duration selection
  const handleDurationChange = (value: string) => {
    setDuration(value);
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (step === 1 && (selectedTemplates.length === 0 || selectedContentTypes.length === 0)) {
      toast({
        title: "Incomplete Selection",
        description: "Please select at least one template and content type before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (step === 2 && selectedAuthors.length === 0) {
      toast({
        title: "Incomplete Selection",
        description: "Please select at least one author before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (step === 3 && !selectedPlatform) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a platform before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      setReviewOpen(true);
    }
  };

  // Go back to previous step
  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Create automation
  const createAutomation = async () => {
    try {
      // Real API call to create the automation
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templates: selectedTemplates,
          contentTypes: selectedContentTypes,
          authors: selectedAuthors,
          platform: selectedPlatform,
          duration: duration,
          postingTime: "09:00" // Default to 9 AM posting time
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create automation');
      }
      
      // Success state
      setIsSuccess(true);
      toast({
        title: "Automation Created",
        description: "Your content automation has been set up successfully.",
      });
      
      // Close review dialog after success
      setTimeout(() => {
        setReviewOpen(false);
        // Redirect to dashboard or scheduler view
        window.location.href = '/schedule';
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem setting up your automation.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Content Automation Setup</h1>
            <p className="text-gray-500 mt-1">
              Configure your automated content creation and posting
            </p>
          </div>
          
          <div className="bg-gray-100 px-4 py-2 rounded-lg flex items-center">
            <span className={cn(
              "text-sm font-medium flex items-center",
              planType === "ember" ? "text-secondary" : "text-primary"
            )}>
              {planType === "ember" 
                ? (
                  <>
                    <Flame className="h-4 w-4 mr-1 text-secondary" />
                    Ember Plan <span className="ml-1 text-xs text-gray-500">(1 post/day, 1 platform)</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 mr-1 text-primary" />
                    Inferno Plan <span className="ml-1 text-xs text-gray-500">(3 posts/day, all platforms)</span>
                  </>
                )
              }
            </span>
          </div>
        </div>
        
        {/* Setup steps */}
        <div className="flex items-center mb-6">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
            step >= 1 ? "bg-primary" : "bg-gray-300"
          )}>
            1
          </div>
          <div className={cn(
            "h-1 w-16",
            step >= 2 ? "bg-primary" : "bg-gray-300"
          )} />
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
            step >= 2 ? "bg-primary" : "bg-gray-300"
          )}>
            2
          </div>
          <div className={cn(
            "h-1 w-16",
            step >= 3 ? "bg-primary" : "bg-gray-300"
          )} />
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
            step >= 3 ? "bg-primary" : "bg-gray-300"
          )}>
            3
          </div>
          <div className={cn(
            "h-1 w-16",
            step >= 4 ? "bg-primary" : "bg-gray-300"
          )} />
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold",
            step >= 4 ? "bg-primary" : "bg-gray-300"
          )}>
            4
          </div>
        </div>
        
        {/* Step 1: Select Templates and Content Types */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 1: Select Templates & Content Types</h2>
            <p className="text-gray-500">Choose the templates and content types you want to include in your automation mix.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>Select multiple templates for variety</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map(template => (
                      <div key={template.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`template-${template.id}`} 
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={() => toggleTemplate(template.id)}
                        />
                        <Label htmlFor={`template-${template.id}`} className="flex-1 cursor-pointer">
                          <div>{template.name}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle>Content Types</CardTitle>
                  <CardDescription>What kind of content would you like to create?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentTypes.map(type => (
                      <div key={type.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`content-${type.id}`} 
                          checked={selectedContentTypes.includes(type.id)}
                          onCheckedChange={() => toggleContentType(type.id)}
                        />
                        <Label htmlFor={`content-${type.id}`} className="flex-1 cursor-pointer">
                          <div>{type.name}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" disabled>Back</Button>
              <Button onClick={goToNextStep}>Continue</Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Select Authors */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 2: Choose Writing Styles</h2>
            <p className="text-gray-500">Select the author personalities for your content. The AI will randomly adopt these styles.</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {authors.map(author => (
                <Card 
                  key={author.id} 
                  className={cn(
                    "border-2 cursor-pointer transition-all",
                    selectedAuthors.includes(author.id) 
                      ? "border-primary bg-primary-light/10" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => toggleAuthor(author.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="text-3xl">{author.avatar}</div>
                      {selectedAuthors.includes(author.id) && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{author.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{author.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={goToPreviousStep}>Back</Button>
              <Button onClick={goToNextStep}>Continue</Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Select Platform */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 3: Target Platform</h2>
            <p className="text-gray-500">Select a platform where your content will be posted automatically.</p>
            
            {planType === "ember" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800">Ember Plan Limit</h3>
                  <p className="text-sm text-amber-700">
                    Your Ember Plan includes one automated post per day to one platform. 
                    You can upgrade to add more platforms for $89/mo each, or upgrade to the Inferno Plan 
                    for unlimited platforms.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map(platform => (
                <Card 
                  key={platform.id} 
                  className={cn(
                    "border-2 transition-all",
                    !platform.available && "opacity-50",
                    selectedPlatform === platform.id 
                      ? "border-primary bg-primary-light/10" 
                      : "border-gray-200",
                    platform.available && selectedPlatform !== platform.id && "hover:border-gray-300 cursor-pointer"
                  )}
                  onClick={() => platform.available && handlePlatformChange(platform.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      {platform.icon}
                      {!platform.available && (
                        <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                          Inferno Only
                        </div>
                      )}
                      {selectedPlatform === platform.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            
            {!planType || planType === "ember" ? (
              <div className="mt-8 p-4 border border-primary/30 bg-primary-light/10 rounded-lg">
                <h3 className="font-semibold text-base flex items-center">
                  <Flame className="h-5 w-5 mr-2 text-primary" />
                  Need More Platforms?
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Upgrade to Inferno Plan for 3 posts per day across unlimited platforms, 
                  or add additional platforms to your Ember Plan for $89/month each.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="mr-2">
                    Add Platform (+$89/mo)
                  </Button>
                  <Button size="sm">
                    Upgrade to Inferno
                  </Button>
                </div>
              </div>
            ) : null}
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={goToPreviousStep}>Back</Button>
              <Button onClick={goToNextStep}>Continue</Button>
            </div>
          </div>
        )}
        
        {/* Step 4: Schedule & Duration */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 4: Schedule & Duration</h2>
            <p className="text-gray-500">Configure when and for how long your content will be posted.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClockIcon className="mr-2 h-5 w-5" />
                    Posting Time
                  </CardTitle>
                  <CardDescription>When should your content be published?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="posting-time">Daily posting time</Label>
                  <div className="mt-2">
                    <Select defaultValue="9">
                      <SelectTrigger id="posting-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8:00 AM</SelectItem>
                        <SelectItem value="9">9:00 AM</SelectItem>
                        <SelectItem value="10">10:00 AM</SelectItem>
                        <SelectItem value="11">11:00 AM</SelectItem>
                        <SelectItem value="12">12:00 PM</SelectItem>
                        <SelectItem value="13">1:00 PM</SelectItem>
                        <SelectItem value="14">2:00 PM</SelectItem>
                        <SelectItem value="15">3:00 PM</SelectItem>
                        <SelectItem value="16">4:00 PM</SelectItem>
                        <SelectItem value="17">5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-time-optimization">Optimize posting time</Label>
                      <Switch id="auto-time-optimization" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically adjust posting time based on audience engagement data
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Duration
                  </CardTitle>
                  <CardDescription>How long should this automation run?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={duration} 
                    onValueChange={handleDurationChange}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {durationOptions.filter(o => o.type === 'days').map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value}>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        {durationOptions.filter(o => o.type === 'months').map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value}>{option.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      {durationOptions.filter(o => o.type === 'continuous').map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value}>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={goToPreviousStep}>Back</Button>
              <Button onClick={goToNextStep}>Review & Finish</Button>
            </div>
          </div>
        )}
        
        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Your Automation Setup</DialogTitle>
              <DialogDescription>
                Please review the details of your automated content setup before confirming.
              </DialogDescription>
            </DialogHeader>
            
            {!isSuccess ? (
              <>
                <div className="space-y-4 my-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Templates:</h3>
                    <p className="text-sm text-gray-500">
                      {selectedTemplates.map(id => 
                        templates.find(t => t.id === id)?.name
                      ).join(", ")}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Content Types:</h3>
                    <p className="text-sm text-gray-500">
                      {selectedContentTypes.map(id => 
                        contentTypes.find(t => t.id === id)?.name
                      ).join(", ")}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Writing Styles:</h3>
                    <p className="text-sm text-gray-500">
                      {selectedAuthors.map(id => 
                        authors.find(a => a.id === id)?.name
                      ).join(", ")}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Platform:</h3>
                    <p className="text-sm text-gray-500">
                      {platforms.find(p => p.id === selectedPlatform)?.name}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Duration:</h3>
                    <p className="text-sm text-gray-500">
                      {durationOptions.find(d => d.value === duration)?.label}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700 flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                      Starting tomorrow, your content will be automatically created and posted once per day
                      at your selected time. You'll be able to review content before it's published and make
                      changes to this schedule at any time.
                    </p>
                  </div>
                </div>
                
                <DialogFooter className="sm:justify-between">
                  <Button variant="outline" onClick={() => setReviewOpen(false)}>
                    Go Back
                  </Button>
                  <Button onClick={createAutomation}>
                    Confirm Setup
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Automation Set Up Successfully!</h3>
                <p className="text-center text-gray-500">
                  Your content will start posting tomorrow according to your schedule.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}