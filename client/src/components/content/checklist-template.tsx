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

interface ChecklistTemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

interface ChecklistItem {
  text: string;
  importance?: string;
  guidance?: string;
}

export default function ChecklistTemplate({ formData, onChange, onGenerateContent }: ChecklistTemplateProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    formData.items || []
  );

  // Industry segments for dropdown
  const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Manufacturing", 
    "Retail", "Education", "Food Service", "Transportation", "Construction",
    "Energy", "Entertainment", "Agriculture", "Hospitality", "Legal Services"
  ];

  // Purpose options
  const purposeOptions = [
    "evaluation", "preparation", "troubleshooting", "quality assurance", 
    "maintenance", "compliance", "onboarding", "audit"
  ];

  // Importance levels
  const importanceLevels = [
    "critical", "high", "medium", "nice-to-have"
  ];

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value };
    onChange(updatedData);
  };

  const handleItemTextChange = (index: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], text: value };
    setItems(updatedItems);
    onChange({ ...formData, items: updatedItems });
  };

  const handleImportanceChange = (index: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], importance: value };
    setItems(updatedItems);
    onChange({ ...formData, items: updatedItems });
  };

  const handleGuidanceChange = (index: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], guidance: value };
    setItems(updatedItems);
    onChange({ ...formData, items: updatedItems });
  };

  const handleAddItem = () => {
    if (!formData.newItemText) return;
    
    const newItem: ChecklistItem = { 
      text: formData.newItemText,
      importance: formData.newItemImportance || "",
      guidance: formData.newItemGuidance || ""
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange({ 
      ...formData, 
      items: updatedItems,
      newItemText: '',
      newItemImportance: '',
      newItemGuidance: ''
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onChange({ ...formData, items: updatedItems });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const updatedData = { ...formData, [field]: checked };
    onChange(updatedData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Checklist Template</Label>
        <p className="text-gray-600 text-sm">
          Create a systematic evaluation or preparation framework.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Checklist Topic</Label>
        <Input
          id="topic"
          value={formData.topic || ''}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="What is this checklist for? (e.g., 'Website Launch')"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purpose">Checklist Purpose</Label>
          <Select 
            value={formData.purpose || 'evaluation'} 
            onValueChange={(value) => handleFieldChange('purpose', value)}
          >
            <SelectTrigger id="purpose">
              <SelectValue placeholder="Select checklist purpose" />
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
      </div>

      <div className="space-y-4">
        <Label>Checklist Items</Label>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Add items to your checklist. If none are provided, we'll research and create relevant checklist items for you.</p>
        )}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-2 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`item-${index}`} className="text-sm">Item #{index + 1}</Label>
                  <Input
                    id={`item-${index}`}
                    value={item.text}
                    onChange={(e) => handleItemTextChange(index, e.target.value)}
                    placeholder="What to check or verify"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="h-10 w-10 text-destructive mt-6"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`importance-${index}`} className="text-sm">Importance Level</Label>
                <Select 
                  value={item.importance || ''} 
                  onValueChange={(value) => handleImportanceChange(index, value)}
                >
                  <SelectTrigger id={`importance-${index}`} className="mt-1">
                    <SelectValue placeholder="Select importance (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {importanceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor={`guidance-${index}`} className="text-sm">Guidance (optional)</Label>
                <Textarea
                  id={`guidance-${index}`}
                  value={item.guidance || ''}
                  onChange={(e) => handleGuidanceChange(index, e.target.value)}
                  placeholder="Tips on how to properly assess this item (optional)"
                  className="mt-1 h-20"
                />
              </div>
            </div>
          ))}
          
          <div className="space-y-2 border rounded-md p-3">
            <Label htmlFor="newItemText" className="text-sm">Add a New Checklist Item</Label>
            <Input
              id="newItemText"
              value={formData.newItemText || ''}
              onChange={(e) => handleFieldChange('newItemText', e.target.value)}
              placeholder="What to check or verify"
              className="mb-2"
            />
            
            <Label htmlFor="newItemImportance" className="text-sm">Importance Level</Label>
            <Select 
              value={formData.newItemImportance || ''} 
              onValueChange={(value) => handleFieldChange('newItemImportance', value)}
            >
              <SelectTrigger id="newItemImportance" className="mb-2">
                <SelectValue placeholder="Select importance (optional)" />
              </SelectTrigger>
              <SelectContent>
                {importanceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Label htmlFor="newItemGuidance" className="text-sm">Guidance (optional)</Label>
            <Textarea
              id="newItemGuidance"
              value={formData.newItemGuidance || ''}
              onChange={(e) => handleFieldChange('newItemGuidance', e.target.value)}
              placeholder="Tips on how to properly assess this item (optional)"
              className="mb-2 h-20"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddItem}
              disabled={!formData.newItemText}
              className="w-full flex items-center justify-center text-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Checklist Item
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Additional Elements</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeScoring" 
              checked={formData.includeScoring !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeScoring', !!checked)}
            />
            <Label htmlFor="includeScoring" className="cursor-pointer">Include Scoring System</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includePrioritization" 
              checked={formData.includePrioritization !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includePrioritization', !!checked)}
            />
            <Label htmlFor="includePrioritization" className="cursor-pointer">Include Prioritization Guidance</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeResources" 
              checked={formData.includeResources !== false}
              onCheckedChange={(checked) => handleCheckboxChange('includeResources', !!checked)}
            />
            <Label htmlFor="includeResources" className="cursor-pointer">Include Resource Recommendations</Label>
          </div>
        </div>
      </div>
      
      {/* Direct generate button */}
      {onGenerateContent && (
        <div className="border-t pt-4 mt-4">
          <Button 
            type="button" 
            onClick={() => {
              console.log("Checklist generate button clicked");
              
              // Validate required fields
              if (!formData.topic) {
                alert("Please enter a topic for the checklist");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Checklist Content
          </Button>
        </div>
      )}
    </div>
  );
}