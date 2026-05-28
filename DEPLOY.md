# 🚀 Hướng dẫn Deploy — Mental Health AI

## Kiến trúc hệ thống

```
                    ┌─────────────────────────────────┐
                    │         Nginx (port 80)          │
                    │      Reverse Proxy / Gateway     │
                    └──────┬──────────┬────────┬──────┘
                           │          │        │
              /api, /socket│    /     │ /admin │
                           ▼          ▼        ▼
                    ┌──────────┐ ┌────────┐ ┌───────┐
                    │ Backend  │ │Frontend│ │ Admin │
                    │ NestJS   │ │Next.js │ │Next.js│
                    │ :8080    │ │ :3000  │ │ :5173 │
                    └──────┬───┘ └────────┘ └───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌────────────┐          ┌──────────────┐
       │ PostgreSQL │          │  AI Service  │
       │   :5432    │          │ FastAPI:5001 │
       └────────────┘          └──────────────┘
```

## Yêu cầu hệ thống

- Docker Engine 24+
- Docker Compose v2+
- RAM: tối thiểu 2GB
- Disk: tối thiểu 5GB

## Bước 1: Chuẩn bị môi trường

```bash
# Clone repo
git clone <repo-url>
cd mental-health-ai

# Tạo file .env từ template
cp .env.example .env
```

Mở file `.env` và điền đầy đủ các giá trị:

| Biến | Mô tả | Quan trọng |
|------|-------|------------|
| `POSTGRES_PASSWORD` | Mật khẩu DB | ⚠️ Đổi giá trị mạnh |
| `JWT_SECRET` | Khóa ký JWT | ⚠️ Chuỗi random ≥64 ký tự |
| `OPENAI_API_KEY` | API key OpenAI | ✅ Đã có |
| `CLOUDINARY_*` | Cloudinary credentials | ✅ Đã có |
| `GOOGLE_CLIENT_*` | Google OAuth | ✅ Đã có |
| `GOOGLE_CALLBACK_URL` | **Đổi localhost → domain thực** | ⚠️ |
| `ALLOWED_ORIGINS` | Domains cho phép gọi API | ⚠️ |
| `NEXT_PUBLIC_API_URL` | **Đổi localhost → domain thực** | ⚠️ |

## Bước 2: Tạo JWT Secret mạnh

```bash
# Tạo secret ngẫu nhiên 64 chars
openssl rand -base64 64
```

## Bước 3: Deploy lần đầu (có seed database)

```bash
# Build images + start + seed dữ liệu mẫu
chmod +x deploy.sh
./deploy.sh --build --seed
```

## Bước 4: Deploy cập nhật (không seed lại)

```bash
# Linux/Mac
./deploy.sh --build

# Windows PowerShell
.\deploy.ps1 -Build
```

## Chạy ở môi trường Development (local)

Dùng `docker-compose.dev.yml` để expose tất cả ports và không cần nginx:

```bash
# Linux/Mac
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Windows PowerShell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Sau đó truy cập trực tiếp:
- Frontend: http://localhost:3000
- Admin: http://localhost:5173
- Backend API: http://localhost:8080/api/v1
- AI Service: http://localhost:5001/docs
- PostgreSQL: localhost:5432 (dùng pgAdmin/DBeaver)

## Các lệnh hữu ích

```bash
# Xem logs tất cả services
docker compose logs -f

# Xem logs service cụ thể
docker compose logs -f backend
docker compose logs -f ai-service

# Khởi động lại một service
docker compose restart backend

# Vào shell của container
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d mental_health_db

# Dừng toàn bộ (giữ data)
docker compose stop

# Xóa toàn bộ kể cả data (NGUY HIỂM!)
./deploy.sh --down
```

## Cấu hình Google OAuth (Bắt buộc cho production)

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials → OAuth Client
3. Thêm Authorized redirect URI: `https://YOUR_DOMAIN/api/v1/auth/google/callback`
4. Cập nhật `GOOGLE_CALLBACK_URL` trong `.env`

## Cấu hình HTTPS (Khuyến nghị)

Thêm Certbot/Let's Encrypt hoặc dùng Cloudflare Proxy. Cập nhật `nginx.conf` để thêm SSL:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;
    # ... rest of config
}
```

## Ports mặc định

| Service | Port nội bộ | Port expose |
|---------|-------------|-------------|
| Nginx | 80 | **80 (public)** |
| Frontend | 3000 | Chỉ qua Nginx |
| Admin | 5173 | Chỉ qua Nginx |
| Backend | 8080 | Chỉ qua Nginx |
| AI Service | 5001 | Chỉ nội bộ |
| PostgreSQL | 5432 | Chỉ nội bộ |

## Troubleshooting

**Backend không connect được DB:**
```bash
docker compose logs postgres
docker compose restart backend
```

**Frontend build lỗi (NEXT_PUBLIC_API_URL):**
> Biến `NEXT_PUBLIC_*` phải có lúc build image. Nếu đổi domain phải `--build` lại.

**AI Service không phản hồi:**
```bash
docker compose logs ai-service
# Kiểm tra OPENAI_API_KEY có đúng không
```
