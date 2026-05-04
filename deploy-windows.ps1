# One-step deploy script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File deploy-windows.ps1

Write-Host "Tigeri Dashboard deployment helper" -ForegroundColor Cyan
Write-Host ""

# Check git is installed
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "ERROR: git is not installed." -ForegroundColor Red
    Write-Host "Install Git for Windows from https://git-scm.com/download/win"
    exit 1
}

# Check we're in the right folder
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in current folder." -ForegroundColor Red
    Write-Host "Make sure you are running this from inside the unzipped tigeri-dashboard folder."
    exit 1
}

# Get repo URL from user
Write-Host "Enter your empty GitHub repo URL"
Write-Host "(e.g. https://github.com/russo-source/tigeri.ai.git)"
$repoUrl = Read-Host "Repo URL"

if (-not $repoUrl) {
    Write-Host "ERROR: No URL provided." -ForegroundColor Red
    exit 1
}

# Initialize and push
Write-Host ""
Write-Host "Initializing git repo..." -ForegroundColor Yellow
git init -b main
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Adding all files..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "Initial deploy"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Adding remote..." -ForegroundColor Yellow
git remote add origin $repoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote may already exist, trying to update..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. Common reasons:" -ForegroundColor Red
    Write-Host "  1. Repo is not empty - delete and recreate it without README/LICENSE"
    Write-Host "  2. Authentication needed - GitHub may open a browser for login"
    Write-Host "  3. Wrong URL"
    exit 1
}

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Your project is on GitHub. Vercel should now auto-deploy."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Go to vercel.com/new and import the repo"
Write-Host "  2. Set environment variables (see README.md)"
Write-Host "  3. Deploy"
