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
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyProfile } from "@shared/schema";

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
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal('')),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal('')),
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
      companyName: "",
      industry: "",
      description: "",
      websiteUrl: "",
      logoUrl: "",
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
        companyName: companyProfile.companyName || "",
        industry: companyProfile.industry || "",
        description: companyProfile.description || "",
        websiteUrl: companyProfile.websiteUrl || "",
        logoUrl: companyProfile.logoUrl || "",
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
                <TabsTrigger value="company">Company</TabsTrigger>
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
              
              {/* Company Profile Tab */}
              <TabsContent value="company">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>
                      Set up your company profile to help AI create better content with your branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                              <h3 className="text-lg font-medium">Basic Information</h3>
                              
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
                              <h3 className="text-lg font-medium">Branding</h3>
                              
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
                              <h3 className="text-lg font-medium">Social Media</h3>
                              
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
                              <h3 className="text-lg font-medium">Additional Information</h3>
                              
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
