import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Social platforms
const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "pinterest", label: "Pinterest" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "Blog" },
];

// Topic categories
const topicCategories = [
  { value: "industry_news", label: "Industry News" },
  { value: "tips_and_tricks", label: "Tips & Tricks" },
  { value: "case_studies", label: "Case Studies" },
  { value: "behind_the_scenes", label: "Behind the Scenes" },
  { value: "product_updates", label: "Product Updates" },
  { value: "customer_stories", label: "Customer Stories" },
  { value: "trending_topics", label: "Trending Topics" },
  { value: "how_to_guides", label: "How-to Guides" },
  { value: "faqs", label: "FAQs" },
  { value: "thought_leadership", label: "Thought Leadership" },
];

// Posting frequencies
const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

// Content tones
const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "humorous", label: "Humorous" },
];

// Schema for form validation
const autoContentSchema = z.object({
  enabled: z.boolean().default(false),
  postFrequency: z.enum(["daily", "weekly", "bi-weekly", "monthly"]).default("weekly"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  topicCategories: z.array(z.string()).min(1, "Select at least one topic category"),
  contentTone: z.enum(["professional", "casual", "friendly", "authoritative", "humorous"]).default("professional"),
  includeImages: z.boolean().default(true),
  animateImages: z.boolean().default(false),
  animationStyle: z.enum(["zoom", "pan", "rotate", "bounce", "default"]).default("default"),
  customNotes: z.string().optional(),
  defaultHashtags: z.string().optional(),
  bestTimeToPost: z.boolean().default(true),
  specificPostTime: z.string().optional(),
});

type AutoContentConfig = z.infer<typeof autoContentSchema>;

export function AutomaticContentConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  
  const isInfernoPlan = user?.plan === 'inferno';
  
  // Form setup
  const form = useForm<AutoContentConfig>({
    resolver: zodResolver(autoContentSchema),
    defaultValues: {
      enabled: false,
      postFrequency: "weekly",
      platforms: [],
      topicCategories: [],
      contentTone: "professional",
      includeImages: true,
      animateImages: false,
      animationStyle: "default",
      customNotes: "",
      defaultHashtags: "",
      bestTimeToPost: true,
      specificPostTime: "",
    },
  });
  
  // Query for existing configuration
  const { data: config, isLoading } = useQuery<AutoContentConfig>({
    queryKey: ['/api/auto-content/config'],
    enabled: isInfernoPlan,
    queryFn: async () => {
      if (!isInfernoPlan) return undefined;
      const response = await fetch('/api/auto-content/config');
      if (!response.ok) {
        if (response.status === 404) {
          return undefined;
        }
        throw new Error('Failed to fetch auto content configuration');
      }
      return response.json();
    },
  });
  
  // Set form values when config is loaded
  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        postFrequency: config.postFrequency,
        platforms: config.platforms,
        topicCategories: config.topicCategories,
        contentTone: config.contentTone,
        includeImages: config.includeImages,
        animateImages: config.animateImages ?? false,
        animationStyle: config.animationStyle ?? "default",
        customNotes: config.customNotes || "",
        defaultHashtags: config.defaultHashtags || "",
        bestTimeToPost: config.bestTimeToPost,
        specificPostTime: config.specificPostTime || "",
      });
    }
  }, [config, form]);
  
  // Mutation for saving configuration
  const mutation = useMutation({
    mutationFn: async (data: AutoContentConfig) => {
      if (!isInfernoPlan) {
        setShowUpgradeAlert(true);
        return null;
      }
      
      const response = await apiRequest(
        config ? "PUT" : "POST", 
        '/api/auto-content/config',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-content/config'] });
      toast({
        title: "Configuration Saved",
        description: "Your automatic content settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: AutoContentConfig) {
    mutation.mutate(values);
  }
  
  // Display upgrade notice for non-Inferno plan users
  if (!isInfernoPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automatic Content Configuration</CardTitle>
          <CardDescription>Configure your AI-powered content generation settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="rounded-full bg-gray-100 p-4 inline-flex mb-4">
                <Star className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Inferno Plan Feature</h3>
              <p className="text-gray-500 max-w-md mb-6">
                Automatic content generation is available exclusively 
                on the Inferno plan. Upgrade to automate your content creation.
              </p>
              <Button 
                className="bg-primary hover:bg-primary-dark"
                onClick={() => window.location.href = '/subscription'}
              >
                Upgrade to Inferno
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automatic Content Configuration</CardTitle>
          <CardDescription>Configure your AI-powered content generation settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Automatic Content Configuration</CardTitle>
            <CardDescription>Configure your AI-powered content generation settings</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Inferno Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {showUpgradeAlert && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Subscription Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              This feature is only available on the Inferno plan. Please upgrade your subscription to access automatic content generation.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Enable/Disable Toggle */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Automatic Content Generation</FormLabel>
                    <FormDescription>
                      Enable or disable AI-powered content creation
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Frequency Selection */}
            <FormField
              control={form.control}
              name="postFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posting Frequency</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencies.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>
                          {frequency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often should new content be generated
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Platforms Selection */}
            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Platforms</FormLabel>
                    <FormDescription>
                      Select the platforms where content will be posted
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {platforms.map((platform) => (
                      <FormField
                        key={platform.value}
                        control={form.control}
                        name="platforms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={platform.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, platform.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== platform.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {platform.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Topic Categories */}
            <FormField
              control={form.control}
              name="topicCategories"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Content Topics</FormLabel>
                    <FormDescription>
                      Select the types of content to be generated
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {topicCategories.map((category) => (
                      <FormField
                        key={category.value}
                        control={form.control}
                        name="topicCategories"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={category.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, category.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== category.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {category.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Content Tone */}
            <FormField
              control={form.control}
              name="contentTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Tone</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tones.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The writing style and personality for your content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Include Images */}
            <FormField
              control={form.control}
              name="includeImages"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Include Images</FormLabel>
                    <FormDescription>
                      Generate AI images for your content when applicable
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Post Timing */}
            <FormField
              control={form.control}
              name="bestTimeToPost"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Optimal Posting Time</FormLabel>
                    <FormDescription>
                      Let AI determine the best time to post for each platform
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Specific Post Time (shown only when best time is disabled) */}
            {!form.watch("bestTimeToPost") && (
              <FormField
                control={form.control}
                name="specificPostTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Post Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>
                      Set a specific time of day to publish content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Default Hashtags */}
            <FormField
              control={form.control}
              name="defaultHashtags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Hashtags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="#brandname #industry #keyword" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional hashtags to include in all posts (space separated)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Custom Notes */}
            <FormField
              control={form.control}
              name="customNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add special instructions for AI content generation..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional guidance for the AI when creating your content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark w-full md:w-auto"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}