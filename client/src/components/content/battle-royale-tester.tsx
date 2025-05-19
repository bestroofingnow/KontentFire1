import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BattleRoyaleTester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Simple test data for Battle Royale template
      const testData = {
        contentType: "text",
        platform: "blog",
        tone: "professional",
        length: "medium",
        template: "battle-royale",
        templateData: {
          option1: "Metal Roofing",
          option2: "Asphalt Shingles",
          industry: "construction",
          comparisonFocus: "roofing materials"
        }
      };
      
      console.log("Testing Battle Royale with data:", JSON.stringify(testData, null, 2));

      // Use direct fetch for better control
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      // Check if there was a response
      if (!response) {
        throw new Error("No response received from server");
      }

      // Log raw response for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      // Check content type
      const contentType = response.headers.get('content-type');
      console.log("Content type:", contentType);

      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.log("Confirmed HTML content in response:", htmlContent.substring(0, 200) + "...");
        throw new Error("Server returned HTML instead of JSON. This indicates a server-side issue.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Success! Battle Royale response:", data);
      setResult(data);
      
      toast({
        title: "Test Successful",
        description: "Battle Royale template test succeeded!",
      });
    } catch (err) {
      console.error("Battle Royale test error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      
      toast({
        title: "Test Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Battle Royale Template Tester</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleTest} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Battle Royale Template"
          )}
        </Button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="font-bold mb-2">Result:</h3>
            <div className="p-4 bg-gray-100 rounded-md max-h-[400px] overflow-auto">
              <h4 className="font-bold">{result.title || "No title"}</h4>
              {result.text ? (
                <div className="whitespace-pre-wrap mt-2">{result.text}</div>
              ) : (
                <p>No content returned</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}