import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle } from "lucide-react";

interface Basics101TemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

export default function Basics101Template({ formData, onChange, onGenerateContent }: Basics101TemplateProps) {
  const [keyPoints, setKeyPoints] = useState<string[]>(
    formData.keyPoints || []
  );

  // Industry segments for dropdown
  const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Manufacturing", 
    "Retail", "Education", "Food Service", "Transportation", "Construction",
    "Energy", "Entertainment", "Agriculture", "Hospitality", "Legal Services"
  ];

  // Target audience options
  const audienceOptions = [
    "beginners", "intermediate users", "students", "professionals", "executives", 
    "entrepreneurs", "consumers", "small business owners", "educators"
  ];

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    onChange(updatedData);
  };

  const handleKeyPointChange = (index: number, value: string) => {
    const updatedPoints = [...keyPoints];
    updatedPoints[index] = value;
    setKeyPoints(updatedPoints);
    onChange({ ...formData, keyPoints: updatedPoints });
  };

  const handleAddKeyPoint = () => {
    if (!formData.newKeyPoint) return;
    
    const updatedPoints = [...keyPoints, formData.newKeyPoint];
    setKeyPoints(updatedPoints);
    onChange({ 
      ...formData, 
      keyPoints: updatedPoints,
      newKeyPoint: ''
    });
  };

  const handleRemoveKeyPoint = (index: number) => {
    const updatedPoints = keyPoints.filter((_, i) => i !== index);
    setKeyPoints(updatedPoints);
    onChange({ ...formData, keyPoints: updatedPoints });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updatedData = { ...formData, [field]: checked };
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Basics 101 Template</Label>
        <p className="text-gray-600 text-sm">
          Create foundational educational content about a topic for beginners.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          value={formData.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="The main topic to explain (e.g., 'Search Engine Optimization')"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select 
          value={formData.industry || ''} 
          onValueChange={(value) => handleFieldChange('industry', value)}
        >
          <SelectTrigger id="industry">
            <SelectValue placeholder="Select industry (optional)" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry.toLowerCase()}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Select 
          value={formData.targetAudience || 'beginners'} 
          onValueChange={(value) => handleFieldChange('targetAudience', value)}
        >
          <SelectTrigger id="targetAudience">
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            {audienceOptions.map((audience) => (
              <SelectItem key={audience} value={audience}>
                {audience.charAt(0).toUpperCase() + audience.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label>Key Learning Points</Label>
        <div className="space-y-3">
          {keyPoints.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={point}
                onChange={(e) => handleKeyPointChange(index, e.target.value)}
                placeholder={`Key point ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveKeyPoint(index)}
                className="h-10 w-10 text-destructive"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center gap-2">
            <Input
              value={formData.newKeyPoint || ''}
              onChange={(e) => handleFieldChange('newKeyPoint', e.target.value)}
              placeholder="Add a new key learning point"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddKeyPoint}
              disabled={!formData.newKeyPoint}
              className="h-10 w-10 text-primary"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Optional Sections</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeFAQ" 
              checked={formData.includeFAQ !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeFAQ', !!checked)}
            />
            <Label htmlFor="includeFAQ" className="cursor-pointer">Include FAQ Section</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeHistory" 
              checked={formData.includeHistory !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeHistory', !!checked)}
            />
            <Label htmlFor="includeHistory" className="cursor-pointer">Include Historical Context</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeExamples" 
              checked={formData.includeExamples !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeExamples', !!checked)}
            />
            <Label htmlFor="includeExamples" className="cursor-pointer">Include Practical Examples</Label>
          </div>
        </div>
      </div>
      
      {/* Direct generate button */}
      {onGenerateContent && (
        <div className="border-t pt-4 mt-4">
          <Button 
            type="button" 
            onClick={() => {
              console.log("Generate button clicked");
              
              // Validate required fields
              if (!formData.topic) {
                alert("Please enter a topic for the Basics 101 article");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Basics 101 Content
          </Button>
        </div>
      )}
    </div>
  );
}