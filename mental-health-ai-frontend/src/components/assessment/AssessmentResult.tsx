import { AssessmentSession } from '@/types';
import { CheckIcon } from 'lucide-react';

interface AssessmentResultProps {
    result: AssessmentSession;
    onBack: () => void;
}

export default function AssessmentResult({ result, onBack }: AssessmentResultProps) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl mb-6">
                    <CheckIcon className="w-12 h-12 text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Hoàn thành bài đánh giá!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Cảm ơn bạn đã hoàn thành bài đánh giá.
                </p>
                {result.result?.totalScore !== undefined && (
                    <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-xl">
                        <div className="text-4xl font-bold text-[var(--primary)] dark:text-[var(--primary)] mb-2">
                            {result.result.totalScore}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">Điểm tổng</div>
                    </div>
                )}
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] text-white rounded-xl font-medium"
                >
                    Quay lại danh sách
                </button>
            </div>
        </div>
    );
}
