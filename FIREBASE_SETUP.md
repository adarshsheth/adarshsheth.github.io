# Firebase Setup for Portfolio Dashboard

This guide sets up Google login for your portfolio dashboard. Only YOUR Google account can log in.

## Step 1: Create Firebase Project (5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project" → name it `adarsh-portfolio` (or anything)
3. Disable Google Analytics (not needed) → Create
4. Wait for it to finish, click Continue

## Step 2: Enable Google Sign-In

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Click **Google** → Enable → Save
5. Add your email as an authorized user (it should already be there as project owner)

## Step 3: Get Your Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps" → click **Web** (`</>`)
3. Register app: nickname `portfolio`, check "Firebase Hosting" (optional)
4. Copy the `firebaseConfig` object — it looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     appId: "1:123:web:abc..."
   };
   ```

## Step 4: Update auth.js

1. Open `js/auth.js` in your repo
2. Replace the `firebaseConfig` placeholder with your actual config
3. Replace `YOUR_GOOGLE_EMAIL@gmail.com` with your actual Gmail address
4. Commit and push

## Step 5: Enable 2-Step Verification (IMPORTANT)

Since your Google account is now the master key to your dashboard:
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Turn on **2-Step Verification** if not already on
3. Consider adding a security key for extra protection

## Step 6: Deploy Cloud Function (for blog drafts)

The blog draft preview needs a Cloud Function (keeps your Notion API key secret).

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. In your repo: `firebase init functions` (choose your project, JavaScript)
4. Copy `functions/index.js` and `functions/package.json` from this zip into the `functions/` folder
5. Set secrets:
   ```
   firebase functions:config:set notion.key="YOUR_NOTION_API_KEY" notion.db="YOUR_DATABASE_ID" auth.email="YOUR_EMAIL@gmail.com"
   ```
   Or using the new secrets manager:
   ```
   firebase functions:secrets:set NOTION_API_KEY
   firebase functions:secrets:set NOTION_DATABASE_ID
   firebase functions:secrets:set AUTHORIZED_EMAIL
   ```
6. Deploy: `firebase deploy --only functions`

## What You Get

- 🔒 **Login button** in navbar (Google sign-in)
- Only YOUR account can log in (others get signed out immediately)
- **APPS** link appears in navbar when logged in
- **Resume**: shows private version (with address/GPA) when logged in, toggle to public
- **Blog**: draft posts appear with orange DRAFT banner when logged in

## Security Notes

- Your Notion API key is ONLY in the Cloud Function (server-side), never in browser JS
- The repo stays public — no secrets in the code
- Firebase config (apiKey, etc.) is safe to be public — it's not a secret, it just identifies your project
- The real security is: (1) only your email can log in, (2) Cloud Function verifies your login
