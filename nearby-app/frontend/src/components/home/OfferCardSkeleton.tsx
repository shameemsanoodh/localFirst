import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";

export const OfferCardSkeleton = () => {
  return (
    <Card className="flex-shrink-0 w-full">
      <CardHeader className="p-0">
        <Skeleton className="h-40 w-full rounded-t-lg rounded-b-none" />
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </CardFooter>
    </Card>
  );
};
