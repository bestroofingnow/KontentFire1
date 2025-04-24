import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Facebook, Link, Image } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PlatformIntegration } from '@shared/schema';

// Define the form schema for Facebook post
const facebookPostSchema = z.object({
  pageId: z.string().min(1, "Please select a Facebook page"),
  message: z.string().min(1, "Message is required"),
  link: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal('')),
});

type FacebookPostFormValues = z.infer<typeof facebookPostSchema>;

interface FacebookPostProps {
  content?: string;
  onSuccess?: (postUrl: string) => void;
}

const FacebookPost: React.FC<FacebookPostProps> = ({ content = '', onSuccess }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Fetch Facebook pages
  const { data: integrations, isLoading } = useQuery<PlatformIntegration[]>({
    queryKey: ['/api/integrations/facebook'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Initialize form
  const form = useForm<FacebookPostFormValues>({
    resolver: zodResolver(facebookPostSchema),
    defaultValues: {
      pageId: '',
      message: content,
      link: '',
      imageUrl: '',
    },
  });

  // Mutation for posting to Facebook
  const postMutation = useMutation({
    mutationFn: async (values: FacebookPostFormValues) => {
      const response = await apiRequest('POST', `/api/integrations/facebook/${values.pageId}/post`, {
        message: values.message,
        link: values.link || undefined,
        imageUrl: values.imageUrl || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Posted to Facebook',
        description: 'Your content has been successfully posted to Facebook.',
      });
      
      setOpen(false);
      
      if (onSuccess && data.post_url) {
        onSuccess(data.post_url);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error posting to Facebook',
        description: error.message || 'An error occurred while posting to Facebook.',
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FacebookPostFormValues) => {
    postMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          <span>Post to Facebook</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Facebook className="h-5 w-5 mr-2 text-blue-600" />
            Post to Facebook
          </DialogTitle>
          <DialogDescription>
            Share your content directly to one of your Facebook pages.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Facebook Page</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading || !integrations || integrations.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Facebook page" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading pages...</SelectItem>
                      ) : integrations && integrations.length > 0 ? (
                        integrations.map((integration) => (
                          <SelectItem 
                            key={integration.accountId} 
                            value={integration.accountId}
                          >
                            {integration.accountName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No Facebook pages connected</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!integrations || integrations.length === 0 ? (
                      <span className="text-red-500">
                        Connect a Facebook page first in the settings.
                      </span>
                    ) : "Choose the Facebook page to post to."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What would you like to share on Facebook?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Link className="h-4 w-4 text-gray-500" />
                      <Input 
                        placeholder="https://example.com/your-link"
                        type="url"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add a link to your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4 text-gray-500" />
                      <Input 
                        placeholder="https://example.com/your-image.jpg"
                        type="url"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add an image to your post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={postMutation.isPending || !integrations || integrations.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {postMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Posting...
                  </div>
                ) : (
                  'Post to Facebook'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default FacebookPost;