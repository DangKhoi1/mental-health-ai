import { createPortal } from 'react-dom';
import { AssessmentSession } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

interface AssessmentResultModalProps {
    result: AssessmentSession;
    onClose: () => void;
}

export default function AssessmentResultModal({ result, onClose }: AssessmentResultModalProps) {
    if (typeof document === 'undefined') return null;

    const totalScore = result.result?.totalScore || 0;
    const resultLevel = result.result?.resultLevelCode || 'MINIMAL';

    const getResultInfo = () => {
        switch (resultLevel) {
            case 'SEVERE':
                return {
                    title: 'Mức độ nghiêm trọng',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    icon: XCircle,
                    message: 'Kết quả cho thấy bạn có thể đang gặp vấn đề nghiêm trọng. Chúng tôi khuyên bạn nên tìm kiếm sự hỗ trợ chuyên môn.'
                };
            case 'MODERATELY_SEVERE':
                return {
                    title: 'Mức độ khá nghiêm trọng',
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    icon: XCircle,
                    message: 'Kết quả cho thấy bạn có thể cần sự hỗ trợ. Hãy cân nhắc trao đổi với chuyên gia tâm lý.'
                };
            case 'MODERATE':
                return {
                    title: 'Mức độ trung bình',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    icon: CheckCircle,
                    message: 'Bạn có thể đang trải qua một số khó khăn. Theo dõi tình trạng và tìm kiếm hỗ trợ nếu cần.'
                };
            case 'MILD':
                return {
                    title: 'Mức độ nhẹ',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    icon: CheckCircle,
                    message: 'Kết quả cho thấy bạn có một số triệu chứng nhẹ. Hãy chú ý đến sức khỏe tinh thần của mình.'
                };
            default:
                return {
                    title: 'Mức độ tối thiểu',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    icon: CheckCircle,
                    message: 'Kết quả tốt! Bạn đang có sức khỏe tinh thần ổn định. Hãy tiếp tục duy trì lối sống lành mạnh.'
                };
        }
    };

    const resultInfo = getResultInfo();
    const Icon = resultInfo.icon;

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 border border-border">
                <div className={`${resultInfo.bgColor} ${resultInfo.borderColor} border-b-2 p-6`}>
                    <div className="flex items-center gap-3">
                        <Icon className={`w-8 h-8 ${resultInfo.color}`} />
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Kết quả đánh giá
                            </h2>
                            <p className={`text-sm font-medium ${resultInfo.color}`}>
                                {resultInfo.title}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-center py-4">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-primary via-primary/80 to-sky-500 text-white shadow-lg">
                            <div className="text-center">
                                <div className="text-3xl font-bold">{totalScore}</div>
                                <div className="text-xs opacity-90">điểm</div>
                            </div>
                        </div>
                    </div>

                    <div className={`${resultInfo.bgColor} ${resultInfo.borderColor} border rounded-lg p-4`}>
                        <p className="text-foreground text-sm leading-relaxed">
                            {resultInfo.message}
                        </p>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        Hoàn thành lúc: {new Date(result.completedAt || '').toLocaleString('vi-VN')}
                    </div>
                </div>

                <div className="p-6 bg-muted/50 border-t border-border">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-linear-to-r from-primary to-sky-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
