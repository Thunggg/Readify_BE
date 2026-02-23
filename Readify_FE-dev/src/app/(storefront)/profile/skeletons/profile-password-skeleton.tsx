import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePasswordSkeleton() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-md mx-auto">
          {/* Current Password */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="relative">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10 absolute right-0 top-0 rounded-l-none" />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <div className="relative">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10 absolute right-0 top-0 rounded-l-none" />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <div className="relative">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10 absolute right-0 top-0 rounded-l-none" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

