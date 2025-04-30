import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Building, MessageSquare, Book, Image, PlusCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/main-layout';
import InteractiveHover from '@/components/ui/interactive-hover';

// Types for brand settings data
type BrandInformation = {
  companyName: string;
  industry: string;
  missionStatement: string;
  vision: string;
  coreValues: string;
  targetAudience: string;
  uniqueSellingPoints: string;
  brandGuidelines: string;
};

type BrandVoice = {
  toneOfVoice: 'professional' | 'casual' | 'friendly' | 'formal';
  formalityLevel: number;
  enthusiasmLevel: number;
  creativityLevel: number;
};

type BrandStory = {
  sections: Array<{
    id: string;
    type: 'mission' | 'vision' | 'values' | 'custom';
    title: string;
    content: string;
    imageUrl?: string;
  }>;
};

type BrandSettings = {
  information: BrandInformation;
  voice: BrandVoice;
  story: BrandStory;
};

const BrandSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('information');

  // Fetch brand settings
  const { data: brandSettings, isLoading } = useQuery<BrandSettings>({
    queryKey: ['/api/brand-settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/brand-settings');
        return await response.json();
      } catch (error) {
        // If no settings exist yet, return default values
        return {
          information: {
            companyName: '',
            industry: '',
            missionStatement: '',
            vision: '',
            coreValues: '',
            targetAudience: '',
            uniqueSellingPoints: '',
            brandGuidelines: '',
          },
          voice: {
            toneOfVoice: 'professional',
            formalityLevel: 50,
            enthusiasmLevel: 50,
            creativityLevel: 50,
          },
          story: {
            sections: [],
          },
        };
      }
    },
  });

  // Local state for form values
  const [information, setInformation] = useState<BrandInformation>(
    brandSettings?.information || {
      companyName: '',
      industry: '',
      missionStatement: '',
      vision: '',
      coreValues: '',
      targetAudience: '',
      uniqueSellingPoints: '',
      brandGuidelines: '',
    }
  );

  const [voice, setVoice] = useState<BrandVoice>(
    brandSettings?.voice || {
      toneOfVoice: 'professional',
      formalityLevel: 50,
      enthusiasmLevel: 50,
      creativityLevel: 50,
    }
  );

  const [story, setStory] = useState<BrandStory>(
    brandSettings?.story || {
      sections: [],
    }
  );

  // Update local state when data is loaded
  React.useEffect(() => {
    if (brandSettings) {
      setInformation(brandSettings.information);
      setVoice(brandSettings.voice);
      setStory(brandSettings.story);
    }
  }, [brandSettings]);

  // Mutation for saving brand settings
  const saveBrandSettingsMutation = useMutation({
    mutationFn: async (data: Partial<BrandSettings>) => {
      const response = await apiRequest('POST', '/api/brand-settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/brand-settings'] });
      toast({
        title: 'Brand settings saved',
        description: 'Your brand settings have been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving settings',
        description: error.message || 'An error occurred while saving your brand settings.',
        variant: 'destructive',
      });
    },
  });

  // Handle saving information tab
  const handleSaveInformation = () => {
    saveBrandSettingsMutation.mutate({ information });
  };

  // Handle saving voice tab
  const handleSaveVoice = () => {
    saveBrandSettingsMutation.mutate({ voice });
  };

  // Handle saving story tab
  const handleSaveStory = () => {
    saveBrandSettingsMutation.mutate({ story });
  };

  // Handle adding a new story section
  const handleAddStorySection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: 'custom' as const,
      title: 'New Section',
      content: '',
    };
    
    setStory(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  // Handle updating a story section
  const handleUpdateStorySection = (id: string, field: string, value: string) => {
    setStory(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      ),
    }));
  };

  // Handle removing a story section
  const handleRemoveStorySection = (id: string) => {
    setStory(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id),
    }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Brand Settings</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="information" className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Brand Information
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Brand Voice
            </TabsTrigger>
            <TabsTrigger value="story" className="flex items-center">
              <Book className="mr-2 h-4 w-4" />
              Brand Story
            </TabsTrigger>
          </TabsList>
          
          {/* Brand Information Tab */}
          <TabsContent value="information">
            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
                <CardDescription>
                  Define your brand's core identity and values. This information will be used by our AI to generate content that aligns with your brand.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={information.companyName}
                      onChange={(e) => setInformation({ ...information, companyName: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Technology, Retail, Healthcare"
                      value={information.industry}
                      onChange={(e) => setInformation({ ...information, industry: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="missionStatement">Mission Statement</Label>
                  <Textarea
                    id="missionStatement"
                    placeholder="What is your company's mission?"
                    className="min-h-[100px]"
                    value={information.missionStatement}
                    onChange={(e) => setInformation({ ...information, missionStatement: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vision">Vision</Label>
                  <Textarea
                    id="vision"
                    placeholder="What is your company's long-term vision?"
                    className="min-h-[100px]"
                    value={information.vision}
                    onChange={(e) => setInformation({ ...information, vision: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coreValues">Core Values</Label>
                  <Textarea
                    id="coreValues"
                    placeholder="List your company's core values"
                    className="min-h-[100px]"
                    value={information.coreValues}
                    onChange={(e) => setInformation({ ...information, coreValues: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Describe your target audience demographics and characteristics"
                    className="min-h-[100px]"
                    value={information.targetAudience}
                    onChange={(e) => setInformation({ ...information, targetAudience: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="uniqueSellingPoints">Unique Selling Points</Label>
                  <Textarea
                    id="uniqueSellingPoints"
                    placeholder="What makes your brand unique?"
                    className="min-h-[100px]"
                    value={information.uniqueSellingPoints}
                    onChange={(e) => setInformation({ ...information, uniqueSellingPoints: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brandGuidelines">Brand Guidelines</Label>
                  <Textarea
                    id="brandGuidelines"
                    placeholder="Any specific brand guidelines or preferences"
                    className="min-h-[100px]"
                    value={information.brandGuidelines}
                    onChange={(e) => setInformation({ ...information, brandGuidelines: e.target.value })}
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <InteractiveHover effect="pulse" intensity="medium">
                    <Button 
                      onClick={handleSaveInformation}
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={saveBrandSettingsMutation.isPending}
                    >
                      {saveBrandSettingsMutation.isPending ? 'Saving...' : 'Save Information'}
                    </Button>
                  </InteractiveHover>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Brand Voice Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice</CardTitle>
                <CardDescription>
                  Configure how your brand communicates across all platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label>Tone of Voice</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${voice.toneOfVoice === 'professional' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setVoice({ ...voice, toneOfVoice: 'professional' })}
                    >
                      <h3 className="font-medium mb-1">Professional</h3>
                      <p className="text-sm text-muted-foreground">Industry expert voice, authoritative and trustworthy</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${voice.toneOfVoice === 'casual' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setVoice({ ...voice, toneOfVoice: 'casual' })}
                    >
                      <h3 className="font-medium mb-1">Casual</h3>
                      <p className="text-sm text-muted-foreground">Relaxed and approachable, like talking to a friend</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${voice.toneOfVoice === 'friendly' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setVoice({ ...voice, toneOfVoice: 'friendly' })}
                    >
                      <h3 className="font-medium mb-1">Friendly</h3>
                      <p className="text-sm text-muted-foreground">Warm and engaging, building personal connections</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${voice.toneOfVoice === 'formal' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setVoice({ ...voice, toneOfVoice: 'formal' })}
                    >
                      <h3 className="font-medium mb-1">Formal</h3>
                      <p className="text-sm text-muted-foreground">Traditional and structured, emphasizing respect</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="formality-slider">Formality Level</Label>
                      <span className="text-sm text-muted-foreground">{voice.formalityLevel}%</span>
                    </div>
                    <Slider
                      id="formality-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[voice.formalityLevel]}
                      onValueChange={(value) => setVoice({ ...voice, formalityLevel: value[0] })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="enthusiasm-slider">Enthusiasm</Label>
                      <span className="text-sm text-muted-foreground">{voice.enthusiasmLevel}%</span>
                    </div>
                    <Slider
                      id="enthusiasm-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[voice.enthusiasmLevel]}
                      onValueChange={(value) => setVoice({ ...voice, enthusiasmLevel: value[0] })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label htmlFor="creativity-slider">Creativity</Label>
                      <span className="text-sm text-muted-foreground">{voice.creativityLevel}%</span>
                    </div>
                    <Slider
                      id="creativity-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[voice.creativityLevel]}
                      onValueChange={(value) => setVoice({ ...voice, creativityLevel: value[0] })}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <InteractiveHover effect="pulse" intensity="medium">
                    <Button
                      onClick={handleSaveVoice}
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={saveBrandSettingsMutation.isPending}
                    >
                      {saveBrandSettingsMutation.isPending ? 'Saving...' : 'Save Voice Settings'}
                    </Button>
                  </InteractiveHover>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Brand Story Tab */}
          <TabsContent value="story">
            <Card>
              <CardHeader>
                <CardTitle>Brand Story Creator</CardTitle>
                <CardDescription>
                  Create your brand story with different sections to better communicate your values and mission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {story.sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                          <Input
                            id={`section-title-${section.id}`}
                            value={section.title}
                            onChange={(e) => handleUpdateStorySection(section.id, 'title', e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveStorySection(section.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`section-content-${section.id}`}>Content</Label>
                        <Textarea
                          id={`section-content-${section.id}`}
                          className="min-h-[120px]"
                          placeholder="Write your story section content..."
                          value={section.content}
                          onChange={(e) => handleUpdateStorySection(section.id, 'content', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor={`section-image-${section.id}`} className="flex items-center">
                          <Image className="h-4 w-4 mr-2" />
                          Add Image (optional)
                        </Label>
                        <Input
                          id={`section-image-${section.id}`}
                          placeholder="Image URL"
                          value={section.imageUrl || ''}
                          onChange={(e) => handleUpdateStorySection(section.id, 'imageUrl', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full py-6 border-dashed flex items-center justify-center"
                    onClick={handleAddStorySection}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Section
                  </Button>
                  
                  {story.sections.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-medium mb-4">Story Preview</h3>
                      <div className="prose max-w-full">
                        {story.sections.length > 0 ? (
                          story.sections.map((section) => (
                            <div key={section.id} className="mb-8">
                              <h4 className="text-lg font-medium mb-2">{section.title}</h4>
                              <p className="whitespace-pre-wrap mb-4">{section.content}</p>
                              {section.imageUrl && (
                                <img 
                                  src={section.imageUrl} 
                                  alt={section.title} 
                                  className="rounded-md max-w-full h-auto max-h-[300px] object-cover"
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-12 text-gray-500">
                            <div className="mb-4">
                              <Book className="h-12 w-12 mx-auto opacity-20" />
                            </div>
                            <p>Add sections to start creating your brand story</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 flex justify-end">
                    <InteractiveHover effect="pulse" intensity="medium">
                      <Button
                        onClick={handleSaveStory}
                        className="bg-primary text-white hover:bg-primary/90"
                        disabled={saveBrandSettingsMutation.isPending}
                      >
                        {saveBrandSettingsMutation.isPending ? 'Saving...' : 'Save Brand Story'}
                      </Button>
                    </InteractiveHover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default BrandSettingsPage;