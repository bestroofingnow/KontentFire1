import React from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import InteractiveHover from '@/components/ui/interactive-hover';
import { Icons } from '@/components/icons';

export function Header() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link href="/">
            <InteractiveHover effect="lift" intensity="light" className="flex items-center cursor-pointer">
              <div className="flex items-center">
                <Icons.flame className="h-7 w-7 text-primary mr-2" />
                <span className="font-bold text-lg">Kontent Fire</span>
              </div>
            </InteractiveHover>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <InteractiveHover effect="glow" intensity="medium">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full" />
            </Button>
          </InteractiveHover>

          <DropdownMenu>
            <InteractiveHover effect="scale" intensity="light">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.username || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </InteractiveHover>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}