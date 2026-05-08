# 🚀 Mailzy Production Launch Guide

Follow these steps to deploy Mailzy from your local machine to a live production environment.

## 1. Supabase Backend Setup (Live)

Your database and Edge Functions need to be synced to the live Supabase cloud.

### A. Apply the Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Create a **New Query**.
4. Copy the entire contents of your local `supabase/schema.sql` file and paste it into the editor.
5. Click **Run**. This will create all tables, indexes, and the atomic queue function.

### B. Set Production Secrets
You must provide your encryption key to the cloud functions. Run these in your terminal:
```bash
npx supabase secrets set SMTP_ENCRYPTION_KEY="your-32-char-key-here"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### C. Deploy Edge Functions
Deploy the `email-worker` to handle your outreach:
```bash
npx supabase functions deploy email-worker
```

---

## 2. Frontend Deployment (Vercel - Recommended)

Vercel is the fastest way to host your Mailzy dashboard with the `vercel.json` security settings I added.

1. Create a free account at [Vercel.com](https://vercel.com).
2. Click **Add New Project** and connect your GitHub/GitLab repository.
3. Vercel will automatically detect **Vite**.
4. **Environment Variables**: Add these in the Vercel dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `VITE_GROQ_API_KEY`: (Optional) If you want a default AI key.
5. Click **Deploy**. Your app will be live at a `.vercel.app` domain (or your custom domain).

---

## 3. Alternative: Docker Deployment (Self-Hosting)

If you prefer to host on a VPS (AWS, DigitalOcean, etc.):

1. Build your Docker image:
   ```bash
   docker build -t mailzy-saas .
   ```
2. Run the container:
   ```bash
   docker run -d -p 80:80 mailzy-saas
   ```
   *The custom `nginx.conf` I created will handle all the routing and security headers automatically.*

---

## 4. Final Launch Checklist
- [ ] **Check Health**: Go to your new live URL and visit the **Analytics** page. You should see the **System Health Monitor** showing 0 Pending (since no emails are queued yet).
- [ ] **Test Connection**: Go to the **Inboxes** page and add a test SMTP account. Click **Verify Connection**.
- [ ] **Start Sending**: Import a test lead CSV and launch a small 5-email campaign.

**You are now live!** Would you like help configuring a custom domain or setting up a Cron job to trigger the email-worker automatically?
