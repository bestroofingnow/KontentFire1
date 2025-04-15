import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchCheck, BookOpen, ArrowRight, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { FactCheckDialog, ReferencesDialog } from "@/components/fact-check";
import { Reference } from "@/components/fact-check/references-dialog";
import { FactCheckResponse } from "@/components/fact-check/fact-check-dialog";

export default function FactCheckPage() {
  const [activeTab, setActiveTab] = useState<string>("fact-check");
  const [textToCheck, setTextToCheck] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [factCheckResult, setFactCheckResult] = useState<FactCheckResponse | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  
  const handleFactCheckResult = (result: FactCheckResponse) => {
    setFactCheckResult(result);
  };
  
  const handleReferencesFound = (refs: Reference[]) => {
    setReferences(refs);
  };
  
  const getResultIcon = () => {
    if (!factCheckResult) return null;

    switch (factCheckResult.result) {
      case "accurate":
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case "inaccurate":
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      default:
        return <Info className="h-8 w-8 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Fact Checking & References</h1>
              <p className="text-gray-600">Verify your content accuracy and find reliable sources with AI assistance</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="fact-check" className="flex items-center">
                  <SearchCheck className="h-4 w-4 mr-2" />
                  <span>Fact Checker</span>
                </TabsTrigger>
                <TabsTrigger value="references" className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span>Reference Finder</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Fact Checking Tab */}
              <TabsContent value="fact-check" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Content to Verify</CardTitle>
                      <CardDescription>
                        Enter the text you want to fact check
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="text-to-check">Text</Label>
                        <Textarea 
                          id="text-to-check" 
                          placeholder="Enter your content here..." 
                          className="h-40 resize-none"
                          value={textToCheck}
                          onChange={(e) => setTextToCheck(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="context">Context (Optional)</Label>
                        <Input
                          id="context"
                          placeholder="Add relevant context (e.g., industry, time period)"
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <FactCheckDialog 
                          initialText={textToCheck}
                          contextHint={context}
                          onTextVerified={handleFactCheckResult}
                          triggerLabel="Start Fact Check"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {factCheckResult ? (
                    <Card className={`border-2 ${
                      factCheckResult.result === 'accurate' ? 'border-green-200' :
                      factCheckResult.result === 'inaccurate' ? 'border-amber-200' :
                      'border-slate-200'
                    }`}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        {getResultIcon()}
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {factCheckResult.result === "accurate"
                              ? "Verified Accurate"
                              : factCheckResult.result === "inaccurate"
                              ? "Factual Issues Detected"
                              : "Unverifiable Claims"}
                          </CardTitle>
                          <CardDescription>
                            {factCheckResult.result === "accurate"
                              ? "The content appears to be factually accurate"
                              : factCheckResult.result === "inaccurate"
                              ? "Some statements may be incorrect or misleading"
                              : "Unable to verify the accuracy of some claims"}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Explanation</h3>
                          <p className="text-sm text-gray-700">{factCheckResult.explanation}</p>
                        </div>
                        
                        {factCheckResult.corrections && factCheckResult.corrections.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Suggested Corrections</h3>
                            <ul className="space-y-2">
                              {factCheckResult.corrections.map((correction, i) => (
                                <li key={i} className="text-sm bg-slate-50 p-3 rounded border border-slate-200">
                                  <p className="line-through text-slate-500 mb-1">
                                    {correction.original}
                                  </p>
                                  <div className="flex items-center">
                                    <ArrowRight className="h-3 w-3 text-green-500 mr-1" />
                                    <p className="text-green-700">{correction.corrected}</p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {factCheckResult.citations && factCheckResult.citations.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Sources</h3>
                            <ul className="space-y-1">
                              {factCheckResult.citations.map((citation, i) => (
                                <li key={i} className="text-sm">
                                  <a
                                    href={citation}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                  >
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {citation.length > 50
                                      ? citation.substring(0, 50) + "..."
                                      : citation}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="flex flex-col items-center justify-center text-center p-6 text-gray-500 border-dashed">
                      <SearchCheck className="h-12 w-12 mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No Check Performed Yet</h3>
                      <p className="text-sm max-w-md">
                        Enter your content in the form and click "Start Fact Check" to verify its accuracy using our AI-powered fact-checking system.
                      </p>
                    </Card>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">How our fact checker works:</p>
                      <ul className="list-disc list-inside space-y-1 ml-1">
                        <li>We analyze your content using AI to identify factual claims</li>
                        <li>Claims are verified against reliable online sources</li>
                        <li>Results include an accuracy rating, explanations, and sources</li>
                        <li>For best results, keep statements clear and focused on specific facts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* References Tab */}
              <TabsContent value="references" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Find References</CardTitle>
                      <CardDescription>
                        Search for relevant sources and references for your content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="query">Query</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="query" 
                            placeholder="Enter a topic, fact, or research question..." 
                            className="flex-1"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                          <ReferencesDialog 
                            initialQuery={query}
                            onReferencesFound={handleReferencesFound}
                            triggerLabel="Search"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {references.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Found {references.length} relevant sources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {references.map((reference, i) => (
                          <Card key={i}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-start">
                                <BookOpen className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{reference.title}</span>
                              </CardTitle>
                              <CardDescription className="text-xs truncate">
                                {reference.url}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{reference.snippet}</p>
                              <div className="mt-4">
                                <a
                                  href={reference.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline inline-flex items-center"
                                >
                                  Visit source
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card className="flex flex-col items-center justify-center text-center p-8 text-gray-500 border-dashed">
                      <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No References Found Yet</h3>
                      <p className="text-sm max-w-md">
                        Enter a search query and click "Search" to find relevant sources and references using our AI-powered research tool.
                      </p>
                    </Card>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Tips for effective reference searches:</p>
                        <ul className="list-disc list-inside space-y-1 ml-1">
                          <li>Be specific with your query to get more relevant results</li>
                          <li>Include key terms, names, or concepts you're researching</li>
                          <li>Try different phrasings if you don't get useful results initially</li>
                          <li>For statistics or data, include the specific data point you're looking for</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}