#!/bin/bash

echo "🚀 VeriFact Deployment Options"
echo "=============================="

echo "Available platforms:"
echo "1. Render (Recommended)"
echo "2. Fly.io" 
echo "3. Heroku"
echo "4. Vercel + Railway combo"

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo "📦 Deploying to Render..."
        echo "Steps:"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Use the render.yaml file for configuration"
        echo "4. Set environment variables in Render dashboard"
        echo ""
        echo "Environment variables needed:"
        cat .env | grep -E "(GEMINI|NEWS|PINECONE|REDIS|MONGODB)" | sed 's/^/  - /'
        ;;
    2)
        echo "🪁 Preparing for Fly.io..."
        if command -v flyctl &> /dev/null; then
            echo "Fly CLI found, deploying..."
            flyctl launch --no-deploy
            echo "Set environment variables:"
            echo "flyctl secrets set GEMINI_API_KEY=your_key"
            echo "Then run: flyctl deploy"
        else
            echo "Install Fly CLI first:"
            echo "curl -L https://fly.io/install.sh | sh"
        fi
        ;;
    3)
        echo "🔮 Preparing for Heroku..."
        if command -v heroku &> /dev/null; then
            echo "Creating Heroku app..."
            heroku create verifact-app
            echo "Setting buildpack..."
            heroku buildpacks:set heroku/nodejs
            echo "Deploy with: git push heroku main"
        else
            echo "Install Heroku CLI first:"
            echo "https://devcenter.heroku.com/articles/heroku-cli"
        fi
        ;;
    4)
        echo "🔄 Vercel + Railway combo..."
        echo "Frontend: Deploy to Vercel"
        echo "Backend: Keep on Railway"
        echo "Update VITE_API_URL to point to Railway backend"
        ;;
    *)
        echo "Invalid option"
        ;;
esac
