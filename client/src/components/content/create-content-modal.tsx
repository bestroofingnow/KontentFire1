import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, BookOpen } from "lucide-react";
import { FactCheckDialog, ReferencesDialog } from "@/components/fact-check";

type ContentType = 'text' | 'image' | 'both';
type ToneType = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
type LengthType = 'short' | 'medium' | 'long';
type PlatformType = 'blog' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';

const formSchema = z.object({
  contentType: z.enum(['text', 'image', 'both'] as const),
  platform: z.enum(['blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest'] as const),
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous'] as const),
  length: z.enum(['short', 'medium', 'long'] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  onContentCreated: () => void;
}

export default function CreateContentModal({ open, onClose, onContentCreated }: CreateContentModalProps) {
  const { toast } = useToast();
  const [generatedContent, setGeneratedContent] = useState<{text?: string, imageUrl?: string}>({});
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: 'text',
      platform: 'blog',
      prompt: '',
      tone: 'professional',
      length: 'medium'
    }
  });
  
  const generateContentMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/content/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content Generated",
        description: "Your content has been successfully generated.",
      });
      setGenerating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      setGenerating(false);
    }
  });
  
  const saveContentMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      textContent?: string;
      imageUrl?: string;
      contentType: ContentType;
    }) => {
      const res = await apiRequest("POST", "/api/content", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Content Saved",
        description: "Your content has been successfully saved.",
      });
      setSaving(false);
      handleReset();
      onContentCreated();
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
    }
  });
  
  const onSubmit = (values: FormValues) => {
    setGenerating(true);
    generateContentMutation.mutate(values);
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your content.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    saveContentMutation.mutate({
      title,
      textContent: generatedContent.text,
      imageUrl: generatedContent.imageUrl,
      contentType: form.getValues().contentType,
    });
  };
  
  const handleReset = () => {
    form.reset();
    setGeneratedContent({});
    setTitle("");
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-display text-dark">Create New Content</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Content Type Selection */}
            <div>
              <Label className="block text-gray-700 font-medium mb-2">Content Type</Label>
              <Controller
                name="contentType"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <Label className="border rounded-lg p-4 cursor-pointer hover:border-primary flex items-center">
                      <RadioGroupItem value="text" className="mr-2" />
                      <span>Text</span>
                    </Label>
                    <Label className="border rounded-lg p-4 cursor-pointer hover:border-primary flex items-center">
                      <RadioGroupItem value="image" className="mr-2" />
                      <span>Image</span>
                    </Label>
                    <Label className="border rounded-lg p-4 cursor-pointer hover:border-primary flex items-center">
                      <RadioGroupItem value="both" className="mr-2" />
                      <span>Text + Image</span>
                    </Label>
                  </RadioGroup>
                )}
              />
              {form.formState.errors.contentType && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.contentType.message}</p>
              )}
            </div>
            
            {/* Platform Selection */}
            <div>
              <Label className="block text-gray-700 font-medium mb-2">Destination Platform</Label>
              <Controller
                name="platform"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="pinterest">Pinterest</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.platform && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.platform.message}</p>
              )}
            </div>
            
            {/* Prompt Input */}
            <div>
              <Label className="block text-gray-700 font-medium mb-2">Prompt (What do you want to create?)</Label>
              <Controller
                name="prompt"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="w-full border rounded-lg p-3 text-gray-700 h-24"
                    placeholder="Example: Create a post about the benefits of meditation for stress relief..."
                  />
                )}
              />
              {form.formState.errors.prompt && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.prompt.message}</p>
              )}
            </div>
            
            {/* Content Style Settings */}
            <div>
              <Label className="block text-gray-700 font-medium mb-2">Content Style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-gray-600 text-sm mb-1">Tone</Label>
                  <Controller
                    name="tone"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="humorous">Humorous</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="block text-gray-600 text-sm mb-1">Length</Label>
                  <Controller
                    name="length"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select length" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Generate Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark text-white"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Content'
              )}
            </Button>
          </div>
        </form>
        
        {/* Generated Content Preview */}
        {(generatedContent.text || generatedContent.imageUrl) && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
            
            <div className="mb-4">
              <Label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                placeholder="Enter a title for your content"
              />
            </div>
            
            {generatedContent.imageUrl && (
              <div className="mb-4">
                <Label className="block text-gray-700 font-medium mb-2">Generated Image</Label>
                <img 
                  src={generatedContent.imageUrl} 
                  alt="Generated content" 
                  className="w-full h-auto max-h-64 object-contain border rounded"
                />
              </div>
            )}
            
            {generatedContent.text && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <Label className="block text-gray-700 font-medium mb-2">Generated Text</Label>
                  <div className="flex items-center gap-2">
                    <FactCheckDialog 
                      initialText={generatedContent.text}
                      triggerLabel="Fact Check"
                    />
                    <ReferencesDialog 
                      initialQuery={form.getValues().prompt}
                      triggerLabel="Find References"
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 text-gray-800 whitespace-pre-wrap">
                  {generatedContent.text}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleSave} 
              className="w-full bg-primary hover:bg-primary-dark text-white mt-4"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Content'
              )}
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
