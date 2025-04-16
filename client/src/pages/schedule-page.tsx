import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  List, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ExternalLink,
  Loader2 
} from "lucide-react";
import { ScheduleWithContent } from "@/components/content/upcoming-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Schedule } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SchedulePage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<string>("calendar");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch upcoming schedules
  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['/api/schedules/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/schedules/upcoming', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming schedules');
      }
      
      return response.json() as Promise<ScheduleWithContent[]>;
    }
  });

  // Show error toast when there's an error, but only once
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load scheduled content",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Get schedules for the selected date
  const getDaySchedules = (day: Date) => {
    if (!schedules) return [];
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      return isSameDay(scheduleDate, day);
    });
  };

  const selectedDateSchedules = getDaySchedules(date);

  const getPlatformColor = (platform: string) => {
    const colorMap: Record<string, string> = {
      'blog': 'bg-primary text-white',
      'facebook': 'bg-blue-600 text-white',
      'instagram': 'bg-pink-500 text-white',
      'twitter': 'bg-sky-500 text-white',
      'linkedin': 'bg-blue-500 text-white',
      'youtube': 'bg-red-600 text-white',
      'tiktok': 'bg-black text-white',
      'pinterest': 'bg-red-500 text-white'
    };
    
    return colorMap[platform] || 'bg-gray-500 text-white';
  };

  // Handle schedule deletion
  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    
    setIsDeleting(true);
    
    try {
      await apiRequest("DELETE", `/api/schedule/${selectedSchedule.id}`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/schedules/upcoming'] });
      
      toast({
        title: "Schedule Deleted",
        description: "The scheduled content has been deleted",
      });
      
      setDeleteDialogOpen(false);
      setSelectedSchedule(null);
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsDeleting(false);
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
                <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Content Schedule</h1>
                <p className="text-gray-600">Plan and manage your content publishing schedule</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button 
                  variant={viewMode === "calendar" ? "default" : "outline"} 
                  onClick={() => setViewMode("calendar")}
                  size="sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "outline"} 
                  onClick={() => setViewMode("list")}
                  size="sm"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
            
            {/* Schedule Content */}
            <div className="bg-white rounded-lg shadow-sm">
              <Tabs defaultValue="upcoming" className="p-6">
                <TabsList className="mb-6">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="all">All Schedules</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-4 text-gray-500">Loading your schedule...</p>
                    </div>
                  ) : (
                    viewMode === "calendar" ? (
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                        <div className="md:col-span-5 lg:col-span-5">
                          <Card>
                            <CardHeader>
                              <CardTitle>Calendar View</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => newDate && setDate(newDate)}
                                className="rounded-md border"
                                components={{
                                  DayContent: (props) => {
                                    const daySchedules = getDaySchedules(props.date);
                                    return (
                                      <div className="relative">
                                        <div>{props.date.getDate()}</div>
                                        {daySchedules.length > 0 && (
                                          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                                            <div className="h-1 w-1 rounded-full bg-primary"></div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                }}
                              />
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>{format(date, 'MMMM d, yyyy')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedDateSchedules.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedDateSchedules.map((schedule) => (
                                    <div key={schedule.id} className="border rounded-lg p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <Badge className={getPlatformColor(schedule.platform)}>
                                            {schedule.platform.charAt(0).toUpperCase() + schedule.platform.slice(1)}
                                          </Badge>
                                          <p className="text-sm text-gray-500 mt-1">
                                            {format(new Date(schedule.scheduledDate), 'h:mm a')}
                                          </p>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                              <Edit className="mr-2 h-4 w-4" />
                                              <span>Edit</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                              className="text-red-500"
                                              onClick={() => {
                                                setSelectedSchedule(schedule);
                                                setDeleteDialogOpen(true);
                                              }}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Delete</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      <h4 className="font-medium mt-2">{schedule.content.title}</h4>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <p className="text-gray-500">No content scheduled for this date</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {schedules && schedules.length > 0 ? (
                          <div className="space-y-4">
                            {schedules.map((schedule) => (
                              <div key={schedule.id} className="border rounded-lg p-4 flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0 w-12 text-center">
                                    <div className="bg-gray-100 rounded-lg p-2">
                                      <div className="text-xs text-gray-500 uppercase">
                                        {format(new Date(schedule.scheduledDate), 'MMM')}
                                      </div>
                                      <div className="font-bold text-dark">
                                        {format(new Date(schedule.scheduledDate), 'd')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="font-medium text-dark">{schedule.content.title}</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                      <Badge className={getPlatformColor(schedule.platform)}>
                                        {schedule.platform.charAt(0).toUpperCase() + schedule.platform.slice(1)}
                                      </Badge>
                                      <span className="text-gray-500 text-sm">
                                        {format(new Date(schedule.scheduledDate), 'h:mm a')}
                                      </span>
                                    </div>
                                    
                                    {schedule.content.textContent && (
                                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                        {schedule.content.textContent}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      <span>View Content</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-500"
                                      onClick={() => {
                                        setSelectedSchedule(schedule);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No scheduled content</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Create content and schedule it to appear here
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </TabsContent>
                
                <TabsContent value="published">
                  <div className="text-center py-12">
                    <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Published Content</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View all your published content here
                    </p>
                    <p className="text-gray-500 text-sm mt-4">Coming soon</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="all">
                  <div className="text-center py-12">
                    <List className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">All Schedules</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View all your content schedules here
                    </p>
                    <p className="text-gray-500 text-sm mt-4">Coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Scheduled Content</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this scheduled content? This action cannot be undone.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSchedule}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
