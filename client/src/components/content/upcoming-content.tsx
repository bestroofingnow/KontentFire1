import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export type ScheduleWithContent = {
  id: number;
  contentId: number;
  platform: string;
  scheduledDate: string;
  published: boolean;
  publishedDate: string | null;
  engagementMetrics: string | null;
  content: {
    id: number;
    title: string;
    textContent: string | null;
    imageUrl: string | null;
    contentType: string;
    status: string;
  };
};

export default function UpcomingContent({ limit = 3 }) {
  const { toast } = useToast();
  const [upcomingSchedules, setUpcomingSchedules] = useState<ScheduleWithContent[]>([]);
  const errorShown = useRef(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/schedules/upcoming'],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/upcoming?limit=${limit}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming content');
      }
      
      return response.json();
    }
  });
  
  useEffect(() => {
    if (data) {
      setUpcomingSchedules(data);
    }
  }, [data]);
  
  // Handle error in separate useEffect to avoid infinite loops
  useEffect(() => {
    if (error && !errorShown.current) {
      errorShown.current = true;
      toast({
        title: "Error",
        description: "Failed to load upcoming content",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleEdit = (scheduleId: number) => {
    // Implement edit functionality
    console.log('Edit schedule', scheduleId);
  };

  const getPlatformBadgeClass = (platform: string) => {
    const classes = {
      'blog': 'bg-primary',
      'facebook': 'bg-blue-600',
      'instagram': 'bg-pink-500',
      'twitter': 'bg-sky-500',
      'linkedin': 'bg-blue-500',
      'youtube': 'bg-red-600',
      'tiktok': 'bg-black',
      'pinterest': 'bg-red-500',
    };
    
    return classes[platform as keyof typeof classes] || 'bg-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-dark px-6 py-4 flex justify-between items-center">
        <h2 className="text-white font-semibold font-display">Upcoming Content</h2>
        <button className="text-gray-300 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading upcoming content...</p>
          </div>
        ) : upcomingSchedules && upcomingSchedules.length > 0 ? (
          <div className="space-y-4">
            {upcomingSchedules.map((schedule) => {
              const scheduledDate = new Date(schedule.scheduledDate);
              return (
                <div key={schedule.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100">
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-xs text-gray-500 uppercase">
                        {format(scheduledDate, 'MMM')}
                      </div>
                      <div className="font-bold text-dark">
                        {format(scheduledDate, 'd')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-dark truncate">{schedule.content.title}</h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-white text-xs px-2 py-0.5 rounded ${getPlatformBadgeClass(schedule.platform)}`}>
                        {schedule.platform.charAt(0).toUpperCase() + schedule.platform.slice(1)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        Scheduled • {format(scheduledDate, 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="text-gray-400 hover:text-primary p-1 h-auto"
                    onClick={() => handleEdit(schedule.id)}
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500">No upcoming content scheduled</p>
          </div>
        )}
        
        <Button variant="link" className="mt-4 w-full text-center py-2 text-primary hover:text-primary-dark font-medium text-sm">
          View All Scheduled Content
        </Button>
      </div>
    </div>
  );
}
