import { IsNotEmpty } from 'class-validator';

export class SubmitAnswerDto {
  @IsNotEmpty()
  answers: Record<
    string,
    { questionId: string; score: number; optionId?: string }
  >;
}
