# TrialFlow Authentication Setup

## ✅ Current Status

The authentication system now has **real Google OAuth** implementation ready for Google Cloud Console setup:

### **Working Features:**
- ✅ **Email/Password Sign-In**: Validates against stored credentials
- ✅ **User Registration**: Creates new accounts with validation
- ✅ **Session Management**: Persistent login across browser sessions
- ✅ **Form Validation**: Proper error handling and input validation
- ✅ **Real Google OAuth**: Ready for Google Cloud Console configuration
- ✅ **Protected Routes**: Only authenticated users can access the main app
- ✅ **Sign-Out**: Clean logout functionality

## 🔧 Google OAuth Setup (Required)

To enable Google OAuth, you need to set up Google Cloud Console:

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret

### 2. Environment Variables
Create a `.env.local` file in your project root:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-actual-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 3. How It Works
1. **User clicks "Continue with Google"**
2. **Redirects to Google OAuth** with your client ID
3. **User authorizes** your app on Google's servers
4. **Google redirects back** to `/auth/google/callback` with authorization code
5. **App exchanges code** for access tokens
6. **App fetches user info** from Google
7. **User is signed in** and redirected to main app

## 🚀 Testing the System

### **Email/Password Authentication:**
1. **Create Account**: 
   - Click "Create Account" 
   - Fill in name, email, password (min 6 chars)
   - Click "Create Account"

2. **Sign In**: 
   - Use the same email/password
   - Click "Sign In"

### **Google OAuth (After Setup):**
1. **Click "Continue with Google"**
2. **Authorize on Google's page**
3. **Get redirected back** to your app
4. **Automatically signed in**

## ⚠️ Current Status

**Google OAuth is configured but needs your Google Cloud Console credentials:**
- The code is ready and will work once you add your client ID/secret
- Without credentials, Google sign-in will show an error
- Email/password authentication works immediately

## 🔒 Security Notes

- Passwords are stored in localStorage (for demo purposes)
- In production, use proper backend authentication
- Google OAuth requires HTTPS in production
- Keep your client secret secure

## 📁 Key Files

- `src/lib/auth-context.tsx` - Authentication logic
- `src/lib/google-oauth.ts` - Google OAuth configuration
- `src/components/SignInPage.tsx` - Sign-in UI
- `src/routes/auth.google.callback.tsx` - Google OAuth callback handler
- `src/routes/index.tsx` - Route protection
- `src/components/TouchFlowApp.tsx` - Main app with user info
