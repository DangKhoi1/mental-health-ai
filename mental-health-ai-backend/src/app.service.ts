import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {
      status: 'success',
      message: 'Mental Health AI Backend API is running successfully!',
      timestamp: new Date().toISOString(),
    };
  }
}
