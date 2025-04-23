import { Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
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
  
  const userInitials = user?.username
    ? user.username.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : "U";
    
  const isAdmin = user?.isAdmin;
  const planType = user?.plan || 'ember';
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out."
        });
        // Force reload to clear state
        window.location.href = '/auth';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <a 
            href="/" 
            className="text-primary-dark font-bold text-3xl font-display tracking-tight cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
          >
            <span className="text-primary">Kontent</span>Fire
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
          </button>
          
          {/* Plan badge - moved next to bell icon */}
          <span className={cn(
            "text-dark font-semibold text-xs px-2 py-1 rounded hidden sm:inline-block",
            planType === 'ember' ? "bg-secondary" : "bg-primary"
          )}>
            {planType === 'ember' ? 'EMBER PLAN' : 'INFERNO PLAN'}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                  planType === 'ember' ? "bg-secondary-light" : "bg-primary-light"
                )}>
                  {userInitials}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user?.username}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a 
                  href="/settings" 
                  className="cursor-pointer w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/settings';
                  }}
                >
                  Profile Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a 
                  href="/subscription" 
                  className="cursor-pointer w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '/subscription';
                  }}
                >
                  Subscription
                </a>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem>
                  <a 
                    href="/admin" 
                    className="cursor-pointer w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/admin';
                    }}
                  >
                    Admin Portal
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer text-red-500">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
