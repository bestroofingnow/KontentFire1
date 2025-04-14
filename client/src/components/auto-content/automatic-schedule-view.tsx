import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Star, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types for scheduled content
interface AutoScheduledContent {
  id: number;
  title: string;
  platform: string;
  scheduledDate: string;
  status: 'pending' | 'published' | 'failed';
  contentType: 'text' | 'image' | 'both';
  imageUrl?: string;
  primaryText?: string;
  generationPrompt?: string;
  createdAt: string;
}

// Platform icons and colors
const platformConfig = {
  blog: { color: 'bg-slate-100 text-slate-700', label: 'Blog' },
  facebook: { color: 'bg-blue-100 text-blue-700', label: 'Facebook' },
  instagram: { color: 'bg-pink-100 text-pink-700', label: 'Instagram' },
  twitter: { color: 'bg-sky-100 text-sky-700', label: 'Twitter' },
  linkedin: { color: 'bg-blue-100 text-blue-700', label: 'LinkedIn' },
  youtube: { color: 'bg-red-100 text-red-700', label: 'YouTube' },
  tiktok: { color: 'bg-slate-100 text-slate-700', label: 'TikTok' },
  pinterest: { color: 'bg-red-100 text-red-700', label: 'Pinterest' },
};

// Format date for display
function formatScheduleDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    return 'Invalid date';
  }
}

// Component for rendering a scheduled content card
function ScheduledContentCard({ content }: { content: AutoScheduledContent }) {
  const platform = platformConfig[content.platform as keyof typeof platformConfig] || 
    { color: 'bg-gray-100 text-gray-700', label: content.platform };
  
  // Status badge
  const getStatusBadge = () => {
    switch (content.status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Published</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{content.title}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className={platform.color}>
                {platform.label}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Content</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel Schedule</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {content.contentType !== 'text' && content.imageUrl && (
            <div className="w-full md:w-1/4">
              <div className="aspect-square rounded-md bg-gray-100 relative overflow-hidden">
                <img src={content.imageUrl} alt={content.title} className="object-cover w-full h-full" />
              </div>
            </div>
          )}
          <div className={content.imageUrl ? "w-full md:w-3/4" : "w-full"}>
            {content.primaryText && (
              <div className="text-sm text-gray-700 line-clamp-3 mb-3">
                {content.primaryText}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Scheduled for: {formatScheduleDate(content.scheduledDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>Created: {formatScheduleDate(content.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Calendar className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No scheduled content</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{message}</p>
    </div>
  );
}

// Main component for automatic scheduling view
export function AutomaticScheduleView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const isInfernoPlan = user?.plan === 'inferno';
  
  // Query for upcoming auto-scheduled content
  const { data: upcomingContent, isLoading: upcomingLoading } = useQuery<AutoScheduledContent[]>({
    queryKey: ['/api/auto-content/schedules/upcoming'],
    queryFn: async () => {
      if (!isInfernoPlan) return [];
      const response = await fetch('/api/auto-content/schedules/upcoming');
      if (!response.ok) throw new Error('Failed to fetch upcoming scheduled content');
      return response.json();
    },
    enabled: isInfernoPlan,
  });
  
  // Query for history of auto-generated content
  const { data: contentHistory, isLoading: historyLoading } = useQuery<AutoScheduledContent[]>({
    queryKey: ['/api/auto-content/schedules/history'],
    queryFn: async () => {
      if (!isInfernoPlan) return [];
      const response = await fetch('/api/auto-content/schedules/history');
      if (!response.ok) throw new Error('Failed to fetch content history');
      return response.json();
    },
    enabled: isInfernoPlan && activeTab === "history",
  });
  
  if (!isInfernoPlan) {
    return (
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Automatic Content Schedule</CardTitle>
            <CardDescription>View your upcoming AI-generated content posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="rounded-full bg-gray-100 p-4 inline-flex mb-4">
                  <Star className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Inferno Plan Feature</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  Automatic content generation and scheduling is available exclusively 
                  on the Inferno plan.
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
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Automatic Content Schedule</CardTitle>
          <CardDescription>View and manage your AI-generated content</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {upcomingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-gray-500">Loading scheduled content...</p>
                  </div>
                </div>
              ) : upcomingContent && upcomingContent.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Upcoming Schedule</h3>
                    <Badge className="bg-green-100 text-green-700">
                      {upcomingContent.length} Scheduled
                    </Badge>
                  </div>
                  
                  {upcomingContent.map((content) => (
                    <ScheduledContentCard key={content.id} content={content} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="Your automatic content generation is active, but there are no posts currently scheduled. 
                  New content will appear here based on your frequency settings." 
                />
              )}
            </TabsContent>
            
            <TabsContent value="history">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-gray-500">Loading content history...</p>
                  </div>
                </div>
              ) : contentHistory && contentHistory.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Published History</h3>
                    <div className="flex space-x-2">
                      <Badge className="bg-green-100 text-green-700">
                        {contentHistory.filter(c => c.status === 'published').length} Published
                      </Badge>
                      <Badge className="bg-red-100 text-red-700">
                        {contentHistory.filter(c => c.status === 'failed').length} Failed
                      </Badge>
                    </div>
                  </div>
                  
                  {contentHistory.map((content) => (
                    <ScheduledContentCard key={content.id} content={content} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="No historical data yet. Past published and failed content will appear here once your automatic content system starts generating posts." 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}