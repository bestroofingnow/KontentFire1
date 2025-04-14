import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import StatCard from "@/components/content/stat-card";
import UpcomingContent from "@/components/content/upcoming-content";
import RecentlyCreated from "@/components/content/recently-created";
import ProcessSteps from "@/components/content/process-steps";
import CreateContentModal from "@/components/content/create-content-modal";
import { Button } from "@/components/ui/button";
import { PenTool, Calendar, ImageIcon, ThumbsUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's an overview of your content.</p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard 
                title="Content Created" 
                value={statsLoading ? "-" : stats?.totalContent || 0}
                icon={<PenTool className="h-6 w-6 text-primary" />}
                change={{ value: 18, isPositive: true }}
                iconColorClass="bg-primary-light"
              />
              
              <StatCard 
                title="Posts Published" 
                value={statsLoading ? "-" : stats?.publishedContent || 0}
                icon={<Calendar className="h-6 w-6 text-secondary" />}
                change={{ value: 12, isPositive: true }}
                iconColorClass="bg-secondary"
              />
              
              <StatCard 
                title="Images Generated" 
                value={statsLoading ? "-" : stats?.totalImages || 0}
                icon={<ImageIcon className="h-6 w-6 text-primary" />}
                change={{ value: 24, isPositive: true }}
                iconColorClass="bg-primary-light"
              />
              
              <StatCard 
                title="Total Engagement" 
                value={statsLoading ? "-" : stats?.totalEngagement || 0}
                icon={<ThumbsUp className="h-6 w-6 text-secondary" />}
                change={{ value: 5, isPositive: false }}
                iconColorClass="bg-secondary"
              />
            </div>
            
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
