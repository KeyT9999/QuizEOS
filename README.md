<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1nF-D9v3xgYyGqu0d6UaGiXp9DtHzdd7U

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file in the root directory (see `.env.example`)
   - MongoDB connection string is already configured

3. Run the application:
   - **Option 1: Run both frontend and backend together:**
     ```bash
     npm run dev:all
     ```
   - **Option 2: Run separately:**
     - Terminal 1 (Backend):
       ```bash
       npm run dev:server
       ```
     - Terminal 2 (Frontend):
       ```bash
       npm run dev
       ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Features

- ✅ Google Sign In authentication
- ✅ Create, edit, and delete quizzes
- ✅ Play quizzes with instant feedback
- ✅ AI-powered explanations using Gemini (requires user's API key)
- ✅ Quiz attempts tracking and scoring
- ✅ MongoDB database integration
- ✅ Automatic welcome quiz creation for new users

## Deploy to Render (Free Tier)

1. **Prepare the project (already configured)**  
   - `npm run build` bundles the Vite frontend into `dist/`.  
   - `npm start` runs `server/index.js`, which now serves both the API and the files in `dist/`.

2. **Push the code to GitHub**  
   ```bash
   git init
   git remote add origin https://github.com/KeyT9999/QuizEOS.git
   git add .
   git commit -m "feat: prepare project for Render deployment"
   git branch -M main
   git push -u origin main
   ```

3. **Create the Render Web Service**
   - Go to [render.com](https://render.com) → *New* → *Web Service*.  
   - Connect the `QuizEOS` repository.  
   - Build command: `npm install && npm run build`  
   - Start command: `npm start`

4. **Environment variables**
   - `MONGODB_URI` – your MongoDB Atlas connection string.  
   - *(Optional)* `VITE_API_URL` – only needed if you host the API on a different domain. When the frontend and backend share the same Render service, you can leave it unset (defaults to `/api`).

5. **Deploy**
   - Click *Create Web Service*. Render will build the frontend, start the Express server, and expose a single URL (e.g., `https://quiz-eos.onrender.com`).  
   - Share that URL with your users; `/api/*` routes continue to work under the same domain.
