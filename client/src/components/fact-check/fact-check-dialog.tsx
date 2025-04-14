import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  ArrowUpCircle,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FactCheckResponse {
  result: 'accurate' | 'inaccurate' | 'unverifiable';
  explanation: string;
  corrections?: { original: string; corrected: string }[];
  citations: string[];
  confidence: number;
}

interface FactCheckDialogProps {
  initialText?: string;
  contextHint?: string;
  onTextVerified?: (result: FactCheckResponse) => void;
  triggerLabel?: string;
}

export function FactCheckDialog({
  initialText = "",
  contextHint = "",
  onTextVerified,
  triggerLabel = "Fact Check",
}: FactCheckDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [context, setContext] = useState(contextHint);
  const [result, setResult] = useState<FactCheckResponse | null>(null);

  const factCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fact-check", {
        text,
        context: context || undefined,
      });
      const data = await response.json();
      return data as FactCheckResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      if (onTextVerified) {
        onTextVerified(data);
      }
    },
    onError: (error: Error) => {
      const message = error.message;
      // Check if it's a subscription error
      const upgradeRequired = message.includes("requires the Inferno plan");

      toast({
        title: upgradeRequired ? "Upgrade Required" : "Fact-checking failed",
        description: upgradeRequired
          ? "This feature requires the Inferno plan subscription"
          : `Error: ${message}`,
        variant: "destructive",
      });
    },
  });

  const getResultIcon = () => {
    if (!result) return null;

    switch (result.result) {
      case "accurate":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "inaccurate":
        return <AlertTriangle className="h-8 w-8 text-amber-500" />;
      case "unverifiable":
        return <HelpCircle className="h-8 w-8 text-slate-500" />;
      default:
        return null;
    }
  };

  const getResultColor = () => {
    if (!result) return "";

    switch (result.result) {
      case "accurate":
        return "border-green-200 bg-green-50";
      case "inaccurate":
        return "border-amber-200 bg-amber-50";
      case "unverifiable":
        return "border-slate-200 bg-slate-50";
      default:
        return "";
    }
  };

  const resetResults = () => {
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fact Check</DialogTitle>
          <DialogDescription>
            Verify the accuracy of your content using AI-powered fact-checking
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Text to verify</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to fact-check..."
                  className="h-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Context (Optional)</Label>
                <Input
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide any additional context (e.g., industry, time period)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => factCheckMutation.mutate()}
                disabled={!text.trim() || factCheckMutation.isPending}
              >
                {factCheckMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>Verify</>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <Card className={cn("border-2", getResultColor())}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {getResultIcon()}
                <div>
                  <CardTitle className="capitalize">
                    {result.result === "accurate"
                      ? "Verified Accurate"
                      : result.result === "inaccurate"
                      ? "Factual Issues Detected"
                      : "Unverifiable Claims"}
                  </CardTitle>
                  <CardDescription>
                    {result.result === "accurate"
                      ? "The content appears to be factually accurate"
                      : result.result === "inaccurate"
                      ? "Some statements may be incorrect or misleading"
                      : "Unable to verify the accuracy of some claims"}
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs">
                    Confidence:{" "}
                    {Math.round(result.confidence * 100)}%
                  </Badge>
                  <Progress
                    value={result.confidence * 100}
                    className="h-1 w-16 mt-1"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{result.explanation}</p>

                {result.corrections && result.corrections.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Corrections</h4>
                    <ul className="space-y-2">
                      {result.corrections.map((correction, i) => (
                        <li key={i} className="text-sm bg-slate-50 p-2 rounded">
                          <p className="line-through text-slate-500">
                            {correction.original}
                          </p>
                          <p className="text-green-600">
                            {correction.corrected}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.citations && result.citations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Sources</h4>
                    <ul className="space-y-1">
                      {result.citations.map((citation, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <BookOpen className="h-3 w-3 mt-1 mr-1 text-slate-400" />
                          <a
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm break-all flex items-center"
                          >
                            {citation.length > 50
                              ? citation.substring(0, 50) + "..."
                              : citation}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter className="gap-2">
              <Button
                onClick={resetResults}
                variant="outline"
                size="sm"
              >
                Check Another
              </Button>
              <Button onClick={() => setOpen(false)} size="sm">
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}