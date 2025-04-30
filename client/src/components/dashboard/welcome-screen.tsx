import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calendar, ChevronRight, LineChart, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import InteractiveHover from "../ui/interactive-hover";
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
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  
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
        <h1 className="text-3xl font-bold mb-1">
          {timeOfDay}, {user?.username || "there"}!
        </h1>
        <p className="text-muted-foreground">
          {currentDate} • Here's what's happening with your content
        </p>
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
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
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