import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { TemplateType, TemplateData } from "@/types/templates";

interface TemplateGenerateButtonProps {
  templateType: TemplateType;
  templateData: TemplateData;
  contentType?: string;
  platform?: string;
  tone?: string;
  length?: string;
  className?: string;
  buttonText?: string;
}

export default function TemplateGenerateButton({
  templateType,
  templateData,
  contentType = "both",
  platform = "blog",
  tone = "professional",
  length = "medium",
  className = "",
  buttonText = "Generate Content"
}: TemplateGenerateButtonProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateContentMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      console.log('Submitting template generation with data:', JSON.stringify(data));
      
      try {
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        // Check content type header
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Server returned non-JSON content type:', contentType);
          const text = await res.text();
          console.error('Response body:', text.substring(0, 500) + '...');
          throw new Error('Server returned an invalid response format. Please try again.');
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to generate content');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Template generation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
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

  const handleGenerate = () => {
    try {
      console.log(`${templateType} direct generate triggered`);
      
      // Create submission data directly
      const directSubmission: Record<string, any> = {
        contentType,
        platform,
        tone,
        length,
        template: templateType,
        templateData
      };
      
      console.log(`Direct ${templateType} submission:`, JSON.stringify(directSubmission, null, 2));
      
      // Submit directly
      setGenerating(true);
      generateContentMutation.mutate(directSubmission);
    } catch (error) {
      console.error(`Error in ${templateType} direct submission:`, error);
      toast({
        title: "Submission Error",
        description: `There was an error submitting the ${templateType} template. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      type="button" 
      onClick={handleGenerate}
      className={`w-full bg-primary hover:bg-primary-dark text-white ${className}`}
      disabled={generating}
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}