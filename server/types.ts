/**
 * Type definitions for content generation
 */

export interface ContentPrompt {
  prompt?: string;
  contentType?: 'text' | 'image' | 'both';
  tone?: string;
  length?: string;
  personality?: string;
  platform?: string;
  template?: string;
  templateData?: any;
}

export interface SourceReference {
  title: string;
  url: string;
  snippet?: string;
}

export interface GeneratedContent {
  text?: string;
  title?: string;
  imageUrl?: string;
  sources?: SourceReference[];
  metadata?: any;
}