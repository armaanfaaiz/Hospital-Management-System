# 🚀 Deployment Guide - Vercel

## Prerequisites
- GitHub account (already set up ✓)
- Vercel account (free at vercel.com)
- PostgreSQL database URL

## Step 1: Ensure Code is Pushed to GitHub

```bash
# Check status
git status

# If there are changes, commit them:
git add .
git commit -m "Add Hospital Management System with dummy data"

# Push to GitHub
git push origin main
```

## Step 2: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub repositories

## Step 3: Import Project to Vercel
1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Search for "Hospital-Management-System"
5. Click "Import"

## Step 4: Configure Environment Variables
In the Vercel project settings:

1. Go to "Settings" → "Environment Variables"
2. Add:
   ```
   DATABASE_URL = your_postgresql_url
   JWT_SECRET = your_long_random_secret
   ```

3. Get your PostgreSQL URL from:
   - Neon: https://neon.tech
   - Supabase: https://supabase.com
   - AWS RDS: https://aws.amazon.com/rds/

## Step 5: Deploy
1. Click "Deploy"
2. Vercel automatically builds and deploys
3. Your app will be live at `your-app.vercel.app`

## Post-Deployment

### Add Seed Data
```bash
# From your local machine, once deployed:
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "YourSecurePassword123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Access Your App
- Frontend: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api`

## Troubleshooting

**Deployment fails with "Cannot find module"**
→ Run `npm install` locally, then push again

**Database connection error**
→ Check DATABASE_URL in Vercel Environment Variables

**"port already in use"**
→ Vercel doesn't require explicit port binding; remove PORT env var

## Additional Deployment Options

### Option A: Docker (Recommended for complex setups)
```bash
docker build -t hospital-management .
docker run -p 3000:3000 \
  -e DATABASE_URL="your_db_url" \
  hospital-management
```

### Option B: Railway.app
1. Go to https://railway.app
2. Connect GitHub
3. Select repository
4. Add PostgreSQL plugin
5. Deploy

### Option C: Render.com
1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub
4. Add environment variables
5. Deploy

## Continuous Deployment

Once deployed, Vercel automatically redeploys on:
- Push to main branch
- Pull request (preview deployment)

## Monitoring

Track deployments at:
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Actions: Your repo → Actions tab
- Application logs: Vercel → Deployments → Logs

## Performance Tips

1. **Use Serverless Functions**: Vercel optimizes Node.js automatically
2. **Database Connection Pooling**: Enabled in vercel.json
3. **CDN**: Static assets cached globally
4. **Edge Functions**: For API optimization (optional upgrade)

## FAQ

**Q: Can I use free tier?**
A: Yes! Free tier includes:
- Unlimited deployments
- Automatic HTTPS
- Global CDN
- Paid $20+ for additional features

**Q: How do I add custom domain?**
A: Vercel → Project Settings → Domains → Add domain

**Q: Can I rollback to previous version?**
A: Yes, Vercel → Deployments → Select version → Redeploy

---

**Ready to deploy? Follow steps 1-5 above!**
