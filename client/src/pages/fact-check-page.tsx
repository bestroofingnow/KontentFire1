import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Book, CheckCircle, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

type FactCheckResult = {
  result: 'accurate' | 'inaccurate' | 'unverifiable';
  explanation: string;
  corrections?: { original: string; corrected: string }[];
  citations: string[];
  confidence: number;
};

type ReferencesResult = {
  references: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
};

export default function FactCheckPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("fact-check");
  
  // Fact Check state
  const [factCheckText, setFactCheckText] = useState<string>("");
  const [factCheckContext, setFactCheckContext] = useState<string>("");
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResult | null>(null);
  
  // References state
  const [referenceQuery, setReferenceQuery] = useState<string>("");
  const [referenceCount, setReferenceCount] = useState<number>(5);
  const [referencesResult, setReferencesResult] = useState<ReferencesResult | null>(null);
  
  // Fact Check mutation
  const factCheckMutation = useMutation({
    mutationFn: async (data: { text: string; context?: string }) => {
      const response = await apiRequest("POST", "/api/fact-check", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to check facts");
      }
      return response.json();
    },
    onSuccess: (data: FactCheckResult) => {
      setFactCheckResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Fact Check Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // References mutation
  const referencesMutation = useMutation({
    mutationFn: async (data: { query: string; count?: number }) => {
      const response = await apiRequest("POST", "/api/references", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get references");
      }
      return response.json();
    },
    onSuccess: (data: ReferencesResult) => {
      setReferencesResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "References Search Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle fact check submission
  const handleFactCheck = () => {
    if (!factCheckText.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter text to fact check",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      text: factCheckText,
      ...(factCheckContext ? { context: factCheckContext } : {}),
    };
    
    factCheckMutation.mutate(data);
  };
  
  // Handle references search submission
  const handleReferencesSearch = () => {
    if (!referenceQuery.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      query: referenceQuery,
      count: referenceCount,
    };
    
    referencesMutation.mutate(data);
  };
  
  // Reset fact check results
  const resetFactCheck = () => {
    setFactCheckResult(null);
    setFactCheckText("");
    setFactCheckContext("");
  };
  
  // Reset references results
  const resetReferences = () => {
    setReferencesResult(null);
    setReferenceQuery("");
  };
  
  // Get color based on fact check result
  const getResultColor = (result: string) => {
    switch (result) {
      case 'accurate': return 'text-green-500';
      case 'inaccurate': return 'text-red-500';
      default: return 'text-amber-500';
    }
  };
  
  // Get icon based on fact check result
  const getResultIcon = (result: string) => {
    switch (result) {
      case 'accurate': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'inaccurate': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <AlertCircle className="w-6 h-6 text-amber-500" />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-6">Fact Check & References</h1>
            
            <Tabs defaultValue="fact-check" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="fact-check">Fact Checker</TabsTrigger>
                <TabsTrigger value="references">Reference Finder</TabsTrigger>
              </TabsList>
              
              {/* Fact Check Tab */}
              <TabsContent value="fact-check">
                <Card>
                  <CardHeader>
                    <CardTitle>Fact Checker</CardTitle>
                    <CardDescription>
                      Verify the accuracy of content using AI-powered fact checking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!factCheckResult ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Text to fact check
                          </label>
                          <Textarea
                            placeholder="Enter the text you want to fact check..."
                            value={factCheckText}
                            onChange={(e) => setFactCheckText(e.target.value)}
                            rows={6}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Context (optional)
                          </label>
                          <Input
                            placeholder="Add context to help with fact checking..."
                            value={factCheckContext}
                            onChange={(e) => setFactCheckContext(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleFactCheck}
                          disabled={factCheckMutation.isPending}
                          className="w-full"
                        >
                          {factCheckMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking Facts...
                            </>
                          ) : (
                            'Check Facts'
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Text checked:</p>
                          <p className="font-medium">{factCheckText}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getResultIcon(factCheckResult.result)}
                          <h3 className={`text-xl font-semibold ${getResultColor(factCheckResult.result)}`}>
                            {factCheckResult.result === 'accurate' && 'Accurate'}
                            {factCheckResult.result === 'inaccurate' && 'Inaccurate'}
                            {factCheckResult.result === 'unverifiable' && 'Unverifiable'}
                          </h3>
                          <span className="text-sm ml-auto">
                            Confidence: {Math.round(factCheckResult.confidence * 100)}%
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Explanation:</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {factCheckResult.explanation}
                          </p>
                        </div>
                        
                        {factCheckResult.corrections && factCheckResult.corrections.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Corrections:</h4>
                            <ul className="space-y-2">
                              {factCheckResult.corrections.map((correction, index) => (
                                <li key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                                  <p className="text-red-700 dark:text-red-400 line-through mb-1">{correction.original}</p>
                                  <p className="text-green-700 dark:text-green-400">{correction.corrected}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {factCheckResult.citations && factCheckResult.citations.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Sources:</h4>
                            <ul className="space-y-1">
                              {factCheckResult.citations.map((citation, index) => (
                                <li key={index} className="flex items-center">
                                  <a 
                                    href={citation} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                                  >
                                    {citation.length > 60 ? citation.substring(0, 60) + '...' : citation}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <Button onClick={resetFactCheck} className="w-full">
                          Check Another Fact
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* References Tab */}
              <TabsContent value="references">
                <Card>
                  <CardHeader>
                    <CardTitle>Reference Finder</CardTitle>
                    <CardDescription>
                      Find relevant sources and references for your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!referencesResult ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Search query
                          </label>
                          <Textarea
                            placeholder="Enter your search query..."
                            value={referenceQuery}
                            onChange={(e) => setReferenceQuery(e.target.value)}
                            rows={4}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Number of references (1-10)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={referenceCount}
                            onChange={(e) => setReferenceCount(Number(e.target.value))}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleReferencesSearch}
                          disabled={referencesMutation.isPending}
                          className="w-full"
                        >
                          {referencesMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Finding References...
                            </>
                          ) : (
                            'Find References'
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Search query:</p>
                          <p className="font-medium">{referenceQuery}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-4 flex items-center">
                            <Book className="w-5 h-5 mr-2 text-primary" />
                            Found {referencesResult.references.length} references
                          </h4>
                          
                          <ul className="space-y-4">
                            {referencesResult.references.map((reference, index) => (
                              <li key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                <a 
                                  href={reference.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                  {reference.title}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {reference.snippet}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {reference.url}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <Button onClick={resetReferences} className="w-full">
                          New Reference Search
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}