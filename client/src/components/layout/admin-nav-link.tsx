import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function AdminNavLink() {
  const { user } = useAuth();
  
  // Only render if user is an admin
  if (!user?.isAdmin) {
    return null;
  }
  
  return (
    <div className="mt-2 pt-2 border-t">
      <Link
        href="/admin"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-800 hover:text-amber-700 hover:bg-amber-50 rounded-md"
      >
        <ShieldCheck className="h-4 w-4" />
        Admin Portal
      </Link>
    </div>
  );
}