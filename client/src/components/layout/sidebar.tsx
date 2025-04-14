import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  PenTool, 
  Calendar, 
  BarChart2, 
  Zap, 
  Settings,
  Flame,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Content', href: '/content', icon: PenTool },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Integrations', href: '/integrations', icon: Zap },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Add admin route if user is admin
  if (user?.isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  return (
    <aside className="bg-dark text-white w-16 md:w-64 flex-shrink-0 hidden md:block">
      <nav className="flex flex-col h-full">
        <div className="p-4 md:py-8">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 rounded-lg p-3 md:px-4",
                    location === item.href 
                      ? "text-white bg-primary" 
                      : "text-gray-300 hover:bg-dark-lighter"
                  )}>
                    <item.icon className="h-6 w-6" />
                    <span className="hidden md:inline font-medium">{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto p-4">
          <div className="bg-dark-lighter rounded-lg p-4 text-center hidden md:block">
            {user?.plan === 'blaze' ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold text-sm">Upgrade to Inferno</span>
                </div>
                <p className="text-gray-400 text-xs mb-3">Get auto-scheduling, video content, and more.</p>
                <Link href="/subscription">
                  <a className="w-full block bg-primary text-white rounded py-2 text-sm font-medium hover:bg-primary-dark transition">
                    Upgrade Now
                  </a>
                </Link>
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
                <Link href="/subscription">
                  <a className="w-full block border border-gray-600 text-gray-300 rounded py-2 text-sm font-medium hover:bg-dark-lighter transition">
                    Manage Subscription
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}
