import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedElement } from '@/components/ui/animated-element';
import { SocialConnections } from '@/components/settings/social-connections';
import { LinkedInPost } from '@/components/integrations/linked-in-post';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SocialAccount } from '@shared/schema';
import MainLayout from '@/components/layout/main-layout';
import { Loader2 } from 'lucide-react';

export default function IntegrationsPage() {
  // Fetch connected social accounts
  const { 
    data: socialAccounts, 
    isLoading
  } = useQuery<SocialAccount[]>({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations');
      const data = await response.json();
      return data;
    }
  });

  // Helper function to check if a platform is connected
  const isConnected = (platform: string) => {
    if (!socialAccounts) return false;
    return socialAccounts.some(account => 
      account.platform === platform && account.isConnected
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-8">
        <AnimatedElement>
          <h1 className="text-3xl font-bold mb-8">Social Media Integrations</h1>
          
          <div className="grid grid-cols-1 gap-8">
            <SocialConnections />
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* LinkedIn Post Tool */}
                <AnimatedElement>
                  <Card>
                    <CardHeader>
                      <CardTitle>Create LinkedIn Post</CardTitle>
                      <CardDescription>
                        Share content to your connected LinkedIn account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LinkedInPost isConnected={isConnected('linkedin')} />
                    </CardContent>
                  </Card>
                </AnimatedElement>
                
                {/* Instructions for using integrations */}
                <AnimatedElement>
                  <Card>
                    <CardHeader>
                      <CardTitle>Using Social Integrations</CardTitle>
                      <CardDescription>
                        Tips for effective social media posting
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">LinkedIn Best Practices</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Keep your posts professional and industry-focused</li>
                          <li>Use 5-10 relevant hashtags to increase discoverability</li>
                          <li>Include a clear call-to-action in your posts</li>
                          <li>Post during business hours (9am-5pm) on weekdays</li>
                          <li>Images with text overlay perform better than plain images</li>
                          <li>Engage with comments to boost visibility</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Content Ideas for LinkedIn</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Industry news and trends</li>
                          <li>Company announcements and achievements</li>
                          <li>Behind-the-scenes glimpses of your work</li>
                          <li>Team member spotlights and introductions</li>
                          <li>Client testimonials and case studies</li>
                          <li>Tips and best practices in your field</li>
                          <li>Event promotions and recaps</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedElement>
              </>
            )}
          </div>
        </AnimatedElement>
      </div>
    </MainLayout>
  );
}