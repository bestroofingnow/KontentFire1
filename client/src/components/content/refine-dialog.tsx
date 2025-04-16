import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RefineDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  content: {
    title?: string;
    textContent: string;
  };
  triggerLabel?: string;
};

export function RefineDialog({
  open,
  onOpenChange,
  content,
  triggerLabel = "Refine with Claude"
}: RefineDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(open || false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalContent, setOriginalContent] = useState(content.textContent);
  const [refinedContent, setRefinedContent] = useState("");
  const [activeSources, setActiveSources] = useState<Array<{title: string, url: string, snippet: string}>>([]);
  const [tone, setTone] = useState("professional");
  const [personality, setPersonality] = useState("thoughtful");
  const [platform, setPlatform] = useState("blog");

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const handleRefine = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/content/refine", {
        content: originalContent,
        tone,
        personality,
        platform
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setRefinedContent(data.refinedContent);
      setActiveSources(data.sources || []);
      
      toast({
        title: "Content Refined",
        description: "Your content has been enhanced with Claude AI.",
      });
    } catch (error) {
      console.error("Failed to refine content:", error);
      toast({
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The refined content has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {triggerLabel && (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs px-3 py-1 rounded text-violet-600 border-violet-600 hover:bg-violet-50 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refine Content with Claude AI</DialogTitle>
          <DialogDescription>
            Enhance your content with AI to make it more engaging, human-like, and informative.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="personality">Personality</Label>
              <Select value={personality} onValueChange={setPersonality}>
                <SelectTrigger id="personality">
                  <SelectValue placeholder="Select personality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thoughtful">Thoughtful</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="skeptical">Skeptical</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                  <SelectItem value="gmb">Google My Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="original" className="mt-2">
            <TabsList>
              <TabsTrigger value="original">Original Content</TabsTrigger>
              <TabsTrigger value="refined" disabled={!refinedContent}>
                Refined Content
              </TabsTrigger>
              <TabsTrigger value="sources" disabled={!activeSources.length}>
                Sources ({activeSources.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="original">
              <Textarea
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </TabsContent>
            <TabsContent value="refined">
              <div className="relative">
                <Textarea
                  value={refinedContent}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(refinedContent)}
                >
                  Copy
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="sources">
              <div className="space-y-4 p-2">
                {activeSources.length > 0 ? (
                  activeSources.map((source, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-2">
                      <h4 className="font-medium text-sm">{source.title}</h4>
                      <p className="text-sm text-gray-600">{source.snippet}</p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Link className="h-3 w-3" />
                        {source.url}
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No sources available yet. Generate refined content first.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleRefine}
            disabled={isLoading || !originalContent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refining...
              </>
            ) : (
              "Refine with Claude"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RefineDialog;