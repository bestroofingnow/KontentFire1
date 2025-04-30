import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight,
  Home,
  PenTool, 
  Calendar, 
  BarChart2, 
  Zap, 
  Settings,
  Flame,
  Shield,
  FileText,
  GitBranch,
  SearchCheck,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import InteractiveHover from '@/components/ui/interactive-hover';

// Create a hook for sidebar state that uses localStorage
function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage if available
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState === 'true';
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  return { isCollapsed, setIsCollapsed };
}

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebarState();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { 
      name: 'Content', 
      href: '/content', 
      icon: PenTool,
      premiumOnly: true,
      premiumPlan: 'inferno'
    },
    { name: 'Auto Posting', href: '/auto-posting-setup', icon: Flame },
    { 
      name: 'PR Kreation', 
      href: '/pr-kreation', 
      icon: FileText,
      premiumOnly: true,
      premiumPlan: 'inferno'
    },
    { 
      name: 'Pipelines', 
      href: '/pipelines', 
      icon: GitBranch,
      premiumOnly: true,
      premiumPlan: 'inferno'
    },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Fact Check', href: '/fact-check', icon: SearchCheck },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Integrations', href: '/integrations', icon: Zap },
    { name: 'Animation Demo', href: '/animation-demo', icon: Zap },
    { name: 'Interactive Demo', href: '/interactive-demo', icon: Zap },
    { name: 'Settings & Brand', href: '/settings', icon: Settings },
  ];

  // Add admin route if user is admin
  if (user?.isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside 
      className={cn(
        "bg-muted/30 border-r border-border flex-shrink-0 hidden md:flex flex-col relative transition-all duration-300 h-full",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle button */}
      <InteractiveHover effect="scale" intensity="medium">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full shadow-md z-10"
        >
          {isCollapsed ? 
            <ChevronRight className="h-3 w-3" /> : 
            <ChevronLeft className="h-3 w-3" />
          }
        </Button>
      </InteractiveHover>

      <div className="p-2 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const isPremiumLocked = item.premiumOnly && user?.plan !== item.premiumPlan;

            if (isCollapsed) {
              return (
                <li key={item.name}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={isPremiumLocked ? '/subscription' : item.href}>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="icon"
                            className={cn(
                              "w-full h-10 flex justify-center",
                              isPremiumLocked && "opacity-50"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            {isPremiumLocked && (
                              <div className="absolute top-0 right-0">
                                <Flame className="h-3 w-3 text-primary" />
                              </div>
                            )}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                        {isPremiumLocked && (
                          <p className="text-xs text-primary">Inferno Plan Only</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link href={isPremiumLocked ? '/subscription' : item.href}>
                  <InteractiveHover
                    effect={isActive ? "none" : "highlight"}
                    intensity="light"
                    disabled={isActive}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isPremiumLocked && "opacity-70"
                      )}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.name}
                      {isPremiumLocked && (
                        <div className="ml-auto">
                          <Flame className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </Button>
                  </InteractiveHover>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}