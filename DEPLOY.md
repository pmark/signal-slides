# Local Deployment Guide (macOS)

Follow these steps to build and run this application locally on your Mac or deploy it to a production environment.

## 1. Prerequisites
- **Node.js**: Install the LTS version from [nodejs.org](https://nodejs.org/).
- **Terminal**: Use the default Terminal app or iTerm2.

## 2. Get the Code
- Use the **Settings > Export to ZIP** menu in AI Studio to download the project.
- Unzip the file and open the folder in your terminal:
  ```bash
  cd path/to/exported-folder
  ```

## 3. Install Dependencies
Install the required npm packages:
```bash
npm install
```

## 4. Configure Environment Variables
Since you deleted `firebase-applet-config.json` for security, you MUST configure environment variables for the app to function.

1. Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```
2. Open `.env` in a text editor and add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_database_id (usually '(default)')
   
   # Optional: If you use the Gemini features locally
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

## 5. Build the Application
Create a production-ready build:
```bash
npm run build
```
This will generate a `dist/` folder containing the static assets.

## 6. Run Locally for Testing
You can serve the production build locally to verify it:
```bash
npx serve -s dist
```

## 7. Production Deployment (Firebase Hosting)
Since this project is already using Firebase, the easiest way to deploy is using the built-in script:

1. **Login**: `npx firebase login`
2. **Initialize** (if first time): `npx firebase init hosting` (Set `dist` as the public directory).
3. **Deploy**:
   ```bash
   npm run deploy
   ```

Alternatively, you can deploy the `dist/` folder to other providers like Vercel or Netlify.

---

**Note**: Remember to allowlist your local and production domains in the **Firebase Console > Authentication > Settings > Authorized Domains** section.
