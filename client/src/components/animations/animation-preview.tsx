import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnimationResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  format: string;
  width: number;
  height: number;
  frames: number;
  duration: number;
  createdAt: Date;
}

interface AnimationPreviewProps {
  animation: AnimationResult;
  onClose?: () => void;
  onUseAnimation?: (url: string) => void;
}

export default function AnimationPreview({ animation, onClose, onUseAnimation }: AnimationPreviewProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + animation.url)
      .then(() => {
        setCopied(true);
        toast({
          title: "URL copied",
          description: "Animation URL copied to clipboard",
        });
      })
      .catch((err) => {
        toast({
          title: "Copy failed",
          description: "Could not copy URL to clipboard",
          variant: "destructive",
        });
      });
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = animation.url;
    link.download = `animation-${animation.id}.${animation.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseAnimation = () => {
    if (onUseAnimation) {
      onUseAnimation(animation.url);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Animation Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div 
          className="w-full aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4 flex items-center justify-center"
          style={{ maxWidth: "400px" }}
        >
          {animation.format === "mp4" ? (
            <video 
              src={animation.url} 
              autoPlay 
              loop 
              muted 
              controls 
              className="w-full h-full object-contain"
            />
          ) : (
            <img 
              src={animation.url} 
              alt="Generated animation" 
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dimensions:</span>
            <span>{animation.width} × {animation.height}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frames:</span>
            <span>{animation.frames}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span>{animation.duration.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Format:</span>
            <span>{animation.format.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" onClick={handleCopyUrl} className="flex-1">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        <Button className="w-full" onClick={handleUseAnimation}>
          Use Animation
        </Button>
        {onClose && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}