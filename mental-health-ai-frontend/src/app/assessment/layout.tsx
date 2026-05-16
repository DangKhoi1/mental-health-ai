import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Đánh giá Sức khỏe Tinh thần | Mental Health AI',
    description: 'Thực hiện bài kiểm tra sức khỏe tinh thần miễn phí, ẩn danh và khoa học.',
};

export default function AssessmentPublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
            {children}
        </div>
    );
}
