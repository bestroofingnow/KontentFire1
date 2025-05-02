import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Text, Play } from "lucide-react";

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

interface AnimationCreatorProps {
  onAnimationCreated?: (animation: AnimationResult) => void;
  onClose?: () => void;
}

export default function AnimationCreator({ onAnimationCreated, onClose }: AnimationCreatorProps) {
  const [activeTab, setActiveTab] = useState<string>("text-to-animation");
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [motionStyle, setMotionStyle] = useState<string>("default");
  const [numFrames, setNumFrames] = useState<number>(24);
  const [fps, setFps] = useState<number>(8);
  const [looping, setLooping] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<string>("mp4");
  const [width, setWidth] = useState<number>(512);
  const [height, setHeight] = useState<number>(512);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAnimationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/animations", data);
      return await response.json();
    },
    onSuccess: (data: AnimationResult) => {
      toast({
        title: "Animation created",
        description: "Your animation has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/animations"] });
      if (onAnimationCreated) {
        onAnimationCreated(data);
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating animation",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateAnimation = () => {
    const data: any = {
      numFrames,
      fps,
      looping,
      outputFormat,
      width,
      height,
    };

    if (activeTab === "text-to-animation") {
      if (!prompt) {
        toast({
          title: "Prompt required",
          description: "Please enter a text prompt for your animation.",
          variant: "destructive",
        });
        return;
      }
      data.prompt = prompt;
      data.negativePrompt = negativePrompt;
    } else {
      if (!imageUrl) {
        toast({
          title: "Image URL required",
          description: "Please enter an image URL to animate.",
          variant: "destructive",
        });
        return;
      }
      data.imageUrl = imageUrl;
      data.motionStyle = motionStyle;
    }

    createAnimationMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Animation</CardTitle>
        <CardDescription>
          Create animated content from text prompts or existing images
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="text-to-animation" className="flex items-center gap-2">
              <Text size={16} /> Text to Animation
            </TabsTrigger>
            <TabsTrigger value="image-to-animation" className="flex items-center gap-2">
              <Image size={16} /> Image to Animation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text-to-animation">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want to see in your animation..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt (optional)</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="Describe what you don't want to see..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image-to-animation">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  placeholder="Enter URL to an image..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motionStyle">Motion Style</Label>
                <Select value={motionStyle} onValueChange={setMotionStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a motion style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="pan">Pan</SelectItem>
                    <SelectItem value="rotate">Rotate</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border my-6 pt-6">
          <h3 className="text-lg font-medium mb-4">Animation Settings</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="numFrames">Number of Frames: {numFrames}</Label>
              </div>
              <Slider
                id="numFrames"
                min={8}
                max={60}
                step={1}
                value={[numFrames]}
                onValueChange={(value) => setNumFrames(value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="fps">Frames Per Second: {fps}</Label>
              </div>
              <Slider
                id="fps"
                min={1}
                max={30}
                step={1}
                value={[fps]}
                onValueChange={(value) => setFps(value[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
                <Select value={width.toString()} onValueChange={(v) => setWidth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select width" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256px</SelectItem>
                    <SelectItem value="512">512px</SelectItem>
                    <SelectItem value="768">768px</SelectItem>
                    <SelectItem value="1024">1024px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Select value={height.toString()} onValueChange={(v) => setHeight(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256px</SelectItem>
                    <SelectItem value="512">512px</SelectItem>
                    <SelectItem value="768">768px</SelectItem>
                    <SelectItem value="1024">1024px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-start space-x-2 pt-8">
                <Switch
                  id="looping"
                  checked={looping}
                  onCheckedChange={setLooping}
                />
                <Label htmlFor="looping">Looping Animation</Label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateAnimation} 
          disabled={createAnimationMutation.isPending}
          className="flex items-center gap-2"
        >
          {createAnimationMutation.isPending ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Create Animation
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}