import { useState, useEffect } from "react";
import { Content } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  Calendar, 
  ArrowRight, 
  Edit, 
  Share, 
  ExternalLink,
  BarChart, 
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentPreviewSliderProps = {
  title?: string;
  description?: string;
  contentType?: string;
  limit?: number;
  className?: string;
  onSchedule?: (content: Content) => void;
  onEdit?: (content: Content) => void;
};

export function ContentPreviewSlider({
  title = "Recent Content",
  description,
  contentType = "all",
  limit = 5,
  className,
  onSchedule,
  onEdit
}: ContentPreviewSliderProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch content
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/contents', contentType], 
    queryFn: async () => {
      const response = await fetch(`/api/contents?limit=${limit}&type=${contentType}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contents');
      }
      
      return response.json();
    }
  });
  
  const contents = data?.contents || [];
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load content previews",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const getContentTypeStyle = (type: string) => {
    const styles = {
      'article': 'bg-blue-500',
      'social': 'bg-green-500',
      'video': 'bg-red-500',
      'newsletter': 'bg-purple-500',
    };
    
    return styles[type as keyof typeof styles] || 'bg-gray-500';
  };
  
  const getPlatformStyle = (platform: string) => {
    const styles = {
      'blog': 'bg-primary',
      'facebook': 'bg-blue-600',
      'instagram': 'bg-pink-500',
      'twitter': 'bg-sky-500',
      'linkedin': 'bg-blue-500',
      'youtube': 'bg-red-600',
      'tiktok': 'bg-black',
      'pinterest': 'bg-red-500',
    };
    
    return styles[platform as keyof typeof styles] || 'bg-gray-500';
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm overflow-hidden", className)}>
      <div className="bg-dark px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-white font-semibold font-display">{title}</h2>
          {description && <p className="text-gray-300 text-sm mt-1">{description}</p>}
        </div>
        {contents.length > 0 && (
          <div className="text-sm text-gray-300">
            <span className="font-medium">{currentIndex + 1}</span> / {contents.length}
          </div>
        )}
      </div>
      
      <div className="p-0">
        {isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-gray-500">Loading content previews...</p>
          </div>
        ) : contents.length > 0 ? (
          <Carousel 
            className="w-full" 
            onSelect={() => {}}
            setApi={(api) => {
              api?.on('select', () => {
                setCurrentIndex(api.selectedScrollSnap());
              });
            }}
          >
            <CarouselContent>
              {contents.map((content: Content) => (
                <CarouselItem key={content.id}>
                  <div className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[800px]" : "max-h-[400px]"
                  )}>
                    {/* Header with metadata */}
                    <div className="px-6 pt-6 pb-3 flex justify-between">
                      <div className="flex space-x-2">
                        <Badge className={cn(
                          getContentTypeStyle(content.contentType)
                        )}>
                          {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)}
                        </Badge>
                        {content.platform && (
                          <Badge className={cn(
                            getPlatformStyle(content.platform)
                          )}>
                            {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">
                        {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <div className="px-6 pb-3">
                      <h3 className="text-xl font-semibold text-dark">{content.title}</h3>
                    </div>
                    
                    {/* Content preview */}
                    <div className="px-6 overflow-hidden flex-1">
                      <div className={cn(
                        "relative overflow-hidden transition-all duration-300",
                        isExpanded ? "max-h-[500px]" : "max-h-[120px]"
                      )}>
                        {content.imageUrl && (
                          <div className="float-left mr-4 mb-2 w-1/3 md:w-1/4">
                            <img
                              src={content.imageUrl}
                              alt={content.title}
                              className="w-full h-auto rounded-md object-cover"
                            />
                          </div>
                        )}
                        
                        {content.textContent ? (
                          <div className="text-gray-700 text-sm leading-relaxed">
                            {content.textContent}
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">No content available</div>
                        )}
                        
                        {!isExpanded && content.textContent && content.textContent.length > 300 && (
                          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                        )}
                      </div>
                      
                      {content.textContent && content.textContent.length > 300 && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="mt-2 text-primary hover:text-primary-dark text-sm font-medium flex items-center"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="px-6 py-4 mt-auto border-t border-gray-100 flex flex-wrap gap-2">
                      {onSchedule && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="text-xs bg-primary text-white rounded hover:bg-primary-dark"
                          onClick={() => onSchedule(content)}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Schedule
                        </Button>
                      )}
                      
                      {onEdit && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="text-xs rounded"
                          onClick={() => onEdit(content)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs rounded ml-auto"
                      >
                        <Share className="h-3.5 w-3.5 mr-1" />
                        Share
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs rounded"
                      >
                        <BarChart className="h-3.5 w-3.5 mr-1" />
                        Analytics
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs rounded"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="absolute -bottom-4 left-0 right-0 flex justify-center space-x-2 pb-4">
              {contents.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentIndex === index 
                      ? "bg-primary scale-125" 
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                  onClick={() => {
                    // Handle indicator click
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <CarouselPrevious className="left-2 bg-white" />
            <CarouselNext className="right-2 bg-white" />
          </Carousel>
        ) : (
          <div className="py-24 text-center">
            <p className="text-gray-500">No content available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentPreviewSlider;