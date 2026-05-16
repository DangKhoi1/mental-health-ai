export default function JournalListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
