import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from '../assessment/entities/assessment-session.entity';
import { SessionStatus } from '../assessment/enums/session-status.enum';
import { Journal } from '../journal/entities/journal.entity';
import { Resource } from '../resource/entities/resource.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AssessmentSession)
    private readonly assessmentSessionRepository: Repository<AssessmentSession>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
  ) {}

  private async buildOverviewReport() {
    const [
      totalUsers,
      activeUsers,
      completedAssessments,
      totalResources,
      totalJournals,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.assessmentSessionRepository.count({
        where: { status: SessionStatus.COMPLETED },
      }),
      this.resourceRepository.count(),
      this.journalRepository.count(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      totalUsers,
      activeUsers,
      completedAssessments,
      totalResources,
      totalJournals,
    };
  }

  private escapePdfText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private buildOverviewPdfBuffer(report: {
    generatedAt: string;
    totalUsers: number;
    activeUsers: number;
    completedAssessments: number;
    totalResources: number;
    totalJournals: number;
  }): Buffer {
    const lines = [
      'Overview Report',
      `Generated At: ${report.generatedAt}`,
      `Total Users: ${report.totalUsers}`,
      `Active Users: ${report.activeUsers}`,
      `Completed Assessments: ${report.completedAssessments}`,
      `Total Resources: ${report.totalResources}`,
      `Total Journals: ${report.totalJournals}`,
    ];

    let cursorY = 790;
    const commands: string[] = [];

    commands.push('BT');
    commands.push('/F1 18 Tf');
    commands.push(`50 ${cursorY} Td`);
    commands.push(`(${this.escapePdfText(lines[0])}) Tj`);
    commands.push('ET');

    cursorY -= 36;
    for (let index = 1; index < lines.length; index += 1) {
      commands.push('BT');
      commands.push('/F1 12 Tf');
      commands.push(`50 ${cursorY} Td`);
      commands.push(`(${this.escapePdfText(lines[index])}) Tj`);
      commands.push('ET');
      cursorY -= 22;
    }

    const stream = commands.join('\n');
    const streamLength = Buffer.byteLength(stream, 'utf8');

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];

    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += object;
    }

    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    const xrefRows = offsets
      .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `)
      .join('\n');

    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefRows}\n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
  }

  async getOverview() {
    try {
      const report = await this.buildOverviewReport();

      return {
        EC: 1,
        EM: 'Get overview report successfully',
        report,
      };
    } catch (error) {
      console.error('Error in getOverviewReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error generating overview report',
      });
    }
  }

  async exportOverview(format?: string) {
    try {
      const normalizedFormat =
        format === 'json' || format === 'pdf' ? format : 'csv';
      const report = await this.buildOverviewReport();
      const fileDate = report.generatedAt.slice(0, 10);

      if (normalizedFormat === 'json') {
        return {
          EC: 1,
          EM: 'Export overview report successfully',
          filename: `overview-report-${fileDate}.json`,
          mimeType: 'application/json',
          content: JSON.stringify(report, null, 2),
        };
      }

      if (normalizedFormat === 'pdf') {
        const pdfBuffer = this.buildOverviewPdfBuffer(report);

        return {
          EC: 1,
          EM: 'Export overview report successfully',
          filename: `overview-report-${fileDate}.pdf`,
          mimeType: 'application/pdf',
          isBase64: true,
          content: pdfBuffer.toString('base64'),
        };
      }

      const rows = [
        ['Metric', 'Value'],
        ['Generated At', report.generatedAt],
        ['Total Users', report.totalUsers],
        ['Active Users', report.activeUsers],
        ['Completed Assessments', report.completedAssessments],
        ['Total Resources', report.totalResources],
        ['Total Journals', report.totalJournals],
      ];

      return {
        EC: 1,
        EM: 'Export overview report successfully',
        filename: `overview-report-${fileDate}.csv`,
        mimeType: 'text/csv;charset=utf-8',
        content: rows.map((row) => row.join(',')).join('\n'),
      };
    } catch (error) {
      console.error('Error in exportOverviewReport:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error exporting overview report',
      });
    }
  }
}
