import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SiLinkedin } from 'react-icons/si';
import { Loader2, LinkIcon, ImageIcon, SendIcon, VideoIcon, XIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatedElement } from '@/components/ui/animated-element';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AnimationCreator from '@/components/animations/animation-creator';
import AnimationPreview from '@/components/animations/animation-preview';

// Define the form schema
const linkedInPostSchema = z.object({
  text: z.string().min(1, 'Text is required').max(3000, 'Text must be less than 3000 characters'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  link: z.string().url('Invalid link URL').optional().or(z.literal('')),
  title: z.string().optional(),
  description: z.string().optional()
});

type LinkedInPostFormValues = z.infer<typeof linkedInPostSchema>;

interface LinkedInPostProps {
  isConnected: boolean;
  onPostSuccess?: (data: any) => void;
  initialContent?: {
    text?: string;
    imageUrl?: string;
    link?: string;
    title?: string;
    description?: string;
  };
}

interface AnimationResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  format: string;
  width: number;
  height: number;
  frames: number;
  duration: number;
  createdAt: Date;
}

export function LinkedInPost({ 
  isConnected, 
  onPostSuccess,
  initialContent = {}
}: LinkedInPostProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageField, setShowImageField] = useState(!!initialContent.imageUrl);
  const [showLinkField, setShowLinkField] = useState(!!initialContent.link);
  const [animationDialogOpen, setAnimationDialogOpen] = useState(false);
  const [showAnimationPreview, setShowAnimationPreview] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationResult | null>(null);
  const { toast } = useToast();

  // Initialize react-hook-form
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LinkedInPostFormValues>({
    resolver: zodResolver(linkedInPostSchema),
    defaultValues: {
      text: initialContent.text || '',
      imageUrl: initialContent.imageUrl || '',
      link: initialContent.link || '',
      title: initialContent.title || '',
      description: initialContent.description || ''
    }
  });
  
  const currentImageUrl = watch('imageUrl');

  // Handle form submission
  const onSubmit = async (data: LinkedInPostFormValues) => {
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your LinkedIn account first',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up the data
      const cleanData = {
        ...data,
        imageUrl: showImageField && data.imageUrl ? data.imageUrl : undefined,
        link: showLinkField && data.link ? data.link : undefined,
        title: (showImageField || showLinkField) ? data.title : undefined,
        description: (showImageField || showLinkField) ? data.description : undefined
      };

      const response = await apiRequest('POST', '/api/integrations/linkedin/post', cleanData);
      const result = await response.json();
      
      toast({
        title: 'Posted to LinkedIn',
        description: 'Your content has been successfully posted to LinkedIn',
      });
      
      if (onPostSuccess) {
        onPostSuccess(result);
      }
    } catch (error) {
      console.error('Failed to post to LinkedIn:', error);
      toast({
        title: 'Posting Failed',
        description: error instanceof Error ? error.message : 'Could not post to LinkedIn',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle image or link sections
  const toggleImageField = () => setShowImageField(prev => !prev);
  const toggleLinkField = () => setShowLinkField(prev => !prev);

  if (!isConnected) {
    return (
      <AnimatedElement>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />
              LinkedIn Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect your LinkedIn account to post content directly from here.
            </p>
          </CardContent>
        </Card>
      </AnimatedElement>
    );
  }

  return (
    <AnimatedElement>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />
            LinkedIn Post
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Post Text</Label>
              <Textarea
                id="text"
                placeholder="What would you like to share?"
                className="min-h-24"
                {...register('text')}
              />
              {errors.text && (
                <p className="text-sm text-destructive">{errors.text.message}</p>
              )}
            </div>
            
            {showImageField && (
              <div className="space-y-4 p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="imageUrl" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Image URL
                    </Label>
                    
                    {currentAnimation ? (
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowAnimationPreview(true)}
                        >
                          <VideoIcon className="h-4 w-4 mr-1" />
                          View Animation
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentAnimation(null);
                            setValue('imageUrl', '');
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Dialog open={animationDialogOpen} onOpenChange={setAnimationDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <VideoIcon className="h-4 w-4" />
                            Create Animation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <AnimationCreator 
                            onAnimationCreated={(animation) => {
                              setCurrentAnimation(animation);
                              setValue('imageUrl', window.location.origin + animation.url);
                              setValue('title', 'Animated content');
                              setValue('description', `${animation.width}x${animation.height} animation, ${animation.frames} frames`);
                              setAnimationDialogOpen(false);
                              toast({
                                title: "Animation Created",
                                description: "Animation added to your LinkedIn post",
                              });
                            }}
                            onClose={() => setAnimationDialogOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    {...register('imageUrl')}
                    className={currentAnimation ? "bg-muted cursor-not-allowed" : ""}
                    disabled={!!currentAnimation}
                  />
                  {errors.imageUrl && (
                    <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Image Title</Label>
                  <Input
                    id="title"
                    placeholder="Title for your image"
                    {...register('title')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Image Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description for your image"
                    {...register('description')}
                  />
                </div>
              </div>
            )}
            
            {/* Animation Preview Dialog */}
            {currentAnimation && (
              <Dialog open={showAnimationPreview} onOpenChange={setShowAnimationPreview}>
                <DialogContent className="max-w-md">
                  <AnimationPreview 
                    animation={currentAnimation}
                    onClose={() => setShowAnimationPreview(false)}
                    onUseAnimation={(url) => {
                      setValue('imageUrl', window.location.origin + url);
                      setShowAnimationPreview(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
            
            {showLinkField && (
              <div className="space-y-4 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="link" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" /> Link URL
                  </Label>
                  <Input
                    id="link"
                    placeholder="https://example.com"
                    {...register('link')}
                  />
                  {errors.link && (
                    <p className="text-sm text-destructive">{errors.link.message}</p>
                  )}
                </div>
                
                {!showImageField && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="linkTitle">Link Title</Label>
                      <Input
                        id="linkTitle"
                        placeholder="Title for your link"
                        {...register('title')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="linkDescription">Link Description</Label>
                      <Textarea
                        id="linkDescription"
                        placeholder="Description for your link"
                        {...register('description')}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleImageField}
                className="flex items-center gap-1"
              >
                <ImageIcon className="h-4 w-4" />
                {showImageField ? 'Remove Image' : 'Add Image'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleLinkField}
                className="flex items-center gap-1"
              >
                <LinkIcon className="h-4 w-4" />
                {showLinkField ? 'Remove Link' : 'Add Link'}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              Post to LinkedIn
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AnimatedElement>
  );
}