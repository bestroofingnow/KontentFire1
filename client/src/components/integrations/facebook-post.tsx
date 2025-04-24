import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Facebook, Image, Loader2, X } from 'lucide-react';
import { useFacebookSDK } from './facebook-sdk-provider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FacebookPostProps {
  initialText?: string;
  initialImage?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const FacebookPost: React.FC<FacebookPostProps> = ({
  initialText = '',
  initialImage = '',
  onSuccess,
  onError,
  className = ''
}) => {
  const { FB, isLoaded } = useFacebookSDK();
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const handleAddImage = () => {
    if (tempImageUrl) {
      setImageUrl(tempImageUrl);
      setTempImageUrl('');
      setShowImageInput(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handlePost = async () => {
    if (!isLoaded || !FB) {
      toast({
        title: "Facebook SDK Not Loaded",
        description: "Please try again later.",
        variant: "destructive"
      });
      onError?.(new Error('Facebook SDK not loaded'));
      return;
    }

    if (!text.trim() && !imageUrl) {
      toast({
        title: "Empty Post",
        description: "Please add some text or an image to your post.",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);

    try {
      // Get user's pages
      FB.api('/me/accounts', async (pagesResponse: any) => {
        if (pagesResponse.error) {
          throw new Error(pagesResponse.error.message || 'Failed to get Facebook pages');
        }

        if (!pagesResponse.data || pagesResponse.data.length === 0) {
          throw new Error('No Facebook pages found to post to');
        }

        // For now, use the first page 
        // In a real app, you would let the user choose which page to post to
        const page = pagesResponse.data[0];
        const pageAccessToken = page.access_token;
        const pageId = page.id;

        try {
          // Use our backend to make the post to avoid CORS issues and for security
          const response = await apiRequest('POST', '/api/integrations/facebook/post', {
            text,
            imageUrl,
            pageId,
            pageAccessToken,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to post to Facebook');
          }

          const result = await response.json();
          
          toast({
            title: "Posted Successfully",
            description: "Your content has been posted to Facebook.",
          });
          
          // Reset form
          setText('');
          setImageUrl('');
          
          onSuccess?.(result);
        } catch (error) {
          toast({
            title: "Post Failed",
            description: (error as Error).message,
            variant: "destructive"
          });
          onError?.(error as Error);
        }
      });
    } catch (error) {
      toast({
        title: "Post Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      onError?.(error as Error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Facebook className="h-5 w-5 text-blue-600 mr-2" />
          Post to Facebook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px] border-gray-300 focus:border-blue-500"
          disabled={isPosting}
        />
        
        {imageUrl && (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt="Post" 
              className="w-full h-auto rounded-md mt-3 border border-gray-200" 
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white rounded-full"
              onClick={handleRemoveImage}
              disabled={isPosting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {showImageInput && !imageUrl && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter image URL"
              value={tempImageUrl}
              onChange={(e) => setTempImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              disabled={isPosting}
            />
            <Button 
              variant="outline" 
              onClick={handleAddImage}
              disabled={!tempImageUrl.trim() || isPosting}
            >
              Add
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
          disabled={isPosting || !!imageUrl}
        >
          <Image className="h-4 w-4 mr-2" />
          {imageUrl ? 'Image Added' : 'Add Image'}
        </Button>
        
        <Button
          onClick={handlePost}
          disabled={isPosting || (!text.trim() && !imageUrl)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isPosting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>Post</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FacebookPost;