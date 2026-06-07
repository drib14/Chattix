# Production Deployment Guide (Vercel & Render)

This guide walks you through deploying the Real-time Chat Application: **Frontend on Vercel** and **Backend on Render**.

---

## 🛠️ Table of Environment Variables

### Backend (Render)

Configure these in your Render Web Service settings under **Environment**:

| Variable Name | Required | Default / Description |
| :--- | :---: | :--- |
| `PORT` | No | `5000` (Render binds automatically) |
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | MongoDB connection string (e.g. MongoDB Atlas) |
| `JWT_SECRET` | Yes | Secure secret key for JWT token signatures |
| `JWT_EXPIRE` | No | `7d` (Token expiration time) |
| `FRONTEND_URL` | Yes | The URL of your deployed Vercel frontend |
| `CLOUDINARY_CLOUD_NAME` | No* | Cloudinary cloud name (required for media/avatar upload) |
| `CLOUDINARY_API_KEY` | No* | Cloudinary API Key (required for media/avatar upload) |
| `CLOUDINARY_API_SECRET` | No* | Cloudinary API Secret (required for media/avatar upload) |
| `EMAIL_USER` | No* | Gmail address (required for OTP verification) |
| `EMAIL_PASS` | No* | Gmail **App Password** (required for OTP verification) |
| `OTP_EXPIRE_MINUTES` | No | `5` (OTP code validity length) |

> \* *Note: Cloudinary and Email credentials are recommended. If not provided, the server will start successfully, but profile avatars, file attachments, and registration/password OTP emails will fail to send.*

### Frontend (Vercel)

Configure these in your Vercel Project under **Environment Variables**:

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | URL to your Render backend API (e.g., `https://your-backend.onrender.com/api`) |
| `VITE_SOCKET_URL` | Yes | URL to your Render backend root (e.g., `https://your-backend.onrender.com`) |

---

## 🚀 Backend Deployment (Render)

Render supports deploying monorepos using its **Blueprint** feature via the root `render.yaml` or through manual creation of a Web Service.

### Option A: Using Render Blueprints (Recommended)
1. Commit and push your code to your repository (GitHub/GitLab).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New** > **Blueprint**.
4. Connect your repository.
5. Render will automatically read the `render.yaml` at the root and pre-configure the Web Service `chattix-chat-backend`.
6. Fill in the missing values for `MONGODB_URI`, `FRONTEND_URL`, and other recommended variables (Cloudinary and Gmail) in the UI.
7. Click **Apply**. Render will build and launch your backend.

### Option B: Manual Web Service Setup
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New** > **Web Service**.
3. Connect your repository.
4. Set the following fields:
   - **Name**: `chattix-chat-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Expand **Advanced** and set:
   - **Health Check Path**: `/health`
6. Add the environment variables listed in the backend table above.
7. Click **Create Web Service**.

---

## ⚡ Frontend Deployment (Vercel)

Since the frontend is built using Vite, it must be deployed as a static Single Page Application (SPA).

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Connect your Git repository.
4. Set the following fields under **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-backend-app.onrender.com`
6. Click **Deploy**.
7. Once deployed, copy your Vercel deployment URL (e.g., `https://your-frontend-app.vercel.app`) and add it to your Render backend environment as `FRONTEND_URL`, then trigger a redeploy of your backend.

---

## 🔒 Third-Party Configurations

### Cloudinary (Media & Avatar Uploads)
1. Create a free account on [Cloudinary](https://cloudinary.com).
2. From the Console Dashboard, copy your **Cloud Name**, **API Key**, and **API Secret**.
3. Add these credentials to the backend environment variables on Render.

### Gmail SMTP (OTP Verification)
1. Go to your [Google Account Settings](https://myaccount.google.com).
2. Under **Security**, enable **2-Step Verification** (required to generate app passwords).
3. Once enabled, search for **App passwords** or go to Security > 2-Step Verification > App passwords.
4. Create a new app password: name it something like `Chat App`.
5. Copy the 16-character password generated (without spaces).
6. Set `EMAIL_USER` to your full Gmail address and `EMAIL_PASS` to the 16-character password on Render.
