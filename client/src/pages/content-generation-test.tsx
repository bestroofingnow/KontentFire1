import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContentGenerationTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    option1: "Asphalt Shingles",
    option2: "Metal Roofing",
    comparisonFocus: "Roofing Materials",
    industry: "Construction"
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const testBattleRoyale = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/test/battle-royale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template: 'battle-royale',
          templateData: formData,
          tone: 'professional',
          contentType: 'article'
        })
      });

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Server returned non-JSON response:', contentType);
        const text = await response.text();
        console.error('Response body:', text.substring(0, 500) + '...');
        throw new Error('Server returned an invalid response format. Expected JSON.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate content');
      }
      
      setResult(data);
      toast({
        title: "Content Generated",
        description: "Battle Royale content was successfully generated.",
      });
    } catch (err: any) {
      console.error("Error testing Battle Royale template:", err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Generation Failed",
        description: err.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Content Generation Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Battle Royale Template Test</CardTitle>
            <CardDescription>
              Tests content generation using the Battle Royale template,
              which has a fallback mechanism for reliable operation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="option1">Option 1</Label>
              <Input 
                id="option1" 
                name="option1"
                value={formData.option1}
                onChange={handleInputChange}
                placeholder="E.g., Asphalt Shingles"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="option2">Option 2</Label>
              <Input 
                id="option2" 
                name="option2"
                value={formData.option2}
                onChange={handleInputChange}
                placeholder="E.g., Metal Roofing"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comparisonFocus">Comparison Focus</Label>
              <Input 
                id="comparisonFocus" 
                name="comparisonFocus"
                value={formData.comparisonFocus}
                onChange={handleInputChange}
                placeholder="E.g., Roofing Materials"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input 
                id="industry" 
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="E.g., Construction"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={testBattleRoyale} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : "Test Battle Royale Template"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Generation Result</CardTitle>
            <CardDescription>
              The response from the content generation API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md border border-destructive">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-destructive">Error</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Title</h3>
                  <p>{result.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Content</h3>
                  <Textarea
                    value={result.text}
                    readOnly
                    className="h-96 font-mono text-sm"
                  />
                </div>
                
                <div className="p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Content generation successful
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Run the test to see results here
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}