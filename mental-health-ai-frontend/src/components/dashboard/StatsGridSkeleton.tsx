import { Skeleton } from "@/components/ui/skeleton";

export default function StatsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border mt-0.5">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    );
}
