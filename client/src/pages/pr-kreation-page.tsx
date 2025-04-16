import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PRKreationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedPR, setGeneratedPR] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    announcement: "",
    industry: "",
    tone: "professional",
    personality: "thoughtful",
  });

  // Fetch user's company profile if available
  const { data: companyProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/company-profile'],
    queryFn: async () => {
      const response = await fetch('/api/company-profile', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error('Failed to fetch company profile');
        }
        return null;
      }
      
      return response.json();
    },
    retry: false
  });

  // Pre-fill company name and industry if profile exists
  useEffect(() => {
    if (companyProfile) {
      setFormData(prev => ({
        ...prev,
        companyName: companyProfile.companyName || "",
        industry: companyProfile.industry || ""
      }));
    }
  }, [companyProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.announcement) {
      toast({
        title: "Missing information",
        description: "Please provide both company name and announcement details.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setGeneratedPR(null);
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/content/generate", 
        {
          prompt: formData.announcement,
          contentType: "text",
          tone: formData.tone,
          personality: formData.personality,
          platform: "press-release",
          companyName: formData.companyName,
          industry: formData.industry
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to generate press release");
      }
      
      const data = await response.json();
      
      if (data.text) {
        setGeneratedPR(data.text);
        
        toast({
          title: "Press Release Generated",
          description: "Your press release has been created successfully.",
        });
      } else {
        throw new Error("No content was generated");
      }
    } catch (error) {
      console.error("Error generating press release:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your press release. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPR) return;
    
    try {
      const response = await apiRequest(
        "POST",
        "/api/content",
        {
          title: `Press Release: ${formData.companyName} - ${formData.announcement.substring(0, 50)}${formData.announcement.length > 50 ? '...' : ''}`,
          textContent: generatedPR,
          contentType: "text",
          status: "draft",
          platform: "press-release"
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to save press release");
      }
      
      toast({
        title: "Press Release Saved",
        description: "Your press release has been saved to your content library.",
      });
    } catch (error) {
      console.error("Error saving press release:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your press release. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">PR Kreation</h1>
        <p className="text-gray-600">Generate professional press releases for your company announcements.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Create Press Release
              </CardTitle>
              <CardDescription>
                Enter your announcement details to generate a professional press release.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your company name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g. Technology, Healthcare, Finance"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="announcement">Announcement Details</Label>
                  <Textarea
                    id="announcement"
                    name="announcement"
                    value={formData.announcement}
                    onChange={handleInputChange}
                    placeholder="Describe your announcement, product launch, milestone, etc."
                    rows={6}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
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
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !formData.companyName || !formData.announcement}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Press Release"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Generated Press Release</CardTitle>
              <CardDescription>
                Your press release will appear here after generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : generatedPR ? (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: generatedPR }} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8">
                  <FileText className="h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Press Release Generated Yet</h3>
                  <p>Fill out the form and click "Generate Press Release" to create your professional press release.</p>
                </div>
              )}
            </CardContent>
            {generatedPR && (
              <CardFooter className="border-t pt-4">
                <div className="flex flex-col sm:flex-row w-full gap-3">
                  <Button 
                    onClick={handleSave}
                    className="flex-1"
                    variant="outline"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button
                    onClick={() => {
                      if (navigator.clipboard) {
                        // Remove HTML tags for clipboard
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = generatedPR;
                        navigator.clipboard.writeText(tempDiv.textContent || tempDiv.innerText);
                        toast({
                          title: "Copied to Clipboard",
                          description: "Press release has been copied to clipboard.",
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    Copy Text
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}