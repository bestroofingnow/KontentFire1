import React from 'react';
import { LinkedInPost } from '@/components/integrations/linked-in-post';
import { LinkedInConnectButton } from '@/components/integrations/linked-in-connect-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function LinkedInDemoPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LinkedIn Integration Demo</h1>
        <p className="text-gray-500 mb-4">
          Test the LinkedIn integration functionality here
        </p>
        <Separator className="my-4" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>LinkedIn Connection</CardTitle>
            <CardDescription>
              Connect your LinkedIn account to enable posting directly to your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <LinkedInConnectButton variant="card" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post to LinkedIn</CardTitle>
            <CardDescription>
              Create and publish content directly to your LinkedIn profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedInPost 
              defaultText="Check out this amazing post created with Kontent Fire!" 
              showCreateAnimation={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}