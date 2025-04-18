import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestAuthPage() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    loginMutation.mutate({ username, password });
  };

  const testAuth = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/user");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      toast({
        title: "Authentication Test",
        description: "Auth test successful",
      });
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
      toast({
        title: "Authentication Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testContentGenerate = async () => {
    try {
      setLoading(true);
      const testData = {
        contentType: "text",
        platform: "blog",
        prompt: "Test content generation",
        tone: "professional",
        length: "short"
      };
      
      const response = await apiRequest("POST", "/api/content/generate", testData);
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
      toast({
        title: "Content Generation Test",
        description: "Content generation test successful",
      });
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
      toast({
        title: "Content Generation Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
            <CardDescription>Shows the current user data from auth context</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <p>Not logged in</p>
            )}
          </CardContent>
        </Card>

        {!user && (
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Log in to test authenticated requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Username</label>
                <Input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Password</label>
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleLogin} disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {user && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Test API Authentication</CardTitle>
                <CardDescription>Make authenticated requests to the API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testAuth} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test /api/user"
                  )}
                </Button>
                <Button onClick={testContentGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test /api/content/generate"
                  )}
                </Button>
                
                {testResult && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Test Result:</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                      {testResult}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}