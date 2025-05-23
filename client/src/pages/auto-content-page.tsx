import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Flame, Zap, Brain, CalendarClock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { AutomaticContentConfig } from "@/components/auto-content/automatic-content-config";
import { AutomaticScheduleView } from "@/components/auto-content/automatic-schedule-view";

export default function AutoContentPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="mr-4 bg-primary/10 p-2 rounded-full">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold font-display text-dark">Automatic Content</h1>
                  <p className="text-gray-600">Set up AI-powered content generation on autopilot</p>
                </div>
              </div>
              
              {(user?.plan === 'inferno' || user?.plan === 'ember') && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Flame className="h-6 w-6 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Premium Plan Feature</h3>
                      <p className="text-sm text-gray-600">
                        You have access to automatic content generation as part of your {user?.plan === 'ember' ? 'Ember' : 'Inferno'} plan.
                        Configure your preferences below and let our AI create and schedule content for you.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Main Sections */}
            <div className="space-y-6">
              {/* Configuration Section */}
              <section>
                <div className="flex items-center mb-4">
                  <Brain className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-xl font-bold">Configuration</h2>
                </div>
                <AutomaticContentConfig />
              </section>
              
              <Separator />
              
              {/* Schedule Section */}
              <section>
                <div className="flex items-center mb-4">
                  <CalendarClock className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-xl font-bold">Schedule</h2>
                </div>
                <AutomaticScheduleView />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}