import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Content } from "@shared/schema";
import ContentItem from "./content-item";
import { useToast } from "@/hooks/use-toast";
import { SkeletonText, SkeletonWithShimmer } from "@/components/ui/skeleton-loader";

export default function RecentlyCreated({ limit = 2 }) {
  const { toast } = useToast();
  const [recentContents, setRecentContents] = useState<Content[]>([]);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/contents'],
    queryFn: async () => {
      const response = await fetch(`/api/contents?limit=${limit}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent contents');
      }
      
      return response.json();
    }
  });
  
  useEffect(() => {
    if (data) {
      setRecentContents(data);
    }
  }, [data]);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load recent content",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleSchedule = (content: Content) => {
    // Implement schedule functionality
    console.log('Schedule content', content.id);
  };
  
  const handleEdit = (content: Content) => {
    // Implement edit functionality
    console.log('Edit content', content.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-dark px-6 py-4 flex justify-between items-center">
        <h2 className="text-white font-semibold font-display">Recently Created</h2>
        <button className="text-gray-300 hover:text-white">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-5">
            {[...Array(limit)].map((_, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <SkeletonWithShimmer className="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <SkeletonText className="w-28 h-4 mb-1" />
                    <SkeletonText className="w-20 h-3" />
                  </div>
                </div>
                <SkeletonText className="w-3/4 h-4 mb-2" />
                <SkeletonText className="w-full h-20 mb-3" />
                <div className="flex justify-between mt-2">
                  <SkeletonText className="w-16 h-8" />
                  <SkeletonText className="w-16 h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : recentContents && recentContents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentContents.map(content => (
              <ContentItem 
                key={content.id} 
                content={content} 
                onSchedule={handleSchedule} 
                onEdit={handleEdit} 
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-gray-500">No content created yet</p>
          </div>
        )}
        
        <Button variant="link" className="mt-4 w-full text-center py-2 text-primary hover:text-primary-dark font-medium text-sm">
          View All Created Content
        </Button>
      </div>
    </div>
  );
}
