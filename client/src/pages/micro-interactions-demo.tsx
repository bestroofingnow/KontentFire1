import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, ArrowRight, Bell, RefreshCw, 
  CheckCircle, Clock, Star, Gift, Heart
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Import our micro-interaction components
import { HoverHighlight } from '@/components/ui/hover-highlight';
import { AnimatedText } from '@/components/ui/animated-text';
import { AnimatedBadge } from '@/components/ui/animated-badge';
import { PageTransition, TransitionElement } from '@/components/ui/page-transition';
import { CursorEffect } from '@/components/ui/cursor-effect';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedElement } from '@/components/ui/animated-element';

/**
 * MicroInteractionsDemo - Showcases all the micro-interaction components
 */
const MicroInteractionsDemo: React.FC = () => {
  const { toast } = useToast();
  const [cursorEffectActive, setCursorEffectActive] = useState(false);
  const [selectedCursorType, setSelectedCursorType] = useState<'dot' | 'trail' | 'gradient'>('dot');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Handle loading animation for buttons
  const handleLoadingButtonClick = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 1500);
    }, 1500);
  };
  
  // Sample data for demo list
  const demoItems = [
    { id: 1, title: 'Content Generation', icon: <Zap size={18} /> },
    { id: 2, title: 'Schedule Posts', icon: <Clock size={18} /> },
    { id: 3, title: 'Analyze Performance', icon: <Star size={18} /> },
    { id: 4, title: 'Engagement Tools', icon: <Heart size={18} /> },
    { id: 5, title: 'Special Offers', icon: <Gift size={18} /> },
  ];
  
  return (
    <div className="container py-10 space-y-8">
      {/* Optional cursor effect */}
      {cursorEffectActive && (
        <CursorEffect 
          type={selectedCursorType} 
          color="#FF5B2E"
          size={20}
          trailLength={6}
        />
      )}
      
      <TransitionElement effect="fade-in">
        <h1 className="text-3xl font-bold mb-2">Micro-Interactions Showcase</h1>
        <p className="text-muted-foreground mb-8">
          Explore the various micro-interactions available for enhancing UI engagement.
        </p>
      </TransitionElement>
      
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="text">Text Effects</TabsTrigger>
          <TabsTrigger value="hover">Hover Effects</TabsTrigger>
          <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
          <TabsTrigger value="cursor">Cursor Effects</TabsTrigger>
        </TabsList>
        
        {/* Text Animation Tab */}
        <TabsContent value="text" className="mt-6">
          <TransitionElement effect="slide-up" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Animated Text Effects</CardTitle>
                <CardDescription>
                  Text animations to highlight content and draw attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Wave Effect</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="wave" hoverTrigger={false}>
                          Hello Kontent Fire!
                        </AnimatedText>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Typewriter Effect</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="typewriter" hoverTrigger={false}>
                          Automated content creation
                        </AnimatedText>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Highlight Effect</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="highlight" hoverTrigger={false}>
                          Important information highlighted!
                        </AnimatedText>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Bounce Effect</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="bounce" hoverTrigger={false}>
                          Bouncy Text Animation
                        </AnimatedText>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Gradient Effect</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="gradient" hoverTrigger={false}>
                          Color changing gradient text
                        </AnimatedText>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Hover Triggered</h3>
                      <div className="p-4 border rounded-md flex items-center justify-center bg-muted/30">
                        <AnimatedText effect="wave" hoverTrigger={true}>
                          Hover over me to animate!
                        </AnimatedText>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TransitionElement>
        </TabsContent>
        
        {/* Hover Effects Tab */}
        <TabsContent value="hover" className="mt-6">
          <TransitionElement effect="slide-up" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Hover Highlight Effects</CardTitle>
                <CardDescription>
                  Interactive hover effects for lists and cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">List Items with Hover Effects</h3>
                    <div className="space-y-2 border rounded-md p-2">
                      {demoItems.map((item, index) => (
                        <HoverHighlight 
                          key={item.id} 
                          effect={index % 2 === 0 ? 'lift' : 'background'} 
                          className="p-3 rounded-md"
                          onClick={() => {
                            toast({
                              title: `Selected: ${item.title}`,
                              description: "Item clicked with hover effect",
                            });
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-primary">{item.icon}</span>
                            <span>{item.title}</span>
                          </div>
                        </HoverHighlight>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Lift Effect</h3>
                      <HoverHighlight effect="lift" className="p-4 border rounded-md">
                        <div className="text-center">
                          <p>Hover to lift card</p>
                        </div>
                      </HoverHighlight>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Glow Effect</h3>
                      <HoverHighlight effect="glow" className="p-4 border rounded-md">
                        <div className="text-center">
                          <p>Hover for glow effect</p>
                        </div>
                      </HoverHighlight>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Border Effect</h3>
                      <HoverHighlight effect="border" className="p-4 border rounded-md">
                        <div className="text-center">
                          <p>Hover for border highlight</p>
                        </div>
                      </HoverHighlight>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Scale Effect</h3>
                      <HoverHighlight effect="scale" className="p-4 border rounded-md">
                        <div className="text-center">
                          <p>Hover to scale up</p>
                        </div>
                      </HoverHighlight>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TransitionElement>
        </TabsContent>
        
        {/* Buttons & Badges Tab */}
        <TabsContent value="buttons" className="mt-6">
          <TransitionElement effect="slide-up" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Interactive Buttons & Badges</CardTitle>
                <CardDescription>
                  Animated buttons and badges for enhanced feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Animated Buttons</h3>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          <AnimatedButton 
                            animationType="bounce" 
                            iconRight={<ArrowRight size={16} />}
                            iconAnimation="slide"
                          >
                            Bounce
                          </AnimatedButton>
                          
                          <AnimatedButton 
                            animationType="scale" 
                            iconLeft={<RefreshCw size={16} />}
                            iconAnimation="spin"
                            variant="secondary"
                          >
                            Scale
                          </AnimatedButton>
                          
                          <AnimatedButton 
                            animationType="pulse" 
                            variant="outline"
                          >
                            Pulse
                          </AnimatedButton>
                          
                          <AnimatedButton 
                            animationType="ripple" 
                            variant="destructive"
                          >
                            Ripple
                          </AnimatedButton>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Loading States</h3>
                      <div className="flex flex-wrap gap-4">
                        <AnimatedButton
                          isLoading={isLoading}
                          isSuccess={isSuccess}
                          onClick={handleLoadingButtonClick}
                          loadingAnimation="spinner"
                        >
                          With Spinner
                        </AnimatedButton>
                        
                        <AnimatedButton
                          isLoading={isLoading}
                          isSuccess={isSuccess}
                          onClick={handleLoadingButtonClick}
                          loadingAnimation="dots"
                          variant="outline"
                        >
                          With Dots
                        </AnimatedButton>
                        
                        <AnimatedButton
                          isLoading={isLoading}
                          isSuccess={isSuccess}
                          onClick={handleLoadingButtonClick}
                          loadingAnimation="pulse"
                          variant="secondary"
                        >
                          With Pulse
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Animated Badges</h3>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          <AnimatedBadge effect="pulse" animate={true} variant="default">
                            New
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="shake" animate={true} variant="secondary">
                            Alert
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="bounce" animate={true} variant="destructive">
                            Important
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="tada" animate={true} variant="outline">
                            Update
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="pulse" animate={true} variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" /> 
                            Complete
                          </AnimatedBadge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Badge Sizes</h3>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <AnimatedBadge effect="pulse" animate={true} size="sm" variant="default">
                            Small
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="pulse" animate={true} size="default" variant="default">
                            Default
                          </AnimatedBadge>
                          
                          <AnimatedBadge effect="pulse" animate={true} size="lg" variant="default">
                            Large
                          </AnimatedBadge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Badge</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            <Button variant="outline" size="icon">
                              <Bell />
                            </Button>
                            <div className="absolute -top-2 -right-2">
                              <AnimatedBadge 
                                effect="pulse" 
                                animate={true} 
                                size="sm" 
                                variant="destructive"
                              >
                                3
                              </AnimatedBadge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TransitionElement>
        </TabsContent>
        
        {/* Transitions Tab */}
        <TabsContent value="transitions" className="mt-6">
          <TransitionElement effect="slide-up" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Page & Element Transitions</CardTitle>
                <CardDescription>
                  Smooth transitions for better visual flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Element Enter Animations</h3>
                      <div className="space-y-4">
                        <motion.div
                          className="flex gap-3 flex-wrap"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                        >
                          {['fade-in', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out'].map((effect, index) => (
                            <Button
                              key={effect}
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: `${effect} animation`,
                                  description: "Element transition effect",
                                });
                              }}
                            >
                              {effect}
                            </Button>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Staggered List Animation</h3>
                      <div className="border rounded-md p-4">
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: {
                              transition: {
                                staggerChildren: 0.1
                              }
                            }
                          }}
                        >
                          {demoItems.map((item) => (
                            <motion.div
                              key={item.id}
                              variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 }
                              }}
                              className="flex items-center space-x-2 p-2 mb-2 border-b last:border-b-0"
                            >
                              <span className="text-primary">{item.icon}</span>
                              <span>{item.title}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Content Appear Transitions</h3>
                      <div className="space-y-4">
                        <TransitionElement effect="fade-in" delay={0.2} className="p-4 bg-primary/5 rounded-md">
                          <p>Content with fade-in transition</p>
                        </TransitionElement>
                        
                        <TransitionElement effect="slide-up" delay={0.4} className="p-4 bg-primary/5 rounded-md">
                          <p>Content with slide-up transition</p>
                        </TransitionElement>
                        
                        <TransitionElement effect="zoom-in" delay={0.6} className="p-4 bg-primary/5 rounded-md">
                          <p>Content with zoom-in transition</p>
                        </TransitionElement>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Sequence Animation</h3>
                      <div className="border rounded-md p-4">
                        <div className="space-y-4">
                          <AnimatedElement 
                            animation="fade" 
                            delay={0.1} 
                            className="p-3 bg-primary/5 rounded-md"
                          >
                            <p>First element appears</p>
                          </AnimatedElement>
                          
                          <AnimatedElement 
                            animation="slide-in" 
                            delay={0.3} 
                            className="p-3 bg-primary/5 rounded-md"
                          >
                            <p>Second element slides in</p>
                          </AnimatedElement>
                          
                          <AnimatedElement 
                            animation="bounce" 
                            delay={0.5} 
                            className="p-3 bg-primary/5 rounded-md"
                          >
                            <p>Third element bounces in</p>
                          </AnimatedElement>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TransitionElement>
        </TabsContent>
        
        {/* Cursor Effects Tab */}
        <TabsContent value="cursor" className="mt-6">
          <TransitionElement effect="slide-up" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Cursor Effects</CardTitle>
                <CardDescription>
                  Custom cursor effects for a more playful experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="cursor-toggle">Enable Cursor Effect</Label>
                      <p className="text-sm text-muted-foreground">
                        Activate the custom cursor effect on this page
                      </p>
                    </div>
                    <Switch 
                      id="cursor-toggle" 
                      checked={cursorEffectActive}
                      onCheckedChange={setCursorEffectActive}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={`${!cursorEffectActive ? 'opacity-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Dot Cursor</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled={!cursorEffectActive}
                          onClick={() => setSelectedCursorType('dot')}
                        >
                          {selectedCursorType === 'dot' ? 'Selected' : 'Select'}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className={`${!cursorEffectActive ? 'opacity-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Trail Cursor</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled={!cursorEffectActive}
                          onClick={() => setSelectedCursorType('trail')}
                        >
                          {selectedCursorType === 'trail' ? 'Selected' : 'Select'}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className={`${!cursorEffectActive ? 'opacity-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">Gradient Cursor</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled={!cursorEffectActive}
                          onClick={() => setSelectedCursorType('gradient')}
                        >
                          {selectedCursorType === 'gradient' ? 'Selected' : 'Select'}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-8 border rounded-md text-center">
                    <h3 className="text-lg font-medium mb-4">Cursor Effect Test Area</h3>
                    <p className="text-muted-foreground mb-4">
                      {cursorEffectActive 
                        ? `Move your cursor around to see the ${selectedCursorType} effect in action!` 
                        : 'Enable the cursor effect above to see custom cursors'}
                    </p>
                    <Button 
                      variant="default"
                      onClick={() => {
                        toast({
                          title: "Button Clicked",
                          description: "Notice the cursor interaction with the button",
                        });
                      }}
                    >
                      Test Button
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TransitionElement>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MicroInteractionsDemo;