# VeriFact Deployment Script for Railway (PowerShell)
Write-Host "VeriFact Railway Deployment" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Instructions for manual deployment
Write-Host ""
Write-Host "Manual Deployment Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://railway.app/dashboard"
Write-Host "2. Find your VeriFact project"
Write-Host "3. Go to the 'Deployments' tab"
Write-Host "4. Click 'Deploy from GitHub' or upload the dist folder"
Write-Host "5. Set environment variables in Railway dashboard:"
Write-Host "   - VITE_API_URL=https://verifact-production.up.railway.app"
Write-Host ""
Write-Host "Or use Railway CLI after linking the project:" -ForegroundColor Cyan
Write-Host "   railway link"
Write-Host "   railway deploy"
Write-Host ""
Write-Host "Project URL: https://verifact-production.up.railway.app" -ForegroundColor Green

# Instructions for environment variable fix
Write-Host ""
Write-Host "Environment Variable Configuration:" -ForegroundColor Magenta
Write-Host "- The build now includes proper environment variable handling"
Write-Host "- VITE_API_URL is configured to fallback to Railway URL in production"
Write-Host "- WebSocket connections will now use the correct Railway URL"
Write-Host "- Real-time updates should work after deployment"
