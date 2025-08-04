# VeriFact Deployment Options (PowerShell)
Write-Host "🚀 VeriFact Deployment Options" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

Write-Host ""
Write-Host "Available platforms:" -ForegroundColor Cyan
Write-Host "1. Render (Recommended) - Full-stack with WebSocket support"
Write-Host "2. Fly.io - Docker-based with global edge"
Write-Host "3. Heroku - Classic PaaS with dynos"
Write-Host "4. Vercel + Railway combo - Keep backend on Railway"
Write-Host "5. Netlify + Serverless functions"

$choice = Read-Host "Choose deployment option (1-5)"

switch ($choice) {
    1 {
        Write-Host "📦 Deploying to Render..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to https://render.com"
        Write-Host "2. Connect your GitHub repository"
        Write-Host "3. Create a new Web Service"
        Write-Host "4. Use these settings:"
        Write-Host "   - Build Command: npm install && npm run build"
        Write-Host "   - Start Command: npm run server"
        Write-Host "   - Environment: Node"
        Write-Host ""
        Write-Host "Environment variables needed:" -ForegroundColor Magenta
        Get-Content .env | Select-String -Pattern "(GEMINI|NEWS|PINECONE|REDIS|MONGODB)" | ForEach-Object { Write-Host "  - $_" }
        Write-Host ""
        Write-Host "✅ render.yaml file created for easy deployment"
    }
    2 {
        Write-Host "🪁 Preparing for Fly.io..." -ForegroundColor Yellow
        if (Get-Command flyctl -ErrorAction SilentlyContinue) {
            Write-Host "Fly CLI found, initializing..."
            flyctl launch --no-deploy
            Write-Host "Set environment variables:"
            Write-Host "flyctl secrets set GEMINI_API_KEY=your_key"
            Write-Host "Then run: flyctl deploy"
        } else {
            Write-Host "Install Fly CLI first:" -ForegroundColor Red
            Write-Host "Download from: https://fly.io/docs/flyctl/install/"
        }
    }
    3 {
        Write-Host "🔮 Preparing for Heroku..." -ForegroundColor Yellow
        if (Get-Command heroku -ErrorAction SilentlyContinue) {
            Write-Host "Creating Heroku app..."
            heroku create verifact-app
            Write-Host "Setting buildpack..."
            heroku buildpacks:set heroku/nodejs
            Write-Host "Deploy with: git push heroku main"
        } else {
            Write-Host "Install Heroku CLI first:" -ForegroundColor Red
            Write-Host "https://devcenter.heroku.com/articles/heroku-cli"
        }
    }
    4 {
        Write-Host "🔄 Vercel + Railway combo..." -ForegroundColor Yellow
        Write-Host "Frontend: Deploy to Vercel (excellent for React)"
        Write-Host "Backend: Keep on Railway (working well)"
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Install Vercel CLI: npm i -g vercel"
        Write-Host "2. Run: vercel --prod"
        Write-Host "3. Your backend stays on Railway"
        Write-Host "4. Update VITE_API_URL to Railway URL"
    }
    5 {
        Write-Host "🌐 Netlify + Serverless..." -ForegroundColor Yellow
        Write-Host "Frontend: Netlify static hosting"
        Write-Host "Backend: Netlify Functions (serverless)"
        Write-Host ""
        Write-Host "Steps:" -ForegroundColor Cyan
        Write-Host "1. Install Netlify CLI: npm i -g netlify-cli"
        Write-Host "2. Run: netlify init"
        Write-Host "3. Deploy: netlify deploy --prod"
    }
    default {
        Write-Host "Invalid option" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Recommendation:" -ForegroundColor Green
Write-Host "For VeriFact with WebSocket support, Render is the best free option."
Write-Host "It provides true full-stack hosting without the limitations of serverless platforms."
