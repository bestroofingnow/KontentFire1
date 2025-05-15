import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton,
  SkeletonStat,
  SkeletonWithShimmer 
} from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calendar, ChevronRight, Globe, FileText, Upload, LineChart, Target, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import InteractiveHover from "../ui/interactive-hover";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Types for User Insights
interface UserInsights {
  nextScheduledContent?: {
    id: number;
    title: string;
    scheduledFor: string;
    platform: string;
  } | null;
  contentSummary: {
    totalContent: number;
    publishedContent: number;
    scheduledContent: number;
    draftContent: number;
  };
  engagement: {
    total: number;
    trend: number;
    lastUpdated: string;
  };
  recentActivity: {
    type: string;
    title: string;
    timestamp: string;
  }[];
  goals: {
    current: number;
    target: number;
    label: string;
  }[];
  suggestions: {
    title: string;
    description: string;
    action: string;
    link: string;
  }[];
}

export default function WelcomeScreen() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [autoFillModalOpen, setAutoFillModalOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("website");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch user insights
  const { data: insights, isLoading } = useQuery<UserInsights>({
    queryKey: ['/api/user/insights'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/insights', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user insights');
        }
        
        return response.json();
      } catch (error) {
        // If the API doesn't exist yet, return mock data for development
        console.warn('Using fallback insights data');
        return {
          contentSummary: {
            totalContent: 24,
            publishedContent: 18,
            scheduledContent: 3,
            draftContent: 3
          },
          nextScheduledContent: {
            id: 1,
            title: "10 Industry Trends to Watch",
            scheduledFor: new Date().toISOString(),
            platform: "LinkedIn"
          },
          engagement: {
            total: 1250,
            trend: 15,
            lastUpdated: new Date().toISOString()
          },
          recentActivity: [
            {
              type: "content_created",
              title: "Email Newsletter: May Edition",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
            },
            {
              type: "content_published",
              title: "How to Improve Your Marketing ROI",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
            }
          ],
          goals: [
            {
              label: "Weekly Content",
              current: 3,
              target: 5
            },
            {
              label: "Monthly Engagement",
              current: 1250,
              target: 2000
            }
          ],
          suggestions: [
            {
              title: "Complete Your Brand Profile",
              description: "Add your brand voice and story to improve AI-generated content",
              action: "Update Brand Settings",
              link: "/brand-settings"
            },
            {
              title: "Set Up Auto-Posting",
              description: "Configure automatic posting to social media platforms",
              action: "Configure Auto-Posting",
              link: "/auto-posting-setup"
            }
          ]
        };
      }
    }
  });



  // Mutation for auto-filling company information from website
  const autoFillFromWebsiteMutation = useMutation({
    mutationFn: async (url: string) => {
      return apiRequest('POST', '/api/company-profile/auto-fill/website', { url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/brand-settings'] });
      setAutoFillModalOpen(false);
      setIsProcessing(false);
      setWebsiteUrl("");
      toast({
        title: "Company information extracted!",
        description: "Your company profile and brand settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to auto-fill from website:", error);
      setIsProcessing(false);
      toast({
        title: "Failed to extract information",
        description: error?.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for auto-filling company information from document
  const autoFillFromDocumentMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest('POST', '/api/company-profile/auto-fill/document', { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/brand-settings'] });
      setAutoFillModalOpen(false);
      setIsProcessing(false);
      setDocumentText("");
      toast({
        title: "Company information extracted!",
        description: "Your company profile and brand settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to auto-fill from document:", error);
      setIsProcessing(false);
      toast({
        title: "Failed to extract information",
        description: error?.message || "Please check the document text and try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for auto-filling company information from PDF file
  const autoFillFromPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdfFile', file);
      
      // We need to use fetch directly here because apiRequest doesn't support FormData
      const response = await fetch('/api/company-profile/auto-fill/pdf', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process PDF file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/brand-settings'] });
      setAutoFillModalOpen(false);
      setIsProcessing(false);
      setPdfFile(null);
      toast({
        title: "Company information extracted!",
        description: "Your company profile and brand settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to auto-fill from PDF:", error);
      setIsProcessing(false);
      toast({
        title: "Failed to extract information from PDF",
        description: error?.message || "Please check the PDF file and try again.",
        variant: "destructive",
      });
    }
  });

  // Handle auto-fill submission
  const handleAutoFillSubmit = () => {
    // Validate inputs before submitting
    if (activeTab === "website") {
      if (!websiteUrl.trim()) {
        toast({
          title: "Website URL required",
          description: "Please enter a valid website URL.",
          variant: "destructive",
        });
        return;
      }

      // Basic URL validation - make sure it at least contains a domain
      const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[^\s]*)?$/;
      if (!urlPattern.test(websiteUrl)) {
        toast({
          title: "Invalid website URL",
          description: "Please enter a valid website URL (e.g., 'example.com' or 'https://example.com').",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      autoFillFromWebsiteMutation.mutate(websiteUrl);
    } else if (activeTab === "document") {
      if (!documentText.trim() || documentText.length < 50) {
        toast({
          title: "Document text too short",
          description: "Please provide more detailed document text (at least 50 characters).",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      autoFillFromDocumentMutation.mutate(documentText);
    } else if (activeTab === "pdf") {
      if (!pdfFile) {
        toast({
          title: "PDF file required",
          description: "Please upload a PDF file with company information.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!pdfFile.type.includes('pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (pdfFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "PDF file must be smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      autoFillFromPdfMutation.mutate(pdfFile);
    }
  };

  // Set time of day greeting and current date
  useEffect(() => {
    const setGreeting = () => {
      const hour = new Date().getHours();
      let greeting = "";
      
      if (hour < 12) {
        greeting = "Good morning";
      } else if (hour < 18) {
        greeting = "Good afternoon";
      } else {
        greeting = "Good evening";
      }
      
      setTimeOfDay(greeting);
      setCurrentDate(format(new Date(), "EEEE, MMMM do, yyyy"));
    };
    
    setGreeting();
    const interval = setInterval(setGreeting, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <WelcomeScreenSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {timeOfDay}, {user?.username || "there"}!
            </h1>
            <p className="text-muted-foreground">
              {currentDate} • Here's what's happening with your content
            </p>
          </div>
          <Dialog open={autoFillModalOpen} onOpenChange={setAutoFillModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex gap-2 items-center">
                <Globe className="h-4 w-4" />
                <span>Auto-Fill Company Info</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Auto-Fill Company Information</DialogTitle>
                <DialogDescription>
                  Let AI analyze your website or company document to auto-fill your company information and brand settings.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="website" value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </TabsTrigger>
                  <TabsTrigger value="document" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Document</span>
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>PDF</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="website" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="website-url">Company Website URL</Label>
                    <Input
                      id="website-url"
                      placeholder="https://www.yourcompany.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your company website URL to extract information automatically.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="document" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-text">Company Document Text</Label>
                    <Textarea
                      id="document-text"
                      placeholder="Paste your company information here..."
                      className="min-h-[150px]"
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Paste text from your company documents, brochures, or about page.
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="pdf" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdf-file">Company PDF Document</Label>
                    <div 
                      className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 flex flex-col items-center justify-center transition-colors hover:bg-secondary/10"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-primary');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-primary');
                        
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.includes('pdf')) {
                            setPdfFile(file);
                          } else {
                            toast({
                              title: "Invalid file type",
                              description: "Please upload a PDF file only.",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    >
                      {pdfFile ? (
                        <div className="text-center">
                          <p className="font-medium mb-2">{pdfFile.name}</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            {(pdfFile.size / 1024).toFixed(1)} KB
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPdfFile(null)}
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag & drop your PDF file here, or click to browse
                          </p>
                          <Input
                            id="pdf-file"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPdfFile(file);
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('pdf-file')?.click()}
                          >
                            Browse Files
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a PDF file with company information such as a brochure, whitepaper, or info sheet.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setAutoFillModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAutoFillSubmit} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Auto-Fill Data
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Stats Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
            <CardDescription>
              Summary of your content creation activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Content</span>
                <span className="text-2xl font-bold">{insights?.contentSummary.totalContent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Published</span>
                <span className="text-2xl font-bold">{insights?.contentSummary.publishedContent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Scheduled</span>
                <span className="text-2xl font-bold">{insights?.contentSummary.scheduledContent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Drafts</span>
                <span className="text-2xl font-bold">{insights?.contentSummary.draftContent}</span>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div>
              <h3 className="font-medium mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {insights?.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      activity.type === "content_created" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                    )}>
                      {activity.type === "content_created" ? 
                        <PenIcon className="h-4 w-4" /> : 
                        <Calendar className="h-4 w-4" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {activity.type === "content_created" ? "Created" : "Published"} {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Next Scheduled Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Coming Up Next</CardTitle>
          </CardHeader>
          <CardContent>
            {insights?.nextScheduledContent ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(insights.nextScheduledContent.scheduledFor), "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{insights.nextScheduledContent.title}</h3>
                <Badge variant="outline" className="bg-primary/10">
                  {insights.nextScheduledContent.platform}
                </Badge>
                <div className="mt-4">
                  <Button variant="secondary" size="sm" className="w-full">
                    View Schedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No upcoming content</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule your next post to see it here
                </p>
                <Button variant="outline" size="sm">
                  Schedule Content
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Toward Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.goals.map((goal, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm font-medium">{goal.label}</span>
                    </div>
                    <span className="text-sm">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <Progress 
                    value={(goal.current / goal.target) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button variant="outline" size="sm" className="w-full">
                Update Goals
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Engagement Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md">Engagement</CardTitle>
              <Badge variant="outline" className={cn(
                "flex items-center gap-1",
                insights?.engagement.trend && insights.engagement.trend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {insights?.engagement.trend && insights.engagement.trend > 0 ? <TrendingUp className="h-3 w-3" /> : null}
                {insights?.engagement.trend}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold">{insights?.engagement.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total engagement across platforms</div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Last updated: {insights?.engagement.lastUpdated ? format(new Date(insights.engagement.lastUpdated), "MMM dd, yyyy") : ""}
            </div>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="w-full flex items-center justify-center">
                <LineChart className="h-4 w-4 mr-1" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Suggested Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Suggested Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights?.suggestions.map((suggestion, index) => (
                <InteractiveHover key={index} effect="scale" intensity="medium">
                  <div className="flex items-start gap-3 border rounded-lg p-3 transition-colors hover:border-primary cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={suggestion.link} className="flex items-center gap-1">
                        {suggestion.action}
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </InteractiveHover>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading skeleton
function WelcomeScreenSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonWithShimmer className="mb-6">
        <SkeletonText className="h-10 w-64 mb-2" />
        <SkeletonText className="h-5 w-80" />
      </SkeletonWithShimmer>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonWithShimmer className="md:col-span-2">
          <Card className="h-[300px]">
            <CardHeader>
              <SkeletonText className="h-6 w-48 mb-1" />
              <SkeletonText className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonStat key={i} />
                ))}
              </div>
              <SkeletonText className="h-5 w-36 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonAvatar className="w-10 h-10" />
                    <div className="flex-1">
                      <SkeletonText className="h-4 w-full max-w-[250px] mb-2" />
                      <SkeletonText className="h-3 w-40" />
                    </div>
                    <SkeletonButton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </SkeletonWithShimmer>
        
        <SkeletonWithShimmer>
          <Card className="h-[300px]">
            <CardHeader>
              <SkeletonText className="h-6 w-40 mb-1" />
              <SkeletonText className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <SkeletonText className="h-4 w-full" />
                <SkeletonText className="h-4 w-5/6" />
                <SkeletonText className="h-4 w-4/5" />
              </div>
              <div className="flex justify-between items-center pt-3">
                <SkeletonButton className="h-9 w-28" />
                <SkeletonAvatar className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        </SkeletonWithShimmer>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonWithShimmer key={i}>
            <Card className="h-[250px]">
              <CardHeader>
                <SkeletonText className="h-6 w-40 mb-1" />
                <SkeletonText className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[120px] flex items-center justify-center">
                  <SkeletonText className="h-20 w-full rounded-md" />
                </div>
                <div className="flex justify-between">
                  <SkeletonButton className="h-9 w-24" />
                  <SkeletonButton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          </SkeletonWithShimmer>
        ))}
      </div>
    </div>
  );
}

// Pen icon component
function PenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

// Format relative time from ISO string
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  return format(date, 'MMM dd, yyyy');
}