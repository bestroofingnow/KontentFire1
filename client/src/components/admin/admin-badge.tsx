import { ShieldCheck } from "lucide-react";

export function AdminBadge() {
  return (
    <div className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-md">
      <ShieldCheck className="h-4 w-4 mr-1" />
      <span className="text-xs font-medium">Admin Access</span>
    </div>
  );
}