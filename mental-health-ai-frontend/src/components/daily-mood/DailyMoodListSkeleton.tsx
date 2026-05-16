import { Skeleton } from "@/components/ui/skeleton";

export default function DailyMoodListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <Skeleton className="w-14 h-14 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mt-3" />
                </div>
            ))}
        </div>
    );
}
