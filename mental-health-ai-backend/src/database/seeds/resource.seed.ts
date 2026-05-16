import { DataSource } from 'typeorm';
import { Resource } from '../../modules/resource/entities/resource.entity';

export const resourceSeedData = [
  {
    title: 'Thiền Chánh Niệm Cơ Bản',
    description:
      'Bài tập thiền 5 phút giúp bạn tập trung vào hơi thở và hiện tại. Thực hành mỗi ngày để giảm căng thẳng và tăng sự tỉnh thức.',
    categoryCode: 'RES_MEDITATION',
    typeCode: 'TYPE_AUDIO',
    duration: '5 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?q=80&w=2072&auto=format&fit=crop',
    isActive: true,
  },
  {
    title: 'Kỹ Thuật Thở 4-7-8',
    description:
      'Phương pháp thở giúp giảm lo âu và dễ ngủ hơn. Hít vào 4 giây, giữ 7 giây, thở ra 8 giây.',
    categoryCode: 'RES_BREATHING',
    typeCode: 'TYPE_VIDEO',
    duration: '3 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2031&auto=format&fit=crop',
    contentUrl: 'https://www.youtube.com/watch?v=UXill7zG6jU',
    isActive: true,
  },
  {
    title: 'Hiểu Về Cảm Xúc Tiêu Cực',
    description:
      'Bài viết giúp bạn nhận diện và chấp nhận những cảm xúc khó khăn. Học cách đối mặt thay vì né tránh.',
    categoryCode: 'RES_ARTICLE',
    typeCode: 'TYPE_ARTICLE',
    duration: '5 phút đọc',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
    isActive: true,
  },
  {
    title: 'Nhạc Thư Giãn Sóng Alpha',
    description:
      'Âm nhạc giúp não bộ thư giãn và tăng sự tập trung. Phù hợp khi học bài, làm việc hoặc trước khi ngủ.',
    categoryCode: 'RES_MUSIC',
    typeCode: 'TYPE_AUDIO',
    duration: '30 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop',
    contentUrl: 'https://www.youtube.com/watch?v=WPni755-Krg',
    isActive: true,
  },
  {
    title: '5 Cách Giảm Stress Tức Thì',
    description:
      'Những mẹo nhỏ bạn có thể làm ngay tại chỗ làm hoặc ở nhà để giảm căng thẳng nhanh chóng.',
    categoryCode: 'RES_ARTICLE',
    typeCode: 'TYPE_ARTICLE',
    duration: '3 phút đọc',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1447452001602-7090c774637d?q=80&w=1974&auto=format&fit=crop',
    isActive: true,
  },
  {
    title: 'Bài Tập Thở Hộp (Box Breathing)',
    description:
      'Kỹ thuật thở được lính đặc nhiệm sử dụng để giữ bình tĩnh. Hít vào, giữ, thở ra, giữ — mỗi bước 4 giây.',
    categoryCode: 'RES_BREATHING',
    typeCode: 'TYPE_VIDEO',
    duration: '4 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1527255355443-35a409743c39?q=80&w=1974&auto=format&fit=crop',
    contentUrl: 'https://www.youtube.com/watch?v=tEmt1Znux58',
    isActive: true,
  },
  {
    title: 'Yoga Nhẹ Nhàng Buổi Sáng',
    description:
      'Chuỗi bài tập yoga 10 phút để khởi đầu ngày mới với năng lượng tích cực và tinh thần thoải mái.',
    categoryCode: 'RES_MEDITATION',
    typeCode: 'TYPE_VIDEO',
    duration: '10 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop',
    contentUrl: 'https://www.youtube.com/watch?v=4pKly2JojMw',
    isActive: true,
  },
  {
    title: 'Cách Xây Dựng Thói Quen Ngủ Lành Mạnh',
    description:
      'Hướng dẫn chi tiết về vệ sinh giấc ngủ: thời gian ngủ, môi trường phòng ngủ, và những thói quen cần tránh.',
    categoryCode: 'RES_ARTICLE',
    typeCode: 'TYPE_ARTICLE',
    duration: '7 phút đọc',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=2060&auto=format&fit=crop',
    isActive: true,
  },
  {
    title: 'Âm Thanh Thiên Nhiên - Mưa Rừng',
    description:
      'Tiếng mưa rơi trong rừng giúp thư giãn, giảm stress và hỗ trợ giấc ngủ sâu.',
    categoryCode: 'RES_MUSIC',
    typeCode: 'TYPE_AUDIO',
    duration: '60 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1428592953211-077101b2021b?q=80&w=1974&auto=format&fit=crop',
    contentUrl: 'https://www.youtube.com/watch?v=q76bMs-NwRk',
    isActive: true,
  },
  {
    title: 'Thiền Quét Cơ Thể (Body Scan)',
    description:
      'Bài thiền hướng dẫn quét qua từng phần cơ thể, giúp nhận biết và giải phóng căng thẳng tích tụ.',
    categoryCode: 'RES_MEDITATION',
    typeCode: 'TYPE_AUDIO',
    duration: '15 phút',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=2093&auto=format&fit=crop',
    isActive: true,
  },
];

export async function seedResources(dataSource: DataSource): Promise<void> {
  const resourceRepository = dataSource.getRepository(Resource);

  for (const data of resourceSeedData) {
    const existing = await resourceRepository.findOne({
      where: { title: data.title },
    });

    if (!existing) {
      await resourceRepository.save(resourceRepository.create(data));
      console.log(`Created resource: ${data.title}`);
    } else {
      console.log(`Skipped (exists): ${data.title}`);
    }
  }

  console.log('Resource seeding completed!');
}
