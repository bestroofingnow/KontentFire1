/**
 * LinkedIn Integration Demo Page
 * 
 * This page demonstrates how to use the LinkedIn integration components:
 * - LinkedInConnectButton for connecting to LinkedIn
 * - LinkedInPost for posting content to LinkedIn
 */

import React, { useState } from 'react';
import { LinkedInConnectButton } from '@/components/integrations/linked-in-connect-button';
import { LinkedInPost } from '@/components/integrations/linked-in-post';
import { Button } from '@/components/ui/button';

export default function LinkedInIntegrationDemo() {
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [showConnectCard, setShowConnectCard] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  
  // Handle LinkedIn connection status change
  const handleLinkedInStatusChange = (connected: boolean) => {
    setIsLinkedInConnected(connected);
    
    if (connected) {
      // If connected, hide the connect card and show the post form
      setShowConnectCard(false);
      setShowPostForm(true);
    }
  };
  
  // Handle post success
  const handlePostSuccess = (result: any) => {
    console.log('Post shared successfully:', result);
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">LinkedIn Integration</h1>
          <LinkedInConnectButton 
            onStatusChange={handleLinkedInStatusChange} 
          />
        </div>
        
        <div className="border-b pb-4 mb-6">
          <p className="text-muted-foreground">
            Connect your LinkedIn account to share content directly to your profile.
          </p>
        </div>
        
        {showConnectCard && !isLinkedInConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">Connect Your LinkedIn Account</h2>
            <p className="text-gray-600 mb-6">
              To share content directly to LinkedIn, you need to connect your LinkedIn account.
              Click the button below to authorize Kontent Fire to post on your behalf.
            </p>
            <LinkedInConnectButton 
              variant="card" 
              onStatusChange={handleLinkedInStatusChange} 
            />
          </div>
        )}
        
        {isLinkedInConnected && !showPostForm && (
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => setShowPostForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create LinkedIn Post
            </Button>
          </div>
        )}
        
        {showPostForm && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Create LinkedIn Post</h2>
            <LinkedInPost 
              defaultText="Check out this awesome content from Kontent Fire! #contentmarketing #socialmedia"
              onSuccess={handlePostSuccess}
              showCreateAnimation={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}