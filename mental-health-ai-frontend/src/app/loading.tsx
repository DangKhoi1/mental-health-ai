export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-teal-200 dark:border-teal-900 rounded-full animate-pulse" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-teal-500 rounded-full animate-spin" />
      </div>

      <p className="mt-6 text-lg font-medium text-teal-700 dark:text-teal-300 animate-pulse">
        Đang tải...
      </p>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Vui lòng đợi trong giây lát
      </p>
    </div>
  );
}