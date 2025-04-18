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

interface CaseAgainstTemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

interface Argument {
  text: string;
  evidence?: string;
}

export default function CaseAgainstTemplate({ formData, onChange, onGenerateContent }: CaseAgainstTemplateProps) {
  const [mainArguments, setMainArguments] = useState<Argument[]>(
    formData.mainArguments || []
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

  const handleArgumentTextChange = (index: number, value: string) => {
    const updatedArguments = [...mainArguments];
    updatedArguments[index] = { ...updatedArguments[index], text: value };
    setMainArguments(updatedArguments);
    onChange({ ...formData, mainArguments: updatedArguments });
  };

  const handleEvidenceChange = (index: number, value: string) => {
    const updatedArguments = [...mainArguments];
    updatedArguments[index] = { ...updatedArguments[index], evidence: value };
    setMainArguments(updatedArguments);
    onChange({ ...formData, mainArguments: updatedArguments });
  };

  const handleAddArgument = () => {
    if (!formData.newArgumentText) return;
    
    const newArgument: Argument = { 
      text: formData.newArgumentText,
      evidence: formData.newArgumentEvidence || ""
    };
    
    const updatedArguments = [...mainArguments, newArgument];
    setMainArguments(updatedArguments);
    onChange({ 
      ...formData, 
      mainArguments: updatedArguments,
      newArgumentText: '',
      newArgumentEvidence: ''
    });
  };

  const handleRemoveArgument = (index: number) => {
    const updatedArguments = mainArguments.filter((_, i) => i !== index);
    setMainArguments(updatedArguments);
    onChange({ ...formData, mainArguments: updatedArguments });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updatedData = { ...formData, [field]: checked };
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">The Case Against Template</Label>
        <p className="text-gray-600 text-sm">
          Present a well-reasoned critique or counterargument against a popular idea or practice.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic to Argue Against</Label>
        <Input
          id="topic"
          value={formData.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="The idea, practice, or concept to challenge (e.g., 'Remote Work')"
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
        <Label htmlFor="audienceBeliefs">Audience Beliefs</Label>
        <Textarea
          id="audienceBeliefs"
          value={formData.audienceBeliefs || ''}
          onChange={(e) => handleFieldChange('audienceBeliefs', e.target.value)}
          placeholder="What does your audience currently believe about this topic? (e.g., 'Remote work increases productivity and improves work-life balance')"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Main Arguments Against</Label>
        {mainArguments.length === 0 && (
          <p className="text-sm text-muted-foreground">Add your main arguments against the topic. If none are provided, we'll research and develop arguments for you.</p>
        )}
        <div className="space-y-4">
          {mainArguments.map((argument, index) => (
            <div key={index} className="space-y-2 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`argument-${index}`} className="text-sm">Argument #{index + 1}</Label>
                  <Input
                    id={`argument-${index}`}
                    value={argument.text}
                    onChange={(e) => handleArgumentTextChange(index, e.target.value)}
                    placeholder="Your argument against the topic"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveArgument(index)}
                  className="h-10 w-10 text-destructive mt-6"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`evidence-${index}`} className="text-sm">Evidence/Support (optional)</Label>
                <Textarea
                  id={`evidence-${index}`}
                  value={argument.evidence || ''}
                  onChange={(e) => handleEvidenceChange(index, e.target.value)}
                  placeholder="Evidence, data, or examples that support this argument (optional)"
                  className="mt-1 h-20"
                />
              </div>
            </div>
          ))}
          
          <div className="space-y-2 border rounded-md p-3">
            <Label htmlFor="newArgumentText" className="text-sm">Add a New Argument</Label>
            <Input
              id="newArgumentText"
              value={formData.newArgumentText || ''}
              onChange={(e) => handleFieldChange('newArgumentText', e.target.value)}
              placeholder="Your argument against the topic"
              className="mb-2"
            />
            
            <Label htmlFor="newArgumentEvidence" className="text-sm">Evidence/Support (optional)</Label>
            <Textarea
              id="newArgumentEvidence"
              value={formData.newArgumentEvidence || ''}
              onChange={(e) => handleFieldChange('newArgumentEvidence', e.target.value)}
              placeholder="Evidence, data, or examples that support this argument (optional)"
              className="mb-2 h-20"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddArgument}
              disabled={!formData.newArgumentText}
              className="w-full flex items-center justify-center text-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Argument
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Elements</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeCounterarguments" 
              checked={formData.includeCounterarguments !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeCounterarguments', !!checked)}
            />
            <Label htmlFor="includeCounterarguments" className="cursor-pointer">Address Counterarguments</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeAlternatives" 
              checked={formData.includeAlternatives !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeAlternatives', !!checked)}
            />
            <Label htmlFor="includeAlternatives" className="cursor-pointer">Suggest Better Alternatives</Label>
          </div>
        </div>
      </div>
      
      {/* Direct generate button */}
      {onGenerateContent && (
        <div className="border-t pt-4 mt-4">
          <Button 
            type="button" 
            onClick={() => {
              console.log("Case Against generate button clicked");
              
              // Validate required fields
              if (!formData.topic) {
                alert("Please enter a topic to argue against");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Case Against Content
          </Button>
        </div>
      )}
    </div>
  );
}