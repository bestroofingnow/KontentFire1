import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PlatformLimit {
  platform: string;
  currentCount: number;
  limit: number;
  remaining: number;
  canPost: boolean;
}

interface PostingLimitsSummary {
  date: string;
  platforms: PlatformLimit[];
  message?: string;
}

export function DailyLimitsDisplay() {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery<PostingLimitsSummary>({
    queryKey: ['/api/posting-limits/summary'],
    enabled: user?.plan === 'inferno',
    refetchInterval: 60000, // Refresh every minute
  });

  // Only show for Inferno plan users
  if (user?.plan !== 'inferno') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Daily Posting Limits
          </CardTitle>
          <CardDescription>Loading your current posting status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.platforms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Daily Posting Limits
          </CardTitle>
          <CardDescription>
            {summary?.message || "No posting activity today"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusIcon = (platform: PlatformLimit) => {
    if (platform.remaining === 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (platform.remaining <= 2) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (platform: PlatformLimit) => {
    if (platform.remaining === 0) {
      return "destructive";
    } else if (platform.remaining <= 2) {
      return "secondary";
    } else {
      return "default";
    }
  };

  const formatPlatformName = (platform: string) => {
    const platformNames: Record<string, string> = {
      blog: "Blog Posts",
      facebook: "Facebook",
      linkedin: "LinkedIn",
      instagram: "Instagram",
      twitter: "Twitter",
      pinterest: "Pinterest",
      youtube: "YouTube",
      tiktok: "TikTok"
    };
    return platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  // Only show platforms that have been used or have specific limits
  const activePlatforms = summary.platforms.filter(p => p.currentCount > 0 || p.limit < 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Daily Posting Limits
        </CardTitle>
        <CardDescription>
          Your current posting activity for {new Date(summary.date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activePlatforms.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No posting activity today. Ready to create some content!
          </div>
        ) : (
          activePlatforms.map((platform) => (
            <div key={platform.platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(platform)}
                  <span className="font-medium">{formatPlatformName(platform.platform)}</span>
                </div>
                <Badge variant={getStatusColor(platform)}>
                  {platform.currentCount}/{platform.limit}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={(platform.currentCount / platform.limit) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{platform.currentCount} posts today</span>
                  <span>{platform.remaining} remaining</span>
                </div>
              </div>
              
              {platform.remaining === 0 && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Daily limit reached. Reset at midnight.
                </div>
              )}
              
              {platform.remaining <= 2 && platform.remaining > 0 && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  Approaching daily limit ({platform.remaining} posts remaining)
                </div>
              )}
            </div>
          ))
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-medium text-blue-900 mb-1">
            Inferno Plan Limits (Best Practices)
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• Blog posts: Maximum 6 per day</div>
            <div>• Social media: Maximum 12 posts per platform per day</div>
            <div>• Limits reset daily at midnight</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}