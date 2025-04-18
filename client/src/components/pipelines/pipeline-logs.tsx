import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, RefreshCw, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PipelineLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

interface PipelineLogsProps {
  pipelineId: number;
  pipelineRunId?: number;
  maxHeight?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PipelineLogs({
  pipelineId,
  pipelineRunId,
  maxHeight = '400px',
  autoRefresh = false,
  refreshInterval = 5000
}: PipelineLogsProps) {
  const [filter, setFilter] = useState<string>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const endpoint = pipelineRunId 
    ? `/api/pipeline-runs/${pipelineRunId}/logs`
    : `/api/pipelines/${pipelineId}/logs`;
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await apiRequest('GET', endpoint);
      return await res.json();
    },
  });
  
  // Auto-refresh on interval if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refetch]);
  
  // Auto scroll to bottom on new logs
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [data]);
  
  const filteredLogs = data?.logs?.filter((log: PipelineLogEntry) => {
    if (filter === 'all') return true;
    return log.level === filter;
  }) || [];
  
  // Function to get text color based on log level
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-400';
      default:
        return 'text-gray-200';
    }
  };
  
  // Function to export logs as JSON
  const exportLogs = () => {
    if (!data?.logs) return;
    
    const logJson = JSON.stringify(data.logs, null, 2);
    const blob = new Blob([logJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_${pipelineId}_logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Terminal className="mr-2 h-5 w-5" />
            Pipeline Logs
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportLogs}
              disabled={!data?.logs || data.logs.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        <div className="flex mt-2 space-x-2">
          <Button 
            size="sm" 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'info' ? 'default' : 'outline'} 
            className={filter === 'info' ? '' : 'text-blue-500'}
            onClick={() => setFilter('info')}
          >
            Info
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'warn' ? 'default' : 'outline'} 
            className={filter === 'warn' ? '' : 'text-yellow-500'} 
            onClick={() => setFilter('warn')}
          >
            Warnings
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'error' ? 'default' : 'outline'} 
            className={filter === 'error' ? '' : 'text-red-500'} 
            onClick={() => setFilter('error')}
          >
            Errors
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'debug' ? 'default' : 'outline'} 
            className={filter === 'debug' ? '' : 'text-gray-400'} 
            onClick={() => setFilter('debug')}
          >
            Debug
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <ScrollArea 
            ref={scrollAreaRef} 
            className={`border rounded-md bg-black text-white font-mono text-sm`}
            style={{ maxHeight }}
          >
            <div className="p-4">
              {filteredLogs.map((log: PipelineLogEntry, index: number) => (
                <div key={index} className="pb-1">
                  <span className="text-gray-400">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                  <span className={`ml-2 ${getLogLevelColor(log.level)} uppercase font-bold`}>
                    {log.level}
                  </span>
                  <span className="ml-2 text-gray-300">[{log.source}]</span>
                  <span className="ml-2">{log.message}</span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="pl-10 text-gray-400 text-xs mt-1">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="border rounded-md p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No logs available</h3>
            <p className="text-muted-foreground text-sm mb-4">
              No logs have been generated yet or logs may have been cleared.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PipelineLogs;