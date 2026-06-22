# VPS Project Migration Guide

Moving a live project (like the Vaibhav Biotech ERP & Ecommerce) from one VPS to another requires a careful sequence to ensure zero data loss and minimal downtime.

Here is the exact step-by-step workflow you should follow:

## Phase 1: Set Up the New VPS
Before touching the old server or the code, the new server must be prepared to host the application.

1. **Provision the Server:** Spin up the new VPS (e.g., Ubuntu 22.04/24.04).
2. **Basic Security:** 
   - Set up SSH keys for secure access.
   - Enable the firewall (UFW) and allow OpenSSH, HTTP, and HTTPS traffic.
3. **Install Core Dependencies:**
   - Install **Node.js** and **npm** (use NVM for easy version management).
   - Install **Git** (if you pull code from a repository).
   - Install **PM2** globally (`npm install -g pm2`) to keep your app running in the background.
   - Install **Nginx** to act as your web server and reverse proxy.

## Phase 2: Handle the Database
*Note: If you use a cloud database like MongoDB Atlas, you can skip to Step 2, but ensure the new VPS IP is whitelisted in Atlas!*

1. **Backup Old DB:** If the database runs directly on the old VPS, export a full dump of the data.
2. **Restore on New DB:** Install the database software on the new VPS and restore the dump you just created.

## Phase 3: Move the Project Files
You have two main ways to get the code onto the new server:

**Option A (Recommended): Git**
- `git clone` your repository directly onto the new VPS.

**Option B: Direct Transfer (SCP / Rsync)**
- Zip your project folder on the old VPS (excluding `node_modules` and `.next`).
- Securely copy it to the new VPS using `scp` or `rsync`.
- Unzip it on the new server.

## Phase 4: Configure and Build
Now that the code is on the new server, we must configure it to run.

1. **Environment Variables:** The `.env` file is usually not in Git. You must manually copy the `.env` file from your old VPS and paste it into the project root on the new VPS.
2. **Install Packages:** Run `npm install` inside the project directory.
3. **Build the Project:** Run `npm run build` to compile the application.

## Phase 5: Start the App and Configure Web Server
1. **Start with PM2:** Start your app in the background so it stays alive: 
   `pm2 start npm --name "vaibhav-biotech" -- start`
   *(Run `pm2 save` and `pm2 startup` so it auto-restarts if the VPS reboots).*
2. **Configure Nginx:** Create an Nginx server block that listens on port 80 and forwards traffic to your app's internal port (e.g., `localhost:3000`).
3. **Test Internally:** Verify the app is running smoothly via the new VPS's IP address.

## Phase 6: DNS Switch & SSL
1. **Update DNS Records:** Go to your domain registrar (e.g., GoDaddy, Hostinger) and change the **A Record** to point to the **new VPS IP address**. 
2. **Wait for Propagation:** This can take a few minutes to a few hours.
3. **Install SSL (HTTPS):** Once the domain points to the new server, use **Certbot (Let's Encrypt)** to automatically secure Nginx with an SSL certificate.

> [!TIP]
> Keep the old VPS running for at least 48 hours after the DNS switch to ensure users whose DNS hasn't updated yet still see a working version of the site!
