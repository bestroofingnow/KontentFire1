import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check } from "lucide-react";

interface RepurposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    title?: string;
    textContent: string;
  };
  sourcePlatform?: string;
}

type Platform = 'blog' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
type Tone = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';

const platformOptions: { value: Platform; label: string }[] = [
  { value: "blog", label: "Blog" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" }
];

const toneOptions: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "humorous", label: "Humorous" }
];

export function RepurposeDialog({ open, onOpenChange, content, sourcePlatform = "blog" }: RepurposeDialogProps) {
  const { toast } = useToast();
  const [targetPlatform, setTargetPlatform] = useState<Platform | "">("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    repurposedContent: string;
    suggestedTitle?: string;
    suggestedHashtags?: string[];
    suggestedImagePrompt?: string;
  } | null>(null);
  const [copied, setCopied] = useState<{ content: boolean; title: boolean; hashtags: boolean }>({
    content: false,
    title: false,
    hashtags: false
  });

  const handleRepurpose = async () => {
    if (!targetPlatform) {
      toast({
        title: "Missing information",
        description: "Please select a target platform",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/content/repurpose", {
        content: content.textContent,
        title: content.title,
        sourcePlatform,
        targetPlatform,
        tone,
        additionalInstructions: additionalInstructions || undefined
      });

      const data = await response.json();
      setResult(data);

      toast({
        title: "Content repurposed",
        description: `Your content has been repurposed for ${targetPlatform}`,
      });
    } catch (error) {
      console.error("Error repurposing content:", error);
      toast({
        title: "Repurposing failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: keyof typeof copied) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Repurpose Content</DialogTitle>
          <DialogDescription>
            Transform your content for different platforms while maintaining your core message.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!result ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourcePlatform" className="mb-2 block">Source Platform</Label>
                  <Select disabled value={sourcePlatform} onValueChange={() => {}}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetPlatform" className="mb-2 block">Target Platform</Label>
                  <Select value={targetPlatform} onValueChange={(value: Platform) => setTargetPlatform(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions
                        .filter(option => option.value !== sourcePlatform)
                        .map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tone" className="mb-2 block">Tone</Label>
                <Select value={tone} onValueChange={(value: Tone) => setTone(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="instructions" className="mb-2 block">Additional Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="E.g., Include a call to action, focus on benefits, use emojis..."
                  className="h-24"
                />
              </div>

              <Button onClick={handleRepurpose} disabled={isLoading || !targetPlatform}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Repurposing...
                  </>
                ) : (
                  "Repurpose Content"
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              {result.suggestedTitle && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Suggested Title</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.suggestedTitle!, 'title')}
                    >
                      {copied.title ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="rounded-md border p-3">{result.suggestedTitle}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Repurposed Content</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.repurposedContent, 'content')}
                  >
                    {copied.content ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="rounded-md border p-3 whitespace-pre-line">{result.repurposedContent}</div>
              </div>

              {result.suggestedHashtags && result.suggestedHashtags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Suggested Hashtags</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.suggestedHashtags!.join(" "), 'hashtags')}
                    >
                      {copied.hashtags ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="rounded-md border p-3 flex flex-wrap gap-2">
                    {result.suggestedHashtags.map((tag, index) => (
                      <span key={index} className="bg-muted text-muted-foreground px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.suggestedImagePrompt && (
                <div className="space-y-2">
                  <Label className="font-semibold">Suggested Image Prompt</Label>
                  <div className="rounded-md border p-3 bg-muted/50 italic">{result.suggestedImagePrompt}</div>
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setResult(null)}>
                  Repurpose Again
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}