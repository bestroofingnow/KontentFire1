import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Terminal,
  BarChart,
  ListFilter
} from 'lucide-react';
import { format, formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import PipelineLogs from '@/components/pipelines/pipeline-logs';
import PipelineGraph from '@/components/pipelines/pipeline-graph';
import MainLayout from '@/components/layout/main-layout';

// Types for our data
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
  status: 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'cancelled' | 'skipped';
  params: any;
  result: any;
  errorMessage: string | null;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface PipelineStage {
  id: number;
  pipelineRunId: number;
  name: string;
  status: 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'cancelled' | 'skipped';
  errorMessage: string | null;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string | null;
  jobs: PipelineJob[];
}

interface PipelineJob {
  id: number;
  stageRunId: number;
  name: string;
  type: 'huginn_agent' | 'content_generation' | 'content_publishing' | 'data_transformation';
  status: 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'cancelled' | 'skipped';
  result: any;
  errorMessage: string | null;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Helper function to get status badge
const StatusBadge = ({ status }: { status: 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'cancelled' | 'skipped' }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-slate-100 text-slate-500">Pending</Badge>;
    case 'running':
      return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
    case 'success':
      return <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>;
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'cancelled':
      return <Badge variant="outline">Cancelled</Badge>;
    case 'skipped':
      return <Badge variant="outline" className="bg-amber-100 text-amber-500">Skipped</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Helper function to format duration
const formatTimeDuration = (startTime: string, endTime: string | null) => {
  if (!endTime) return 'In progress';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
};

// Helper function to get a status icon
const StatusIcon = ({ status }: { status: 'pending' | 'running' | 'success' | 'completed' | 'failed' | 'cancelled' | 'skipped' }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-slate-400" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'success':
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'cancelled':
      return <Clock className="h-4 w-4 text-gray-500" />;
    case 'skipped':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
};

// Stage component
const StageSection = ({ stage }: { stage: PipelineStage }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StatusIcon status={stage.status} />
            <CardTitle className="ml-2">{stage.name}</CardTitle>
          </div>
          <StatusBadge status={stage.status} />
        </div>
        <CardDescription>
          Started {formatDistanceToNow(new Date(stage.startTime))} ago
          {stage.endTime && ` • Completed in ${formatTimeDuration(stage.startTime, stage.endTime)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stage.jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {job.type.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <StatusIcon status={job.status} />
                      <span className="ml-2">{job.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatTimeDuration(job.startTime, job.endTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {stage.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Error in stage</h4>
              </div>
              <div className="pl-6 text-sm font-mono whitespace-pre-wrap">
                {stage.errorMessage}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Pipeline Run Page
const PipelineRunPage: React.FC = () => {
  const { user } = useAuth();
  const [, params] = useRoute<{ runId: string }>('/pipeline-runs/:runId');
  const runId = params?.runId || '';

  // Fetch the run details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/pipeline-runs/${runId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/pipeline-runs/${runId}`);
      return await res.json();
    },
    enabled: !!runId,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/pipelines">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pipelines
            </Link>
          </Button>
        </div>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/pipelines">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Pipelines
            </Link>
          </Button>
        </div>
        <Card className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Run</h2>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load pipeline run details'}
          </p>
          <Button asChild>
            <Link to="/pipelines">Return to Pipelines</Link>
          </Button>
        </Card>
      </MainLayout>
    );
  }

  const { run, pipeline, stages } = data;
  
  const [activeTab, setActiveTab] = useState<string>("details");

  // Convert stages to the format expected by PipelineGraph
  const stagesForGraph = stages?.map((stage) => ({
    id: stage.id,
    name: stage.name,
    status: stage.status,
    jobs: stage.jobs
  })) || [];

  return (
    <MainLayout>
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/pipelines">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Pipelines
          </Link>
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Pipeline Run: {pipeline.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center">
            <StatusIcon status={run.status} />
            <span className="ml-2 capitalize">{run.status}</span>
          </div>
          <div>Started {format(new Date(run.startTime), 'PPp')}</div>
          {run.endTime && (
            <div>
              Completed {format(new Date(run.endTime), 'PPp')}
            </div>
          )}
          {run.endTime && (
            <div>
              Duration: {formatTimeDuration(run.startTime, run.endTime)}
            </div>
          )}
        </div>
      </div>
      
      {run.status === 'running' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <div>
            This pipeline is currently running. The page will not update automatically, please refresh to see the latest status.
          </div>
        </div>
      )}
      
      {run.status === 'failed' && run.errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h4 className="font-medium">Pipeline Failed</h4>
          </div>
          <div className="pl-7 text-sm font-mono whitespace-pre-wrap">
            {run.errorMessage}
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="details" className="flex items-center">
            <ListFilter className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="graph" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <Terminal className="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="params" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Parameters
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Stages</h2>
            {stages.length > 0 ? (
              <div className="space-y-6">
                {stages.map((stage: PipelineStage) => (
                  <StageSection key={stage.id} stage={stage} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md">
                <Terminal className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Stages Found</h3>
                <p className="text-muted-foreground">
                  This pipeline run doesn't have any stages. This may be due to an error in the pipeline configuration.
                </p>
              </div>
            )}
          </div>
          
          {run.result && (
            <div>
              <h2 className="text-xl font-bold mb-4">Results</h2>
              <Card>
                <CardContent className="pt-6">
                  <pre className="text-sm overflow-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                    {JSON.stringify(run.result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="graph">
          {stages.length > 0 ? (
            <PipelineGraph 
              stages={stagesForGraph}
              title="Pipeline Execution Flow"
              description="Visual representation of pipeline stages and jobs"
            />
          ) : (
            <div className="text-center p-8 border rounded-md">
              <BarChart className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Visualization Available</h3>
              <p className="text-muted-foreground mb-4">
                This pipeline run doesn't have any stages to visualize.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="logs">
          <PipelineLogs 
            pipelineId={pipeline.id} 
            pipelineRunId={run.id}
            maxHeight="600px"
          />
        </TabsContent>
        
        <TabsContent value="params">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Parameters</CardTitle>
              <CardDescription>
                Parameters passed to this pipeline run
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(run.params || {}).length > 0 ? (
                <pre className="text-sm overflow-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                  {JSON.stringify(run.params, null, 2)}
                </pre>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  No parameters were provided for this pipeline run.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default PipelineRunPage;