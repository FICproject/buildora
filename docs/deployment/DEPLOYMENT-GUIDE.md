# BUILDORA 60 — Master Production & Staging Deployment Guide

## 1. Overview & Architecture

BUILDORA 60 consists of two primary deployable services:
1. **Frontend**: `@buildora/customer-web` — React 18 + TypeScript + Vite SPA.
2. **Backend**: `@buildora/backend-api` — NestJS modular API running on Node.js.
3. **Database**: MongoDB Atlas Cluster (`cluster0.eucyu5w.mongodb.net/buildora60`).

---

## 2. Pre-Deployment Prerequisite: MongoDB Atlas IP Access

Before deploying the backend to the cloud, configure MongoDB Atlas to accept connections from your cloud servers:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Security $\rightarrow$ Network Access**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Confirm**.
*(Without this, cloud hosting providers like Render, Vercel, Railway, or AWS will have their TLS connections blocked with SSL Alert 80).*

---

## 3. Method 1: Cloud PaaS Deployment (Fastest & Free Tier Available)

### A. Deploy Backend on Render.com
1. Push your code to a GitHub repository (`git push origin main`).
2. Log in to [Render.com](https://render.com/).
3. Click **New + $\rightarrow$ Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `buildora-backend-api`
   - **Environment**: `Node`
   - **Region**: `Singapore` or `Frankfurt` (closest to your users)
   - **Branch**: `master` (or `main`)
   - **Build Command**: `pnpm install && pnpm --filter @buildora/backend-api build`
   - **Start Command**: `node services/backend/api/dist/main.js`
   - **Plan**: `Free`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = `mongodb+srv://ficitproject_db_user:mongodb@cluster0.eucyu5w.mongodb.net/buildora60?retryWrites=true&w=majority`
   - `MONGODB_DATABASE` = `buildora60`
   - `DEFAULT_TENANT_ID` = `tenant-buildora-blr`
   - `JWT_SECRET` = `buildora-60-jwt-production-secret-key-2026`
7. Click **Create Web Service**.
8. Render will deploy your API and give you a public URL (e.g. `https://buildora-backend-api.onrender.com`).

---

### B. Deploy Frontend on Vercel
1. Log in to [Vercel.com](https://vercel.com/).
2. Click **Add New... $\rightarrow$ Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/customer-web`
   - **Build Command**: `pnpm --filter @buildora/customer-web build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://buildora-backend-api.onrender.com/api/v1` (replace with your Render backend URL)
   - `VITE_DEFAULT_TENANT_ID` = `tenant-buildora-blr`
6. Click **Deploy**.
7. Vercel will build and provide a global CDN URL (e.g. `https://buildora.vercel.app`).

---

## 4. Method 2: Docker & Docker Compose (Self-Hosted VPS / AWS EC2 / DigitalOcean)

The repository includes pre-configured Dockerfiles and a root `docker-compose.yml`.

### Step-by-Step Server Setup:
1. Provision an Ubuntu 22.04 / 24.04 LTS server (DigitalOcean Droplet, AWS EC2 t3.small, or Hetzner VPS).
2. Install Docker and Docker Compose on the server:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   ```
3. Clone your repository onto the server:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL> buildora
   cd buildora
   ```
4. Create the `.env` file with production variables:
   ```bash
   cp .env.example .env
   nano .env
   ```
5. Start the full-stack container cluster:
   ```bash
   docker compose up -d --build
   ```
6. Verify containers are healthy:
   ```bash
   docker compose ps
   curl http://localhost:3000/api/health
   ```
7. Your frontend is live on port `80` (HTTP), and the API is live on port `3000`!
8. Add SSL via Let's Encrypt / Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 5. Method 3: Render Blueprint (1-Click Deploy)

Because this repository includes a root `render.yaml`, you can deploy both backend and frontend together with a single click:
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **Blueprints $\rightarrow$ New Blueprint Instance**.
3. Select your repository.
4. Render will automatically read `render.yaml` and provision both the `buildora-backend-api` and `buildora-customer-web` services!

---

## 6. Post-Deployment Verification

Once deployed, run these curl checks against your production URL:
```bash
# 1. Health & Database Check
curl https://<YOUR_BACKEND_URL>/api/health

# 2. Product Catalog Check
curl https://<YOUR_BACKEND_URL>/api/v1/products

# 3. Frontend Check
curl -I https://<YOUR_FRONTEND_URL>
```
Both should return `HTTP 200 OK`.
