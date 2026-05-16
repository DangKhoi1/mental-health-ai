import { DataSource } from 'typeorm';
import { Allcode } from '../../modules/allcode/entities/allcode.entity';

export const allcodeSeedData = [
  {
    type: 'GENDER',
    keyMap: 'MALE',
    valueEn: 'Male',
    valueVi: 'Nam',
    description: 'Giới tính nam',
  },
  {
    type: 'GENDER',
    keyMap: 'FEMALE',
    valueEn: 'Female',
    valueVi: 'Nữ',
    description: 'Giới tính nữ',
  },
  {
    type: 'GENDER',
    keyMap: 'OTHER',
    valueEn: 'Other',
    valueVi: 'Khác',
    description: 'Giới tính khác',
  },

  {
    type: 'ASSESSMENT_TYPE',
    keyMap: 'PSS',
    valueEn: 'Perceived Stress Scale',
    valueVi: 'Thang đo mức độ căng thẳng',
    description:
      'Bài đánh giá PSS-10 đo lường mức độ căng thẳng trong 1 tháng qua',
  },
  {
    type: 'ASSESSMENT_TYPE',
    keyMap: 'GAD7',
    valueEn: 'Generalized Anxiety Disorder 7',
    valueVi: 'Thang đo rối loạn lo âu',
    description: 'Bài đánh giá GAD-7 sàng lọc rối loạn lo âu lan tỏa',
  },
  {
    type: 'ASSESSMENT_TYPE',
    keyMap: 'PHQ9',
    valueEn: 'Patient Health Questionnaire 9',
    valueVi: 'Thang đo trầm cảm',
    description: 'Bài đánh giá PHQ-9 sàng lọc và đo lường mức độ trầm cảm',
  },
  {
    type: 'ASSESSMENT_TYPE',
    keyMap: 'DASS21',
    valueEn: 'Depression Anxiety Stress Scales 21',
    valueVi: 'Thang đo trầm cảm - lo âu - căng thẳng',
    description:
      'Bài đánh giá DASS-21 đo lường 3 trạng thái: trầm cảm, lo âu, căng thẳng',
  },
  {
    type: 'CATEGORY',
    keyMap: 'EXERCISE',
    valueEn: 'Exercise',
    valueVi: 'Tập thể dục',
    description: 'Khuyến nghị về hoạt động thể chất',
  },
  {
    type: 'CATEGORY',
    keyMap: 'MEDITATION',
    valueEn: 'Meditation',
    valueVi: 'Thiền định',
    description: 'Khuyến nghị về thiền và chánh niệm',
  },
  {
    type: 'CATEGORY',
    keyMap: 'BREATHING',
    valueEn: 'Breathing Exercise',
    valueVi: 'Bài tập thở',
    description: 'Khuyến nghị về kỹ thuật thở',
  },
  {
    type: 'CATEGORY',
    keyMap: 'SLEEP',
    valueEn: 'Sleep Hygiene',
    valueVi: 'Vệ sinh giấc ngủ',
    description: 'Khuyến nghị về cải thiện giấc ngủ',
  },
  {
    type: 'CATEGORY',
    keyMap: 'SOCIAL',
    valueEn: 'Social Connection',
    valueVi: 'Kết nối xã hội',
    description: 'Khuyến nghị về giao tiếp và kết nối với người khác',
  },
  {
    type: 'CATEGORY',
    keyMap: 'NUTRITION',
    valueEn: 'Nutrition',
    valueVi: 'Dinh dưỡng',
    description: 'Khuyến nghị về chế độ ăn uống lành mạnh',
  },
  {
    type: 'CATEGORY',
    keyMap: 'PROFESSIONAL',
    valueEn: 'Professional Help',
    valueVi: 'Tư vấn chuyên gia',
    description: 'Khuyến nghị tìm kiếm hỗ trợ từ chuyên gia tâm lý',
  },
  {
    type: 'CATEGORY',
    keyMap: 'JOURNALING',
    valueEn: 'Journaling',
    valueVi: 'Viết nhật ký',
    description: 'Khuyến nghị về viết nhật ký cảm xúc',
  },
  {
    type: 'CATEGORY',
    keyMap: 'RELAXATION',
    valueEn: 'Relaxation',
    valueVi: 'Thư giãn',
    description: 'Khuyến nghị về các hoạt động thư giãn',
  },

  {
    type: 'RESOURCE_CATEGORY',
    keyMap: 'RES_MEDITATION',
    valueEn: 'Meditation',
    valueVi: 'Thiền định',
    description: 'Tài nguyên về thiền và chánh niệm',
  },
  {
    type: 'RESOURCE_CATEGORY',
    keyMap: 'RES_BREATHING',
    valueEn: 'Breathing Exercise',
    valueVi: 'Bài tập thở',
    description: 'Tài nguyên về kỹ thuật thở',
  },
  {
    type: 'RESOURCE_CATEGORY',
    keyMap: 'RES_ARTICLE',
    valueEn: 'Article',
    valueVi: 'Bài viết',
    description: 'Bài viết kiến thức sức khỏe tâm thần',
  },
  {
    type: 'RESOURCE_CATEGORY',
    keyMap: 'RES_VIDEO',
    valueEn: 'Video',
    valueVi: 'Video',
    description: 'Video hướng dẫn và chia sẻ',
  },
  {
    type: 'RESOURCE_CATEGORY',
    keyMap: 'RES_MUSIC',
    valueEn: 'Music & Sound',
    valueVi: 'Âm nhạc & Âm thanh',
    description: 'Nhạc thư giãn và âm thanh thiên nhiên',
  },

  {
    type: 'RESOURCE_TYPE',
    keyMap: 'TYPE_VIDEO',
    valueEn: 'Video',
    valueVi: 'Video',
    description: 'Nội dung dạng video',
  },
  {
    type: 'RESOURCE_TYPE',
    keyMap: 'TYPE_ARTICLE',
    valueEn: 'Article',
    valueVi: 'Bài viết',
    description: 'Nội dung dạng bài viết',
  },
  {
    type: 'RESOURCE_TYPE',
    keyMap: 'TYPE_AUDIO',
    valueEn: 'Audio',
    valueVi: 'Âm thanh',
    description: 'Nội dung dạng âm thanh',
  },

  {
    type: 'RECOMMENDATION_TYPE',
    keyMap: 'DAILY',
    valueEn: 'Daily',
    valueVi: 'Hàng ngày',
    description: 'Lời khuyên dựa trên log theo ngày',
  },
  {
    type: 'RECOMMENDATION_TYPE',
    keyMap: 'WEEKLY',
    valueEn: 'Weekly',
    valueVi: 'Hàng tuần',
    description: 'Lời khuyên tổng hợp tuần',
  },
  {
    type: 'RECOMMENDATION_TYPE',
    keyMap: 'ASSESSMENT',
    valueEn: 'Assessment',
    valueVi: 'Bài đánh giá',
    description: 'Lời khuyên sau khi làm bài đánh giá',
  },
  {
    type: 'RECOMMENDATION_TYPE',
    keyMap: 'CHAT',
    valueEn: 'Chat',
    valueVi: 'Chatbot',
    description: 'Lời khuyên từ AI Chatbot',
  },
];

export async function seedAllcode(dataSource: DataSource): Promise<void> {
  const allcodeRepository = dataSource.getRepository(Allcode);

  for (const data of allcodeSeedData) {
    const existing = await allcodeRepository.findOne({
      where: { type: data.type, keyMap: data.keyMap },
    });

    if (!existing) {
      await allcodeRepository.save(allcodeRepository.create(data));
      console.log(`Created: ${data.type} - ${data.keyMap}`);
    } else {
      console.log(`Skipped (exists): ${data.type} - ${data.keyMap}`);
    }
  }

  console.log('AllCode seeding completed!');
}
