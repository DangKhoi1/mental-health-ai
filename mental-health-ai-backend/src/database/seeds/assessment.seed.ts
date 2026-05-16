import { DataSource } from 'typeorm';
import { AssessmentTemplate } from '../../modules/assessment/entities/assessment-template.entity';
import { AssessmentQuestion } from '../../modules/assessment/entities/assessment-question.entity';

export const assessmentTemplatesData = [
  {
    typeCode: 'MHB6',
    title: 'Mental Health Baseline - Sàng lọc tổng hợp ban đầu',
    description:
      'Bài sàng lọc 6 câu giúp tạo mốc sức khỏe tâm lý ban đầu dựa trên các nhóm dấu hiệu nền tảng như khí sắc, lo âu, căng thẳng, giấc ngủ, năng lượng và khả năng thích nghi.',
    maxScorePerQuestion: 3,
  },
  {
    typeCode: 'PHQ9',
    title: 'PHQ-9 - Thang đánh giá trầm cảm',
    description:
      'Bộ câu hỏi PHQ-9 giúp đánh giá mức độ trầm cảm trong 2 tuần qua. Được phát triển bởi Pfizer Inc.',
    maxScorePerQuestion: 3,
  },
  {
    typeCode: 'GAD7',
    title: 'GAD-7 - Thang đánh giá lo âu',
    description:
      'Bộ câu hỏi GAD-7 giúp đánh giá mức độ lo âu trong 2 tuần qua. Được phát triển bởi Pfizer Inc.',
    maxScorePerQuestion: 3,
  },
  {
    typeCode: 'PSS',
    title: 'PSS-10 - Thang đánh giá stress',
    description:
      'Bộ câu hỏi PSS-10 giúp đánh giá mức độ căng thẳng trong 1 tháng qua. Được phát triển bởi Dr. Sheldon Cohen.',
    maxScorePerQuestion: 4,
  },
];

const standardOptions = [
  { id: 'opt-0', optionText: 'Không bao giờ', score: 0 },
  { id: 'opt-1', optionText: 'Vài ngày', score: 1 },
  { id: 'opt-2', optionText: 'Hơn một nửa số ngày', score: 2 },
  { id: 'opt-3', optionText: 'Gần như mỗi ngày', score: 3 },
];

const pssOptions = [
  { id: 'pss-0', optionText: 'Không bao giờ', score: 0 },
  { id: 'pss-1', optionText: 'Thỉnh thoảng', score: 1 },
  { id: 'pss-2', optionText: 'Đôi khi', score: 2 },
  { id: 'pss-3', optionText: 'Khá thường xuyên', score: 3 },
  { id: 'pss-4', optionText: 'Rất thường xuyên', score: 4 },
];

const pssOptionsReverse = [
  { id: 'pss-r-0', optionText: 'Không bao giờ', score: 4 },
  { id: 'pss-r-1', optionText: 'Thỉnh thoảng', score: 3 },
  { id: 'pss-r-2', optionText: 'Đôi khi', score: 2 },
  { id: 'pss-r-3', optionText: 'Khá thường xuyên', score: 1 },
  { id: 'pss-r-4', optionText: 'Rất thường xuyên', score: 0 },
];

export const phq9Questions = [
  {
    order: 1,
    content:
      'Ít hứng thú hoặc ít thích thú khi làm việc gì đó (Little interest or pleasure in doing things)',
    options: standardOptions,
  },
  {
    order: 2,
    content:
      'Cảm thấy chán nản, buồn bã hoặc tuyệt vọng (Feeling down, depressed, or hopeless)',
    options: standardOptions,
  },
  {
    order: 3,
    content:
      'Khó đi vào giấc ngủ, khó ngủ suốt đêm hoặc ngủ quá nhiều (Trouble falling or staying asleep, or sleeping too much)',
    options: standardOptions,
  },
  {
    order: 4,
    content:
      'Cảm thấy mệt mỏi hoặc ít năng lượng (Feeling tired or having little energy)',
    options: standardOptions,
  },
  {
    order: 5,
    content:
      'Ăn không ngon miệng hoặc ăn quá nhiều (Poor appetite or overeating)',
    options: standardOptions,
  },
  {
    order: 6,
    content:
      'Cảm thấy tệ về bản thân - hoặc cảm thấy mình là người thất bại hoặc đã làm cho bản thân/gia đình thất vọng (Feeling bad about yourself - or that you are a failure or have let yourself or your family down)',
    options: standardOptions,
  },
  {
    order: 7,
    content:
      'Khó tập trung vào việc gì đó, ví dụ như đọc báo hoặc xem TV (Trouble concentrating on things, such as reading the newspaper or watching television)',
    options: standardOptions,
  },
  {
    order: 8,
    content:
      'Di chuyển hoặc nói chậm đến mức người khác có thể nhận thấy. Hoặc ngược lại - bồn chồn hoặc cử động nhiều hơn bình thường (Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual)',
    options: standardOptions,
  },
  {
    order: 9,
    content:
      'Có suy nghĩ rằng thà chết còn hơn hoặc nghĩ đến việc tự làm hại bản thân (Thoughts that you would be better off dead, or of hurting yourself in some way)',
    options: standardOptions,
  },
];

export const mhb6Questions = [
  {
    order: 1,
    content:
      'Trong 2 tuần gần đây, bạn có thường cảm thấy buồn, trống rỗng hoặc mất hứng thú với những việc vốn quen thuộc không?',
    options: standardOptions,
  },
  {
    order: 2,
    content:
      'Bạn có thường xuyên rơi vào trạng thái lo lắng, suy nghĩ nhiều hoặc khó làm dịu đầu óc không?',
    options: standardOptions,
  },
  {
    order: 3,
    content:
      'Giấc ngủ của bạn có đang thiếu ổn định, khó vào giấc hoặc ngủ dậy mà vẫn thấy chưa được nghỉ ngơi không?',
    options: standardOptions,
  },
  {
    order: 4,
    content:
      'Bạn có thường cảm thấy thiếu năng lượng, nhanh mệt hoặc khó bắt đầu các việc hằng ngày không?',
    options: standardOptions,
  },
  {
    order: 5,
    content:
      'Bạn có đang dễ bị quá tải, khó tập trung hoặc khó duy trì hiệu quả khi học tập và làm việc không?',
    options: standardOptions,
  },
  {
    order: 6,
    content:
      'Bạn có xu hướng thu mình, né tránh giao tiếp hoặc cảm thấy khó tìm được sự hỗ trợ khi cần không?',
    options: standardOptions,
  },
];

export const gad7Questions = [
  {
    order: 1,
    content:
      'Cảm thấy lo lắng, bồn chồn hoặc căng thẳng (Feeling nervous, anxious, or on edge)',
    options: standardOptions,
  },
  {
    order: 2,
    content:
      'Không thể ngừng hoặc kiểm soát lo lắng (Not being able to stop or control worrying)',
    options: standardOptions,
  },
  {
    order: 3,
    content:
      'Lo lắng quá nhiều về nhiều điều khác nhau (Worrying too much about different things)',
    options: standardOptions,
  },
  {
    order: 4,
    content: 'Khó thư giãn (Trouble relaxing)',
    options: standardOptions,
  },
  {
    order: 5,
    content:
      'Bồn chồn đến mức khó ngồi yên (Being so restless that it is hard to sit still)',
    options: standardOptions,
  },
  {
    order: 6,
    content:
      'Dễ bị khó chịu hoặc cáu gắt (Becoming easily annoyed or irritable)',
    options: standardOptions,
  },
  {
    order: 7,
    content:
      'Cảm thấy sợ hãi như thể điều gì đó tồi tệ sắp xảy ra (Feeling afraid, as if something awful might happen)',
    options: standardOptions,
  },
];

export const pssQuestions = [
  {
    order: 1,
    content:
      'Bạn có thường xuyên bị xáo trộn bởi những điều xảy ra bất ngờ không? (How often have you been upset because of something that happened unexpectedly?)',
    options: pssOptions,
  },
  {
    order: 2,
    content:
      'Bạn có thường xuyên cảm thấy không thể kiểm soát những điều quan trọng trong cuộc sống không? (How often have you felt that you were unable to control the important things in your life?)',
    options: pssOptions,
  },
  {
    order: 3,
    content:
      'Bạn có thường xuyên cảm thấy căng thẳng và lo lắng không? (How often have you felt nervous and stressed?)',
    options: pssOptions,
  },
  {
    order: 4,
    content:
      'Bạn có thường xuyên cảm thấy tự tin về khả năng xử lý các vấn đề cá nhân của mình không? (How often have you felt confident about your ability to handle your personal problems?) [REVERSE SCORED]',
    options: pssOptionsReverse,
  },
  {
    order: 5,
    content:
      'Bạn có thường xuyên cảm thấy mọi việc đang diễn ra theo ý mình không? (How often have you felt that things were going your way?) [REVERSE SCORED]',
    options: pssOptionsReverse,
  },
  {
    order: 6,
    content:
      'Bạn có thường xuyên thấy rằng mình không thể đối phó với tất cả những việc phải làm không? (How often have you found that you could not cope with all the things that you had to do?)',
    options: pssOptions,
  },
  {
    order: 7,
    content:
      'Bạn có thường xuyên có thể kiểm soát những điều gây khó chịu trong cuộc sống không? (How often have you been able to control irritations in your life?) [REVERSE SCORED]',
    options: pssOptionsReverse,
  },
  {
    order: 8,
    content:
      'Bạn có thường xuyên cảm thấy mình đang làm chủ mọi thứ không? (How often have you felt that you were on top of things?) [REVERSE SCORED]',
    options: pssOptionsReverse,
  },
  {
    order: 9,
    content:
      'Bạn có thường xuyên tức giận vì những điều nằm ngoài tầm kiểm soát của bạn không? (How often have you been angered because of things that happened that were outside of your control?)',
    options: pssOptions,
  },
  {
    order: 10,
    content:
      'Bạn có thường xuyên cảm thấy khó khăn chồng chất đến mức không thể vượt qua không? (How often have you felt difficulties were piling up so high that you could not overcome them?)',
    options: pssOptions,
  },
];

function getQuestionsForTemplate(typeCode: string) {
  switch (typeCode) {
    case 'MHB6':
      return mhb6Questions;
    case 'PHQ9':
      return phq9Questions;
    case 'GAD7':
      return gad7Questions;
    case 'PSS':
      return pssQuestions;
    default:
      return [];
  }
}

export async function seedAssessments(dataSource: DataSource): Promise<void> {
  const templateRepository = dataSource.getRepository(AssessmentTemplate);
  const questionRepository = dataSource.getRepository(AssessmentQuestion);

  for (const templateData of assessmentTemplatesData) {
    let template = await templateRepository.findOne({
      where: { typeCode: templateData.typeCode },
    });

    if (!template) {
      template = templateRepository.create(templateData);
      await templateRepository.save(template);
      console.log(`Created template: ${templateData.typeCode}`);
    } else {
      console.log(
        `Template exists: ${templateData.typeCode}, checking questions...`,
      );
    }

    const questions = getQuestionsForTemplate(templateData.typeCode);

    for (const questionData of questions) {
      let question = await questionRepository.findOne({
        where: {
          template: { assessmentTemplateId: template.assessmentTemplateId },
          order: questionData.order,
        },
      });

      if (!question) {
        question = questionRepository.create({
          ...questionData,
          template,
        });
        await questionRepository.save(question);
      } else {
        question.content = questionData.content;
        question.options = questionData.options;
        await questionRepository.save(question);
      }
    }
    console.log(
      `Processed ${questions.length} questions for ${templateData.typeCode}`,
    );
  }

  console.log('Assessment seeding completed!');
}
