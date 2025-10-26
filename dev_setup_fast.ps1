<#
=============================================================================
 🚀 SmartDoc Enterprise - Fast Developer Bootstrap (v2.6 Lite)
 Author: Sagar Thapa
 Purpose: Quick-start for daily use. Keeps caches & avoids heavy re-installs.
=============================================================================
#>

Write-Host "`n⚡ SmartDoc Fast Developer Bootstrap Starting..." -ForegroundColor Cyan

# --- Environment prep -------------------------------------------------------
$env:PYTHONUTF8 = 1
[System.Environment]::SetEnvironmentVariable("PYTHONUTF8", "1", "User")

Write-Host "`n🔍 Checking essentials..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python missing!" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git missing!" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Pip missing!" -ForegroundColor Red
    exit 1
}

# --- Install pre-commit (only if needed) -----------------------------------
if (-not (Get-Command pre-commit -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing pre-commit..." -ForegroundColor Yellow
    pip install pre-commit -q
    Write-Host "✅ pre-commit installed" -ForegroundColor Green
}

# --- Ensure hooks (but skip reinitialization) -------------------------------
Write-Host "`n⚙️ Ensuring pre-commit hooks are installed..." -ForegroundColor Yellow
pre-commit install --overwrite | Out-Null
Write-Host "✅ Hooks ready" -ForegroundColor Green

# --- Fast lint & format -----------------------------------------------------
Write-Host "`n🧩 Running SmartDoc checks (cached)..." -ForegroundColor Yellow
pre-commit run --all-files --show-diff-on-failure --color always

# --- Optional backend dependency sync (only once) --------------------------
if ((Test-Path ".\backend\requirements.txt") -and (-not (Test-Path ".venv"))) {
    Write-Host "`n📦 Installing backend dependencies (one-time)..." -ForegroundColor Yellow
    pip install -r .\backend\requirements.txt --quiet
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

Write-Host "`n✅ Fast setup complete. You're ready to code!" -ForegroundColor Green
Write-Host "👉 Use 'fix' to format + lint all files." -ForegroundColor Cyan
Write-Host "👉 Use 'smartpush' to format, commit & push automatically." -ForegroundColor Cyan
