import { useCallback, useMemo } from 'react';
import { TemplateType, TemplateData } from '@/types/templates';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function useTemplateValidation() {
  const { toast } = useToast();
  
  // Memoize the validators to prevent unnecessary recreation
  const validators = useMemo(() => ({
    'standard': (data: any): ValidationResult => {
      if (!data?.prompt || data.prompt.length < 5) {
        return {
          isValid: false,
          errorMessage: "Please enter a prompt with at least 5 characters"
        };
      }
      return { isValid: true };
    },
    
    'battle-royale': (data: any): ValidationResult => {
      if (!data || !data.option1 || !data.option2 || !data.comparisonFocus) {
        return {
          isValid: false,
          errorMessage: "Both options and comparison focus are required for Battle Royale template"
        };
      }
      return { isValid: true };
    },
    
    'basics-101': (data: any): ValidationResult => {
      if (!data || !data.topic) {
        return {
          isValid: false,
          errorMessage: "Topic is required for Basics 101 template"
        };
      }
      return { isValid: true };
    },
    
    'myth-buster': (data: any): ValidationResult => {
      if (!data || !data.topic) {
        return {
          isValid: false,
          errorMessage: "Topic is required for Myth Buster template"
        };
      }
      return { isValid: true };
    },
    
    'technical-guide': (data: any): ValidationResult => {
      if (!data || !data.topic) {
        return {
          isValid: false,
          errorMessage: "Topic is required for Technical Guide template"
        };
      }
      return { isValid: true };
    },
    
    'case-against': (data: any): ValidationResult => {
      if (!data || !data.topic) {
        return {
          isValid: false,
          errorMessage: "Topic is required for Case Against template"
        };
      }
      return { isValid: true };
    },
    
    'checklist': (data: any): ValidationResult => {
      if (!data || !data.topic) {
        return {
          isValid: false,
          errorMessage: "Topic is required for Checklist template"
        };
      }
      return { isValid: true };
    }
  }), []);
  
  const validateTemplate = useCallback((
    templateType: TemplateType, 
    templateData: TemplateData
  ): boolean => {
    const validator = validators[templateType];
    if (!validator) {
      console.error(`No validator found for template type: ${templateType}`);
      return false;
    }
    
    const result = validator(templateData);
    if (!result.isValid && result.errorMessage) {
      toast({
        title: "Missing Required Fields",
        description: result.errorMessage,
        variant: "destructive",
      });
    }
    
    return result.isValid;
  }, [validators, toast]);
  
  return { validateTemplate };
}