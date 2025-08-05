# Deployment Guide: Render + Vercel

## 🚀 Current Architecture

- **Backend (Render)**: https://verifact-fiu4.onrender.com
- **Frontend (Vercel)**: To be deployed

## 📋 Deployment Steps

### Backend (Already Done ✅)
Your backend is already deployed and working on Render!

### Frontend (Deploy to Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy Frontend**:
   ```bash
   vercel --prod
   ```

4. **Environment Variables in Vercel**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add: `VITE_API_URL` = `https://verifact-fiu4.onrender.com`

## 🔧 Configuration Files Created

- `vercel.json` - Vercel deployment configuration
- `.env.vercel` - Environment variables template
- Updated CORS in backend to allow Vercel domains

## 🌟 Benefits of This Setup

1. **Performance**: Vercel's global CDN for fast frontend delivery
2. **Scalability**: Independent scaling for frontend and backend
3. **Reliability**: Separate deployments reduce single points of failure
4. **Cost**: Both platforms have generous free tiers
5. **Developer Experience**: Easy deployments and rollbacks

## 📝 Post-Deployment

After deploying to Vercel:
1. Update the CORS configuration with your actual Vercel domain
2. Test all features work across the split architecture
3. Monitor both services independently

## 🔗 URLs
- **Backend API**: https://verifact-fiu4.onrender.com
- **Frontend**: https://your-app.vercel.app (after deployment)
