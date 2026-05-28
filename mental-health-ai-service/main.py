import os
import uvicorn


if __name__ == '__main__':
    is_dev = os.getenv('APP_ENV', 'production').lower() == 'development'
    uvicorn.run(
        'app.main:app',
        host='0.0.0.0',
        port=int(os.getenv('PORT', '5001')),
        reload=is_dev,
        workers=1 if is_dev else int(os.getenv('WORKERS', '2')),
    )
