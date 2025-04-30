import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import StatCard from "@/components/content/stat-card";
import UpcomingContent from "@/components/content/upcoming-content";
import RecentlyCreated from "@/components/content/recently-created";
import ContentPreviewSlider from "@/components/content/content-preview-slider";
import ProcessSteps from "@/components/content/process-steps";
import CreateContentModal from "@/components/content/create-content-modal";
import WelcomeScreen from "@/components/dashboard/welcome-screen";
import { Button } from "@/components/ui/button";
import { PenTool, Calendar, ImageIcon, ThumbsUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Content } from "@shared/schema";

export default function HomePage() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Fetch content stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch content stats');
      }
      
      return response.json();
    }
  });
  
  const handleCreateContent = () => {
    setCreateModalOpen(true);
  };
  
  const handleContentCreated = () => {
    setCreateModalOpen(false);
    toast({
      title: "Content Created",
      description: "Your content has been created successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Personalized Welcome Screen with User Insights */}
            <WelcomeScreen />
            
            {/* Create New Content Button */}
            <div className="flex justify-center mb-8">
              <Button 
                onClick={handleCreateContent}
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg shadow-md transition flex items-center space-x-2 transform hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                <span>Create New Content</span>
              </Button>
            </div>
            
            {/* Featured Content Slider */}
            <div className="mb-8">
              <ContentPreviewSlider 
                title="Featured Content" 
                description="Browse through your best content"
                limit={5}
                onSchedule={(content) => {
                  toast({
                    title: "Scheduling Content",
                    description: `Scheduling "${content.title}" for publishing`,
                  });
                }}
                onEdit={(content) => {
                  toast({
                    title: "Editing Content",
                    description: `Opening editor for "${content.title}"`,
                  });
                }}
              />
            </div>
            
            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <UpcomingContent />
              <RecentlyCreated />
            </div>

            {/* Process Steps */}
            <ProcessSteps />
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      <CreateContentModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onContentCreated={handleContentCreated}
      />
    </div>
  );
}
