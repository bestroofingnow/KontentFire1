/**
 * LinkedIn Post Component
 * 
 * This component provides a form for creating and posting content to LinkedIn.
 * It handles text input, media attachments, and post submission.
 */

import React, { useState } from 'react';
import { Loader2, Image, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LinkedInPostProps {
  defaultText?: string;
  onSuccess?: (result: any) => void;
  showCreateAnimation?: boolean;
}

export function LinkedInPost({
  defaultText = '',
  onSuccess,
  showCreateAnimation = false,
}: LinkedInPostProps) {
  const [postText, setPostText] = useState(defaultText);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [animationModalOpen, setAnimationModalOpen] = useState(false);
  const { toast } = useToast();

  // Function to create animation (stub for now)
  const createAnimation = async (prompt: string) => {
    // This would normally call an API to generate an animation
    // For now, we'll just mock a waiting period and return a placeholder URL
    toast({
      title: 'Creating Animation',
      description: 'Your animation is being generated...',
    });
    
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    
    // Return a sample animation URL
    setMediaUrl('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTBvZm04aXJidG1yMDN0Y3dtcmJuMjRnNm13M2xlbzlidXBpcG5taSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7btLqOzQUOPOVR5u/giphy.gif');
    
    toast({
      title: 'Animation Created',
      description: 'Your animation has been generated successfully!',
    });
    
    setAnimationModalOpen(false);
  };

  // Submit post to LinkedIn
  const submitPost = async () => {
    if (!postText.trim()) {
      toast({
        title: 'Error',
        description: 'Post text cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await apiRequest('POST', '/api/integrations/linkedin/post', {
        text: postText,
        mediaUrl: mediaUrl || undefined,
      });
      
      const result = await response.json();
      
      setShowSuccessMessage(true);
      
      // Clear form after successful submission
      setPostText('');
      setMediaUrl('');
      
      // Notify parent component of success
      if (onSuccess) {
        onSuccess(result);
      }
      
      toast({
        title: 'Success',
        description: 'Post shared to LinkedIn successfully!',
      });
      
      // Reset success message after a delay
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to post to LinkedIn:', error);
      toast({
        title: 'Post Failed',
        description: 'Failed to share post to LinkedIn',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {showSuccessMessage ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Post Shared Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your content has been successfully posted to LinkedIn.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuccessMessage(false);
                setPostText('');
                setMediaUrl('');
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Create Another Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="post-text">Post Content</Label>
              <Textarea
                id="post-text"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What would you like to share on LinkedIn?"
                className="min-h-[120px]"
              />
            </div>
            
            <div>
              <Label htmlFor="media-url">Media URL (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  id="media-url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                {showCreateAnimation && (
                  <Dialog open={animationModalOpen} onOpenChange={setAnimationModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Image className="mr-2 h-4 w-4" />
                        Create Animation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Animation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-500">
                          Create an animated GIF to attach to your LinkedIn post.
                        </p>
                        <Textarea
                          placeholder="Describe the animation you want to create..."
                          className="min-h-[100px]"
                          id="animation-prompt"
                        />
                        <Button 
                          className="w-full"
                          onClick={() => {
                            const prompt = (document.getElementById('animation-prompt') as HTMLTextAreaElement).value;
                            if (prompt) {
                              createAnimation(prompt);
                            } else {
                              toast({
                                title: 'Error',
                                description: 'Please enter a description for your animation',
                                variant: 'destructive',
                              });
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Animation'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {mediaUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">Media Preview:</p>
                  <img 
                    src={mediaUrl} 
                    alt="Preview" 
                    className="max-h-[200px] rounded-md border" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/400x200/e2e8f0/64748b?text=Invalid+Media+URL';
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={submitPost}
                disabled={isSubmitting || !postText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post to LinkedIn
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}