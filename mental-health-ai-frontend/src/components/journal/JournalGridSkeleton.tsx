import { Skeleton } from "@/components/ui/skeleton";

export default function JournalGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full mb-2" />
                    <div className="space-y-2 mb-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    );
}
