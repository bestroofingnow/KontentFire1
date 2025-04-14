import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, PenTool, Calendar, Menu } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Content', href: '/content', icon: PenTool },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Menu', href: '/menu', icon: Menu, isMobileOnly: true },
  ];

  return (
    <div className="bg-dark fixed bottom-0 left-0 right-0 flex justify-around py-2 md:hidden z-10">
      {navItems.map((item) => (
        <Link key={item.name} href={item.href}>
          <a className={cn(
            "p-2 rounded-full",
            location === item.href 
              ? "text-white bg-primary" 
              : "text-gray-300 hover:text-white"
          )}>
            <item.icon className="h-6 w-6" />
          </a>
        </Link>
      ))}
    </div>
  );
}
