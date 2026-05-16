import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities';
import { RegisterDto, LoginDto } from './dto';
import { Allcode } from '../allcode/entities/allcode.entity';
import { Role } from '../role/entities';
import { EmailService } from '../email/email.service';

export type GoogleLoginPayload = {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  providerId?: string;
  provider?: string;
};

export type GoogleLoginRequest = {
  user?: GoogleLoginPayload;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Allcode)
    private allcodeRepository: Repository<Allcode>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const {
        username,
        email,
        password,
        fullName,
        genderCode,
        avatarUrl,
        phoneNumber,
        dateOfBirth,
      } = registerDto;

      const normalizedEmail = email && email.trim() !== '' ? email.trim() : '';

      if (!normalizedEmail) {
        return { EC: 0, EM: 'Email is required' };
      }

      const gender = await this.allcodeRepository.findOne({
        where: { keyMap: genderCode, type: 'GENDER' },
      });
      if (!gender) {
        return { EC: 0, EM: `${genderCode} is not valid!` };
      }

      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser) {
        return { EC: 0, EM: 'Username already exists' };
      }

      const existingEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        return { EC: 0, EM: 'Email already exists' };
      }

      const defaultRole = await this.roleRepository.findOne({
        where: { roleName: 'User' },
      });
      if (!defaultRole) {
        return { EC: 0, EM: 'Default role not found. Please run seed first.' };
      }

      const parsedDateOfBirth = dateOfBirth
        ? new Date(
            typeof dateOfBirth === 'string' && dateOfBirth.includes('/')
              ? dateOfBirth.split('/').reverse().join('-')
              : dateOfBirth,
          )
        : undefined;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        username,
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        gender,
        avatarUrl,
        phoneNumber,
        dateOfBirth: parsedDateOfBirth,
        role: defaultRole,
      });
      await this.userRepository.save(user);

      await this.sendWelcomeEmailIfPossible(user, 'signup');

      return {
        EC: 1,
        EM: 'Registration successful',
        user: this.sanitizeUser(user),
      };
    } catch (error: unknown) {
      console.error(
        'Error in register:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM:
          'Error from register service: ' +
          (error instanceof Error ? error.message : String(error)),
      });
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { username, password } = loginDto;

      const user = await this.userRepository.findOne({
        where: { username },
        relations: ['role', 'gender'],
        select: {
          userId: true,
          username: true,
          email: true,
          password: true,
          isActive: true,
          isDeleted: true,
          fullName: true,
          phoneNumber: true,
          dateOfBirth: true,
          avatarUrl: true,
          welcomeEmailSentAt: true,
          createdAt: true,
          updatedAt: true,
          role: {
            roleId: true,
            roleName: true,
          },
          gender: {
            keyMap: true,
            valueEn: true,
            valueVi: true,
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          EC: 0,
          EM: 'Invalid credentials',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException({
          EC: 0,
          EM: 'Invalid credentials',
        });
      }

      if (!user.isActive) {
        throw new ForbiddenException({
          EC: 0,
          EM: 'Account is deactivated',
        });
      }

      if (user.isDeleted) {
        throw new ForbiddenException({
          EC: 0,
          EM: 'Account has been deleted',
        });
      }

      await this.sendWelcomeEmailIfPossible(user, 'login');

      const { accessToken, refreshToken } = this.generateTokenPair(user);

      return {
        EC: 1,
        EM: 'Login successful',
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error(
        'Error in login:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from login service',
      });
    }
  }

  async googleLogin(req: GoogleLoginRequest) {
    if (!req.user) {
      throw new UnauthorizedException({ EC: 0, EM: 'No user from google' });
    }
    const { email, fullName, avatarUrl, providerId, provider } = req.user;

    if (!email) {
      throw new UnauthorizedException({
        EC: 0,
        EM: 'Email not found from google',
      });
    }

    let user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'gender'],
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const defaultRole = await this.roleRepository.findOne({
        where: { roleName: 'User' },
      });
      if (!defaultRole) {
        throw new InternalServerErrorException({
          EC: 0,
          EM: 'Default role not found',
        });
      }
      user = this.userRepository.create({
        username: email, 
        email,
        fullName,
        avatarUrl,
        provider,
        providerId,
        isActive: true,
        password: '', 
        role: defaultRole,
      });
      user = await this.userRepository.save(user);

      await this.sendWelcomeEmailIfPossible(user, 'signup');
    }

    if (!user.isActive) {
      throw new ForbiddenException({ EC: 0, EM: 'Account is deactivated' });
    }

    if (user.isDeleted) {
      throw new ForbiddenException({ EC: 0, EM: 'Account has been deleted' });
    }

    const { accessToken, refreshToken } = this.generateTokenPair(user);
    return {
      EC: 1,
      EM: 'Google Login successful',
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException({ EC: 0, EM: 'Missing refresh token' });
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        username: string;
        tokenType?: string;
      }>(refreshToken);

      if (payload.tokenType !== 'refresh' || !payload.sub) {
        throw new UnauthorizedException({ EC: 0, EM: 'Invalid refresh token' });
      }

      const user = await this.userRepository.findOne({
        where: { userId: payload.sub },
        relations: ['role', 'gender'],
      });

      if (!user || !user.isActive || user.isDeleted) {
        throw new UnauthorizedException({ EC: 0, EM: 'User not found' });
      }

      return {
        EC: 1,
        EM: 'Token refreshed successfully',
        data: {
          accessToken: this.generateAccessToken(user),
        },
      };
    } catch (error) {
      throw new UnauthorizedException({
        EC: 0,
        EM: error instanceof Error ? error.message : 'Refresh token is invalid',
      });
    }
  }

  private async sendWelcomeEmailIfPossible(
    user: Pick<User, 'userId' | 'email' | 'fullName' | 'username'> & {
      welcomeEmailSentAt?: Date | null;
      createdAt?: Date;
    },
    source: 'signup' | 'login' = 'signup',
  ) {
    if (!user?.email || user.welcomeEmailSentAt) {
      return;
    }

    if (source === 'login') {
      const createdAtMs = user.createdAt?.getTime();
      if (!createdAtMs) {
        return;
      }

      const LOGIN_RETRY_WINDOW_MS = 24 * 60 * 60 * 1000; 
      const isRecentlyCreated =
        Date.now() - createdAtMs <= LOGIN_RETRY_WINDOW_MS;
      if (!isRecentlyCreated) {
        return;
      }
    }

    try {
      const sent = await this.emailService.sendWelcomeEmail(user);
      if (!sent) {
        console.warn(
          `Welcome email was not sent to ${user.email}. Will retry on next login.`,
        );
        return;
      }

      await this.userRepository.update(
        { userId: user.userId },
        { welcomeEmailSentAt: new Date() },
      );
    } catch (error) {
      console.warn('Failed to send welcome email:', error);
    }
  }

  async getAccountById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['role', 'gender'],
    });

    if (!user) {
      throw new UnauthorizedException({ EC: 0, EM: 'User not found' });
    }

    if (!user.isActive) {
      throw new ForbiddenException({ EC: 0, EM: 'Account is deactivated' });
    }

    if (user.isDeleted) {
      throw new ForbiddenException({ EC: 0, EM: 'Account has been deleted' });
    }

    return {
      EC: 1,
      EM: 'Thành công',
      data: {
        user: this.sanitizeUser(user),
      },
    };
  }

  private getRefreshTokenExpiresIn(): import('@nestjs/jwt').JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ||
      '30d') as import('@nestjs/jwt').JwtSignOptions['expiresIn'];
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.userId,
      username: user.username,
      tokenType: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.userId,
      username: user.username,
      tokenType: 'refresh',
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.getRefreshTokenExpiresIn(),
    });
  }

  private generateTokenPair(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...userData } = user;
    void password;
    const result: Record<string, unknown> = { ...userData };

    if (user.role) {
      result.role = {
        roleId: user.role.roleId,
        roleName: user.role.roleName,
      };
    }

    if (user.gender) {
      result.gender = {
        keyMap: user.gender.keyMap,
        valueEn: user.gender.valueEn,
        valueVi: user.gender.valueVi,
      };
    }

    Object.keys(result).forEach((key) => {
      if (result[key] === null || result[key] === undefined) {
        delete result[key];
      }
    });

    return result;
  }
}
