import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Building, MessageSquare, Book, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { CompanyProfile } from "@shared/schema";
import InteractiveHover from "@/components/ui/interactive-hover";

// Profile schema
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
});

// Password schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  contentCompleted: z.boolean(),
  weeklyDigest: z.boolean(),
  newFeatures: z.boolean(),
});

// Company profile schema
const companyProfileSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal('')),
  // Additional fields for the front-end form that aren't in the core schema
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal('')),
  twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal('')),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  youtubeUrl: z.string().url("Invalid YouTube URL").optional().or(z.literal('')),
  tiktokUrl: z.string().url("Invalid TikTok URL").optional().or(z.literal('')),
  pinterestUrl: z.string().url("Invalid Pinterest URL").optional().or(z.literal('')),
  additionalInfo: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;
type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("profile");
  
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

  type CustomVoice = {
    id: string;
    name: string;
    description: string;
    formalityLevel: number;
    enthusiasmLevel: number;
    creativityLevel: number;
    examples: string;
    isActive: boolean;
  };

  type BrandVoice = {
    toneOfVoice: 'professional' | 'casual' | 'friendly' | 'formal' | 'custom';
    formalityLevel: number;
    enthusiasmLevel: number;
    creativityLevel: number;
    customVoices: CustomVoice[];
    activeCustomVoiceId?: string;
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
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      contentCompleted: true,
      weeklyDigest: false,
      newFeatures: true,
    },
  });
  
  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PUT", "/api/user/password", data);
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("PUT", "/api/user/notifications", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Company profile query
  const { data: companyProfile, isLoading: isLoadingProfile } = useQuery<CompanyProfile>({
    queryKey: ['/api/company-profile'],
    enabled: !!user,
    // Avoid showing 404 errors to the user when they don't have a profile yet
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
  
  // Company profile form
  const companyProfileForm = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      website: "",
      logo: "",
      primaryColor: "",
      secondaryColor: "",
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      pinterestUrl: "",
      additionalInfo: "",
    },
  });

  // Update form values when company profile data is loaded
  React.useEffect(() => {
    if (companyProfile && !companyProfileForm.formState.isDirty) {
      companyProfileForm.reset({
        name: companyProfile.name || "",
        industry: companyProfile.industry || "",
        description: companyProfile.description || "",
        website: companyProfile.website || "",
        logo: companyProfile.logo || "",
        // These fields may not be in the database schema but are needed for the UI
        primaryColor: companyProfile.primaryColor || "",
        secondaryColor: companyProfile.secondaryColor || "",
        facebookUrl: companyProfile.facebookUrl || "",
        twitterUrl: companyProfile.twitterUrl || "",
        instagramUrl: companyProfile.instagramUrl || "",
        linkedinUrl: companyProfile.linkedinUrl || "",
        youtubeUrl: companyProfile.youtubeUrl || "",
        tiktokUrl: companyProfile.tiktokUrl || "",
        pinterestUrl: companyProfile.pinterestUrl || "",
        additionalInfo: companyProfile.additionalInfo || "",
      });
    }
  }, [companyProfile, companyProfileForm]);

  // Company profile mutation
  const companyProfileMutation = useMutation({
    mutationFn: async (data: CompanyProfileFormValues) => {
      const endpoint = companyProfile 
        ? `/api/company-profile/${companyProfile.id}`
        : '/api/company-profile';
      const method = companyProfile ? "PUT" : "POST";
      
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      toast({
        title: "Company Profile Updated",
        description: "Your company information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Brand settings state and query
  const [brandTabActive, setBrandTabActive] = useState<string>('information');
  
  // Fetch brand settings
  const { data: brandSettings, isLoading: isLoadingBrandSettings } = useQuery<BrandSettings>({
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
            toneOfVoice: 'professional' as const,
            formalityLevel: 50,
            enthusiasmLevel: 50,
            creativityLevel: 50,
            customVoices: [],
            activeCustomVoiceId: undefined,
          },
          story: {
            sections: [],
          },
        };
      }
    },
  });
  
  // Local state for brand settings form values
  const [information, setInformation] = useState<BrandInformation>({
    companyName: '',
    industry: '',
    missionStatement: '',
    vision: '',
    coreValues: '',
    targetAudience: '',
    uniqueSellingPoints: '',
    brandGuidelines: '',
  });
  
  const [voice, setVoice] = useState<BrandVoice>({
    toneOfVoice: 'professional',
    formalityLevel: 50,
    enthusiasmLevel: 50,
    creativityLevel: 50,
    customVoices: [],
    activeCustomVoiceId: undefined,
  });
  
  const [story, setStory] = useState<BrandStory>({
    sections: [],
  });
  
  // Update local state when brand settings are loaded
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

  // Handle form submissions
  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    notificationMutation.mutate(data);
  };
  
  const onCompanyProfileSubmit = (data: CompanyProfileFormValues) => {
    companyProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
            
            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 gap-2 w-full md:w-auto">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="brand">Company & Brand</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormDescription>
                                We'll use this email for notifications and account recovery.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary-dark"
                          disabled={profileMutation.isPending}
                        >
                          {profileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Password Tab */}
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 6 characters.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary-dark"
                          disabled={passwordMutation.isPending}
                        >
                          {passwordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="contentCompleted"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Content Completed</FormLabel>
                                <FormDescription>
                                  Get notified when your scheduled content is published
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="weeklyDigest"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Weekly Digest</FormLabel>
                                <FormDescription>
                                  Receive a weekly summary of your content performance
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationForm.control}
                          name="newFeatures"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">New Features</FormLabel>
                                <FormDescription>
                                  Get notified about new platform features and updates
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary hover:bg-primary-dark"
                          disabled={notificationMutation.isPending}
                        >
                          {notificationMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Preferences'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              

              {/* Brand Tab */}
              <TabsContent value="brand">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Brand Settings</CardTitle>
                    <CardDescription>
                      Define your brand identity, voice, and story to improve AI-generated content
                    </CardDescription>
                    
                    <Tabs defaultValue={brandTabActive} onValueChange={setBrandTabActive} className="mt-4">
                      <TabsList className="mb-6">
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
                    </Tabs>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingBrandSettings ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {/* Brand Information Tab */}
                        {brandTabActive === 'information' && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-medium">Basic Information</h3>
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
                            
                            <h3 className="text-lg font-medium pt-4">Brand Assets</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Website URL</Label>
                                <Input
                                  id="websiteUrl"
                                  placeholder="https://yourwebsite.com"
                                  value={companyProfile?.websiteUrl || ''}
                                  disabled
                                />
                                <p className="text-xs text-muted-foreground">
                                  Edit this in the settings form below
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="logoUrl">Logo URL</Label>
                                <Input
                                  id="logoUrl"
                                  placeholder="https://yourwebsite.com/logo.png"
                                  value={companyProfile?.logoUrl || ''}
                                  disabled
                                />
                                <p className="text-xs text-muted-foreground">
                                  Edit this in the settings form below
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="primaryColor"
                                    placeholder="#FF5500"
                                    value={companyProfile?.primaryColor || ''}
                                    disabled
                                  />
                                  {companyProfile?.primaryColor && (
                                    <div 
                                      className="h-10 w-10 rounded-md border" 
                                      style={{ backgroundColor: companyProfile.primaryColor }}
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Edit this in the settings form below
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
                                <div className="flex gap-2">
                                  <Input
                                    id="secondaryColor"
                                    placeholder="#0055FF"
                                    value={companyProfile?.secondaryColor || ''}
                                    disabled
                                  />
                                  {companyProfile?.secondaryColor && (
                                    <div 
                                      className="h-10 w-10 rounded-md border" 
                                      style={{ backgroundColor: companyProfile.secondaryColor }}
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Edit this in the settings form below
                                </p>
                              </div>
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
                            
                            <div className="border-t pt-6 mt-8">
                              <h3 className="text-lg font-medium mb-4">Company Profile Settings</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Update your company details, branding and social media links here.
                                These settings will be synced with your brand information.
                              </p>
                              
                              {isLoadingProfile ? (
                                <div className="flex justify-center py-6">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              ) : (
                                <Form {...companyProfileForm}>
                                  <form onSubmit={companyProfileForm.handleSubmit(onCompanyProfileSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Basic Information */}
                                      <div className="space-y-6 md:col-span-2">
                                        <h4 className="text-base font-medium">Basic Information</h4>
                                        
                                        <FormField
                                          control={companyProfileForm.control}
                                          name="companyName"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Company Name*</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormDescription>
                                                The name of your company or brand
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={companyProfileForm.control}
                                          name="industry"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Industry</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormDescription>
                                                Your business industry or niche (e.g., Tech, Healthcare, Education)
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={companyProfileForm.control}
                                          name="description"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Company Description</FormLabel>
                                              <FormControl>
                                                <Textarea 
                                                  {...field} 
                                                  placeholder="Describe your business, mission, values, and target audience" 
                                                  className="min-h-32"
                                                />
                                              </FormControl>
                                              <FormDescription>
                                                This helps AI understand your company and create more relevant content
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      {/* Branding */}
                                      <div className="space-y-6 md:col-span-2">
                                        <h4 className="text-base font-medium">Branding</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="websiteUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Website URL</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://yourwebsite.com" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="logoUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Logo URL</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://yourwebsite.com/logo.png" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="primaryColor"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Primary Brand Color</FormLabel>
                                                <FormControl>
                                                  <div className="flex gap-2">
                                                    <Input {...field} placeholder="#FF5500" />
                                                    {field.value && (
                                                      <div 
                                                        className="h-10 w-10 rounded-md border" 
                                                        style={{ backgroundColor: field.value }}
                                                      />
                                                    )}
                                                  </div>
                                                </FormControl>
                                                <FormDescription>
                                                  Hexadecimal color code (#RRGGBB)
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="secondaryColor"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Secondary Brand Color</FormLabel>
                                                <FormControl>
                                                  <div className="flex gap-2">
                                                    <Input {...field} placeholder="#0055FF" />
                                                    {field.value && (
                                                      <div 
                                                        className="h-10 w-10 rounded-md border" 
                                                        style={{ backgroundColor: field.value }}
                                                      />
                                                    )}
                                                  </div>
                                                </FormControl>
                                                <FormDescription>
                                                  Hexadecimal color code (#RRGGBB)
                                                </FormDescription>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Social Media Links */}
                                      <div className="space-y-6 md:col-span-2">
                                        <h4 className="text-base font-medium">Social Media</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="facebookUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Facebook</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://facebook.com/yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="twitterUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Twitter</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://twitter.com/yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="instagramUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Instagram</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://instagram.com/yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="linkedinUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>LinkedIn</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://linkedin.com/company/yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="youtubeUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>YouTube</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://youtube.com/@yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={companyProfileForm.control}
                                            name="tiktokUrl"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>TikTok</FormLabel>
                                                <FormControl>
                                                  <Input {...field} placeholder="https://tiktok.com/@yourcompany" />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Additional Information */}
                                      <div className="space-y-6 md:col-span-2">
                                        <h4 className="text-base font-medium">Additional Information</h4>
                                        
                                        <FormField
                                          control={companyProfileForm.control}
                                          name="additionalInfo"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Additional Information</FormLabel>
                                              <FormControl>
                                                <Textarea 
                                                  {...field} 
                                                  placeholder="Add any additional information about your company that might help with content creation" 
                                                  className="min-h-32"
                                                />
                                              </FormControl>
                                              <FormDescription>
                                                Product details, tone of voice preferences, specific CTAs, or important brand guidelines
                                              </FormDescription>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>
                                    
                                    <Button 
                                      type="submit" 
                                      className="bg-primary hover:bg-primary-dark"
                                      disabled={companyProfileMutation.isPending}
                                    >
                                      {companyProfileMutation.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save Company Profile'
                                      )}
                                    </Button>
                                  </form>
                                </Form>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Brand Voice Tab */}
                        {brandTabActive === 'voice' && (
                          <div className="space-y-8">
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

                                <div 
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${voice.toneOfVoice === 'custom' ? 'border-primary bg-primary/5' : 'border-border'}`}
                                  onClick={() => setVoice({ ...voice, toneOfVoice: 'custom' })}
                                >
                                  <h3 className="font-medium mb-1">Custom Voice</h3>
                                  <p className="text-sm text-muted-foreground">Create and use your own personalized brand voices</p>
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
                            
                            {/* Custom Voice Manager (only shown when "Custom" tone is selected) */}
                            {voice.toneOfVoice === 'custom' && (
                              <div className="mt-8 border rounded-lg p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium">Custom Voice Manager</h3>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      const newCustomVoice: CustomVoice = {
                                        id: `voice-${Date.now()}`,
                                        name: "New Custom Voice",
                                        description: "Description of this voice's characteristics and use cases",
                                        formalityLevel: voice.formalityLevel,
                                        enthusiasmLevel: voice.enthusiasmLevel,
                                        creativityLevel: voice.creativityLevel,
                                        examples: "",
                                        isActive: false
                                      };
                                      
                                      setVoice({
                                        ...voice,
                                        customVoices: [...voice.customVoices, newCustomVoice]
                                      });
                                    }}
                                  >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create New Voice
                                  </Button>
                                </div>
                                
                                {voice.customVoices.length === 0 ? (
                                  <div className="text-center py-8 bg-muted/10">
                                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                                    <h4 className="font-medium mb-1">No custom voices yet</h4>
                                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                                      Create custom brand voices with unique personalities to use across different content types
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {voice.customVoices.map((customVoice) => (
                                      <div 
                                        key={customVoice.id} 
                                        className={`border rounded-lg p-4 ${customVoice.id === voice.activeCustomVoiceId ? 'border-primary' : ''}`}
                                      >
                                        <div className="flex justify-between items-start mb-4">
                                          <div className="space-y-2 flex-1 mr-4">
                                            <Label htmlFor={`voice-name-${customVoice.id}`}>Voice Name</Label>
                                            <Input
                                              id={`voice-name-${customVoice.id}`}
                                              value={customVoice.name}
                                              onChange={(e) => {
                                                const updatedVoices = voice.customVoices.map(v => 
                                                  v.id === customVoice.id 
                                                    ? { ...v, name: e.target.value } 
                                                    : v
                                                );
                                                setVoice({ ...voice, customVoices: updatedVoices });
                                              }}
                                            />
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const updatedVoices = voice.customVoices.map(v => 
                                                  v.id === customVoice.id 
                                                    ? { ...v, isActive: true } 
                                                    : { ...v, isActive: false }
                                                );
                                                setVoice({ 
                                                  ...voice, 
                                                  customVoices: updatedVoices,
                                                  activeCustomVoiceId: customVoice.id 
                                                });
                                              }}
                                            >
                                              {customVoice.id === voice.activeCustomVoiceId ? 'Active' : 'Set Active'}
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                              onClick={() => {
                                                const updatedVoices = voice.customVoices.filter(v => v.id !== customVoice.id);
                                                setVoice({ 
                                                  ...voice, 
                                                  customVoices: updatedVoices,
                                                  activeCustomVoiceId: updatedVoices.length > 0 && voice.activeCustomVoiceId === customVoice.id 
                                                    ? updatedVoices[0].id 
                                                    : voice.activeCustomVoiceId
                                                });
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <div className="space-y-2">
                                            <Label htmlFor={`voice-desc-${customVoice.id}`}>Description</Label>
                                            <Textarea
                                              id={`voice-desc-${customVoice.id}`}
                                              value={customVoice.description}
                                              onChange={(e) => {
                                                const updatedVoices = voice.customVoices.map(v => 
                                                  v.id === customVoice.id 
                                                    ? { ...v, description: e.target.value } 
                                                    : v
                                                );
                                                setVoice({ ...voice, customVoices: updatedVoices });
                                              }}
                                              placeholder="Describe the characteristics and use cases for this voice"
                                              className="min-h-[80px]"
                                            />
                                          </div>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <Label>Formality</Label>
                                                <span className="text-sm text-muted-foreground">{customVoice.formalityLevel}%</span>
                                              </div>
                                              <Slider
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[customVoice.formalityLevel]}
                                                onValueChange={(value) => {
                                                  const updatedVoices = voice.customVoices.map(v => 
                                                    v.id === customVoice.id 
                                                      ? { ...v, formalityLevel: value[0] } 
                                                      : v
                                                  );
                                                  setVoice({ ...voice, customVoices: updatedVoices });
                                                }}
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <Label>Enthusiasm</Label>
                                                <span className="text-sm text-muted-foreground">{customVoice.enthusiasmLevel}%</span>
                                              </div>
                                              <Slider
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[customVoice.enthusiasmLevel]}
                                                onValueChange={(value) => {
                                                  const updatedVoices = voice.customVoices.map(v => 
                                                    v.id === customVoice.id 
                                                      ? { ...v, enthusiasmLevel: value[0] } 
                                                      : v
                                                  );
                                                  setVoice({ ...voice, customVoices: updatedVoices });
                                                }}
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <Label>Creativity</Label>
                                                <span className="text-sm text-muted-foreground">{customVoice.creativityLevel}%</span>
                                              </div>
                                              <Slider
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[customVoice.creativityLevel]}
                                                onValueChange={(value) => {
                                                  const updatedVoices = voice.customVoices.map(v => 
                                                    v.id === customVoice.id 
                                                      ? { ...v, creativityLevel: value[0] } 
                                                      : v
                                                  );
                                                  setVoice({ ...voice, customVoices: updatedVoices });
                                                }}
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label htmlFor={`voice-examples-${customVoice.id}`}>Sample Writing (Optional)</Label>
                                            <Textarea
                                              id={`voice-examples-${customVoice.id}`}
                                              value={customVoice.examples}
                                              onChange={(e) => {
                                                const updatedVoices = voice.customVoices.map(v => 
                                                  v.id === customVoice.id 
                                                    ? { ...v, examples: e.target.value } 
                                                    : v
                                                );
                                                setVoice({ ...voice, customVoices: updatedVoices });
                                              }}
                                              placeholder="Add example text that showcases this voice style to help the AI understand it better"
                                              className="min-h-[120px]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
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
                          </div>
                        )}
                        
                        {/* Brand Story Tab */}
                        {brandTabActive === 'story' && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold">Story Sections</h3>
                              <Button 
                                onClick={handleAddStorySection}
                                variant="outline"
                                size="sm"
                                className="flex items-center"
                              >
                                <PlusCircle className="mr-1 h-4 w-4" />
                                Add Section
                              </Button>
                            </div>
                            
                            {story.sections.length === 0 ? (
                              <div className="text-center py-8 border rounded-lg bg-muted/10">
                                <Book className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                                <h3 className="font-medium mb-1">No story sections yet</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                                  Add sections to your brand story to help the AI understand your company's narrative and create more authentic content.
                                </p>
                                <Button variant="outline" size="sm" onClick={handleAddStorySection}>
                                  Add First Section
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {story.sections.map((section) => (
                                  <div key={section.id} className="border rounded-lg p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-2 flex-1 mr-4">
                                        <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                                        <Input
                                          id={`section-title-${section.id}`}
                                          value={section.title}
                                          onChange={(e) => handleUpdateStorySection(section.id, 'title', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                          onClick={() => handleRemoveStorySection(section.id)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor={`section-content-${section.id}`}>Content</Label>
                                      <Textarea
                                        id={`section-content-${section.id}`}
                                        value={section.content}
                                        onChange={(e) => handleUpdateStorySection(section.id, 'content', e.target.value)}
                                        className="min-h-[120px]"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor={`section-image-${section.id}`}>Image URL (Optional)</Label>
                                      <Input
                                        id={`section-image-${section.id}`}
                                        value={section.imageUrl || ''}
                                        onChange={(e) => handleUpdateStorySection(section.id, 'imageUrl', e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="pt-4 flex justify-end">
                              <InteractiveHover effect="pulse" intensity="medium">
                                <Button 
                                  onClick={handleSaveStory}
                                  className="bg-primary text-white hover:bg-primary/90"
                                  disabled={saveBrandSettingsMutation.isPending || story.sections.length === 0}
                                >
                                  {saveBrandSettingsMutation.isPending ? 'Saving...' : 'Save Story'}
                                </Button>
                              </InteractiveHover>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
