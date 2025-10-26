<#
=============================================================================
 🧠 SmartDoc Enterprise - Developer Setup Script v2.6
 Author: Sagar Thapa
 Purpose: Fully automate development environment, linting, hooks & deployment
=============================================================================
#>

Write-Host "`n🚀 SmartDoc Enterprise Development Environment Setup Starting..." -ForegroundColor Cyan

# --- UTF-8 & cache cleaning -------------------------------------------------
Write-Host "`n🧩 Ensuring UTF-8 encoding and clean pre-commit environment..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable("PYTHONUTF8", "1", "User")
$env:PYTHONUTF8 = 1

Write-Host "🧹 Clearing stale pre-commit cache..." -ForegroundColor Yellow
pre-commit clean 2>$null
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\pre-commit" -ErrorAction SilentlyContinue

# --- Registry patch for Python 3.12 virtualenv lookups ---------------------
Write-Host "`n🔧 Patching Windows registry for Python 3.12 virtualenv mapping..." -ForegroundColor Yellow
$pythonRoot = "$($env:LOCALAPPDATA)\Programs\Python\Python313\"
reg add "HKLM\SOFTWARE\Python\PythonCore\3.12\InstallPath" /ve /t REG_SZ /d $pythonRoot /f | Out-Null
Write-Host "✅ Registry patched: python3.12 → Python 3.13" -ForegroundColor Green

# --- Git network reliability tuning ----------------------------------------
Write-Host "`n🌐 Configuring Git for reliable HTTPS fetch..." -ForegroundColor Yellow
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
git config --global http.retry 5
Write-Host "✅ Git network settings applied" -ForegroundColor Green

# --- Basic checks -----------------------------------------------------------
Write-Host "`n🔍 Checking Python installation..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Install Python 3.11+ first." -ForegroundColor Red
    exit 1
} else {
    $pythonVersion = python --version
    Write-Host "✅ Found $pythonVersion" -ForegroundColor Green
}

Write-Host "🔍 Checking Git installation..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
} else {
    $gitVersion = git --version
    Write-Host "✅ Found $gitVersion" -ForegroundColor Green
}

Write-Host "🔍 Checking pip..." -ForegroundColor Yellow
if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pip not found. Ensure Python is installed with pip." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ pip is available" -ForegroundColor Green
}

# --- Pre-commit setup -------------------------------------------------------
Write-Host "`n📦 Installing pre-commit and dev tools..." -ForegroundColor Yellow
pip install pre-commit black isort flake8 bandit mypy -q
Write-Host "✅ pre-commit and dev tools installed" -ForegroundColor Green

# Ensure .pre-commit-config.yaml
if (-not (Test-Path ".pre-commit-config.yaml")) {
    Write-Host "⚠️  No .pre-commit-config.yaml found — creating one..." -ForegroundColor Yellow
    @"
repos:
  - repo: https://github.com/psf/black
    rev: 25.9.0
    hooks:
      - id: black
"@ | Out-File ".pre-commit-config.yaml" -Encoding utf8
    Write-Host "✅ Default .pre-commit-config.yaml created" -ForegroundColor Green
} else {
    Write-Host "✅ .pre-commit-config.yaml found" -ForegroundColor Green
}

# Install hooks with retry mechanism
Write-Host "`n⚙️ Installing git hooks (with retry)..." -ForegroundColor Yellow
for ($i = 1; $i -le 3; $i++) {
    try {
        python -X utf8 -m pre_commit install --overwrite
        python -X utf8 -m pre_commit autoupdate
        Write-Host "✅ Pre-commit hooks installed successfully" -ForegroundColor Green
        break
    } catch {
        Write-Host "⚠️ Attempt $i failed to fetch some hooks... retrying in 5s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

# --- Add aliases ------------------------------------------------------------
Write-Host "`n🛠️ Adding 'fix' and 'smartpush' aliases..." -ForegroundColor Yellow
$profilePath = $PROFILE
if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$functionFix = "function Fix-Code { python -X utf8 -m pre_commit run --all-files }"
$aliasFix = "Set-Alias -Name fix -Value Fix-Code"
$functionPush = "function Smart-Push { python -X utf8 -m pre_commit run --all-files; git add .; git commit -m 'chore: auto-formatted by pre-commit'; git push origin main }"
$aliasPush = "Set-Alias -Name smartpush -Value Smart-Push"

# Clean up and add aliases
(Get-Content $profilePath) | Where-Object { $_ -notmatch "Fix-Code|Smart-Push|Set-Alias.*fix|Set-Alias.*smartpush" } | Set-Content $profilePath
Add-Content $profilePath "`n# SmartDoc Development Aliases"
Add-Content $profilePath $functionFix
Add-Content $profilePath $aliasFix
Add-Content $profilePath $functionPush
Add-Content $profilePath $aliasPush

Write-Host "✅ Aliases added. Run '. `$PROFILE' or restart PowerShell to activate." -ForegroundColor Yellow

# --- Run checks -------------------------------------------------------------
Write-Host "`n🧪 Running initial pre-commit check..." -ForegroundColor Yellow
python -X utf8 -m pre_commit run --all-files

# --- Sync backend dependencies ---------------------------------------------
Write-Host "`n🔧 Syncing backend dependencies..." -ForegroundColor Yellow
if (Test-Path ".\backend\requirements.txt") {
    pip install -r .\backend\requirements.txt --prefer-binary --quiet
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}
if (Test-Path ".\backend\requirements-dev.txt") {
    pip install -r .\backend\requirements-dev.txt --prefer-binary --quiet
    Write-Host "✅ Dev dependencies installed" -ForegroundColor Green
}

# --- Run verification -------------------------------------------------------
if (Test-Path ".\backend\verify_stack.py") {
    Write-Host "`n🔍 Running SmartDoc stack verification..." -ForegroundColor Cyan
    python -X utf8 .\backend\verify_stack.py
    Write-Host "✨ Stack verification complete." -ForegroundColor Green
}

# --- Commit & push prompt ---------------------------------------------------
$answer = Read-Host "`n⚠️ Do you want to push changes to GitHub and trigger deployment? (Y/N)"
if ($answer -match '^[Yy]$') {
    Write-Host "`n📤 Committing and pushing changes (Render & Vercel will redeploy)..." -ForegroundColor Yellow
    git add .
    git commit -m "auto: dev_setup sync & verified"
    git push origin main
    Write-Host "🚀 Code pushed! Render and Vercel will rebuild automatically." -ForegroundColor Green
} else {
    Write-Host "❌ Push aborted by user." -ForegroundColor Red
}

Write-Host "`n🎉 Setup Complete!"
Write-Host "👉 Use 'fix' to format + lint all files."
Write-Host "👉 Use 'smartpush' to format, commit, and push automatically." -ForegroundColor Cyan
