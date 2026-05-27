"use client";

import { useAppRouter } from "@/hooks/useAppRouter";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { goHome } = useAppRouter();

  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="size-20 mb-6 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="size-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
        Đã xảy ra lỗi!
      </h1>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        Rất tiếc, đã có sự cố xảy ra. Vui lòng thử lại hoặc quay về trang chủ.
      </p>

      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Thử lại
        </button>
        <button
          onClick={goHome}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          Về trang chủ
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error.message && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-lg w-full">
          <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}