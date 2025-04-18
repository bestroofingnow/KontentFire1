import React, { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle2, AlertCircle, Clock, PlayCircle } from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  status: 'running' | 'success' | 'failed' | 'cancelled' | 'pending';
  jobs: Job[];
}

interface Job {
  id: number;
  name: string;
  type: string;
  status: 'running' | 'success' | 'failed' | 'cancelled' | 'pending';
}

interface PipelineGraphProps {
  stages: Stage[];
  title?: string;
  description?: string;
}

export function PipelineGraph({ 
  stages, 
  title = "Pipeline Execution", 
  description = "Visual representation of the pipeline stages and jobs"
}: PipelineGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Helper function to get status icon
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'running':
        return <PlayCircle className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'cancelled':
        return <Clock className="h-6 w-6 text-gray-500" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-gray-400" />;
      default:
        return null;
    }
  };
  
  // Function to determine if all jobs in a stage are complete
  const isStageComplete = (stage: Stage) => {
    return !stage.jobs.some(job => job.status === 'running' || job.status === 'pending');
  };
  
  // Function to determine stage progress percentage
  const getStageProgress = (stage: Stage) => {
    if (stage.status === 'pending') return 0;
    if (stage.status === 'success' || stage.status === 'failed' || stage.status === 'cancelled') return 100;
    
    const total = stage.jobs.length;
    if (total === 0) return 0;
    
    const completed = stage.jobs.filter(job => 
      job.status === 'success' || job.status === 'failed' || job.status === 'cancelled'
    ).length;
    
    return Math.round((completed / total) * 100);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4" ref={containerRef}>
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative">
              {/* Stage header with status */}
              <div className="flex items-start mb-2">
                <div className="flex-shrink-0 mr-3">
                  <StatusIcon status={stage.status} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{stage.name}</h3>
                    <StatusBadge status={stage.status} />
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                    <div 
                      className={`h-2.5 rounded-full ${
                        stage.status === 'failed' ? 'bg-red-500' : 
                        stage.status === 'running' ? 'bg-blue-500' : 
                        stage.status === 'success' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${getStageProgress(stage)}%` }}
                    ></div>
                  </div>
                  
                  {/* Jobs grid */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {stage.jobs.map((job) => (
                      <div 
                        key={job.id} 
                        className={`border p-3 rounded-md ${
                          job.status === 'failed' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 
                          job.status === 'running' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 
                          job.status === 'success' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 
                          'border-gray-300 bg-gray-50 dark:bg-gray-800/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="mr-2">
                              {job.status === 'running' && <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />}
                              {job.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {job.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {job.status === 'cancelled' && <Clock className="h-4 w-4 text-gray-500" />}
                              {job.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{job.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {job.type.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Connector line to next stage */}
              {index < stages.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="border-l-2 border-dashed border-gray-300 h-8"></div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PipelineGraph;