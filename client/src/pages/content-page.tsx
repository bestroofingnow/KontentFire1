import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import CreateContentModal from "@/components/content/create-content-modal";
import ContentItem from "@/components/content/content-item";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Content } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ContentPage() {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [platform, setPlatform] = useState<string>("blog");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("12:00");
  const [schedulingContent, setSchedulingContent] = useState(false);

  // Fetch all content
  const { data: contents, isLoading, error } = useQuery({
    queryKey: ['/api/contents'],
    queryFn: async () => {
      const response = await fetch('/api/contents', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contents');
      }
      
      return response.json();
    }
  });
  
  // Apply filters and sorting
  useEffect(() => {
    if (!contents || !contents.contents) return;
    
    let filtered = [...contents.contents];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (content.textContent && content.textContent.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by content type
    if (contentType !== "all") {
      filtered = filtered.filter(content => content.contentType === contentType);
    }
    
    // Sort contents
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredContents(filtered);
  }, [contents, searchQuery, contentType, sortBy]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const handleSchedule = (content: Content) => {
    setSelectedContent(content);
    setScheduleModalOpen(true);
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
  };
  
  const handleEdit = (content: Content) => {
    setSelectedContent(content);
    setEditModalOpen(true);
  };
  
  const handleSubmitSchedule = async () => {
    if (!selectedContent || !scheduledDate || !platform) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    
    setSchedulingContent(true);
    
    try {
      await apiRequest("POST", "/api/schedule", {
        contentId: selectedContent.id,
        platform,
        scheduledDate: scheduledDateTime.toISOString()
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contents'] });
      
      toast({
        title: "Content Scheduled",
        description: `Content scheduled for ${platform} on ${scheduledDate} at ${scheduledTime}`,
      });
      
      setScheduleModalOpen(false);
      setSelectedContent(null);
    } catch (error: any) {
      toast({
        title: "Scheduling Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setSchedulingContent(false);
  };
  
  const handleContentCreated = () => {
    setCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/contents'] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Content Library</h1>
                <p className="text-gray-600">Manage and organize all your content in one place</p>
              </div>
              
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark text-white flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create Content</span>
              </Button>
            </div>
            
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search content..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <div className="w-40">
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Content Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="both">Text + Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-40">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Tabs defaultValue="all" className="p-6">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Content</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-0">
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-4 text-gray-500">Loading your content...</p>
                    </div>
                  ) : filteredContents.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {filteredContents.map(content => (
                        <ContentItem 
                          key={content.id} 
                          content={content} 
                          onSchedule={handleSchedule} 
                          onEdit={handleEdit} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto flex flex-col items-center">
                        <div className="rounded-full bg-gray-100 p-3">
                          <Filter className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No content found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchQuery || contentType !== "all" ? "Try adjusting your filters" : "Create your first content to get started"}
                        </p>
                        <Button 
                          onClick={() => setCreateModalOpen(true)} 
                          className="mt-4 bg-primary hover:bg-primary-dark text-white"
                        >
                          Create Content
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="drafts">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">Draft content tab is in development</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="scheduled">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">Scheduled content tab is in development</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="published">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">Published content tab is in development</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      {/* Create Content Modal */}
      <CreateContentModal 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        onContentCreated={handleContentCreated}
      />
      
      {/* Schedule Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-gray-700 font-medium mb-2">Title</Label>
              <p className="text-gray-700">{selectedContent?.title}</p>
            </div>
            
            <div>
              <Label htmlFor="platform" className="block text-gray-700 font-medium mb-2">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="gmb">Google My Business</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date" className="block text-gray-700 font-medium mb-2">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="time" className="block text-gray-700 font-medium mb-2">Time</Label>
              <Input 
                id="time" 
                type="time" 
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitSchedule} 
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={schedulingContent}
            >
              {schedulingContent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-500 text-center">Content editing functionality coming soon</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
