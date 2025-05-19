import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function APIDiagnosticPage() {
  const [loading, setLoading] = useState({
    openai: false,
    anthropic: false,
    perplexity: false,
    all: false
  });
  const [results, setResults] = useState<any>({});
  const { toast } = useToast();

  const testAPI = async (service: 'openai' | 'anthropic' | 'perplexity' | 'all') => {
    setLoading(prev => ({ ...prev, [service]: true }));
    
    try {
      const response = await fetch(`/api/test/${service}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API test failed: ${errorText}`);
      }
      
      const data = await response.json();
      setResults(prev => ({ ...prev, [service]: data }));
      
      toast({
        title: `${service.charAt(0).toUpperCase() + service.slice(1)} API Test Complete`,
        description: data.success ? "API key is valid!" : "API key validation failed",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error(`Error testing ${service} API:`, error);
      setResults(prev => ({ 
        ...prev, 
        [service]: { 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        } 
      }));
      
      toast({
        title: `${service.charAt(0).toUpperCase() + service.slice(1)} API Test Failed`,
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [service]: false }));
    }
  };

  const requestNewKeys = async (service: 'openai' | 'anthropic' | 'perplexity') => {
    toast({
      title: `${service.charAt(0).toUpperCase() + service.slice(1)} API Key`,
      description: "Please contact your administrator to update the API key.",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API Diagnostic Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              OpenAI API
              {results.openai && (
                results.openai.success ? 
                <CheckCircle className="text-green-500" /> : 
                <XCircle className="text-red-500" />
              )}
            </CardTitle>
            <CardDescription>Tests connection to GPT-4o model</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => testAPI('openai')} 
              disabled={loading.openai}
              className="w-full mb-2"
            >
              {loading.openai ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : "Test OpenAI API"}
            </Button>
            
            {results.openai && !results.openai.success && (
              <Button 
                variant="outline" 
                onClick={() => requestNewKeys('openai')}
                className="w-full"
              >
                Request New Key
              </Button>
            )}
            
            {results.openai && (
              <div className="mt-4">
                {results.openai.success ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>OpenAI API is working!</AlertTitle>
                    <AlertDescription>
                      Model: {results.openai.model || "gpt-4o"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>API Key Error</AlertTitle>
                    <AlertDescription>
                      {results.openai.error || "Failed to validate API key"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Anthropic API
              {results.anthropic && (
                results.anthropic.success ? 
                <CheckCircle className="text-green-500" /> : 
                <XCircle className="text-red-500" />
              )}
            </CardTitle>
            <CardDescription>Tests connection to Claude 3.7 model</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => testAPI('anthropic')} 
              disabled={loading.anthropic}
              className="w-full mb-2"
            >
              {loading.anthropic ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : "Test Anthropic API"}
            </Button>
            
            {results.anthropic && !results.anthropic.success && (
              <Button 
                variant="outline" 
                onClick={() => requestNewKeys('anthropic')}
                className="w-full"
              >
                Request New Key
              </Button>
            )}
            
            {results.anthropic && (
              <div className="mt-4">
                {results.anthropic.success ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Anthropic API is working!</AlertTitle>
                    <AlertDescription>
                      Model: {results.anthropic.model || "claude-3-7-sonnet"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>API Key Error</AlertTitle>
                    <AlertDescription>
                      {results.anthropic.error || "Failed to validate API key"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Perplexity API
              {results.perplexity && (
                results.perplexity.success ? 
                <CheckCircle className="text-green-500" /> : 
                <XCircle className="text-red-500" />
              )}
            </CardTitle>
            <CardDescription>Tests connection to Llama 3.1 Sonar model</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => testAPI('perplexity')} 
              disabled={loading.perplexity}
              className="w-full mb-2"
            >
              {loading.perplexity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : "Test Perplexity API"}
            </Button>
            
            {results.perplexity && !results.perplexity.success && (
              <Button 
                variant="outline" 
                onClick={() => requestNewKeys('perplexity')}
                className="w-full"
              >
                Request New Key
              </Button>
            )}
            
            {results.perplexity && (
              <div className="mt-4">
                {results.perplexity.success ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Perplexity API is working!</AlertTitle>
                    <AlertDescription>
                      Model: {results.perplexity.model || "llama-3.1-sonar-small-128k-online"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>API Key Error</AlertTitle>
                    <AlertDescription>
                      {results.perplexity.error || "Failed to validate API key"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test All Services</CardTitle>
          <CardDescription>Run diagnostic tests on all AI service APIs at once</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => testAPI('all')} 
            disabled={loading.all}
            className="mb-4"
          >
            {loading.all ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing All Services...
              </>
            ) : "Test All API Services"}
          </Button>
          
          {results.all && (
            <div className="mt-4">
              <Alert className={results.all.summary?.all_working ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
                {results.all.summary?.all_working ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <AlertTitle>
                  {results.all.summary?.all_working ? 
                    "All API services are working!" : 
                    "Some API services are not working"
                  }
                </AlertTitle>
                <AlertDescription>
                  Working services: {results.all.summary?.working_services?.join(", ") || "None"}
                </AlertDescription>
              </Alert>
              
              {results.all.results && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium">Detailed Results:</h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(results.all.results).map(([service, result]: [string, any]) => (
                      <Alert key={service} variant={result.success ? "default" : "destructive"} className="p-2">
                        <div className="flex items-center">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">{service.charAt(0).toUpperCase() + service.slice(1)}:</span>
                          <span className="ml-2">
                            {result.success ? "Working" : result.error || "Failed"}
                          </span>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Key Instructions</CardTitle>
          <CardDescription>How to obtain and update API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold mb-1">OpenAI API</h3>
            <p>To get a valid OpenAI API key:</p>
            <ol className="list-decimal pl-5 mt-2">
              <li>Go to <a href="https://platform.openai.com/api-keys" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
              <li>Create an account or sign in</li>
              <li>Create a new API key</li>
              <li>Add payment method if required</li>
              <li>Copy the API key and provide it to your administrator</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">Anthropic API</h3>
            <p>To get a valid Anthropic API key:</p>
            <ol className="list-decimal pl-5 mt-2">
              <li>Go to <a href="https://console.anthropic.com/keys" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">console.anthropic.com/keys</a></li>
              <li>Create an account or sign in</li>
              <li>Create a new API key</li>
              <li>Add payment method if required</li>
              <li>Copy the API key and provide it to your administrator</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-bold mb-1">Perplexity API</h3>
            <p>To get a valid Perplexity API key:</p>
            <ol className="list-decimal pl-5 mt-2">
              <li>Go to <a href="https://www.perplexity.ai/settings/api" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">perplexity.ai/settings/api</a></li>
              <li>Create an account or sign in</li>
              <li>Create a new API key</li>
              <li>Add payment method if required</li>
              <li>Copy the API key and provide it to your administrator</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}