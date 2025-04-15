import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, CheckCircle2, AlertCircle, XCircle, Clock, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
// We'll use a simple div for layout

// Define platform options
const PLATFORM_OPTIONS = [
  { value: 'google', label: 'Google Business Profile' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'foursquare', label: 'Foursquare' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'apple_maps', label: 'Apple Maps' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'bing', label: 'Bing Places' },
  { value: 'angi', label: 'Angi' },
  { value: 'yellowpages', label: 'Yellow Pages' },
  { value: 'bbb', label: 'Better Business Bureau' },
  { value: 'chamber', label: 'Chamber of Commerce' }
];

// Define type for business listing
interface BusinessListing {
  id: number;
  userId: number;
  companyProfileId: number;
  platform: string;
  listingId?: string;
  listingUrl?: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'manual_required';
  lastSynced?: Date;
  platformData?: Record<string, any>;
  platformCredentials?: Record<string, any>;
  verificationStatus: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Define type for tasks
interface ListingSyncTask {
  id: number;
  userId: number;
  listingId?: number;
  platform: string;
  taskType: string;
  taskDescription: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completionSteps?: Record<string, any>;
  completedSteps?: Record<string, any>;
  notes?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

// Define type for reviews
interface BusinessReview {
  id: number;
  userId: number;
  listingId?: number;
  platform: string;
  platformReviewId?: string;
  authorName?: string;
  authorAvatar?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: Date;
  responseText?: string;
  responseDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// Form schema for creating a new listing
const newListingSchema = z.object({
  platform: z.string({ required_error: "Please select a platform" }),
  listingUrl: z.string().optional(),
  listingId: z.string().optional(),
});

// Form schema for creating a new task
const newTaskSchema = z.object({
  platform: z.string({ required_error: "Please select a platform" }),
  taskType: z.string({ required_error: "Please provide a task type" }),
  taskDescription: z.string({ required_error: "Please provide a task description" }),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  listingId: z.number().optional(),
});

function ListingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [isNewListingDialogOpen, setIsNewListingDialogOpen] = useState(false);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("listings");

  // Form for new listings
  const newListingForm = useForm<z.infer<typeof newListingSchema>>({
    resolver: zodResolver(newListingSchema),
    defaultValues: {
      platform: "",
      listingUrl: "",
      listingId: "",
    },
  });

  // Form for new tasks
  const newTaskForm = useForm<z.infer<typeof newTaskSchema>>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      platform: "",
      taskType: "",
      taskDescription: "",
      notes: "",
    },
  });

  // Query for fetching company profile
  const { data: companyProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/company-profile'],
    retry: false,
  });

  // Query for fetching listings
  const { data: listings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['/api/business-listings'],
    enabled: !!companyProfile,
  });

  // Query for fetching tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/listing-tasks'],
    enabled: activeTab === "tasks",
  });

  // Query for fetching reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/business-reviews'],
    enabled: activeTab === "reviews",
  });

  // Query for fetching listings stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/analytics/listings'],
    enabled: activeTab === "dashboard",
  });

  // Mutation for creating a new listing
  const createListingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newListingSchema>) => {
      const response = await apiRequest("POST", "/api/business-listings", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create listing");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/listings'] });
      setIsNewListingDialogOpen(false);
      newListingForm.reset();
      toast({
        title: "Listing created",
        description: "Your business listing has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a new task
  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newTaskSchema>) => {
      const response = await apiRequest("POST", "/api/listing-tasks", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-tasks'] });
      setIsNewTaskDialogOpen(false);
      newTaskForm.reset();
      toast({
        title: "Task created",
        description: "Your listing sync task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for completing a task
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/listing-tasks/${taskId}/complete`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-tasks'] });
      toast({
        title: "Task completed",
        description: "The task has been marked as completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle new listing form submission
  const onSubmitNewListing = (data: z.infer<typeof newListingSchema>) => {
    createListingMutation.mutate(data);
  };

  // Handle new task form submission
  const onSubmitNewTask = (data: z.infer<typeof newTaskSchema>) => {
    createTaskMutation.mutate(data);
  };

  // Get platform label from value
  const getPlatformLabel = (value: string) => {
    const platform = PLATFORM_OPTIONS.find(p => p.value === value);
    return platform ? platform.label : value;
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Synced</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'manual_required':
        return <Badge className="bg-blue-500"><Zap className="w-3 h-3 mr-1" /> Manual Required</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500"><Zap className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Check if company profile exists
  const showCreateProfileMessage = !isLoadingProfile && !companyProfile;

  // Reset forms when dialogs close
  useEffect(() => {
    if (!isNewListingDialogOpen) {
      newListingForm.reset();
    }
    if (!isNewTaskDialogOpen) {
      newTaskForm.reset();
    }
  }, [isNewListingDialogOpen, isNewTaskDialogOpen, newListingForm, newTaskForm]);

  return (
    <div>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Listings Manager</h1>
          <div className="flex gap-2">
            {!showCreateProfileMessage && (
              <>
                <Dialog open={isNewListingDialogOpen} onOpenChange={setIsNewListingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Business Listing</DialogTitle>
                      <DialogDescription>
                        Create a new business listing to manage your online presence across platforms.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...newListingForm}>
                      <form onSubmit={newListingForm.handleSubmit(onSubmitNewListing)} className="space-y-4">
                        <FormField
                          control={newListingForm.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PLATFORM_OPTIONS.map((platform) => (
                                    <SelectItem key={platform.value} value={platform.value}>
                                      {platform.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newListingForm.control}
                          name="listingUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Listing URL (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormDescription>
                                The URL of your existing business listing, if you have one.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newListingForm.control}
                          name="listingId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Listing ID (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Listing ID" {...field} />
                              </FormControl>
                              <FormDescription>
                                The unique identifier for your business listing on this platform.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createListingMutation.isPending}>
                            {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Sync Task</DialogTitle>
                      <DialogDescription>
                        Create a new task to track manual verification steps for your business listings.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...newTaskForm}>
                      <form onSubmit={newTaskForm.handleSubmit(onSubmitNewTask)} className="space-y-4">
                        <FormField
                          control={newTaskForm.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PLATFORM_OPTIONS.map((platform) => (
                                    <SelectItem key={platform.value} value={platform.value}>
                                      {platform.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newTaskForm.control}
                          name="taskType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Verification, Update Info" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newTaskForm.control}
                          name="taskDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Describe what needs to be done" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newTaskForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date (optional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={newTaskForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Additional notes" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={createTaskMutation.isPending}>
                            {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {showCreateProfileMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Company Profile Required</CardTitle>
              <CardDescription>
                You need to create a company profile before managing business listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/settings">Create Company Profile</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="listings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingListings ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader className="h-20 bg-gray-200 dark:bg-gray-800 rounded-t-lg" />
                      <CardContent className="space-y-2 p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-2/3" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : !listings || listings.length === 0 ? (
                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>No Business Listings Found</CardTitle>
                      <CardDescription>
                        You haven't added any business listings yet. Click the "Add Listing" button to get started.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  listings.map((listing: BusinessListing) => (
                    <Card key={listing.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>{getPlatformLabel(listing.platform)}</CardTitle>
                          {renderStatusBadge(listing.syncStatus)}
                        </div>
                        <CardDescription>
                          {listing.verificationStatus ? "Verified ✓" : "Not Verified"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        {listing.listingUrl && (
                          <p className="text-sm mb-2 text-muted-foreground truncate">
                            <a 
                              href={listing.listingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {listing.listingUrl}
                            </a>
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">
                            Added on {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="rounded-md border">
                {isLoadingTasks ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : !tasks || tasks.length === 0 ? (
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any tasks yet. Add a task to start tracking manual verification steps.
                    </p>
                    <Button onClick={() => setIsNewTaskDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Task
                    </Button>
                  </div>
                ) : (
                  <div className="p-0">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Task</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Platform</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Due Date</th>
                          <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task: ListingSyncTask) => (
                          <tr key={task.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div>
                                <p className="font-medium">{task.taskType}</p>
                                <p className="text-xs text-muted-foreground">{task.taskDescription}</p>
                              </div>
                            </td>
                            <td className="p-4 align-middle">{getPlatformLabel(task.platform)}</td>
                            <td className="p-4 align-middle">{renderStatusBadge(task.status)}</td>
                            <td className="p-4 align-middle">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                            </td>
                            <td className="p-4 align-middle text-right">
                              {task.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => completeTaskMutation.mutate(task.id)}
                                  disabled={completeTaskMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {isLoadingReviews ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No Reviews Found</CardTitle>
                    <CardDescription>
                      We haven't synchronized any reviews for your business listings yet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Reviews will appear here as they are gathered from your business listings.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review: BusinessReview) => (
                    <Card key={review.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {review.authorAvatar ? (
                              <img
                                src={review.authorAvatar}
                                alt={review.authorName || "Reviewer"}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {review.authorName ? review.authorName[0] : "?"}
                                </span>
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-base">{review.authorName || "Anonymous"}</CardTitle>
                              <CardDescription>
                                {review.reviewDate
                                  ? new Date(review.reviewDate).toLocaleDateString()
                                  : new Date(review.createdAt).toLocaleDateString()}{" "}
                                • {getPlatformLabel(review.platform)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? "text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{review.reviewText || "No review text provided."}</p>
                        {review.responseText ? (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-xs font-medium mb-1">Your Response:</p>
                            <p className="text-sm">{review.responseText}</p>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm">
                            Respond to Review
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
                      ) : (
                        stats?.totalListings || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Business listings you're tracking
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verified Listings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
                      ) : (
                        stats?.verifiedListings || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isLoadingStats
                        ? ""
                        : stats && stats.totalListings
                        ? `${Math.round((stats.verifiedListings / stats.totalListings) * 100)}% of total listings`
                        : "No listings to verify"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
                      ) : (
                        stats?.totalReviews || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all platforms
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoadingStats ? (
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
                      ) : (
                        stats?.averageRating || "N/A"
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {isLoadingStats ? "" : (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 ${
                                i < (stats?.averageRating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsList className="grid w-full grid-cols-4 mt-6">
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default ListingsManager;