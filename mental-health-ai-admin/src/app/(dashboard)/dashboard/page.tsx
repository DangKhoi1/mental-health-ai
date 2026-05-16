'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, BookOpen, Download, FileSpreadsheet, HelpCircle, MessageSquare, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Button, Card, CardContent, ListSkeleton, Select } from '@/components/ui';
import { StatCard } from '../../../components/dashboard/StatCard';
import { dashboardService, reportService } from '@/services';
import { ResourcePieChart } from '../../../components/dashboard/ResourcePieChart';
import { TrendChart } from '../../../components/dashboard/TrendChart';
import { MoodPieChart } from '../../../components/dashboard/MoodPieChart';
import { PageHeader } from '@/components/layout/PageHeader';

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  completedAssessments: number;
  totalResources: number;
  totalJournals: number;
  totalAiChats: number;
};

type TrendItem = {
  date: string;
  users: number;
  assessments: number;
  chats: number;
};

type ResourceItem = {
  category: string;
  count: number;
};

type MoodDistributionItem = {
  label: string;
  count: number;
  percent: number;
};

type MoodStats = {
  total: number;
  avgScore: number;
  distribution: MoodDistributionItem[];
};

const categoryLabelMap: Record<string, string> = {
  RES_MEDITATION: 'Thiền',
  MEDITATION: 'Thiền',
  RES_BREATHING: 'Hít thở',
  BREATHING: 'Hít thở',
  RES_ARTICLE: 'Bài viết',
  ARTICLE: 'Bài viết',
  RES_VIDEO: 'Video',
  VIDEO: 'Video',
  RES_MUSIC: 'Âm nhạc',
  MUSIC: 'Âm nhạc',
};

function AdminPdfReportTemplate({
  stats,
  moodData,
  resourceData,
  trendData,
  generatedAt,
  days,
}: {
  stats: DashboardStats;
  moodData: MoodStats;
  resourceData: ResourceItem[];
  trendData: TrendItem[];
  generatedAt: string | null;
  days: number;
}) {
  return (
    <div
      id="admin-pdf-report-template"
      className="fixed top-0 bg-white p-10 text-[#0f172a]"
      style={{ left: '-9999px', width: '794px', fontFamily: 'Arial, sans-serif' }}
    >
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-[28px] font-bold tracking-tight">Báo cáo thống kê hệ thống</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thời gian tạo: {generatedAt ? new Date(generatedAt).toLocaleString('vi-VN') : '--'}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Tổng quan chỉ số</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Tổng người dùng</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Người dùng hoạt động</p><p className="text-2xl font-bold">{stats.activeUsers}</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Đánh giá hoàn tất</p><p className="text-2xl font-bold">{stats.completedAssessments}</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Trò chuyện AI</p><p className="text-2xl font-bold">{stats.totalAiChats}</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Tài liệu</p><p className="text-2xl font-bold">{stats.totalResources}</p></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-slate-500">Nhật ký</p><p className="text-2xl font-bold">{stats.totalJournals}</p></div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Tâm trạng</h2>
        <p className="mb-2 text-sm text-slate-600">Điểm trung bình: {moodData.avgScore}/10</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-3 py-2">Mức độ</th>
              <th className="border border-slate-200 px-3 py-2">Số lượng</th>
              <th className="border border-slate-200 px-3 py-2">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {moodData.distribution.map((item) => (
              <tr key={item.label}>
                <td className="border border-slate-200 px-3 py-2">{item.label}</td>
                <td className="border border-slate-200 px-3 py-2">{item.count}</td>
                <td className="border border-slate-200 px-3 py-2">{item.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Phân bố tài liệu</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-3 py-2">Danh mục</th>
              <th className="border border-slate-200 px-3 py-2">Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {resourceData.map((item, index) => (
              <tr key={`${item.category}-${index}`}>
                <td className="border border-slate-200 px-3 py-2">{categoryLabelMap[item.category] || item.category}</td>
                <td className="border border-slate-200 px-3 py-2">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Hoạt động theo ngày ({days} ngày qua)</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-3 py-2">Ngày</th>
              <th className="border border-slate-200 px-3 py-2">Người dùng</th>
              <th className="border border-slate-200 px-3 py-2">Đánh giá</th>
              <th className="border border-slate-200 px-3 py-2">AI chat</th>
            </tr>
          </thead>
          <tbody>
            {trendData.slice(-15).map((item, index) => (
              <tr key={`${item.date || index}-${index}`}>
                <td className="border border-slate-200 px-3 py-2">{item.date || `Mốc ${index + 1}`}</td>
                <td className="border border-slate-200 px-3 py-2">{item.users}</td>
                <td className="border border-slate-200 px-3 py-2">{item.assessments}</td>
                <td className="border border-slate-200 px-3 py-2">{item.chats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// const ADMIN_TIPS = [
//   'Kiểm tra báo cáo hệ thống mỗi tuần để phát hiện sớm bất thường về lượng người dùng.',
//   'Khóa tài khoản người dùng không hoạt động trên 90 ngày để giảm rủi ro bảo mật.',
//   'Xuất báo cáo CSV định kỳ và lưu trữ để đối chiếu xu hướng theo tháng.',
//   'Đảm bảo các bài đánh giá tâm lý được cập nhật nội dung ít nhất mỗi 6 tháng.',
//   'Kiểm tra danh sách tài nguyên chữa lành — ẩn các nội dung lỗi thời hoặc link hỏng.',
//   'Theo dõi tỉ lệ hoàn thành bài đánh giá để hiểu mức độ tương tác của người dùng.',
//   'Sao lưu dữ liệu hệ thống định kỳ để phòng ngừa mất mát thông tin.',
//   'Rà soát quyền vai trò thường xuyên — chỉ cấp quyền tối thiểu cần thiết cho mỗi người.',
//   'Đặt thông báo nhắc nhở cho quản trị viên khi số người dùng hoạt động giảm đột ngột.',
//   'Nội dung thư viện chất lượng cao sẽ giúp tăng tỉ lệ người dùng quay lại ứng dụng.',
// ];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    completedAssessments: 0,
    totalResources: 0,
    totalJournals: 0,
    totalAiChats: 0,
  });
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [resourceData, setResourceData] = useState<ResourceItem[]>([]);
  const [moodData, setMoodData] = useState<MoodStats>({ total: 0, avgScore: 0, distribution: [] });
  const [days, setDays] = useState(7); // default to 7 days
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const activeRate = stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;
  const assessmentCoverage = stats.activeUsers > 0
    ? Math.round((stats.completedAssessments / stats.activeUsers) * 100)
    : 0;
  const contentPerUser = stats.totalUsers > 0
    ? ((stats.totalResources + stats.totalJournals) / stats.totalUsers).toFixed(2)
    : '0.00';

  // const dailyTip = useMemo(() => {
  //   const dayOfYear = Math.floor(
  //     (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  //   );
  //   return ADMIN_TIPS[dayOfYear % ADMIN_TIPS.length];
  // }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, reportRes, resourceRes, trendRes, moodRes] = await Promise.all([
        dashboardService.getDashboardStats(),
        reportService.getReportOverview(),
        dashboardService.getResourceStats(),
        dashboardService.getTrendData(days),
        dashboardService.getMoodStats(),
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
      }
      if (reportRes?.data?.report) {
        setGeneratedAt(reportRes.data.report.generatedAt ?? null);
      }
      if (resourceRes?.data) {
        setResourceData(resourceRes.data);
      }
      if (trendRes?.data) {
        const normalizedTrendData: TrendItem[] = trendRes.data.map((item: Record<string, unknown>) => ({
          date: typeof item.date === 'string' ? item.date : '',
          users: typeof item.users === 'number' ? item.users : 0,
          assessments: typeof item.assessments === 'number' ? item.assessments : 0,
          chats:
            typeof item.chats === 'number'
              ? item.chats
              : typeof item.aiChats === 'number'
                ? item.aiChats
                : 0,
        }));
        setTrendData(normalizedTrendData);
      }
      if (moodRes?.data) {
        setMoodData(moodRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const exportBaoCaoPdf = async () => {
    try {
      setExporting(true);
      const reportElement = document.getElementById('admin-pdf-report-template');
      if (!reportElement) {
        throw new Error('Cannot find PDF report template');
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const canvas = await html2canvas(reportElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: (reportElement as HTMLElement).scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `bao-cao-thong-ke-he-thong-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Failed to export report:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <ListSkeleton rows={2} cols={3} />
        </div>
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <ListSkeleton rows={2} cols={5} />
        </div>
        <div className="rounded-2xl border border-border bg-card/90 p-6">
          <ListSkeleton rows={3} cols={2} />
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminPdfReportTemplate
        stats={stats}
        moodData={moodData}
        resourceData={resourceData}
        trendData={trendData}
        generatedAt={generatedAt}
        days={days}
      />

      <div className="space-y-6">
        <PageHeader
          title="Thống kê tổng quan"
          description="Theo dõi tình trạng nền tảng và xuất báo cáo nhanh."
        >
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5 border border-border">
            <span className="text-xs font-medium text-muted-foreground">Khoảng thời gian:</span>
            <Select
              value={days.toString()}
              onChange={(e: { target: { value: string } }) => setDays(parseInt(e.target.value, 10))}
              options={[
                { value: '7', label: '7 ngày qua' },
                { value: '30', label: '30 ngày qua' },
                { value: '90', label: '90 ngày qua' }
              ]}
              className="mb-0 space-y-0"
              triggerClassName="bg-transparent border-none px-2 py-1 shadow-none focus:ring-0 text-sm font-semibold h-auto"
            />
          </div>
          <Button variant="primary" onClick={exportBaoCaoPdf} loading={exporting}>
            <Download className="w-4 h-4" /> Xuất báo cáo
          </Button>
        </PageHeader>

        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(156,169,134,0.14),rgba(232,239,227,0.45),rgba(255,255,255,0.96))] shadow-[0_12px_40px_rgba(156,169,134,0.10)]">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Báo cáo hệ thống
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-foreground">Xuất báo cáo tổng quan cho quản trị viên</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Báo cáo bao gồm người dùng, lượt đánh giá hoàn tất, tài liệu và nhật ký để phục vụ theo dõi vận hành hệ thống.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-sm shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Lần tổng hợp gần nhất</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {generatedAt ? new Date(generatedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Tổng người dùng"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Người dùng hoạt động"
            value={stats.activeUsers}
            icon={<Activity className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Đánh giá hoàn thành"
            value={stats.completedAssessments}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Trò chuyện AI"
            value={stats.totalAiChats}
            icon={<MessageSquare className="w-6 h-6" />}
            color="amber"
          />
          <StatCard
            title="Tài liệu & Nhật ký"
            value={stats.totalResources + stats.totalJournals}
            icon={<BookOpen className="w-6 h-6" />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border/70 bg-white">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-lg font-bold text-foreground">Thao tác nhanh</h3>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/users"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/35 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Quản lý người dùng
                  <Users className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/assessment-templates"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/35 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Quản lý bài đánh giá
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/resources"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/35 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cập nhật thư viện
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/assessment-questions"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/35 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Quản lý câu hỏi
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/role-management"
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/35 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Phân quyền hệ thống
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Admin Tip - Full Width
      <Card className="relative overflow-hidden border-none bg-[linear-gradient(135deg,rgba(156,169,134,0.08),rgba(156,169,134,0.03))] shadow-sm mt-4">
        <div className="absolute top-0 right-0 opacity-10">
          <Lightbulb className="w-48 h-48 text-primary/20 rotate-12 translate-x-12 -translate-y-12" />
        </div>
        <CardContent className="relative z-10 flex items-center gap-6 py-8 px-8">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner group transition-transform hover:scale-105 duration-300">
            <Lightbulb className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 bg-primary/40 rounded-full" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/70">Mẹo quản trị hôm nay</p>
            </div>
            <p className="text-xl text-foreground font-medium leading-relaxed max-w-4xl tracking-tight">
              &ldquo;{dailyTip}&rdquo;
            </p>
          </div>
          <div className="hidden xl:block">
            <div className="px-4 py-2 rounded-full border border-primary/10 bg-white/40 text-[10px] uppercase font-bold tracking-widest text-primary/60 whitespace-nowrap">
              Cập nhật hàng ngày
            </div>
          </div>
        </CardContent>
      </Card> */}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-2">
            <TrendChart data={trendData} days={days} />
          </div>
          <div className="xl:col-span-1">
            <MoodPieChart data={moodData.distribution} avgScore={moodData.avgScore} />
          </div>
          <div className="xl:col-span-1">
            <ResourcePieChart data={resourceData} />
          </div>
        </div>
      </div>
    </>
  );
}
