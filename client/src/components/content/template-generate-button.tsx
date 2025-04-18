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
      const res = await apiRequest("POST", "/api/content/generate", data);
      return res.json();
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