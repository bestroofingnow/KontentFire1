/**
 * LinkedIn Post Component
 * Allows users to create and share posts directly to LinkedIn
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Image, Link2, Linkedin, Send } from 'lucide-react';
import { LinkedInConnectButton } from './linked-in-connect-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

/**
 * Media type options
 */
const MEDIA_TYPES = [
  { value: 'none', label: 'Text Only' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

/**
 * LinkedIn Post component props
 */
interface LinkedInPostProps {
  defaultText?: string;
  defaultMediaUrl?: string;
  defaultMediaType?: string;
  defaultTitle?: string;
  onSuccess?: (result: any) => void;
  showCreateAnimation?: boolean;
}

/**
 * LinkedIn Post Form Component
 */
export function LinkedInPost({
  defaultText = '',
  defaultMediaUrl = '',
  defaultMediaType = 'none',
  defaultTitle = '',
  onSuccess,
  showCreateAnimation = false,
}: LinkedInPostProps) {
  const { toast } = useToast();
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  
  // Form state
  const [text, setText] = useState(defaultText);
  const [mediaType, setMediaType] = useState<string>(defaultMediaType);
  const [mediaUrl, setMediaUrl] = useState(defaultMediaUrl);
  const [title, setTitle] = useState(defaultTitle);
  
  // Animation dialog state
  const [isAnimationDialogOpen, setIsAnimationDialogOpen] = useState(false);
  
  // Post to LinkedIn mutation
  const postMutation = useMutation({
    mutationFn: async (postData: { 
      text: string; 
      mediaType?: string; 
      mediaUrl?: string; 
      title?: string 
    }) => {
      const response = await apiRequest(
        'POST', 
        '/api/integrations/linkedin/post', 
        postData
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Posted Successfully',
        description: 'Your content has been posted to LinkedIn.',
      });
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      console.error('Failed to post to LinkedIn:', error);
      toast({
        title: 'Post Failed',
        description: error instanceof Error ? error.message : 'Could not post to LinkedIn. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast({
        title: 'Missing Content',
        description: 'Please add some text to your post.',
        variant: 'destructive',
      });
      return;
    }
    
    postMutation.mutate({
      text,
      mediaType: mediaType !== 'none' ? mediaType : undefined,
      mediaUrl: mediaType !== 'none' ? mediaUrl : undefined,
      title: mediaType !== 'none' ? title : undefined,
    });
  };
  
  // Render LinkedIn not connected state
  if (!isLinkedInConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Linkedin className="mr-2 h-5 w-5 text-blue-600" />
            Share to LinkedIn
          </CardTitle>
          <CardDescription>
            Connect your LinkedIn account to share content directly to your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LinkedInConnectButton onStatusChange={setIsLinkedInConnected} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-blue-700">
          <Linkedin className="mr-2 h-5 w-5" />
          Share to LinkedIn
        </CardTitle>
        <CardDescription>
          Create and publish content directly to your LinkedIn profile.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What would you like to share on LinkedIn?"
            className="min-h-[120px] resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          
          <Tabs defaultValue={mediaType} onValueChange={setMediaType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="none" className="flex items-center">
                <Send className="mr-2 h-4 w-4" /> Text Only
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center">
                <Image className="mr-2 h-4 w-4" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center">
                <Video className="mr-2 h-4 w-4" /> Video
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="none">
              <p className="text-sm text-muted-foreground py-4">
                Share a text-only update with your LinkedIn network.
              </p>
            </TabsContent>
            
            <TabsContent value="image" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image-title">Image Title</Label>
                <Input
                  id="image-title"
                  placeholder="Add a title for your image"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    placeholder="Enter image URL"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="flex-1"
                  />
                  {showCreateAnimation && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsAnimationDialogOpen(true)}
                    >
                      Create Animation
                    </Button>
                  )}
                </div>
              </div>
              
              {mediaUrl && (
                <div className="mt-4 rounded-md overflow-hidden border">
                  <img 
                    src={mediaUrl} 
                    alt={title || "Preview"} 
                    className="w-full h-auto max-h-[200px] object-cover" 
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x400/f0f0f0/a0a0a0?text=Image+Preview+Unavailable";
                    }}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="video" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="video-title">Video Title</Label>
                <Input
                  id="video-title"
                  placeholder="Add a title for your video"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  placeholder="Enter video URL"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                LinkedIn supports videos hosted on their platform. For best results, upload your video directly to LinkedIn.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center bg-muted/20 py-3">
          <LinkedInConnectButton />
          <Button 
            type="submit" 
            className="bg-linkedin hover:bg-linkedin/90 text-white"
            disabled={postMutation.isPending}
          >
            {postMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
              </>
            ) : (
              <>
                <Linkedin className="mr-2 h-4 w-4" /> Post to LinkedIn
              </>
            )}
          </Button>
        </CardFooter>
      </form>
      
      {/* Animation creator dialog would be implemented here */}
      {isAnimationDialogOpen && showCreateAnimation && (
        <AnimationCreatorDialog 
          open={isAnimationDialogOpen}
          onOpenChange={setIsAnimationDialogOpen}
          onAnimationCreated={(animationUrl) => {
            setMediaUrl(animationUrl);
            setIsAnimationDialogOpen(false);
          }}
          initialPrompt={text}
        />
      )}
    </Card>
  );
}

// Import the Video icon from lucide-react
import { Video } from 'lucide-react';

// This is a placeholder component for the animation creator dialog
// In a real implementation, this would be replaced with the actual AnimationCreator component
const AnimationCreatorDialog = ({ 
  open, 
  onOpenChange, 
  onAnimationCreated, 
  initialPrompt 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onAnimationCreated: (animationUrl: string) => void;
  initialPrompt?: string;
}) => {
  // This is a placeholder that would be replaced with the actual animation creator
  return null;
};