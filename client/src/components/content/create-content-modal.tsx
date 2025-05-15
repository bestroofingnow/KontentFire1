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
import { RepurposeDialog } from "./repurpose-dialog";
import TemplateSelector from "./template-selector";
import BattleRoyaleTemplate from "./battle-royale-template";
import Basics101Template from "./basics-101-template";
import MythBusterTemplate from "./myth-buster-template";
import TechnicalGuideTemplate from "./technical-guide-template";
import CaseAgainstTemplate from "./case-against-template";
import ChecklistTemplate from "./checklist-template";

type ContentType = 'text' | 'image' | 'both';
type ToneType = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
type LengthType = 'short' | 'medium' | 'long';
type PlatformType = 'blog' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
type TemplateType = 'standard' | 'battle-royale' | 'basics-101' | 'myth-buster' | 'technical-guide' | 'case-against' | 'checklist';

const formSchema = z.object({
  contentType: z.enum(['text', 'image', 'both'] as const),
  platform: z.enum(['blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest'] as const),
  prompt: z.string().min(5, "Prompt must be at least 5 characters").optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous'] as const),
  length: z.enum(['short', 'medium', 'long'] as const),
  template: z.enum(['standard', 'battle-royale', 'basics-101', 'myth-buster', 'technical-guide', 'case-against', 'checklist'] as const).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  onContentCreated: () => void;
}

// Utility function to get a friendly error message
function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for HTML in the error message
    if (message.includes('<!DOCTYPE') || message.includes('<html')) {
      return 'Server error: Unable to connect to content generation service';
    }
    
    // Check for connection errors 
    if (message.includes('Failed to fetch') || 
        message.includes('NetworkError') ||
        message.includes('ECONNREFUSED')) {
      return 'Network error: Unable to connect to the server. Please check your connection.';
    }
    
    // Return the original message if no specific patterns matched
    return message;
  }
  
  // Default message for non-Error objects
  return 'An unexpected error occurred. Please try again.';
}

export default function CreateContentModal({ open, onClose, onContentCreated }: CreateContentModalProps) {
  const { toast } = useToast();
  const [generatedContent, setGeneratedContent] = useState<{
    text?: string, 
    imageUrl?: string,
    additionalImages?: string[]
  }>({});
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repurposeOpen, setRepurposeOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("standard");
  const [templateData, setTemplateData] = useState<any>({});
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: 'text',
      platform: 'blog',
      prompt: '',
      tone: 'professional',
      length: 'medium',
      template: 'standard'
    }
  });
  
  const generateContentMutation = useMutation({
    mutationFn: async (data: FormValues & { templateData?: any }) => {
      const requestData = {
        ...data,
        templateData: selectedTemplate !== 'standard' ? templateData : undefined
      };
      
      try {
        const res = await apiRequest("POST", "/api/content/generate", requestData);
        
        if (!res.ok) {
          // Try to parse the error as JSON first
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || 'An error occurred while generating content');
          } catch (jsonError) {
            // If JSON parsing fails, it's probably HTML or another format
            const text = await res.text();
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              throw new Error('Server error: Unable to connect to content generation service');
            } else {
              throw new Error('Failed to generate content. Please try again later.');
            }
          }
        }
        
        return res.json();
      } catch (error: any) {
        console.error('Content generation error:', error);
        throw new Error(error.message || 'An unexpected error occurred');
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content Generated",
        description: "Your content has been successfully generated.",
      });
      setGenerating(false);
    },
    onError: (error: unknown) => {
      console.error('Content generation error:', error);
      
      // Use our utility function to get a friendly error message
      const friendlyMessage = getFriendlyErrorMessage(error);
      
      toast({
        title: "Generation Failed",
        description: friendlyMessage,
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
      additionalImages?: string[];
      contentType: ContentType;
      template?: TemplateType;
      templateData?: any;
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
    console.log("Form submit triggered with values:", values);
    console.log("Selected template:", selectedTemplate);
    console.log("Template data:", templateData);
    
    try {
      // Validate based on template type
      if (selectedTemplate === 'standard' && (!values.prompt || values.prompt.length < 5)) {
        toast({
          title: "Invalid Prompt",
          description: "Please enter a prompt with at least 5 characters",
          variant: "destructive",
        });
        return;
      }
      
      if (selectedTemplate === 'battle-royale') {
        // Log the template data for debugging
        console.log("Battle Royale template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.option1 || !templateData.option2 || !templateData.comparisonFocus) {
          toast({
            title: "Missing Required Fields",
            description: "Both options and comparison focus are required for Battle Royale template",
            variant: "destructive",
          });
          return;
        }
      }
      
      if (selectedTemplate === 'basics-101') {
        console.log("Basics 101 template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.topic) {
          toast({
            title: "Missing Required Fields",
            description: "Topic is required for Basics 101 template",
            variant: "destructive",
          });
          return;
        }
      }
      
      if (selectedTemplate === 'myth-buster') {
        console.log("Myth Buster template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.topic) {
          toast({
            title: "Missing Required Fields",
            description: "Topic is required for Myth Buster template",
            variant: "destructive",
          });
          return;
        }
      }

      if (selectedTemplate === 'technical-guide') {
        console.log("Technical Guide template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.topic) {
          toast({
            title: "Missing Required Fields",
            description: "Topic is required for Technical Guide template",
            variant: "destructive",
          });
          return;
        }
      }

      if (selectedTemplate === 'case-against') {
        console.log("Case Against template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.topic) {
          toast({
            title: "Missing Required Fields",
            description: "Topic is required for Case Against template",
            variant: "destructive",
          });
          return;
        }
      }

      if (selectedTemplate === 'checklist') {
        console.log("Checklist template data:", JSON.stringify(templateData, null, 2));
        
        if (!templateData || !templateData.topic) {
          toast({
            title: "Missing Required Fields",
            description: "Topic is required for Checklist template",
            variant: "destructive",
          });
          return;
        }
      }
      
      // Create a direct variable for template data to ensure it's properly included
      const templateDataToSend = selectedTemplate !== 'standard' ? templateData : null;
      
      // Create a submission payload in the format the server expects
      const payload: Record<string, any> = {
        contentType: values.contentType,
        platform: values.platform,
        tone: values.tone,
        length: values.length,
        template: selectedTemplate
      };
      
      // Add personality if it exists
      if (values.personality) {
        payload.personality = values.personality;
      }
      
      // Add prompt only for standard template
      if (selectedTemplate === 'standard') {
        payload.prompt = values.prompt;
      }
      
      // Add template data for non-standard templates
      if (selectedTemplate !== 'standard' && templateDataToSend) {
        payload.templateData = templateDataToSend;
      }
      
      console.log("Final values being sent:", JSON.stringify(payload, null, 2));
      
      // Send the content generation request
      setGenerating(true);
      generateContentMutation.mutate(payload);
      
    } catch (error) {
      console.error("Error preparing form data:", error);
      toast({
        title: "Form Error",
        description: "There was an error preparing your form data. Please try again.",
        variant: "destructive",
      });
    }
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
      additionalImages: generatedContent.additionalImages, // Add additional images for database storage
      contentType: form.getValues().contentType,
      template: selectedTemplate,
      templateData: selectedTemplate !== 'standard' ? templateData : undefined
    });
  };
  
  const handleReset = () => {
    form.reset();
    setGeneratedContent({});
    setTitle("");
    setSelectedTemplate("standard");
    setTemplateData({});
    onClose();
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value as TemplateType);
    form.setValue('template', value as any);
  };

  const handleTemplateDataChange = (data: any) => {
    setTemplateData(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-display text-dark">Create New Content</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Template Selection */}
            <TemplateSelector 
              value={selectedTemplate} 
              onChange={handleTemplateChange}
            />

            {/* Template-specific inputs */}
            {selectedTemplate === 'battle-royale' && (
              <BattleRoyaleTemplate 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Battle Royale direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "battle-royale",
                      templateData: templateData
                    };
                    
                    console.log("Direct Battle Royale submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission, {
                      onError: (error) => {
                        console.error("Battle Royale generation error:", error);
                        
                        // Use the friendly error message utility
                        const friendlyMessage = getFriendlyErrorMessage(error);
                        
                        toast({
                          title: "Content Generation Failed",
                          description: friendlyMessage,
                          variant: "destructive",
                        });
                        setGenerating(false);
                      }
                    });
                  } catch (error) {
                    console.error("Error in Battle Royale direct submission:", error);
                    
                    // Use the friendly error message utility
                    const friendlyMessage = getFriendlyErrorMessage(error);
                    
                    toast({
                      title: "Submission Error",
                      description: friendlyMessage,
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Basics 101 Template */}
            {selectedTemplate === 'basics-101' && (
              <Basics101Template 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Basics 101 direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "basics-101",
                      templateData: templateData
                    };
                    
                    console.log("Direct Basics 101 submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission);
                  } catch (error) {
                    console.error("Error in Basics 101 direct submission:", error);
                    toast({
                      title: "Submission Error",
                      description: "There was an error submitting the Basics 101 template. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Myth Buster Template */}
            {selectedTemplate === 'myth-buster' && (
              <MythBusterTemplate 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Myth Buster direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "myth-buster",
                      templateData: templateData
                    };
                    
                    console.log("Direct Myth Buster submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission);
                  } catch (error) {
                    console.error("Error in Myth Buster direct submission:", error);
                    toast({
                      title: "Submission Error",
                      description: "There was an error submitting the Myth Buster template. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Technical Guide Template */}
            {selectedTemplate === 'technical-guide' && (
              <TechnicalGuideTemplate 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Technical Guide direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "technical-guide",
                      templateData: templateData
                    };
                    
                    console.log("Direct Technical Guide submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission);
                  } catch (error) {
                    console.error("Error in Technical Guide direct submission:", error);
                    toast({
                      title: "Submission Error",
                      description: "There was an error submitting the Technical Guide template. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Case Against Template */}
            {selectedTemplate === 'case-against' && (
              <CaseAgainstTemplate 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Case Against direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "case-against",
                      templateData: templateData
                    };
                    
                    console.log("Direct Case Against submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission);
                  } catch (error) {
                    console.error("Error in Case Against direct submission:", error);
                    toast({
                      title: "Submission Error",
                      description: "There was an error submitting the Case Against template. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Checklist Template */}
            {selectedTemplate === 'checklist' && (
              <ChecklistTemplate 
                formData={templateData} 
                onChange={handleTemplateDataChange}
                onGenerateContent={(templateData) => {
                  try {
                    console.log("Checklist direct generate triggered");
                    
                    // Create submission data directly
                    const directSubmission: Record<string, any> = {
                      contentType: form.getValues().contentType || "both",
                      platform: form.getValues().platform || "blog",
                      tone: form.getValues().tone || "professional",
                      length: form.getValues().length || "medium",
                      template: "checklist",
                      templateData: templateData
                    };
                    
                    console.log("Direct Checklist submission:", JSON.stringify(directSubmission, null, 2));
                    
                    // Submit directly
                    setGenerating(true);
                    generateContentMutation.mutate(directSubmission);
                  } catch (error) {
                    console.error("Error in Checklist direct submission:", error);
                    toast({
                      title: "Submission Error",
                      description: "There was an error submitting the Checklist template. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            )}

            {/* Only show prompt input for standard template */}
            {selectedTemplate === 'standard' && (
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
            )}
            
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
              type="button" 
              onClick={() => {
                console.log("Generate button clicked");
                form.handleSubmit(onSubmit)();
              }}
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
                <Label className="block text-gray-700 font-medium mb-2">Featured Image</Label>
                <img 
                  src={generatedContent.imageUrl} 
                  alt="Featured image" 
                  className="w-full h-auto max-h-64 object-contain border rounded"
                />
              </div>
            )}
            
            {generatedContent.additionalImages && generatedContent.additionalImages.length > 0 && (
              <div className="mb-4">
                <Label className="block text-gray-700 font-medium mb-2">
                  Additional Images ({generatedContent.additionalImages.length})
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {generatedContent.additionalImages.map((imgUrl, index) => (
                    <div key={index} className="border rounded overflow-hidden">
                      <img 
                        src={imgUrl} 
                        alt={`Supporting image ${index + 1}`} 
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-2 text-xs text-center text-gray-500">
                        Supporting image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  These images will be embedded throughout your content (1 image per 400 words).
                </p>
              </div>
            )}
            
            {generatedContent.text && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <Label className="block text-gray-700 font-medium mb-2">Generated Text</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs px-3 py-1 rounded text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                      onClick={() => setRepurposeOpen(true)}
                    >
                      Repurpose
                    </Button>
                    <FactCheckDialog 
                      initialText={generatedContent.text}
                      triggerLabel="Fact Check"
                    />
                    <ReferencesDialog 
                      initialQuery={form.getValues().prompt || `About ${templateData.comparisonFocus || 'the topic'}`}
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

        {/* Repurpose Dialog */}
        {generatedContent.text && (
          <RepurposeDialog
            open={repurposeOpen}
            onOpenChange={setRepurposeOpen}
            content={{
              title: title,
              textContent: generatedContent.text
            }}
            sourcePlatform={form.getValues().platform}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
