import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, PenTool, Calendar, Menu, ShieldCheck, SearchCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileNav() {
  const [location] = useLocation();
  const [user, setUser] = useState<any>(null);
  
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
  
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Content', href: '/content', icon: PenTool },
    { name: 'Fact Check', href: '/fact-check', icon: SearchCheck },
    { name: 'Menu', href: '/menu', icon: Menu, isMobileOnly: true },
  ];

  // Add admin link if user is admin
  if (user?.isAdmin) {
    navItems.splice(3, 0, { name: 'Admin', href: '/admin', icon: ShieldCheck });
  }

  return (
    <div className="bg-dark fixed bottom-0 left-0 right-0 flex justify-around py-2 md:hidden z-10">
      {navItems.map((item) => (
        <a 
          key={item.name}
          href={item.href}
          className={cn(
            "p-2 rounded-full cursor-pointer",
            location === item.href 
              ? "text-white bg-primary" 
              : "text-gray-300 hover:text-white",
            item.name === 'Admin' ? "text-amber-500" : ""
          )}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = item.href;
          }}
        >
          <item.icon className="h-6 w-6" />
        </a>
      ))}
    </div>
  );
}
