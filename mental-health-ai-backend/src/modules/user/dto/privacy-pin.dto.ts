import { IsString, Length, Matches } from 'class-validator';

export class SetPrivacyPinDto {
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain digits only' })
  pin: string;
}

export class VerifyPrivacyPinDto {
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain digits only' })
  pin: string;
}

export class RemovePrivacyPinDto {
  @IsString()
  @Length(4, 6)
  @Matches(/^\d+$/, { message: 'PIN must contain digits only' })
  pin: string;
}
