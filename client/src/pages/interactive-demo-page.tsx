import React, { useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import InteractiveHover, { HoverEffectType } from '@/components/ui/interactive-hover';
import { primaryRgba } from '@/lib/color-utils';
import { Icons } from '@/components/icons';

const InteractiveDemoPage = () => {
  const [selectedEffect, setSelectedEffect] = useState<HoverEffectType>('pulse');
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'strong'>('strong');

  const effectOptions: { value: HoverEffectType; label: string; description: string }[] = [
    { value: 'scale', label: 'Scale', description: 'Smoothly increases the size on hover' },
    { value: 'glow', label: 'Glow', description: 'Adds a glowing effect around the element' },
    { value: 'lift', label: 'Lift', description: 'Raises the element up with a subtle shadow' },
    { value: 'tilt', label: 'Tilt', description: 'Tilts the element based on cursor position' },
    { value: 'float', label: 'Float', description: 'Creates a gentle floating animation' },
    { value: 'bounce', label: 'Bounce', description: 'Adds a playful bouncing effect' },
    { value: 'magnetic', label: 'Magnetic', description: 'Element follows the cursor like a magnet' },
    { value: 'highlight', label: 'Highlight', description: 'Changes background color on hover' },
    { value: 'pulse', label: 'Pulse', description: 'Creates a pulsing animation effect' },
  ];

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interactive Hover Effects</h1>
            <p className="text-muted-foreground">
              Explore various interactive hover effects that can be applied to UI elements throughout the application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Effect Controls</CardTitle>
                  <CardDescription>Customize the interactive hover effects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="effect-select">Effect Type</Label>
                    <Select
                      value={selectedEffect}
                      onValueChange={(value) => setSelectedEffect(value as HoverEffectType)}
                    >
                      <SelectTrigger id="effect-select">
                        <SelectValue placeholder="Select an effect" />
                      </SelectTrigger>
                      <SelectContent>
                        {effectOptions.map((effect) => (
                          <SelectItem key={effect.value} value={effect.value}>
                            {effect.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {effectOptions.find((e) => e.value === selectedEffect)?.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Intensity</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={intensity === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIntensity('light')}
                      >
                        Light
                      </Button>
                      <Button
                        variant={intensity === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIntensity('medium')}
                      >
                        Medium
                      </Button>
                      <Button
                        variant={intensity === 'strong' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIntensity('strong')}
                      >
                        Strong
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded-md bg-muted overflow-auto text-xs">
                    {`<InteractiveHover 
  effect="${selectedEffect}"
  intensity="${intensity}"
>
  {children}
</InteractiveHover>`}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Hover over elements to see the effects</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-8 min-h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Button example */}
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-medium">Button</h3>
                      <InteractiveHover effect={selectedEffect} intensity={intensity}>
                        <Button size="lg" className="w-full bg-primary text-white hover:bg-primary/90">
                          Hover Me
                        </Button>
                      </InteractiveHover>
                    </div>

                    {/* Card example */}
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-medium">Card</h3>
                      <InteractiveHover effect={selectedEffect} intensity={intensity}>
                        <Card className="w-full">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Interactive Card</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs">Hover to see the effect in action</p>
                          </CardContent>
                        </Card>
                      </InteractiveHover>
                    </div>

                    {/* Icon example */}
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-medium">Icon</h3>
                      <InteractiveHover effect={selectedEffect} intensity={intensity}>
                        <div className="p-6 rounded-full bg-neutral-100">
                          <Icons.flame className="h-8 w-8 text-primary" />
                        </div>
                      </InteractiveHover>
                    </div>

                    {/* Image example */}
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-medium">Image</h3>
                      <InteractiveHover effect={selectedEffect} intensity={intensity}>
                        <div className="w-full h-32 rounded-md bg-gradient-to-r from-primary/30 to-primary/60 flex items-center justify-center">
                          <span className="text-white font-medium">Image Placeholder</span>
                        </div>
                      </InteractiveHover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InteractiveDemoPage;