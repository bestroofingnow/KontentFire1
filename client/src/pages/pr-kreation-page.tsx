import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarIcon, Share } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { apiRequest } from "@/lib/queryClient";

export default function PRKreationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    prompt: "",
    tone: "professional",
    length: "medium",
    personality: "thoughtful"
  });

  // Fetch user on component mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prompt) {
      toast({
        title: "Input required",
        description: "Please enter a press release topic",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/content/generate", {
        ...formData,
        contentType: "text",
        platform: "press-release"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate press release");
      }
      
      const data = await response.json();
      setGeneratedContent(data);
      
      toast({
        title: "Press release generated",
        description: "Your press release has been successfully created",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;
    
    try {
      const response = await apiRequest("POST", "/api/content", {
        title: formData.prompt,
        content: generatedContent.text,
        platform: "press-release",
        contentType: "text",
        metadata: {
          tone: formData.tone,
          personality: formData.personality,
          length: formData.length,
          sources: generatedContent.sources || []
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save press release");
      }
      
      toast({
        title: "Press release saved",
        description: "Your press release has been saved to your content library",
      });
      
      // Reset form and generated content
      setFormData({
        prompt: "",
        tone: "professional",
        length: "medium",
        personality: "thoughtful"
      });
      setGeneratedContent(null);
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSchedule = () => {
    // TODO: Implement scheduling functionality
    toast({
      title: "Coming soon",
      description: "Scheduling for press releases will be available in a future update",
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">PR Kreation</h1>
          <p className="text-gray-500">Create professional press releases with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create a Press Release</CardTitle>
              <CardDescription>
                Enter information about your announcement to generate a press release
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Press Release Topic</Label>
                  <Textarea
                    id="prompt"
                    name="prompt"
                    placeholder="Describe your announcement (e.g., product launch, company milestone, partnership)"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => handleSelectChange("tone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality</Label>
                    <Select
                      value={formData.personality}
                      onValueChange={(value) => handleSelectChange("personality", value)}
                    >
                      <SelectTrigger>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="length">Length</Label>
                    <Select
                      value={formData.length}
                      onValueChange={(value) => handleSelectChange("length", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !user || user.plan !== 'inferno'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Press Release"
                  )}
                </Button>
                
                {user && user.plan !== 'inferno' && (
                  <p className="text-red-500 text-sm text-center">
                    Press release generation requires Inferno plan subscription
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Generated Press Release</CardTitle>
              <CardDescription>
                Preview your press release before saving or publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p>Generating your press release...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
                </div>
              ) : generatedContent ? (
                <div className="prose max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: generatedContent.text }} />
                  
                  {generatedContent.sources && generatedContent.sources.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold">Sources</h3>
                      <ul className="mt-2">
                        {generatedContent.sources.map((source: any, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                  <p className="text-center">
                    Your generated press release will appear here.<br />
                    Complete the form and click "Generate Press Release" to begin.
                  </p>
                </div>
              )}
            </CardContent>
            
            {generatedContent && (
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={handleSave}
                >
                  Save to Library
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={handleSchedule}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent.text.replace(/<[^>]*>/g, ''));
                    toast({
                      title: "Copied!",
                      description: "Press release copied to clipboard",
                    });
                  }}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}