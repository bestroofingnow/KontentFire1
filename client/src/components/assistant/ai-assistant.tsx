import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Bot, User, Send, Loader2, X, Info, Zap, MessageSquare } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AssistantState = "minimized" | "open" | "closed";

export function AIAssistant() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Kontent Fire assistant. How can I help you with content creation today?",
      timestamp: new Date(),
    },
  ]);
  const [assistantState, setAssistantState] = useState<AssistantState>("minimized");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Message send mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/assistant/message", { content });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get a response from the assistant. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // Send to the API
    sendMessageMutation.mutate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAssistant = () => {
    if (assistantState === "minimized") {
      setAssistantState("open");
    } else if (assistantState === "open") {
      setAssistantState("minimized");
    } else {
      setAssistantState("minimized");
    }
  };

  const closeAssistant = () => {
    setAssistantState("closed");
  };

  // Quick suggestion buttons
  const suggestions = [
    "Generate content ideas for my industry",
    "How do I repurpose blog content for social media?",
    "Optimize my content for better SEO",
    "Create a content calendar for me",
  ];

  if (assistantState === "closed") {
    return (
      <Button
        onClick={() => setAssistantState("minimized")}
        className="fixed right-4 bottom-4 rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
      >
        <Bot className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed z-50 right-4 bottom-4 transition-all duration-300 ${
        assistantState === "minimized" ? "w-[350px]" : "w-[380px]"
      }`}
    >
      {assistantState === "minimized" ? (
        <Button
          onClick={toggleAssistant}
          className="w-full bg-primary hover:bg-primary/90 rounded-lg py-3 px-4 shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-medium">Kontent Fire Assistant</span>
          </div>
          <MessageSquare className="w-5 h-5" />
        </Button>
      ) : (
        <Card className="shadow-xl border-primary/20 overflow-hidden">
          <div className="bg-primary text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium">Kontent Fire Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAssistant}
                className="h-7 w-7 text-white hover:bg-primary-dark"
              >
                <span className="sr-only">Minimize</span>
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeAssistant}
                className="h-7 w-7 text-white hover:bg-primary-dark"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-3 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {message.role === "user" ? (
                      <User className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Bot className="h-5 w-5 text-primary" />
                    )}
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <Bot className="h-5 w-5 text-primary" />
                  </Avatar>
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="p-2 bg-gray-50 dark:bg-gray-900 flex gap-1 flex-wrap">
            {suggestions.map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs py-1 h-auto text-primary border-primary/30"
                onClick={() => {
                  setInput(suggestion);
                }}
              >
                {suggestion.length > 30 ? suggestion.substring(0, 30) + "..." : suggestion}
              </Button>
            ))}
          </div>

          <div className="p-3 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything about content creation..."
                className="resize-none min-h-[60px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="shrink-0 h-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Powered by Claude + Perplexity for fact-checking</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}