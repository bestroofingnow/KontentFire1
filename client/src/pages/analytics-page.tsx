import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2, PieChart, LineChart, TrendingUp, Users, BarChart, Activity, Loader2 } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import EngagementChart from "@/components/analytics/engagement-chart";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#FF5722', '#FFC107', '#E64A19', '#FFD54F', '#FF7A50'];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>("30days");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  // Fetch content stats
  const { data: stats, isLoading } = useQuery({
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
  
  // Mock data for charts (we'd replace this with real API data in production)
  const contentTypeData = [
    { name: 'Text', value: 40 },
    { name: 'Image', value: 25 },
    { name: 'Text + Image', value: 35 }
  ];
  
  const platformData = [
    { name: 'Blog', value: 20 },
    { name: 'Facebook', value: 15 },
    { name: 'Instagram', value: 30 },
    { name: 'Twitter', value: 25 },
    { name: 'LinkedIn', value: 10 }
  ];
  
  const weeklyEngagementData = [
    { name: 'Mon', likes: 120, comments: 80, shares: 40 },
    { name: 'Tue', likes: 150, comments: 90, shares: 45 },
    { name: 'Wed', likes: 180, comments: 120, shares: 60 },
    { name: 'Thu', likes: 200, comments: 140, shares: 80 },
    { name: 'Fri', likes: 220, comments: 160, shares: 100 },
    { name: 'Sat', likes: 250, comments: 180, shares: 110 },
    { name: 'Sun', likes: 280, comments: 200, shares: 130 }
  ];
  
  const contentGrowthData = [
    { name: 'Jan', content: 20 },
    { name: 'Feb', content: 35 },
    { name: 'Mar', content: 45 },
    { name: 'Apr', content: 55 },
    { name: 'May', content: 70 },
    { name: 'Jun', content: 85 },
    { name: 'Jul', content: 95 }
  ];

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
                <h1 className="text-2xl md:text-3xl font-bold font-display text-dark mb-2">Analytics</h1>
                <p className="text-gray-600">Track your content performance and engagement metrics</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Content Created</p>
                      <h3 className="text-2xl font-bold mt-1 text-dark">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalContent || 0}</h3>
                    </div>
                    <div className="bg-primary-light bg-opacity-10 p-2 rounded-lg">
                      <BarChart2 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Posts Published</p>
                      <h3 className="text-2xl font-bold mt-1 text-dark">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.publishedContent || 0}</h3>
                    </div>
                    <div className="bg-secondary bg-opacity-10 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Engagement</p>
                      <h3 className="text-2xl font-bold mt-1 text-dark">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalEngagement || 0}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Avg. Engagement Rate</p>
                      <h3 className="text-2xl font-bold mt-1 text-dark">3.8%</h3>
                    </div>
                    <div className="bg-secondary bg-opacity-10 p-2 rounded-lg">
                      <Activity className="h-6 w-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart Sections */}
            <div className="space-y-6">
              <Tabs defaultValue="engagement" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="platforms">Platforms</TabsTrigger>
                </TabsList>
                
                <TabsContent value="engagement" className="space-y-6">
                  {/* Engagement by Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement by Day</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <EngagementChart data={weeklyEngagementData} />
                    </CardContent>
                  </Card>
                  
                  {/* Top Performing Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-gray-500">Analytics data is being gathered</p>
                        <p className="text-gray-500 text-sm">More detailed analytics will appear here soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Content Type Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={contentTypeData}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {contentTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Content Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={contentGrowthData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="content" stroke="#FF5722" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="platforms" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Platform Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  {/* Platform Engagement */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <p className="text-gray-500">Platform-specific engagement data</p>
                          <p className="text-gray-500 text-sm">Coming soon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
