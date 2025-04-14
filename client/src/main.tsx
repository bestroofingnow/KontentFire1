import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ContentPage from "@/pages/content-page";
import SchedulePage from "@/pages/schedule-page";
import AnalyticsPage from "@/pages/analytics-page";
import IntegrationsPage from "@/pages/integrations-page";
import SettingsPage from "@/pages/settings-page";
import AdminPage from "@/pages/admin-page";
import SubscriptionPage from "@/pages/subscription-page";

// Directly render the application components with proper context hierarchy
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <App />
  </QueryClientProvider>
);
