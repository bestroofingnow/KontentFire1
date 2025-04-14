import { Content } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FactCheckDialog, ReferencesDialog } from "@/components/fact-check";
import { useState } from "react";
import { RepurposeDialog } from "./repurpose-dialog";

type ContentItemProps = {
  content: Content;
  onSchedule: (content: Content) => void;
  onEdit: (content: Content) => void;
};

export default function ContentItem({ content, onSchedule, onEdit }: ContentItemProps) {
  const [repurposeOpen, setRepurposeOpen] = useState(false);

  const getPlatformClass = (platform: string) => {
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

  const formattedDate = content.createdAt 
    ? formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })
    : "Recently";

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden flex flex-col sm:flex-row">
      <div className="w-full sm:w-32 h-32 bg-gray-200 flex-shrink-0">
        {content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            No image
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1">
        <div className="flex justify-between mb-2">
          <span className={cn(
            "text-white text-xs px-2 py-0.5 rounded",
            content.contentType === 'text' ? 'bg-blue-500' :
            content.contentType === 'image' ? 'bg-green-500' : 'bg-purple-500'
          )}>
            {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)}
          </span>
          <span className="text-gray-500 text-xs">{formattedDate}</span>
        </div>
        
        <h4 className="font-medium text-dark mb-1">{content.title}</h4>
        {content.textContent && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {content.textContent.substring(0, 120)}
            {content.textContent.length > 120 ? '...' : ''}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-auto">
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
            onClick={() => onSchedule(content)}
          >
            Schedule
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
            onClick={() => onEdit(content)}
          >
            Edit
          </Button>
          
          {content.textContent && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs px-3 py-1 rounded text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={() => setRepurposeOpen(true)}
              >
                Repurpose
              </Button>

              <FactCheckDialog 
                initialText={content.textContent} 
                triggerLabel="Fact Check" 
              />
              <ReferencesDialog 
                initialQuery={content.title} 
                triggerLabel="Find References" 
              />
              
              <RepurposeDialog 
                open={repurposeOpen}
                onOpenChange={setRepurposeOpen}
                content={{
                  title: content.title,
                  textContent: content.textContent
                }}
                sourcePlatform="blog"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
