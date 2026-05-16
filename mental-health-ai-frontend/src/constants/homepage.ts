import { publicPaths } from './path';

export type GentleTile = {
  id: string;
  moment: {
    tag: string;
    summary: string;
    indicatorColor: string;
  };
  note: {
    title: string;
    quote: string;
  };
  highlights: {
    title: string;
    detail: string;
  }[];
};

export const gentleTiles: GentleTile[] = [
  {
    id: 'daily-mood',
    moment: {
      tag: 'Cảm xúc',
      summary: 'Hôm nay, 10:30 AM',
      indicatorColor: '#34d399',
    },
    note: {
      title: 'Trạng thái chính',
      quote: 'Bình yên',
    },
    highlights: [
      { title: 'Năng lượng', detail: '7/10' },
      { title: 'Yếu tố', detail: 'Thiên nhiên, Đi bộ' },
    ],
  },
  {
    id: 'sleep-log',
    moment: {
      tag: 'Giấc ngủ',
      summary: 'Đêm qua',
      indicatorColor: '#60a5fa',
    },
    note: {
      title: 'Thời gian ngủ',
      quote: '7h 15m',
    },
    highlights: [
      { title: 'Điểm ngủ', detail: '85/100' },
      { title: 'Thức dậy', detail: '6:30 AM - Tỉnh táo' },
    ],
  },
  {
    id: 'journal',
    moment: {
      tag: 'Nhật ký',
      summary: 'Gần đây nhất',
      indicatorColor: '#818cf8',
    },
    note: {
      title: 'Ghi chú',
      quote: 'Viết ra những suy nghĩ lộn xộn giúp tâm trí nhẹ nhàng hơn...',
    },
    highlights: [
      { title: 'Chủ đề', detail: 'Biết ơn, Công việc' },
      { title: 'Tâm trạng', detail: 'Nhẹ nhõm' },
    ],
  },
];