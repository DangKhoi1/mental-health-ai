import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';
import { JwtAuthGuard, PermissionGuard } from './common/guards';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { runSeeds } from './database/seeds';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = app.get(Reflector);
  const permissionGuard = app.get(PermissionGuard);

  app.useGlobalGuards(new JwtAuthGuard(reflector), permissionGuard);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, ''))
    : [];

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      
      const originWithoutSlash = requestOrigin.trim().replace(/\/$/, '');
      const isAllowed =
        allowedOrigins.length === 0 ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(originWithoutSlash) ||
        /vercel\.app$/i.test(originWithoutSlash) ||
        /localhost(:\d+)?$/i.test(originWithoutSlash);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept,x-privacy-token,x-no-retry',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Auto-seed if database is empty
  try {
    const dataSource = app.get(DataSource);
    const result = await dataSource.query('SELECT COUNT(*) FROM roles');
    const count = parseInt(result[0]?.count || '0', 10);
    if (count === 0) {
      console.log('No roles found in database. Running seed script automatically...');
      await runSeeds(dataSource);
    }
  } catch (err) {
    console.warn('Auto-seeding check failed:', err);
  }

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
