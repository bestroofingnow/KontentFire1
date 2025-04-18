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

interface BattleRoyaleTemplateProps {
  formData: any;
  onChange: (newData: any) => void;
  onGenerateContent?: (formData: any) => void;
}

export default function BattleRoyaleTemplate({ formData, onChange, onGenerateContent }: BattleRoyaleTemplateProps) {
  const [rounds, setRounds] = useState<string[]>(
    formData.rounds || ["costs", "durability", "performance", "maintenance", "sustainability"]
  );

  const roundLabels: Record<string, string> = {
    costs: "Initial Costs & Installation",
    durability: "Durability & Lifespan",
    performance: "Performance Factors",
    maintenance: "Maintenance Requirements",
    sustainability: "Sustainability Credentials",
    specialized: "Specialized Applications",
  };

  // Industry segments for dropdown
  const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Manufacturing", 
    "Retail", "Education", "Food Service", "Transportation", "Construction",
    "Energy", "Entertainment", "Agriculture", "Hospitality", "Legal Services"
  ];

  const handleOptionChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    onChange(updatedData);
  };

  const handleRoundToggle = (round: string, checked: boolean) => {
    let updatedRounds;
    if (checked) {
      updatedRounds = [...rounds, round];
    } else {
      updatedRounds = rounds.filter(r => r !== round);
    }
    
    setRounds(updatedRounds);
    onChange({ ...formData, rounds: updatedRounds });
  };

  const handleAddCustomRound = () => {
    if (!formData.customRound || !formData.customRoundTitle) return;
    
    const customRoundKey = formData.customRound.toLowerCase().replace(/\s+/g, '-');
    const updatedRounds = [...rounds, customRoundKey];
    roundLabels[customRoundKey] = formData.customRoundTitle;
    
    setRounds(updatedRounds);
    onChange({ 
      ...formData, 
      rounds: updatedRounds,
      customRound: '',
      customRoundTitle: '',
      roundLabels: { ...roundLabels, [customRoundKey]: formData.customRoundTitle }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Battle Royale Template</Label>
        <p className="text-gray-600 text-sm">
          Compare two options across multiple categories to determine a clear winner.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="option1">Option 1 Name</Label>
          <Input
            id="option1"
            value={formData.option1 || ''}
            onChange={(e) => handleOptionChange('option1', e.target.value)}
            placeholder="First option to compare"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="option2">Option 2 Name</Label>
          <Input
            id="option2"
            value={formData.option2 || ''}
            onChange={(e) => handleOptionChange('option2', e.target.value)}
            placeholder="Second option to compare"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select 
          value={formData.industry || ''} 
          onValueChange={(value) => handleOptionChange('industry', value)}
        >
          <SelectTrigger id="industry">
            <SelectValue placeholder="Select industry" />
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
        <Label htmlFor="comparisonFocus">Core Comparison Focus</Label>
        <Input
          id="comparisonFocus"
          value={formData.comparisonFocus || ''}
          onChange={(e) => handleOptionChange('comparisonFocus', e.target.value)}
          placeholder="Main topic being compared (e.g., 'Roofing Materials')"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="introduction">Introduction Context</Label>
        <Textarea
          id="introduction"
          value={formData.introduction || ''}
          onChange={(e) => handleOptionChange('introduction', e.target.value)}
          placeholder="Key context about why this comparison matters (optional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-4">
        <Label>Comparison Rounds</Label>
        <div className="space-y-3">
          {Object.entries(roundLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox 
                id={`round-${key}`} 
                checked={rounds.includes(key)}
                onCheckedChange={(checked) => handleRoundToggle(key, !!checked)}
              />
              <Label htmlFor={`round-${key}`} className="cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <Label>Add Custom Comparison Round</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.customRound || ''}
            onChange={(e) => handleOptionChange('customRound', e.target.value)}
            placeholder="Round topic (e.g., 'Integration Options')"
          />
          <Input
            value={formData.customRoundTitle || ''}
            onChange={(e) => handleOptionChange('customRoundTitle', e.target.value)}
            placeholder="Round title (e.g., 'ROUND 7: INTEGRATION OPTIONS')"
          />
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddCustomRound}
          className="flex items-center text-primary"
          disabled={!formData.customRound || !formData.customRoundTitle}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Custom Round
        </Button>
      </div>
      
      {/* Direct generate button for Battle Royale template */}
      {onGenerateContent && (
        <div className="border-t pt-4 mt-4">
          <Button 
            type="button" 
            onClick={() => {
              console.log("Battle Royale direct generate button clicked");
              
              // Validate required fields
              if (!formData.option1 || !formData.option2 || !formData.comparisonFocus) {
                alert("Please fill in Option 1, Option 2, and Core Comparison Focus fields");
                return;
              }
              
              // Call the generate function with the current formData
              onGenerateContent(formData);
            }}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            Generate Battle Royale Content
          </Button>
        </div>
      )}
    </div>
  );
}