import {
  AlertTriangle,
  CheckCircle,
  Heart,
  Lightbulb,
  Shield,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

type Recommendation = {
  icon: LucideIcon;
  text: string;
};

type SafetyNotice = {
  title: string;
  description: string;
  actions: string[];
};

type AssessmentTypeCode = 'MHB6' | 'PHQ9' | 'GAD7' | 'PSS' | 'DEFAULT';

export interface AssessmentResultInfo {
  title: string;
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  ringColor: string;
  badgeBg: string;
  icon: LucideIcon;
  message: string;
  highlight: string;
  maxScore: number;
  recommendations: Recommendation[];
  nextSteps: string[];
  safetyNotice?: SafetyNotice;
}

function resolveTypeCode(typeCode?: string): AssessmentTypeCode {
  if (typeCode === 'MHB6' || typeCode === 'PHQ9' || typeCode === 'GAD7' || typeCode === 'PSS') {
    return typeCode;
  }
  return 'DEFAULT';
}

function getTypeSpecificContent(typeCode: AssessmentTypeCode, resultLevelCode: string): {
  recommendations: Recommendation[];
  nextSteps: string[];
} {
  if (typeCode === 'PHQ9') {
    if (resultLevelCode === 'SEVERE' || resultLevelCode === 'MODERATELY_SEVERE') {
      return {
        recommendations: [
          { icon: Shield, text: 'Trao đổi với chuyên gia tâm lý hoặc bác sĩ trong thời gian sớm nhất.' },
          { icon: Heart, text: 'Không tự chịu đựng một mình, hãy báo với người thân mà bạn tin tưởng.' },
          { icon: Sparkles, text: 'Ưu tiên lịch ngủ, ăn uống và vận động nhẹ để ổn định nền tảng cơ thể.' },
          { icon: Shield, text: 'Nếu có ý nghĩ làm hại bản thân, hãy gọi ngay 1800 1567 hoặc cơ sở y tế gần nhất.' },
        ],
        nextSteps: [
          'Đặt lịch tư vấn chuyên môn trong 24-72 giờ tới.',
          'Ghi nhanh cảm xúc buổi sáng và buổi tối để theo dõi xu hướng.',
          'Nhờ một người thân hỗ trợ bạn duy trì sinh hoạt cơ bản trong vài ngày tới.',
        ],
      };
    }

    return {
      recommendations: [
        { icon: TrendingUp, text: 'Theo dõi mức năng lượng và hứng thú với hoạt động hằng ngày.' },
        { icon: Sparkles, text: 'Chia việc lớn thành bước nhỏ để giảm cảm giác quá tải.' },
        { icon: Heart, text: 'Giữ kết nối xã hội tối thiểu mỗi ngày với một người bạn tin cậy.' },
        { icon: Shield, text: 'Duy trì giấc ngủ đều đặn và hạn chế thức quá khuya liên tục.' },
      ],
      nextSteps: [
        'Đặt mục tiêu nhỏ có thể hoàn thành trong 10-20 phút mỗi ngày.',
        'Dành 15-30 phút vận động nhẹ để cải thiện tâm trạng.',
        'Đánh giá lại sau 1-2 tuần để xem xu hướng thay đổi.',
      ],
    };
  }

  if (typeCode === 'GAD7') {
    return {
      recommendations: [
        { icon: Sparkles, text: 'Luyện thở chậm 4-6 nhịp/phút khi thấy căng thẳng tăng cao.' },
        { icon: Shield, text: 'Giới hạn tiếp xúc với nguồn tin làm bạn lo âu quá mức.' },
        { icon: Heart, text: 'Ưu tiên nhịp ngủ đều và giảm caffeine vào buổi chiều/tối.' },
        { icon: TrendingUp, text: 'Ghi lại các tình huống kích hoạt lo âu để nhận diện mẫu lặp.' },
      ],
      nextSteps: [
        'Thực hiện 2-3 phiên thở chậm mỗi ngày, mỗi phiên 5 phút.',
        'Lập danh sách việc có thể kiểm soát và việc cần chấp nhận.',
        'Nếu lo âu ảnh hưởng công việc/học tập kéo dài, hãy cân nhắc tư vấn chuyên môn.',
      ],
    };
  }

  if (typeCode === 'PSS') {
    return {
      recommendations: [
        { icon: TrendingUp, text: 'Phân loại công việc theo ưu tiên để giảm áp lực dồn cục.' },
        { icon: Sparkles, text: 'Thêm các khoảng nghỉ ngắn có chủ đích trong ngày làm việc.' },
        { icon: Heart, text: 'Giữ ranh giới thời gian nghỉ để tránh làm việc kéo dài liên tục.' },
        { icon: Shield, text: 'Đặt mục tiêu thực tế theo tuần thay vì ôm quá nhiều việc cùng lúc.' },
      ],
      nextSteps: [
        'Tạo kế hoạch 3 việc quan trọng nhất cho ngày mai.',
        'Sắp xếp ít nhất 1 khoảng nghỉ phục hồi 15-20 phút mỗi ngày.',
        'Đánh giá lại nguồn gây stress lớn nhất và tìm phương án giảm tải ngay trong tuần này.',
      ],
    };
  }

  return {
    recommendations: [
      { icon: TrendingUp, text: 'Theo dõi tâm trạng và các yếu tố khiến bạn dễ căng thẳng.' },
      { icon: Sparkles, text: 'Dành thời gian nghỉ ngắn trong ngày để giảm quá tải.' },
      { icon: Heart, text: 'Tăng vận động nhẹ như đi bộ hoặc kéo giãn cơ.' },
      { icon: Shield, text: 'Duy trì lịch ngủ và sinh hoạt ổn định.' },
    ],
    nextSteps: [
      'Thực hiện một thay đổi nhỏ, dễ duy trì trong tuần này.',
      'Theo dõi cảm xúc định kỳ để nhận ra xu hướng sớm.',
      'Làm lại bài đánh giá sau 1-2 tuần để so sánh tiến triển.',
    ],
  };
}

function getSafetyNotice(resultLevelCode: string): SafetyNotice | undefined {
  if (resultLevelCode === 'SEVERE') {
    return {
      title: 'Khuyến nghị an toàn ưu tiên',
      description:
        'Mức điểm hiện tại cho thấy bạn cần được hỗ trợ sớm. Đây là các bước an toàn nên thực hiện ngay.',
      actions: [
        'Liên hệ chuyên gia tâm lý/bác sĩ trong thời gian sớm nhất.',
        'Trao đổi với người thân hoặc bạn bè đáng tin cậy để không ở một mình khi quá tải.',
        'Nếu có dấu hiệu khủng hoảng, gọi 1800 1567 hoặc đến cơ sở y tế gần nhất.',
      ],
    };
  }

  if (resultLevelCode === 'MODERATELY_SEVERE') {
    return {
      title: 'Nên ưu tiên hỗ trợ chuyên môn',
      description:
        'Triệu chứng đang ảnh hưởng rõ rệt đến sinh hoạt. Việc trao đổi với chuyên gia sớm sẽ giúp bạn ổn định nhanh hơn.',
      actions: [
        'Lên lịch tư vấn chuyên môn trong vài ngày tới.',
        'Giảm tạm thời các nguồn áp lực không cần thiết.',
        'Nếu triệu chứng tăng nhanh hoặc xuất hiện ý nghĩ nguy hiểm, hãy liên hệ hỗ trợ khẩn cấp.',
      ],
    };
  }

  return undefined;
}

export function getAssessmentResultInfo(
  resultLevelCode: string,
  typeCode?: string,
): AssessmentResultInfo {
  const normalizedTypeCode = resolveTypeCode(typeCode);
  const typeSpecific = getTypeSpecificContent(normalizedTypeCode, resultLevelCode);
  const safetyNotice = getSafetyNotice(resultLevelCode);

  switch (resultLevelCode) {
    case 'SEVERE':
      return {
        title: 'Cần sự quan tâm đặc biệt',
        level: 'Mức độ nghiêm trọng',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/30',
        borderColor: 'border-rose-200 dark:border-rose-800',
        gradientFrom: 'from-rose-500',
        gradientTo: 'to-red-600',
        ringColor: 'stroke-rose-500',
        badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
        icon: AlertTriangle,
        message: 'Kết quả cho thấy bạn đang trải qua những triệu chứng đáng kể cần được hỗ trợ chuyên môn.',
        highlight: 'Đừng ngần ngại tìm kiếm sự giúp đỡ. Bạn không cần tự xử lý mọi thứ một mình.',
        maxScore: 27,
        recommendations: typeSpecific.recommendations,
        nextSteps: typeSpecific.nextSteps,
        safetyNotice,
      };
    case 'MODERATELY_SEVERE':
      return {
        title: 'Cần được hỗ trợ',
        level: 'Mức độ khá nghiêm trọng',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        borderColor: 'border-orange-200 dark:border-orange-800',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-amber-600',
        ringColor: 'stroke-orange-500',
        badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
        icon: AlertTriangle,
        message: 'Các triệu chứng hiện tại đang ảnh hưởng đến cuộc sống hằng ngày và nên được hỗ trợ thêm.',
        highlight: 'Bắt đầu sớm sẽ giúp bạn điều chỉnh dễ hơn và giảm áp lực kéo dài.',
        maxScore: 27,
        recommendations: typeSpecific.recommendations,
        nextSteps: typeSpecific.nextSteps,
        safetyNotice,
      };
    case 'MODERATE':
      return {
        title: 'Cần chú ý',
        level: 'Mức độ trung bình',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
        gradientFrom: 'from-amber-400',
        gradientTo: 'to-orange-500',
        ringColor: 'stroke-amber-500',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
        icon: Lightbulb,
        message: 'Bạn đang có dấu hiệu căng thẳng nhất định. Đây là thời điểm phù hợp để điều chỉnh nhịp sinh hoạt.',
        highlight: 'Một vài thay đổi nhỏ nhưng đều đặn có thể tạo ra khác biệt rõ rệt.',
        maxScore: 27,
        recommendations: typeSpecific.recommendations,
        nextSteps: typeSpecific.nextSteps,
      };
    case 'MILD':
      return {
        title: 'Tương đối ổn định',
        level: 'Mức độ nhẹ',
        color: 'text-lime-600 dark:text-lime-400',
        bgColor: 'bg-lime-50 dark:bg-lime-950/30',
        borderColor: 'border-lime-200 dark:border-lime-800',
        gradientFrom: 'from-lime-400',
        gradientTo: 'to-emerald-500',
        ringColor: 'stroke-lime-500',
        badgeBg: 'bg-lime-100 dark:bg-lime-900/40',
        icon: CheckCircle,
        message: 'Bạn có vài dấu hiệu nhẹ, nhưng nhìn chung sức khỏe tinh thần vẫn đang ở mức ổn định.',
        highlight: 'Tiếp tục duy trì nhịp sống hiện tại và chú ý khi cơ thể hoặc cảm xúc thay đổi.',
        maxScore: 27,
        recommendations: typeSpecific.recommendations,
        nextSteps: typeSpecific.nextSteps,
      };
    default:
      return {
        title: 'Trạng thái tích cực',
        level: 'Mức độ tối thiểu',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        gradientFrom: 'from-emerald-400',
        gradientTo: 'to-teal-500',
        ringColor: 'stroke-emerald-500',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        icon: Heart,
        message: 'Kết quả hiện tại cho thấy sức khỏe tinh thần của bạn đang ở trạng thái tốt.',
        highlight: 'Hãy tiếp tục duy trì những thói quen đang giúp bạn cảm thấy ổn định.',
        maxScore: 27,
        recommendations: typeSpecific.recommendations,
        nextSteps: typeSpecific.nextSteps,
      };
  }
}