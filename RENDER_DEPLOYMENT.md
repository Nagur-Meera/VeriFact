# 🚀 Render Deployment Guide for VeriFact

## Prerequisites Complete ✅
- [x] Project cleaned and optimized
- [x] Build tested and working
- [x] Git repository initialized
- [x] Environment variables configured for Render
- [x] README.md updated with comprehensive documentation

## Quick Deployment Steps

### 1. Create GitHub Repository
```bash
# If you haven't already, create a new repository on GitHub
# Then push your code:
git remote add origin https://github.com/YOUR_USERNAME/verifact.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Render
1. **Go to [render.com](https://render.com)** and sign up/login
2. **Connect GitHub** - Link your GitHub account
3. **Create New Web Service** - Click "New +" → "Web Service"
4. **Connect Repository** - Select your `verifact` repository
5. **Configure Service:**
   ```
   Name: verifact
   Region: Oregon (US West)
   Branch: main
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

### 3. Set Environment Variables in Render Dashboard
Go to your service → Environment tab and add:

```bash
GEMINI_API_KEY=AIzaSyCz-Ub1LlvIlc2L8Iqrt79e7KEWTsM6dKA
NEWS_API_KEY=682aad31c6d2454381336b41c0e5711a
PINECONE_API_KEY=pcsk_2dpRRM_JvsKYKuXFsPE6deQVbmhz2NkgcmFDvWaYFTdHnSup5s1psmEZuCe4xRhS1W5HYR
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=verifact-factcheck-index
REDIS_HOST=redis-13365.c244.us-east-1-2.ec2.redns.redis-cloud.com
REDIS_PORT=13365
REDIS_USERNAME=default
REDIS_PASSWORD=rIsmFdQ7vRuhDn3T1U7L9XKV6ZuC9Vz7
MONGODB_URI=mongodb+srv://root:1234567890@cluster0.2ohq5.mongodb.net/news-factcheck?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
PORT=10000
```

### 4. Deploy and Monitor
1. **Click "Create Web Service"** - Render will start building
2. **Monitor Build Logs** - Check for any errors
3. **Wait for Deployment** - Usually takes 5-10 minutes
4. **Test Your App** - Visit the provided Render URL

## Expected Build Output
```
==> Building...
==> Installing dependencies
==> Building frontend (npm run build)
==> Starting server (npm start)
==> Health check passed (/api/health)
==> Deployment successful!
```

## Post-Deployment Checklist
- [ ] Visit your Render URL and verify the app loads
- [ ] Test fact-checking functionality
- [ ] Check WebSocket real-time updates
- [ ] Verify all API endpoints work
- [ ] Test analytics dashboard
- [ ] Check mobile responsiveness

## Render Service Configuration
The `render.yaml` file is already configured for optimal deployment:

```yaml
services:
  - type: web
    name: verifact
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## Troubleshooting

### Build Fails
- Check if all dependencies are in package.json
- Verify Node.js version compatibility
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure all variables are set in Render dashboard
- No quotes around values in Render UI
- Restart service after adding variables

### WebSocket Connection Issues
- Verify VITE_API_URL points to your Render domain
- Check that all services (Redis, MongoDB, Pinecone) are accessible
- Monitor server logs for connection errors

### Database Connection Errors
- Whitelist Render's IP ranges in MongoDB Atlas
- Verify connection strings are correct
- Check if Redis Cloud allows connections from Render

## Performance Optimization
- **Free Tier Limitations**: Service sleeps after 15 minutes of inactivity
- **Spin-up Time**: First request after sleep takes ~30 seconds
- **Upgrade Options**: Paid plans for always-on service

## Success Indicators
✅ **Build Status**: "Build successful"
✅ **Health Check**: Green checkmark on `/api/health`
✅ **WebSocket**: Real-time updates working
✅ **AI Services**: Fact-checking responses
✅ **Caching**: Fast response times
✅ **Analytics**: Dashboard showing data

## Next Steps After Deployment
1. **Custom Domain** (optional): Add your own domain in Render
2. **Monitoring**: Set up alerts for service health
3. **SSL Certificate**: Automatically provided by Render
4. **Auto-Deploy**: Pushes to main branch auto-deploy

## Support Resources
- **Render Docs**: https://render.com/docs
- **Build Logs**: Available in Render dashboard
- **Service Logs**: Monitor real-time in dashboard
- **Community**: Render community forum for help

---

**🎉 Your VeriFact application will be live at: `https://verifact.onrender.com`**

The deployment is fully automated - just push to GitHub and Render handles the rest!
