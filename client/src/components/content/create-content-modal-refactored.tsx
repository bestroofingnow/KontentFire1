import { useState, useMemo } from "react";
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
import { handleError, NetworkError, ValidationError } from "@/utils/error-handler";
import { useTemplateValidation } from "@/hooks/use-template-validation";
import TemplateGenerateButton from "./template-generate-button";

// Import lazy-loaded template components
import {
  LazyBattleRoyaleTemplate,
  LazyBasics101Template,
  LazyMythBusterTemplate,
  LazyTechnicalGuideTemplate,
  LazyCaseAgainstTemplate,
  LazyChecklistTemplate
} from "./lazy-templates";

// Import types
import {
  ContentType,
  ToneType,
  LengthType,
  PlatformType,
  TemplateType,
  TemplateData
} from "@/types/templates";

const formSchema = z.object({
  contentType: z.enum(['text', 'image', 'both'] as const),
  platform: z.enum(['blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest'] as const),
  prompt: z.string().min(5, "Prompt must be at least 5 characters").optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous'] as const),
  length: z.enum(['short', 'medium', 'long'] as const),
  template: z.enum(['standard', 'battle-royale', 'basics-101', 'myth-buster', 'technical-guide', 'case-against', 'checklist'] as const).optional(),
  personality: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  onContentCreated: () => void;
}

export default function CreateContentModal({ open, onClose, onContentCreated }: CreateContentModalProps) {
  const { toast } = useToast();
  const { validateTemplate } = useTemplateValidation();
  
  // State management
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
  const [templateData, setTemplateData] = useState<TemplateData>({});
  
  // Form setup with validation
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
  
  // Generate content mutation with improved error handling
  const generateContentMutation = useMutation({
    mutationFn: async (data: FormValues & { templateData?: TemplateData }) => {
      try {
        const requestData = {
          ...data,
          templateData: selectedTemplate !== 'standard' ? templateData : undefined
        };
        const res = await apiRequest("POST", "/api/content/generate", requestData);
        
        if (!res.ok) {
          throw await handleError(new NetworkError(`Request failed with status ${res.status}`, res.status));
        }
        
        return res.json();
      } catch (error) {
        throw handleError(error);
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
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      setGenerating(false);
    }
  });
  
  // Save content mutation with improved error handling
  const saveContentMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      textContent?: string;
      imageUrl?: string;
      additionalImages?: string[];
      contentType: ContentType;
      template?: TemplateType;
      templateData?: TemplateData;
    }) => {
      try {
        const res = await apiRequest("POST", "/api/content", data);
        
        if (!res.ok) {
          throw await handleError(new NetworkError(`Request failed with status ${res.status}`, res.status));
        }
        
        return res.json();
      } catch (error) {
        throw handleError(error);
      }
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
  
  // Memoized template components map
  const templateComponents = useMemo(() => ({
    'battle-royale': LazyBattleRoyaleTemplate,
    'basics-101': LazyBasics101Template,
    'myth-buster': LazyMythBusterTemplate,
    'technical-guide': LazyTechnicalGuideTemplate,
    'case-against': LazyCaseAgainstTemplate,
    'checklist': LazyChecklistTemplate,
  }), []);
  
  const onSubmit = (values: FormValues) => {
    console.log("Form submit triggered with values:", values);
    console.log("Selected template:", selectedTemplate);
    console.log("Template data:", templateData);
    
    try {
      // Use the validation hook to validate the template data
      if (selectedTemplate !== 'standard') {
        if (!validateTemplate(selectedTemplate, templateData)) {
          return; // Validation failed, hook already displayed an error toast
        }
      } else if (!values.prompt || values.prompt.length < 5) {
        toast({
          title: "Invalid Prompt",
          description: "Please enter a prompt with at least 5 characters",
          variant: "destructive",
        });
        return;
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
      generateContentMutation.mutate(payload as FormValues & { templateData?: TemplateData });
      
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
      additionalImages: generatedContent.additionalImages,
      contentType: form.getValues().contentType as ContentType,
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

  const handleTemplateDataChange = (data: TemplateData) => {
    setTemplateData(data);
  };
  
  // Render the current template component
  const renderTemplateComponent = () => {
    if (selectedTemplate === 'standard') {
      return (
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
      );
    }
    
    // For template-specific components
    const TemplateComponent = templateComponents[selectedTemplate];
    if (!TemplateComponent) {
      return null;
    }
    
    return (
      <TemplateComponent
        formData={templateData}
        onChange={handleTemplateDataChange}
        onGenerateContent={(templateData: TemplateData) => {
          try {
            console.log(`${selectedTemplate} direct generate triggered`);
            
            // Create submission data
            const directSubmission = {
              contentType: form.getValues().contentType || "both",
              platform: form.getValues().platform || "blog",
              tone: form.getValues().tone || "professional",
              length: form.getValues().length || "medium",
              template: selectedTemplate,
              templateData
            };
            
            console.log(`Direct ${selectedTemplate} submission:`, JSON.stringify(directSubmission, null, 2));
            
            // Validate
            if (!validateTemplate(selectedTemplate, templateData)) {
              return;
            }
            
            // Submit directly
            setGenerating(true);
            generateContentMutation.mutate(directSubmission as FormValues & { templateData?: TemplateData });
          } catch (error) {
            console.error(`Error in ${selectedTemplate} direct submission:`, error);
            toast({
              title: "Submission Error",
              description: `There was an error submitting the ${selectedTemplate} template. Please try again.`,
              variant: "destructive",
            });
          }
        }}
      />
    );
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
            {renderTemplateComponent()}
            
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
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated Content</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setRepurposeOpen(true)}
                >
                  Repurpose
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your content"
                className="w-full"
              />
            </div>
            
            {generatedContent.text && (
              <div className="bg-white border rounded-lg p-4 mb-4 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: generatedContent.text }} />
              </div>
            )}
            
            {generatedContent.imageUrl && (
              <div className="border rounded-lg overflow-hidden mb-4">
                <img src={generatedContent.imageUrl} alt="Generated content" className="w-full h-auto" />
              </div>
            )}
            
            {generatedContent.additionalImages && generatedContent.additionalImages.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Additional Images</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {generatedContent.additionalImages.map((img, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img src={img} alt={`Additional image ${index + 1}`} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 mt-4">
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary-dark text-white"
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
          </div>
        )}
      </DialogContent>
      
      {/* Repurpose Dialog */}
      {generatedContent.text && (
        <RepurposeDialog 
          open={repurposeOpen} 
          onClose={() => setRepurposeOpen(false)}
          content={generatedContent.text}
          title={title}
        />
      )}
    </Dialog>
  );
}