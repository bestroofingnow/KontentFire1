import { ArrowUp, ArrowDown } from "lucide-react";
import { SkeletonText, SkeletonWithShimmer } from "@/components/ui/skeleton-loader";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  iconColorClass?: string;
  isLoading?: boolean;
};

export default function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  iconColorClass = "text-primary",
  isLoading = false
}: StatCardProps) {
  const isPositive = change?.isPositive ?? true;
  
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-3 w-full">
            <SkeletonWithShimmer className="w-1/2">
              <SkeletonText className="h-4" />
            </SkeletonWithShimmer>
            <SkeletonWithShimmer className="w-1/3">
              <SkeletonText className="h-7" />
            </SkeletonWithShimmer>
          </div>
          <SkeletonWithShimmer>
            <div className="bg-gray-200 p-2 rounded-lg h-9 w-9"></div>
          </SkeletonWithShimmer>
        </div>
        
        <div className="mt-3">
          <SkeletonWithShimmer className="w-2/3">
            <SkeletonText className="h-4" />
          </SkeletonWithShimmer>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-dark">{value}</h3>
        </div>
        <div className={`${iconColorClass} bg-opacity-10 p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-3 flex items-center text-sm">
          <span className={`font-medium flex items-center ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change.value)}%
          </span>
          <span className="text-gray-500 ml-1">{change.label || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}
