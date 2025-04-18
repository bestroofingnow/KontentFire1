import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Cog, 
  HelpCircle, 
  Loader2, 
  PlusCircle, 
  PlayCircle, 
  Trash2,
  ArchiveIcon,
  SettingsIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MainLayout from '@/components/layout/main-layout';

// Types for our content pipeline data
interface Pipeline {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'archived';
  automated: boolean;
  schedule: string | null;
  configuration: any;
  createdAt: string;
  updatedAt: string | null;
}

interface PipelineRun {
  id: number;
  pipelineId: number;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  params: any;
  result: any;
  errorMessage: string | null;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Helper function to get status badge for pipelines
const PipelineStatusBadge = ({ status }: { status: Pipeline['status'] }) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    case 'paused':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>;
    case 'archived':
      return <Badge variant="secondary">Archived</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Helper function to get status badge for pipeline runs
const PipelineRunStatusBadge = ({ status }: { status: PipelineRun['status'] }) => {
  switch (status) {
    case 'running':
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
    case 'success':
      return <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'cancelled':
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Default pipeline configuration template
const defaultPipelineConfig = {
  stages: [
    {
      name: "Content Research",
      jobs: [
        {
          name: "Search for relevant topics",
          type: "huginn_agent"
        },
        {
          name: "Analyze trending keywords",
          type: "data_transformation"
        }
      ]
    },
    {
      name: "Content Generation",
      jobs: [
        {
          name: "Generate draft content",
          type: "content_generation"
        },
        {
          name: "Add images",
          type: "content_generation"
        }
      ]
    },
    {
      name: "Review and Publish",
      jobs: [
        {
          name: "Format for target platform",
          type: "data_transformation"
        },
        {
          name: "Publish content",
          type: "content_publishing"
        }
      ]
    }
  ]
};

// Create Pipeline Dialog Component
const CreatePipelineDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [automated, setAutomated] = useState(false);
  const [schedule, setSchedule] = useState('');
  const { toast } = useToast();
  
  const createPipelineMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/pipelines', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline created",
        description: "Your content pipeline has been created successfully.",
      });
      onSuccess();
      // Reset form
      setName('');
      setDescription('');
      setAutomated(false);
      setSchedule('');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Missing required fields",
        description: "Please provide a name for your pipeline.",
        variant: "destructive",
      });
      return;
    }
    
    createPipelineMutation.mutate({
      name,
      description: description || null,
      automated,
      schedule: automated ? schedule || 'daily' : null,
      configuration: defaultPipelineConfig,
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Pipeline</DialogTitle>
            <DialogDescription>
              Create a new content pipeline to automate your content workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="automated" className="text-right">
                Automated
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="automated"
                  checked={automated}
                  onCheckedChange={setAutomated}
                />
                <Label htmlFor="automated">Run automatically on schedule</Label>
              </div>
            </div>
            {automated && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schedule" className="text-right">
                  Schedule
                </Label>
                <select
                  id="schedule"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a schedule</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={createPipelineMutation.isPending}
            >
              {createPipelineMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Pipeline Card Component
const PipelineCard = ({ pipeline }: { pipeline: Pipeline }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runPipelineMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/pipelines/${pipeline.id}/execute`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline started",
        description: "The pipeline is now running.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/pipelines/${pipeline.id}/runs`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to run pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get pipeline runs
  const { data: pipelineRuns = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: [`/api/pipelines/${pipeline.id}/runs`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/pipelines/${pipeline.id}/runs`);
      return await res.json();
    },
  });

  // Update pipeline status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: Pipeline['status']) => {
      const res = await apiRequest('PUT', `/api/pipelines/${pipeline.id}`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pipeline updated",
        description: "The pipeline status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete pipeline mutation
  const deletePipelineMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/pipelines/${pipeline.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Pipeline deleted",
        description: "The pipeline has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{pipeline.name}</CardTitle>
            <CardDescription>
              {pipeline.description || "No description provided"}
            </CardDescription>
          </div>
          <PipelineStatusBadge status={pipeline.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Pipeline Settings</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Automated:</div>
            <div>{pipeline.automated ? 'Yes' : 'No'}</div>
            {pipeline.automated && pipeline.schedule && (
              <>
                <div>Schedule:</div>
                <div className="capitalize">{pipeline.schedule}</div>
              </>
            )}
            <div>Created:</div>
            <div>{formatDistanceToNow(new Date(pipeline.createdAt))} ago</div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Recent Runs</h4>
          {isLoadingRuns ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : pipelineRuns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineRuns.slice(0, 3).map((run: PipelineRun) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <PipelineRunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(run.startTime))} ago
                    </TableCell>
                    <TableCell>
                      {run.endTime 
                        ? ((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000).toFixed(1) + 's'
                        : 'In progress'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">No runs yet</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          {pipeline.status === 'active' && (
            <Button 
              onClick={() => updateStatusMutation.mutate('paused')}
              variant="outline"
              size="sm"
            >
              Pause
            </Button>
          )}
          {pipeline.status === 'paused' && (
            <Button 
              onClick={() => updateStatusMutation.mutate('active')}
              variant="outline"
              size="sm"
            >
              Activate
            </Button>
          )}
          {pipeline.status !== 'archived' && (
            <Button 
              onClick={() => updateStatusMutation.mutate('archived')}
              variant="outline"
              size="sm"
            >
              <ArchiveIcon className="h-4 w-4 mr-1" /> Archive
            </Button>
          )}
          <Button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this pipeline?')) {
                deletePipelineMutation.mutate();
              }
            }}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
        <Button 
          onClick={() => runPipelineMutation.mutate()}
          disabled={pipeline.status !== 'active' || runPipelineMutation.isPending}
          size="sm"
        >
          {runPipelineMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Run Pipeline
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Pipelines Page
const PipelinesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all pipelines
  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ['/api/pipelines'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/pipelines');
      return await res.json();
    },
  });

  const handlePipelineCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Pipelines</h1>
          <p className="text-muted-foreground">
            Create and manage automated content creation workflows
          </p>
        </div>
        <CreatePipelineDialog onSuccess={handlePipelineCreated} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : pipelines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline: Pipeline) => (
            <PipelineCard key={pipeline.id} pipeline={pipeline} />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No pipelines found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any content pipelines yet. Pipelines help you automate your content workflow.
          </p>
          <CreatePipelineDialog onSuccess={handlePipelineCreated} />
        </div>
      )}
    </MainLayout>
  );
};

export default PipelinesPage;