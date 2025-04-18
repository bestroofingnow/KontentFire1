import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Content } from "@shared/schema";
import ContentItem from "./content-item";
import { useToast } from "@/hooks/use-toast";

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
          <div className="py-10 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading recent content...</p>
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
