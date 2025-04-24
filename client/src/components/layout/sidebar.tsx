import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  Home, 
  PenTool, 
  Calendar, 
  BarChart2, 
  Zap, 
  Settings,
  Flame,
  Shield,
  SearchCheck,
  FileText,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Create a hook for sidebar state that uses localStorage
export function useSidebarState() {
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

export default function Sidebar() {
  const [location] = useLocation();
  const [user, setUser] = useState<any>(null);
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  
  // Fetch user on component mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }

    fetchUser();
  }, []);

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
    { name: 'Settings', href: '/settings', icon: Settings },
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
        "bg-dark text-white flex-shrink-0 hidden md:flex flex-col relative transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-primary text-white shadow-md z-10"
      >
        {isCollapsed ? 
          <ChevronRight className="h-4 w-4" /> : 
          <ChevronLeft className="h-4 w-4" />
        }
      </Button>

      <nav className="flex flex-col h-full">
        <div className="p-4 md:py-8">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                {isCollapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a 
                          href={item.premiumOnly && user?.plan !== item.premiumPlan ? '#' : item.href}
                          className={cn(
                            "flex items-center justify-center rounded-lg p-3",
                            location === item.href 
                              ? "text-white bg-primary" 
                              : "text-gray-300 hover:bg-dark-lighter",
                            item.premiumOnly && user?.plan !== item.premiumPlan 
                              ? "opacity-70 cursor-not-allowed" 
                              : "cursor-pointer"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            if (item.premiumOnly && user?.plan !== item.premiumPlan) {
                              window.location.href = '/subscription';
                            } else {
                              window.location.href = item.href;
                            }
                          }}
                        >
                          <div className="relative">
                            <item.icon className="h-6 w-6" />
                            {item.premiumOnly && user?.plan !== item.premiumPlan && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-500 flex items-center justify-center">
                                <Flame className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col">
                        <span>{item.name}</span>
                        {item.premiumOnly && user?.plan !== item.premiumPlan && (
                          <span className="text-xs text-gray-400 flex items-center mt-1">
                            <Flame className="h-3 w-3 mr-1 text-primary" />
                            Inferno Plan Only
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <a 
                    href={item.premiumOnly && user?.plan !== item.premiumPlan ? '#' : item.href}
                    className={cn(
                      "flex items-center justify-between rounded-lg p-3 px-4",
                      location === item.href 
                        ? "text-white bg-primary" 
                        : "text-gray-300 hover:bg-dark-lighter",
                      item.premiumOnly && user?.plan !== item.premiumPlan 
                        ? "opacity-70 cursor-not-allowed" 
                        : "cursor-pointer"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.premiumOnly && user?.plan !== item.premiumPlan) {
                        window.location.href = '/subscription';
                      } else {
                        window.location.href = item.href;
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium truncate">{item.name}</span>
                      )}
                    </div>
                    
                    {!isCollapsed && item.premiumOnly && (
                      <div className="ml-2 flex-shrink-0">
                        {user?.plan === item.premiumPlan ? (
                          <div className="flex text-xs px-1.5 py-0.5 rounded bg-primary/30 text-white">
                            <Flame className="h-3.5 w-3.5 mr-1" />
                            <span>Inferno</span>
                          </div>
                        ) : (
                          <div className="flex text-xs px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                            <Flame className="h-3.5 w-3.5 mr-1" />
                            <span>Inferno Only</span>
                          </div>
                        )}
                      </div>
                    )}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {!isCollapsed && (
          <div className="mt-auto p-4">
            <div className="bg-dark-lighter rounded-lg p-4 text-center">
              {user?.plan === 'ember' ? (
                <>
                  <div className="mb-2">
                    <span className="font-semibold text-sm">Upgrade to Inferno</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">Get unlimited platform integrations and video content.</p>
                  <a 
                    href="/subscription" 
                    className="w-full block bg-primary text-white rounded py-2 text-sm font-medium hover:bg-primary-dark transition cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/subscription';
                    }}
                  >
                    Upgrade Now
                  </a>
                </>
              ) : (
                <>
                  <div className="mb-2">
                    <span className="font-semibold text-sm flex items-center justify-center">
                      <Flame className="h-4 w-4 mr-1 text-secondary" />
                      Inferno Plan
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">You're enjoying our premium features.</p>
                  <a 
                    href="/subscription" 
                    className="w-full block border border-gray-600 text-gray-300 rounded py-2 text-sm font-medium hover:bg-dark-lighter transition cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/subscription';
                    }}
                  >
                    Manage Subscription
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
