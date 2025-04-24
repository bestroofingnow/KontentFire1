import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, Search, Download, Trash, RefreshCw, 
  Moon, Sun, Check, X, Info, AlertTriangle, ArrowRight,
  Loader2, RotateCw, ChevronDown, Heart, Star, 
  Settings, User, Zap
} from 'lucide-react';

import { AnimatedElement } from '@/components/ui/animated-element';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedLoading } from '@/components/ui/animated-loading';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { AnimatedToast } from '@/components/ui/animated-toast';
import { useAnimationState } from '@/hooks/use-animation-state';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

/**
 * Animation Demo Page - Showcases all available animations and micro-interactions
 */
const AnimationDemoPage: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Animation states for demo elements
  const buttonAnimation = useAnimationState();
  const cardAnimation = useAnimationState();
  const iconAnimation = useAnimationState();

  // Handle button animation demo
  const handleAnimatedButtonClick = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
      }, 1500);
    }, 1500);
  };

  // Show the animated toast
  const showAnimatedToast = (variant: 'default' | 'success' | 'error' | 'warning' | 'info') => {
    const titles = {
      default: 'Notification',
      success: 'Success!',
      error: 'Error Occurred',
      warning: 'Warning',
      info: 'Information',
    };
    
    const descriptions = {
      default: 'This is a standard notification message.',
      success: 'Your action was completed successfully!',
      error: 'There was a problem processing your request.',
      warning: 'This action might have unexpected results.',
      info: 'Here\'s some information you should know.',
    };
    
    toast({
      title: titles[variant],
      description: descriptions[variant],
      variant,
      asChild: true,
      children: (
        <AnimatedToast
          title={titles[variant]}
          description={descriptions[variant]}
          variant={variant}
        />
      ),
    });
  };

  return (
    <div className="container py-10 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Animation & Micro-Interactions</h1>
        <p className="text-muted-foreground mb-8">
          Explore the various animated components and micro-interactions available in Kontent Fire.
        </p>
      </motion.div>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="loaders">Loaders</TabsTrigger>
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="elements">Elements</TabsTrigger>
        </TabsList>

        {/* Animated Buttons Section */}
        <TabsContent value="buttons" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Animated Buttons</CardTitle>
              <CardDescription>Interactive buttons with various animation effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Button Animation Types</h3>
                  <div className="space-y-2">
                    <AnimatedButton animationType="bounce">Bounce</AnimatedButton>
                    <AnimatedButton animationType="scale">Scale</AnimatedButton>
                    <AnimatedButton animationType="pulse">Pulse</AnimatedButton>
                    <AnimatedButton animationType="ripple">Ripple</AnimatedButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">With Icons</h3>
                  <div className="space-y-2">
                    <AnimatedButton iconLeft={<PlusCircle className="w-4 h-4" />} iconAnimation="bounce">
                      Create New
                    </AnimatedButton>
                    <AnimatedButton iconRight={<ArrowRight className="w-4 h-4" />} iconAnimation="slide">
                      Next Step
                    </AnimatedButton>
                    <AnimatedButton iconLeft={<Search className="w-4 h-4" />} iconAnimation="none">
                      Search
                    </AnimatedButton>
                    <AnimatedButton iconLeft={<Download className="w-4 h-4" />} iconAnimation="spin">
                      Download
                    </AnimatedButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">States</h3>
                  <div className="space-y-2">
                    <AnimatedButton
                      isLoading={isLoading}
                      isSuccess={isSuccess}
                      onClick={handleAnimatedButtonClick}
                    >
                      Click Me
                    </AnimatedButton>
                    <AnimatedButton isLoading={true} loadingAnimation="pulse">Loading (Pulse)</AnimatedButton>
                    <AnimatedButton isLoading={true} loadingAnimation="dots">Loading (Dots)</AnimatedButton>
                    <AnimatedButton isSuccess={true}>Success State</AnimatedButton>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Variants</h3>
                  <div className="space-y-2">
                    <AnimatedButton variant="destructive" iconLeft={<Trash className="w-4 h-4" />}>
                      Delete
                    </AnimatedButton>
                    <AnimatedButton variant="outline" iconLeft={<RefreshCw className="w-4 h-4" />}>
                      Refresh
                    </AnimatedButton>
                    <AnimatedButton variant="secondary" iconLeft={<Settings className="w-4 h-4" />}>
                      Settings
                    </AnimatedButton>
                    <AnimatedButton variant="ghost" iconLeft={<User className="w-4 h-4" />}>
                      Profile
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => showAnimatedToast('info')}
                className="ml-auto"
              >
                Show More
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Animated Cards Section */}
        <TabsContent value="cards" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard hoverEffect="lift" clickEffect="press" entrance="fade" delay={0.1}>
              <CardHeader>
                <CardTitle>Lift Effect</CardTitle>
                <CardDescription>Card rises on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the lift hover effect with a press click animation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Interact with me</Button>
              </CardFooter>
            </AnimatedCard>

            <AnimatedCard hoverEffect="glow" clickEffect="pulse" entrance="scale" delay={0.2}>
              <CardHeader>
                <CardTitle>Glow Effect</CardTitle>
                <CardDescription>Card glows on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the glow hover effect with a pulse click animation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Interact with me</Button>
              </CardFooter>
            </AnimatedCard>

            <AnimatedCard hoverEffect="border" clickEffect="shake" entrance="slide" delay={0.3}>
              <CardHeader>
                <CardTitle>Border Effect</CardTitle>
                <CardDescription>Card gets border on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the border hover effect with a shake click animation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Interact with me</Button>
              </CardFooter>
            </AnimatedCard>

            <AnimatedCard hoverEffect="scale" clickEffect="press" intensity="high" entrance="fade" delay={0.4}>
              <CardHeader>
                <CardTitle>Scale Effect (High)</CardTitle>
                <CardDescription>Card scales on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the scale hover effect with high intensity.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Interact with me</Button>
              </CardFooter>
            </AnimatedCard>

            <AnimatedCard hoverEffect="rotate" clickEffect="press" entrance="scale" delay={0.5}>
              <CardHeader>
                <CardTitle>Rotate Effect</CardTitle>
                <CardDescription>Card rotates slightly on hover</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card demonstrates the rotation hover effect with a press click animation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Interact with me</Button>
              </CardFooter>
            </AnimatedCard>

            <AnimatedCard hoverEffect="none" clickEffect="none" isInteractive={false} entrance="fade" delay={0.6}>
              <CardHeader>
                <CardTitle>Non-Interactive</CardTitle>
                <CardDescription>Card without animations</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card has no hover or click effects, and doesn't react to user interaction.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" disabled>No interactions</Button>
              </CardFooter>
            </AnimatedCard>
          </div>
        </TabsContent>

        {/* Animated Loaders Section */}
        <TabsContent value="loaders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading Animations</CardTitle>
              <CardDescription>Various loading indicator styles and sizes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">Spinner</h3>
                  <AnimatedLoading variant="spinner" size="sm" />
                  <AnimatedLoading variant="spinner" size="md" />
                  <AnimatedLoading variant="spinner" size="lg" />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">Dots</h3>
                  <AnimatedLoading variant="dots" size="sm" />
                  <AnimatedLoading variant="dots" size="md" />
                  <AnimatedLoading variant="dots" size="lg" />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">Pulse</h3>
                  <AnimatedLoading variant="pulse" size="sm" />
                  <AnimatedLoading variant="pulse" size="md" />
                  <AnimatedLoading variant="pulse" size="lg" />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">Bars</h3>
                  <AnimatedLoading variant="bars" size="sm" />
                  <AnimatedLoading variant="bars" size="md" />
                  <AnimatedLoading variant="bars" size="lg" />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">Grid</h3>
                  <AnimatedLoading variant="grid" size="sm" />
                  <AnimatedLoading variant="grid" size="md" />
                  <AnimatedLoading variant="grid" size="lg" />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-4">With Text</h3>
                  <AnimatedLoading 
                    variant="spinner" 
                    size="md" 
                    text="Loading content..." 
                  />
                  <AnimatedLoading 
                    variant="dots" 
                    size="md" 
                    text="Please wait..." 
                  />
                  <AnimatedLoading 
                    variant="bars" 
                    size="md" 
                    text="Processing..." 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => showAnimatedToast('warning')}
                className="ml-auto"
              >
                Show More
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Animated Icons Section */}
        <TabsContent value="icons" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Animated Icons</CardTitle>
              <CardDescription>Icons with various animation effects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-4">
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Spin</h3>
                  <AnimatedIcon 
                    icon={<RefreshCw />} 
                    animation="spin" 
                    size="lg" 
                    continuous={true}
                  />
                  <AnimatedIcon 
                    icon={<RotateCw />} 
                    animation="spin" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Pulse</h3>
                  <AnimatedIcon 
                    icon={<Heart />} 
                    animation="pulse" 
                    size="lg" 
                    continuous={true}
                    color="rgb(239, 68, 68)"
                  />
                  <AnimatedIcon 
                    icon={<Heart />} 
                    animation="pulse" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Bounce</h3>
                  <AnimatedIcon 
                    icon={<ChevronDown />} 
                    animation="bounce" 
                    size="lg" 
                    continuous={true}
                  />
                  <AnimatedIcon 
                    icon={<ChevronDown />} 
                    animation="bounce" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Shake</h3>
                  <AnimatedIcon 
                    icon={<AlertTriangle />} 
                    animation="shake" 
                    size="lg" 
                    continuous={true}
                    color="rgb(245, 158, 11)"
                  />
                  <AnimatedIcon 
                    icon={<AlertTriangle />} 
                    animation="shake" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Wiggle</h3>
                  <AnimatedIcon 
                    icon={<Settings />} 
                    animation="wiggle" 
                    size="lg" 
                    continuous={true}
                  />
                  <AnimatedIcon 
                    icon={<Settings />} 
                    animation="wiggle" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Ping</h3>
                  <AnimatedIcon 
                    icon={<Zap />} 
                    animation="ping" 
                    size="lg" 
                    continuous={true}
                    color="rgb(59, 130, 246)"
                  />
                  <AnimatedIcon 
                    icon={<Zap />} 
                    animation="ping" 
                    size="lg" 
                    continuous={false}
                    isButton
                  />
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Size Variants</h3>
                  <div className="flex items-center space-x-4">
                    <AnimatedIcon 
                      icon={<Star />} 
                      animation="pulse" 
                      size="sm" 
                      continuous={true}
                      color="rgb(245, 158, 11)"
                    />
                    <AnimatedIcon 
                      icon={<Star />} 
                      animation="pulse" 
                      size="md" 
                      continuous={true}
                      color="rgb(245, 158, 11)"
                    />
                    <AnimatedIcon 
                      icon={<Star />} 
                      animation="pulse" 
                      size="lg" 
                      continuous={true}
                      color="rgb(245, 158, 11)"
                    />
                    <AnimatedIcon 
                      icon={<Star />} 
                      animation="pulse" 
                      size="xl" 
                      continuous={true}
                      color="rgb(245, 158, 11)"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Theme Icons</h3>
                  <div className="flex items-center space-x-4">
                    <AnimatedIcon 
                      icon={<Sun />} 
                      animation="spin" 
                      size="lg" 
                      continuous={true}
                      color="rgb(245, 158, 11)"
                    />
                    <AnimatedIcon 
                      icon={<Moon />} 
                      animation="pulse" 
                      size="lg" 
                      continuous={true}
                      color="rgb(99, 102, 241)"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Status Icons</h3>
                  <div className="flex items-center space-x-4">
                    <AnimatedIcon 
                      icon={<Check />} 
                      animation="bounce" 
                      size="lg" 
                      continuous={false}
                      isButton
                      color="rgb(34, 197, 94)"
                    />
                    <AnimatedIcon 
                      icon={<X />} 
                      animation="shake" 
                      size="lg" 
                      continuous={false}
                      isButton
                      color="rgb(239, 68, 68)"
                    />
                    <AnimatedIcon 
                      icon={<Info />} 
                      animation="ping" 
                      size="lg" 
                      continuous={false}
                      isButton
                      color="rgb(59, 130, 246)"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="text-sm font-medium mb-2">Interactive</h3>
                  <div className="flex items-center space-x-4">
                    <AnimatedIcon 
                      icon={<Settings />} 
                      animation="spin" 
                      size="lg" 
                      isButton
                      onClick={() => showAnimatedToast('success')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => showAnimatedToast('error')}
                className="ml-auto"
              >
                Show More
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Animated Elements Section */}
        <TabsContent value="elements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Animated Elements</CardTitle>
              <CardDescription>General purpose animated elements and toasts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Animation Types</h3>
                  
                  <div className="space-y-4">
                    <AnimatedElement animation="bounce" className="p-4 bg-primary/5 rounded-md">
                      <p>Bounce Animation</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="pulse" repeat={3} className="p-4 bg-primary/5 rounded-md">
                      <p>Pulse Animation (3 times)</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="pop" className="p-4 bg-primary/5 rounded-md">
                      <p>Pop Animation</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="slide-in" className="p-4 bg-primary/5 rounded-md">
                      <p>Slide-in Animation</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="fade" className="p-4 bg-primary/5 rounded-md">
                      <p>Fade Animation</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="scale" className="p-4 bg-primary/5 rounded-md">
                      <p>Scale Animation</p>
                    </AnimatedElement>
                    
                    <AnimatedElement animation="wiggle" repeat={true} className="p-4 bg-primary/5 rounded-md">
                      <p>Wiggle Animation (continuous)</p>
                    </AnimatedElement>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-sm font-medium">Toast Notifications</h3>
                  
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={() => showAnimatedToast('default')}
                      className="w-full"
                    >
                      Show Default Toast
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => showAnimatedToast('success')}
                      className="w-full"
                    >
                      Show Success Toast
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => showAnimatedToast('error')}
                      className="w-full"
                    >
                      Show Error Toast
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => showAnimatedToast('warning')}
                      className="w-full"
                    >
                      Show Warning Toast
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => showAnimatedToast('info')}
                      className="w-full"
                    >
                      Show Info Toast
                    </Button>
                  </div>
                  
                  <h3 className="text-sm font-medium mt-6">Interactive Form Elements</h3>
                  
                  <div className="space-y-4">
                    <AnimatedElement animation="fade" whileHover={true}>
                      <Input placeholder="Animated input field..." />
                    </AnimatedElement>
                    
                    <AnimatedElement animation="scale" whileHover={true}>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                            <SelectItem value="option3">Option 3</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </AnimatedElement>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => showAnimatedToast('success')}
                className="ml-auto"
              >
                Show More
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnimationDemoPage;