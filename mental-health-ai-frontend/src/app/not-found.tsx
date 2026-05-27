"use client";

import { useAppRouter } from "@/hooks/useAppRouter";
import Link from "next/link";

export default function NotFound() {
  const { goHome, goBack } = useAppRouter();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="relative mb-8">
        <h1 className="text-[150px] font-semibold text-gray-200 dark:text-gray-800 leading-none select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-24 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <svg
              className="size-12 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
        Trang không tồn tại
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        Hãy kiểm tra lại đường dẫn hoặc quay về trang chủ.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={goBack}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          ← Quay lại
        </button>
        <button
          onClick={goHome}
          className="px-6 py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Về trang chủ
        </button>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Bạn có thể muốn đến:
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/daily-mood"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Tâm trạng
          </Link>
          <Link
            href="/dashboard/journal"
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Nhật ký
          </Link>
        </div>
      </div>
    </div>
  );
}