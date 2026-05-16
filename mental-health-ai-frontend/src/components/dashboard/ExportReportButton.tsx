'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { userService, dailyMoodService, journalService, sleepLogService, assessmentService } from '@/services';
import { DailyMood, AssessmentSession, User } from '@/types';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';



interface SummaryItem {
    label: string;
    value: string | number;
}

interface AssessmentRow {
    date: string;
    title: string;
    score: string;
    level: string;
}

interface MoodRow {
    date: string;
    score: number;
    stress: string;
    note: string;
}

interface ReportData {
    userProfile: User | null;
    moodChartData: Array<{ label: string; value: number }>;
    assessmentChartData: Array<{ label: string; value: number }>;
    moodData: MoodRow[];
    assessmentData: AssessmentRow[];
    summaryData: SummaryItem[];
}

// Hidden component that renders the actual report to be captured
const ReportTemplate = ({
    userProfile,
    moodChartData,
    moodData,
    assessmentChartData,
    assessmentData,
    summaryData
}: ReportData) => {
    return (
        <div
            id="pdf-report-container"
            className="absolute left-[-9999px] top-[-9999px] w-[800px] bg-white text-black p-10 font-sans"
            style={{ fontFamily: 'Arial, sans-serif' }}
        >
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-[#1f4e79] mb-2 uppercase">Báo cáo sức khỏe tinh thần</h1>
                <p className="text-sm text-gray-500">Ngày tạo: {dayjs().format('DD/MM/YYYY HH:mm')}</p>
            </div>

            {/* User Profile */}
            <div className="mb-10">
                <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">THÔNG TIN CÁ NHÂN</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-600 w-32 inline-block">Họ và tên:</span> {userProfile?.fullName || '--'}</div>
                    <div><span className="font-semibold text-gray-600 w-32 inline-block">Tên đăng nhập:</span> {userProfile?.username || '--'}</div>
                    <div><span className="font-semibold text-gray-600 w-32 inline-block">Giới tính:</span> {userProfile?.gender?.valueVi || '--'}</div>
                    <div><span className="font-semibold text-gray-600 w-32 inline-block">Ngày sinh:</span> {userProfile?.dateOfBirth ? dayjs(userProfile.dateOfBirth).format('DD/MM/YYYY') : '--'}</div>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="mb-10">
                <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">THỐNG KÊ TỔNG QUAN</h2>
                <div className="grid grid-cols-4 gap-4">
                    {summaryData.map((item, i: number) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                            <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mood Chart */}
            {moodChartData?.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">BIỂU ĐỒ TÂM TRẠNG (30 ngày qua)</h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={moodChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Assessment Chart */}
            {assessmentChartData?.length > 0 && (
                <div className="mb-10" style={{ pageBreakBefore: 'always' }}>
                    <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">BIỂU ĐỒ ĐÁNH GIÁ GẦN ĐÂY</h2>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={assessmentChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Recent Assessments Table */}
            {assessmentData?.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">LỊCH SỬ ĐÁNH GIÁ (10 lần gần nhất)</h2>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-emerald-50 text-emerald-800">
                            <tr>
                                <th className="py-3 px-4 border border-emerald-100 font-semibold">Ngày</th>
                                <th className="py-3 px-4 border border-emerald-100 font-semibold">Tên bài test</th>
                                <th className="py-3 px-4 border border-emerald-100 font-semibold text-center">Điểm số</th>
                                <th className="py-3 px-4 border border-emerald-100 font-semibold text-center">Kết luận</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessmentData.map((row, i: number) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-2 px-4 border border-gray-100">{row.date}</td>
                                    <td className="py-2 px-4 border border-gray-100">{row.title}</td>
                                    <td className="py-2 px-4 border border-gray-100 text-center font-medium">{row.score}</td>
                                    <td className="py-2 px-4 border border-gray-100 text-center">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{row.level}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Recent Moods Table */}
            {moodData?.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">CẢNH BÁO TÂM TRẠNG & STRESS (10 ngày gần nhất)</h2>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-blue-50 text-blue-800">
                            <tr>
                                <th className="py-3 px-4 border border-blue-100 font-semibold">Ngày</th>
                                <th className="py-3 px-4 border border-blue-100 font-semibold text-center">Điểm (1-10)</th>
                                <th className="py-3 px-4 border border-blue-100 font-semibold text-center">Mức độ Stress</th>
                                <th className="py-3 px-4 border border-blue-100 font-semibold">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moodData.map((row, i: number) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-2 px-4 border border-gray-100 whitespace-nowrap">{row.date}</td>
                                    <td className="py-2 px-4 border border-gray-100 text-center font-medium">{row.score}</td>
                                    <td className="py-2 px-4 border border-gray-100 text-center text-xs whitespace-nowrap">{row.stress}</td>
                                    <td className="py-2 px-4 border border-gray-100 text-gray-600 break-words">{row.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            <div className="pt-4 mt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                Mental Health AI - Hệ thống chăm sóc sức khỏe tinh thần • Tạo tự động vào {dayjs().format('DD/MM/YYYY')}
            </div>
        </div>
    );
};

export default function ExportReportButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const handleGenerateData = async () => {
        try {
            setIsLoading(true);
            toast.info('Đang tổng hợp dữ liệu báo cáo...');

            const [userProfile, moods, journals, _sleepLogs, assessments] = await Promise.all([
                userService.getProfile(),
                dailyMoodService.getAll(),
                journalService.getAll(1, 100),
                sleepLogService.getAll(),
                assessmentService.getHistory()
            ]);

            // Format Mood Chart
            const moodChartData = moods?.data?.moods?.slice(0, 30).reverse().map((m: DailyMood) => ({
                label: dayjs(m.createdAt).format('DD/MM'),
                value: m.moodScore
            })) || [];

            // Format Assessment Chart
            const assessmentChartData = assessments?.data?.history?.slice(0, 10).reverse().map((s: AssessmentSession) => ({
                label: dayjs(s.completedAt || s.createdAt).format('DD/MM'),
                value: s.result?.totalScore || 0
            })) || [];

            // Format Mood Table
            const moodData = moods?.data?.moods?.slice(0, 10).map((m: DailyMood) => {
                let stressLevel = '--';
                if (m.stressLevel !== undefined) {
                    if (m.stressLevel <= 3) stressLevel = `Thấp (${m.stressLevel}/10)`;
                    else if (m.stressLevel <= 7) stressLevel = `Trung bình (${m.stressLevel}/10)`;
                    else stressLevel = `Cao (${m.stressLevel}/10)`;
                }

                return {
                    date: dayjs(m.createdAt).format('DD/MM/YYYY'),
                    score: m.moodScore,
                    stress: stressLevel,
                    note: m.note || '--'
                };
            }) || [];

            // Format Assessment Table
            const resultLevelMap: Record<string, string> = {
                'MILD': 'Nhẹ', 'MODERATE': 'Trung bình', 'MODERATELY_SEVERE': 'Khá nghiêm trọng',
                'SEVERE': 'Nghiêm trọng', 'MINIMAL': 'Tối thiểu', 'LOW': 'Thấp',
                'MEDIUM': 'Trung bình', 'HIGH': 'Cao', 'Pending': 'Đang chờ'
            };

            const assessmentData = assessments?.data?.history?.slice(0, 10).map((s: AssessmentSession) => ({
                date: dayjs(s.completedAt || s.createdAt).format('DD/MM/YYYY'),
                title: s.template?.title || 'Bài test',
                score: s.result?.totalScore?.toString() || '--',
                level: resultLevelMap[s.result?.resultLevelCode || 'Pending'] || 'Đang chờ'
            })) || [];

            // Format Summary
            const avgMood = moodChartData.length > 0
                ? (moodChartData.reduce((sum: number, m: { value: number }) => sum + m.value, 0) / moodChartData.length).toFixed(1)
                : '--';

            const summaryData = [
                { label: 'Tâm trạng trung bình', value: avgMood },
                { label: 'Số bài test đã làm', value: assessments?.data?.history?.length || 0 },
                { label: 'Số trang nhật ký', value: journals?.data?.journals?.length || 0 },
                { label: 'Số lần đo tâm trạng', value: moods?.data?.moods?.length || 0 }
            ];

            setReportData({
                userProfile,
                moodChartData,
                assessmentChartData,
                moodData,
                assessmentData,
                summaryData
            });

            // Wait a tick for React to render the hidden template
            setTimeout(captureAndDownloadPDF, 1000);

        } catch (error) {
            console.error('Data Fetching Error:', error);
            toast.error('Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
            setIsLoading(false);
        }
    };

    const captureAndDownloadPDF = async () => {
        try {
            toast.loading('Đang vẽ và xuất file PDF... Vui lòng đợi!', { id: 'pdf-toast' });

            const element = document.getElementById('pdf-report-container');
            if (!element) throw new Error('Cannot find report template');

            // 1. Capture HTML as High-Res Image using html2canvas-pro (supports lab() colors)
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 800,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // 2. Put Image into PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Bao_Cao_Suc_Khoe_${dayjs().format('YYYYMMDD')}.pdf`);

            toast.success('Xuất file PDF thành công!', { id: 'pdf-toast' });
        } catch (error) {
            console.error('PDF Conversion Error:', error);
            toast.error('Có lỗi khi tạo file PDF. Hãy thử lại!', { id: 'pdf-toast' });
        } finally {
            setIsLoading(false);
            setReportData(null); // Clear DOM
        }
    };

    return (
        <>
            <Button
                onClick={handleGenerateData}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileDown className="w-4 h-4" />
                )}
                Xuất báo cáo PDF
            </Button>

            {/* Hidden DOM element for HTML2Canvas to capture */}
            {reportData && (
                <div className="fixed overflow-hidden pointer-events-none opacity-0" style={{ zIndex: -1000 }}>
                    <ReportTemplate {...reportData} />
                </div>
            )}
        </>
    );
}
