import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Calendar, Check, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Schema for auto-generation configuration
const autoContentSchema = z.object({
  enabled: z.boolean().default(false),
  postFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  topicCategories: z.array(z.string()).min(1, "Select at least one topic category"),
  contentTone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous']),
  includeImages: z.boolean().default(true),
  customNotes: z.string().optional(),
  defaultHashtags: z.string().optional(),
  bestTimeToPost: z.boolean().default(true),
  specificPostTime: z.string().optional(),
});

type AutoContentConfig = z.infer<typeof autoContentSchema>;

// Available platforms and categories
const availablePlatforms = [
  { id: 'blog', name: 'Blog' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'pinterest', name: 'Pinterest' },
];

const topicCategories = [
  { id: 'industry-news', name: 'Industry News' },
  { id: 'tips-tricks', name: 'Tips & Tricks' },
  { id: 'how-to', name: 'How-To Guides' },
  { id: 'product-updates', name: 'Product Updates' },
  { id: 'case-studies', name: 'Case Studies' },
  { id: 'testimonials', name: 'Customer Testimonials' },
  { id: 'event-announcements', name: 'Event Announcements' },
  { id: 'behind-the-scenes', name: 'Behind the Scenes' },
];

export function AutomaticContentConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  const isInfernoPlan = user?.plan === 'inferno';
  
  // Form definition
  const form = useForm<AutoContentConfig>({
    resolver: zodResolver(autoContentSchema),
    defaultValues: {
      enabled: false,
      postFrequency: 'weekly',
      platforms: ['blog'],
      topicCategories: ['industry-news'],
      contentTone: 'professional',
      includeImages: true,
      customNotes: '',
      defaultHashtags: '',
      bestTimeToPost: true,
      specificPostTime: '',
    },
  });
  
  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: AutoContentConfig) => {
      const response = await apiRequest('POST', '/api/auto-content/config', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-content/config'] });
      toast({
        title: "Configuration Saved",
        description: "Your automatic content generation settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message || "There was an error saving your settings.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: AutoContentConfig) {
    if (!isInfernoPlan) {
      setIsUpgradeOpen(true);
      return;
    }
    
    saveConfigMutation.mutate(values);
  }
  
  // If not on Inferno plan, show upgrade prompt
  if (!isInfernoPlan) {
    return (
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Automatic Content Generation</CardTitle>
                <CardDescription>Schedule AI-powered content creation on autopilot</CardDescription>
              </div>
              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                Inferno Feature
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Upgrade Required</h3>
                <p className="text-sm text-gray-500">
                  Automatic content generation is available exclusively on the Inferno plan.
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/subscription'}
                className="bg-primary hover:bg-primary-dark"
              >
                Upgrade Now
              </Button>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-medium mb-2">With automatic content, you can:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Set-and-forget content creation across multiple platforms</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Customize posting frequency and topic preferences</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Automatically optimize posting times for maximum engagement</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Include AI-generated images tailored to your content</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Inferno</DialogTitle>
              <DialogDescription>
                Automatic content generation is an Inferno plan premium feature.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center space-x-4 rounded-lg bg-amber-50 p-4 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <p className="text-amber-800 text-sm">
                  Your current plan does not include access to automatic content generation.
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Upgrade to the Inferno plan to unlock all premium features including:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Automatic content generation and scheduling</span>
                </li>
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Video content creation</span>
                </li>
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Unlimited fact-checking and references</span>
                </li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
                Not Now
              </Button>
              <Button onClick={() => window.location.href = '/subscription'} className="bg-primary">
                View Upgrade Options
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  // Full configuration form for Inferno plan users
  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automatic Content Generation</CardTitle>
              <CardDescription>Schedule AI-powered content creation on autopilot</CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
              Inferno Feature
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Enable Automatic Content</h3>
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            {field.value ? 'Active' : 'Inactive'}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="postFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posting Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often to generate and post new content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contentTone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Tone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The overall writing style for generated content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Content Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="platforms"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Target Platforms</FormLabel>
                          <FormDescription>
                            Select the platforms for automatic content posting
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {availablePlatforms.map((platform) => (
                            <FormField
                              key={platform.id}
                              control={form.control}
                              name="platforms"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={platform.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value?.includes(platform.id)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          const currentValue = field.value || [];
                                          field.onChange(
                                            checked
                                              ? [...currentValue, platform.id]
                                              : currentValue.filter((value) => value !== platform.id)
                                          );
                                        }}
                                        className="text-primary rounded focus:ring-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {platform.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="topicCategories"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Topic Categories</FormLabel>
                          <FormDescription>
                            Select the topics to focus on when generating content
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {topicCategories.map((category) => (
                            <FormField
                              key={category.id}
                              control={form.control}
                              name="topicCategories"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={category.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value?.includes(category.id)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          const currentValue = field.value || [];
                                          field.onChange(
                                            checked
                                              ? [...currentValue, category.id]
                                              : currentValue.filter((value) => value !== category.id)
                                          );
                                        }}
                                        className="text-primary rounded focus:ring-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {category.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="includeImages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Include AI-Generated Images
                          </FormLabel>
                          <FormDescription>
                            Automatically create relevant images for your content
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
                  
                  <FormField
                    control={form.control}
                    name="bestTimeToPost"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Optimize Posting Time
                          </FormLabel>
                          <FormDescription>
                            Use AI to determine the best time to post for engagement
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
                </div>
                
                {!form.watch('bestTimeToPost') && (
                  <FormField
                    control={form.control}
                    name="specificPostTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Posting Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            placeholder="Select a specific time"
                          />
                        </FormControl>
                        <FormDescription>
                          Set a specific time for all scheduled posts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="defaultHashtags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Hashtags</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="#yourbrand #marketing #contentstrategy"
                        />
                      </FormControl>
                      <FormDescription>
                        Common hashtags to include in your posts (space-separated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional instructions or notes for AI content generation..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide any specific guidelines or preferences for your auto-generated content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={saveConfigMutation.isPending}>
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}