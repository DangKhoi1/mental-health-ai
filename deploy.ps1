param(
    [switch]$Seed,
    [switch]$Build,
    [switch]$Down
)

$ErrorActionPreference = "Stop"

function Info  { param($m) Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Ok    { param($m) Write-Host "[ OK ] $m" -ForegroundColor Green }
function Warn  { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Err   { param($m) Write-Host "[ERR ] $m" -ForegroundColor Red }

Write-Host "=================================================" -ForegroundColor Magenta
Write-Host "   Mental Health AI -- Deploy Script (Windows)  " -ForegroundColor Magenta
Write-Host "=================================================" -ForegroundColor Magenta
Write-Host ""

# Check .env
if (-not (Test-Path ".env")) {
    Err "Khong tim thay file .env!"
    Warn "Chay: Copy-Item .env.example .env"
    exit 1
}

# Check Docker
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Err "Docker chua chay! Mo Docker Desktop truoc."
    exit 1
}

Ok "Docker dang chay."

# Down
if ($Down) {
    Warn "Dung va xoa toan bo containers..."
    docker compose down -v
    Ok "Da xoa xong."
    exit 0
}

# Build
if ($Build) {
    Info "Dang build Docker images (lan dau mat 10-15 phut)..."
    docker compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Err "Build that bai! Xem log phia tren."
        exit 1
    }
    Ok "Build xong!"
}

# Start
Info "Khoi dong cac services..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Err "Khoi dong that bai!"
    exit 1
}
Ok "Da start tat ca services."

# Wait for postgres
Info "Cho PostgreSQL san sang..."
$waited = 0
$maxWait = 60
$pgReady = $false
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 3
    $waited += 3
    docker compose exec -T postgres pg_isready -q 2>$null
    if ($LASTEXITCODE -eq 0) {
        $pgReady = $true
        break
    }
    Write-Host "." -NoNewline
}
Write-Host ""

if (-not $pgReady) {
    Warn "PostgreSQL mat qua lau. Kiem tra: docker compose logs postgres"
} else {
    Ok "PostgreSQL san sang! (sau ${waited}s)"
}

# Seed
if ($Seed) {
    Info "Cho backend khoi dong (10s)..."
    Start-Sleep -Seconds 10
    Info "Dang chay database seed..."
    docker compose exec -T backend npm run seed:prod
    if ($LASTEXITCODE -ne 0) {
        Warn "Seed co loi. Kiem tra: docker compose logs backend"
    } else {
        Ok "Seed database xong!"
    }
}

# Status
Write-Host ""
Info "Trang thai cac services:"
docker compose ps

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "   Deploy thanh cong!                           " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Frontend : http://localhost" -ForegroundColor Cyan
Write-Host " Admin    : http://localhost/admin" -ForegroundColor Cyan
Write-Host " API      : http://localhost/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host " Xem logs: docker compose logs -f" -ForegroundColor Yellow
Write-Host ""
