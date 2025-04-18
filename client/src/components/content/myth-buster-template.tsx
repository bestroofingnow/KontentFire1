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

interface MythBusterTemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

interface Myth {
  text: string;
  reality?: string;
}

export default function MythBusterTemplate({ formData, onChange, onGenerateContent }: MythBusterTemplateProps) {
  const [myths, setMyths] = useState<Myth[]>(
    formData.myths || []
  );

  // Industry segments for dropdown
  const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Manufacturing", 
    "Retail", "Education", "Food Service", "Transportation", "Construction",
    "Energy", "Entertainment", "Agriculture", "Hospitality", "Legal Services"
  ];

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    onChange(updatedData);
  };

  const handleMythTextChange = (index: number, value: string) => {
    const updatedMyths = [...myths];
    updatedMyths[index] = { ...updatedMyths[index], text: value };
    setMyths(updatedMyths);
    onChange({ ...formData, myths: updatedMyths });
  };

  const handleRealityChange = (index: number, value: string) => {
    const updatedMyths = [...myths];
    updatedMyths[index] = { ...updatedMyths[index], reality: value };
    setMyths(updatedMyths);
    onChange({ ...formData, myths: updatedMyths });
  };

  const handleAddMyth = () => {
    if (!formData.newMythText) return;
    
    const newMyth: Myth = { 
      text: formData.newMythText,
      reality: formData.newMythReality || ""
    };
    
    const updatedMyths = [...myths, newMyth];
    setMyths(updatedMyths);
    onChange({ 
      ...formData, 
      myths: updatedMyths,
      newMythText: '',
      newMythReality: ''
    });
  };

  const handleRemoveMyth = (index: number) => {
    const updatedMyths = myths.filter((_, i) => i !== index);
    setMyths(updatedMyths);
    onChange({ ...formData, myths: updatedMyths });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updatedData = { ...formData, [field]: checked };
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Myth Buster Template</Label>
        <p className="text-gray-600 text-sm">
          Create content that debunks common misconceptions about a topic.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          value={formData.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="The topic with misconceptions (e.g., 'Artificial Intelligence')"
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

      <div className="space-y-4">
        <Label>Common Myths to Debunk</Label>
        {myths.length === 0 && (
          <p className="text-sm text-muted-foreground">Add myths to debunk in your content. If none are provided, we'll research and identify common misconceptions for you.</p>
        )}
        <div className="space-y-4">
          {myths.map((myth, index) => (
            <div key={index} className="space-y-2 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`myth-${index}`} className="text-sm">Myth #{index + 1}</Label>
                  <Input
                    id={`myth-${index}`}
                    value={myth.text}
                    onChange={(e) => handleMythTextChange(index, e.target.value)}
                    placeholder="The misconception to address"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveMyth(index)}
                  className="h-10 w-10 text-destructive mt-6"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`reality-${index}`} className="text-sm">Reality (optional)</Label>
                <Textarea
                  id={`reality-${index}`}
                  value={myth.reality || ''}
                  onChange={(e) => handleRealityChange(index, e.target.value)}
                  placeholder="The truth that debunks this myth (optional)"
                  className="mt-1 h-20"
                />
              </div>
            </div>
          ))}
          
          <div className="space-y-2 border rounded-md p-3">
            <Label htmlFor="newMythText" className="text-sm">Add a New Myth</Label>
            <Input
              id="newMythText"
              value={formData.newMythText || ''}
              onChange={(e) => handleFieldChange('newMythText', e.target.value)}
              placeholder="Enter a new myth to debunk"
              className="mb-2"
            />
            
            <Label htmlFor="newMythReality" className="text-sm">Reality (optional)</Label>
            <Textarea
              id="newMythReality"
              value={formData.newMythReality || ''}
              onChange={(e) => handleFieldChange('newMythReality', e.target.value)}
              placeholder="The truth that debunks this myth (optional)"
              className="mb-2 h-20"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddMyth}
              disabled={!formData.newMythText}
              className="w-full flex items-center justify-center text-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Myth
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Elements</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeTruthScale" 
              checked={formData.includeTruthScale !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeTruthScale', !!checked)}
            />
            <Label htmlFor="includeTruthScale" className="cursor-pointer">Include Truth Scale Ratings</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeOrigins" 
              checked={formData.includeOrigins !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeOrigins', !!checked)}
            />
            <Label htmlFor="includeOrigins" className="cursor-pointer">Explain Myth Origins</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeExpertQuotes" 
              checked={formData.includeExpertQuotes !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeExpertQuotes', !!checked)}
            />
            <Label htmlFor="includeExpertQuotes" className="cursor-pointer">Include Expert Perspectives</Label>
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
                alert("Please enter a topic for the Myth Buster article");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Myth Buster Content
          </Button>
        </div>
      )}
    </div>
  );
}