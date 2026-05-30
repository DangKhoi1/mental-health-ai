import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  // ── Railway: dùng DATABASE_URL (connection string tự động từ Railway Plugin) ──
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
      // DB_SYNC=true cho lần deploy đầu tiên, sau đó tắt đi
      synchronize: configService.get<string>('DB_SYNC') === 'true',
      ssl:
        configService.get<string>('DB_SSL') !== 'false'
          ? { rejectUnauthorized: false }
          : false,
      logging: false,
    };
  }

  // ── Fallback: Docker Compose / Local dev ──────────────────────────────────
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_DATABASE', 'mental_health_db'),
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    // OLD: synchronize: configService.get<string>('NODE_ENV') !== 'production',
    // NEW: dùng DB_SYNC để kiểm soát rõ ràng hơn
    synchronize: configService.get<string>('DB_SYNC') === 'true',
    logging: false,
  };
};
