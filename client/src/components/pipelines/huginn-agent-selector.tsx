import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Bot, Filter, CheckCircle2 } from 'lucide-react';

interface HuginnAgent {
  id: number;
  name: string;
  type: string;
  description: string;
  schedule: string | null;
  disabled: boolean;
  lastCheckAt: string | null;
  lastEventAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface HuginnAgentSelectorProps {
  onAgentSelect: (agent: HuginnAgent) => void;
  label?: string;
  description?: string;
  preSelectedAgentId?: number;
}

export function HuginnAgentSelector({ 
  onAgentSelect, 
  label = "Select Huginn Agent", 
  description = "Choose a Huginn agent to use in your pipeline job",
  preSelectedAgentId
}: HuginnAgentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(preSelectedAgentId || null);
  
  // Fetch all Huginn agents
  const { data, isLoading } = useQuery({
    queryKey: ['/api/huginn/agents'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/huginn/agents');
      return await res.json();
    },
  });
  
  // Fetch agent types for filtering
  const { data: agentTypes } = useQuery({
    queryKey: ['/api/huginn/agent-types'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/huginn/agent-types');
      return await res.json();
    },
  });
  
  // Filter agents based on search term and type
  const filteredAgents = data?.agents?.filter((agent: HuginnAgent) => {
    const matchesSearch = 
      searchTerm === '' || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];
  
  // Handle agent selection
  const handleSelectAgent = (agent: HuginnAgent) => {
    setSelectedAgentId(agent.id);
    onAgentSelect(agent);
  };
  
  // Get selected agent details
  const selectedAgent = data?.agents?.find((agent: HuginnAgent) => agent.id === selectedAgentId);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{label}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full">
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Filter className="h-4 w-4" />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {agentTypes?.types?.map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Agents list */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAgents.map((agent: HuginnAgent) => (
                <div 
                  key={agent.id}
                  className={`border p-3 rounded-md cursor-pointer ${
                    selectedAgentId === agent.id 
                      ? 'border-primary bg-primary/10' 
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <Bot className={`h-5 w-5 mr-2 mt-0.5 ${agent.disabled ? 'text-gray-400' : 'text-primary'}`} />
                      <div>
                        <h4 className="font-medium">
                          {agent.name}
                          {agent.disabled && <span className="ml-2 text-xs text-gray-500">(Disabled)</span>}
                        </h4>
                        <p className="text-xs text-muted-foreground">{agent.type}</p>
                        <p className="text-sm mt-1 line-clamp-2">{agent.description}</p>
                      </div>
                    </div>
                    {selectedAgentId === agent.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-md">
              <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-1">No agents found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      {selectedAgent && (
        <CardFooter className="border-t pt-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Selected: {selectedAgent.name}</p>
            <p className="text-xs text-muted-foreground">{selectedAgent.type}</p>
          </div>
          <Button 
            variant="default"
            onClick={() => handleSelectAgent(selectedAgent)}
            disabled={!selectedAgent}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirm Selection
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default HuginnAgentSelector;