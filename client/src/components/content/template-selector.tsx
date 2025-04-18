import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, Columns, BookOpen, AlertCircle, FileCode, ThumbsDown, CheckSquare } from "lucide-react";

interface TemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const templates: TemplateOption[] = [
    {
      id: "standard",
      name: "Standard Article",
      description: "Free-form content with custom structure",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: "battle-royale",
      name: "Battle Royale",
      description: "Compare two options across multiple categories",
      icon: <Columns className="h-5 w-5" />,
    },
    {
      id: "basics-101",
      name: "Basics 101",
      description: "Educational content explaining fundamental concepts",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: "myth-buster",
      name: "Myth Buster",
      description: "Identify and correct common misconceptions",
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      id: "technical-guide",
      name: "Technical Guide",
      description: "Detailed explanation of complex topics",
      icon: <FileCode className="h-5 w-5" />,
    },
    {
      id: "case-against",
      name: "The Case Against",
      description: "Challenge conventional approaches",
      icon: <ThumbsDown className="h-5 w-5" />,
    },
    {
      id: "checklist",
      name: "Checklist",
      description: "Systematic evaluation framework",
      icon: <CheckSquare className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Label className="block text-gray-700 font-medium mb-2">Content Template</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {templates.map((template) => (
          <Label
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
              value === template.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <RadioGroupItem value={template.id} className="sr-only" />
            <div className="flex items-start">
              <div className={`mr-3 text-gray-600 ${value === template.id ? "text-primary" : ""}`}>
                {template.icon}
              </div>
              <div>
                <h3 className={`font-medium ${value === template.id ? "text-primary" : "text-gray-900"}`}>
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
            </div>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}