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
  Search,
  Loader2,
  BookOpen,
  ExternalLink,
  ArrowUpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface Reference {
  title: string;
  url: string;
  snippet: string;
}

export interface ReferencesResponse {
  references: Reference[];
}

interface ReferencesDialogProps {
  initialQuery?: string;
  onReferencesFound?: (references: Reference[]) => void;
  triggerLabel?: string;
}

export function ReferencesDialog({
  initialQuery = "",
  onReferencesFound,
  triggerLabel = "Find References",
}: ReferencesDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [references, setReferences] = useState<Reference[]>([]);

  const referencesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/references", {
        query,
        count: 5,
      });
      const data = await response.json();
      return data as ReferencesResponse;
    },
    onSuccess: (data) => {
      setReferences(data.references);
      if (onReferencesFound) {
        onReferencesFound(data.references);
      }
    },
    onError: (error: Error) => {
      const message = error.message;
      // Check if it's a subscription error
      const upgradeRequired = message.includes("requires the Inferno plan");

      toast({
        title: upgradeRequired ? "Upgrade Required" : "References search failed",
        description: upgradeRequired
          ? "This feature requires the Inferno plan subscription"
          : `Error: ${message}`,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    referencesMutation.mutate();
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
          <DialogTitle>Find References</DialogTitle>
          <DialogDescription>
            Search for relevant and reliable sources to support your content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="query">Search query</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a topic, claim, or question..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || referencesMutation.isPending}
            >
              {referencesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {user?.plan !== 'inferno' && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-800">
                  This feature is only available on the Inferno plan. Upgrade your subscription to access advanced fact-checking tools.
                </p>
              </CardContent>
            </Card>
          )}

          {references.length > 0 && (
            <div className="space-y-4 mt-2">
              <div className="text-sm font-medium">
                Found {references.length} relevant sources
              </div>
              {references.map((reference, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <CardTitle className="text-base">
                          {reference.title}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {reference.url}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm">{reference.snippet}</p>
                  </CardContent>
                  <CardFooter className="pt-0 border-t bg-slate-50 py-2">
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center"
                    >
                      Visit source
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {referencesMutation.isSuccess && references.length === 0 && (
            <div className="text-center my-8 text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No relevant sources found for your query.</p>
              <p className="text-sm mt-1">
                Try a different query or be more specific.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}