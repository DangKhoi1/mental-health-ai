import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { User } from '../user/entities';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getAppName(): string {
    return (
      this.configService.get<string>('APP_NAME')?.trim() || 'Mental Health AI'
    );
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3000'
    );
  }

  private createTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('MAIL_HOST')?.trim();
    const port = Number(this.configService.get<string>('MAIL_PORT') || 0);
    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const pass = this.configService.get<string>('MAIL_PASS')?.trim();

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'Email configuration is missing. Welcome/reminder emails will be skipped.',
      );
      return null;
    }

    const secure =
      String(
        this.configService.get<string>('MAIL_SECURE') || '',
      ).toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('MAIL_FROM')?.trim() ||
      `${this.getAppName()} <${this.configService.get<string>('MAIL_USER') || 'no-reply@localhost'}>`
    );
  }

  private getLogoPath(): string {
    return path.join(process.cwd(), 'src', 'database', 'mental_health.png');
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
    attachments?: nodemailer.SendMailOptions['attachments'],
  ) {
    const transporter = this.createTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.sendMail({
      from: this.getFromAddress(),
      to,
      subject,
      text,
      html,
      attachments,
    });

    return true;
  }

  async sendWelcomeEmail(user: Pick<User, 'email' | 'fullName' | 'username'>) {
    if (!user.email) {
      return false;
    }

    const displayName = user.fullName?.trim() || user.username || 'bạn';
    const appName = this.getAppName();
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;

    let attachments: nodemailer.SendMailOptions['attachments'] = undefined;
    let logoDataUri = '';
    const logoPath = this.getLogoPath();
    if (fs.existsSync(logoPath)) {
      attachments = [
        {
          filename: 'mental_health.png',
          path: logoPath,
          cid: 'logo',
        },
      ];
      logoDataUri = 'cid:logo';
    }

    const subject = `Chào mừng bạn đến với ${appName}`;
    const text = [
      `Xin chào ${displayName},`,
      '',
      `Cảm ơn bạn đã đăng ký ${appName}.`,
      'Bạn có thể bắt đầu ghi lại tâm trạng, nhật ký và giấc ngủ để nhận hỗ trợ phù hợp hơn.',
      `Truy cập ứng dụng tại: ${dashboardUrl}`,
      '',
      'Chúc bạn một ngày thật tốt lành.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto">
        <!-- Banner Header -->
        <div style="background:linear-gradient(135deg,#2563eb 0%,#14b8a6 100%);padding:40px 20px;text-align:center;border-radius:12px 12px 0 0">
          <img src="${logoDataUri}" style="width:48px;height:48px;margin:0 auto 16px;display:block;background-color:#ffffff;padding:12px;border-radius:16px" alt="${appName} Logo" />
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:bold">${appName}</h1>
          <p style="margin:0;color:#e0f2fe;font-size:14px">Hỗ trợ chăm sóc sức khỏe tinh thần mỗi ngày</p>
        </div>
        
        <!-- Content -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:bold">Chào mừng bạn đến với ${appName}</h2>
          <p style="margin:0 0 12px;color:#4b5563;font-size:16px">Xin chào <strong>${displayName}</strong>,</p>
          <p style="margin:0 0 16px;color:#4b5563;font-size:16px">Cảm ơn bạn đã đăng ký ${appName}. Bạn có thể bắt đầu ghi lại tâm trạng, nhật ký và giấc ngủ để nhận hỗ trợ phù hợp hơn.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:16px">Mở ứng dụng</a>
          </div>
          <p style="margin:16px 0 0;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px">Chúc bạn một ngày thật tốt lành. Bạn có thể quay lại ứng dụng bất cứ lúc nào để tiếp tục hành trình chăm sóc sức khỏe tinh thần.</p>
        </div>
        <div style="display:none;opacity:0;font-size:0px;line-height:0;color:#ffffff;">${Date.now()}</div>
      </div>
    `;

    return this.sendEmail(user.email, subject, text, html, attachments);
  }

  async sendUsageReminderEmail(
    user: Pick<User, 'email' | 'fullName' | 'username'>,
  ) {
    if (!user.email) {
      return false;
    }

    const displayName = user.fullName?.trim() || user.username || 'bạn';
    const appName = this.getAppName();
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard`;

    let attachments: nodemailer.SendMailOptions['attachments'] = undefined;
    let logoDataUri = '';
    const logoPath = this.getLogoPath();
    if (fs.existsSync(logoPath)) {
      attachments = [
        {
          filename: 'mental_health.png',
          path: logoPath,
          cid: 'logo',
        },
      ];
      logoDataUri = 'cid:logo';
    }

    const subject = `${appName} nhắc bạn quay lại chăm sóc sức khỏe tinh thần`;
    const text = [
      `Xin chào ${displayName},`,
      '',
      `${appName} gửi bạn lời nhắc nhẹ: hãy dành vài phút để ghi lại tâm trạng, viết nhật ký hoặc xem lại gợi ý AI hôm nay.`,
      `Mở ứng dụng tại: ${dashboardUrl}`,
      '',
      'Mong bạn luôn bình an.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto">
        <!-- Banner Header -->
        <div style="background:linear-gradient(135deg,#2563eb 0%,#14b8a6 100%);padding:40px 20px;text-align:center;border-radius:12px 12px 0 0">
          <img src="${logoDataUri}" style="width:48px;height:48px;margin:0 auto 16px;display:block;background-color:#ffffff;padding:12px;border-radius:16px" alt="${appName} Logo" />
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:bold">${appName}</h1>
          <p style="margin:0;color:#e0f2fe;font-size:14px">Hỗ trợ chăm sóc sức khỏe tinh thần mỗi ngày</p>
        </div>
        
        <!-- Content -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:bold">${appName} nhắc bạn quay lại</h2>
          <p style="margin:0 0 12px;color:#4b5563;font-size:16px">Xin chào <strong>${displayName}</strong>,</p>
          <p style="margin:0 0 16px;color:#4b5563;font-size:16px">${appName} gửi bạn lời nhắc nhẹ: hãy dành vài phút để ghi lại tâm trạng, viết nhật ký hoặc xem lại gợi ý AI hôm nay.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:16px">Quay lại ứng dụng</a>
          </div>
          <p style="margin:16px 0 0;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px">Mong bạn luôn bình an.</p>
        </div>
        <div style="display:none;opacity:0;font-size:0px;line-height:0;color:#ffffff;">${Date.now()}</div>
      </div>
    `;

    return this.sendEmail(user.email, subject, text, html, attachments);
  }

  async sendReminderEmail(
    user: Pick<User, 'email' | 'fullName' | 'username'>,
    reminder: {
      title: string;
      message: string;
      scheduleTime?: Date | string | null;
    },
  ) {
    if (!user.email) {
      return false;
    }

    const displayName = user.fullName?.trim() || user.username || 'bạn';
    const appName = this.getAppName();
    const dashboardUrl = `${this.getFrontendUrl()}/dashboard/notifications`;
    const scheduleLabel = reminder.scheduleTime
      ? new Date(reminder.scheduleTime).toLocaleString('vi-VN', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : 'Ngay bây giờ';

    let attachments: nodemailer.SendMailOptions['attachments'] = undefined;
    let logoDataUri = '';
    const logoPath = this.getLogoPath();
    if (fs.existsSync(logoPath)) {
      attachments = [
        {
          filename: 'mental_health.png',
          path: logoPath,
          cid: 'logo',
        },
      ];
      logoDataUri = 'cid:logo';
    }

    const subject = `Nhắc nhở từ ${appName}: ${reminder.title}`;
    const text = [
      `Xin chào ${displayName},`,
      '',
      `Đây là nhắc nhở từ ${appName}.`,
      `Tiêu đề: ${reminder.title}`,
      `Nội dung nhắc nhở: ${reminder.message}`,
      `Thời gian nhắc: ${scheduleLabel}`,
      `Mở ứng dụng tại: ${dashboardUrl}`,
      '',
      'Chúc bạn một ngày bình an.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#2563eb 0%,#14b8a6 100%);padding:40px 20px;text-align:center;border-radius:12px 12px 0 0">
          <img src="${logoDataUri}" style="width:48px;height:48px;margin:0 auto 16px;display:block;background-color:#ffffff;padding:12px;border-radius:16px" alt="${appName} Logo" />
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:bold">${appName}</h1>
          <p style="margin:0;color:#e0f2fe;font-size:14px">Nhắc nhở cho bạn đúng lúc</p>
        </div>

        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px;color:#1f2937;font-size:22px;font-weight:bold">${reminder.title}</h2>
          <p style="margin:0 0 12px;color:#4b5563;font-size:16px">Xin chào <strong>${displayName}</strong>,</p>
          <div style="margin:0 0 10px;padding:12px 14px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px">
            <p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.04em">Nội dung nhắc nhở</p>
            <p style="margin:0;color:#4b5563;font-size:16px">${reminder.message}</p>
          </div>
          <p style="margin:0 0 16px;color:#6b7280;font-size:14px">Thời gian nhắc: <strong>${scheduleLabel}</strong></p>
          <div style="text-align:center;margin:32px 0">
            <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:16px">Mở ứng dụng</a>
          </div>
          <p style="margin:16px 0 0;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;font-size:13px">Bạn có thể xem lại và quản lý toàn bộ nhắc nhở trong ứng dụng.</p>
        </div>
        <div style="display:none;opacity:0;font-size:0px;line-height:0;color:#ffffff;">${Date.now()}</div>
      </div>
    `;

    return this.sendEmail(user.email, subject, text, html, attachments);
  }
}
