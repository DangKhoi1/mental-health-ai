#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
#  Mental Health AI — Deploy Script
#  Sử dụng: ./deploy.sh [--seed] [--build] [--down]
# ══════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SEED=false
BUILD=false
DOWN=false

for arg in "$@"; do
  case $arg in
    --seed)  SEED=true ;;
    --build) BUILD=true ;;
    --down)  DOWN=true ;;
  esac
done

# ── Kiểm tra file .env ────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  log_error "Không tìm thấy file .env!"
  log_warn  "Hãy chạy: cp .env.example .env  rồi điền thông tin thực."
  exit 1
fi

# ── Kiểm tra Docker ───────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  log_error "Docker chưa được cài đặt!"
  exit 1
fi

if ! command -v docker compose &> /dev/null; then
  log_error "Docker Compose chưa được cài đặt (cần v2+)!"
  exit 1
fi

# ── Down (nếu yêu cầu) ───────────────────────────────────────────────────────
if $DOWN; then
  log_warn "Dừng và xóa toàn bộ containers..."
  docker compose down -v
  log_ok "Đã xóa xong."
  exit 0
fi

# ── Build images ──────────────────────────────────────────────────────────────
if $BUILD; then
  log_info "Đang build Docker images (có thể mất vài phút)..."
  docker compose build --no-cache
  log_ok "Build xong!"
fi

# ── Start services ────────────────────────────────────────────────────────────
log_info "Khởi động các services..."
docker compose up -d

# ── Chờ postgres healthy ──────────────────────────────────────────────────────
log_info "Chờ PostgreSQL sẵn sàng..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" -q 2>/dev/null; then
    log_ok "PostgreSQL đã sẵn sàng!"
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

# ── Chạy seed (nếu yêu cầu) ──────────────────────────────────────────────────
if $SEED; then
  log_info "Đang chạy database seed..."
  docker compose exec -T backend npm run seed:prod
  log_ok "Seed xong!"
fi

# ── Kiểm tra trạng thái ───────────────────────────────────────────────────────
echo ""
log_info "Trạng thái các services:"
docker compose ps

echo ""
log_ok "═══════════════════════════════════════════"
log_ok " Deploy thành công!"
log_ok "═══════════════════════════════════════════"
echo -e " Frontend : ${GREEN}http://localhost${NC}"
echo -e " Admin    : ${GREEN}http://localhost/admin${NC}"
echo -e " API      : ${GREEN}http://localhost/api/v1${NC}"
echo ""
