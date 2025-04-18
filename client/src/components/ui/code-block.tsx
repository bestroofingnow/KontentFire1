import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  title?: string;
  className?: string;
}

/**
 * A formatted code block component with syntax highlighting and copy functionality
 */
export function CodeBlock({
  code,
  language = 'javascript',
  showLineNumbers = true,
  highlightLines = [],
  title,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Split code into lines for line numbering
  const codeLines = code.trim().split('\n');
  
  return (
    <div 
      className={cn(
        'rounded-lg overflow-hidden border border-border bg-muted/50',
        className
      )}
    >
      {/* Header with language badge and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium text-foreground">
              {title}
            </span>
          )}
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
            {language}
          </span>
        </div>
        
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md hover:bg-muted-foreground/10 transition-colors"
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto">
        <pre className="flex">
          {/* Line numbers */}
          {showLineNumbers && (
            <div className="select-none text-right mr-4 text-muted-foreground/60">
              {codeLines.map((_, i) => (
                <div key={i} className="px-2">
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          
          {/* Code with highlighting */}
          <code className="font-mono text-sm flex-1">
            {codeLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  highlightLines.includes(i + 1) && 'bg-primary/10 -mx-4 px-4'
                )}
              >
                {line.length > 0 ? line : ' '}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}