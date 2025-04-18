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

interface TechnicalGuideTemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

export default function TechnicalGuideTemplate({ formData, onChange, onGenerateContent }: TechnicalGuideTemplateProps) {
  const [prerequisites, setPrerequisites] = useState<string[]>(
    formData.prerequisites || []
  );
  
  const [sections, setSections] = useState<{title: string, content?: string}[]>(
    formData.sections || []
  );

  // Industry segments for dropdown
  const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Manufacturing", 
    "Retail", "Education", "Food Service", "Transportation", "Construction",
    "Energy", "Entertainment", "Agriculture", "Hospitality", "Legal Services"
  ];

  // Audience levels
  const audienceLevels = [
    "beginner", "intermediate", "advanced", "expert"
  ];

  // Purpose options
  const purposeOptions = [
    "implementation", "troubleshooting", "optimization", "configuration", 
    "integration", "migration", "evaluation", "development"
  ];

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    onChange(updatedData);
  };

  const handlePrerequisiteChange = (index: number, value: string) => {
    const updatedPrereqs = [...prerequisites];
    updatedPrereqs[index] = value;
    setPrerequisites(updatedPrereqs);
    onChange({ ...formData, prerequisites: updatedPrereqs });
  };

  const handleAddPrerequisite = () => {
    if (!formData.newPrerequisite) return;
    
    const updatedPrereqs = [...prerequisites, formData.newPrerequisite];
    setPrerequisites(updatedPrereqs);
    onChange({ 
      ...formData, 
      prerequisites: updatedPrereqs,
      newPrerequisite: ''
    });
  };

  const handleRemovePrerequisite = (index: number) => {
    const updatedPrereqs = prerequisites.filter((_, i) => i !== index);
    setPrerequisites(updatedPrereqs);
    onChange({ ...formData, prerequisites: updatedPrereqs });
  };

  const handleSectionTitleChange = (index: number, value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], title: value };
    setSections(updatedSections);
    onChange({ ...formData, sections: updatedSections });
  };

  const handleSectionContentChange = (index: number, value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], content: value };
    setSections(updatedSections);
    onChange({ ...formData, sections: updatedSections });
  };

  const handleAddSection = () => {
    if (!formData.newSectionTitle) return;
    
    const newSection = {
      title: formData.newSectionTitle,
      content: formData.newSectionContent || ""
    };
    
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    onChange({ 
      ...formData, 
      sections: updatedSections,
      newSectionTitle: '',
      newSectionContent: ''
    });
  };

  const handleRemoveSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
    onChange({ ...formData, sections: updatedSections });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updatedData = { ...formData, [field]: checked };
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Technical Guide Template</Label>
        <p className="text-gray-600 text-sm">
          Create a detailed technical walkthrough or implementation guide.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          value={formData.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="The technical topic to explain (e.g., 'Docker Container Setup')"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience Level</Label>
          <Select 
            value={formData.audience || 'intermediate'} 
            onValueChange={(value) => handleFieldChange('audience', value)}
          >
            <SelectTrigger id="audience">
              <SelectValue placeholder="Select audience level" />
            </SelectTrigger>
            <SelectContent>
              {audienceLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Guide Purpose</Label>
          <Select 
            value={formData.purpose || ''} 
            onValueChange={(value) => handleFieldChange('purpose', value)}
          >
            <SelectTrigger id="purpose">
              <SelectValue placeholder="Select guide purpose (optional)" />
            </SelectTrigger>
            <SelectContent>
              {purposeOptions.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Label>Prerequisites</Label>
        <div className="space-y-3">
          {prerequisites.map((prereq, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={prereq}
                onChange={(e) => handlePrerequisiteChange(index, e.target.value)}
                placeholder={`Prerequisite ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemovePrerequisite(index)}
                className="h-10 w-10 text-destructive"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center gap-2">
            <Input
              value={formData.newPrerequisite || ''}
              onChange={(e) => handleFieldChange('newPrerequisite', e.target.value)}
              placeholder="Add a new prerequisite"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddPrerequisite}
              disabled={!formData.newPrerequisite}
              className="h-10 w-10 text-primary"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Custom Sections (Optional)</Label>
        <p className="text-gray-600 text-sm">
          If not specified, a standard technical guide structure will be used.
        </p>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`section-${index}`} className="text-sm">Section Title</Label>
                  <Input
                    id={`section-${index}`}
                    value={section.title}
                    onChange={(e) => handleSectionTitleChange(index, e.target.value)}
                    placeholder="Section title"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveSection(index)}
                  className="h-10 w-10 text-destructive mt-6"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`section-content-${index}`} className="text-sm">Section Content (Optional)</Label>
                <Textarea
                  id={`section-content-${index}`}
                  value={section.content || ''}
                  onChange={(e) => handleSectionContentChange(index, e.target.value)}
                  placeholder="Additional guidance for this section (optional)"
                  className="mt-1 h-20"
                />
              </div>
            </div>
          ))}
          
          <div className="space-y-2 border rounded-md p-3">
            <Label htmlFor="newSectionTitle" className="text-sm">Add a New Section</Label>
            <Input
              id="newSectionTitle"
              value={formData.newSectionTitle || ''}
              onChange={(e) => handleFieldChange('newSectionTitle', e.target.value)}
              placeholder="Section title"
              className="mb-2"
            />
            
            <Label htmlFor="newSectionContent" className="text-sm">Section Content (Optional)</Label>
            <Textarea
              id="newSectionContent"
              value={formData.newSectionContent || ''}
              onChange={(e) => handleFieldChange('newSectionContent', e.target.value)}
              placeholder="Additional guidance for this section (optional)"
              className="mb-2 h-20"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSection}
              disabled={!formData.newSectionTitle}
              className="w-full flex items-center justify-center text-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Elements</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeTroubleshooting" 
              checked={formData.includeTroubleshooting !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeTroubleshooting', !!checked)}
            />
            <Label htmlFor="includeTroubleshooting" className="cursor-pointer">Include Troubleshooting Section</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeResourceList" 
              checked={formData.includeResourceList !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeResourceList', !!checked)}
            />
            <Label htmlFor="includeResourceList" className="cursor-pointer">Include Resource List</Label>
          </div>
        </div>
      </div>
      
      {/* Direct generate button */}
      {onGenerateContent && (
        <div className="border-t pt-4 mt-4">
          <Button 
            type="button" 
            onClick={() => {
              console.log("Technical Guide generate button clicked");
              
              // Validate required fields
              if (!formData.topic) {
                alert("Please enter a topic for the Technical Guide");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Technical Guide Content
          </Button>
        </div>
      )}
    </div>
  );
}