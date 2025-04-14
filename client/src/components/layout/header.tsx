import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  
  const userInitials = user?.username
    ? user.username.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : "U";
    
  const isAdmin = user?.isAdmin;
  const planType = user?.plan || 'blaze';
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <a className="text-primary-dark font-bold text-3xl font-display tracking-tight">
              <span className="text-primary">Kontent</span>Fire
            </a>
          </Link>
          
          {/* Plan badge */}
          <span className={cn(
            "text-dark font-semibold text-xs px-2 py-1 rounded ml-2 hidden sm:inline-block",
            planType === 'blaze' ? "bg-secondary" : "bg-primary"
          )}>
            {planType === 'blaze' ? 'BLAZE PLAN' : 'INFERNO PLAN'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                  planType === 'blaze' ? "bg-secondary-light" : "bg-primary-light"
                )}>
                  {userInitials}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user?.username}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <a className="cursor-pointer w-full">Profile Settings</a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription">
                  <a className="cursor-pointer w-full">Subscription</a>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <a className="cursor-pointer w-full">Admin Portal</a>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending} className="cursor-pointer text-red-500">
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
