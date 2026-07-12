# Deployment Guide - Vercel + Render

## Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)
- Gmail account (for email notifications)
- Twilio account (for SMS notifications - optional)

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Create a database user:
   - Username: `admin` (or your choice)
   - Password: Generate a strong password
5. Network Access: Add IP `0.0.0.0/0` (allows all IPs for development)
6. Get Connection String:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

## Step 2: Push Code to GitHub

1. Initialize git in the project root:
   ```bash
   git init
   ```

2. Create a `.gitignore` in project root:
   ```
   node_modules/
   .env
   .env.local
   .env.production
   dist/
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/last-mile-delivery.git
   git push -u origin main
   ```

## Step 3: Deploy Backend to Render

1. Go to [Render](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `last-mile-delivery-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

6. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a random string (use: `openssl rand -base64 32`)
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASSWORD`: Your Gmail App Password
   - `TWILIO_ACCOUNT_SID`: Your Twilio SID (optional)
   - `TWILIO_AUTH_TOKEN`: Your Twilio token (optional)
   - `TWILIO_PHONE_NUMBER`: Your Twilio number (optional)

7. Click "Deploy Web Service"
8. Wait for deployment to complete
9. Copy the Render URL (e.g., `https://last-mile-delivery-backend.onrender.com`)

## Step 4: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add Environment Variable:
   - `VITE_API_URL`: Your Render backend URL + `/api`
     - Example: `https://last-mile-delivery-backend.onrender.com/api`

7. Click "Deploy"
8. Wait for deployment to complete
9. Copy the Vercel URL

## Step 5: Test Deployment

1. Open your Vercel URL
2. Register a new user
3. Test login
4. Create an order
5. Check if everything works

## Important Notes

### Gmail App Password Setup
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password in `EMAIL_PASSWORD`

### MongoDB Atlas Connection
- Make sure your cluster is created (takes 5-10 minutes)
- Whitelist `0.0.0.0/0` for development access
- Use the correct connection string format

### Render Free Tier
- Services spin down after 15 minutes of inactivity
- Cold starts take ~30 seconds
- Suitable for development/demo purposes

### Vercel Free Tier
- No spin down
- Instant cold starts
- Perfect for frontend hosting

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check if backend is deployed and running
- Ensure CORS is configured in backend

### MongoDB connection fails
- Verify IP whitelist in Atlas
- Check connection string format
- Ensure database user has correct permissions

## Production Checklist
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] IP whitelist configured (0.0.0.0/0 for dev)
- [ ] JWT_SECRET generated and set
- [ ] Gmail app password generated
- [ ] All environment variables set in Render
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] VITE_API_URL updated with Render URL
- [ ] Full end-to-end testing completed
