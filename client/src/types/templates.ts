// Template Types

export type ContentType = 'text' | 'image' | 'both';
export type ToneType = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
export type LengthType = 'short' | 'medium' | 'long';
export type PlatformType = 'blog' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
export type TemplateType = 'standard' | 'battle-royale' | 'basics-101' | 'myth-buster' | 'technical-guide' | 'case-against' | 'checklist';
export type AudienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type PurposeType = 'implementation' | 'troubleshooting' | 'optimization' | 'configuration' | 
  'integration' | 'migration' | 'evaluation' | 'development' | 'preparation' | 'quality assurance' | 
  'maintenance' | 'compliance' | 'onboarding' | 'audit';
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'nice-to-have';

// Base Template Data
export interface BaseTemplateData {
  topic?: string;
  industry?: string;
}

// Battle Royale Template
export interface BattleRoyaleData extends BaseTemplateData {
  option1?: string;
  option2?: string;
  comparisonFocus?: string;
  criteria?: Array<{
    name: string;
    description?: string;
  }>;
  otherOptions?: string[];
}

// Basics 101 Template
export interface Basics101Data extends BaseTemplateData {
  keyPoints?: string[];
  commonMisconceptions?: string[];
  includeHistory?: boolean;
}

// Myth Buster Template
export interface MythBusterData extends BaseTemplateData {
  myths?: Array<{
    mythText: string;
    reality?: string;
  }>;
  includeExamples?: boolean;
  includeResearch?: boolean;
}

// Technical Guide Template
export interface TechnicalGuideData extends BaseTemplateData {
  audience?: AudienceLevel;
  purpose?: PurposeType;
  prerequisites?: string[];
  sections?: Array<{
    title: string;
    content?: string;
  }>;
  includeTroubleshooting?: boolean;
  includeResourceList?: boolean;
}

// Case Against Template
export interface CaseAgainstData extends BaseTemplateData {
  audienceBeliefs?: string;
  mainArguments?: Array<{
    text: string;
    evidence?: string;
  }>;
  includeCounterarguments?: boolean;
  includeAlternatives?: boolean;
}

// Checklist Template
export interface ChecklistData extends BaseTemplateData {
  purpose?: PurposeType;
  items?: Array<{
    text: string;
    importance?: ImportanceLevel;
    guidance?: string;
  }>;
  includeScoring?: boolean;
  includePrioritization?: boolean;
  includeResources?: boolean;
}

// Union type for all template data types
export type TemplateData = 
  | BattleRoyaleData
  | Basics101Data
  | MythBusterData
  | TechnicalGuideData
  | CaseAgainstData
  | ChecklistData;

// Template Props interface
export interface TemplateProps<T extends TemplateData> {
  formData: T;
  onChange: (newData: T) => void;
  onGenerateContent?: (formData: T) => void;
}